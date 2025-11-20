"use server"
import { neon } from '@neondatabase/serverless';

export async function addObsession(formData: FormData) {
    const sql = neon(`${process.env.DB_DATABASE_URL}`);
    const description = formData.get('description');
    if (!description || typeof description !== 'string') {
    throw new Error('Description is required and must be a string');
    }


    await sql`
        INSERT INTO obsession (description) 
        VALUES (${description})
    `;
}