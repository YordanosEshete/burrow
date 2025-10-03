import { useEffect, useRef, useState } from "react"
import type { GroupMeeting } from "@features/groups/api/groups.types.ts"
import { QRCodeSVG } from "qrcode.react"

/**
 * {@link ShareMeeting}
 */
type ShareMeetingProps = {
    meeting: GroupMeeting
}

/**
 * The button to share a meeting.
 *
 * @param meeting The meeting to share.
 * @constructor
 */
export default function ShareMeeting({ meeting }: ShareMeetingProps) {
    const [menuOpen, setMenuOpen] = useState(false)
    const [qrOpen, setQrOpen] = useState(false)

    const [menuEnter, setMenuEnter] = useState(false)
    const [qrEnter, setQrEnter] = useState(false)

    const btnRef = useRef<HTMLButtonElement | null>(null)
    const menuRef = useRef<HTMLDivElement | null>(null)

    const shareData = {
        title: meeting.title,
        text: meeting.description ?? meeting.title,
        url: `https://umn.app/${meeting.id}`
    } as ShareData

    useEffect(() => {
        function onClickOutside(e: MouseEvent) {
            if (!menuOpen) return
            const t = e.target as Node
            if (
                menuRef.current &&
                !menuRef.current.contains(t) &&
                btnRef.current &&
                !btnRef.current.contains(t)
            ) {
                setMenuOpen(false)
            }
        }

        function onEsc(e: KeyboardEvent) {
            if (e.key === "Escape") {
                setMenuOpen(false)
                setQrOpen(false)
            }
        }

        document.addEventListener("mousedown", onClickOutside)
        document.addEventListener("keydown", onEsc)

        if (menuOpen) {
            requestAnimationFrame(() => setMenuEnter(true))
        } else {
            setMenuEnter(false)
        }

        if (qrOpen) {
            requestAnimationFrame(() => setQrEnter(true))
        } else {
            setQrEnter(false)
        }

        return () => {
            document.removeEventListener("mousedown", onClickOutside)
            document.removeEventListener("keydown", onEsc)
        }
    }, [menuOpen, qrOpen])

    // the regular share button
    async function handleNativeShare() {
        try {
            if (navigator.share) {
                await navigator.share(shareData)
            } else {
                await navigator.clipboard.writeText(
                    shareData.url ?? "https://umn.app"
                )
                alert("Link copied to clipboard.")
            }
        } catch {
            /* empty */
        } finally {
            setMenuOpen(false)
        }
    }

    return (
        <div className="relative inline-block text-left">
            <button
                ref={btnRef}
                onClick={() => setMenuOpen((v) => !v)}
                className="cursor-pointer inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white p-2 text-sm font-medium text-gray-600 shadow-sm transition hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                aria-label="Share"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                title="Share"
                type="button"
            >
                <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    role="img"
                >
                    <path d="M12 3v11" />
                    <path d="M8.5 6.5L12 3l3.5 3.5" />
                    <path d="M5 13v5a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-5" />
                </svg>
            </button>

            {menuOpen && (
                <div
                    ref={menuRef}
                    role="menu"
                    aria-label="Share options"
                    className={
                        `absolute right-0 z-20 mt-2 w-48 origin-top-right rounded-xl border border-gray-200 bg-white p-1 shadow-lg focus:outline-none ` +
                        `transition duration-150 ease-out transform ` +
                        (menuEnter
                            ? "opacity-100 scale-100 translate-y-0"
                            : "opacity-0 scale-95 -translate-y-1")
                    }
                >
                    <button
                        role="menuitem"
                        onClick={() => {
                            setQrOpen(true)
                            setMenuOpen(false)
                        }}
                        className="cursor-pointer flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                    >
                        {/* QR icon */}
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.6"
                        >
                            <path d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3z" />
                            <path d="M17 13h4v4h-4zM15 19h2M19 21v-2" />
                        </svg>
                        Show QR code
                    </button>
                    <button
                        role="menuitem"
                        onClick={handleNativeShare}
                        className="cursor-pointer flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                    >
                        {/* share icon */}
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.6"
                        >
                            <path d="M12 3v11" />
                            <path d="M8.5 6.5L12 3l3.5 3.5" />
                            <path d="M5 13v5a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-5" />
                        </svg>
                        Share via…
                    </button>
                </div>
            )}

            {/* qr code modal */}
            {qrOpen && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label="Share via QR code"
                    className="fixed inset-0 z-30 flex items-center justify-center"
                >
                    {/* backdrop */}
                    <div
                        className={
                            `absolute inset-0 bg-black/40 transition-opacity duration-200 ` +
                            (qrEnter ? "opacity-100" : "opacity-0")
                        }
                        onClick={() => setQrOpen(false)}
                    />

                    <div
                        className={
                            `relative z-10 w-[min(92vw,420px)] rounded-2xl border border-gray-200 bg-white p-4 shadow-2xl ` +
                            `transform transition duration-200 ease-out ` +
                            (qrEnter
                                ? "opacity-100 scale-100 translate-y-0"
                                : "opacity-0 scale-95 -translate-y-1")
                        }
                    >
                        <div className="mb-3 flex items-start justify-between gap-4">
                            <h3 className="text-base font-semibold text-gray-900">
                                QR Code
                            </h3>

                            <button
                                onClick={() => setQrOpen(false)}
                                className="cursor-pointer rounded-lg p-1 text-gray-500 hover:bg-gray-100"
                                aria-label="Close"
                            >
                                <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <path d="M18 6 6 18M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* qr code */}
                        <div className="flex flex-col items-center">
                            <QRCodeSVG
                                value={shareData.url ?? "https://umn.app"}
                                height={240}
                                width={240}
                                imageSettings={{
                                    src: "/gopher.jpg",
                                    height: 32,
                                    width: 32,
                                    excavate: true
                                }}
                            />

                            <p className="mt-3 max-w-[32ch] text-center text-xs text-gray-500 break-words">
                                {shareData.url}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
