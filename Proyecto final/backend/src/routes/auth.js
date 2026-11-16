import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { Router } from "express";
import { connectToDatabase } from "../database/connection.js";
import { Session } from "../database/models/Session.js";
import { User } from "../database/models/User.js";
import { ApiError, asyncHandler } from "../errors.js";

const router = Router();
const scrypt = promisify(scryptCallback);
const sessionCookieName = "futrix_session";
const sessionDurationMs = 7 * 24 * 60 * 60 * 1000;
const sessionMaxAgeSeconds = sessionDurationMs / 1000;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function publicUser(user) {
  return { id: String(user._id), name: user.name, email: user.email };
}

function getSessionToken(request) {
  const cookies = request.headers.cookie || "";
  const cookie = cookies.split(";").map((value) => value.trim())
    .find((value) => value.startsWith(`${sessionCookieName}=`));
  return cookie ? cookie.slice(sessionCookieName.length + 1) : "";
}

function setSessionCookie(response, token) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  response.setHeader(
    "Set-Cookie",
    `${sessionCookieName}=${token}; Max-Age=${sessionMaxAgeSeconds}; Path=/; HttpOnly; SameSite=Lax${secure}`,
  );
}

function clearSessionCookie(response) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  response.setHeader(
    "Set-Cookie",
    `${sessionCookieName}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax${secure}`,
  );
}

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, 64);
  return `scrypt$${salt}$${derivedKey.toString("hex")}`;
}

async function verifyPassword(password, storedHash) {
  const [algorithm, salt, hash] = storedHash.split("$");
  if (algorithm !== "scrypt" || !salt || !/^[\da-f]{128}$/i.test(hash || "")) return false;

  const expected = Buffer.from(hash, "hex");
  const actual = await scrypt(password, salt, expected.length);
  return timingSafeEqual(actual, expected);
}

async function startSession(user, response) {
  const token = randomBytes(32).toString("base64url");
  await Session.create({
    tokenHash: hashToken(token),
    userId: user._id,
    expiresAt: new Date(Date.now() + sessionDurationMs),
  });
  setSessionCookie(response, token);
}

export async function findSessionUser(request, response) {
  const token = getSessionToken(request);
  if (!token) return null;

  await connectToDatabase();
  const session = await Session.findOne({
    tokenHash: hashToken(token),
    expiresAt: { $gt: new Date() },
  }).populate("userId", "name email").lean();

  if (!session?.userId) {
    clearSessionCookie(response);
    return null;
  }
  return publicUser(session.userId);
}

router.post(
  "/register",
  asyncHandler(async (request, response) => {
    const { name, email, password } = request.body ?? {};
    if (
      typeof name !== "string"
      || name.trim().length < 2
      || name.trim().length > 100
      || typeof email !== "string"
      || email.trim().length > 254
      || !emailPattern.test(email.trim())
      || typeof password !== "string"
      || password.length < 8
      || password.length > 128
    ) {
      throw new ApiError(400, "Ingresa un nombre, correo válido y una contraseña de 8 a 128 caracteres.");
    }

    await connectToDatabase();
    const normalizedEmail = normalizeEmail(email);
    const passwordHash = await hashPassword(password);
    let user;
    try {
      user = await User.create({ name: name.trim(), email: normalizedEmail, passwordHash });
    } catch (error) {
      if (error?.code === 11000) throw new ApiError(409, "Ya existe una cuenta con ese correo.");
      throw error;
    }

    await startSession(user, response);
    response.status(201).json({ user: publicUser(user) });
  }),
);

router.post(
  "/login",
  asyncHandler(async (request, response) => {
    const { email, password } = request.body ?? {};
    if (
      typeof email !== "string"
      || email.trim().length > 254
      || !emailPattern.test(email.trim())
      || typeof password !== "string"
      || password.length < 1
      || password.length > 128
    ) {
      throw new ApiError(401, "Correo o contraseña incorrectos.");
    }

    await connectToDatabase();
    const user = await User.findOne({ email: normalizeEmail(email) }).select("+passwordHash");
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      throw new ApiError(401, "Correo o contraseña incorrectos.");
    }

    await startSession(user, response);
    response.json({ user: publicUser(user) });
  }),
);

router.get(
  "/me",
  asyncHandler(async (request, response) => {
    response.json({ user: await findSessionUser(request, response) });
  }),
);

router.post(
  "/logout",
  asyncHandler(async (request, response) => {
    const token = getSessionToken(request);
    if (token) {
      await connectToDatabase();
      await Session.deleteOne({ tokenHash: hashToken(token) });
    }
    clearSessionCookie(response);
    response.json({ success: true });
  }),
);

export default router;
