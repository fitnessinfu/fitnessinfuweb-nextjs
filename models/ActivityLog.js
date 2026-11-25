import { getDatabase } from '@/lib/mongodb';

let indexesCreated = false;

export async function getActivityCollection() {
  const db = await getDatabase();
  const collection = db.collection('activityLogs');

  if (!indexesCreated) {
    try {
      await collection.createIndex({ createdAt: -1 });
      await collection.createIndex({ type: 1, createdAt: -1 });
      await collection.createIndex({ userId: 1, createdAt: -1 });
      indexesCreated = true;
    } catch (err) {
      // Index might already exist
    }
  }

  return collection;
}

/**
 * Record a privacy-conscious activity event.
 */
export async function logActivity({
  type, // 'auth:login', 'course:enroll', 'lesson:complete', 'attendance:marked', 'admin:course_created', etc.
  actorId,
  actorEmail,
  actorRole = 'user',
  targetType, // 'course', 'user', 'lesson', 'attendance'
  targetId,
  targetTitle,
  details = '',
  ip = null,
}) {
  try {
    const collection = await getActivityCollection();
    const doc = {
      type,
      actorId: actorId ? actorId.toString() : null,
      actorEmail: actorEmail || 'system',
      actorRole,
      targetType: targetType || null,
      targetId: targetId ? targetId.toString() : null,
      targetTitle: targetTitle || null,
      details: typeof details === 'string' ? details.slice(0, 500) : '',
      ip: ip || null,
      createdAt: new Date(),
    };

    await collection.insertOne(doc);
    return true;
  } catch (err) {
    // Non-blocking logger
    console.error('Failed to record activity log:', err);
    return false;
  }
}

/**
 * Fetch paginated activity logs for admin review.
 */
export async function getActivityLogsPaginated({ type = 'all', page = 1, limit = 20 }) {
  const collection = await getActivityCollection();
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (safePage - 1) * safeLimit;

  const query = {};
  if (type && type !== 'all') {
    if (type === 'admin') {
      query.type = { $regex: '^admin:' };
    } else if (type === 'auth') {
      query.type = { $regex: '^auth:' };
    } else if (type === 'course') {
      query.type = { $regex: '^course:' };
    } else if (type === 'lesson') {
      query.type = { $regex: '^lesson:' };
    } else if (type === 'attendance') {
      query.type = { $regex: '^attendance:' };
    } else {
      query.type = type;
    }
  }

  const [logs, total] = await Promise.all([
    collection.find(query).sort({ createdAt: -1 }).skip(skip).limit(safeLimit).toArray(),
    collection.countDocuments(query),
  ]);

  return {
    logs: logs.map((log) => ({
      ...log,
      _id: log._id.toString(),
      id: log._id.toString(),
    })),
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit) || 1,
    },
  };
}
