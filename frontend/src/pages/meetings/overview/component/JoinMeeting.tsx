import type {
    GroupMeetingResponse,
    MeetingMemberStatus
} from "@features/groups/api/groups.types.ts"
import { toast } from "react-hot-toast"
import { joinMeeting, leaveMeeting } from "@features/groups/api/groups.api.ts"
import useUser from "@features/auth/api/hooks/useUser.ts"
import { useQueryClient } from "@tanstack/react-query"
import useToken from "@features/auth/api/hooks/useToken.ts"

type JoinMeetingProps = {
    data: GroupMeetingResponse
}

/**
 * Join a meeting.
 * @param data The
 * @constructor
 */
export default function JoinMeeting({ data }: JoinMeetingProps) {
    const user = useUser()
    const auth = useToken()

    const queryClient = useQueryClient()

    const setMembershipStatus = (status: MeetingMemberStatus) => {
        queryClient.setQueryData(["meeting", data.meeting.id], (old: any) => {
            if (!old) return old

            return {
                ...old,
                meeting: {
                    ...(old.meeting ?? {}),
                    joined:
                        status === "JOINED" ? old.meeting.joined + 1 : old.meeting.joined - 1
                },
                membership: {
                    ...(old.membership ?? {}),
                    status
                }
            }
        })
    }

    async function joinLeaveButton() {
        if (auth === null) return

        if (data?.meeting?.owner === user?.googleID) {
            toast.error("You cannot leave your own meeting!")
            return
        }

        if (data?.membership?.status === "JOINED") {
            setMembershipStatus("LEFT")
            await leaveMeeting(auth, data.meeting.id)
        } else {
            setMembershipStatus("JOINED")
            await joinMeeting(auth, data?.meeting?.id ?? "")
        }
    }

    return (
        <button
            onClick={joinLeaveButton}
            className={`cursor-pointer inline-flex items-center justify-center rounded-lg border px-5 py-2 text-sm font-semibold shadow-sm transition hover:shadow-md ${
                data?.membership?.status === "JOINED"
                    ? "text-red-800 border-red-200 bg-red-100"
                    : "text-green-800 border-green-200 bg-green-100"
            }`}
        >
            {data?.membership?.status === "JOINED" ? "Leave" : "Join"}
        </button>
    )
}
