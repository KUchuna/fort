import ChatRoomLayout from "@/components/Chatroom/ChatRoomLayout";
import { verifyChatAccess } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ChatRoom() {
  const isAuthorized = await verifyChatAccess();

  if (!isAuthorized) {
    redirect("/chatroom/login");
  }
  
  return <ChatRoomLayout />;
}