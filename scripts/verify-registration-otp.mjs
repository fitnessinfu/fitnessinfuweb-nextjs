import { MongoClient } from 'mongodb';
import crypto from 'node:crypto';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:7000';
const MONGO_URI = process.env.MONGODB_URI;
const MONGO_DB = process.env.MONGODB_DB || 'fitnessinfu';
const AUTH_SECRET = process.env.AUTH_SECRET || 'fitnessinfu_default_otp_secret_key_2026';

function hashOtpForTest(email, otp) {
  const normalizedEmail = (email || '').trim().toLowerCase();
  const cleanOtp = String(otp || '').trim();
  return crypto
    .createHmac('sha256', AUTH_SECRET)
    .update(`${normalizedEmail}:${cleanOtp}`)
    .digest('hex');
}

async function run() {
  console.log('════════════════════════════════════════════════════════════');
  console.log('🧪 VERIFYING 4-DIGIT EMAIL OTP REGISTRATION FLOW');
  console.log('════════════════════════════════════════════════════════════\n');

  if (!MONGO_URI) {
    console.error('❌ MONGODB_URI not found in environment.');
    process.exit(1);
  }

  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db(MONGO_DB);
  const usersColl = db.collection('users');
  const otpsColl = db.collection('emailOtps');

  let passed = 0;
  let failed = 0;

  function assert(desc, condition) {
    if (condition) {
      console.log(`  ✅ PASS: ${desc}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${desc}`);
      failed++;
    }
  }

  const timestamp = Date.now();
  const testEmail = `test_otp_athlete_${timestamp}@fitnessinfu.test`;
  const testPassword = 'Password123!';
  const testName = 'Test OTP Athlete';

  try {
    // TEST 1: Send OTP API - Missing or Invalid Email
    console.log('1. Testing /api/auth/otp/send Validation:');
    const badEmailRes = await fetch(`${BASE_URL}/api/auth/otp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email' }),
    });
    assert('Rejects invalid email format with HTTP 400', badEmailRes.status === 400);

    // TEST 2: Send OTP API - Valid Email
    console.log('\n2. Testing /api/auth/otp/send for New Athlete:');
    const sendRes = await fetch(`${BASE_URL}/api/auth/otp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, name: testName }),
    });
    const sendData = await sendRes.json();
    assert('Returns HTTP 200 with success status', sendRes.status === 200 && sendData.success === true);

    // TEST 3: MongoDB OTP Document Inspection
    console.log('\n3. Inspecting MongoDB OTP Record:');
    const otpDoc = await otpsColl.findOne({ email: testEmail });
    assert('OTP record created in emailOtps collection', !!otpDoc);
    assert('OTP hash stored (never raw plain-text code)', !!otpDoc?.otpHash && otpDoc.otpHash.length === 64);
    assert('Expiration date set in the future (~10 minutes)', otpDoc?.expiresAt && new Date(otpDoc.expiresAt) > new Date());
    assert('Initial attempt counter is 0', otpDoc?.attempts === 0);

    // TEST 4: Registration without OTP
    console.log('\n4. Testing /api/auth/register without OTP:');
    const noOtpRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: testName,
        email: testEmail,
        password: testPassword,
        confirmPassword: testPassword,
      }),
    });
    const noOtpData = await noOtpRes.json();
    assert('Rejects registration missing OTP with HTTP 400', noOtpRes.status === 400 && noOtpData.error.includes('4-digit'));

    // TEST 5: Registration with Wrong OTP
    console.log('\n5. Testing /api/auth/register with Incorrect OTP:');
    const wrongOtpRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: testName,
        email: testEmail,
        password: testPassword,
        confirmPassword: testPassword,
        otp: '0000',
      }),
    });
    const wrongOtpData = await wrongOtpRes.json();
    assert('Rejects invalid OTP with HTTP 400', wrongOtpRes.status === 400 && wrongOtpData.error.includes('attempt'));

    const updatedOtpDoc = await otpsColl.findOne({ email: testEmail });
    assert('Increments attempt counter in MongoDB after failed try', updatedOtpDoc?.attempts === 1);

    // TEST 6: Registration with Known Valid OTP
    console.log('\n6. Testing Successful Registration with Valid 4-Digit OTP:');
    const knownOtp = '7391';
    const now = new Date();
    await otpsColl.updateOne(
      { email: testEmail },
      {
        $set: {
          email: testEmail,
          otpHash: hashOtpForTest(testEmail, knownOtp),
          attempts: 0,
          createdAt: now,
          updatedAt: now,
          expiresAt: new Date(now.getTime() + 10 * 60 * 1000),
        },
      },
      { upsert: true }
    );

    const validRegisterRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: testName,
        email: testEmail,
        password: testPassword,
        confirmPassword: testPassword,
        otp: knownOtp,
      }),
    });
    const validRegisterData = await validRegisterRes.json();
    const setCookieHeader = validRegisterRes.headers.get('set-cookie') || '';

    assert('Registers user with HTTP 201 Created', validRegisterRes.status === 201 && validRegisterData.success === true);
    assert('Issues secure fitnessinfu_session cookie', setCookieHeader.includes('fitnessinfu_session='));

    const createdUser = await usersColl.findOne({ email: testEmail });
    assert('Athlete user account created in MongoDB', !!createdUser && createdUser.name === testName);

    // TEST 7: Anti-Replay: Attempting to use the consumed OTP again
    console.log('\n7. Testing Replay Protection (Consumed OTP):');
    const replayRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: testName,
        email: testEmail,
        password: testPassword,
        confirmPassword: testPassword,
        otp: knownOtp,
      }),
    });
    assert('Rejects reused OTP with HTTP 400', replayRes.status === 400);

    const consumedDoc = await otpsColl.findOne({ email: testEmail });
    assert('OTP document was completely deleted from database on successful registration', consumedDoc === null);

    // TEST 8: Existing user email cannot request new registration OTP
    console.log('\n8. Testing /api/auth/otp/send for Already Registered Email:');
    const duplicateRes = await fetch(`${BASE_URL}/api/auth/otp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, name: testName }),
    });
    const duplicateData = await duplicateRes.json();
    assert('Rejects existing user email with HTTP 400', duplicateRes.status === 400 && duplicateData.error.includes('already exists'));

    console.log('\n════════════════════════════════════════════════════════════');
    console.log(`📊 SUMMARY: ${passed} passed, ${failed} failed`);
    console.log('════════════════════════════════════════════════════════════\n');

  } finally {
    // Clean up test data
    console.log('🧹 Cleaning up test athlete and OTP records...');
    await usersColl.deleteOne({ email: testEmail });
    await otpsColl.deleteOne({ email: testEmail });
    await client.close();
  }

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
