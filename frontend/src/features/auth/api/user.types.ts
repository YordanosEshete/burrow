/**
 * The authorized user.
 *
 * @param user The user object.
 * @param newUser If the user's account is new.
 * @param token An authorization token.
 */
export type AuthorizedUser = {
    user: User
    newUser: boolean
    token: string
}

/**
 * A user object.
 *
 * @param googleID The ID provided by Google.
 * @param name The user-selected (initially from Google) name.
 * @param email The email provided by Google. (unchangeable)
 * @param phoneNumber The user-selected phone number. (optional)
 * @param createdAt When the user created their account.
 */
export type User = {
    googleID: string
    name: string
    email: string
    phoneNumber: string
    createdDate: number
}
