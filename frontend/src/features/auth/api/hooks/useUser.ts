import type { User } from "../user.types.ts"
import { useAtom } from "jotai"
import { authToken } from "../auth.atom.ts"
import { useQuery } from "@tanstack/react-query"
import { getUser } from "@features/auth/api/user.api.ts"

/**
 * Retrieve the `User` object.
 */
export default function useUser(): User | null {
    const [auth, setAuth] = useAtom(authToken)

    const { data, error } = useQuery({
        queryKey: ["user"],
        enabled: auth !== "",
        queryFn: () => getUser(auth)
    })

    // if the request fails, log the user out
    if (auth !== "" && error) {
        setAuth("")
    }

    // the user is not logged in
    if (!auth || auth === "" || !data) {
        return null
    }

    return data
}
