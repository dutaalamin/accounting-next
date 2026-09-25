/**
 * Autentikasi sederhana berbasis JWT (cookie HttpOnly).
 * Password di-hash dengan bcrypt — sama seperti project Laravel.
 */

import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { validateEnv } from "./env";

const COOKIE_NAME = "session";

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET belum di-set di .env.local");
  }
  return new TextEncoder().encode(secret);
}

export interface SessionUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

/** Pastikan konfigurasi aman sebelum operasi auth apa pun. */
validateEnv();

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function createSession(user: SessionUser): Promise<void> {
  const token = await new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey());

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

/** Ambil user dari cookie sesi. Null bila belum login / token tidak sah. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secretKey());
    return {
      id: Number(payload.id),
      name: String(payload.name),
      email: String(payload.email),
      role: String(payload.role),
    };
  } catch {
    return null;
  }
}

/** Apakah user ini admin? */
export function isAdmin(user: SessionUser): boolean {
  return user.role === "admin";
}

/**
 * Wajib admin — untuk aksi sensitif (kelola user, hapus data).
 * Melempar error bila bukan admin, supaya tidak bisa dilewati diam-diam.
 */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (!isAdmin(user)) {
    throw new Error("Akses ditolak: hanya admin yang boleh melakukan aksi ini.");
  }
  return user;
}

/** Wajib login — dipakai di server component/action. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}
