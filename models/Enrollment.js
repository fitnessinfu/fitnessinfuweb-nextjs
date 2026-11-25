import { ObjectId } from 'mongodb';
import { getDatabase } from '@/lib/mongodb';
import { getCourseById, getCourseBySlug } from './Course';

let indexesCreated = false;

export async function getEnrollmentsCollection() {
  const db = await getDatabase();
  const collection = db.collection('enrollments');

  if (!indexesCreated) {
    try {
      await collection.createIndex({ userId: 1, courseId: 1 }, { unique: true });
      await collection.createIndex({ userId: 1, status: 1 });
      indexesCreated = true;
    } catch (err) {
      // Index might already exist
    }
  }

  return collection;
}

/**
 * Enroll an authenticated user into a verified free course.
 * Idempotent: If user is already enrolled, returns existing record.
 */
export async function enrollUserInFreeCourse({ userId, courseId, courseSlug }) {
  if (!userId || !courseId) {
    throw new Error('User ID and Course ID are required for enrollment.');
  }

  const collection = await getEnrollmentsCollection();
  const userObjectId = typeof userId === 'string' && ObjectId.isValid(userId) ? new ObjectId(userId) : userId;
  const courseObjectId = typeof courseId === 'string' && ObjectId.isValid(courseId) ? new ObjectId(courseId) : courseId;

  // Verify course exists and is free
  const course = await getCourseById(courseId) || await getCourseBySlug(courseSlug);
  if (!course) {
    throw new Error('Course not found.');
  }

  if (course.accessType !== 'free') {
    throw new Error('This course requires verified payment or administrator grant.');
  }

  // Check existing enrollment
  const existing = await collection.findOne({
    userId: userObjectId,
    courseId: courseObjectId,
  });

  if (existing) {
    return {
      alreadyEnrolled: true,
      enrollment: {
        ...existing,
        _id: existing._id.toString(),
        userId: existing.userId.toString(),
        courseId: existing.courseId.toString(),
      },
      course,
    };
  }

  const now = new Date();
  const doc = {
    userId: userObjectId,
    courseId: courseObjectId,
    courseSlug: course.slug,
    status: 'active',
    accessType: 'free',
    enrolledAt: now,
    progress: {
      completedLessons: [],
      lastAccessedAt: now,
      percent: 0,
    },
    createdAt: now,
    updatedAt: now,
  };

  const result = await collection.insertOne(doc);

  return {
    alreadyEnrolled: false,
    enrollment: {
      ...doc,
      _id: result.insertedId.toString(),
      userId: userObjectId.toString(),
      courseId: courseObjectId.toString(),
    },
    course,
  };
}

/**
 * Check if a user is enrolled in a specific course.
 */
export async function isUserEnrolled(userId, courseIdentifier) {
  if (!userId || !courseIdentifier) return false;
  const collection = await getEnrollmentsCollection();
  const userObjectId = typeof userId === 'string' && ObjectId.isValid(userId) ? new ObjectId(userId) : userId;

  const isOid = typeof courseIdentifier === 'string' && ObjectId.isValid(courseIdentifier);
  const query = {
    userId: userObjectId,
    status: { $in: ['active', 'completed'] },
    $or: [
      { courseSlug: String(courseIdentifier).toLowerCase() },
      ...(isOid ? [{ courseId: new ObjectId(courseIdentifier) }] : [{ courseId: courseIdentifier }]),
    ],
  };

  const found = await collection.findOne(query);

  return Boolean(found);
}

/**
 * Fetch all enrolled courses for an authenticated user with course details attached.
 */
export async function getUserEnrollments(userId) {
  if (!userId) return [];
  const collection = await getEnrollmentsCollection();
  const userObjectId = typeof userId === 'string' && ObjectId.isValid(userId) ? new ObjectId(userId) : userId;

  const enrollments = await collection
    .find({ userId: userObjectId, status: { $in: ['active', 'completed'] } })
    .sort({ enrolledAt: -1 })
    .toArray();

  if (enrollments.length === 0) return [];

  // Populate course details for each enrollment
  const populated = await Promise.all(
    enrollments.map(async (enr) => {
      const course = await getCourseById(enr.courseId);
      return {
        _id: enr._id.toString(),
        userId: enr.userId.toString(),
        courseId: enr.courseId.toString(),
        courseSlug: enr.courseSlug,
        status: enr.status,
        enrolledAt: enr.enrolledAt,
        progress: enr.progress || { completedLessons: [], percent: 0 },
        course: course || {
          title: enr.courseSlug,
          slug: enr.courseSlug,
          category: 'General',
          icon: '📚',
          duration: 'Self-paced',
          description: 'Course information',
        },
      };
    })
  );

  return populated;
}
