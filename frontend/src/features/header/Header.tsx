import HeaderDropdown from "./components/HeaderDropdown.tsx"
import { useLocation, useNavigate } from "react-router"
import { AnimatePresence, motion } from "framer-motion"
import { type FormEvent, useEffect, useState } from "react"
import type { GroupMeetingResponse } from "@features/groups/api/groups.types.ts"
import useToken from "@features/auth/api/hooks/useToken.ts"
import SearchPreview from "@features/header/components/SearchPreview.tsx"
import { searchMeetings } from "@features/groups/api/groups.api.ts"

/**
 * The main header :)
 *
 * contains the search and dropdown navigation.
 */
export default function Header() {
    const nav = useNavigate()
    const location = useLocation()
    const auth = useToken()
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false)

    const [query, setQuery] = useState("")
    const [results, setResults] = useState<GroupMeetingResponse[] | null>(null)
    const [loading, setLoading] = useState(false)
    const [err, setErr] = useState<string | null>(null)

    const [debounceKey, setDebounceKey] = useState(0)

    function handleSubmit(e?: FormEvent) {
        if (e) e.preventDefault()
        if (!query.trim()) return
        setMobileSearchOpen(false)
    }

    // debounce effect
    useEffect(() => {
        if (query.trim().length < 2 || auth === null) {
            setResults(null)
            setLoading(false)
            setErr(null)
            return
        }

        const current = debounceKey + 1

        setDebounceKey(current)
        setLoading(true)
        setErr(null)

        const ctrl = new AbortController()

        const searchTimeout = setTimeout(async () => {
            try {
                const data = await searchMeetings(auth, null, query)

                // only set if still current
                if (current === debounceKey + 1 || current === debounceKey) {
                    setResults(data)
                }
            } catch (e: any) {
                if (e?.name !== "AbortError")
                    setErr(e?.message || "Search error")
            } finally {
                setLoading(false)
            }
        }, 250)

        return () => {
            ctrl.abort()
            clearTimeout(searchTimeout)
        }
    }, [query])

    const searchResults = (
        <AnimatePresence>
            {Boolean(results || loading || err) && (
                <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.16 }}
                    className="absolute left-0 right-0 mt-2 rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden"
                >
                    {loading && (
                        <div className="px-3 py-2 text-sm text-gray-600">
                            Searching…
                        </div>
                    )}

                    {err && !loading && (
                        <div className="px-3 py-2 text-sm text-red-600">
                            {err}
                        </div>
                    )}

                    {!loading && !err && results?.length === 0 && (
                        <div className="px-3 py-2 text-sm text-gray-600">
                            No results
                        </div>
                    )}

                    {!loading && !err && results && results.length > 0 && (
                        <ul className="max-h-72 overflow-auto">
                            {results.map(({ meeting }) => (
                                <li key={meeting.id}>
                                    <SearchPreview
                                        meeting={meeting}
                                        onClick={() => {
                                            setResults(null)
                                            setQuery("")
                                        }}
                                    />
                                </li>
                            ))}
                        </ul>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    )
    return (
        <header className="sticky top-0 z-50 w-full bg-[#7a0019]/95 supports-[backdrop-filter]:backdrop-blur text-white shadow-md after:block after:h-px after:bg-white/10">
            <div className="w-full px-4 md:px-6 py-3 md:py-4 flex flex-row items-center justify-between gap-4">
                {/* logo */}
                <div className="flex flex-row items-center gap-3">
                    <h1
                        onClick={() => nav("/")}
                        className="text-3xl md:text-4xl text-[#ffcc33] hover:text-[#ffb71e] cursor-pointer font-extrabold figtree tracking-tight drop-shadow-sm underline-offset-4 hover:underline"
                    >
                        Burrow
                    </h1>
                </div>

                <div className="hidden lg:flex flex-1 justify-center">
                    <form
                        onSubmit={handleSubmit}
                        role="search"
                        className="relative w-full max-w-md"
                    >
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search groups, clubs, or tags..."
                            className="w-full rounded-lg border border-white/20 bg-white/95 px-3 py-2 text-sm text-gray-900 placeholder-gray-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#ffcc33]"
                        />

                        {/* search button*/}
                        <button
                            type="submit"
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 rounded-md bg-[#ffcc33] px-2.5 py-1.5 text-xs font-medium text-gray-900 hover:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ffcc33]"
                            aria-label="Search"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="currentColor"
                                className="h-4 w-4"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1 0 5.64 5.64a7.5 7.5 0 0 0 11.01 11.01z"
                                />
                            </svg>
                        </button>

                        {searchResults}
                    </form>
                </div>

                <div className="flex items-center gap-2 md:gap-3">
                    {/* back button ONLY when not home */}
                    {location.pathname !== "/" &&
                        location.pathname !== "/welcome" && (
                            <motion.button
                                type="button"
                                aria-haspopup="menu"
                                aria-label="Go back"
                                onClick={() => nav(-1)}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#ffcc33] focus-visible:ring-offset-transparent"
                                whileTap={{ scale: 0.97 }}
                                whileHover={{ scale: 1.03 }}
                                transition={{
                                    type: "spring",
                                    stiffness: 600,
                                    damping: 30
                                }}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                    width="20"
                                    height="20"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M21 12a.75.75 0 0 1-.75.75H6.56l5.47 5.47a.75.75 0 1 1-1.06 1.06l-6.75-6.75a.75.75 0 0 1 0-1.06l6.75-6.75a.75.75 0 1 1 1.06 1.06L6.56 11.25H20.25A.75.75 0 0 1 21 12z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </motion.button>
                        )}

                    <button
                        type="button"
                        onClick={() => setMobileSearchOpen((prev) => !prev)}
                        className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ffcc33]"
                        aria-label="Toggle search dropdown"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                            className="h-5 w-5"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1 0 5.64 5.64a7.5 7.5 0 0 0 11.01 11.01z"
                            />
                        </svg>
                    </button>

                    <HeaderDropdown />
                </div>
            </div>

            {/* mobile search stuff*/}
            <AnimatePresence initial={false}>
                {mobileSearchOpen && (
                    <motion.div
                        key="mobile-search"
                        initial={{ opacity: 0, height: 0, y: -6 }}
                        animate={{ opacity: 1, height: "auto", y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -6 }}
                        transition={{
                            type: "spring",
                            stiffness: 420,
                            damping: 36,
                            mass: 0.3
                        }}
                        className="px-4 pb-3 lg:hidden"
                    >
                        <form
                            onSubmit={handleSubmit}
                            role="search"
                            className="relative"
                        >
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search groups, clubs, or tags..."
                                className="w-full rounded-lg border border-white/20 bg-white/95 px-3 py-2 text-sm text-gray-900 placeholder-gray-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#ffcc33]"
                            />
                            <button
                                type="submit"
                                className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 rounded-md bg-[#ffcc33] px-2.5 py-1.5 text-xs font-medium text-gray-900 hover:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ffcc33]"
                                aria-label="Search"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={2}
                                    stroke="currentColor"
                                    className="h-4 w-4"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1 0 5.64 5.64a7.5 7.5 0 0 0 11.01 11.01z"
                                    />
                                </svg>
                            </button>
                            {searchResults}
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    )
}
