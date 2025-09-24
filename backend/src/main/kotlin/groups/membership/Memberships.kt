package app.burrow.groups.membership

import app.burrow.account.Users
import app.burrow.groups.Meetings
import app.burrow.groups.models.MeetingMemberStatus
import app.burrow.groups.models.MeetingRole
import org.jetbrains.exposed.sql.ReferenceOption
import org.jetbrains.exposed.sql.Table

object Memberships : Table("memberships") {
    val meetingId = reference("meeting_id", Meetings.id, onDelete = ReferenceOption.CASCADE)
    val userId = reference("user_id", Users.googleID, onDelete = ReferenceOption.CASCADE)

    val role =
        enumerationByName("role", 32, MeetingRole::class)
            .default(MeetingRole.MEMBER)

    val status =
        enumerationByName("status", 16, MeetingMemberStatus::class)
            .default(MeetingMemberStatus.JOINED)

    val joinedAt = long("joined_at")
    val leftAt = long("left_at").nullable()

    override val primaryKey = PrimaryKey(meetingId, userId, name = "pk_membership")
}