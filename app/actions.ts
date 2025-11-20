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

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Spotify Transfer Failed: ${res.status} ${res.statusText} - ${errorBody}`);
  }
}


export async function playContent(deviceId: string, uri: string, isContext: boolean = false) {
  const token = await getAccessToken();
  
  const body = isContext 
    ? { context_uri: uri } 
    : { uris: [uri] };

  const res = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok && res.status !== 204) {
    const errorBody = await res.text();
    console.error("Play Content Error", errorBody);
    throw new Error(`Failed to play content: ${res.statusText}`);
  }
}

export async function getUserPlaylists() {
  const token = await getAccessToken();
  
  const res = await fetch('https://api.spotify.com/v1/me/playlists?limit=50', {
    headers: { 
      Authorization: `Bearer ${token}` 
    },
    cache: 'no-store' 
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Playlist Fetch Error:", res.status, err);
    throw new Error(`Failed to fetch playlists: ${res.statusText}`);
  }
  
  const data = await res.json();
  return data.items;
}

export async function searchSpotify(query: string) {
  if (!query) return [];
  const token = await getAccessToken();
  
  const params = new URLSearchParams({
    q: query,
    type: 'track',
    limit: '10'
  });

  const res = await fetch(`https://api.spotify.com/v1/search?${params}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) throw new Error('Failed to search');
  
  const data = await res.json();
  return data.tracks.items;
}

export async function getPlaylistTracks(playlistId: string) {
  const token = await getAccessToken();
  const res = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=50`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch tracks');
  const data = await res.json();
  return data.items.map((item: any) => item.track);
}

export async function toggleShuffle(deviceId: string, state: boolean) {
  const token = await getAccessToken();
  await fetch(`https://api.spotify.com/v1/me/player/shuffle?state=${state}&device_id=${deviceId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` }
  });
}

export async function setRepeatMode(deviceId: string, state: 'track' | 'context' | 'off') {
  const token = await getAccessToken();
  await fetch(`https://api.spotify.com/v1/me/player/repeat?state=${state}&device_id=${deviceId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` }
  });
}