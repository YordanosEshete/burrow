import { useNavigate, useParams } from "react-router"
import { useQuery } from "@tanstack/react-query"
import { useAtom } from "jotai"
import { authToken } from "@features/auth/api/auth.atom.ts"
import useUser from "@features/auth/api/hooks/useUser.ts"
import { useMemo } from "react"
import { getMeeting } from "@features/groups/api/groups.api.ts"
import MeetingLocation from "@pages/meetings/components/MeetingLocation.tsx"
import DeleteMeeting from "@pages/meetings/overview/component/DeleteMeeting.tsx"
import { formatDateTime } from "@api/Util.ts"
import Badge from "@components/Badge.tsx"
import BookmarkMeeting from "@pages/meetings/overview/component/BookmarkMeeting.tsx"
import ShareMeeting from "@pages/meetings/overview/component/ShareMeeting.tsx"
import JoinMeeting from "@pages/meetings/overview/component/JoinMeeting.tsx"
import MeetingCapacityBadges from "@features/groups/components/MeetingCapacityBadges.tsx"
import EditMeeting from "@pages/meetings/overview/component/EditMeeting.tsx"

/**
 * View an individual meeting.
 * @constructor
 */
export default function Meeting() {
    const { id } = useParams<{ id: string }>()

    const nav = useNavigate()

    const [auth] = useAtom(authToken)
    const user = useUser()

    const { data, isLoading, error } = useQuery({
        queryKey: [`meeting`, id],
        enabled: id !== null && auth !== null,
        queryFn: () => (id ? getMeeting(auth, id) : null)
    })

    const isOwner = useMemo(
        () =>
            auth !== "" &&
            user !== null &&
            user.googleID === data?.meeting?.owner,
        [auth, data?.meeting?.owner, user]
    )

    if (isLoading)
        return (
            <main className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-sky-50 px-4 py-8 md:px-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-10 w-2/3 rounded-lg bg-gradient-to-r from-gray-200 to-gray-100" />
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        <div className="h-64 rounded-2xl bg-gray-100" />
                        <div className="h-64 rounded-2xl bg-gray-100 lg:col-span-2" />
                    </div>
                </div>
            </main>
        )

    if (error || !data || !id)
        return (
            <main className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-sky-50 px-4 py-8 md:px-8">
                <div
                    role="alert"
                    className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                >
                    Error loading meeting.
                </div>
            </main>
        )

    const { meeting, meetingAuthor } = data

    const tags = Array.from(meeting.tags ?? [])

    return (
        <main className="min-h-screen">
            <section className="relative isolate">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
                    <div className="relative rounded-3xl border border-amber-200/70 bg-gradient-to-r from-amber-100 via-white to-sky-100 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,.6),0_10px_30px_rgba(17,24,39,.06)]">
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                            <div className="min-w-0">
                                <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                                    {meeting.kind}
                                </div>
                                <h1 className="mt-3 truncate text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">
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
                                        {meetingAuthor}
                                    </span>
                                </p>

                                {tags.length > 0 && (
                                    <div className="mt-8 flex flex-wrap gap-2">
                                        {tags.slice(0, 6).map((t) => (
                                            <Badge key={String(t)}>
                                                {String(t)}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-row justify-center items-center gap-2 sm:flex-row sm:items-center">
                                <ShareMeeting meeting={data.meeting} />

                                <BookmarkMeeting
                                    isBookmarked={data?.bookmarked === true}
                                    meetingId={id}
                                />
                            </div>
                        </div>

                        {/* user count stuff */}
                        <div className="pointer-events-none absolute bottom-4 right-4 flex gap-2">
                            <MeetingCapacityBadges meeting={meeting} />
                        </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                        {isOwner && (
                            <>
                                <EditMeeting meeting={meeting} />
                                <DeleteMeeting meeting={meeting} />
                            </>
                        )}

                        {data?.membership?.status === "JOINED" && (
                            <button
                                onClick={() =>
                                    nav(`/meeting/${meeting.id}/open`)
                                }
                                className="cursor-pointer inline-flex items-center justify-center rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-800 shadow-sm transition hover:shadow-md"
                                title="Open member features"
                            >
                                Open Meeting
                            </button>
                        )}

                        <JoinMeeting data={data} />
                    </div>

                    <div className="mt-8">
                        <div className="space-y-6 lg:col-span-4">
                            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                                <div className="mb-1 flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-gray-700">
                                        Description
                                    </h3>
                                </div>
                                <p className="prose mt-2 max-w-none text-gray-900">
                                    {meeting.description ||
                                        "No description provided."}
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
