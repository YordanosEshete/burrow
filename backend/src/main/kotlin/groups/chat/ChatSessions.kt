package app.burrow.groups.chat

import app.burrow.groups.chat.models.Action
import app.burrow.groups.chat.models.ChatMessage
import app.burrow.groups.chat.models.Outgoing
import io.ktor.server.websocket.WebSocketServerSession
import io.ktor.websocket.Frame
import java.util.concurrent.ConcurrentHashMap
import kotlin.collections.orEmpty
import kotlin.collections.toList
import kotlin.reflect.typeOf
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.serialization.json.Json
import kotlinx.serialization.serializer

/** Handles chat sessions within various meetings. */
object ChatSessions {
    /**
     * An individual user's chat session.
     *
     * @param userID The user in the session.
     * @param session The actual websocket.
     * @param joinedAt When the user initially connected.
     */
    data class Session(val userID: String, val session: WebSocketServerSession, val joinedAt: Long)

    /**
     * Individual chat rooms.
     *
     * Key: The ID of the meeting. Value: all of the people in the meeting :o
     */
    val rooms: ConcurrentHashMap<String, MutableSet<Session>> = ConcurrentHashMap()
    private val guard = Mutex()

    /**
     * Have a [session] join a [meetingId].
     *
     * @param meetingId The meeting to join.
     * @param session The session that's joining.
     */
    suspend fun join(meetingId: String, session: Session) {
        guard.withLock {
            val set = rooms.getOrPut(meetingId) { mutableSetOf() }
            set.add(session)
        }
    }

    /**
     * Have a [userId] leave a [meetingId].
     *
     * @param meetingId The meeting to leave.
     * @param userId The user who's leaving.
     */
    suspend fun leave(meetingId: String, userId: String) {
        guard.withLock {
            rooms[meetingId]?.removeIf { (chatUserID) -> chatUserID == userId }

            if (rooms[meetingId]?.isEmpty() == true) rooms.remove(meetingId)
        }
    }

    /**
     * Send a [ChatMessage] to a [meetingId].
     *
     * @param meetingId The meeting to change.
     * @param payload The message to broadcast.
     */
    suspend inline fun <reified T> broadcast(meetingId: String, payload: Action<Outgoing, T>) {
        val targets = rooms[meetingId]?.toList().orEmpty()
        val payloadStr = Json.encodeToString(serializer(typeOf<Action<Outgoing, T>>()), payload)

        for (session in targets) {
            runCatching { session.session.send(Frame.Text(payloadStr)) }
        }
    }
}
