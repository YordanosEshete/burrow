import React, { useEffect, useId, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { useAtom } from "jotai"
import { useNavigate } from "react-router"
import { authToken } from "../../auth/api/auth.atom.ts"
import type { GroupMeeting } from "../../groups/api/groups.types.ts"
import { createMeeting } from "@features/groups/api/groups.api.ts"

type Props = {
    open: boolean
    onClose: () => void
}

function addTime(dateMs: number, time: string): number {
    const timeSpl = time.split(":")

    return dateMs + +timeSpl[0] * 60 * 60 * 1000 + +timeSpl[1] * 60 * 1000
}

export default function StudyGroupModal({ open, onClose }: Props) {
    const [auth] = useAtom(authToken)
    const nav = useNavigate()

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

    // Reset when opened
    useEffect(() => {
        if (open) {
            setErrors({})
            setServerErrors([])
            setTimeout(() => firstFieldRef.current?.focus(), 50)
        }
    }, [open])

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

    // Close on Escape
    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") onClose()
        }

        if (open) window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [open, onClose])

    // Simple validation
    function validate(): boolean {
        const next: Record<string, string> = {}
        if (!title.trim()) next.title = "Required"
        if (!date) next.date = "Required"
        if (!startTime) next.startTime = "Required"
        if (!endTime) next.endTime = "Required"
        if (!location.trim()) next.location = "Required"
        // start < end check (string compare OK for 24h HH:MM)
        if (startTime && endTime && startTime >= endTime)
            next.endTime = "End must be after start"
        setErrors(next)
        return Object.keys(next).length === 0
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!validate()) return

        const dateMs = new Date(`${date}T00:00:00-05:00`).getTime()

        const response = await createMeeting(auth, {
            kind: "STUDY",
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
        })

        if (
            response &&
            typeof response === "object" &&
            !Array.isArray(response) &&
            "id" in response
        ) {
            const meeting = response as GroupMeeting
            setServerErrors([])
            nav(`/meeting/${meeting.id}`)
            onClose()
        } else if (Array.isArray(response)) {
            applyServerErrors(response as string[])
        } else {
            applyServerErrors([
                "Unknown error creating meeting. Please try again."
            ])
        }
    }

    // Focus trap: keep tabbing inside dialog
    useEffect(() => {
        if (!open) return
        const el = dialogRef.current
        if (!el) return
        const selectors =
            'a, button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])'
        const focusables = () =>
            Array.from(el.querySelectorAll<HTMLElement>(selectors)).filter(
                (n) => !n.hasAttribute("disabled")
            )

        function onKeyDown(e: KeyboardEvent) {
            if (e.key !== "Tab") return
            const nodes = focusables()
            if (nodes.length === 0) return
            const first = nodes[0]
            const last = nodes[nodes.length - 1]
            if (e.shiftKey && document.activeElement === first) {
                last.focus()
                e.preventDefault()
            } else if (!e.shiftKey && document.activeElement === last) {
                first.focus()
                e.preventDefault()
            }
        }

        el.addEventListener("keydown", onKeyDown as any)
        return () => el.removeEventListener("keydown", onKeyDown as any)
    }, [open])

    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-50 overflow-y-scroll">
                    {/* Backdrop */}
                    <motion.div
                        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        aria-hidden
                    />

                    {/* Dialog */}
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
                            className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-neutral-200"
                        >
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

                            <header className="flex items-center justify-between gap-4 px-5 py-4 border-b">
                                <div>
                                    <h2
                                        id={`${id}-title`}
                                        className="text-lg font-semibold tracking-tight"
                                    >
                                        Create a Study Group
                                    </h2>
                                    <p
                                        id={`${id}-desc`}
                                        className="text-sm text-neutral-500"
                                    >
                                        Fill details below and publish your
                                        session.
                                    </p>
                                </div>

                                {/* header close button */}
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="grid place-items-center h-9 w-9 rounded-full hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/40"
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

                            <div className="grid gap-5 px-5 py-5 md:grid-cols-2">
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
                                        className="input"
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
                                        className="input"
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
                                            const v = e.target.value
                                            if (v === "") return setCapacity("")
                                            const n = Number(
                                                v.replace(/\D/g, "")
                                            )
                                            if (!Number.isNaN(n)) setCapacity(n)
                                        }}
                                        className="input"
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
                                        className="input"
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
                                        className="input w-full min-h-28"
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
                                        className="input"
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
                                            className="input"
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
                                            className="input"
                                        />
                                    </Field>
                                </div>
                            </div>

                            {/* controls */}
                            <footer className="flex items-center justify-end gap-3 px-5 py-4 border-t bg-neutral-50/60 rounded-b-2xl">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="btn-secondary"
                                >
                                    Cancel
                                </button>

                                <button type="submit" className="btn-primary">
                                    Create
                                </button>
                            </footer>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}

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
            <label className="block text-sm font-medium text-neutral-800 mb-1">
                {label}
            </label>
            {children}
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    )
}
