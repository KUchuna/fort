import HomeLeft from "./HomeLeft";
import HomeRight from "./HomeRight";

export default function HomeContents() {
    return (
        <section className="py-6 flex items-center h-full gap-6">
            <HomeLeft />
            <HomeRight />
        </section>
    )
}