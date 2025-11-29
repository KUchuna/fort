import WishlistLogin from "@/components/Wishlist/WishlistLogin";
import { auth } from "@/lib/auth"; // Import your server auth
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function Login() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    redirect("/wishlist");
  }

  return (
    <main>
      <WishlistLogin />
    </main>
  );
}