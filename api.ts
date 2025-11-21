"use server";
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DB_DATABASE_URL!);

export async function getObsession() {
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

export async function getTodos() {
  const todos = await sql`
    SELECT * FROM todos 
    ORDER BY created_at DESC
  `;
  return todos;
}
