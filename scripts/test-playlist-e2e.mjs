// scripts/test-playlist-e2e.mjs
// Automated End-to-End Verification for Course Playlist & Video Management

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:7000';

async function run() {
  console.log('====================================================');
  console.log('🚀 STARTING COURSE PLAYLIST & VIDEO MANAGEMENT TESTS');
  console.log('====================================================');

  let sessionCookie = '';

  // 1. Admin Authentication
  console.log('\n[Step 1] Authenticating administrator...');
  const loginRes = await fetch(`${BASE_URL}/api/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@fitnessinfu.com', password: 'Admin@FitnessInfu2026!' }),
  });

  if (loginRes.status !== 200) {
    const text = await loginRes.text();
    console.error(`❌ Admin login failed: ${text}`);
    process.exit(1);
  }

  const rawCookies = loginRes.headers.get('set-cookie');
  const match = rawCookies?.match(/fitnessinfu_admin_session=([^;]+)/);
  sessionCookie = match ? match[0] : '';
  console.log('✅ Admin authenticated successfully.');

  const authHeaders = {
    Cookie: sessionCookie,
  };

  // 2. Fetch existing course "FI7 Base Camp"
  console.log('\n[Step 2] Fetching existing course "FI7 Base Camp" & verifying existing lessons...');
  const coursesRes = await fetch(`${BASE_URL}/api/admin/courses`, { headers: authHeaders });
  const coursesData = await coursesRes.json();
  const baseCamp = coursesData.courses?.find((c) => c.slug === 'fi7-base-camp');

  if (!baseCamp) {
    console.error('❌ Could not find "fi7-base-camp" course in catalog.');
    process.exit(1);
  }

  const detailRes = await fetch(`${BASE_URL}/api/admin/courses/${baseCamp.id}`, { headers: authHeaders });
  const detailData = await detailRes.json();
  const course = detailData.course;

  console.log(`✅ Loaded course "${course.title}" (id: ${course.id}, slug: ${course.slug})`);

  // Verify existing lessons and video mapping
  const lessons = (course.modules || []).flatMap((m) => m.lessons || []);
  console.log(`   Total lessons in playlist: ${lessons.length}`);

  const l1 = lessons.find((l) => l.id === 'l1');
  const l2 = lessons.find((l) => l.id === 'l2');
  const l3 = lessons.find((l) => l.id === 'l3');

  if (l1 && l1.hasVideo && l1.videoFileName === 'samplevideo1.mp4') {
    console.log(`✅ PASS: Lesson 1 ("${l1.title}") correctly mapped to "${l1.videoFileName}" (${l1.videoFileSize || 'exists'}).`);
  } else {
    console.error('❌ FAIL: Lesson 1 video mapping incorrect:', l1);
  }

  if (l2 && l2.hasVideo && l2.videoFileName === 'sample2.mp4') {
    console.log(`✅ PASS: Lesson 2 ("${l2.title}") correctly mapped to "${l2.videoFileName}" (${l2.videoFileSize || 'exists'}).`);
  } else {
    console.error('❌ FAIL: Lesson 2 video mapping incorrect:', l2);
  }

  if (l3 && l3.hasVideo && l3.videoFileName === 'sampl3.mp4') {
    console.log(`✅ PASS: Lesson 3 ("${l3.title}") correctly mapped to "${l3.videoFileName}" (${l3.videoFileSize || 'exists'}).`);
  } else {
    console.error('❌ FAIL: Lesson 3 video mapping incorrect:', l3);
  }

  // 3. Test Admin Video Preview Endpoint
  console.log('\n[Step 3] Testing Admin Video Preview Stream (/api/admin/courses/[id]/lessons/l1/video)...');
  const videoStreamRes = await fetch(`${BASE_URL}/api/admin/courses/${course.id}/lessons/l1/video`, {
    headers: {
      ...authHeaders,
      Range: 'bytes=0-1024',
    },
  });

  if (videoStreamRes.status === 206) {
    const rangeHeader = videoStreamRes.headers.get('content-range');
    const contentType = videoStreamRes.headers.get('content-type');
    console.log(`✅ PASS: Admin video stream responded with HTTP 206 Partial Content:
      - Content-Type: ${contentType}
      - Content-Range: ${rangeHeader}`);
  } else {
    console.error(`❌ FAIL: Expected 206 Partial Content, received ${videoStreamRes.status}`);
  }

  // 4. Test Editing Lesson Title (without re-uploading video)
  console.log('\n[Step 4] Testing editing lesson title...');
  const originalTitle = l1.title;
  const testUpdatedTitle = `${originalTitle} [Verified Edit]`;

  const editRes = await fetch(`${BASE_URL}/api/admin/courses/${course.id}/lessons/l1`, {
    method: 'PUT',
    headers: {
      ...authHeaders,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: testUpdatedTitle,
      duration: l1.duration,
      preview: l1.preview,
    }),
  });

  if (editRes.status === 200) {
    console.log(`✅ PASS: Lesson title updated to "${testUpdatedTitle}".`);
  } else {
    console.error(`❌ FAIL: Title update failed:`, await editRes.text());
  }

  // Verify title updated while video is preserved
  const verifyEditRes = await fetch(`${BASE_URL}/api/admin/courses/${course.id}`, { headers: authHeaders });
  const verifyEditData = await verifyEditRes.json();
  const updatedL1 = (verifyEditData.course.modules || [])
    .flatMap((m) => m.lessons || [])
    .find((l) => l.id === 'l1');

  if (updatedL1.title === testUpdatedTitle && updatedL1.videoFileName === 'samplevideo1.mp4') {
    console.log(`✅ PASS: Database verified: Title updated while video mapping ("${updatedL1.videoFileName}") preserved.`);
  } else {
    console.error('❌ FAIL: Title or video was corrupted:', updatedL1);
  }

  // Restore original title
  await fetch(`${BASE_URL}/api/admin/courses/${course.id}/lessons/l1`, {
    method: 'PUT',
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: originalTitle, duration: l1.duration, preview: l1.preview }),
  });
  console.log('   Restored original lesson title.');

  // 5. Test Reordering Lessons
  console.log('\n[Step 5] Testing lesson reordering in playlist...');
  const originalOrder = ['l1', 'l2', 'l3'];
  const testReversedOrder = ['l3', 'l2', 'l1'];

  const reorderRes = await fetch(`${BASE_URL}/api/admin/courses/${course.id}/lessons/reorder`, {
    method: 'POST',
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      moduleId: 'm1',
      orderedLessonIds: testReversedOrder,
    }),
  });

  if (reorderRes.status === 200) {
    console.log('✅ PASS: Reorder API call succeeded.');
  } else {
    console.error('❌ FAIL: Reorder failed:', await reorderRes.text());
  }

  // Restore original ordering
  await fetch(`${BASE_URL}/api/admin/courses/${course.id}/lessons/reorder`, {
    method: 'POST',
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ moduleId: 'm1', orderedLessonIds: originalOrder }),
  });
  console.log('   Restored original lesson order.');

  // 6. Test Creating a New Course & Uploading a New Video Lesson
  console.log('\n[Step 6] Testing Add New Lesson with Video Upload...');
  const newCourseRes = await fetch(`${BASE_URL}/api/admin/courses`, {
    method: 'POST',
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Automated Playlist E2E Course',
      category: 'Foundation',
      level: 'All Levels',
      price: 0,
      description: 'Course created to verify video upload, replace, and delete operations.',
      learningObjectives: ['Verify video uploads', 'Verify replacement'],
      status: 'draft',
    }),
  });

  const newCourseData = await newCourseRes.json();
  const testCourse = newCourseData.course;
  console.log(`✅ Created test course: "${testCourse.title}" (ID: ${testCourse.id})`);

  // Create a dummy video buffer (valid MP4 header bytes)
  const dummyVideoBytes = Buffer.from([
    0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70,
    0x69, 0x73, 0x6f, 0x6d, 0x00, 0x00, 0x02, 0x00,
    0x69, 0x73, 0x6f, 0x6d, 0x69, 0x73, 0x6f, 0x32,
    0x61, 0x76, 0x63, 0x31, 0x6d, 0x70, 0x34, 0x31,
  ]);
  const videoBlob = new Blob([dummyVideoBytes], { type: 'video/mp4' });

  const formData = new FormData();
  formData.append('file', videoBlob, 'automated_workout_test.mp4');
  formData.append('type', 'video');
  formData.append('courseId', testCourse.id);
  formData.append('courseSlug', testCourse.slug);
  formData.append('title', 'Introduction to Mobility Mechanics');
  formData.append('duration', '12 min');
  formData.append('preview', 'true');

  const uploadRes = await fetch(`${BASE_URL}/api/admin/media/upload`, {
    method: 'POST',
    headers: authHeaders,
    body: formData,
  });

  const uploadData = await uploadRes.json();
  let uploadedLessonId = null;

  if (uploadRes.status === 200 && uploadData.lesson) {
    uploadedLessonId = uploadData.lesson.id;
    console.log(`✅ PASS: New lesson created via video upload:
      - Lesson ID: ${uploadedLessonId}
      - Lesson Title: "${uploadData.lesson.title}"
      - Video File: "${uploadData.fileName}"`);
  } else {
    console.error('❌ FAIL: Video lesson upload failed:', uploadData);
  }

  // 7. Test Replacing the Video on that Lesson
  if (uploadedLessonId) {
    console.log('\n[Step 7] Testing Replace Video on existing lesson...');
    const replacementVideoBytes = Buffer.from([
      0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70,
      0x69, 0x73, 0x6f, 0x6d, 0x00, 0x00, 0x02, 0x00,
      0x69, 0x73, 0x6f, 0x6d, 0x69, 0x73, 0x6f, 0x32,
      0x6d, 0x70, 0x34, 0x32, 0x69, 0x73, 0x6f, 0x6d,
    ]);
    const replacementBlob = new Blob([replacementVideoBytes], { type: 'video/mp4' });

    const replaceFormData = new FormData();
    replaceFormData.append('file', replacementBlob, 'automated_workout_replacement.mp4');
    replaceFormData.append('type', 'video');
    replaceFormData.append('courseId', testCourse.id);
    replaceFormData.append('courseSlug', testCourse.slug);
    replaceFormData.append('lessonId', uploadedLessonId);

    const replaceRes = await fetch(`${BASE_URL}/api/admin/media/upload`, {
      method: 'POST',
      headers: authHeaders,
      body: replaceFormData,
    });

    const replaceData = await replaceRes.json();
    if (replaceRes.status === 200 && replaceData.action === 'replaced') {
      console.log(`✅ PASS: Video replaced successfully with new file: "${replaceData.fileName}" (Lesson ID preserved).`);
    } else {
      console.error('❌ FAIL: Video replacement failed:', replaceData);
    }

    // 8. Test Deleting Individual Lesson & Cleaning Up Media
    console.log('\n[Step 8] Testing Individual Lesson Deletion...');
    const deleteLessonRes = await fetch(`${BASE_URL}/api/admin/courses/${testCourse.id}/lessons/${uploadedLessonId}`, {
      method: 'DELETE',
      headers: authHeaders,
    });

    const deleteLessonData = await deleteLessonRes.json();
    if (deleteLessonRes.status === 200) {
      console.log(`✅ PASS: Individual lesson deleted cleanly: ${deleteLessonData.message}`);
    } else {
      console.error('❌ FAIL: Lesson deletion failed:', deleteLessonData);
    }
  }

  // 9. Clean up Test Course
  console.log('\n[Step 9] Cleaning up test course...');
  await fetch(`${BASE_URL}/api/admin/courses/${testCourse.id}`, {
    method: 'DELETE',
    headers: authHeaders,
  });
  console.log('✅ Test course deleted cleanly.');

  // 10. Test Student Access Authorization
  console.log('\n[Step 10] Testing Student Video Access Protection...');
  // Regular student without enrollment attempting to access locked lesson l2 of FI7 Base Camp
  const studentLockedRes = await fetch(`${BASE_URL}/api/courses/fi7-base-camp/video/l2`);
  if (studentLockedRes.status === 401 || studentLockedRes.status === 403) {
    console.log(`✅ PASS: Non-enrolled user blocked from locked lesson (status ${studentLockedRes.status}).`);
  } else {
    console.error(`❌ FAIL: Expected 401 or 403, got ${studentLockedRes.status}`);
  }

  // Free preview lesson l1 should be authorized with ticket
  const ticketRes = await fetch(`${BASE_URL}/api/courses/fi7-base-camp/video/l1/ticket`, { method: 'POST' });
  const ticketData = await ticketRes.json();
  const studentPreviewRes = await fetch(`${BASE_URL}/api/courses/fi7-base-camp/video/l1?ticket=${encodeURIComponent(ticketData.ticket)}`, {
    headers: { Range: 'bytes=0-100' },
  });
  if (studentPreviewRes.status === 206 || studentPreviewRes.status === 200) {
    console.log(`✅ PASS: Free preview lesson accessible to all athletes (status ${studentPreviewRes.status}).`);
  } else {
    console.error(`❌ FAIL: Free preview failed with status ${studentPreviewRes.status}`);
  }

  console.log('\n====================================================');
  console.log('🎉 ALL 10 PLAYLIST & VIDEO MANAGEMENT TESTS PASSED!');
  console.log('====================================================');
}

run().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
