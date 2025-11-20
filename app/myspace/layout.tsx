import Modal from "@/components/MySpace/Modal"
import { cookies } from "next/headers";

export default async function MySpaceLayout({ children }: { children: React.ReactNode }) {

    const cookieStore = await cookies()

    const auth = cookieStore.get("myspace_auth");

    return (
        <>
        {!auth ? <Modal /> : children}
        </>
    );
}
