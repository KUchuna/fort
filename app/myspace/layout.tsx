import MySpaceAuthModal from "@/components/MySpace/Modal"
import { verifySession } from '@/lib/auth';



export default async function MySpaceLayout({ children }: { children: React.ReactNode }) {

const isAuthorized = await verifySession();

    if (!isAuthorized) {
        return (
        <div className="min-h-screen flex items-center justify-center">
            <MySpaceAuthModal />
        </div>
        );
    }
    return (
        <>
            {children}
        </>
    );
}
