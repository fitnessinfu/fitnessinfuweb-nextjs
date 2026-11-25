import { ObjectId } from 'mongodb';
import { getDatabase } from '@/lib/mongodb';
import { getCourseById, getCourseBySlug } from './Course';
import { getEnrollmentsCollection, isUserEnrolled } from './Enrollment';

let indexesCreated = false;

export async function getLessonProgressCollection() {
  const db = await getDatabase();
  const collection = db.collection('lessonProgress');

  if (!indexesCreated) {
    try {
      await collection.createIndex({ userId: 1, courseId: 1, lessonId: 1 }, { unique: true });
      await collection.createIndex({ userId: 1, courseId: 1 });
      indexesCreated = true;
    } catch (err) {
      // Index might already exist
    }
  }

  return collection;
}

/**
 * Extract all lessons from course modules into a flat list.
 */
export function extractCourseLessons(course) {
  if (!course || !course.modules || !Array.isArray(course.modules)) {
    return [];
  }
  const lessons = [];
  for (const courseModule of course.modules) {
    if (courseModule.lessons && Array.isArray(courseModule.lessons)) {
      for (const lesson of courseModule.lessons) {
        lessons.push({
          ...lesson,
          id: lesson.id,
          title: lesson.title,
          duration: lesson.duration,
          preview: Boolean(lesson.preview),
          videoFileName: lesson.videoFileName || null,
          videoAssetId: lesson.videoAssetId || null,
          thumbnail: lesson.thumbnail || null,
          published: lesson.published !== undefined ? Boolean(lesson.published) : true,
          moduleId: courseModule.id,
          moduleTitle: courseModule.title,
        });
      }
    }
  }
  return lessons;
}

/**
 * Record or toggle completion of a lesson.
 * Enforces course enrollment and validates that the lesson belongs to the specified course.
 */
export async function markLessonProgress({ userId, courseId, lessonId, completed = true }) {
  if (!userId || !courseId || !lessonId) {
    throw new Error('User ID, Course ID, and Lesson ID are required.');
  }

  // 1. Resolve course by ID or slug
  const course = (await getCourseById(courseId)) || (await getCourseBySlug(courseId));
  if (!course) {
    throw new Error('Course not found.');
  }

  // 2. Validate that user is enrolled in this course
  const enrolled = await isUserEnrolled(userId, course._id || course.id || course.slug);
  if (!enrolled) {
    throw new Error('Unauthorized: You must have an active enrollment in this course to track progress.');
  }

  const allLessons = extractCourseLessons(course);
  const targetLesson = allLessons.find((l) => l.id === lessonId);
  if (!targetLesson) {
    throw new Error(`Lesson "${lessonId}" does not exist in this course.`);
  }

  const collection = await getLessonProgressCollection();
  const userObjectId = typeof userId === 'string' && ObjectId.isValid(userId) ? new ObjectId(userId) : userId;
  const courseObjectId = typeof course._id === 'string' && ObjectId.isValid(course._id)
    ? new ObjectId(course._id)
    : course._id;

  const now = new Date();

  // 3. Upsert lesson progress record
  await collection.updateOne(
    {
      userId: userObjectId,
      courseId: courseObjectId,
      lessonId: String(lessonId),
    },
    {
      $set: {
        completed: Boolean(completed),
        completedAt: completed ? now : null,
        updatedAt: now,
      },
      $setOnInsert: {
        createdAt: now,
      },
    },
    { upsert: true }
  );

  // 4. Retrieve all completed lessons for this user & course to calculate accurate progress
  const completedDocs = await collection
    .find({
      userId: userObjectId,
      courseId: courseObjectId,
      completed: true,
    })
    .toArray();

  const completedLessonIds = completedDocs.map((d) => d.lessonId);
  const totalLessons = allLessons.length;
  const completedCount = completedLessonIds.length;
  const percent = totalLessons > 0 ? Math.min(100, Math.round((completedCount / totalLessons) * 100)) : 0;
  const isCompleted = percent === 100;

  // 5. Update user's enrollment record
  const enrollmentsCol = await getEnrollmentsCollection();
  await enrollmentsCol.updateOne(
    {
      userId: userObjectId,
      courseId: courseObjectId,
    },
    {
      $set: {
        'progress.completedLessons': completedLessonIds,
        'progress.percent': percent,
        'progress.lastAccessedAt': now,
        status: isCompleted ? 'completed' : 'active',
        updatedAt: now,
      },
    }
  );

  return {
    success: true,
    courseId: course._id.toString(),
    lessonId,
    completed: Boolean(completed),
    completedLessons: completedLessonIds,
    completedCount,
    totalLessons,
    percent,
    isCourseCompleted: isCompleted,
  };
}

/**
 * Fetch all completed lesson IDs for a specific user and course.
 */
export async function getUserCourseLessonProgress(userId, courseIdentifier) {
  if (!userId || !courseIdentifier) return [];
  const collection = await getLessonProgressCollection();
  const userObjectId = typeof userId === 'string' && ObjectId.isValid(userId) ? new ObjectId(userId) : userId;

  const course = (await getCourseById(courseIdentifier)) || (await getCourseBySlug(courseIdentifier));
  const courseObjectId = course?._id
    ? (typeof course._id === 'string' && ObjectId.isValid(course._id) ? new ObjectId(course._id) : course._id)
    : (typeof courseIdentifier === 'string' && ObjectId.isValid(courseIdentifier) ? new ObjectId(courseIdentifier) : courseIdentifier);

  const docs = await collection
    .find({
      userId: userObjectId,
      courseId: courseObjectId,
      completed: true,
    })
    .toArray();

  return docs.map((d) => d.lessonId);
}

/**
 * Aggregate complete learning progression across all accessible enrolled courses.
 * Calculates lesson-weighted overall learning progress.
 */
export async function getUserProgressionOverview(userId) {
  if (!userId) {
    return {
      overallProgress: 0,
      totalEnrolled: 0,
      completedCount: 0,
      inProgressCount: 0,
      notStartedCount: 0,
      totalLessonsCompleted: 0,
      totalLessonsAvailable: 0,
      courses: [],
      hasNoLessons: true,
    };
  }

  const enrollmentsCol = await getEnrollmentsCollection();
  const userObjectId = typeof userId === 'string' && ObjectId.isValid(userId) ? new ObjectId(userId) : userId;

  const enrollments = await enrollmentsCol
    .find({ userId: userObjectId, status: { $in: ['active', 'completed'] } })
    .sort({ 'progress.lastAccessedAt': -1, enrolledAt: -1 })
    .toArray();

  if (enrollments.length === 0) {
    return {
      overallProgress: 0,
      totalEnrolled: 0,
      completedCount: 0,
      inProgressCount: 0,
      notStartedCount: 0,
      totalLessonsCompleted: 0,
      totalLessonsAvailable: 0,
      courses: [],
      hasNoLessons: false,
    };
  }

  let totalLessonsAvailable = 0;
  let totalLessonsCompleted = 0;
  let completedCoursesCount = 0;
  let inProgressCoursesCount = 0;
  let notStartedCoursesCount = 0;

  const courseProgressionList = [];

  for (const enr of enrollments) {
    const course = await getCourseById(enr.courseId);
    if (!course) continue;

    const lessons = extractCourseLessons(course);
    const courseTotalLessons = lessons.length;

    // Get completed lessons from DB
    const completedIds = await getUserCourseLessonProgress(userObjectId, enr.courseId);
    const courseCompletedCount = completedIds.length;

    totalLessonsAvailable += courseTotalLessons;
    totalLessonsCompleted += courseCompletedCount;

    let percent = 0;
    let status = 'enrolled'; // 'enrolled' | 'in_progress' | 'completed'

    if (courseTotalLessons > 0) {
      percent = Math.min(100, Math.round((courseCompletedCount / courseTotalLessons) * 100));
      if (percent === 100) {
        status = 'completed';
        completedCoursesCount++;
      } else if (percent > 0) {
        status = 'in_progress';
        inProgressCoursesCount++;
      } else {
        notStartedCoursesCount++;
      }
    } else {
      notStartedCoursesCount++;
    }

    courseProgressionList.push({
      enrollmentId: enr._id.toString(),
      courseId: course._id.toString(),
      slug: course.slug,
      title: course.title,
      category: course.category,
      badge: course.badge,
      badgeColor: course.badgeColor,
      icon: course.icon || '🏋️',
      tagline: course.tagline,
      accessType: course.accessType,
      priceFormatted: course.priceFormatted,
      enrolledAt: enr.enrolledAt,
      lastAccessedAt: enr.progress?.lastAccessedAt || enr.enrolledAt,
      completedLessons: completedIds,
      completedCount: courseCompletedCount,
      totalLessons: courseTotalLessons,
      percent,
      status,
      hasLessons: courseTotalLessons > 0,
    });
  }

  // Calculate weighted overall progress across accessible enrolled courses
  let overallProgress = 0;
  const hasNoLessons = totalLessonsAvailable === 0;

  if (totalLessonsAvailable > 0) {
    overallProgress = Math.min(100, Math.round((totalLessonsCompleted / totalLessonsAvailable) * 100));
  }

  return {
    overallProgress,
    totalEnrolled: enrollments.length,
    completedCount: completedCoursesCount,
    inProgressCount: inProgressCoursesCount,
    notStartedCount: notStartedCoursesCount,
    totalLessonsCompleted,
    totalLessonsAvailable,
    hasNoLessons,
    courses: courseProgressionList,
  };
}
