"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Loader2, Link as LinkIcon, DollarSign, AlertCircle } from "lucide-react";
import { addWishlistItem } from "@/app/actions";
import { z } from "zod";

// --- 1. Define Validation Schema ---
const formSchema = z.object({
  title: z.string().min(2, "Item name must be at least 2 characters"),
  // Allow empty string OR a valid number format
  price: z.string().regex(/^\d*\.?\d*$/, "Price must be a number").optional().or(z.literal("")), 
  priority: z.enum(["low", "medium", "high"]),
  // Allow empty string OR valid URL
  url: z.string().url("Please enter a valid URL (include http://)").optional().or(z.literal("")),
});

type FormValues = z.infer<typeof formSchema>;
type FieldErrors = Partial<Record<keyof FormValues, string[]>>;

export default function WishlistForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  
  // --- 2. State for Data & Errors ---
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formData, setFormData] = useState<FormValues>({
    title: "",
    price: "",
    priority: "medium",
    url: "",
  });

  const handleChange = (field: keyof FormValues, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user types
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    setErrors({});

    // --- 3. Validate Data ---
    const result = formSchema.safeParse(formData);

    if (!result.success) {
      setErrors(result.error.flatten().fieldErrors);
      setIsPending(false);
      return;
    }

    try {
      // Create FormData to maintain compatibility with your Server Action
      const submissionData = new FormData();
      submissionData.append("title", formData.title);
      submissionData.append("price", formData.price || "");
      submissionData.append("priority", formData.priority);
      submissionData.append("url", formData.url || "");

      await addWishlistItem(submissionData);
      
      // Reset & Close
      setFormData({ title: "", price: "", priority: "medium", url: "" });
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to add item");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 z-40 bg-[#F8AFA6] text-white p-4 rounded-full shadow-lg shadow-[#F8AFA6]/40 flex items-center gap-2 font-bold"
      >
        <Plus className="w-6 h-6" />
        <span className="hidden md:inline">Add Item</span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-[#FADCD9]"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold font-gilroy text-black">New Wish</h2>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Title Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Item Name</label>
                  <input 
                    value={formData.title}
                    onChange={(e) => handleChange("title", e.target.value)}
                    placeholder="e.g. Vintage Camera" 
                    className={`w-full p-3 bg-[#F9F1F0] rounded-xl outline-none transition-all border
                      ${errors.title 
                        ? "border-red-400 focus:bg-white focus:border-red-500" 
                        : "border-transparent focus:bg-white focus:border-[#F8AFA6] focus:ring-2 focus:ring-[#FADCD9]"
                      }`} 
                  />
                  {errors.title && <p className="text-red-500 text-xs mt-1 ml-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.title[0]}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Price Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Price</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <input 
                        value={formData.price}
                        onChange={(e) => handleChange("price", e.target.value)}
                        placeholder="120.00" 
                        inputMode="decimal"
                        className={`w-full pl-9 p-3 bg-[#F9F1F0] rounded-xl outline-none transition-all border
                        ${errors.price 
                          ? "border-red-400 focus:bg-white focus:border-red-500" 
                          : "border-transparent focus:bg-white focus:border-[#F8AFA6] focus:ring-2 focus:ring-[#FADCD9]"
                        }`} 
                      />
                    </div>
                    {errors.price && <p className="text-red-500 text-xs mt-1 ml-1">{errors.price[0]}</p>}
                  </div>

                  {/* Priority Select */}
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Priority</label>
                    <select 
                      value={formData.priority}
                      onChange={(e) => handleChange("priority", e.target.value)}
                      className="w-full p-3 bg-[#F9F1F0] rounded-xl border-transparent focus:bg-white focus:border-[#F8AFA6] focus:ring-2 focus:ring-[#FADCD9] outline-none transition-all appearance-none"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                {/* URL Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Link (Optional)</label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input 
                      value={formData.url}
                      onChange={(e) => handleChange("url", e.target.value)}
                      type="url" 
                      placeholder="https://..." 
                      className={`w-full pl-9 p-3 bg-[#F9F1F0] rounded-xl outline-none transition-all border
                      ${errors.url 
                        ? "border-red-400 focus:bg-white focus:border-red-500" 
                        : "border-transparent focus:bg-white focus:border-[#F8AFA6] focus:ring-2 focus:ring-[#FADCD9]"
                      }`} 
                    />
                  </div>
                  {errors.url && <p className="text-red-500 text-xs mt-1 ml-1">{errors.url[0]}</p>}
                </div>

                <button
                  disabled={isPending}
                  type="submit"
                  className="w-full bg-[#F8AFA6] text-white font-bold py-3 rounded-xl hover:brightness-110 transition-all flex justify-center items-center gap-2 mt-4"
                >
                  {isPending ? <Loader2 className="animate-spin" /> : "Add to Wishlist"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}