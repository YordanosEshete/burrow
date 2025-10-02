import {Toaster} from "react-hot-toast"

import {Route, Routes} from "react-router"
import HomeView from "@pages/home/Home.view.tsx"
import Meeting from "@pages/meetings/overview/Meeting.view.tsx"
import AllMeetings from "@pages/meetings/AllMeetings.view.tsx"
import LandingView from "@pages/landing/Landing.view.tsx"
import Settings from "@pages/settings/Settings.view.tsx"
import Header from "./features/header/Header.tsx"
import About from "@pages/about/About.tsx"
import useUser from "@features/auth/api/hooks/useUser.ts"
import useToken from "@features/auth/api/hooks/useToken.ts"
import NotFound from "@pages/notfound/NotFound.view.tsx"

import "./index.css"
import OpenMeeting from "@pages/meetings/open/OpenMeeting.view.tsx";

function App() {
    // load user information & ensure logged in
    useUser()
    const auth = useToken()

    return (
        <div className="min-h-screen w-full flex flex-col">
            <Toaster/>

            {auth !== null && <Header/>}

            <main className="max-w-screen md:min-w-xl md:m-auto mb-8 mx-4 flex-grow">
                <Routes>
                    <Route path="/" element={<HomeView/>}/>
                    <Route path="/about" element={<About/>}/>
                    <Route path="/settings" element={<Settings/>}/>
                    <Route path="/welcome" element={<LandingView/>}/>
                    <Route
                        path="/clubs"
                        element={<AllMeetings type="CLUB"/>}
                    />
                    <Route
                        path="/study"
                        element={<AllMeetings type="STUDY"/>}
                    />
                    <Route
                        path="/meeting/:id/open"
                        element={<OpenMeeting/>}
                    />
                    <Route path="/meeting/:id" element={<Meeting/>}/>
                    <Route path="*" element={<NotFound/>}/>
                </Routes>
            </main>

            <footer className="mt-auto py-4 text-center text-sm text-gray-500 border-t">
                © {new Date().getFullYear()} Burrow at UMN <br/>
                Not affiliated with the University of Minnesota
            </footer>
        </div>
    )
}

export default App
