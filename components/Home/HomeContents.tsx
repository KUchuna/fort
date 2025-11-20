import HomeLeft from "./HomeLeft";
import HomeRight from "./HomeRight";
import { getObsession } from "@/api";

export default async function HomeContents() {

    const obsession = await getObsession()

    return (
        <section className="py-6 flex min-h-screen items-stretch gap-6">
            <HomeLeft obsession={obsession}/>
            <HomeRight />
        </section>
    )
}