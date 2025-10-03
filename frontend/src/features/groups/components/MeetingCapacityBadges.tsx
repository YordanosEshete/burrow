import type { GroupMeeting } from "@features/groups/api/groups.types.ts"

/**
 * {@see GroupMeetingBadges}
 */
type MeetingCapacityProps = {
    meeting: GroupMeeting
}

/**
 * The badges on a meeting, conveying the capacity and waitlist.
 * @constructor
 */
export default function MeetingCapacityBadges({
    meeting
}: MeetingCapacityProps) {
    return (
        <>
            {/* capacity */}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 shadow-sm">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-4 w-4"
                    aria-hidden
                >
                    <path d="M10 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                    <path
                        fillRule="evenodd"
                        d="M.458 16.042A8 8 0 0 1 10 12a8 8 0 0 1 9.542 4.042.75.75 0 0 1-.676 1.108H1.134a.75.75 0 0 1-.676-1.108Z"
                        clipRule="evenodd"
                    />
                </svg>

                {meeting.capacity > 0
                    ? `${meeting.joined}/${meeting.capacity}`
                    : "No limit"}
            </span>

            {/* waitlist */}
            {meeting.waiting > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-yellow-200 bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-700 shadow-sm">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="h-4 w-4"
                        aria-hidden
                    >
                        <path d="M7.5 6a3 3 0 1 1 6 0 3 3 0 0 1-6 0Zm9 0a3 3 0 1 1 6 0 3 3 0 0 1-6 0ZM2 20c0-2.5 2-4.5 4.5-4.5h3c2.5 0 4.5 2 4.5 4.5v1H2v-1Zm12.5 0c0-2.5 2-4.5 4.5-4.5h3c2.5 0 4.5 2 4.5 4.5v1h-12v-1Z" />
                    </svg>
                    {meeting.waiting}
                </span>
            )}
        </>
    )
}
