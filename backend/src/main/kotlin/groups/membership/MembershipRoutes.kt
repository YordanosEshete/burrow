package app.burrow.groups.membership

import app.burrow.groups.models.MeetingMemberStatus
import io.ktor.http.HttpStatusCode
import io.ktor.server.auth.jwt.JWTPrincipal
import io.ktor.server.auth.principal
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import io.ktor.server.routing.post

/** Routes relating to a user's membership. */
fun Route.membershipRoutes() {
    // GET /groups/{id}/attendees
    // get all attendees for this group
    get("/attendees") {
        val user =
            call.principal<JWTPrincipal>()?.subject
                ?: return@get call.respond(HttpStatusCode.Forbidden)
        val id = call.parameters["id"] ?: return@get call.respond(HttpStatusCode.BadRequest)

        val attendees = getAttendees(id)

        // must be in the group to see the members!
        val inGroup =
            attendees.any { (membership) ->
                membership.userId == user && membership.status != MeetingMemberStatus.JOINED
            }

        if (inGroup) {
            return@get call.respond(HttpStatusCode.Forbidden)
        }

        call.respond(getAttendees(id))
    }

    // POST /groups/{id}/join
    // joins a meeting
    post("/join") {
        val user =
            call.principal<JWTPrincipal>()?.subject
                ?: return@post call.respond(HttpStatusCode.Forbidden)
        val id = call.parameters["id"] ?: return@post call.respond(HttpStatusCode.BadRequest)

        joinMeeting(user, id)

        call.respond(HttpStatusCode.OK)
    }

    // POST /groups/{id}/leave
    // leaves a meeting
    post("/leave") {
        val user =
            call.principal<JWTPrincipal>()?.subject
                ?: return@post call.respond(HttpStatusCode.Forbidden)
        val id = call.parameters["id"] ?: return@post call.respond(HttpStatusCode.BadRequest)

        leaveMeeting(user, id)

        call.respond(HttpStatusCode.OK)
    }
}
