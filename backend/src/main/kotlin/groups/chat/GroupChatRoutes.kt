package app.burrow.groups.chat

import app.burrow.account.VERIFIER
import app.burrow.groups.chat.models.Action
import app.burrow.groups.chat.models.Incoming
import app.burrow.groups.chat.models.Outgoing
import app.burrow.groups.membership.userInMeeting
import app.burrow.groups.models.MeetingRole
import app.burrow.groups.models.getMeetingResponse
import io.ktor.http.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.server.websocket.*
import io.ktor.websocket.*
import java.util.*
import kotlinx.coroutines.channels.consumeEach
import kotlinx.serialization.json.Json

/** Handle an incoming request. */
suspend fun WebSocketServerSession.handleIncomingRequest(
    action: Incoming,
    data: HashMap<String, String>,
    id: String,
    userId: String,
) {
    when (action) {
        // create a message
        Incoming.CREATE_MESSAGE -> wsCreateMessage(data, userId, id)

        // delete a message
        Incoming.DELETE_MESSAGE -> wsDeleteMessage(data, id, userId)

        // edit a message
        Incoming.EDIT_MESSAGE -> wsEditMessage(data, id, userId)

        // receive past messages
        Incoming.RECEIVE_HISTORY -> wsReceiveHistory(data, id)

        // invalid action (authorize)
        else -> {}
    }
}

/**
 * Receive history.
 *
 * @param data Websocket data attributes.
 * @param id The ID of the meeting.
 */
private suspend fun WebSocketServerSession.wsReceiveHistory(
    data: HashMap<String, String>,
    id: String,
) {
    val page = data["page"]?.toLongOrNull() ?: 0

    val chatHistory = getChatHistory(id, page)
    sendAction(Outgoing.HISTORY, chatHistory)
}

/**
 * Edit a message.
 *
 * @param data Websocket data attributes.
 * @param id The ID of the meeting.
 * @param userId The ID of the authorized user.
 */
private suspend fun WebSocketServerSession.wsEditMessage(
    data: HashMap<String, String>,
    id: String,
    userId: String,
) {
    val messageId = data["id"]?.let { runCatching { UUID.fromString(it) }.getOrNull() }
    val newContents = data["contents"]

    if (messageId == null || newContents == null) {
        sendAction(Outgoing.ERROR, "Invalid arguments.")
        return
    }

    if (!validateChatMessage(newContents)) {
        sendAction(Outgoing.ERROR, "Invalid message.")
        return
    }

    val meeting = getMeetingResponse(id, userId)
    val message = getChatMessage(id, messageId)

    if (meeting == null || message == null || meeting.membership == null) {
        sendAction(Outgoing.ERROR, "Invalid message ID.")
        return
    }

    if (message.userId != userId) {
        sendAction(Outgoing.ERROR, "You do not have permission to edit this message.")
        return
    }

    editChatMessage(id, messageId, newContents)
}

/**
 * Delete a message.
 *
 * @param data Websocket data attributes.
 * @param id The ID of the meeting.
 * @param userId The ID of the authorized user.
 */
private suspend fun WebSocketServerSession.wsDeleteMessage(
    data: HashMap<String, String>,
    id: String,
    userId: String,
) {
    val messageId = data["id"]?.let { runCatching { UUID.fromString(it) }.getOrNull() }

    if (messageId == null) {
        sendAction(Outgoing.ERROR, "Invalid message ID.")
        return
    }

    val meeting = getMeetingResponse(id, userId)
    val message = getChatMessage(id, messageId)

    if (meeting == null || message == null || meeting.membership == null) {
        sendAction(Outgoing.ERROR, "Invalid message ID.")
        return
    }

    val isModerator =
        meeting.membership.role == MeetingRole.HOST ||
            meeting.membership.role == MeetingRole.MODERATOR
    val isMessageOwner = message.userId == userId

    if (!isModerator && !isMessageOwner) {
        sendAction(Outgoing.ERROR, "You do not have permission to delete this message.")
        return
    }

    deleteChatMessage(id, messageId)
}

/**
 * Create a message.
 *
 * @param data Websocket data attributes.
 * @param id The ID of the meeting.
 * @param userId The ID of the authorized user.
 */
private suspend fun WebSocketServerSession.wsCreateMessage(
    data: HashMap<String, String>,
    userId: String,
    id: String,
) {
    val message = data["message"]

    if (message == null || !validateChatMessage(message)) {
        sendAction(Outgoing.ERROR, "Invalid message.")
        return
    }

    createChatMessage(userId, id, message)
}

val GROUP_CHAT_ROUTES: Route.() -> Unit = {
    webSocket("/chat") {
        val id = call.parameters["id"] ?: return@webSocket call.respond(HttpStatusCode.BadRequest)
        var userId: String? = null

        try {
            incoming.consumeEach { frame ->
                if (frame is Frame.Text) {
                    val text = frame.readText()

                    // receive incoming data
                    val incomingMsg =
                        runCatching { Json.decodeFromString<HashMap<String, String>>(text) }
                            .getOrNull()

                    if (incomingMsg != null) {
                        // the action being performed by the user.
                        val action =
                            incomingMsg["action"]
                                ?.uppercase()
                                ?.runCatching { Incoming.valueOf(this) }
                                ?.getOrNull()

                        if (action == null || (action != Incoming.AUTHORIZE && userId == null)) {
                            sendAction(Outgoing.ERROR, "You are not authorized.")
                        } else if (action == Incoming.AUTHORIZE) {
                            val token = incomingMsg["token"]
                            val authorizedUserId =
                                runCatching { VERIFIER.verify(token) }.getOrNull()?.subject

                            if (authorizedUserId == null) {
                                sendAction(Outgoing.ERROR, "Invalid token.")
                            } else {
                                userId = authorizedUserId

                                if (!userInMeeting(userId, id)) {
                                    sendAction(Outgoing.ERROR, "You are not in this meeting!")
                                    return@consumeEach
                                }

                                ChatSessions.join(
                                    id,
                                    ChatSessions.Session(
                                        authorizedUserId,
                                        this,
                                        System.currentTimeMillis(),
                                    ),
                                )

                                // gives the joining user the current members
                                // lets the existing users see the user who just joined
                                ChatSessions.broadcast(
                                    id,
                                    Action(Outgoing.MEMBERS, getChatMembers(id)),
                                )

                                val chatHistory = getChatHistory(id, 0)
                                sendAction(Outgoing.HISTORY, chatHistory)
                            }
                        } else if (userId != null) {
                            handleIncomingRequest(action, incomingMsg, id, userId)
                        }
                    }
                }
            }
        } finally {
            val joinedUserId = userId

            // if the user never actually authorized, this isn't run
            if (joinedUserId != null) {
                ChatSessions.leave(id, joinedUserId)
            }
        }
    }
}
