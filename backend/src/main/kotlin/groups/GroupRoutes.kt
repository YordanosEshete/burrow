package app.burrow.groups

import app.burrow.groups.bookmarks.createBookmark
import app.burrow.groups.bookmarks.deleteBookmark
import app.burrow.groups.chat.GROUP_CHAT_ROUTES
import app.burrow.groups.membership.getAttendees
import app.burrow.groups.membership.getUserMeetings
import app.burrow.groups.membership.joinMeeting
import app.burrow.groups.membership.leaveMeeting
import app.burrow.groups.models.GroupType
import app.burrow.groups.models.MeetingMemberStatus
import app.burrow.groups.models.SubmittedGroupMeeting
import app.burrow.groups.models.createGroupMeeting
import app.burrow.groups.models.deleteMeeting
import app.burrow.groups.models.getMeeting
import app.burrow.groups.models.getMeetings
import app.burrow.groups.models.searchMeetings
import app.burrow.groups.models.validateSubmittedGroupMeeting
import io.ktor.http.HttpStatusCode
import io.ktor.server.auth.jwt.JWTPrincipal
import io.ktor.server.auth.principal
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.delete
import io.ktor.server.routing.get
import io.ktor.server.routing.post
import io.ktor.server.routing.put
import io.ktor.server.routing.route

/**
 * All routes relating to [app.burrow.groups.models.GroupMeeting]s.
 *
 * All routes are inherently authorized.
 */
val GROUP_ROUTES: Route.() -> Unit = {
    /**
     * Retrieve all [app.burrow.groups.models.GroupMeeting] by it's
     * [app.burrow.groups.models.GroupType].
     */
    get {
        val user =
            call.principal<JWTPrincipal>()?.subject
                ?: return@get call.respond(HttpStatusCode.Forbidden)
        val type =
            call.request.queryParameters["type"]
                ?.runCatching { GroupType.valueOf(uppercase()) }
                ?.getOrNull()

        call.respond(getMeetings(user, type))
    }

    // get the three most recent
    get("/schedule") {
        val user =
            call.principal<JWTPrincipal>()?.subject
                ?: return@get call.respond(HttpStatusCode.Forbidden)

        call.respond(getUserMeetings(user))
    }

    // search among the stars
    get("/search") {
        call.principal<JWTPrincipal>()?.subject ?: return@get call.respond(HttpStatusCode.Forbidden)

        val searchQuery =
            call.request.queryParameters["query"]
                ?: return@get call.respond(HttpStatusCode.BadRequest)

        call.respond(searchMeetings(searchQuery))
    }

    /** Manage an individual meeting. */
    route("/{id}") {
        /** Receive a [app.burrow.groups.models.GroupMeeting] by its ID. */
        get {
            val user =
                call.principal<JWTPrincipal>()?.subject
                    ?: return@get call.respond(HttpStatusCode.Forbidden)
            val id = call.parameters["id"] ?: return@get call.respond(HttpStatusCode.BadRequest)

            val meeting = getMeeting(id, user) ?: return@get call.respond(HttpStatusCode.NotFound)

            call.respond(meeting)
        }

        delete {
            val user =
                call.principal<JWTPrincipal>()?.subject
                    ?: return@delete call.respond(HttpStatusCode.Forbidden)
            val id = call.parameters["id"] ?: return@delete call.respond(HttpStatusCode.BadRequest)

            val meeting =
                getMeeting(id, user) ?: return@delete call.respond(HttpStatusCode.NotFound)

            if (meeting.meeting.owner != user) {
                return@delete call.respond(HttpStatusCode.Forbidden)
            }

            deleteMeeting(id)

            call.respond(HttpStatusCode.OK)
        }

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

        /** Join a meeting. */
        post("/join") {
            val user =
                call.principal<JWTPrincipal>()?.subject
                    ?: return@post call.respond(HttpStatusCode.Forbidden)
            val id = call.parameters["id"] ?: return@post call.respond(HttpStatusCode.BadRequest)

            joinMeeting(user, id)

            call.respond(HttpStatusCode.OK)
        }

        /** Leave a meeting. */
        post("/leave") {
            val user =
                call.principal<JWTPrincipal>()?.subject
                    ?: return@post call.respond(HttpStatusCode.Forbidden)
            val id = call.parameters["id"] ?: return@post call.respond(HttpStatusCode.BadRequest)

            leaveMeeting(user, id)

            call.respond(HttpStatusCode.OK)
        }

        /** Manage bookmarks on a meeting. */
        route("/bookmark") {
            put {
                val user =
                    call.principal<JWTPrincipal>()?.subject
                        ?: return@put call.respond(HttpStatusCode.Forbidden)
                val id = call.parameters["id"] ?: return@put call.respond(HttpStatusCode.BadRequest)

                createBookmark(user, id)

                call.respond(HttpStatusCode.OK)
            }

            delete {
                val user =
                    call.principal<JWTPrincipal>()?.subject
                        ?: return@delete call.respond(HttpStatusCode.Forbidden)
                val id =
                    call.parameters["id"] ?: return@delete call.respond(HttpStatusCode.BadRequest)

                deleteBookmark(user, id)

                call.respond(HttpStatusCode.OK)
            }
        }
    }

    /** Create a [app.burrow.groups.models.GroupMeeting]. */
    put {
        val user =
            call.principal<JWTPrincipal>()?.subject
                ?: return@put call.respond(HttpStatusCode.Forbidden)

        val group = call.receive<SubmittedGroupMeeting>()

        val errors = group.validateSubmittedGroupMeeting()
        if (errors.isNotEmpty()) {
            return@put call.respond(HttpStatusCode.BadRequest, mapOf("errors" to errors))
        }

        val createdGroup = createGroupMeeting(user, group)

        call.respond(createdGroup)
    }
}
