"use client";

import { useState } from "react";
import { loginAction } from "@/app/actions";
import { redirect } from "next/navigation";

export default function Login() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await loginAction(password);

    if (result.success) {
      redirect("/myspace") 
    } else {
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
          className="w-full bg-[#F8AFA6] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-[#F8AFA6]/30 flex justify-center items-center group"
        >
          {loading ? "Checking..." : "Submit"}
        </button>
      </form>
    </div>
  );
}