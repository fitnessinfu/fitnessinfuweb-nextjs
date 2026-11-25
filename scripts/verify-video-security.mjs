// scripts/verify-video-security.mjs
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:7000';

async function main() {
  console.log('====================================================');
  console.log('🔒 VERIFYING MULTI-LAYER VIDEO SECURITY & ANTI-SCRAPE');
  console.log('====================================================\n');

  // 1. Test Direct Browser Address Bar / "Open in New Tab" navigation
  console.log('[Test 1] Testing direct "Open in New Tab" / DevTools inspection download attempt...');
  const newTabRes = await fetch(`${BASE_URL}/api/courses/fi7-base-camp/video/l1`, {
    headers: {
      'sec-fetch-dest': 'document',
      'sec-fetch-mode': 'navigate',
    },
  });
  console.log(`   Direct navigation response status: ${newTabRes.status}`);
  if (newTabRes.status === 403) {
    console.log('   ✅ PASS: "Open in new tab" / Address bar download BLOCKED with HTTP 403!');
  } else {
    console.error(`   ❌ FAIL: Expected 403, got ${newTabRes.status}`);
    process.exit(1);
  }

  // 2. Test Unchunked Full File Download Attempt (e.g. curl / IDM / python)
  console.log('\n[Test 2] Testing unchunked full-file download attempt (no Range header)...');
  const noRangeRes = await fetch(`${BASE_URL}/api/courses/fi7-base-camp/video/l1`);
  console.log(`   Unchunked download status: ${noRangeRes.status}`);
  if (noRangeRes.status === 416 || noRangeRes.status === 403) {
    console.log('   ✅ PASS: Full file scraper dump BLOCKED (status 416/403)!');
  } else {
    console.error(`   ❌ FAIL: Full file was not blocked! Status: ${noRangeRes.status}`);
    process.exit(1);
  }

  // 3. Test Cross-Origin Scraping Attempt
  console.log('\n[Test 3] Testing cross-origin scraper attempt from another domain...');
  const crossOriginRes = await fetch(`${BASE_URL}/api/courses/fi7-base-camp/video/l1`, {
    headers: {
      Referer: 'http://malicious-scrapers.com/steal-videos',
      Range: 'bytes=0-100',
    },
  });
  console.log(`   Cross-origin status: ${crossOriginRes.status}`);
  if (crossOriginRes.status === 403) {
    console.log('   ✅ PASS: Cross-origin scraper BLOCKED with HTTP 403!');
  } else {
    console.error(`   ❌ FAIL: Expected 403, got ${crossOriginRes.status}`);
    process.exit(1);
  }

  // 4. Test Missing Playback Ticket
  console.log('\n[Test 4] Testing streaming without signed playback ticket...');
  const noTicketRes = await fetch(`${BASE_URL}/api/courses/fi7-base-camp/video/l1`, {
    headers: {
      Range: 'bytes=0-100',
      'sec-fetch-dest': 'video',
    },
  });
  console.log(`   No-ticket status: ${noTicketRes.status}`);
  if (noTicketRes.status === 403) {
    console.log('   ✅ PASS: Streaming without ticket BLOCKED with HTTP 403!');
  } else {
    console.error(`   ❌ FAIL: Expected 403, got ${noTicketRes.status}`);
    process.exit(1);
  }

  // 5. Test Tampered / Fake Playback Ticket
  console.log('\n[Test 5] Testing streaming with tampered/fake playback ticket...');
  const fakeTicketRes = await fetch(`${BASE_URL}/api/courses/fi7-base-camp/video/l1?ticket=fake.signature123`, {
    headers: {
      Range: 'bytes=0-100',
      'sec-fetch-dest': 'video',
    },
  });
  console.log(`   Fake ticket status: ${fakeTicketRes.status}`);
  if (fakeTicketRes.status === 403) {
    console.log('   ✅ PASS: Tampered ticket BLOCKED with HTTP 403!');
  } else {
    console.error(`   ❌ FAIL: Expected 403, got ${fakeTicketRes.status}`);
    process.exit(1);
  }

  // 6. Test Authorized Ticket Issuance for Free Preview
  console.log('\n[Test 6] Testing authorized ticket issuance for Free Preview lesson...');
  const ticketRes = await fetch(`${BASE_URL}/api/courses/fi7-base-camp/video/l1/ticket`, {
    method: 'POST',
  });
  const ticketData = await ticketRes.json();
  if (ticketRes.status === 200 && ticketData.ticket) {
    console.log(`   ✅ PASS: Received HMAC signed ticket (length: ${ticketData.ticket.length}).`);
  } else {
    console.error('   ❌ FAIL: Ticket issuance failed:', ticketData);
    process.exit(1);
  }

  // 7. Test Legitimate Video Streaming with Valid Ticket & Range
  console.log('\n[Test 7] Testing legitimate playback using valid ticket and Range header...');
  const streamRes = await fetch(
    `${BASE_URL}/api/courses/fi7-base-camp/video/l1?ticket=${encodeURIComponent(ticketData.ticket)}`,
    {
      headers: {
        Range: 'bytes=0-1024',
        'sec-fetch-dest': 'video',
        Referer: `${BASE_URL}/courses/fi7-base-camp`,
      },
    }
  );
  console.log(`   Stream status: ${streamRes.status}`);
  console.log(`   Content-Range: ${streamRes.headers.get('content-range')}`);
  console.log(`   Content-Disposition: ${streamRes.headers.get('content-disposition')}`);
  console.log(`   Cross-Origin-Resource-Policy: ${streamRes.headers.get('cross-origin-resource-policy')}`);

  if (streamRes.status === 206) {
    console.log('   ✅ PASS: Authorized player streams smoothly with HTTP 206 Partial Content!');
  } else {
    console.error(`   ❌ FAIL: Expected 206, got ${streamRes.status}`);
    process.exit(1);
  }

  // 8. Test Ticket Mismatch (Ticket generated for l1 cannot be used for l2)
  console.log('\n[Test 8] Testing ticket lesson binding (l1 ticket cannot be reused for l2)...');
  const mismatchRes = await fetch(
    `${BASE_URL}/api/courses/fi7-base-camp/video/l2?ticket=${encodeURIComponent(ticketData.ticket)}`,
    {
      headers: {
        Range: 'bytes=0-1024',
        'sec-fetch-dest': 'video',
      },
    }
  );
  console.log(`   Mismatched ticket status: ${mismatchRes.status}`);
  if (mismatchRes.status === 401 || mismatchRes.status === 403) {
    console.log('   ✅ PASS: Reusing ticket for different lesson BLOCKED (status 401/403)!');
  } else {
    console.error(`   ❌ FAIL: Expected 401 or 403, got ${mismatchRes.status}`);
    process.exit(1);
  }

  // 9. Admin Preview Streaming
  console.log('\n[Test 9] Testing Admin Preview Stream with admin session cookie...');
  const loginRes = await fetch(`${BASE_URL}/api/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@fitnessinfu.com', password: 'Admin@FitnessInfu2026!' }),
  });
  const rawCookies = loginRes.headers.get('set-cookie');
  const match = rawCookies?.match(/fitnessinfu_admin_session=([^;]+)/);
  const adminCookie = match ? match[0] : '';

  const adminStreamRes = await fetch(`${BASE_URL}/api/courses/fi7-base-camp/video/l2`, {
    headers: {
      Cookie: adminCookie,
      Range: 'bytes=0-1024',
    },
  });
  console.log(`   Admin stream status for locked lesson: ${adminStreamRes.status}`);
  if (adminStreamRes.status === 206) {
    console.log('   ✅ PASS: Administrator authorized to preview locked curriculum.');
  } else {
    console.error(`   ❌ FAIL: Expected 206, got ${adminStreamRes.status}`);
    process.exit(1);
  }

  console.log('\n====================================================');
  console.log('🎉 ALL 9 VIDEO SECURITY TESTS PASSED WITH 100% SUCCESS!');
  console.log('====================================================');
}

main().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
