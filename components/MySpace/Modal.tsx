"use client";

import { useState } from "react";

export default function MySpaceAuthModal() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const res = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/auth-check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    const data = await res.json();

    if (data.ok) {
      window.location.reload(); 
    } else {
      setError("Incorrect password");
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
          className="border bg-white focus:outline-none border-accent rounded-lg p-2"
          placeholder="Password"
        />

        {error && (
          <p className="text-red-500 text-sm text-center">{error}</p>
        )}

        <button
          type="submit"
          className="bg-accent text-white font-bold uppercase rounded-lg p-2"
        >
          submit
        </button>
      </form>
    </div>
  );
}
