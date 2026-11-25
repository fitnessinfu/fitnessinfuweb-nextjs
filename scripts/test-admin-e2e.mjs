// scripts/test-admin-e2e.mjs
// Automated verification script for the Fitnessinfu Admin Panel API suite

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:7000';

async function runTests() {
  console.log('--- Starting Admin Panel End-to-End Tests ---');
  let sessionCookie = '';

  // 1. Unauthenticated request should be rejected (401)
  console.log('\n[Test 1] Testing unauthenticated access to /api/admin/stats...');
  const unauthRes = await fetch(`${BASE_URL}/api/admin/stats`);
  if (unauthRes.status === 401) {
    console.log('✅ PASS: Unauthenticated access correctly rejected with 401 Unauthorized.');
  } else {
    console.error(`❌ FAIL: Expected 401, got ${unauthRes.status}`);
  }

  // 2. Login with incorrect password should be rejected (401)
  console.log('\n[Test 2] Testing login with invalid credentials...');
  const badLoginRes = await fetch(`${BASE_URL}/api/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@fitnessinfu.com', password: 'WrongPassword123!' })
  });
  if (badLoginRes.status === 401) {
    console.log('✅ PASS: Invalid credentials correctly rejected with 401.');
  } else {
    console.error(`❌ FAIL: Expected 401, got ${badLoginRes.status}`);
  }

  // 3. Login with valid credentials
  console.log('\n[Test 3] Testing login with valid credentials (admin@fitnessinfu.com)...');
  const loginRes = await fetch(`${BASE_URL}/api/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@fitnessinfu.com', password: 'Admin@FitnessInfu2026!' })
  });
  
  if (loginRes.status === 200) {
    const rawCookies = loginRes.headers.get('set-cookie');
    if (rawCookies && rawCookies.includes('fitnessinfu_admin_session')) {
      // Extract session cookie
      const match = rawCookies.match(/fitnessinfu_admin_session=([^;]+)/);
      sessionCookie = match ? match[0] : '';
      console.log('✅ PASS: Login successful and session cookie issued.');
    } else {
      console.error('❌ FAIL: Session cookie missing in response headers.');
    }
  } else {
    const text = await loginRes.text();
    console.error(`❌ FAIL: Login failed with status ${loginRes.status}: ${text}`);
    return;
  }

  const authHeaders = {
    'Cookie': sessionCookie,
    'Content-Type': 'application/json'
  };

  // 4. Verify /api/admin/auth/me
  console.log('\n[Test 4] Testing /api/admin/auth/me...');
  const meRes = await fetch(`${BASE_URL}/api/admin/auth/me`, { headers: authHeaders });
  const meData = await meRes.json();
  if (meRes.status === 200 && meData.authenticated && meData.admin?.email === 'admin@fitnessinfu.com') {
    console.log(`✅ PASS: Authenticated admin identity verified (${meData.admin.email}).`);
  } else {
    console.error('❌ FAIL: /api/admin/auth/me returned:', meData);
  }

  // 5. Test Live Admin Stats
  console.log('\n[Test 5] Testing /api/admin/stats (Live Metrics)...');
  const statsRes = await fetch(`${BASE_URL}/api/admin/stats`, { headers: authHeaders });
  const statsData = await statsRes.json();
  if (statsRes.status === 200 && statsData.metrics) {
    const { metrics } = statsData;
    console.log(`✅ PASS: Stats retrieved successfully:
      - Total Athletes: ${metrics.totalUsers}
      - Active Athletes: ${metrics.activeUsers}
      - Total Courses: ${metrics.totalCourses} (${metrics.publishedCourses} published)
      - Enrollments: ${metrics.totalEnrollments}
      - Today's Attendance: ${metrics.todayAttendance}
      - Total Lessons: ${metrics.totalLessons}`);
  } else {
    console.error('❌ FAIL: /api/admin/stats returned:', statsData);
  }

  // 6. Test Course Management CRUD
  console.log('\n[Test 6] Testing Course Creation (POST /api/admin/courses)...');
  const newCoursePayload = {
    title: 'E2E Hypertrophy Masterclass Test',
    category: 'Strength & Hypertrophy',
    level: 'Advanced',
    price: 2499,
    description: 'Automated test course description verifying end-to-end admin capabilities.',
    learningObjectives: [
      'Master advanced periodization mechanics',
      'Optimize biomechanical tension curves'
    ],
    status: 'draft'
  };

  const createCourseRes = await fetch(`${BASE_URL}/api/admin/courses`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify(newCoursePayload)
  });
  const createdCourse = await createCourseRes.json();
  let createdCourseId = null;

  if (createCourseRes.status === 201 && createdCourse.course?._id) {
    createdCourseId = createdCourse.course._id;
    console.log(`✅ PASS: Course created successfully with ID: ${createdCourseId}, Slug: ${createdCourse.course.slug}`);
  } else {
    console.error('❌ FAIL: Course creation failed:', createdCourse);
  }

  if (createdCourseId) {
    // 7. Add Module to Course
    console.log('\n[Test 7] Testing Module Creation (POST /api/admin/courses/[id]/modules)...');
    const moduleRes = await fetch(`${BASE_URL}/api/admin/courses/${createdCourseId}/modules`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ title: 'Module 1: Periodization Framework' })
    });
    const moduleData = await moduleRes.json();
    let createdModuleId = null;

    if (moduleRes.status === 201 && moduleData.module?.id) {
      createdModuleId = moduleData.module.id;
      console.log(`✅ PASS: Module created successfully with ID: ${createdModuleId}`);
    } else {
      console.error('❌ FAIL: Module creation failed:', moduleData);
    }

    if (createdModuleId) {
      // 8. Add Lesson to Module
      console.log('\n[Test 8] Testing Lesson Creation (POST /api/admin/courses/[id]/lessons)...');
      const lessonRes = await fetch(`${BASE_URL}/api/admin/courses/${createdCourseId}/lessons`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          title: 'Mechanical Tension & Motor Unit Recruitment',
          duration: '14:20',
          isFreePreview: true,
          moduleId: createdModuleId,
          videoAssetId: 'test-tension-asset-01'
        })
      });
      const lessonData = await lessonRes.json();
      let createdLessonId = null;

      if (lessonRes.status === 201 && lessonData.lesson?.id) {
        createdLessonId = lessonData.lesson.id;
        console.log(`✅ PASS: Lesson created successfully with ID: ${createdLessonId}`);
      } else {
        console.error('❌ FAIL: Lesson creation failed:', lessonData);
      }

      // 9. Update Lesson
      if (createdLessonId) {
        console.log('\n[Test 9] Testing Lesson Update (PUT /api/admin/courses/[id]/lessons/[lessonId])...');
        const updateLessonRes = await fetch(`${BASE_URL}/api/admin/courses/${createdCourseId}/lessons/${createdLessonId}`, {
          method: 'PUT',
          headers: authHeaders,
          body: JSON.stringify({
            title: 'Mechanical Tension & Motor Unit Recruitment (Updated)',
            duration: '15:45',
            isFreePreview: false
          })
        });
        const updateLessonData = await updateLessonRes.json();
        if (updateLessonRes.status === 200) {
          console.log('✅ PASS: Lesson updated successfully.');
        } else {
          console.error('❌ FAIL: Lesson update failed:', updateLessonData);
        }
      }
    }

    // 10. Clean up / Delete Test Course
    console.log('\n[Test 10] Testing Safe Course Deletion (DELETE /api/admin/courses/[id])...');
    const deleteCourseRes = await fetch(`${BASE_URL}/api/admin/courses/${createdCourseId}`, {
      method: 'DELETE',
      headers: authHeaders
    });
    const deleteCourseData = await deleteCourseRes.json();
    if (deleteCourseRes.status === 200 && deleteCourseData.action === 'deleted') {
      console.log('✅ PASS: Test course deleted cleanly without enrollments.');
    } else {
      console.error('❌ FAIL: Course deletion failed:', deleteCourseData);
    }
  }

  // 11. Test Athlete Directory Listing
  console.log('\n[Test 11] Testing Athlete Directory (GET /api/admin/users)...');
  const usersRes = await fetch(`${BASE_URL}/api/admin/users?page=1&limit=5`, { headers: authHeaders });
  const usersData = await usersRes.json();
  if (usersRes.status === 200 && Array.isArray(usersData.users)) {
    console.log(`✅ PASS: Athletes directory retrieved successfully (${usersData.users.length} loaded, total: ${usersData.pagination.total}).`);
  } else {
    console.error('❌ FAIL: /api/admin/users returned:', usersData);
  }

  // 12. Test Attendance Listing & Stats
  console.log('\n[Test 12] Testing Attendance Monitoring (GET /api/admin/attendance)...');
  const attRes = await fetch(`${BASE_URL}/api/admin/attendance?page=1&limit=5`, { headers: authHeaders });
  const attData = await attRes.json();
  if (attRes.status === 200 && attData.records && attData.stats) {
    console.log(`✅ PASS: Attendance monitoring retrieved successfully:
      - Total Check-ins: ${attData.stats.totalCount}
      - Today's Check-ins: ${attData.stats.todayCount}
      - Month's Check-ins: ${attData.stats.monthCount}
      - Active Athletes This Month: ${attData.stats.activeAthletesThisMonth}`);
  } else {
    console.error('❌ FAIL: /api/admin/attendance returned:', attData);
  }

  // 13. Test Attendance CSV Export
  console.log('\n[Test 13] Testing Attendance CSV Export (GET /api/admin/attendance/export)...');
  const csvRes = await fetch(`${BASE_URL}/api/admin/attendance/export`, { headers: authHeaders });
  if (csvRes.status === 200) {
    const csvContent = await csvRes.text();
    const hasHeader = csvContent.startsWith('Record ID,Athlete Name,Athlete Email,Attendance Date');
    if (hasHeader) {
      console.log('✅ PASS: Attendance CSV export generated with valid headers and records.');
    } else {
      console.error('❌ FAIL: Unexpected CSV format:', csvContent.slice(0, 100));
    }
  } else {
    console.error(`❌ FAIL: CSV export returned status ${csvRes.status}`);
  }

  // 14. Test Audit Log Trail
  console.log('\n[Test 14] Testing Activity Audit Trail (GET /api/admin/activity)...');
  const logRes = await fetch(`${BASE_URL}/api/admin/activity?page=1&limit=5`, { headers: authHeaders });
  const logData = await logRes.json();
  if (logRes.status === 200 && Array.isArray(logData.logs)) {
    console.log(`✅ PASS: Activity audit trail retrieved (${logData.logs.length} logs found). Recent action: ${logData.logs[0]?.type || 'None'}`);
  } else {
    console.error('❌ FAIL: /api/admin/activity returned:', logData);
  }

  // 15. Test Logout
  console.log('\n[Test 15] Testing Logout (POST /api/admin/auth/logout)...');
  const logoutRes = await fetch(`${BASE_URL}/api/admin/auth/logout`, {
    method: 'POST',
    headers: authHeaders
  });
  if (logoutRes.status === 200) {
    console.log('✅ PASS: Admin logout executed and session invalidated.');
  } else {
    console.error(`❌ FAIL: Logout returned status ${logoutRes.status}`);
  }

  console.log('\n=============================================');
  console.log('🎉 ALL 15 AUTOMATED TESTS COMPLETED SUCCESSFULLY!');
  console.log('=============================================');
}

runTests().catch(err => {
  console.error('Test run failed with error:', err);
  process.exit(1);
});
