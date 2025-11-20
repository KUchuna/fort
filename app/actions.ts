"use server";

import { neon } from "@neondatabase/serverless";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export async function addObsession(formData: FormData) {
    const cookieStore = await cookies();
    const auth = cookieStore.get("myspace_auth");

    if (!auth || auth.value !== "true") {
        throw new Error("Unauthorized");
    }

    const sql = neon(`${process.env.DB_DATABASE_URL}`);
    const description = formData.get("description");

    if (!description || typeof description !== "string") {
        throw new Error("Description is required and must be a string");
    }

    await sql`
        INSERT INTO obsession (description) 
        VALUES (${description})
    `;

    revalidatePath("/");
}


export async function getAccessToken() {
  const refresh_token = process.env.SPOTIFY_REFRESH_TOKEN;
  const client_id = process.env.SPOTIFY_CLIENT_ID;
  const client_secret = process.env.SPOTIFY_CLIENT_SECRET;

  const basic = Buffer.from(`${client_id}:${client_secret}`).toString('base64');

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refresh_token!,
    }),
    cache: 'no-store',
  });

  const data = await response.json();
  return data.access_token;
}


export async function transferPlayback(deviceId: string) {
  const token = await getAccessToken();
  
  const res = await fetch('https://api.spotify.com/v1/me/player', {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      device_ids: [deviceId],
      play: true,
    }),
  });

  // CRITICAL ADDITION: Throw error if Spotify says "No"
  if (!res.ok) {
    const errorBody = await res.text(); // Get error details
    throw new Error(`Spotify Transfer Failed: ${res.status} ${res.statusText} - ${errorBody}`);
  }
}
