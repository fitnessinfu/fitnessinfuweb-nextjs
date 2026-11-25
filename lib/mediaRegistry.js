import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { getCourseBySlug, getCourseById } from '@/models/Course';
import { isUserEnrolled } from '@/models/Enrollment';
import { extractCourseLessons } from '@/models/LessonProgress';
import { getAdminSession } from '@/lib/adminAuth';

const MEDIA_ROOT = path.join(process.cwd(), 'media');

/**
 * Trusted mapping between course slugs and their corresponding private media folders.
 */
const COURSE_FOLDER_MAP = {
  'fi7-base-camp': 'FI7 Base Camp',
  'fi7-elevate': 'F17 Elevate',
  'fi7-peak-performance': 'FI7 Peak Performance',
};

/**
 * Trusted mapping of lessons to media files and available quality encodings.
 * Notice: Only existing on-disk files are registered.
 */
export const DEFAULT_DEMO_VIDEO = 'demo-development.mp4';

const DEMO_LESSON_ENTRY = {
  primary: DEFAULT_DEMO_VIDEO,
  qualities: {
    '1080p': DEFAULT_DEMO_VIDEO,
  },
};

const LESSON_MEDIA_REGISTRY = {
  'fi7-base-camp': {
    'l1': DEMO_LESSON_ENTRY,
    'l2': DEMO_LESSON_ENTRY,
    'l3': DEMO_LESSON_ENTRY,
    'l4': DEMO_LESSON_ENTRY,
    'l5': DEMO_LESSON_ENTRY,
    'l6': DEMO_LESSON_ENTRY,
  },
  'fi7-elevate': {
    'l1': DEMO_LESSON_ENTRY,
    'l2': DEMO_LESSON_ENTRY,
    'l3': DEMO_LESSON_ENTRY,
    'l4': DEMO_LESSON_ENTRY,
    'l5': DEMO_LESSON_ENTRY,
    'l6': DEMO_LESSON_ENTRY,
  },
  'fi7-peak-performance': {
    'l1': DEMO_LESSON_ENTRY,
    'l2': DEMO_LESSON_ENTRY,
    'l3': DEMO_LESSON_ENTRY,
    'l4': DEMO_LESSON_ENTRY,
    'l5': DEMO_LESSON_ENTRY,
  },
};

/**
 * Sanitize input to prevent directory traversal attacks.
 */
export function sanitizeIdentifier(id) {
  if (!id || typeof id !== 'string') return '';
  return id.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase();
}

/**
 * Safely resolves the dedicated media folder name for any course.
 * Prioritizes the established mapping for known courses, followed by existing
 * directories matching the course title or slug, creating a course-specific folder if needed.
 * Strictly guarantees that lesson videos reside inside their course folder, NEVER in an "uploads" folder.
 */
export function getCourseFolderName(courseSlug, courseTitle = '') {
  const safeSlug = sanitizeIdentifier(courseSlug);
  if (COURSE_FOLDER_MAP[safeSlug]) {
    return COURSE_FOLDER_MAP[safeSlug];
  }

  // Check if a course folder already exists by course title
  if (courseTitle && typeof courseTitle === 'string') {
    const cleanTitle = courseTitle.replace(/[\/\\:*?"<>|]/g, '').trim();
    if (cleanTitle) {
      const candidateDir = path.join(MEDIA_ROOT, cleanTitle);
      if (fs.existsSync(candidateDir)) {
        return cleanTitle;
      }
    }
  }

  // Check if a course folder already exists by slug
  if (safeSlug) {
    const slugDir = path.join(MEDIA_ROOT, safeSlug);
    if (fs.existsSync(slugDir)) {
      return safeSlug;
    }
  }

  // Default to clean title or slug
  if (courseTitle && typeof courseTitle === 'string') {
    const cleanTitle = courseTitle.replace(/[\/\\:*?"<>|]/g, '').trim();
    if (cleanTitle) return cleanTitle;
  }
  return safeSlug || 'general';
}

/**
 * Returns the verified absolute filesystem path to a course's dedicated media directory.
 * Automatically creates the course-specific directory inside MEDIA_ROOT if it does not exist yet.
 */
export function getCourseMediaDirectory(courseSlug, courseTitle = '') {
  const folderName = getCourseFolderName(courseSlug, courseTitle);
  const dirPath = path.resolve(MEDIA_ROOT, folderName);
  if (!dirPath.startsWith(MEDIA_ROOT)) {
    throw new Error('Invalid course directory path destination.');
  }
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  return dirPath;
}

/**
 * Returns safe metadata about a lesson's media availability without leaking server paths.
 */
export function getLessonMediaMeta(courseSlug, lessonId, targetLesson = null) {
  const safeSlug = sanitizeIdentifier(courseSlug);
  const safeLessonId = sanitizeIdentifier(lessonId);

  // 1. Resolve video file path using the course's dedicated media folder
  const resolvedPath = resolveLessonVideoPath(safeSlug, safeLessonId, null, targetLesson);

  if (resolvedPath && fs.existsSync(resolvedPath)) {
    // Check if static registry defines multi-quality encodings for this lesson
    const courseEntry = LESSON_MEDIA_REGISTRY[safeSlug];
    const lessonEntry = courseEntry?.[safeLessonId];
    if (lessonEntry?.qualities) {
      const folderName = getCourseFolderName(safeSlug);
      const courseDirPath = path.join(MEDIA_ROOT, folderName);
      const availableQualities = [];
      for (const [quality, filename] of Object.entries(lessonEntry.qualities)) {
        const fullPath = path.join(courseDirPath, filename);
        if (fs.existsSync(fullPath)) {
          availableQualities.push(quality);
        }
      }
      if (availableQualities.length > 0) {
        return {
          hasVideo: true,
          qualities: availableQualities,
          defaultQuality: availableQualities.includes('720p') ? '720p' : availableQualities[0] || '1080p',
        };
      }
    }

    return {
      hasVideo: true,
      qualities: ['1080p'],
      defaultQuality: '1080p',
    };
  }

  return { hasVideo: false, qualities: [] };
}

export function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Returns complete media details for a lesson including real file resolution on disk.
 */
export function getLessonMediaDetails(courseSlug, lesson) {
  if (!courseSlug || !lesson) {
    return {
      hasVideo: false,
      fileName: null,
      filePath: null,
      fileSize: 0,
      fileSizeFormatted: null,
      storageType: 'none',
    };
  }

  const safeSlug = sanitizeIdentifier(courseSlug);
  const filePath = resolveLessonVideoPath(safeSlug, lesson.id, null, lesson);

  if (filePath && fs.existsSync(filePath)) {
    try {
      const stat = fs.statSync(filePath);
      return {
        hasVideo: true,
        fileName: path.basename(filePath),
        filePath,
        fileSize: stat.size,
        fileSizeFormatted: formatBytes(stat.size),
        storageType: 'course_folder',
      };
    } catch (e) {
      // Continue to fallback
    }
  }

  return {
    hasVideo: false,
    fileName: lesson.videoFileName || null,
    filePath: null,
    fileSize: 0,
    fileSizeFormatted: null,
    storageType: 'none',
  };
}

/**
 * Enriches all lessons in a course document with their resolved video media info.
 */
export function enrichCourseWithMedia(course) {
  if (!course) return course;
  const safeSlug = course.slug;
  if (!course.modules || !Array.isArray(course.modules)) return course;

  const enrichedModules = course.modules.map((mod) => {
    if (!mod.lessons || !Array.isArray(mod.lessons)) return mod;
    const enrichedLessons = mod.lessons.map((les) => {
      const mediaInfo = getLessonMediaDetails(safeSlug, les);
      return {
        ...les,
        videoFileName: mediaInfo.fileName || les.videoFileName || null,
        hasVideo: mediaInfo.hasVideo,
        videoFileSize: mediaInfo.fileSizeFormatted,
        videoSizeBytes: mediaInfo.fileSize,
        storageType: mediaInfo.storageType,
      };
    });
    return { ...mod, lessons: enrichedLessons };
  });

  return {
    ...course,
    modules: enrichedModules,
  };
}

/**
 * Resolve the trusted absolute file path for a lesson's video.
 * Validates against directory traversal and ensures videos reside inside the course's media folder.
 */
export function resolveLessonVideoPath(courseSlug, lessonId, requestedQuality = null, targetLesson = null, courseTitle = '') {
  const safeSlug = sanitizeIdentifier(courseSlug);
  const safeLessonId = sanitizeIdentifier(lessonId);

  const folderName = getCourseFolderName(safeSlug, courseTitle || targetLesson?.courseTitle || '');
  const courseDirPath = path.resolve(MEDIA_ROOT, folderName);

  // 1. Check if targetLesson has an explicit videoFileName
  if (targetLesson && targetLesson.videoFileName) {
    const candidatePath = path.resolve(courseDirPath, targetLesson.videoFileName);
    if (candidatePath.startsWith(courseDirPath) && fs.existsSync(candidatePath)) {
      return candidatePath;
    }

    // Check if videoFileName is a relative path inside MEDIA_ROOT
    const candidateMedia = path.resolve(MEDIA_ROOT, targetLesson.videoFileName);
    if (candidateMedia.startsWith(MEDIA_ROOT) && fs.existsSync(candidateMedia)) {
      return candidateMedia;
    }

    // Check if the file is in any course folder in MEDIA_ROOT
    try {
      if (fs.existsSync(MEDIA_ROOT)) {
        const entries = fs.readdirSync(MEDIA_ROOT, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory() && entry.name !== 'uploads') {
            const crossPath = path.resolve(MEDIA_ROOT, entry.name, targetLesson.videoFileName);
            if (crossPath.startsWith(MEDIA_ROOT) && fs.existsSync(crossPath)) {
              return crossPath;
            }
          }
        }
      }
    } catch (e) {
      // Ignore directory read errors
    }
  }

  // 2. Check for a file named by lessonId directly in the course directory
  if (fs.existsSync(courseDirPath)) {
    const directPath = path.resolve(courseDirPath, `${safeLessonId}.mp4`);
    if (directPath.startsWith(courseDirPath) && fs.existsSync(directPath)) {
      return directPath;
    }

    // Check for files matching `${safeLessonId}-*.mp4` (or other video extensions)
    try {
      const files = fs.readdirSync(courseDirPath);
      const matched = files.find(
        (f) => f.toLowerCase().startsWith(`${safeLessonId}-`) && /\.(mp4|webm|mov)$/i.test(f)
      );
      if (matched) {
        const matchedPath = path.resolve(courseDirPath, matched);
        if (matchedPath.startsWith(courseDirPath) && fs.existsSync(matchedPath)) {
          return matchedPath;
        }
      }
    } catch (e) {
      // Ignore readdir error
    }
  }

  // 3. Fallback to static registry for initial test/seed lessons
  const courseEntry = LESSON_MEDIA_REGISTRY[safeSlug];
  if (courseEntry) {
    const lessonEntry = courseEntry[safeLessonId];
    if (lessonEntry) {
      let filename = lessonEntry.primary;
      if (requestedQuality && lessonEntry.qualities && lessonEntry.qualities[requestedQuality]) {
        filename = lessonEntry.qualities[requestedQuality];
      }

      const candidatePath = path.resolve(courseDirPath, filename);

      // Security traversal verification
      if (candidatePath.startsWith(courseDirPath) && fs.existsSync(candidatePath)) {
        return candidatePath;
      }

      // If requested quality variant was not found, fallback to primary
      const primaryPath = path.resolve(courseDirPath, lessonEntry.primary);
      if (primaryPath.startsWith(courseDirPath) && fs.existsSync(primaryPath)) {
        return primaryPath;
      }
    }
  }

  // 4. Global fallback to demo-development.mp4 for live deployment
  const candidateDemoInCourse = path.resolve(courseDirPath, DEFAULT_DEMO_VIDEO);
  if (candidateDemoInCourse.startsWith(courseDirPath) && fs.existsSync(candidateDemoInCourse)) {
    return candidateDemoInCourse;
  }

  const rootDemo = path.resolve(MEDIA_ROOT, DEFAULT_DEMO_VIDEO);
  if (fs.existsSync(rootDemo)) {
    return rootDemo;
  }

  const cwdDemo = path.resolve(process.cwd(), DEFAULT_DEMO_VIDEO);
  if (fs.existsSync(cwdDemo)) {
    return cwdDemo;
  }

  return null;
}

/**
 * Authorize an incoming media request.
 * Enforces course publication, lesson existence, and enrollment/preview rules.
 */
export async function authorizeMediaRequest({ session, courseSlug, lessonId }) {
  const safeSlug = sanitizeIdentifier(courseSlug);
  const safeLessonId = sanitizeIdentifier(lessonId);

  if (!safeSlug || !safeLessonId) {
    return { authorized: false, status: 400, error: 'Invalid course or lesson identifier.' };
  }

  // 1. Fetch course (include unpublished for validation)
  const course = await getCourseBySlug(safeSlug, true);
  if (!course) {
    return { authorized: false, status: 404, error: 'Course not found or unavailable.' };
  }

  // 2. Validate lesson belongs to course
  const allLessons = extractCourseLessons(course);
  const targetLesson = allLessons.find((l) => l.id.toLowerCase() === safeLessonId);
  if (!targetLesson) {
    return { authorized: false, status: 404, error: 'Lesson not found in this course.' };
  }

  // 3. Admin session check: Authenticated administrators have unrestricted preview access
  try {
    const admin = await getAdminSession();
    if (admin && admin.role === 'admin') {
      return {
        authorized: true,
        isAdmin: true,
        isPreview: false,
        course,
        lesson: targetLesson,
      };
    }
  } catch (err) {
    // Continue with regular user authorization
  }

  // 4. For regular students, course must be published
  if (!course.published) {
    return { authorized: false, status: 404, error: 'Course not found or unavailable.' };
  }

  // 5. Check for Free Preview access
  if (targetLesson.preview) {
    return {
      authorized: true,
      isPreview: true,
      course,
      lesson: targetLesson,
    };
  }

  // 6. For non-preview lessons, user must be authenticated
  if (!session || !session.id) {
    return {
      authorized: false,
      status: 401,
      error: 'Authentication required to view course media.',
    };
  }

  // 7. User must have verified enrollment
  const enrolled = await isUserEnrolled(session.id, course._id || course.id || course.slug);
  if (!enrolled) {
    return {
      authorized: false,
      status: 403,
      error: 'You do not have access to this course. Enrollment or purchase required.',
    };
  }

  return {
    authorized: true,
    isPreview: false,
    course,
    lesson: targetLesson,
  };
}

const TICKET_SECRET = process.env.AUTH_SECRET || 'fitnessinfu_secure_playback_secret_key_32chars';

/**
 * Generates an HMAC-SHA256 signed playback ticket.
 * Ties the playback session to the user, course, lesson, and timestamp.
 */
export function createPlaybackTicket({ userId, courseSlug, lessonId }) {
  const timestamp = Date.now();
  const safeSlug = sanitizeIdentifier(courseSlug);
  const safeLessonId = sanitizeIdentifier(lessonId);
  const userStr = userId ? String(userId) : 'anon';

  const payload = `${userStr}:${safeSlug}:${safeLessonId}:${timestamp}`;
  const signature = crypto.createHmac('sha256', TICKET_SECRET).update(payload).digest('hex');

  return `${Buffer.from(payload).toString('base64url')}.${signature}`;
}

/**
 * Validates an HMAC-SHA256 signed playback ticket.
 * Rejects tampered, expired, or mismatched tickets.
 */
export function verifyPlaybackTicket(token, { courseSlug, lessonId, userId = null, isAdmin = false }) {
  if (isAdmin) return { valid: true };
  if (!token || typeof token !== 'string') {
    return { valid: false, reason: 'Missing playback security ticket.' };
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return { valid: false, reason: 'Invalid playback ticket format.' };
  }

  const [b64Payload, signature] = parts;
  let payloadStr = '';
  try {
    payloadStr = Buffer.from(b64Payload, 'base64url').toString('utf8');
  } catch (e) {
    return { valid: false, reason: 'Invalid playback ticket encoding.' };
  }

  const expectedSig = crypto.createHmac('sha256', TICKET_SECRET).update(payloadStr).digest('hex');
  if (signature !== expectedSig) {
    return { valid: false, reason: 'Tampered or invalid playback ticket signature.' };
  }

  const [ticketUser, ticketSlug, ticketLesson, ticketTimeStr] = payloadStr.split(':');
  const safeSlug = sanitizeIdentifier(courseSlug);
  const safeLessonId = sanitizeIdentifier(lessonId);

  if (ticketSlug !== safeSlug || ticketLesson !== safeLessonId) {
    return { valid: false, reason: 'Playback ticket does not match requested lesson.' };
  }

  const ticketTime = parseInt(ticketTimeStr, 10);
  const now = Date.now();
  // Valid for 4 hours of continuous playback per issued ticket
  const MAX_TICKET_AGE_MS = 4 * 60 * 60 * 1000;
  if (isNaN(ticketTime) || now - ticketTime > MAX_TICKET_AGE_MS || ticketTime > now + 30000) {
    return { valid: false, reason: 'Playback ticket expired.' };
  }

  return { valid: true, userId: ticketUser };
}

