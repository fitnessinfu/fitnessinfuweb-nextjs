import { getDatabase } from '@/lib/mongodb';
import { getKolkataDateString } from './Attendance';

/**
 * Computes live MongoDB statistics for the Admin Dashboard.
 * Efficient parallel aggregations with zero fabricated numbers.
 */
export async function getAdminDashboardStats() {
  const db = await getDatabase();
  const usersColl = db.collection('users');
  const coursesColl = db.collection('courses');
  const enrollmentsColl = db.collection('enrollments');
  const attendanceColl = db.collection('attendance');

  const todayStr = getKolkataDateString();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    totalUsers,
    activeUsersCount,
    suspendedUsersCount,
    totalCourses,
    publishedCourses,
    freeCourses,
    paidCourses,
    totalEnrollments,
    completedEnrollments,
    todayAttendance,
    recentUsers,
    recentAttendance,
    recentEnrollments,
    recentCourses,
    allCoursesForLessons,
  ] = await Promise.all([
    // 1. User stats
    usersColl.countDocuments({}),
    usersColl.countDocuments({
      status: { $ne: 'suspended' },
      $or: [
        { lastActivityAt: { $gte: thirtyDaysAgo } },
        { createdAt: { $gte: thirtyDaysAgo } },
      ],
    }),
    usersColl.countDocuments({ status: 'suspended' }),

    // 2. Course stats
    coursesColl.countDocuments({ archived: { $ne: true } }),
    coursesColl.countDocuments({ published: true, archived: { $ne: true } }),
    coursesColl.countDocuments({ accessType: 'free', archived: { $ne: true } }),
    coursesColl.countDocuments({ accessType: 'paid', archived: { $ne: true } }),

    // 3. Enrollment stats
    enrollmentsColl.countDocuments({}),
    enrollmentsColl.countDocuments({ completed: true }),

    // 4. Today's attendance
    attendanceColl.countDocuments({ attendanceDate: todayStr }),

    // 5. Recent registrations
    usersColl
      .find({}, { projection: { passwordHash: 0 } })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray(),

    // 6. Recent attendance
    attendanceColl
      .find({})
      .sort({ attendanceDate: -1, createdAt: -1 })
      .limit(5)
      .toArray(),

    // 7. Recent enrollments
    enrollmentsColl
      .find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray(),

    // 8. Recent courses updated
    coursesColl
      .find({ archived: { $ne: true } })
      .sort({ updatedAt: -1, createdAt: -1 })
      .limit(5)
      .toArray(),

    // 9. Fetch all courses to calculate lesson counts & video assets
    coursesColl
      .find({ archived: { $ne: true } }, { projection: { modules: 1 } })
      .toArray(),
  ]);

  // Calculate total lessons and video assets
  let totalLessons = 0;
  let totalVideoAssets = 0;
  for (const c of allCoursesForLessons) {
    if (c.modules && Array.isArray(c.modules)) {
      for (const m of c.modules) {
        if (m.lessons && Array.isArray(m.lessons)) {
          totalLessons += m.lessons.length;
          for (const l of m.lessons) {
            if (l.videoFileName || l.video || l.hasVideo) {
              totalVideoAssets += 1;
            }
          }
        }
      }
    }
  }

  // Enrich recent attendance with user names
  const attendanceUserIds = recentAttendance.map((a) => a.userId);
  const attendanceUsers = await usersColl
    .find({ _id: { $in: attendanceUserIds } }, { projection: { name: 1, email: 1 } })
    .toArray();
  const attUserMap = {};
  for (const u of attendanceUsers) {
    attUserMap[u._id.toString()] = u;
  }

  // Enrich recent enrollments with user names and course titles
  const enrollUserIds = recentEnrollments.map((e) => e.userId);
  const enrollCourseIds = recentEnrollments.map((e) => e.courseId);

  const [enrollUsers, enrollCourses] = await Promise.all([
    usersColl.find({ _id: { $in: enrollUserIds } }, { projection: { name: 1, email: 1 } }).toArray(),
    coursesColl.find({ _id: { $in: enrollCourseIds } }, { projection: { title: 1, slug: 1, accessType: 1 } }).toArray(),
  ]);

  const enrollUserMap = {};
  for (const u of enrollUsers) enrollUserMap[u._id.toString()] = u;

  const enrollCourseMap = {};
  for (const c of enrollCourses) enrollCourseMap[c._id.toString()] = c;

  return {
    metrics: {
      totalUsers,
      activeUsers: activeUsersCount,
      suspendedUsers: suspendedUsersCount,
      totalCourses,
      publishedCourses,
      freeCourses,
      paidCourses,
      totalEnrollments,
      completedEnrollments,
      todayAttendance,
      totalLessons,
      totalVideoAssets,
    },
    recentUsers: recentUsers.map((u) => ({
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      role: u.role || 'user',
      status: u.status || 'active',
      createdAt: u.createdAt,
    })),
    recentAttendance: recentAttendance.map((a) => {
      const u = attUserMap[a.userId.toString()] || { name: 'Athlete', email: 'N/A' };
      return {
        id: a._id.toString(),
        userName: u.name,
        userEmail: u.email,
        attendanceDate: a.attendanceDate,
        createdAt: a.createdAt,
      };
    }),
    recentEnrollments: recentEnrollments.map((e) => {
      const u = enrollUserMap[e.userId.toString()] || { name: 'Athlete', email: 'N/A' };
      const c = enrollCourseMap[e.courseId.toString()] || { title: 'Training Program', accessType: 'free' };
      return {
        id: e._id.toString(),
        userName: u.name,
        userEmail: u.email,
        courseTitle: c.title,
        accessType: c.accessType,
        enrolledAt: e.createdAt,
      };
    }),
    recentCourses: recentCourses.map((c) => ({
      id: c._id.toString(),
      title: c.title,
      slug: c.slug,
      accessType: c.accessType,
      priceFormatted: c.priceFormatted,
      published: Boolean(c.published),
      updatedAt: c.updatedAt || c.createdAt,
    })),
  };
}
