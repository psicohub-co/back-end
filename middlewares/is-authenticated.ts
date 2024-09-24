import { createLucia } from "@lib/lucia";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { Context, Next } from "hono";
import { getCookie } from "hono/cookie";

export const isAuthenticatedMid = async (c: Context, next: Next) => {
  const sql = neon(c.env.DATABASE_URL);
  const db = drizzle(sql);

  const lucia = createLucia(c, db);

  const sessionId = getCookie(c, lucia.sessionCookieName) ?? null;
  if (!sessionId) {
    c.set("user", null);
    c.set("session", null);
    return next();
  }

  const { session, user } = await lucia.validateSession(sessionId);

  if (session && session.fresh) {
    c.header("Set-Cookie", lucia.createSessionCookie(session.id).serialize(), {
      append: true,
    });
  }
  if (!session) {
    c.header("Set-Cookie", lucia.createBlankSessionCookie().serialize(), {
      append: true,
    });
  }

  c.set("user", user);
  c.set("session", session);

  return next();
};
