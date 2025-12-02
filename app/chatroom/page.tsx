import ChatRoomLayout from "@/components/Chatroom/ChatRoomLayout";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function ChatRoom() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");
  
  return <ChatRoomLayout />;
}