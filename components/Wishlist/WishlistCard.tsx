"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, ExternalLink, User as UserIcon, ChevronDown } from "lucide-react";
import { deleteWishlistItem } from "@/app/actions";

interface Item {
  id: string;
  title: string;
  price: string | null;
  priority: string | null;
  url: string | null;
}

interface UserCardProps {
  user: {
    id: string;
    name: string;
    image: string | null;
  };
  items: Item[];
  isCurrentUser: boolean;
}

export default function WishlistCard({ user, items, isCurrentUser }: UserCardProps) {
  const [isExpanded, setIsExpanded] = useState(isCurrentUser);

  return (
    <div className="bg-white/50 rounded-[2rem] border border-[#FADCD9] overflow-hidden transition-colors hover:bg-white/80">
      
      {/* Clickable Header */}
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-8 text-left outline-none group/header"
      >
        <div className="flex items-center gap-4 min-w-0 flex-1">
          {/* Avatar (Fixed Width) */}
          <div className="flex-shrink-0">
            {user.image ? (
              <img src={user.image} alt={user.name} className="w-12 h-12 rounded-full border-2 border-white shadow-sm" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-[#FADCD9] flex items-center justify-center text-[#F8AFA6]">
                <UserIcon className="w-6 h-6" />
              </div>
            )}
          </div>
          
          {/* User Info (Flexible Width) */}
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold text-black flex items-center gap-2">
              <span className="truncate">{user.name}</span>
              {isCurrentUser && (
                <span className="flex-shrink-0 text-xs bg-[#F8AFA6] text-white px-2 py-1 rounded-full uppercase tracking-wider">You</span>
              )}
            </h2>
            <p className="text-sm text-gray-400">
                {items.length} {items.length === 1 ? 'wish' : 'wishes'}
            </p>
          </div>
        </div>

        {/* Chevron Icon */}
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="ml-4 flex-shrink-0 text-gray-400 bg-white p-2 rounded-full shadow-sm group-hover/header:text-[#F8AFA6] transition-colors"
        >
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </button>

      {/* Expandable Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="px-8 pb-8">
              {items.length === 0 ? (
                <div className="text-gray-400 italic text-sm">No wishes added yet...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="group relative bg-white rounded-2xl p-5 shadow-sm border border-transparent hover:border-[#F8AFA6] transition-all duration-300 hover:shadow-lg flex flex-col"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <span
                          className={`flex-shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full 
                          ${item.priority === "high" ? "bg-red-100 text-red-600" : 
                            item.priority === "medium" ? "bg-orange-100 text-orange-600" : 
                            "bg-green-100 text-green-600"}`}
                        >
                          {item.priority}
                        </span>
                        
                        {/* Delete Button */}
                        {isCurrentUser && (
                          <form action={deleteWishlistItem.bind(null, item.id)} className="ml-2">
                            <button className="text-gray-300 hover:text-red-400 transition-colors p-1">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </form>
                        )}
                      </div>

                      {/* --- FIX 1: Title Truncation --- */}
                      {/* 'truncate' forces one line. 'title' attribute shows full text on hover */}
                      <h3 
                        className="font-bold text-black mb-1 truncate w-full" 
                        title={item.title} 
                      >
                        {item.title}
                      </h3>

                      {/* --- FIX 2: Price Truncation --- */}
                      <p 
                        className="text-[#F8AFA6] font-bold mb-4 text-sm truncate w-full"
                        title={item.price ? `$${item.price}` : "Priceless"}
                      >
                         {item.price ? `$${item.price}` : "Priceless"}
                      </p>

                      <div className="mt-auto">
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-black transition-colors truncate max-w-full"
                          >
                            <span className="truncate">Visit Link</span> 
                            <ExternalLink className="w-3 h-3 flex-shrink-0" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}