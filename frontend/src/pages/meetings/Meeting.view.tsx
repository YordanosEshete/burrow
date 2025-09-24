import { useNavigate, useParams } from "react-router"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useAtom } from "jotai"
import { authToken } from "@features/auth/api/auth.atom.ts"
import useUser from "@features/auth/api/hooks/useUser.ts"
import { toast } from "react-hot-toast"
import { useMemo } from "react"
import {
    createBookmark,
    deleteBookmark,
    getMeeting,
    joinMeeting,
    leaveMeeting
} from "@features/groups/api/groups.api.ts"
import type { MeetingMemberStatus } from "@features/groups/api/groups.types.ts"
import MeetingLocation from "@pages/meetings/components/MeetingLocation.tsx"
import DeleteMeeting from "@pages/meetings/components/DeleteMeeting.tsx"
import { formatDateTime } from "@api/Util.ts"

/**
 * View an individual meeting.
 * @constructor
 */
export default function Meeting() {
    const { id } = useParams<{ id: string }>()

    const queryClient = useQueryClient()
    const nav = useNavigate()

    const [auth] = useAtom(authToken)
    const user = useUser()

    // update update button when joining / leaving
    const setMembershipStatus = (status: MeetingMemberStatus) => {
        queryClient.setQueryData(["meeting", id], (old: any) => {
            if (!old) return old

            if (Object.hasOwn(old, "membership")) {
                return {
                    ...old,
                    membership: {
                        ...old.membership,
                        status
                    }
                }
            } else {
                return {
                    ...old,
                    membership: {
                        status
                    }
                }
            }
        })
    }

    const { data, isLoading, error } = useQuery({
        queryKey: ["meeting", id],
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

    // perform the join / leave stuff
    async function joinLeaveButton() {
        if (data?.membership?.status === "JOINED") {
            setMembershipStatus("LEFT")

            await leaveMeeting(auth, data.meeting.id)
        } else {
            setMembershipStatus("JOINED")

            await joinMeeting(auth, data?.meeting?.id ?? "")
        }
    }

    // bookmark the meeting
    async function bookmark() {
        if (data?.bookmarked === false) {
            await createBookmark(auth, meeting.id)
        } else {
            await deleteBookmark(auth, meeting.id)
        }

        queryClient.setQueryData(["meeting", id], (old: any) => {
            if (!old) return old

            return {
                ...old,
                bookmarked: !old.bookmarked
            }
        })
    }

    if (isLoading) return <p className="p-6 text-gray-600">Loading…</p>
    if (error || !data)
        return <p className="p-6 text-red-600">Error loading meeting.</p>

    const { meeting } = data

    return (
        <main className="mx-auto w-full max-w-3xl p-4 sm:p-6">
            {/* Title & meta */}
            <section className="mb-4 flex flex-row items-start justify-between">
                <div>
                    <h1 className="truncate text-xl font-semibold text-gray-900">
                        {meeting.title}
                    </h1>

                    {/*Author*/}
                    <p className="mb-4 text-sm text-gray-500">
                        Hosted by{" "}
                        <span className="font-medium text-gray-700">
                            {meeting.owner}
                        </span>
                    </p>

                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-600">
                        <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5">
                            {meeting.kind}
                        </span>
                        {(meeting.tags ?? []).slice(0, 3).map((t) => (
                            <span
                                key={t}
                                className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5"
                            >
                                {t}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="flex md:flex-row flex-col items-center gap-2">
                    {/* show controls when owner */}
                    {isOwner && (
                        <>
                            <button
                                onClick={() => {
                                    toast.success(
                                        "you thought ts would work? LMFAO"
                                    )
                                }}
                                className="hover:cursor-pointer inline-flex items-center justify-center rounded-xl border border-blue-200 bg-blue-100 px-4 py-2 text-sm font-medium text-blue-800 shadow-sm transition hover:shadow-md"
                            >
                                Edit
                            </button>

                            <DeleteMeeting meeting={meeting} />
                        </>
                    )}

                    {/* bookmark button*/}
                    <button
                        className={`transition-all hover:cursor-pointer ${data.bookmarked ? "text-blue-500" : "text-gray-500"} rounded-xl border border-gray-200 bg-white p-2 shadow-sm hover:shadow-md`}
                        aria-label="Bookmark"
                        title="Bookmark"
                        onClick={bookmark}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="h-5 w-5"
                        >
                            <path d="M6.32 2.75A2.25 2.25 0 0 0 4.25 5v16a.75.75 0 0 0 1.2.6l6.33-4.75 6.33 4.75a.75.75 0 0 0 1.2-.6V5A2.25 2.25 0 0 0 17.68 2.75H6.32z" />
                        </svg>
                    </button>
                </div>
            </section>

            {/* description */}
            <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <h2 className="mb-2 text-sm font-medium text-gray-700">
                    Description
                </h2>
                <p className="text-gray-800">
                    {meeting.description || "No description provided."}
                </p>
            </section>

            {/* location and time */}
            <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                    <h3 className="mb-1 text-sm font-medium text-gray-700">
                        Location
                    </h3>
                    <p className="text-gray-800">{meeting.location || "TBD"}</p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                    <h3 className="mb-1 text-sm font-medium text-gray-700">
                        Meeting Time
                    </h3>
                    <p className="text-gray-800">
                        {formatDateTime(meeting.beginningTime, meeting.endTime)}
                    </p>
                </div>
            </section>

            {/* map */}
            <MeetingLocation location={meeting.location} />

            {/* if club, upcoming (todo) */}
            {meeting.kind === "CLUB" && (
                <section className="mb-6">
                    <h3 className="mb-2 text-base font-semibold text-gray-900">
                        Upcoming
                    </h3>
                    <div className="flex flex-col gap-3">
                        <div className="w-full rounded-xl border border-gray-200 bg-[#d6e6f2] px-4 py-3 text-left text-gray-700">
                            No upcoming meetings listed.
                        </div>
                    </div>
                </section>
            )}

            {/* footer stuff */}
            <footer className="mt-8 flex items-center gap-2 justify-between">
                {/* share button */}
                <button
                    onClick={() =>
                        navigator
                            .share?.({
                                title: meeting.title,
                                url: window.location.href
                            })
                            .catch(() => {})
                    }
                    className="hover:cursor-pointer inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm transition hover:shadow-md"
                >
                    <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.8"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        aria-hidden="true"
                        role="img"
                    >
                        <path d="M12 3v11" />
                        <path d="M8.5 6.5L12 3l3.5 3.5" />
                        <path d="M5 13v5a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-5" />
                    </svg>
                </button>

                <div className="flex items-center gap-2">
                    {/* view attendees */}
                    <button
                        onClick={() => nav(`/meeting/${meeting.id}/attendees`)}
                        className="hover:cursor-pointer inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm transition hover:shadow-md"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="h-5 w-5"
                            aria-hidden="true"
                        >
                            <path d="M16 11c1.657 0 3-1.79 3-4s-1.343-4-3-4-3 1.79-3 4 1.343 4 3 4zm-8 0c1.657 0 3-1.79 3-4S9.657 3 8 3 5 4.79 5 7s1.343 4 3 4zm0 2c-2.673 0-8 1.337-8 4v2h10v-2c0-2.663-5.327-4-8-4zm8 0c-.29 0-.617.017-.972.047A6.1 6.1 0 0 1 18 17v2h6v-2c0-2.663-5.327-4-8-4z" />
                        </svg>
                        Attendees
                    </button>

                    {/* join / leave*/}
                    <button
                        onClick={() => joinLeaveButton()}
                        className={`hover:cursor-pointer ${data?.membership?.status === "JOINED" ? "text-red-800 border-red-200 bg-red-100" : "text-green-800 border-green-200 bg-green-100"} inline-flex items-center justify-center rounded-2xl border px-6 py-3 text-sm font-semibold shadow-sm transition hover:shadow-md`}
                    >
                        {data?.membership?.status === "JOINED"
                            ? "Leave "
                            : "Join"}
                    </button>
                </div>
            </footer>
        </main>
    )
}
