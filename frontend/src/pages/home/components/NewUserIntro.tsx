/**
 * Small intro to Burrow for new users.
 */
export default function NewUserIntro() {
    return (
        <section className="bg-white rounded-2xl shadow p-6 text-gray-700 col-span-12">
            <h1 className="text-2xl font-bold mb-4 text-gray-900">
                Welcome to Burrow!
            </h1>

            <p className="mb-4">
                Burrow helps students find study groups and connect with other
                students to enhance their learning experience.
            </p>

            <p className="mb-4">
                Simply click on a study group, click join, and attend to meet
                new study mates and improve your learning.
            </p>

            <p className="mb-4">
                Your name was imported from Google. If you'd like to change it,
                please press the top right button and Settings.
            </p>
        </section>
    )
}
