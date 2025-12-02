"use server";

import { neon } from "@neondatabase/serverless";
import { revalidatePath } from "next/cache";
import { del } from '@vercel/blob';
import Pusher from 'pusher';
import { cookies, headers } from "next/headers";
import { wishlistItem, timeEntries, workTasks, workTodos } from "@/lib/auth-schema";
import {auth} from "@/lib/auth"
import { db } from "@/lib/db";
import { eq, and, isNull } from "drizzle-orm";

const sql = neon(process.env.DB_DATABASE_URL!);
const SPOTIFY_API = 'https://api.spotify.com/v1';

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,       // Private
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!, // Public
  secret: process.env.PUSHER_SECRET!,     // Private
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!, // Public
  useTLS: true
});

export async function addObsession(formData: FormData) {

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

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

export async function searchSpotify(query: string) {
  const token = await getAccessToken();
  const res = await fetch(`${SPOTIFY_API}/search?q=${encodeURIComponent(query)}&type=track&limit=20`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
}

export async function getUserPlaylists() {
  const token = await getAccessToken();
  const res = await fetch(`${SPOTIFY_API}/me/playlists?limit=50`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
}

export async function getUserLikedSongs() {
  const token = await getAccessToken();
  const res = await fetch(`${SPOTIFY_API}/me/tracks?limit=50`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
}

export async function getPlaylistDetails(playlistHref: string) {
  const token = await getAccessToken();
  
  const res = await fetch(playlistHref, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const playlist = await res.json();

  let allTracks = playlist.tracks.items;
  let nextUrl = playlist.tracks.next;

  while (nextUrl) {
    const nextRes = await fetch(nextUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const nextData = await nextRes.json();

    allTracks = [...allTracks, ...nextData.items];
    
    nextUrl = nextData.next;
  }

  return {
    ...playlist,
    tracks: {
      ...playlist.tracks,
      items: allTracks,
      total: allTracks.length
    }
  };
}

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
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");
  
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


export async function deleteTodo(id: number) {
  if (id > 2147483647) return;

  await sql`
    DELETE FROM todos 
    WHERE id = ${id}
  `;
  
  revalidatePath('/');
}


export interface GalleryImage {
  id: number;
  url: string;
  title: string | null;
  created_at: string;
  pathname: string; 
  comment_count?: number;
  alt_text: string;
  width: number;
  height: number;
  blur_data_url: string;
  likes_count: number;
}

export interface Comment {
  id: number;
  image_id: number;
  user_name: string;
  content: string;
  created_at: string;
}

export async function getImages() {
  const images = await sql`
    SELECT 
      images.*, 
      COUNT(comments.id) as comment_count 
    FROM images 
    LEFT JOIN comments ON images.id = comments.image_id 
    GROUP BY images.id 
    ORDER BY images.created_at DESC
  `;
  return images as GalleryImage[];
}

export async function getComments(imageId: number) {
  const comments = await sql`
    SELECT * FROM comments 
    WHERE image_id = ${imageId} 
    ORDER BY created_at DESC
  `;
  return comments as Comment[];
}

export async function saveImageToDb(url: string, pathname: string, title: string) {
  
  if (!url || !pathname) {
    throw new Error('Missing required image data');
  }

  const safeTitle = title || 'Untitled';

  try {
    await sql`
      INSERT INTO images (url, pathname, title) 
      VALUES (${url}, ${pathname}, ${safeTitle})
    `;

    revalidatePath('/gallery');
    return { success: true };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to save image to database');
  }
}

export async function addComment(imageId: number, content: string, userName: string = 'Guest') {
  if (!content.trim()) return;

  await sql`
    INSERT INTO comments (image_id, content, user_name) 
    VALUES (${imageId}, ${content}, ${userName})
  `;

  revalidatePath('/gallery');
}

export async function deleteImage(id: number, pathname: string) {
  try {
    if (pathname) {
      await del(pathname);
    }

    await sql`
      DELETE FROM images 
      WHERE id = ${id}
    `;

    revalidatePath('/gallery');
    return { success: true };
  } catch (error) {
    console.error("Failed to delete image:", error);
    throw new Error("Failed to delete image");
  }
}

export async function deleteComment(commentId: number) {
  await sql`DELETE FROM comments WHERE id = ${commentId}`;
  revalidatePath('/gallery');
  return { success: true };
}



export async function sendMessage(formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  const text = formData.get('text') as string;
  if (!text) return;
  
  const username = session.user.name

  await sql`
    INSERT INTO messages (text, username) 
    VALUES (${text}, ${username})
  `;

  await pusher.trigger('global-chat', 'new-message', {
    text,
    username,
    timestamp: new Date().toISOString()
  });
}
export async function getChatHistory() {
  const messages = await sql`
    SELECT * FROM messages 
    ORDER BY created_at DESC 
    LIMIT 50
  `;
  return messages.reverse();
}

export async function addWishlistItem(formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  const title = formData.get("title") as string;
  const url = formData.get("url") as string;
  const price = formData.get("price") as string;
  const priority = formData.get("priority") as string;

  await db.insert(wishlistItem).values({
    id: crypto.randomUUID(),
    userId: session.user.id,
    title,
    url,
    price,
    priority,
  });

  revalidatePath("/wishlist");
}

export async function deleteWishlistItem(itemId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  await db.delete(wishlistItem).where(
    and(
      eq(wishlistItem.id, itemId),
      eq(wishlistItem.userId, session.user.id)
    )
  );

  revalidatePath("/wishlist");
}

export async function startTimer(clientName: string, description: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  // Safety: Stop any currently running timer first
  const activeTimer = await db.query.timeEntries.findFirst({
    where: and(
        eq(timeEntries.userId, session.user.id), 
        isNull(timeEntries.endTime)
    ),
  });

  if (activeTimer) {
    await stopTimer();
  }

  // Start new one
  await db.insert(timeEntries).values({
    id: crypto.randomUUID(),
    userId: session.user.id,
    clientName,
    description,
    startTime: new Date(),
  });

  revalidatePath("/work");
}

export async function stopTimer() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  const now = new Date();

  // Find the running task
  const activeTimer = await db.query.timeEntries.findFirst({
    where: and(
        eq(timeEntries.userId, session.user.id), 
        isNull(timeEntries.endTime)
    ),
  });

  if (!activeTimer) return;

  const durationSeconds = Math.floor((now.getTime() - activeTimer.startTime.getTime()) / 1000);

  await db.update(timeEntries)
    .set({ endTime: now, duration: durationSeconds })
    .where(eq(timeEntries.id, activeTimer.id));

  revalidatePath("/work");
}

export async function createTask(formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  const title = formData.get("title") as string;
  const clientName = formData.get("clientName") as string;
  const priority = formData.get("priority") as string;

  await db.insert(workTasks).values({
    id: crypto.randomUUID(),
    userId: session.user.id,
    title,
    clientName,
    priority,
    status: "to_request", // Default column
  });

  revalidatePath("/work");
}

export async function updateTaskStatus(taskId: string, newStatus: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  await db.update(workTasks)
    .set({ status: newStatus })
    .where(and(eq(workTasks.id, taskId), eq(workTasks.userId, session.user.id)));

  revalidatePath("/work");
}

export async function deleteTask(taskId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  await db.delete(workTasks)
    .where(and(eq(workTasks.id, taskId), eq(workTasks.userId, session.user.id)));

  revalidatePath("/work");
}

export async function createWorkTodo(formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  await db.insert(workTodos).values({
    id: crypto.randomUUID(),
    userId: session.user.id,
    title: formData.get("title") as string,
    clientName: formData.get("clientName") as string,
    description: formData.get("description") as string,
    dueDate: formData.get("dueDate") ? new Date(formData.get("dueDate") as string) : null,
    isCompleted: false,
  });

  revalidatePath("/work");
}

export async function toggleWorkTodo(id: string, currentState: boolean) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  await db.update(workTodos)
    .set({ isCompleted: !currentState })
    .where(and(eq(workTodos.id, id), eq(workTodos.userId, session.user.id)));

  revalidatePath("/work");
}

export async function deleteWorkTodo(id: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  await db.delete(workTodos)
    .where(and(eq(workTodos.id, id), eq(workTodos.userId, session.user.id)));

  revalidatePath("/work");
}