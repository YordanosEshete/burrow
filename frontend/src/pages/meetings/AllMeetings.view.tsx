import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import type {
    GroupMeetingResponse,
    GroupType
} from "@features/groups/api/groups.types.ts"
import { useAtom } from "jotai"
import { authToken } from "@features/auth/api/auth.atom.ts"
import { GroupMeetingCard } from "@features/groups/components/GroupMeetingCard.tsx"
import { searchMeetings } from "@features/groups/api/groups.api.ts"

/**
 * Convert a date into a more readable one.
 *
 * @param key The readable date.
 */
function humanDateLabel(key: string): string {
    const today = new Date()
    const tomorrow = new Date()
    tomorrow.setDate(today.getDate() + 1)
    const keyDate = new Date(key)

    const isSame = (a: Date, b: Date) =>
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()

    if (isSame(keyDate, today)) return "Today"
    if (isSame(keyDate, tomorrow)) return "Tomorrow"

    return keyDate.toLocaleDateString(undefined, {
        weekday: "long",
        month: "short",
        day: "numeric"
    })
}

/**
 * Convert a millis epoch to an input-readable number.
 *
 * @param epoch The millisecond epoch.
 */
function epochToDateInputValue(epoch: number): string {
    const d = new Date(epoch)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    return `${y}-${m}-${day}`
}

/**
 * {@link AllMeetings}
 */
type AllMeetingsProps = {
    type: GroupType
}

/**
 * Search through all meetings.
 *
 * @param type The type of meetings.
 */
export default function AllMeetings({ type }: AllMeetingsProps) {
    const [query, setQuery] = useState("")
    const [auth] = useAtom(authToken)
    const [selectedDate, setSelectedDate] = useState<number>(() => Date.now())

    const { data, isLoading, error } = useQuery({
        queryKey: ["meetings", type],
        queryFn: () => searchMeetings(auth, type, query)
    })

    const allMeetings: GroupMeetingResponse[] = useMemo(
        () => data ?? [],
        [data]
    )

    const filtered = useMemo(() => {
        const searchQuery = query.trim().toLowerCase()

        const byDate = allMeetings.filter((m) => {
            return m.meeting.beginningTime > selectedDate
        })

        return byDate
            .filter((meeting) => {
                return (
                    !searchQuery ||
                    meeting.meeting.title.toLowerCase().includes(searchQuery) ||
                    meeting.meeting.description
                        .toLowerCase()
                        .includes(searchQuery) ||
                    meeting.meeting.tags.filter((tag) =>
                        tag.toLowerCase().includes(searchQuery)
                    ).length > 0
                )
            })
            .sort((a, b) => a.meeting.beginningTime - b.meeting.beginningTime)
    }, [allMeetings, query, selectedDate])

    const groupedByDate = useMemo(() => {
        const map = new Map<string, GroupMeetingResponse[]>()

        filtered.forEach((m) => {
            const key = new Date(m.meeting.beginningTime).toLocaleDateString()
            const list = map.get(key) ?? []
            list.push(m)
            map.set(key, list)
        })
        return Array.from(map.entries()).sort(([a], [b]) => (a < b ? -1 : 1))
    }, [filtered])

    if (isLoading) return <p className="p-6 text-gray-600">Loading…</p>

    if (error)
        return <p className="p-6 text-red-600">Failed to load meetings.</p>

    return (
        <main className="mx-auto w-full max-w-4xl p-4 sm:p-6">
            {/* top controls */}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {/* search */}
                <div className="flex-1">
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search meetings…"
                        className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm shadow-sm focus:outline-none"
                    />
                </div>

                {/* calendar */}
                <div className="flex items-center gap-2">
                    <input
                        type="date"
                        value={epochToDateInputValue(selectedDate)}
                        onChange={(e) =>
                            setSelectedDate(e.target.valueAsNumber)
                        }
                        className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:outline-none"
                        aria-label="Select date"
                    />
                </div>
            </div>

            {/* search results */}
            {groupedByDate.length === 0 ? (
                <p className="rounded-2xl border border-gray-200 bg-white p-6 text-gray-700 shadow-sm">
                    No meetings match your filters.
                </p>
            ) : (
                groupedByDate.map(([dateKey, meetings]) => (
                    <section key={dateKey} className="mb-10">
                        <h2 className="mb-3 text-lg font-semibold text-gray-900">
                            {humanDateLabel(dateKey)}
                        </h2>
                        <div className="flex flex-col gap-4">
                            {meetings.map((m) => (
                                <GroupMeetingCard key={m.meeting.id} {...m} />
                            ))}
                        </div>
                    </section>
                ))
            )}
        </main>
    )
}
