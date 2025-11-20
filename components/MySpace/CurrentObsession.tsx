"use client"

import { addObsession } from "@/app/actions";
import * as z from "zod";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const DescriptionSchema = z.object({
    description: z.string().min(5, "Description must be at least 5 characters").max(230, "Description must be at most 230 characters")
})

export default function CurrentObsession() {
    const [error, setError] = useState<string>("");
    const [showSuccess, setShowSuccess] = useState(false);
    const [description, setDescription] = useState("")


        async function handleSubmit(formData: FormData) {
            setError("");

            const description = formData.get("description") as string;
            
            const result = DescriptionSchema.safeParse({ description });
            
            if (!result.success) {
                setError(result.error.issues[0].message);
                return;
            }

            try {
                await addObsession(formData);
                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 3000);
                setDescription("");
            } catch (err) {
                setError("Failed to update obsession");
            }
        }


    return (
        <section>
            <h1 className="text-3xl my-6">Obsession</h1>
            <h2 className="text-xl">Update your current obsession (this will be shown on home page):</h2>
            <form className="py-4 w-full flex flex-col gap-4" action={handleSubmit}>
                <textarea 
                    placeholder="My new obsession is...." 
                    name="description" 
                    className={`w-full border  rounded-[20px] resize-none outline-none px-6 py-2 min-h-[100px] ${error ? "border-red-600" : "border-accent"}`}
                    value={description}
                    onChange={(e => setDescription(e.target.value))}
                />
                {error && <p className="text-red-600 text-sm">{error}</p>}
                <button 
                    type="submit"
                    className="bg-accent rounded-lg uppercase text-white font-semibold cursor-pointer hover:scale-110 transition px-6 py-2 ml-auto"
                >
                    Update
                </button>
            </form>

            <AnimatePresence>
                {showSuccess && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.3 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
                        className="fixed bottom-8 right-8 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg"
                    >
                        <p className="font-semibold">✓ Obsession updated successfully!</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    )
}