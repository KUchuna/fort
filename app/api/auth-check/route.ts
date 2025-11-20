import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
    const { password } = await request.json();
    const cookieStore = await cookies()
    
    if (password === process.env.MYSPACE_PASSWORD) {
        cookieStore.set("myspace_auth", "true", {
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 7,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
        });

        return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false });
}
