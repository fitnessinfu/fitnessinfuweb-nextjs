import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

export const SESSION_COOKIE_NAME = 'fitnessinfu_session';
const DEFAULT_EXPIRY = '7d';
const REMEMBER_EXPIRY = '30d';

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.trim().length === 0) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('AUTH_SECRET is required in production environment.');
    }
    // Fallback development secret with clear console warning
    console.warn(
      '[AUTH WARNING] AUTH_SECRET is not set in environment variables. Using development fallback. Do not use this in production!'
    );
    return new TextEncoder().encode('fitnessinfu_dev_secret_key_change_in_production_min32chars!');
  }
  return new TextEncoder().encode(secret);
}

/**
 * Hash a plain text password with bcrypt (salt rounds = 10).
 */
export async function hashPassword(plainPassword) {
  if (!plainPassword || typeof plainPassword !== 'string' || plainPassword.length < 8) {
    throw new Error('Password must be at least 8 characters long.');
  }
  return bcrypt.hash(plainPassword, 10);
}

/**
 * Compare a plain text password with a bcrypt hash.
 */
export async function verifyPassword(plainPassword, passwordHash) {
  if (!plainPassword || !passwordHash) return false;
  try {
    return await bcrypt.compare(plainPassword, passwordHash);
  } catch (err) {
    console.error('Password verification error:', err);
    return false;
  }
}

/**
 * Sign a secure JWT session token.
 */
export async function createSessionToken(user, rememberMe = false) {
  const secret = getAuthSecret();
  const expiry = rememberMe ? REMEMBER_EXPIRY : DEFAULT_EXPIRY;

  const token = await new SignJWT({
    id: user._id ? user._id.toString() : user.id,
    email: user.email,
    name: user.name,
    role: user.role || 'user',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiry)
    .sign(secret);

  return token;
}

/**
 * Verify a JWT session token and return its decoded payload.
 */
export async function verifySessionToken(token) {
  if (!token) return null;
  try {
    const secret = getAuthSecret();
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (err) {
    return null;
  }
}

/**
 * Reads the current session from incoming request cookies (Server Components / Route Handlers).
 */
export async function getAuthSession() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifySessionToken(token);
  } catch (err) {
    return null;
  }
}

/**
 * Sanitizes user object to safely send to client.
 */
export function sanitizeUser(user) {
  if (!user) return null;
  return {
    id: user._id ? user._id.toString() : user.id,
    name: user.name,
    email: user.email,
    role: user.role || 'user',
    createdAt: user.createdAt || null,
  };
}
