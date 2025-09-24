import { useMemo } from "react"

/**
 * A building at UMN
 *
 * @param name The name of the building.
 * @param query The Google maps query.
 * @param aliases Possible aliases that this hall could go by.
 */
type Building = {
    name: string
    query: string
    aliases?: string[]
}

// possible buildings at the umn
// could be extended
const umnBuildings: Building[] = [
    {
        name: "Lind Hall",
        query: "Lind Hall, University of Minnesota",
        aliases: ["Lind", "LindH", "GOAT"]
    },
    {
        name: "Vincent Hall",
        query: "Vincent Hall, University of Minnesota",
        aliases: ["Vincent"]
    },
    {
        name: "Keller Hall",
        query: "Keller Hall, University of Minnesota",
        aliases: ["Keller", "EE/CS"]
    },
    { name: "Amundson Hall", query: "Amundson Hall, University of Minnesota" },
    {
        name: "Bruininks Hall",
        query: "Bruininks Hall, University of Minnesota",
        aliases: ["Bruininks", "BHH"]
    },
    { name: "Kolthoff Hall", query: "Kolthoff Hall, University of Minnesota" },
    { name: "Smith Hall", query: "Smith Hall, University of Minnesota" },
    { name: "Ford Hall", query: "Ford Hall, University of Minnesota" },
    { name: "Murphy Hall", query: "Murphy Hall, University of Minnesota" },
    { name: "Rapson Hall", query: "Rapson Hall, University of Minnesota" },
    {
        name: "Tate Hall",
        query: "Tate Hall, University of Minnesota",
        aliases: ["Tate"]
    },
    { name: "Fraser Hall", query: "Fraser Hall, University of Minnesota" },
    { name: "Anderson Hall", query: "Anderson Hall, University of Minnesota" },
    { name: "Johnston Hall", query: "Johnston Hall, University of Minnesota" },
    {
        name: "Walter Library",
        query: "Walter Library, University of Minnesota",
        aliases: ["Walter"]
    },
    {
        name: "Wilson Library",
        query: "Wilson Library, University of Minnesota",
        aliases: ["Wilson"]
    },
    {
        name: "Coffman Memorial Union",
        query: "Coffman Memorial Union, University of Minnesota",
        aliases: ["Coffman", "CMU"]
    },
    {
        name: "Northrop",
        query: "Northrop, University of Minnesota",
        aliases: ["Northrop Auditorium"]
    },
    {
        name: "Weisman Art Museum",
        query: "Weisman Art Museum, University of Minnesota",
        aliases: ["WAM"]
    }
]

// api key for maps
// TODO: possibly get our own
const API_KEY = "AIzaSyB2NIWI3Tv9iDPrlnowr_0ZqZWoAQydKJU"

/**
 * {@link MeetingLocation}
 */
type MeetingLocationProps = {
    location: string
}

/**
 * Provides a Google Maps integration off of the user provided meeting location.
 *
 * @param location The user-provided location of the meeting.
 */
export default function MeetingLocation({ location }: MeetingLocationProps) {
    // see if one of the building includes location
    const hit = useMemo(() => {
        const lower = location.toLowerCase()

        for (const building of umnBuildings) {
            if (lower.includes(building.name.toLowerCase()))
                return building.query

            if (building.aliases?.some((a) => lower.includes(a.toLowerCase())))
                return building.query
        }

        return null
    }, [location])

    // if there's no location, show nothing :(
    if (!hit) {
        return <></>
    }

    return (
        <section className="mb-6 rounded-2xl border border-gray-200 bg-gray-50 p-4 shadow-inner">
            <iframe
                width="100%"
                height="260px"
                frameBorder="0"
                src={`https://www.google.com/maps/embed/v1/place?key=${API_KEY}&q=${encodeURIComponent(
                    hit
                )}&maptype=roadmap`}
                allowFullScreen
            />
        </section>
    )
}
