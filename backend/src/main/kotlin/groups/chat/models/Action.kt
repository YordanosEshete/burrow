package app.burrow.groups.chat.models

import kotlinx.serialization.Serializable

/**
 * An action that occurs within a chat session.
 *
 * @param action The action, whether it be by the client or the server.
 * @param payload The payload of the action.
 */
@Serializable data class Action<K : ActionType, T>(val action: K, val payload: T)

/**
 * The type of action.
 *
 * @see Incoming
 * @see Outgoing
 */
sealed interface ActionType

/** Actions from the client. */
enum class Incoming : ActionType {
    CREATE_MESSAGE,
    DELETE_MESSAGE,
    EDIT_MESSAGE,
    RECEIVE_HISTORY,
    AUTHORIZE,
}

/** Actions from the server. */
enum class Outgoing : ActionType {
    INFO,
    ERROR,
    NEW_MESSAGE,
    MESSAGE_DELETED,
    MESSAGE_UPDATED,
    HISTORY,
    MEMBERS,
}
