package app.burrow.groups.chat

import app.burrow.account.Users
import app.burrow.groups.Meetings
import org.jetbrains.exposed.sql.ReferenceOption
import org.jetbrains.exposed.sql.Table

/**
 * Stored chat messages
 */
object ChatMessages : Table("chat_messages") {
    val messageId = uuid("message_id").uniqueIndex()
    val meetingId = reference("meeting_id", Meetings.id, onDelete = ReferenceOption.CASCADE)
    val userId = reference("user_id", Users.googleID, onDelete = ReferenceOption.CASCADE)
    val date = long("date")
    val message = varchar("message", length = 256)
}