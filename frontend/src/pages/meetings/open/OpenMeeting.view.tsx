import { useQuery } from "@tanstack/react-query"
import { useParams } from "react-router"
import { useNavigate } from "react-router"
import { formatDateTime } from "@api/Util.ts"
import ViewAttendees from "@pages/meetings/open/components/ViewAttendees.tsx"
import { getMeeting } from "@features/groups/api/groups.api.ts"
import useToken from "@features/auth/api/hooks/useToken.ts"
import type { GroupMeetingResponse } from "@features/groups/api/groups.types.ts"
import ChatBox from "@features/chat/components/ChatBox.tsx"
import MeetingLocation from "@pages/meetings/components/MeetingLocation.tsx"

/**
 * The member only view of a meeting.
 * @constructor
 */
export default function OpenMeeting() {
    const { id = "" } = useParams()
    const auth = useToken()
    const nav = useNavigate()

    const { data, isLoading, isError, error } = useQuery<GroupMeetingResponse>({
        queryKey: ["meeting", id],
        queryFn: async () => await getMeeting(auth ?? "", id),
        enabled: !!id
    })

    if (isLoading) {
        return (
            <main className="px-4 py-6 md:px-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-10 w-2/3 rounded-lg bg-gradient-to-r from-gray-200 to-gray-100" />
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="h-64 rounded-2xl bg-gray-100" />
                        <div className="h-64 rounded-2xl bg-gray-100 lg:col-span-2" />
                    </div>
                </div>
            </main>
        )
    }

    if (isError || !data) {
        return (
            <main className="px-4 py-6 md:px-8">
                <div
                    role="alert"
                    className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                >
                    {(error as Error)?.message ?? "Unable to load meeting."}
                </div>
            </main>
        )
    }

    const { meeting } = data

    const tags = Array.from(meeting.tags ?? [])

    return (
        <main className="min-h-screen">
            <section className="relative isolate">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
                    <div className="rounded-3xl border border-amber-200/70 bg-gradient-to-r from-amber-100 via-white to-sky-100 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,.6),0_10px_30px_rgba(17,24,39,.06)]">
                        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                            <div>
                                <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                                    {meeting.kind}
                                </div>
                                <h1 className="mt-3 text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
                                    {meeting.title}
                                </h1>
                                <p className="mt-1 text-sm text-gray-600">
                                    {formatDateTime(
                                        meeting.beginningTime,
                                        meeting.endTime
                                    )}
                                </p>

                                <p className="mb-2 mt-1 text-sm text-gray-500">
                                    Hosted by{" "}
                                    <span className="font-medium text-gray-700">
                                        {data.meetingAuthor}
                                    </span>
                                </p>

                                {tags.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {tags.map((t) => (
                                            <span
                                                key={String(t)}
                                                className="inline-flex items-center rounded-full border border-gray-300 bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700"
                                            >
                                                {String(t)}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                <button
                                    onClick={() =>
                                        nav(`/meeting/${meeting.id}`)
                                    }
                                    className="mt-4 cursor-pointer inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900"
                                >
                                    ← Back to Main Page
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
                        <div className="space-y-6 lg:col-span-8">
                            <ChatBox meeting={data} />

                            <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                                <div className="mb-3 flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-gray-700">
                                        Attendees
                                    </h3>
                                </div>

                                <ViewAttendees />
                            </section>
                        </div>

                        <div className="space-y-6 lg:col-span-4">
                            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                                <h3 className="text-sm font-semibold text-gray-700">
                                    About this meeting
                                </h3>
                                <p className="prose mt-2 max-w-none text-gray-900">
                                    {meeting.description}
                                </p>
                            </section>

                            <MeetingLocation location={meeting.location} />
                        </div>
                    </div>
                </div>
            </section>
        </main>
    )
}
