package app.burrow.groups.chat

import app.burrow.account.Users
import app.burrow.groups.chat.models.Action
import app.burrow.groups.chat.models.ActionType
import app.burrow.groups.chat.models.ChatMessage
import app.burrow.groups.chat.models.Outgoing
import app.burrow.groups.membership.Memberships
import app.burrow.query
import io.ktor.server.websocket.WebSocketServerSession
import io.ktor.util.date.getTimeMillis
import io.ktor.websocket.Frame
import java.util.UUID
import kotlin.collections.toList
import kotlin.reflect.typeOf
import kotlinx.serialization.Serializable
import kotlinx.serialization.Serializer
import kotlinx.serialization.json.Json
import kotlinx.serialization.serializer
import org.jetbrains.exposed.sql.SortOrder
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.deleteWhere
import org.jetbrains.exposed.sql.innerJoin
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.selectAll
import org.jetbrains.exposed.sql.update

// constant values for chat messages
private const val MESSAGE_MAX_LENGTH = 512
private const val MESSAGE_MIN_LENGTH = 1

/**
 * Validate a message to ensure it's appropriate for Burrow.
 *
 * This includes swear filtering & length checking.
 */
fun validateChatMessage(message: String): Boolean {
    // TODO swear checks n stuff

    return message.length in MESSAGE_MIN_LENGTH..MESSAGE_MAX_LENGTH
}

/**
 * Send an error to a websocket session.
 *
 * @param type The type of action.
 * @param payload The payload.
 */
suspend inline fun <reified K : ActionType, reified T> WebSocketServerSession.sendAction(
    type: K,
    payload: T,
) {
    val action = Action(type, payload)
    val data = Json.encodeToString(serializer(typeOf<Action<K, T>>()), action)

    send(Frame.Text(data))
}

/**
 * Send an error to a websocket session.
 *
 * @param message The error string.
 * @see Outgoing.ERROR
 */
suspend fun WebSocketServerSession.sendError(message: String) {
    sendAction(Outgoing.ERROR, message)
}

/**
 * A segment of chat history in a meeting.
 *
 * @param page The page of chats.
 * @param pageCount The amount of pages in the history.
 * @param messages The page of messages.
 */
@Serializable
data class ChatHistory(val page: Long, val pageCount: Long, val messages: List<ChatMessage>) {
    companion object {
        /** The amount of messages seen per page. */
        const val CHAT_PAGE_LIMIT = 50
    }
}

/**
 * Get the chat history for a meeting.
 *
 * @param meetingId The ID of the meeting.
 * @param page Which page of messages to retrieve.
 * @see ChatHistory.CHAT_PAGE_LIMIT
 */
suspend fun getChatHistory(meetingId: String, page: Long): ChatHistory {
    val (messages, pageCount) =
        query {
            val messages =
                ChatMessages.selectAll()
                    .where { ChatMessages.meetingId eq meetingId }
                    .orderBy(ChatMessages.date, SortOrder.DESC)
                    .offset(page * ChatHistory.CHAT_PAGE_LIMIT)
                    .limit(ChatHistory.CHAT_PAGE_LIMIT)
                    .toList()
                    .map { row -> ChatMessage.fromRow(row) }

            val pageCount =
                ChatMessages.selectAll()
                    .where { ChatMessages.meetingId eq meetingId }
                    .count()
                    .div(ChatHistory.CHAT_PAGE_LIMIT)

            messages to pageCount
        }

    return ChatHistory(page, pageCount, messages)
}

@Serializable data class ChatMember(val userId: String, val name: String)

/**
 * Get all chat members from a meeting.
 *
 * @param meetingId The ID of the meeting to get the members from.
 */
suspend fun getChatMembers(meetingId: String): List<ChatMember> {
    val members = query {
        Memberships.innerJoin(Users, { Memberships.userId }, { Users.googleID })
            .select(Memberships.userId, Users.name)
            .where { Memberships.meetingId eq meetingId }
            .map { member -> ChatMember(member[Memberships.userId], member[Users.name]) }
    }

    return members
}

/**
 * Create a chat message in a meeting.
 *
 * @param userId The user creating the chat message.
 * @param meetingId The ID of the meeting.
 * @param message The message.
 */
suspend fun createChatMessage(userId: String, meetingId: String, message: String) {
    val time = getTimeMillis()
    val messageId = UUID.randomUUID()

    // create message
    query {
        ChatMessages.insert {
            it[ChatMessages.messageId] = messageId
            it[ChatMessages.message] = message
            it[ChatMessages.userId] = userId
            it[ChatMessages.meetingId] = meetingId
            it[ChatMessages.date] = time
        }
    }

    ChatSessions.broadcast(
        meetingId,
        Action(
            action = Outgoing.NEW_MESSAGE,
            payload =
                ChatMessage(
                    messageId = messageId,
                    meetingId = meetingId,
                    userId = userId,
                    message = message,
                    date = time,
                ),
        ),
    )
}

/** @see deleteChatMessage */
@Serializable
data class DeletedMessage(
    @Serializable(with = ChatMessage.Companion.UUIDSerializer::class) val messageId: UUID
)

/**
 * Delete a chat message in a meeting.
 *
 * @param meetingId The ID of the meeting.
 * @param messageId The Id of the message to delete.
 */
suspend fun deleteChatMessage(meetingId: String, messageId: UUID) {
    query {
        ChatMessages.deleteWhere {
            (ChatMessages.meetingId eq meetingId) and (ChatMessages.messageId eq messageId)
        }
    }

    ChatSessions.broadcast(
        meetingId,
        Action(action = Outgoing.MESSAGE_DELETED, payload = DeletedMessage(messageId)),
    )
}

/** @see editChatMessage */
@Serializable
data class EditedMessage(
    @Serializable(with = ChatMessage.Companion.UUIDSerializer::class) val messageId: UUID,
    val newMessage: String,
)

/**
 * Edit a message into a new message.
 *
 * @param meetingId The meeting that the message is in.
 * @param messageId The message to update.
 * @param newMessage The new contents for the message.
 */
suspend fun editChatMessage(meetingId: String, messageId: UUID, newMessage: String) {
    query {
        ChatMessages.update({
            (ChatMessages.meetingId eq meetingId) and (ChatMessages.messageId eq messageId)
        }) {
            it[message] = newMessage
        }
    }

    ChatSessions.broadcast(
        meetingId,
        Action(action = Outgoing.MESSAGE_UPDATED, payload = EditedMessage(messageId, newMessage)),
    )
}

/**
 * Get a chat message from a meeting.
 *
 * @param meetingId The ID of the meeting.
 * @param messageId The ID of the message within the meeting.
 */
suspend fun getChatMessage(meetingId: String, messageId: UUID): ChatMessage? = query {
    ChatMessages.selectAll()
        .where { (ChatMessages.meetingId eq meetingId) and (ChatMessages.messageId eq messageId) }
        .map { ChatMessage.fromRow(it) }
        .firstOrNull()
}
