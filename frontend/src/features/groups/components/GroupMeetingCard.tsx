import Badge from "@components/Badge.tsx"
import { useNavigate } from "react-router"
import type { GroupMeetingResponse } from "@features/groups/api/groups.types.ts"
import useUser from "@features/auth/api/hooks/useUser.ts"
import MeetingCapacityBadges from "@features/groups/components/MeetingCapacityBadges.tsx"
import { formatDateTime } from "@api/Util.ts"

/**
 * A group card, both study and club meetings.
 *
 * @param meetingResponse The meeting details.
 * @constructor
 */
export function GroupMeetingCard(meetingResponse: GroupMeetingResponse) {
    const nav = useNavigate()

    const user = useUser()
    const { meeting } = meetingResponse

    // navigate to the club page :)
    const onClick = () => {
        nav(`/meeting/${meeting.id}`)
    }

    return (
        <article
            onClick={onClick}
            className="group cursor-pointer w-full rounded-2xl border border-gray-200/70 bg-white/90 p-5 shadow-sm ring-1 ring-black/[0.02] transition-all hover:border-gray-300 hover:shadow-md hover:shadow-gray-200 focus-within:ring-2 focus-within:ring-blue-400/40"
        >
            <div className="flex flex-col gap-4">
                <div className="min-w-0 flex items-start justify-between gap-4">
                    <div className="flex flex-col items-start justify-between gap-2 text-sm text-gray-600">
                        {/* title, description and timing */}
                        <div className="flex flex-col">
                            {/* title */}
                            <h3 className="truncate text-lg font-semibold tracking-tight text-gray-900">
                                {meeting.title}
                            </h3>

                            {/* timing */}
                            <div className="flex flex-row gap-2">
                                <time
                                    className="inline-flex items-center gap-1 rounded-full text-sm font-medium text-gray-700"
                                    aria-label="Time Occurring"
                                >
                                    {formatDateTime(
                                        meeting.beginningTime,
                                        meeting.endTime
                                    )}
                                </time>
                            </div>

                            {/* description */}
                            <p className="mt-2 max-w-prose truncate text-sm text-gray-600">
                                {meeting.description}
                            </p>
                        </div>
                    </div>

                    <div className="flex shrink-0 items-start gap-2">
                        {meetingResponse?.membership?.status === "JOINED" && (
                            <span
                                className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-1 text-green-700 ring-1 ring-inset ring-green-200"
                                title="You're a member"
                            >
                                <span className="sr-only">Joined</span>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    aria-hidden="true"
                                    width="18"
                                    height="18"
                                    fill="currentColor"
                                >
                                    <path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" />
                                </svg>
                            </span>
                        )}

                        {user !== null && meeting.owner === user.googleID && (
                            <span
                                className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-amber-700 ring-1 ring-inset ring-amber-200"
                                title="You are the host"
                            >
                                <span className="sr-only">Host</span>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    width="18"
                                    height="18"
                                    fill="currentColor"
                                    aria-hidden="true"
                                >
                                    <path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.782 1.402 8.178L12 18.896l-7.336 3.854 1.402-8.178L.132 9.21l8.2-1.192L12 .587z" />
                                </svg>
                            </span>
                        )}

                        {meetingResponse.bookmarked && (
                            <span
                                className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-blue-700 ring-1 ring-inset ring-blue-200"
                                title="Bookmarked"
                            >
                                <span className="sr-only">Bookmarked</span>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    width="18"
                                    height="18"
                                    fill="currentColor"
                                    aria-hidden="true"
                                >
                                    <path d="M6.32 2.75A2.25 2.25 0 0 0 4.25 5v16a.75.75 0 0 0 1.2.6l6.33-4.75 6.33 4.75a.75.75 0 0 0 1.2-.6V5A2.25 2.25 0 0 0 17.68 2.75H6.32z" />
                                </svg>
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex flex-row justify-between gap-3 sm:items-center">
                    {/* tags */}
                    <div className="flex flex-row flex-wrap gap-1.5 pt-1">
                        {meeting.tags.map((tag: string) => (
                            <Badge key={tag}>{tag}</Badge>
                        ))}
                    </div>

                    {/* person counts */}
                    <div className="flex items-center gap-3 text-sm">
                        <div className="flex items-center gap-1 rounded-full bg-gray-50 px-3 py-1 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-200">
                            {/* location pin icon */}
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                className="h-4 w-4 shrink-0 text-gray-500"
                                aria-hidden="true"
                                focusable="false"
                            >
                                <path d="M12 2.25c-3.728 0-6.75 2.99-6.75 6.68 0 4.989 6.053 11.744 6.311 12.03a.75.75 0 0 0 1.078 0c.258-.286 6.311-7.041 6.311-12.03 0-3.69-3.022-6.68-6.95-6.68Zm0 9.18a2.5 2.5 0 1 1 0-5.001 2.5 2.5 0 0 1 0 5z" />
                            </svg>
                            <p className="truncate">
                                {meeting.location
                                    ?.split(" ")[0]
                                    ?.charAt(0)
                                    .toUpperCase() +
                                    meeting.location
                                        ?.split(" ")[0]
                                        ?.slice(1)
                                        .toLowerCase()}
                            </p>
                        </div>

                        <MeetingCapacityBadges meeting={meeting} />
                    </div>
                </div>
            </div>
        </article>
    )
}
