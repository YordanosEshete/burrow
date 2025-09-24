import { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import { updateUser } from "@features/auth/api/user.api.ts"
import useToken from "@features/auth/api/hooks/useToken.ts"
import useUser from "@features/auth/api/hooks/useUser.ts"

/**
 * User settings page.
 */
export default function Settings() {
    const auth = useToken()
    const user = useUser()

    const nav = useNavigate()

    // State for editable fields
    const [name, setName] = useState<string>("")
    const [phoneNumber, setPhoneNumber] = useState<string>("")
    const [errors, setErrors] = useState<string[]>([])

    // submit the stuff
    async function onSubmit() {
        if (!user) return

        const nextErrors: string[] = []
        setErrors([])

        // Basic client-side validation (optional, keep minimal)
        if (name.trim().length === 0) {
            nextErrors.push("Name cannot be empty.")
        }

        try {
            if (nextErrors.length === 0 && auth != null) {
                // if number has been changed
                if (phoneNumber !== user.phoneNumber) {
                    await updateUser(auth, "phone", phoneNumber)
                }

                // if name has been changed
                if (name !== user.name) {
                    await updateUser(auth, "name", name)
                }
            }
        } catch (e: any) {
            nextErrors.push(e?.message || "Failed to save settings.")
        } finally {
            if (nextErrors.length > 0) setErrors(nextErrors)
        }
    }

    useEffect(() => {
        if (user) {
            setName(user.name ?? "")
            setPhoneNumber(user.phoneNumber ?? "")
        }
    }, [user])

    if (auth === "") {
        nav("/welcome")
        return <></>
    }

    if (user == null) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-gray-500">Loading...</div>
            </div>
        )
    }

    return (
        <div className="mx-auto w-full">
            <div className="mb-3 flex items-center justify-between">
                <h2 className="text-2xl figtree mt-8">Settings</h2>
            </div>

            {/* errors provided by backend */}
            {errors.length > 0 && (
                <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">
                    <p className="font-medium mb-1">
                        Please fix the following:
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                        {errors.map((err, i) => (
                            <li key={i}>{err}</li>
                        ))}
                    </ul>
                </div>
            )}

            <form
                className="space-y-8"
                onSubmit={async (e) => {
                    e.preventDefault()
                    await onSubmit()
                }}
            >
                {/* user's name */}
                <div>
                    <label
                        htmlFor="name"
                        className="block text-sm font-medium text-gray-700 mb-1"
                    >
                        Name
                    </label>
                    <input
                        id="name"
                        type="text"
                        className="block w-full rounded-lg border border-gray-200 bg-white p-2.5 shadow-sm focus:border-blue-400 focus:outline-none focus:ring focus:ring-blue-100"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>

                {/* user's email (cannot be changed) */}
                <div>
                    <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-700 mb-1"
                    >
                        Email
                    </label>
                    <input
                        id="email"
                        type="email"
                        className="block w-full rounded-lg border border-gray-200 bg-gray-50 p-2.5 text-gray-600 shadow-sm"
                        value={user.email}
                        readOnly
                    />
                    <p className="mt-2 text-xs text-gray-500">
                        This account is connected to your Google account.
                    </p>
                </div>

                {/* user's phone */}
                <div>
                    <label
                        htmlFor="phoneNumber"
                        className="block text-sm font-medium text-gray-700 mb-1"
                    >
                        Phone Number (optional)
                    </label>

                    <input
                        id="phoneNumber"
                        type="tel"
                        className="block w-full rounded-lg border border-gray-200 bg-white p-2.5 shadow-sm focus:border-blue-400 focus:outline-none focus:ring focus:ring-blue-100"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                </div>

                {/* save it up up up!*/}
                <div className="pt-2 flex flex-row gap-2">
                    <button
                        type="submit"
                        className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
                    >
                        Save
                    </button>

                    <button className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-red-700">
                        Delete my Account
                    </button>
                </div>
            </form>
        </div>
    )
}
