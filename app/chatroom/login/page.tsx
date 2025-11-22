import { verifyChatAccess } from '@/lib/auth'; // Ensure path is correct
import { redirect } from 'next/navigation';
import ChatLoginForm from '@/components/ChatLoginForm';

export default async function LoginPage() {
  const isAuthorized = await verifyChatAccess();

  if (isAuthorized) {
    redirect("/chatroom");
  }

  return <ChatLoginForm />;
}