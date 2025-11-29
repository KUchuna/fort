import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createAuthMiddleware, APIError } from "better-auth/api";
import { db } from "./db"; 
import { user, session, account, verification } from "./auth-schema"; 
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: true, 
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
        schema: { user, session, account, verification },
    }),
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true, 
    },
    emailVerification: {
        sendOnSignUp: true,
        autoSignInAfterVerification: true,
        sendVerificationEmail: async ({ user, url, token }, request) => {
            await transporter.sendMail({
                from: process.env.SMTP_FROM,
                to: user.email,
                subject: "Welcome to the Family! please verify email",
                html: `
                    <div style="font-family: sans-serif; padding: 20px; text-align: center;">
                        <h1 style="color: #000;">Welcome to the Family! 🎁</h1>
                        <p style="color: #666; font-size: 16px;">
                            We're so happy to have you here. Please click the button below to verify your email address.
                        </p>
                        <br />
                        <a href="${url}" style="display: inline-block; background: #F8AFA6; color: white; padding: 12px 24px; border-radius: 50px; text-decoration: none; font-weight: bold; font-size: 16px;">
                            Verify Email Address
                        </a>
                        <br /><br />
                        <p style="color: #999; font-size: 12px;">Or copy this link: <br/>${url}</p>
                    </div>
                `,
            });
            console.log("📨 Verification email sent to", user.email);
        },
    },
    hooks: {
        before: createAuthMiddleware(async (ctx) => {
            if (ctx.path === "/sign-up/email") {
                const body = ctx.body as { secretCode?: string };
                if (body.secretCode !== process.env.SIGNUP_SECRET) {
                    throw new APIError("BAD_REQUEST", {
                        message: "Invalid Secret Code. Ask the admin for access.",
                    });
                }
            }
        }),
    },
});