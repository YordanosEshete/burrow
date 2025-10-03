import { useEffect, useId, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import type { GroupType } from "@features/groups/api/groups.types.ts"
import CreateStudyGroupModal from "@features/create/components/CreateStudyGroupModal.tsx"

/**
 * {@link Create}
 */
type Props = {
    visible: boolean
}

/**
 * The create button seen on the bottom right of the page.
 *
 * @param visible If the extended creation options are visible.
 * @constructor
 */
export default function Create({ visible }: Props) {
    const [open, setOpen] = useState(false)
    const [modalOpen, setModalOpen] = useState(false)

    const id = useId()
    const containerRef = useRef<HTMLDivElement>(null)

    // events on page :o
    useEffect(() => {
        function onDocClick(e: MouseEvent) {
            if (!containerRef.current) return
            if (!containerRef.current.contains(e.target as Node)) setOpen(false)
        }

        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") setOpen(false)
        }

        if (open) {
            window.addEventListener("keydown", onKey)
            document.addEventListener("mousedown", onDocClick)
        }

        return () => {
            document.removeEventListener("mousedown", onDocClick)
            window.removeEventListener("keydown", onKey)
        }
    }, [open])

    const handlePick = (type: GroupType) => {
        console.log(type)
        setOpen(false)
        setModalOpen(true)
    }

    if (!visible) return <></>

    return (
        <div
            ref={containerRef}
            className={"fixed bottom-6 right-6 z-50 select-none"}
            aria-live="polite"
        >
            <CreateStudyGroupModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                title="Create a Study Group"
            />

            {/* main menu */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        key="menu"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 16 }}
                        transition={{
                            type: "spring",
                            stiffness: 380,
                            damping: 28
                        }}
                        className="absolute bottom-16 right-0 w-56 p-2 rounded-2xl shadow-2xl bg-white/95 backdrop-blur border border-neutral-200"
                        role="menu"
                        aria-labelledby={`${id}-fab`}
                    >
                        {/*<MenuButton*/}
                        {/*    onClick={() => handlePick("CLUB")}*/}
                        {/*    title="Club Meeting"*/}
                        {/*    subtitle="Create a Club Meeting"*/}
                        {/*    icon={*/}
                        {/*        <svg*/}
                        {/*            viewBox="0 0 24 24"*/}
                        {/*            fill="none"*/}
                        {/*            stroke="currentColor"*/}
                        {/*            strokeWidth={1.75}*/}
                        {/*            className="w-5 h-5"*/}
                        {/*        >*/}
                        {/*            <path d="M16 11c1.657 0 3-1.567 3-3.5S17.657 4 16 4s-3 1.567-3 3.5S14.343 11 16 11Z" />*/}
                        {/*            <path d="M8 11c1.657 0 3-1.567 3-3.5S9.657 4 8 4 5 5.567 5 7.5 6.343 11 8 11Z" />*/}
                        {/*            <path d="M3 20c0-2.761 2.91-5 5-5m8 0c2.09 0 5 2.239 5 5" />*/}
                        {/*        </svg>*/}
                        {/*    }*/}
                        {/*/>*/}
                        <MenuButton
                            onClick={() => handlePick("STUDY")}
                            title="Study Group Meeting"
                            subtitle="Create a Study Group"
                            icon={
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth={1.75}
                                    className="w-5 h-5"
                                >
                                    <path d="M3 7l9-4 9 4-9 4-9-4Z" />
                                    <path d="M12 11v9" />
                                    <path d="M7 9v9a5 5 0 0 0 10 0V9" />
                                </svg>
                            }
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* create (+) button */}
            <motion.button
                id={`${id}-fab`}
                type="button"
                aria-expanded={open}
                aria-haspopup="menu"
                onClick={() => setOpen((v) => !v)}
                whileTap={{ scale: 0.96 }}
                className="group flex items-centerfocus:outline-none focus-visible:ring-2 focus-visible:ring-black/40"
            >
                <motion.span
                    initial={false}
                    animate={{ rotate: open ? 45 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="grid place-items-center size-10 rounded-full text-white bg-black hover:bg-gray-800 transition-colors shadow-inner"
                    aria-hidden
                >
                    {/* Plus icon */}
                    <svg
                        viewBox="0 0 24 24"
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path d="M12 5v14M5 12h14" />
                    </svg>
                </motion.span>
            </motion.button>
        </div>
    )
}

/**
 * {@link MenuButton}
 */
type MenuButtonProps = {
    onClick: () => void
    title: string
    subtitle?: string
    icon?: React.ReactNode
}

/**
 * A button within {@link Create}.
 *
 * @param onClick When this menu button is clicked.
 * @param title Title.
 * @param subtitle Subtitle.
 * @param icon The icon for the button.
 * @constructor
 */
function MenuButton({ onClick, title, subtitle, icon }: MenuButtonProps) {
    return (
        <motion.button
            type="button"
            onClick={onClick}
            role="menuitem"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className="w-full text-left p-3 rounded-xl hover:bg-neutral-100 focus:bg-neutral-100 focus:outline-none"
        >
            <div className="flex items-start gap-3">
                <div className="shrink-0 mt-0.5 text-neutral-700">{icon}</div>
                <div>
                    <div className="text-sm font-semibold text-neutral-900">
                        {title}
                    </div>
                    {subtitle && (
                        <div className="text-xs text-neutral-500 mt-0.5">
                            {subtitle}
                        </div>
                    )}
                </div>
            </div>
        </motion.button>
    )
}
