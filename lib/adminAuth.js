import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyPassword } from './auth';
import { findUserByEmail } from '@/models/User';

export const ADMIN_COOKIE_NAME = 'fitnessinfu_admin_session';
const DEFAULT_ADMIN_EXPIRY = '24h';
const REMEMBER_ADMIN_EXPIRY = '7d';

/**
 * Resolves the signing secret for admin sessions.
 */
function getAdminSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.AUTH_SECRET;
  if (!secret || secret.trim().length === 0) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ADMIN_SESSION_SECRET or AUTH_SECRET is required in production.');
    }
    return new TextEncoder().encode('fitnessinfu_admin_secret_key_change_in_production_min32chars!');
  }
  return new TextEncoder().encode(secret);
}

/**
 * Validates admin credentials against environment variables or database admin role.
 */
export async function verifyAdminCredentials({ email, password }) {
  if (!email || !password) {
    return { valid: false, error: 'Email and password are required.' };
  }

  const cleanEmail = email.trim().toLowerCase();

  // 1. Check server-side environment variable configuration (Primary)
  const envAdminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  let envAdminHash = (process.env.ADMIN_PASSWORD_HASH || '').trim();

  // If the hash has escaped dollars from .env (e.g. \$2b\$...), unescape them
  if (envAdminHash.includes('\\$')) {
    envAdminHash = envAdminHash.replace(/\\(\$)/g, '$1');
  }

  if (envAdminEmail && envAdminHash && cleanEmail === envAdminEmail) {
    const isMatch = await verifyPassword(password, envAdminHash);
    if (isMatch) {
      return {
        valid: true,
        admin: {
          id: 'admin_env',
          email: envAdminEmail,
          name: 'Lead Administrator',
          role: 'admin',
          source: 'env',
        },
      };
    }
  }

  // 2. Fallback to MongoDB database admin accounts (Secondary)
  try {
    const dbUser = await findUserByEmail(cleanEmail);
    if (dbUser && dbUser.role === 'admin') {
      if (dbUser.status === 'suspended') {
        return { valid: false, error: 'This administrator account has been suspended.' };
      }

      const isMatch = await verifyPassword(password, dbUser.passwordHash);
      if (isMatch) {
        return {
          valid: true,
          admin: {
            id: dbUser._id.toString(),
            email: dbUser.email,
            name: dbUser.name || 'System Administrator',
            role: 'admin',
            source: 'db',
          },
        };
      }
    }
  } catch (err) {
    console.error('Database admin lookup error:', err);
  }

  return { valid: false, error: 'Invalid administrator email or password.' };
}

/**
 * Issues a signed JWT token specifically for administrator sessions.
 */
export async function createAdminToken(admin, rememberMe = false) {
  const secret = getAdminSecret();
  const expiry = rememberMe ? REMEMBER_ADMIN_EXPIRY : DEFAULT_ADMIN_EXPIRY;

  const token = await new SignJWT({
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: 'admin',
    issuer: 'fitnessinfu-admin',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiry)
    .sign(secret);

  return token;
}

/**
 * Verifies an admin JWT token and returns the payload if valid and role === 'admin'.
 */
export async function verifyAdminToken(token) {
  if (!token) return null;
  try {
    const secret = getAdminSecret();
    const { payload } = await jwtVerify(token, secret);
    if (payload.role !== 'admin') {
      return null;
    }
    return payload;
  } catch (err) {
    return null;
  }
}

/**
 * Reads admin session from cookies in Server Components or Route Handlers.
 */
export async function getAdminSession() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifyAdminToken(token);
  } catch (err) {
    return null;
  }
}

/**
 * Server Component guard: redirects unauthenticated users to `/admin/login`.
 */
export async function requireAdminSession(redirectPath = '/admin/dashboard') {
  const session = await getAdminSession();
  if (!session || session.role !== 'admin') {
    redirect(`/admin/login?redirect=${encodeURIComponent(redirectPath)}`);
  }
  return session;
}

/**
 * API Route Handler guard: returns unauthorized JSON response if not admin.
 */
export async function requireAdminApi() {
  const session = await getAdminSession();
  if (!session || session.role !== 'admin') {
    return {
      authorized: false,
      admin: null,
      response: Response.json(
        { error: 'Unauthorized: Administrator access required.' },
        { status: 401 }
      ),
    };
  }
  return { authorized: true, admin: session, response: null };
}
