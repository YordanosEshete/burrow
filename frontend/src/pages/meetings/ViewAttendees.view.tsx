import { useQuery } from "@tanstack/react-query"
import type {
    MeetingRole,
    MeetingMembershipResponse
} from "@features/groups/api/groups.types"
import { useParams } from "react-router"
import { useAtom } from "jotai"
import { authToken } from "@features/auth/api/auth.atom.ts"
import { getAttendees } from "@features/groups/api/groups.api.ts"

/**
 * The color depending on the role.
 *
 * @param role The role to find the color for.
 */
function roleBadge(role: MeetingRole) {
    switch (role) {
        case "HOST":
            return "bg-yellow-100 text-yellow-800 border-yellow-200"
        case "MODERATOR":
            return "bg-indigo-100 text-indigo-800 border-indigo-200"
        default:
            return "bg-gray-100 text-gray-800 border-gray-200"
    }
}

/**
 * The icon when a user it waitlisted.
 */
function WaitlistIcon() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-4 w-4 text-amber-600"
        >
            <path d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2Zm.75 5.5a.75.75 0 0 0-1.5 0v4.25c0 .199.079.39.22.53l2.5 2.5a.75.75 0 1 0 1.06-1.06l-2.28-2.28Z" />
        </svg>
    )
}

/**
 * View all attendees in a group.
 */
export default function ViewAttendees() {
    const { id } = useParams<{ id: string }>()
    const [auth] = useAtom(authToken)

    const { data, isLoading, isError, error, refetch, isFetching } = useQuery<
        MeetingMembershipResponse[]
    >({
        queryKey: ["attendees", id],
        queryFn: async () => {
            const request = await getAttendees(auth, id!)

            return request.filter(
                (r) =>
                    r.membership.status === "JOINED" ||
                    r.membership.status === "WAITLISTED"
            )
        }
    })

    return (
        <div className="mx-auto w-full max-w-2xl px-4 py-8">
            <div className="mb-4 flex items-center justify-between">
                {/* title */}
                <div>
                    <h1 className="text-2xl figtree text-gray-900">
                        Attendees
                    </h1>
                    <p className="mt-1 text-sm text-gray-600">
                        People who have joined or are currently waitlisted.
                    </p>
                </div>

                {/* refresh button */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => refetch()}
                        disabled={isFetching}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:shadow-md disabled:opacity-50"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="h-4 w-4"
                        >
                            <path d="M12 2a10 10 0 1 0 10 10h-2a8 8 0 1 1-8-8V2Zm1 0v10l7 4-.9 1.79L11 13V2h2Z" />
                        </svg>
                        Refresh
                    </button>
                </div>
            </div>

            {isLoading && (
                <div className="rounded-lg border border-gray-200 bg-white p-4 text-gray-600">
                    Loading attendees…
                </div>
            )}

            {isError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                    {(error as Error)?.message || "Failed to load attendees"}
                </div>
            )}

            {!isLoading && !isError && (
                <ul className="flex flex-col gap-3">
                    {(data ?? []).map((m) => (
                        <li
                            key={`${m.membership.meetingId}-${m.membership.userId}`}
                            className="rounded-2xl border border-gray-200 bg-white p-4"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold text-gray-900">
                                                {m.user.name}
                                            </span>

                                            {m.membership.status ===
                                                "WAITLISTED" && (
                                                <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
                                                    <WaitlistIcon /> Waitlisted
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-gray-600">
                                            Joined{" "}
                                            {new Date(
                                                m.membership.joinedAt
                                            ).toLocaleString()}
                                        </div>
                                    </div>
                                </div>

                                <span
                                    className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${roleBadge(m.membership.role)}`}
                                >
                                    {m.membership.role}
                                </span>
                            </div>
                        </li>
                    ))}

                    {(data ?? []).length === 0 && (
                        <li className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-600">
                            No attendees yet.
                        </li>
                    )}
                </ul>
            )}
        </div>
    )
}
