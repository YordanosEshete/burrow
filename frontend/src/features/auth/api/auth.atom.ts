import { atomWithStorage } from "jotai/utils"
import { atom } from "jotai/index"
import type { User } from "./user.types.ts"

/**
 * The authorization token for the backend.
 */
export const authToken = atomWithStorage("auth", "")

/**
 * The user's details.
 */
export const userDetails = atom<User | null>(null)

/**
 * If this user is a new user.
 */
export const newUser = atom<boolean>(false)
