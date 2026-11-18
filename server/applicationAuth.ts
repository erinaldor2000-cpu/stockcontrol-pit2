import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { parse as parseCookieHeader } from "cookie";
import type { Request, Response } from "express";
import { and, eq, gt } from "drizzle-orm";
import { appSessions, type ApplicationUser, usuarios } from "../drizzle/schema";
import { getDb } from "./db";

const scrypt = promisify(scryptCallback);
export const APPLICATION_SESSION_COOKIE = "stockdiv_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 12;

function digestToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`;
}

async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  const [algorithm, saltHex, expectedHex] = encoded.split("$");
  if (algorithm !== "scrypt" || !saltHex || !expectedHex) return false;
  const expected = Buffer.from(expectedHex, "hex");
  const actual = (await scrypt(password, Buffer.from(saltHex, "hex"), expected.length)) as Buffer;
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function readSessionToken(req: Request): string | undefined {
  const header = req.headers.cookie;
  if (!header) return undefined;
  try {
    return parseCookieHeader(header)[APPLICATION_SESSION_COOKIE];
  } catch {
    return undefined;
  }
}

/** Confere uma sessão persistida; o navegador recebe o token, o banco guarda somente seu hash. */
export async function getApplicationUser(req: Request): Promise<ApplicationUser | null> {
  const token = readSessionToken(req);
  if (!token) return null;
  const db = await getDb();
  if (!db) return null;

  const [session] = await db
    .select({ id: usuarios.id, nome: usuarios.nome, login: usuarios.login })
    .from(appSessions)
    .innerJoin(usuarios, eq(appSessions.usuarioId, usuarios.id))
    .where(and(eq(appSessions.tokenHash, digestToken(token)), gt(appSessions.expiresAt, new Date())))
    .limit(1);
  return session ?? null;
}

export async function createApplicationSession(login: string, password: string, res: Response) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível. Configure DATABASE_URL e aplique as migrações.");

  const [account] = await db.select().from(usuarios).where(eq(usuarios.login, login.trim())).limit(1);
  if (!account || !(await verifyPassword(password, account.senha))) return false;

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  await db.insert(appSessions).values({
    tokenHash: digestToken(token),
    usuarioId: account.id,
    expiresAt,
  });

  // SameSite=None; Secure funciona no Preview HTTPS incorporado. Navegadores modernos
  // também tratam localhost como contexto confiável para cookies Secure durante desenvolvimento.
  res.cookie(APPLICATION_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
    maxAge: SESSION_DURATION_MS,
  });
  return { id: account.id, nome: account.nome, login: account.login } satisfies ApplicationUser;
}

export async function destroyApplicationSession(req: Request, res: Response) {
  const token = readSessionToken(req);
  const db = await getDb();
  if (token && db) {
    await db.delete(appSessions).where(eq(appSessions.tokenHash, digestToken(token)));
  }
  res.clearCookie(APPLICATION_SESSION_COOKIE, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
  });
}

/** Cria a credencial fictícia somente se ela ainda não existir; não redefine a senha. */
export async function seedDemoAdministrator() {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_URL é obrigatório para iniciar o controle de estoque.");
  const [existing] = await db.select({ id: usuarios.id }).from(usuarios).where(eq(usuarios.login, "admin")).limit(1);
  if (!existing) {
    await db.insert(usuarios).values({
      nome: "Administrador",
      login: "admin",
      senha: await hashPassword("123456"),
    });
  }
}
