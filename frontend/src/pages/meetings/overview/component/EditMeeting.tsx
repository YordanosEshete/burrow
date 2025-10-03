import type { GroupMeeting } from "@features/groups/api/groups.types.ts"
import EditStudyGroupModal from "@features/create/components/EditStudyGroupModal.tsx"
import { useState } from "react"

/**
 * {@link EditMeeting}
 */
type EditMeetingProps = {
    meeting: GroupMeeting
}

/**
 * Button to edit a meeting.
 *
 * @param meeting The meeting to edit.
 *
 * @see EditStudyGroupModal
 */
export default function EditMeeting({ meeting }: EditMeetingProps) {
    const [open, setOpen] = useState(false)

    return (
        <>
            <EditStudyGroupModal
                open={open}
                onClose={() => setOpen(false)}
                meeting={meeting}
                title={`Edit: ${meeting.title}`}
            />

            <button
                onClick={() => setOpen(true)}
                className="cursor-pointer inline-flex items-center justify-center rounded-xl border border-blue-200 bg-blue-100 px-4 py-2 text-sm font-medium text-blue-800 shadow-sm transition hover:shadow-md"
            >
                Edit
            </button>
        </>
    )
}
