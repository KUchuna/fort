"use server"
import { neon } from '@neondatabase/serverless';
import { revalidatePath, updateTag } from 'next/cache';
import { cookies } from 'next/headers';

export async function addObsession(formData: FormData) {
    const cookieStore = await cookies();
    const auth = cookieStore.get("myspace_auth")

    if (!auth || auth.value !== "true") {
        throw new Error("Unauthorized");
    }

    const sql = neon(`${process.env.DB_DATABASE_URL}`);
    const description = formData.get('description');
    if (!description || typeof description !== 'string') {
    throw new Error('Description is required and must be a string');
    }


    await sql`
        INSERT INTO obsession (description) 
        VALUES (${description})
    `;

    updateTag("obsession")
}