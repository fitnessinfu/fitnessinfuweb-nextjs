import crypto from 'node:crypto';
import { getDatabase } from '@/lib/mongodb';

let indexesCreated = false;

function getAuthSecret() {
  return process.env.AUTH_SECRET || 'fitnessinfu_default_otp_secret_key_2026';
}

/**
 * Returns the MongoDB emailOtps collection and ensures TTL and unique indexes exist.
 */
export async function getEmailOtpsCollection() {
  const db = await getDatabase();
  const collection = db.collection('emailOtps');

  if (!indexesCreated) {
    try {
      await collection.createIndex({ email: 1 }, { unique: true });
      await collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
      indexesCreated = true;
    } catch (err) {
      // Indexes may already exist
    }
  }

  return collection;
}

/**
 * Generate a cryptographically secure 4-digit numeric OTP (1000 - 9999).
 */
export function generateFourDigitOtp() {
  return crypto.randomInt(1000, 10000).toString();
}

/**
 * Hash the OTP with email and secret salt to ensure raw codes are never stored in DB.
 */
export function hashOtp(email, otp) {
  const secret = getAuthSecret();
  const normalizedEmail = (email || '').trim().toLowerCase();
  const cleanOtp = String(otp || '').trim();
  return crypto
    .createHmac('sha256', secret)
    .update(`${normalizedEmail}:${cleanOtp}`)
    .digest('hex');
}

/**
 * Store or overwrite an OTP for an email with a 10-minute expiration.
 */
export async function saveOtp({ email, otp, ttlMinutes = 10 }) {
  const normalizedEmail = (email || '').trim().toLowerCase();
  const otpHash = hashOtp(normalizedEmail, otp);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlMinutes * 60 * 1000);

  const collection = await getEmailOtpsCollection();

  await collection.updateOne(
    { email: normalizedEmail },
    {
      $set: {
        email: normalizedEmail,
        otpHash,
        attempts: 0,
        createdAt: now,
        updatedAt: now,
        expiresAt,
      },
    },
    { upsert: true }
  );

  return { email: normalizedEmail, expiresAt };
}

/**
 * Verify and consume a 4-digit OTP.
 * Consuming deletes the OTP so it cannot be re-used.
 * Limits incorrect attempts to 5 before invalidating the code.
 */
export async function verifyAndConsumeOtp({ email, otp }) {
  const normalizedEmail = (email || '').trim().toLowerCase();
  const cleanOtp = String(otp || '').trim();

  if (!cleanOtp || !/^\d{4}$/.test(cleanOtp)) {
    return {
      valid: false,
      error: 'Please enter a valid 4-digit verification code.',
    };
  }

  const collection = await getEmailOtpsCollection();
  const record = await collection.findOne({ email: normalizedEmail });

  if (!record) {
    return {
      valid: false,
      error: 'Verification code not found or expired. Please request a new code.',
    };
  }

  const now = new Date();
  if (record.expiresAt && new Date(record.expiresAt) < now) {
    await collection.deleteOne({ email: normalizedEmail });
    return {
      valid: false,
      error: 'Verification code has expired. Please request a new code.',
    };
  }

  if ((record.attempts || 0) >= 5) {
    await collection.deleteOne({ email: normalizedEmail });
    return {
      valid: false,
      error: 'Too many incorrect attempts. For security, please request a new verification code.',
    };
  }

  const expectedHash = hashOtp(normalizedEmail, cleanOtp);

  // Use timingSafeEqual to prevent timing attacks
  const isMatch =
    record.otpHash &&
    expectedHash.length === record.otpHash.length &&
    crypto.timingSafeEqual(Buffer.from(expectedHash), Buffer.from(record.otpHash));

  if (!isMatch) {
    const updatedAttempts = (record.attempts || 0) + 1;
    if (updatedAttempts >= 5) {
      await collection.deleteOne({ email: normalizedEmail });
      return {
        valid: false,
        error: 'Too many incorrect attempts. Please request a new verification code.',
      };
    } else {
      await collection.updateOne(
        { email: normalizedEmail },
        { $set: { attempts: updatedAttempts, updatedAt: new Date() } }
      );
      const remainingAttempts = 5 - updatedAttempts;
      return {
        valid: false,
        error: `Incorrect verification code. ${remainingAttempts} attempt${remainingAttempts === 1 ? '' : 's'} remaining.`,
      };
    }
  }

  // OTP is valid! Consume it immediately.
  await collection.deleteOne({ email: normalizedEmail });

  return { valid: true };
}
