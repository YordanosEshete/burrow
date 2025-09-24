import { useEffect } from "react"
import { useNavigate } from "react-router"
import Create from "@features/create/components/Create.tsx"
import useToken from "@features/auth/api/hooks/useToken.ts"
import PreviewGroupMeetings from "@pages/home/components/PreviewGroupMeetings.tsx"
import Schedule from "@features/schedule/components/Schedule.tsx"
import { useAtom } from "jotai"
import { newUser } from "@features/auth/api/auth.atom.ts"
import NewUserIntro from "@pages/home/components/NewUserIntro.tsx"

/**
 * The homepage `/`.
 *
 * @constructor
 */
export default function HomeView() {
    const nav = useNavigate()
    const auth = useToken()
    const [isNewUser] = useAtom(newUser)

    useEffect(() => {
        if (auth === null) {
            nav("/welcome")
        }
    }, [auth, nav])

    return (
        <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-6 grid grid-cols-12 gap-6">
            {/* show intro only if it's a new user*/}
            {isNewUser && <NewUserIntro />}

            <section
                aria-label="Group discovery"
                className="col-span-12 lg:col-span-8 space-y-6 mt-4"
            >
                <PreviewGroupMeetings
                    title={"Study Groups"}
                    fullPage={"/study"}
                    kind={"STUDY"}
                    amount={3}
                />

                <PreviewGroupMeetings
                    title={"Clubs"}
                    fullPage={"/clubs"}
                    kind={"CLUB"}
                    amount={3}
                />
            </section>

            <aside
                aria-label="Utilities"
                className="col-span-12 lg:col-span-4 space-y-6"
            >
                <Schedule />
            </aside>

            <Create visible={true} />
        </div>
    )
}
