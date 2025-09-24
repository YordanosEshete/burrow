import Badge from "@components/Badge.tsx"
import { useMemo } from "react"
import { useNavigate } from "react-router"
import type { GroupMeetingResponse } from "@features/groups/api/groups.types.ts"
import useUser from "@features/auth/api/hooks/useUser.ts"

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

    const meetingDateLabel = useMemo(() => {
        const today = new Date()
        const meetingDate = new Date(meeting.beginningTime)
        const tomorrow = new Date()
        tomorrow.setDate(today.getDate() + 1)

        const isToday =
            meetingDate.getFullYear() === today.getFullYear() &&
            meetingDate.getMonth() === today.getMonth() &&
            meetingDate.getDate() === today.getDate()

        const isTomorrow =
            meetingDate.getFullYear() === tomorrow.getFullYear() &&
            meetingDate.getMonth() === tomorrow.getMonth() &&
            meetingDate.getDate() === tomorrow.getDate()

        if (isToday) return "Today"
        if (isTomorrow) return "Tomorrow"

        return meetingDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric"
        })
    }, [meeting.beginningTime])

    // the meeting time
    const meetingTime = useMemo(() => {
        const beginningDate = new Date(meeting.beginningTime)
        const endDate = new Date(meeting.endTime)

        // extra options exclude da seconds
        return `${beginningDate.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit"
        })} — ${endDate.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit"
        })}`
    }, [meeting.endTime, meeting.beginningTime])

    return (
        <article
            onClick={onClick}
            className="cursor-pointer w-full rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
        >
            <div className="flex flex-col gap-4">
                <div className="min-w-0 flex flex-row justify-between">
                    <div className="flex flex-col items-start justify-between gap-2 text-sm text-gray-600">
                        {/* title & description */}
                        <div className="flex flex-col">
                            <h3 className="truncate text-md text-base font-semibold text-gray-900">
                                {meeting.title}
                            </h3>

                            <p className="truncate">{meeting.description}</p>
                        </div>

                        {/* tags */}
                        <div className="flex flex-row flex-wrap gap-2">
                            {meeting.tags.map((tag: string) => (
                                <Badge key={tag}>{tag}</Badge>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-row gap-2">
                        {meetingResponse?.membership?.status === "JOINED" && (
                            <p className="text-green-500">
                                {/* checkmark svg */}
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    aria-hidden="true"
                                    width="24"
                                    height="24"
                                    fill="currentColor"
                                >
                                    <path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" />
                                </svg>
                            </p>
                        )}

                        {user !== null && meeting.owner === user.googleID && (
                            <p className="text-yellow-500">
                                {/* star svg */}
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    width="24"
                                    height="24"
                                    fill="currentColor"
                                >
                                    <path
                                        d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.782
           1.402 8.178L12 18.896l-7.336 3.854
           1.402-8.178L.132 9.21l8.2-1.192L12 .587z"
                                    />
                                </svg>
                            </p>
                        )}

                        {meetingResponse.bookmarked && (
                            <p className="text-blue-500">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                    width="24"
                                    height="24"
                                >
                                    <path d="M6.32 2.75A2.25 2.25 0 0 0 4.25 5v16a.75.75 0 0 0 1.2.6l6.33-4.75 6.33 4.75a.75.75 0 0 0 1.2-.6V5A2.25 2.25 0 0 0 17.68 2.75H6.32z" />
                                </svg>
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex flex-row justify-between gap-3 sm:items-end">
                    {/* timing */}
                    <div className="flex flex-row gap-2">
                        <time
                            className="text-sm text-gray-700"
                            aria-label="Time Occurring"
                        >
                            {meetingDateLabel} {meetingTime}
                        </time>
                    </div>

                    {/* person counts */}
                    <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-gray-700">
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

                        <div
                            className="flex items-center gap-1 font-medium text-gray-700"
                            aria-label="Live count"
                        >
                            {/* person icon replaces green dot */}
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                className="h-3.5 w-3.5 shrink-0"
                                aria-hidden="true"
                                focusable="false"
                            >
                                <path d="M12 12c2.692 0 4.875-2.183 4.875-4.875S14.692 2.25 12 2.25 7.125 4.433 7.125 7.125 9.308 12 12 12Zm0 1.5c-3.09 0-9 1.552-9 4.643V21a.75.75 0 0 0 .75.75h16.5A.75.75 0 0 0 21 21v-2.857c0-3.091-5.91-4.643-9-4.643Z" />
                            </svg>
                            <span>{meeting.joined}</span>
                        </div>
                    </div>
                </div>
            </div>
        </article>
    )
}
