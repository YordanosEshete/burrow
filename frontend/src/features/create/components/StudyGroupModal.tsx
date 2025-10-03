import React, { useEffect, useId, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { useNavigate } from "react-router"
import type {
    GroupMeeting,
    SubmittedGroupMeeting
} from "../../groups/api/groups.types.ts"
import { useQueryClient } from "@tanstack/react-query"

/**
 * {@link StudyGroupModal}
 */
type StudyGroupModalProps = {
    open: boolean
    onClose: () => void
    mode?: "create" | "update"
    meeting?: GroupMeeting
    modalTitle?: string
    onSubmit: (payload: SubmittedGroupMeeting) => Promise<unknown>
}

/**
 * Convert a HH:MM into milliseconds.
 *
 * @param dateMs The current date in milliseconds.
 * @param time The HH:MM date.
 */
function addTime(dateMs: number, time: string): number {
    const timeSpl = time.split(":")

    return dateMs + +timeSpl[0] * 60 * 60 * 1000 + +timeSpl[1] * 60 * 1000
}

/**
 * Manages a study group, whether it be creating or updating.
 *
 * @param open When this modal is open.
 * @param onClose When this modal is closed.
 * @param mode Whether it's creating or updating.
 * @param meeting The meeting (if updating)
 * @param modalTitle The title {@link mode}.
 * @param onSubmit When the modal is submitted.
 * @constructor
 */
export default function StudyGroupModal({
    open,
    onClose,
    mode = "create",
    meeting,
    modalTitle,
    onSubmit
}: StudyGroupModalProps) {
    const nav = useNavigate()

    const queryClient = useQueryClient()

    const id = useId()
    const dialogRef = useRef<HTMLDivElement>(null)
    const firstFieldRef = useRef<HTMLInputElement>(null)

    const [title, setTitle] = useState("")
    const [date, setDate] = useState("")
    const [startTime, setStartTime] = useState("")
    const [endTime, setEndTime] = useState("")
    const [location, setLocation] = useState("")
    const [capacity, setCapacity] = useState<number | "">("")
    const [tags, setTags] = useState<string>("")
    const [description, setDescription] = useState("")
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [serverErrors, setServerErrors] = useState<string[]>([])

    useEffect(() => {
        if (open) {
            setErrors({})
            setServerErrors([])

            // if updating and a meeting is provided
            if (mode === "update" && meeting) {
                setTitle(meeting.title ?? "")
                setLocation(meeting.location ?? "")
                setCapacity(
                    meeting.capacity && meeting.capacity > 0
                        ? meeting.capacity
                        : ""
                )
                setTags(
                    Array.isArray(meeting.tags) ? meeting.tags.join(", ") : ""
                )
                setDescription(meeting.description ?? "")

                // date
                const start = new Date(meeting.beginningTime)
                const end = new Date(meeting.endTime)
                const yyyy = start.getFullYear()
                const mm = String(start.getMonth() + 1).padStart(2, "0")
                const dd = String(start.getDate()).padStart(2, "0")
                setDate(`${yyyy}-${mm}-${dd}`)

                // start time
                const hhStart = String(start.getHours()).padStart(2, "0")
                const minStart = String(start.getMinutes()).padStart(2, "0")
                setStartTime(`${hhStart}:${minStart}`)

                // end time
                const hhEnd = String(end.getHours()).padStart(2, "0")
                const minEnd = String(end.getMinutes()).padStart(2, "0")
                setEndTime(`${hhEnd}:${minEnd}`)
            } else {
                setTitle("")
                setLocation("")
                setCapacity("")
                setTags("")
                setDescription("")
                setDate("")
                setStartTime("")
                setEndTime("")
            }

            setTimeout(() => firstFieldRef.current?.focus(), 50)
        }
    }, [open, mode, meeting])

    function applyServerErrors(errs: string[]) {
        setServerErrors(errs)
        const fieldMap: Record<string, string> = {}
        errs.forEach((msg) => {
            // Try to parse patterns like "field: message" or "field = message"
            const m = msg.match(/^\s*([A-Za-z][\w.-]*)\s*[:=-]\s*(.+)$/)
            if (m) {
                const field = m[1]
                const text = m[2]
                fieldMap[field] = text
            }
        })
        if (Object.keys(fieldMap).length > 0) {
            setErrors((prev) => ({ ...prev, ...fieldMap }))
        }
    }

    // leave when pressing escape
    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") onClose()
        }

        if (open) window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [open, onClose])

    // pre validate before server
    function validateInput(): boolean {
        const next: Record<string, string> = {}
        if (!title.trim()) next.title = "Required"
        if (!date) next.date = "Required"
        if (!startTime) next.startTime = "Required"
        if (!endTime) next.endTime = "Required"
        if (!location.trim()) next.location = "Required"
        if (startTime && endTime && startTime >= endTime)
            next.endTime = "End must be after start"

        setErrors(next)

        return Object.keys(next).length === 0
    }

    // on submit
    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        // pre validate
        if (!validateInput()) return

        const dateMs = new Date(`${date}T00:00:00-05:00`).getTime()

        const payload: SubmittedGroupMeeting = {
            kind: "STUDY" as const,
            title: title.trim(),
            location: location.trim(),
            capacity: typeof capacity === "number" ? capacity : 0,
            tags: tags
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean),
            description: description.trim() || "",
            beginningTime: addTime(dateMs, startTime),
            endTime: addTime(dateMs, endTime)
        }

        const response = await onSubmit(payload)

        // no matter what, this means there's errors in the response
        if (Array.isArray(response)) {
            applyServerErrors(response as string[])
            return
        }

        // if updating, update query data and close
        if (mode === "update" && meeting) {
            setServerErrors([])
            onClose()

            queryClient.setQueryData([`meeting`, meeting.id], (old: any) => {
                console.log("%o", old)
                return {
                    ...old,
                    meeting: {
                        ...old.meeting,
                        ...payload
                    }
                }
            })

            return
        }

        // if creating, go to the new meeting
        if (
            response &&
            typeof response === "object" &&
            !Array.isArray(response) &&
            "id" in response
        ) {
            setServerErrors([])

            const updated = response as GroupMeeting
            nav(`/meeting/${updated.id}`)

            onClose()
            return
        }

        applyServerErrors([
            "Unknown error submitting meeting. Please try again."
        ])
    }

    // ensure tab focusing remains in the modal
    useEffect(() => {
        if (!open) return
        const dialogElement = dialogRef.current

        if (!dialogElement) return
        const selectors =
            'a, button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])'

        const focusables = () =>
            Array.from(
                dialogElement.querySelectorAll<HTMLElement>(selectors)
            ).filter((n) => !n.hasAttribute("disabled"))

        function onKeyDown(event: KeyboardEvent) {
            if (event.key !== "Tab") return

            const nodes = focusables()
            if (nodes.length === 0) return

            const first = nodes[0]
            const last = nodes[nodes.length - 1]

            if (event.shiftKey && document.activeElement === first) {
                last.focus()
                event.preventDefault()
            } else if (!event.shiftKey && document.activeElement === last) {
                first.focus()
                event.preventDefault()
            }
        }

        dialogElement.addEventListener("keydown", onKeyDown as any)
        return () =>
            dialogElement.removeEventListener("keydown", onKeyDown as any)
    }, [open])

    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-50 overflow-y-scroll">
                    <motion.div
                        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        aria-hidden
                    />

                    <motion.div
                        ref={dialogRef}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={`${id}-title`}
                        aria-describedby={`${id}-desc`}
                        className="absolute inset-0 grid place-items-center p-4"
                        initial={{ opacity: 0, scale: 0.96, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98, y: 6 }}
                        transition={{
                            type: "spring",
                            stiffness: 380,
                            damping: 28
                        }}
                    >
                        <form
                            onSubmit={handleSubmit}
                            className="w-full max-w-2xl rounded-2xl border border-neutral-200/70 bg-white/95 shadow-xl ring-1 ring-black/5 backdrop-blur"
                        >
                            {/* errors.. uh oh! */}
                            {serverErrors.length > 0 && (
                                <div className="mx-5 mt-4 mb-0 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">
                                    <p className="font-medium mb-1">
                                        Please fix the following:
                                    </p>
                                    <ul className="list-disc pl-5 space-y-1">
                                        {serverErrors.map((err, i) => (
                                            <li key={i}>{err}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <header
                              className={`flex items-center justify-between gap-4 px-6 py-5 border-b bg-gradient-to-r ${mode === "update" ? "from-blue-50 to-transparent" : "from-emerald-50 to-transparent"}`}
                            >
                              <div>
                                <h2
                                  id={`${id}-title`}
                                  className="text-xl font-semibold tracking-tight text-neutral-900"
                                >
                                  {modalTitle ?? (mode === "update" ? "Update Study Group" : "Create a Study Group")}
                                </h2>
                                <p
                                  id={`${id}-desc`}
                                  className="mt-0.5 text-sm leading-6 text-neutral-600"
                                >
                                  {mode === "update" ? "Modify the details below and save your changes." : "Fill details below and publish your meeting."}
                                </p>
                              </div>

                              {/* header close button */}
                              <button
                                type="button"
                                onClick={onClose}
                                className="grid place-items-center h-9 w-9 rounded-full hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
                                aria-label="Close"
                              >
                                <svg
                                  viewBox="0 0 24 24"
                                  className="w-5 h-5"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                >
                                  <path d="M6 6l12 12M18 6 6 18" />
                                </svg>
                              </button>
                            </header>

                            <div className="grid gap-6 px-6 py-6 md:grid-cols-2">
                                {/* title of the session */}
                                <Field
                                    label="Title"
                                    error={errors.title}
                                    className="min-w-0"
                                >
                                    <input
                                        ref={firstFieldRef}
                                        value={title}
                                        onChange={(e) =>
                                            setTitle(e.target.value)
                                        }
                                        className={`input rounded-xl border border-neutral-300 bg-neutral-50/80 px-3 py-2 text-[15px] placeholder:text-neutral-400 shadow-inner focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition ${errors.title ? "border-red-300 focus:border-red-500 focus:ring-red-300/40" : ""}`}
                                        placeholder="PHYS 1301W Final"
                                    />
                                </Field>

                                {/* location of the session */}
                                <Field label="Location" error={errors.location}>
                                    <input
                                        value={location}
                                        onChange={(e) =>
                                            setLocation(e.target.value)
                                        }
                                        className={`input rounded-xl border border-neutral-300 bg-neutral-50/80 px-3 py-2 text-[15px] placeholder:text-neutral-400 shadow-inner focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition ${errors.location ? "border-red-300 focus:border-red-500 focus:ring-red-300/40" : ""}`}
                                        placeholder="Hall & Room"
                                    />
                                </Field>

                                {/* capacity */}
                                <Field label="Max Participants (optional)">
                                    <input
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        value={capacity}
                                        onChange={(e) => {
                                            const value = e.target.value
                                            if (value === "")
                                                return setCapacity("")

                                            const num = Number(
                                                value.replace(/\D/g, "")
                                            )
                                            if (!Number.isNaN(num))
                                                setCapacity(num)
                                        }}
                                        className="input rounded-xl border border-neutral-300 bg-neutral-50/80 px-3 py-2 text-[15px] placeholder:text-neutral-400 shadow-inner focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition"
                                        placeholder="5"
                                    />
                                </Field>

                                {/* tags*/}
                                <Field
                                    label="Tags (comma separated)"
                                    className="min-w-0"
                                >
                                    <input
                                        value={tags}
                                        onChange={(e) =>
                                            setTags(e.target.value)
                                        }
                                        className="input rounded-xl border border-neutral-300 bg-neutral-50/80 px-3 py-2 text-[15px] placeholder:text-neutral-400 shadow-inner focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition"
                                        placeholder="PHYS, FINAL, etc."
                                    />
                                </Field>

                                {/* description */}
                                <Field
                                    label="Description"
                                    className="md:col-span-2 min-w-0"
                                >
                                    <textarea
                                        value={description}
                                        onChange={(e) =>
                                            setDescription(e.target.value)
                                        }
                                        className="input w-full min-h-28 rounded-xl border border-neutral-300 bg-neutral-50/80 px-3 py-2 text-[15px] placeholder:text-neutral-400 shadow-inner focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition"
                                        placeholder="What're you studying? Who are you looking for?"
                                    />
                                </Field>

                                {/* date */}
                                <Field
                                    label="Date"
                                    error={errors.date}
                                    className="min-w-0"
                                >
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) =>
                                            setDate(e.target.value)
                                        }
                                        className={`input rounded-xl border border-neutral-300 bg-neutral-50/80 px-3 py-2 text-[15px] placeholder:text-neutral-400 shadow-inner focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition ${errors.date ? "border-red-300 focus:border-red-500 focus:ring-red-300/40" : ""}`}
                                    />
                                </Field>

                                {/* time */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    {/* start */}
                                    <Field
                                        label="Start"
                                        error={errors.startTime}
                                        className="min-w-0"
                                    >
                                        <input
                                            type="time"
                                            value={startTime}
                                            onChange={(e) =>
                                                setStartTime(e.target.value)
                                            }
                                            className={`input rounded-xl border border-neutral-300 bg-neutral-50/80 px-3 py-2 text-[15px] placeholder:text-neutral-400 shadow-inner focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition ${errors.startTime ? "border-red-300 focus:border-red-500 focus:ring-red-300/40" : ""}`}
                                        />
                                    </Field>

                                    {/* end */}
                                    <Field
                                        label="End"
                                        error={errors.endTime}
                                        className="min-w-0"
                                    >
                                        <input
                                            type="time"
                                            value={endTime}
                                            onChange={(e) =>
                                                setEndTime(e.target.value)
                                            }
                                            className={`input rounded-xl border border-neutral-300 bg-neutral-50/80 px-3 py-2 text-[15px] placeholder:text-neutral-400 shadow-inner focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition ${errors.endTime ? "border-red-300 focus:border-red-500 focus:ring-red-300/40" : ""}`}
                                        />
                                    </Field>
                                </div>
                            </div>

                            {/* controls */}
                            <footer className="flex items-center justify-end gap-3 px-6 py-4 border-t rounded-b-2xl bg-gradient-to-r from-neutral-50 to-white">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="btn-secondary rounded-xl border border-neutral-300 bg-white/90 px-4 py-2 text-[15px] font-medium text-neutral-700 shadow-sm transition hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="cursor-pointer btn-primary rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-2 text-[15px] font-semibold text-white shadow-md transition hover:from-indigo-700 hover:to-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
                                >
                                    {mode === "update"
                                        ? "Save Changes"
                                        : "Create"}
                                </button>
                            </footer>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}

/**
 * An individual field on the modal.
 *
 * @param label The label for the field.
 * @param error If there's an error.
 * @param children The input itself.
 * @param className Additional styling.
 * @constructor
 */
function Field({
    label,
    error,
    children,
    className = ""
}: {
    label: string
    error?: string
    children: React.ReactNode
    className?: string
}) {
    return (
        <div className={className}>
            <label className="mb-1 block text-[13px] font-medium tracking-wide text-neutral-700">
                {label}
            </label>
            {children}
            {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
        </div>
    )
}
