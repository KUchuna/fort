import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createAuthMiddleware, APIError } from "better-auth/api";
import { db } from "./db"; 
import { user, session, account, verification } from "./auth-schema"; 

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
        schema: { user, session, account, verification },
    }),
    emailAndPassword: {
        enabled: true,
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