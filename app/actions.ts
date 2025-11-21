"use server";

import { neon } from "@neondatabase/serverless";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

const sql = neon(process.env.DB_DATABASE_URL!);

export async function addObsession(formData: FormData) {
    const cookieStore = await cookies();
    const auth = cookieStore.get("myspace_auth");

    if (!auth || auth.value !== "true") {
        throw new Error("Unauthorized");
    }

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


const SPOTIFY_API = 'https://api.spotify.com/v1';

export async function getAccessToken() {
  const refresh_token = process.env.SPOTIFY_REFRESH_TOKEN;
  const client_id = process.env.SPOTIFY_CLIENT_ID;
  const client_secret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!refresh_token || !client_id || !client_secret) {
    throw new Error("Missing Spotify environment variables");
  }

  const basic = Buffer.from(`${client_id}:${client_secret}`).toString('base64');

  // FIX 2: Use the official Spotify Token URL
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refresh_token,
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Spotify Token Error:", response.status, errorText);
    throw new Error(`Failed to get token: ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}
// --- New Features Functions ---

export async function searchSpotify(query: string) {
  const token = await getAccessToken();
  const res = await fetch(`${SPOTIFY_API}/search?q=${encodeURIComponent(query)}&type=track&limit=10`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
}

export async function getUserPlaylists() {
  const token = await getAccessToken();
  const res = await fetch(`${SPOTIFY_API}/me/playlists?limit=20`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
}

export async function getPlaylistDetails(href: string) {
  const token = await getAccessToken();
  const res = await fetch(href, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
}

// --- Playback Control Functions ---

export async function transferPlayback(deviceId: string) {
  const token = await getAccessToken();
  
  const res = await fetch(`${SPOTIFY_API}/me/player`, {
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

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Spotify Transfer Failed: ${res.status} - ${errorBody}`);
  }
}

export async function startPlayback(deviceId: string, contextUri?: string, trackUri?: string, positionMs: number = 0) {
  const token = await getAccessToken();
  
  const body: any = {
    position_ms: positionMs
  };

  if (contextUri) {
    body.context_uri = contextUri;
    if (trackUri) {
      body.offset = { uri: trackUri };
    }
  } else if (trackUri) {
    body.uris = [trackUri];
  }

  const res = await fetch(`${SPOTIFY_API}/me/player/play?device_id=${deviceId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
     const txt = await res.text();
     console.error("Start Playback Error:", txt);
     throw new Error(txt || "Failed to start playback");
  }
}

export async function toggleShuffle(deviceId: string, state: boolean) {
  const token = await getAccessToken();
  const stateStr = state ? 'true' : 'false';
  
  const res = await fetch(`${SPOTIFY_API}/me/player/shuffle?state=${stateStr}&device_id=${deviceId}`, {
    method: 'PUT',
    headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
    }
  });

  if (!res.ok) {
      console.error("Shuffle Toggle Failed:", await res.text());
  }
}

export async function setRepeatMode(deviceId: string, state: 'track' | 'context' | 'off') {
  const token = await getAccessToken();
  await fetch(`${SPOTIFY_API}/me/player/repeat?state=${state}&device_id=${deviceId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` }
  });
}

export async function addTodo(title: string) {
  if (!title || title.trim().length === 0) return;

  const result = await sql`
    INSERT INTO todos (title) 
    VALUES (${title})
    RETURNING *
  `;
  
  revalidatePath('/');
  return result[0];
}


export async function toggleTodo(id: number, isCompleted: boolean) {
  if (id > 2147483647) return;

  await sql`
    UPDATE todos 
    SET is_completed = ${isCompleted} 
    WHERE id = ${id}
  `;
  
  revalidatePath('/');
}

// --- DELETE ---
export async function deleteTodo(id: number) {
  // FIX: Crash Prevention (same logic as above)
  if (id > 2147483647) return;

  await sql`
    DELETE FROM todos 
    WHERE id = ${id}
  `;
  
  revalidatePath('/');
}
