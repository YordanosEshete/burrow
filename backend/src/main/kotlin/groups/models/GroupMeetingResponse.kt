package app.burrow.groups.models

import app.burrow.groups.membership.Membership
import kotlinx.serialization.Serializable

/**
 * A response to requesting a group meeting. This includes the requesting user's membership status,
 * which will dictate whether they should have a join / leave button.
 *
 * @param meeting The meeting.
 * @param membership The requesting user's membership to [meeting]. If this is guest request (only
 *   possible on requesting a SINGLE group), then this will be null.
 * @param bookmarked If the user requesting has this bookmarked. If this is a guest request, it will
 *   be false.
 */
@Serializable
data class GroupMeetingResponse(
    val meeting: GroupMeeting,
    val membership: Membership?,
    val bookmarked: Boolean,
)
