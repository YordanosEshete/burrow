import type { ReactNode } from "react"

/** Badge chip */
export default function Badge({ children }: { children: ReactNode }) {
    return (
        <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium tracking-tight text-gray-700 border-gray-200 bg-white">
            {children}
        </span>
    )
}
