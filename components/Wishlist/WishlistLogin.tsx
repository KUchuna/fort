"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Mail, Lock, User, ArrowRight, AlertCircle, KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { z } from "zod";

// --- 1. Update Zod Schemas ---
const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const signUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  // 👇 Add Secret Code Validation
  secretCode: z.string().min(1, "Secret code is required"),
});

type FieldErrors = {
  name?: string[];
  email?: string[];
  password?: string[];
  secretCode?: string[]; // Add type
};

export default function WishlistLogin() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    secretCode: "", // Add state
  });

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFieldErrors({});
    setGeneralError(null);

    const schema = isSignUp ? signUpSchema : signInSchema;
    const result = schema.safeParse(formData);

    if (!result.success) {
      setFieldErrors(result.error.flatten().fieldErrors);
      setIsLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        // --- SIGN UP LOGIC ---
        const { error } = await authClient.signUp.email({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          // @ts-ignore
          secretCode: formData.secretCode, 
          callbackURL: "/email-verified",
        });
        if (error) throw error;
        router.push(`/wishlist/verify-email?email=${encodeURIComponent(formData.email)}`);        
        return;
      } else {
        const { error } = await authClient.signIn.email({
          email: formData.email,
          password: formData.password,
          callbackURL: "/wishlist",
        });
        if (error) throw error;
      }

      router.push("/wishlist");
    } catch (err: any) {
      setGeneralError(err.message || err.body?.message || "Invalid credentials or secret code.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F9F1F0] p-4 font-sans text-black">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-[#FADCD9]"
      >
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2 text-black">
              {isSignUp ? "Join Family" : "Welcome Back"}
            </h1>
            <p className="text-gray-500">
              {isSignUp
                ? "Enter the secret code to join"
                : "Sign in to access your saved items"}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4" noValidate>
            <AnimatePresence mode="wait">
              {isSignUp && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
                  {/* Name Field */}
                  <div>
                    <div className="relative">
                        <User className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
                        <input
                        type="text"
                        placeholder="Full Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className={`w-full pl-10 pr-4 py-3 bg-[#F9F1F0] border focus:bg-white rounded-xl outline-none transition-all duration-200 
                            ${fieldErrors.name 
                            ? "border-red-400 focus:border-red-500" 
                            : "border-transparent focus:border-[#F8AFA6] focus:ring-2 focus:ring-[#FADCD9]"
                            }`}
                        />
                    </div>
                    {fieldErrors.name && (
                        <p className="text-red-500 text-xs mt-1 ml-1">{fieldErrors.name[0]}</p>
                    )}
                  </div>

                  {/* 👇 SECRET CODE FIELD */}
                  <div>
                    <div className="relative">
                        <KeyRound className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
                        <input
                        type="text"
                        placeholder="Secret Family Code"
                        value={formData.secretCode}
                        onChange={(e) => setFormData({ ...formData, secretCode: e.target.value })}
                        className={`w-full pl-10 pr-4 py-3 bg-[#F9F1F0] border focus:bg-white rounded-xl outline-none transition-all duration-200 
                            ${fieldErrors.secretCode 
                            ? "border-red-400 focus:border-red-500" 
                            : "border-transparent focus:border-[#F8AFA6] focus:ring-2 focus:ring-[#FADCD9]"
                            }`}
                        />
                    </div>
                    {fieldErrors.secretCode && (
                        <p className="text-red-500 text-xs mt-1 ml-1">{fieldErrors.secretCode[0]}</p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email Field */}
            <div>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full pl-10 pr-4 py-3 bg-[#F9F1F0] border focus:bg-white rounded-xl outline-none transition-all duration-200 
                    ${fieldErrors.email 
                      ? "border-red-400 focus:border-red-500" 
                      : "border-transparent focus:border-[#F8AFA6] focus:ring-2 focus:ring-[#FADCD9]"
                    }`}
                />
              </div>
              {fieldErrors.email && (
                <p className="text-red-500 text-xs mt-1 ml-1">{fieldErrors.email[0]}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
                <input
                  type="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={`w-full pl-10 pr-4 py-3 bg-[#F9F1F0] border focus:bg-white rounded-xl outline-none transition-all duration-200 
                    ${fieldErrors.password 
                      ? "border-red-400 focus:border-red-500" 
                      : "border-transparent focus:border-[#F8AFA6] focus:ring-2 focus:ring-[#FADCD9]"
                    }`}
                />
              </div>
              {fieldErrors.password && (
                <p className="text-red-500 text-xs mt-1 ml-1">{fieldErrors.password[0]}</p>
              )}
            </div>

            {/* General API Error Message */}
            {generalError && (
              <motion.div
                initial={{ opacity: 0}}
                animate={{ opacity: 1}}
                className="text-red-500 text-sm flex items-center gap-2 justify-center bg-red-50 p-2 rounded-lg"
              >
                <AlertCircle className="w-4 h-4" />
                {generalError}
              </motion.div>
            )}

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isLoading}
              className="w-full bg-[#F8AFA6] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-[#F8AFA6]/30 flex justify-center items-center group"
              type="submit"
            >
              {isLoading ? (
                <Loader2 className="animate-spin h-5 w-5" />
              ) : (
                <>
                  {isSignUp ? "Sign Up" : "Sign In"}
                  <ArrowRight className="h-5 w-5 ml-2 opacity-70" />
                </>
              )}
            </motion.button>
          </form>

          {/* Toggle Login/Signup */}
          <div className="mt-6 text-center text-sm text-gray-500">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              onClick={() => {
                setGeneralError(null);
                setFieldErrors({});
                setIsSignUp(!isSignUp);
              }}
              className="text-black font-semibold hover:underline underline-offset-4 decoration-[#F8AFA6]"
            >
              {isSignUp ? "Log in" : "Enter Code"}
            </button>
          </div>
        </div>
      </motion.div>
    </main>
  );
}