import { ObjectId } from 'mongodb';
import { getDatabase } from '@/lib/mongodb';
import { hashPassword } from '@/lib/auth';

let indexesCreated = false;

export async function getUsersCollection() {
  const db = await getDatabase();
  const collection = db.collection('users');

  if (!indexesCreated) {
    try {
      await collection.createIndex({ email: 1 }, { unique: true });
      indexesCreated = true;
    } catch (err) {
      // Index might already exist or will be verified on reconnect
    }
  }

  return collection;
}

/**
 * Validate email format with standard RFC regex.
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim().toLowerCase());
}

/**
 * Validate password strength: minimum 8 characters, at least 1 letter and 1 number.
 */
export function isValidPassword(password) {
  if (!password || typeof password !== 'string') return false;
  if (password.length < 8) return false;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  return hasLetter && hasNumber;
}

/**
 * Find user by email (internal use - includes passwordHash).
 */
export async function findUserByEmail(email) {
  if (!email) return null;
  const normalized = email.trim().toLowerCase();
  const collection = await getUsersCollection();
  return collection.findOne({ email: normalized });
}

/**
 * Find user by ObjectId or string ID (returns sanitized user).
 */
export async function findUserById(id) {
  if (!id) return null;
  const collection = await getUsersCollection();
  const query = typeof id === 'string' && ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id };
  const user = await collection.findOne(query, { projection: { passwordHash: 0 } });
  return user;
}

/**
 * Create a new user with validation and password hashing.
 * Strict default role: 'user'. Never allows client to specify role.
 */
export async function createUser({ name, email, password }) {
  const cleanName = (name || '').trim();
  const normalizedEmail = (email || '').trim().toLowerCase();

  if (!cleanName || cleanName.length < 2) {
    throw new Error('Full name must be at least 2 characters.');
  }

  if (!isValidEmail(normalizedEmail)) {
    throw new Error('Please provide a valid email address.');
  }

  if (!isValidPassword(password)) {
    throw new Error(
      'Password must be at least 8 characters long and contain at least one letter and one number.'
    );
  }

  const collection = await getUsersCollection();

  // Check for duplicate email
  const existing = await collection.findOne({ email: normalizedEmail });
  if (existing) {
    throw new Error('An account with this email address already exists.');
  }

  const passwordHash = await hashPassword(password);
  const now = new Date();

  const newUser = {
    name: cleanName,
    email: normalizedEmail,
    passwordHash,
    role: 'user', // strictly enforced
    status: 'active',
    createdAt: now,
    updatedAt: now,
    lastActivityAt: now,
  };

  const result = await collection.insertOne(newUser);

  return {
    _id: result.insertedId,
    id: result.insertedId.toString(),
    name: cleanName,
    email: normalizedEmail,
    role: 'user',
    status: 'active',
    createdAt: now,
  };
}

/**
 * Admin: Retrieve paginated list of registered users with attendance & enrollment metrics.
 * Strictly excludes passwordHash.
 */
export async function getUsersPaginated({
  search = '',
  status = 'all',
  page = 1,
  limit = 10,
  sort = 'createdAt',
  order = -1,
} = {}) {
  const collection = await getUsersCollection();
  const db = await getDatabase();
  const enrollmentsColl = db.collection('enrollments');
  const attendanceColl = db.collection('attendance');

  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (safePage - 1) * safeLimit;

  const query = {};
  if (search && search.trim()) {
    const s = search.trim();
    query.$or = [
      { name: { $regex: s, $options: 'i' } },
      { email: { $regex: s, $options: 'i' } },
    ];
  }

  if (status && status !== 'all') {
    query.status = status;
  }

  const sortDoc = { [sort]: order === 1 ? 1 : -1 };

  const [users, total] = await Promise.all([
    collection
      .find(query, { projection: { passwordHash: 0 } })
      .sort(sortDoc)
      .skip(skip)
      .limit(safeLimit)
      .toArray(),
    collection.countDocuments(query),
  ]);

  const userIds = users.map((u) => u._id);

  // Aggregate enrollment counts
  const enrollCounts = await enrollmentsColl
    .aggregate([
      { $match: { userId: { $in: userIds } } },
      { $group: { _id: '$userId', count: { $sum: 1 } } },
    ])
    .toArray();
  const enrollMap = {};
  for (const item of enrollCounts) {
    enrollMap[item._id.toString()] = item.count;
  }

  // Aggregate attendance counts
  const attendanceCounts = await attendanceColl
    .aggregate([
      { $match: { userId: { $in: userIds } } },
      { $group: { _id: '$userId', count: { $sum: 1 } } },
    ])
    .toArray();
  const attendanceMap = {};
  for (const item of attendanceCounts) {
    attendanceMap[item._id.toString()] = item.count;
  }

  const enriched = users.map((u) => {
    const id = u._id.toString();
    return {
      id,
      _id: id,
      name: u.name,
      email: u.email,
      role: u.role || 'user',
      status: u.status || 'active',
      createdAt: u.createdAt,
      lastActivityAt: u.lastActivityAt || u.updatedAt || u.createdAt,
      enrollmentCount: enrollMap[id] || 0,
      attendanceCount: attendanceMap[id] || 0,
    };
  });

  return {
    users: enriched,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit) || 1,
    },
  };
}

/**
 * Admin: Retrieve comprehensive profile for an individual user.
 */
export async function getUserDetailedProfile(userId) {
  if (!userId) return null;
  const collection = await getUsersCollection();
  const db = await getDatabase();
  const enrollmentsColl = db.collection('enrollments');
  const attendanceColl = db.collection('attendance');
  const progressColl = db.collection('lessonProgress');
  const coursesColl = db.collection('courses');

  const query = typeof userId === 'string' && ObjectId.isValid(userId) ? { _id: new ObjectId(userId) } : { _id: userId };
  const user = await collection.findOne(query, { projection: { passwordHash: 0 } });
  if (!user) return null;

  const userObjId = user._id;

  // 1. Fetch user enrollments
  const enrollments = await enrollmentsColl.find({ userId: userObjId }).sort({ createdAt: -1 }).toArray();

  // 2. Fetch courses details for those enrollments
  const courseIds = enrollments.map((e) => e.courseId);
  const courses = await coursesColl.find({ _id: { $in: courseIds } }).toArray();
  const courseMap = {};
  for (const c of courses) {
    let totalLessons = 0;
    if (c.modules) {
      for (const m of c.modules) {
        if (m.lessons) totalLessons += m.lessons.length;
      }
    }
    courseMap[c._id.toString()] = {
      title: c.title,
      slug: c.slug,
      accessType: c.accessType,
      totalLessons,
      icon: c.icon,
    };
  }

  // 3. Fetch user lesson progress
  const progressRecords = await progressColl.find({ userId: userObjId }).toArray();
  const completedByCourse = {};
  for (const p of progressRecords) {
    if (p.completed) {
      const cId = p.courseId.toString();
      completedByCourse[cId] = (completedByCourse[cId] || 0) + 1;
    }
  }

  const enrichedEnrollments = enrollments.map((e) => {
    const cId = e.courseId.toString();
    const cInfo = courseMap[cId] || { title: 'Unknown Course', totalLessons: 0 };
    const completedCount = completedByCourse[cId] || 0;
    const progressPercent = cInfo.totalLessons > 0 ? Math.round((completedCount / cInfo.totalLessons) * 100) : 0;
    return {
      id: e._id.toString(),
      courseId: cId,
      courseTitle: cInfo.title,
      courseSlug: cInfo.slug,
      accessType: cInfo.accessType,
      enrolledAt: e.createdAt,
      status: e.status || 'active',
      completedLessons: completedCount,
      totalLessons: cInfo.totalLessons,
      progressPercent,
    };
  });

  // 4. Fetch user attendance history
  const attendanceRecords = await attendanceColl
    .find({ userId: userObjId })
    .sort({ attendanceDate: -1 })
    .limit(30)
    .toArray();
  const totalAttendance = await attendanceColl.countDocuments({ userId: userObjId });

  return {
    user: {
      id: user._id.toString(),
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role || 'user',
      status: user.status || 'active',
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastActivityAt: user.lastActivityAt || user.createdAt,
    },
    enrollments: enrichedEnrollments,
    attendance: {
      totalDays: totalAttendance,
      recent: attendanceRecords.map((a) => ({
        id: a._id.toString(),
        attendanceDate: a.attendanceDate,
        createdAt: a.createdAt,
      })),
    },
  };
}

/**
 * Admin: Suspend or Reactivate a user account.
 */
export async function setUserStatus(userId, status, { adminEmail = 'system', reason = '' } = {}) {
  if (!userId) throw new Error('User ID is required.');
  if (!['active', 'suspended'].includes(status)) {
    throw new Error('Invalid status. Allowed values: active, suspended.');
  }

  const collection = await getUsersCollection();
  const query = typeof userId === 'string' && ObjectId.isValid(userId) ? { _id: new ObjectId(userId) } : { _id: userId };

  const user = await collection.findOne(query);
  if (!user) throw new Error('User not found.');

  await collection.updateOne(query, {
    $set: {
      status,
      statusUpdatedAt: new Date(),
      statusUpdatedBy: adminEmail,
      statusReason: reason || '',
      updatedAt: new Date(),
    },
  });

  return { success: true, status };
}

