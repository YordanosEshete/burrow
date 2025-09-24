import { useQuery } from "@tanstack/react-query"
import { GroupMeetingCard } from "@features/groups/components/GroupMeetingCard.tsx"
import { useNavigate } from "react-router"
import useToken from "@features/auth/api/hooks/useToken.ts"
import type { GroupType } from "@features/groups/api/groups.types.ts"
import { getMeetings } from "@features/groups/api/groups.api.ts"

/**
 * A skeleton loading card.
 * @constructor
 */
function SkeletonCard() {
    return (
        <div className="w-full rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="animate-pulse space-y-4">
                <div className="h-4 w-2/3 rounded bg-gray-200" />
                <div className="h-3 w-1/3 rounded bg-gray-200" />
                <div className="flex gap-2">
                    <div className="h-4 w-16 rounded-full bg-gray-200" />
                    <div className="h-4 w-12 rounded-full bg-gray-200" />
                    <div className="h-4 w-14 rounded-full bg-gray-200" />
                </div>
                <div className="h-4 w-40 rounded bg-gray-200" />
            </div>
        </div>
    )
}

/**
 * {@link PreviewGroupMeetings}
 */
type PreviewGroupsProps = {
    title: string
    kind: GroupType
    fullPage: string
    amount: number
}

/**
 * Preview a list of group meetings
 *
 * @param title The title of the section.
 * @param kind The kind of meetings
 * @param fullPage The link to the full page of this type of meeting.
 * @param amount The amount of meetings to preview.
 * @constructor
 */
export default function PreviewGroupMeetings({
    title,
    kind,
    fullPage,
    amount
}: PreviewGroupsProps) {
    const nav = useNavigate()
    const auth = useToken()

    const { data, isLoading, isFetching, error, refetch } = useQuery({
        queryKey: [kind],
        enabled: auth !== "" && auth !== null,
        queryFn: () => getMeetings(auth!, kind)
    })

    // load the meetings noo :(
    if (error) {
        return (
            <div>
                <h1 className="mb-2 text-2xl mt-4 font-bold">{title}</h1>
                <div className="mx-auto w-full p-4 sm:p-6">
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
                        <h2 className="mb-2 text-base font-semibold text-red-800">
                            Couldn’t load meetings
                        </h2>
                        <p className="mb-4 text-sm text-red-700">
                            Please try again{isFetching ? "…" : "."}
                        </p>
                        <button
                            onClick={() => refetch()}
                            className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-800 shadow-sm hover:shadow-md"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    if (isLoading || !data) {
        return (
            <div>
                <h1 className="mb-2 text-2xl mt-4 figtree">{title}</h1>

                <div className="flex flex-col gap-2 overflow-auto items-start">
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                </div>
            </div>
        )
    }

    return (
        <div>
            <h1 className="mb-2 text-2xl mt-4 figtree">{title}</h1>

            <div className="flex flex-col gap-2 overflow-auto justify-center items-center">
                {data.length > 0 ? (
                    data
                        .slice(0, amount)
                        .map((meeting) => <GroupMeetingCard {...meeting} />)
                ) : (
                    <p>There are currently no upcoming meetings.</p>
                )}

                {/* only show the view all button when there's more meetings than can be displayed */}
                {data.length >= amount && (
                    <button
                        onClick={() => nav(fullPage)}
                        className="self-center w-1/2 cursor-pointer hover:bg-gray-300 transition-all bg-gray-200 rounded-lg px-4 py-2"
                    >
                        View all
                    </button>
                )}
            </div>
        </div>
    )
}
