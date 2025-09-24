export const BASE_URL = import.meta.env.VITE_BASE_URL

/**
 * Label a date.
 *
 * @param ts The time.
 */
export function dayLabel(ts: number) {
    const d = new Date(ts)
    const today = new Date()
    const tomorrow = new Date()
    tomorrow.setDate(today.getDate() + 1)

    const same = (a: Date, b: Date) =>
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()

    if (same(d, today)) return "Today"
    if (same(d, tomorrow)) return "Tomorrow"
    return d.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric"
    })
}

/**
 * Format a date and time. Returns in a format similar to `Today, 9:00 AM — 10:00 AM`
 *
 * @param startTime The start of a meeting.
 * @param endTime The end of a meeting.
 */
export function formatDateTime(startTime: number, endTime: number) {
    let builtStr = ""

    const today = new Date()
    const meetingDate = new Date(startTime)
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

    if (isToday) builtStr += "Today"
    else if (isTomorrow) builtStr += "Tomorrow"
    else
        builtStr += meetingDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric"
        })

    // the meeting time
    const beginningDate = new Date(startTime)
    const endDate = new Date(endTime)

    // extra options exclude da seconds
    builtStr += `, ${beginningDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit"
    })} — ${endDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit"
    })}`

    return builtStr
}
