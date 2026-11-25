import { ObjectId } from 'mongodb';
import { getDatabase } from '@/lib/mongodb';

let indexesCreated = false;

/**
 * Returns formatted date string "YYYY-MM-DD" strictly in Asia/Kolkata timezone.
 * Consistent across all server environments.
 */
export function getKolkataDateString(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

/**
 * Returns current month string "YYYY-MM" in Asia/Kolkata.
 */
export function getKolkataMonthString(date = new Date()) {
  const full = getKolkataDateString(date);
  return full.slice(0, 7);
}

export async function getAttendanceCollection() {
  const db = await getDatabase();
  const collection = db.collection('attendance');

  if (!indexesCreated) {
    try {
      await collection.createIndex({ userId: 1, attendanceDate: 1 }, { unique: true });
      await collection.createIndex({ userId: 1, createdAt: -1 });
      indexesCreated = true;
    } catch (err) {
      // Index might already exist
    }
  }

  return collection;
}

/**
 * Record daily attendance for an authenticated user.
 * Atomic and idempotent: rejects future dates and enforces one record per calendar day.
 */
export async function recordAttendance(userId) {
  if (!userId) {
    throw new Error('User authentication required to record attendance.');
  }

  const collection = await getAttendanceCollection();
  const userObjectId = typeof userId === 'string' && ObjectId.isValid(userId) ? new ObjectId(userId) : userId;
  const todayStr = getKolkataDateString();
  const now = new Date();

  // Try to atomically insert attendance with duplicate-key handling
  try {
    const doc = {
      userId: userObjectId,
      attendanceDate: todayStr,
      createdAt: now,
      timezone: 'Asia/Kolkata',
    };

    const result = await collection.insertOne(doc);

    return {
      success: true,
      alreadyMarked: false,
      attendanceDate: todayStr,
      id: result.insertedId.toString(),
      message: 'Attendance recorded successfully for today!',
    };
  } catch (err) {
    // If unique compound index collision (E11000) occurs, attendance is already marked today
    if (err.code === 11000 || err.message?.includes('E11000')) {
      const existing = await collection.findOne({
        userId: userObjectId,
        attendanceDate: todayStr,
      });

      return {
        success: true,
        alreadyMarked: true,
        attendanceDate: todayStr,
        id: existing?._id?.toString() || null,
        message: 'Attendance already recorded for today.',
      };
    }
    throw err;
  }
}

/**
 * Calculate consecutive attendance streak up to today or yesterday.
 */
export function calculateAttendanceStreak(attendanceDates, todayStr = getKolkataDateString()) {
  if (!attendanceDates || attendanceDates.length === 0) return 0;
  const set = new Set(attendanceDates);

  // Parse today in Asia/Kolkata (midday to avoid DST edge cases)
  const today = new Date(`${todayStr}T12:00:00+05:30`);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getKolkataDateString(yesterday);

  let checkDate;
  if (set.has(todayStr)) {
    checkDate = new Date(today);
  } else if (set.has(yesterdayStr)) {
    checkDate = new Date(yesterday);
  } else {
    return 0; // Streak broken
  }

  let streak = 0;
  // Maximum scan back 365 days
  for (let i = 0; i < 365; i++) {
    const dateStr = getKolkataDateString(checkDate);
    if (set.has(dateStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Fetch complete attendance statistics and calendar history for a user.
 */
export async function getUserAttendanceStats(userId, targetMonth = null) {
  if (!userId) {
    return {
      totalDays: 0,
      currentStreak: 0,
      isMarkedToday: false,
      todayDate: getKolkataDateString(),
      monthlyCount: 0,
      monthlyRate: 0,
      markedDates: [],
    };
  }

  const collection = await getAttendanceCollection();
  const userObjectId = typeof userId === 'string' && ObjectId.isValid(userId) ? new ObjectId(userId) : userId;

  const records = await collection
    .find({ userId: userObjectId })
    .sort({ attendanceDate: 1 })
    .toArray();

  const attendanceDates = records.map((r) => r.attendanceDate);
  const todayStr = getKolkataDateString();
  const isMarkedToday = attendanceDates.includes(todayStr);
  const currentStreak = calculateAttendanceStreak(attendanceDates, todayStr);
  const totalDays = records.length;

  const monthToCheck = targetMonth || getKolkataMonthString();
  const monthlyRecords = records.filter((r) => r.attendanceDate.startsWith(monthToCheck));
  const monthlyCount = monthlyRecords.length;

  // Calculate day-of-month progress for consistency rate
  const now = new Date();
  const currentMonthStr = getKolkataMonthString(now);
  let daysInPeriod = 1;

  if (monthToCheck === currentMonthStr) {
    const parts = todayStr.split('-');
    daysInPeriod = parseInt(parts[2], 10) || 1;
  } else {
    // Total days in that month
    const [y, m] = monthToCheck.split('-').map(Number);
    daysInPeriod = new Date(y, m, 0).getDate();
  }

  const monthlyRate = daysInPeriod > 0 ? Math.min(100, Math.round((monthlyCount / daysInPeriod) * 100)) : 0;

  return {
    totalDays,
    currentStreak,
    isMarkedToday,
    todayDate: todayStr,
    currentMonth: monthToCheck,
    monthlyCount,
    monthlyRate,
    markedDates: attendanceDates,
  };
}

/**
 * Admin: Retrieve paginated attendance logs with user details.
 */
export async function getAttendancePaginated({
  fromDate = null,
  toDate = null,
  search = '',
  page = 1,
  limit = 20,
} = {}) {
  const collection = await getAttendanceCollection();
  const db = await getDatabase();
  const usersColl = db.collection('users');

  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (safePage - 1) * safeLimit;

  const matchQuery = {};

  if (fromDate && toDate) {
    matchQuery.attendanceDate = { $gte: fromDate, $lte: toDate };
  } else if (fromDate) {
    matchQuery.attendanceDate = { $gte: fromDate };
  } else if (toDate) {
    matchQuery.attendanceDate = { $lte: toDate };
  }

  // If search provided, filter user IDs first
  if (search && search.trim()) {
    const s = search.trim();
    const matchedUsers = await usersColl
      .find(
        {
          $or: [
            { name: { $regex: s, $options: 'i' } },
            { email: { $regex: s, $options: 'i' } },
          ],
        },
        { projection: { _id: 1 } }
      )
      .toArray();

    const matchedUserIds = matchedUsers.map((u) => u._id);
    matchQuery.userId = { $in: matchedUserIds };
  }

  const [records, total] = await Promise.all([
    collection.find(matchQuery).sort({ attendanceDate: -1, createdAt: -1 }).skip(skip).limit(safeLimit).toArray(),
    collection.countDocuments(matchQuery),
  ]);

  // Enrich with user info
  const userIds = records.map((r) => r.userId);
  const users = await usersColl.find({ _id: { $in: userIds } }, { projection: { name: 1, email: 1 } }).toArray();
  const userMap = {};
  for (const u of users) {
    userMap[u._id.toString()] = { name: u.name, email: u.email };
  }

  const enriched = records.map((r) => {
    const uInfo = userMap[r.userId.toString()] || { name: 'Unknown User', email: 'N/A' };
    return {
      id: r._id.toString(),
      _id: r._id.toString(),
      userId: r.userId.toString(),
      userName: uInfo.name,
      userEmail: uInfo.email,
      attendanceDate: r.attendanceDate,
      createdAt: r.createdAt,
      timezone: r.timezone || 'Asia/Kolkata',
    };
  });

  return {
    records: enriched,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit) || 1,
    },
  };
}

/**
 * Admin: Get attendance aggregate statistics.
 */
export async function getAttendanceSummaryStats() {
  const collection = await getAttendanceCollection();
  const todayStr = getKolkataDateString();
  const currentMonthStr = getKolkataMonthString();

  const [todayCount, monthCount, totalCount, activeUsersThisMonth] = await Promise.all([
    collection.countDocuments({ attendanceDate: todayStr }),
    collection.countDocuments({ attendanceDate: { $regex: `^${currentMonthStr}` } }),
    collection.countDocuments({}),
    collection.distinct('userId', { attendanceDate: { $regex: `^${currentMonthStr}` } }),
  ]);

  return {
    todayCount,
    monthCount,
    totalCount,
    activeAthletesThisMonth: activeUsersThisMonth.length,
    todayDate: todayStr,
    currentMonth: currentMonthStr,
  };
}

/**
 * Admin: Retrieve attendance records formatted for CSV export.
 */
export async function getAllAttendanceForExport({ fromDate = null, toDate = null, search = '' } = {}) {
  const collection = await getAttendanceCollection();
  const db = await getDatabase();
  const usersColl = db.collection('users');

  const matchQuery = {};
  if (fromDate && toDate) {
    matchQuery.attendanceDate = { $gte: fromDate, $lte: toDate };
  } else if (fromDate) {
    matchQuery.attendanceDate = { $gte: fromDate };
  } else if (toDate) {
    matchQuery.attendanceDate = { $lte: toDate };
  }

  if (search && search.trim()) {
    const s = search.trim();
    const matchedUsers = await usersColl
      .find(
        {
          $or: [
            { name: { $regex: s, $options: 'i' } },
            { email: { $regex: s, $options: 'i' } },
          ],
        },
        { projection: { _id: 1 } }
      )
      .toArray();

    matchQuery.userId = { $in: matchedUsers.map((u) => u._id) };
  }

  const records = await collection
    .find(matchQuery)
    .sort({ attendanceDate: -1, createdAt: -1 })
    .limit(10000)
    .toArray();

  const userIds = records.map((r) => r.userId);
  const users = await usersColl.find({ _id: { $in: userIds } }, { projection: { name: 1, email: 1 } }).toArray();
  const userMap = {};
  for (const u of users) {
    userMap[u._id.toString()] = { name: u.name, email: u.email };
  }

  return records.map((r) => {
    const uInfo = userMap[r.userId.toString()] || { name: 'Unknown', email: 'N/A' };
    return {
      id: r._id.toString(),
      athleteName: uInfo.name,
      athleteEmail: uInfo.email,
      attendanceDate: r.attendanceDate,
      recordedAt: r.createdAt ? new Date(r.createdAt).toISOString() : '',
      timezone: r.timezone || 'Asia/Kolkata',
    };
  });
}

