package app.burrow.groups.models

import app.burrow.groups.Meetings
import app.burrow.groups.bookmarks.Bookmark
import app.burrow.groups.bookmarks.Bookmarks
import app.burrow.groups.membership.Membership
import app.burrow.groups.membership.Memberships
import app.burrow.query
import io.ktor.util.date.getTimeMillis
import java.util.UUID
import kotlin.and
import kotlin.or
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import org.jetbrains.exposed.sql.Op
import org.jetbrains.exposed.sql.ResultRow
import org.jetbrains.exposed.sql.SortOrder
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.SqlExpressionBuilder.greaterEq
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.deleteWhere
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.or
import org.jetbrains.exposed.sql.selectAll

/**
 * A group meeting.
 *
 * @param id The unique ID of this meeting.
 * @param owner The owner of the group.
 * @param title The title of the meeting.
 * @param description The description, or contents, of the meeting.
 * @param location The location of the meeting.
 * @param kind The kind of group.
 * @param beginningTime The time the meeting begins.
 * @param endTime The time the meeting ends.
 * @param tags The tags for the group.
 * @param capacity The maximum amount of people able to be in the meeting.
 * @param joined The amount of students in the meeting.
 * @param waiting The amount of students on the waitlist.
 */
@Serializable
data class GroupMeeting(
    val id: String,
    val owner: String,
    val title: String,
    val description: String,
    val location: String,
    val kind: GroupType,
    val beginningTime: Long,
    val endTime: Long,
    val tags: Set<String>,
    val creationDate: Long,
    val capacity: Int,
    val joined: Int,
    val waiting: Int,
) {
    companion object {
        /**
         * Form a [GroupMeeting] from a [ResultRow].
         *
         * @param row A [ResultRow] containing details on a [GroupMeeting]
         */
        fun fromRow(row: ResultRow): GroupMeeting =
            GroupMeeting(
                id = row[Meetings.id],
                owner = row[Meetings.owner],
                title = row[Meetings.title],
                description = row[Meetings.description],
                location = row[Meetings.location],
                kind = row[Meetings.kind],
                creationDate = row[Meetings.creationDate],
                endTime = row[Meetings.endTime],
                beginningTime = row[Meetings.beginningTime],
                capacity = row[Meetings.capacity],
                joined = row[Meetings.joined],
                waiting = row[Meetings.waiting],
                tags = Json.decodeFromString<Set<String>>(row[Meetings.tags]),
            )
    }
}

/**
 * Create a group meeting.
 *
 * @param id The ID of the owner.
 * @param meeting The submitted details.
 */
suspend fun createGroupMeeting(id: String, meeting: SubmittedGroupMeeting): GroupMeeting {
    val groupMeeting =
        GroupMeeting(
            id = UUID.randomUUID().toString().replace("-", "").take(8),
            owner = id,
            title = meeting.title,
            description = meeting.description,
            location = meeting.location,
            kind = meeting.kind,
            beginningTime = meeting.beginningTime,
            endTime = meeting.endTime,
            tags = meeting.tags,
            creationDate = getTimeMillis(),
            capacity = meeting.capacity,
            waiting = 0,
            joined = 0,
        )

    query {
        Meetings.insert {
            it[Meetings.id] = groupMeeting.id
            it[owner] = groupMeeting.owner
            it[title] = groupMeeting.title
            it[description] = groupMeeting.description
            it[location] = groupMeeting.location
            it[kind] = groupMeeting.kind
            it[beginningTime] = groupMeeting.beginningTime
            it[endTime] = groupMeeting.endTime
            it[tags] = Json.encodeToString(groupMeeting.tags)
            it[creationDate] = groupMeeting.creationDate
            it[capacity] = groupMeeting.capacity
            it[joined] = groupMeeting.joined
            it[waiting] = groupMeeting.waiting
        }

        Memberships.insert {
            it[Memberships.meetingId] = groupMeeting.id
            it[Memberships.userId] = groupMeeting.owner
            it[Memberships.role] = MeetingRole.HOST
            it[Memberships.status] = MeetingMemberStatus.JOINED
            it[Memberships.joinedAt] = getTimeMillis()
        }
    }

    return groupMeeting
}

/**
 * Get a meeting by its ID.
 *
 * @param id The ID of the meeting.
 * @param user The ID of the user requesting, to combine the membership information.
 */
suspend fun getMeeting(id: String, user: String): GroupMeetingResponse? {
    val meeting =
        query { Meetings.selectAll().where { Meetings.id eq id }.firstOrNull() } ?: return null

    val membership =
        query {
                Memberships.selectAll()
                    .where { (Memberships.meetingId eq id) and (Memberships.userId eq user) }
                    .firstOrNull()
            }
            ?.let { Membership.fromRow(it) }

    val bookmark =
        query {
            Bookmarks.selectAll()
                .where { (Bookmarks.meetingId eq id) and (Bookmarks.userId eq user) }
                .firstOrNull()
        } != null

    return GroupMeetingResponse(GroupMeeting.fromRow(meeting), membership, bookmark)
}

/**
 * Delete a meeting by its ID.
 *
 * @param id The ID of the meeting to delete.
 */
suspend fun deleteMeeting(id: String) = query { Meetings.deleteWhere { Meetings.id eq id } }

/**
 * Retrieve all [GroupMeeting]s.
 *
 * @param user The requesting user. This allows for the [app.burrow.groups.membership.Membership] to
 *   be present in the response. If this is not present, it will be treated as a guest user.
 * @param type The type of group. Leave null for all.
 */
suspend fun getMeetings(user: String? = null, type: GroupType? = null): List<GroupMeetingResponse> {
    val meetings: List<GroupMeeting> = query {
        var expr: Op<Boolean> = (Meetings.endTime greaterEq getTimeMillis())

        if (type != null) {
            expr = (expr) and (Meetings.kind eq type)
        }

        Meetings.selectAll().where(expr).orderBy(Meetings.beginningTime, SortOrder.ASC).map { row ->
            GroupMeeting.fromRow(row)
        }
    }

    // guest user
    if (user == null || user.isBlank()) {
        return meetings.map { meeting ->
            GroupMeetingResponse(meeting = meeting, membership = null, bookmarked = false)
        }
    }

    val membershipByMeetingId: Map<String, Membership> = query {
        val ids = meetings.map { it.id }

        if (ids.isEmpty()) return@query emptyMap()

        Memberships.selectAll()
            .where { (Memberships.userId eq user) and (Memberships.meetingId inList ids) }
            .associate { row -> row[Memberships.meetingId] to Membership.fromRow(row) }
    }

    val bookmarksByMeetingId: Map<String, Bookmark> = query {
        val ids = meetings.map { it.id }

        if (ids.isEmpty()) return@query emptyMap()

        Bookmarks.selectAll()
            .where { (Bookmarks.userId eq user) and (Bookmarks.meetingId inList ids) }
            .associate { row -> row[Bookmarks.meetingId] to Bookmark.fromRow(row) }
    }

    return meetings.map { meeting ->
        GroupMeetingResponse(
            meeting = meeting,
            membership = membershipByMeetingId[meeting.id],
            bookmarked = bookmarksByMeetingId.containsKey(meeting.id),
        )
    }
}

/**
 * Search through all group meetings.
 *
 * @param query The search query. This will search through tags, title, description, location, etc..
 */
suspend fun searchMeetings(search: String): List<GroupMeetingResponse> {
    val term = search.trim()
    if (term.isBlank()) return emptyList()

    val pattern = "%" + term.replace("%", "\\%").replace("_", "\\_") + "%"

    val meetings: List<GroupMeeting> = query {
        Meetings.selectAll()
            .where {
                (Meetings.endTime greaterEq getTimeMillis()) and
                    ((Meetings.title like pattern) or
                        (Meetings.description like pattern) or
                        (Meetings.location like pattern) or
                        (Meetings.tags like pattern))
            }
            .orderBy(Meetings.beginningTime, SortOrder.ASC)
            .map { row -> GroupMeeting.fromRow(row) }
    }

    return meetings.map { meeting ->
        GroupMeetingResponse(meeting = meeting, membership = null, bookmarked = false)
    }
}
