import LiveChat from "@/components/Chatroom/LiveChat";
import { verifyChatAccess } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ChatRoom() {
  const isAuthorized = await verifyChatAccess();

  if (!isAuthorized) {
    redirect("/chatroom/login");
  }
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-pink-50/30">
      <div className="w-full max-w-md p-4">
         <h1 className="text-2xl font-bold text-pink-500 text-center mb-6">
            The chatroom
         </h1>
         <LiveChat />
      </div>
    </main>
  );
}