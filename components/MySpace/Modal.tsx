"use client";

import { useState } from "react";
// You can remove useRouter if you switch to window.location.reload()
// import { useRouter } from "next/navigation"; 
import { loginAction } from "@/app/actions";

export default function MySpaceAuthModal() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  // const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await loginAction(password);

    if (result.success) {
      // 1. Success! Force a browser reload. 
      // This ensures the new 'httpOnly' cookie is recognized 
      // and the parent page re-renders from scratch (removing this modal).
      window.location.reload(); 
    } else {
      // 2. Error: Turn off loading so they can try again
      setError(result.message || "Something went wrong");
      setLoading(false); 
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-background rounded-[20px] p-8 flex flex-col gap-4 w-[300px]"
      >
        <h2 className="text-xl font-semibold text-center">Enter Password</h2>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border bg-white focus:outline-none border-accent rounded-lg p-2 text-black"
          placeholder="Password"
          disabled={loading}
        />

        {error && (
          <p className="text-red-500 text-sm text-center">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="bg-accent text-white font-bold uppercase rounded-lg p-2 disabled:opacity-50 transition-opacity"
        >
          {loading ? "Checking..." : "Submit"}
        </button>
      </form>
    </div>
  );
}