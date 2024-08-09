import { Hono } from "hono";

import { Env } from "types/bindings";
import { cors } from "hono/cors";
import { JwtVariables } from "hono/jwt";

import { Session, sessionMiddleware, CookieStore } from "hono-sessions";

// ROUTES
import auth from "@routes/auth.route";
import users from "@routes/users.route";

const app = new Hono<{
  Bindings: Env;
  Variables: JwtVariables & {
    session: Session;
    session_key_rotation: boolean;
  };
}>().basePath("/v1");

// CORS
app.use("*", async (c, next) => {
  const corsMiddleware = cors({
    origin: "http://localhost:3000", // allowing only localhost:3000
    allowMethods: ["GET", "POST", "PATCH", "OPTIONS"],
    allowHeaders: ["Authorization", "Content-Type"],
    credentials: true,
  });

  return corsMiddleware(c, next);
});

const store = new CookieStore();
app.use("*", async (c, next) => {
  const sessionMid = sessionMiddleware({
    store,
    encryptionKey: c.env.JWT_SECRET, // Required for CookieStore, recommended for others
    expireAfterSeconds: 900, // Expire session after 15 minutes of inactivity
    cookieOptions: {
      sameSite: "Lax", // Recommended for basic CSRF protection in modern browsers
      path: "/", // Required for this library to work properly
      httpOnly: true, // Recommended to avoid XSS attacks
    },
  });

  return sessionMid(c, next);
});

// ROUTES
app.route("/auth", auth);
app.route("/users", users);
// app.route("/patients", patients);

app.get("/", async (c) => {
  const session = c.get("session");

  console.log("chamou");

  return c.text("session");
});

export default app;
