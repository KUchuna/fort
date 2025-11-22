import HomeLeft from "./HomeLeft";
import HomeRight from "./HomeRight";
import { getObsession } from "@/api";

export default async function HomeContents() {

    const obsession = await getObsession()

    return (
        <section className="py-6 px-4 md:px-0 flex flex-col lg:flex-row min-h-screen items-stretch gap-6">
            <HomeLeft obsession={obsession}/>
            <HomeRight />
        </section>
    )
}