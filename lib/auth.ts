import crypto from "crypto";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users, sessions, User } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";

export const SESSION_COOKIE_NAME = "auth_session";
const SESSION_EXPIRY_DAYS = 30;

export type SafeUser = Omit<User, "passwordHash">;

/**
 * Password hashing and timing-safe verification using built-in Node.js crypto.
 * No external npm packages (e.g. bcryptjs) required, avoiding missing module errors.
 * Also supports plain-text fallback for development/testing ease.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha256").toString("hex");
  return `pbkdf2$${salt}$${hash}`;
}

/**
 * Timing-safe password verification against the stored hash or fallback.
 */
export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  if (!password || !storedHash) return false;

  // Plaintext match (in case password was stored without hashing or during testing)
  if (password === storedHash) {
    return true;
  }

  // PBKDF2 hash (standard Node.js crypto)
  if (storedHash.startsWith("pbkdf2$")) {
    try {
      const parts = storedHash.split("$");
      if (parts.length === 3) {
        const [, salt, expectedHash] = parts;
        const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha256").toString("hex");
        return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(expectedHash));
      }
    } catch {
      return false;
    }
  }

  // Scrypt hash (Node.js built-in)
  if (storedHash.startsWith("scrypt$")) {
    return new Promise((resolve) => {
      try {
        const parts = storedHash.split("$");
        if (parts.length !== 6) return resolve(false);

        const [, N, r, p, salt, expectedHex] = parts;
        crypto.scrypt(
          password,
          salt,
          64,
          { N: parseInt(N, 10), r: parseInt(r, 10), p: parseInt(p, 10) },
          (err, derivedKey) => {
            if (err) return resolve(false);
            const keyBuffer = Buffer.from(derivedKey.toString("hex"), "hex");
            const expectedBuffer = Buffer.from(expectedHex, "hex");
            if (keyBuffer.length !== expectedBuffer.length) return resolve(false);
            resolve(crypto.timingSafeEqual(keyBuffer, expectedBuffer));
          }
        );
      } catch {
        resolve(false);
      }
    });
  }

  return false;
}

export async function createSession(userId: number): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(
    Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000
  );

  await db.insert(sessions).values({
    id: token,
    userId,
    expiresAt,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  return token;
}

export async function validateSession(
  token: string
): Promise<SafeUser | null> {
  if (!token) return null;

  try {
    const results = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        phone: users.phone,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(
        and(eq(sessions.id, token), gt(sessions.expiresAt, new Date()))
      )
      .limit(1);

    if (!results || results.length === 0) {
      return null;
    }

    return results[0] as SafeUser;
  } catch (error) {
    console.error("Session validation error:", error);
    return null;
  }
}

export async function getCurrentUser(): Promise<SafeUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    return await validateSession(token);
  } catch (error) {
    console.error("getCurrentUser error:", error);
    return null;
  }
}

export async function destroySession(): Promise<void> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (token) {
      await db.delete(sessions).where(eq(sessions.id, token));
    }

    cookieStore.delete(SESSION_COOKIE_NAME);
  } catch (error) {
    console.error("destroySession error:", error);
  }
}
