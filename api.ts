"use server";
import { neon } from '@neondatabase/serverless';
import { cacheTag } from 'next/cache';

const sql = neon(process.env.DB_DATABASE_URL!);

export async function getObsession() {
  'use cache'
  cacheTag('obsession')
  try {
    const obsessions = await sql`
      SELECT *
      FROM obsession
      ORDER BY id DESC
      LIMIT 1
    `;
    
    return obsessions[0] ?? { id: 0, description: "" }
  } catch (error) {
    console.error("Error fetching obsession:", error);
    return null;
  }
}
