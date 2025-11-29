import { verifyChatAccess } from '@/lib/own-auth'; // Ensure path is correct
import { redirect } from 'next/navigation';
import ChatLoginForm from '@/components/Chatroom/ChatLoginForm';

export default async function LoginPage() {
  const isAuthorized = await verifyChatAccess();

  if (isAuthorized) {
    redirect("/chatroom");
  }

  return <ChatLoginForm />;
}