import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { wishlistItem, user } from "@/lib/auth-schema";
import { desc } from "drizzle-orm";
import WishlistCard from "@/components/Wishlist/WishlistCard";
import WishlistForm from "@/components/Wishlist/WishlistForm";
import { redirect } from "next/navigation";

export default async function CommunityWishlist() {
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session) redirect("/wishlist/login");

  const allUsers = await db.select().from(user);

  const allItems = await db
    .select()
    .from(wishlistItem)
    .orderBy(desc(wishlistItem.createdAt));

  const usersWithItems = allUsers.map((u) => {
    return {
      ...u,
      items: allItems.filter((item) => item.userId === u.id),
      isCurrentUser: u.id === session.user.id,
    };
  }).sort((a, b) => (a.isCurrentUser === b.isCurrentUser ? 0 : a.isCurrentUser ? -1 : 1)); 

  return (
    <main className="min-h-screen bg-[#F9F1F0] pt-24 px-6 md:px-12 pb-12">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-bold font-gilroy text-black mb-2">
            Family Wishes
          </h1>
          <p className="text-gray-500 text-lg">
            See what your loved ones are dreaming of.
          </p>
        </header>

        {/* List of Collapsible User Cards */}
        <div className="space-y-6">
          {usersWithItems.map((user) => (
            (user.items.length > 0 || user.isCurrentUser) && (
              <WishlistCard 
                key={user.id}
                user={user}
                items={user.items}
                isCurrentUser={user.isCurrentUser}
              />
            )
          ))}
        </div>
        
        <WishlistForm />
      </div>
    </main>
  );
}