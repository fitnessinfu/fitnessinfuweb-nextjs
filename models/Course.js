import { ObjectId } from 'mongodb';
import { getDatabase } from '@/lib/mongodb';

let indexesCreated = false;

export async function getCoursesCollection() {
  const db = await getDatabase();
  const collection = db.collection('courses');

  if (!indexesCreated) {
    try {
      await collection.createIndex({ slug: 1 }, { unique: true });
      await collection.createIndex({ published: 1, accessType: 1 });
      indexesCreated = true;
    } catch (err) {
      // Index might already exist
    }
  }

  return collection;
}

/**
 * Retrieve all published courses, with optional filtering.
 */
export async function getPublishedCourses(filter = {}) {
  const collection = await getCoursesCollection();
  const query = { published: true };

  if (filter.accessType && ['free', 'paid'].includes(filter.accessType)) {
    query.accessType = filter.accessType;
  }

  if (filter.category && filter.category !== 'all') {
    query.category = filter.category;
  }

  const courses = await collection
    .find(query, {
      projection: {
        // Exclude full lesson content from catalog list for performance
        'modules.lessons.content': 0,
      },
    })
    .sort({ sortOrder: 1, createdAt: 1 })
    .toArray();

  return courses.map(formatCourse);
}

/**
 * Retrieve a single course by its slug.
 */
export async function getCourseBySlug(slug, includeUnpublished = false) {
  if (!slug) return null;
  const collection = await getCoursesCollection();
  const query = { slug: slug.toLowerCase() };
  if (!includeUnpublished) {
    query.published = true;
  }
  const course = await collection.findOne(query);
  return course ? formatCourse(course) : null;
}

/**
 * Retrieve a course by its ID.
 */
export async function getCourseById(id) {
  if (!id) return null;
  const collection = await getCoursesCollection();
  const query = typeof id === 'string' && ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id };
  const course = await collection.findOne(query);
  return course ? formatCourse(course) : null;
}

function formatCourse(doc) {
  return {
    ...doc,
    _id: doc._id.toString(),
    id: doc._id.toString(),
  };
}

/**
 * Initial proposed seed catalog entries.
 * Configurable, idempotent, and non-destructive.
 */
export const INITIAL_COURSES = [
  {
    title: 'FI7 Base Camp',
    slug: 'fi7-base-camp',
    tagline: 'Beginner Fitness & Movement Fundamentals',
    description:
      'Foundational training designed specifically for individuals new to structured exercise. Master fundamental movement patterns, build bodily confidence, and establish sustainable fitness habits.',
    category: 'Foundation',
    badge: 'BEGINNER',
    badgeColor: '#b8860b',
    accessType: 'free',
    price: 0,
    priceFormatted: 'Free',
    duration: '4 Weeks',
    schedule: '3 Sessions per Week',
    icon: '🌱',
    sortOrder: 1,
    published: true,
    learningObjectives: [
      'Master the 5 fundamental human movement patterns (Squat, Hinge, Push, Pull, Carry)',
      'Establish safe breathing and bracing techniques for spine stability',
      'Build progressive joint mobility and warm-up routines',
      'Develop baseline aerobic conditioning and active recovery habits',
      'Create an injury-free, lifelong training rhythm',
    ],
    modules: [
      {
        id: 'm1',
        title: 'Module 1: Foundations of Movement',
        description: 'Joint mechanics, neutral spine positioning, and primary movement screens.',
        lessons: [
          { id: 'l1', title: 'Welcome to FI7 Base Camp & Movement Screen', duration: '18 min', preview: true },
          { id: 'l2', title: 'The Hip Hinge & Deep Squat Mechanics', duration: '24 min', preview: false },
          { id: 'l3', title: 'Core Bracing & Diaphragmatic Breathwork', duration: '20 min', preview: false },
        ],
      },
      {
        id: 'm2',
        title: 'Module 2: Building Capacity',
        description: 'Upper body mechanics, unilateral stability, and progressive bodyweight circuits.',
        lessons: [
          { id: 'l4', title: 'Pushing & Pulling Without Shoulder Stress', duration: '25 min', preview: false },
          { id: 'l5', title: 'Single-Leg Balance & Foot Strength', duration: '22 min', preview: false },
          { id: 'l6', title: 'Creating Your Weekly 3-Day Training Routine', duration: '30 min', preview: false },
        ],
      },
    ],
  },
  {
    title: 'FI7 Elevate',
    slug: 'fi7-elevate',
    tagline: 'Strength & Progressive Training System',
    description:
      'A structured 12-week progressive strength and conditioning system based on the FI7 methodology. Built for individuals looking to gain real functional strength, increase lean muscle, and optimize physical performance.',
    category: 'Foundation',
    badge: 'FOUNDATION',
    badgeColor: '#d4a017',
    accessType: 'paid',
    price: 9999,
    priceFormatted: '₹9,999',
    duration: '12 Weeks',
    schedule: '3 Sessions per Week',
    icon: '🏋️',
    sortOrder: 2,
    published: true,
    learningObjectives: [
      'Periodized progressive resistance training for structural strength',
      'Barbell and dumbbell technical mastery (Squat, Deadlift, Press)',
      'Joint stability under load and injury prevention protocols',
      'Scientific nutrition frameworks for strength and body recomposition',
      'Recovery periodization between heavy lifting blocks',
    ],
    modules: [
      {
        id: 'm1',
        title: 'Module 1: Hypertrophy & Structural Adaptation',
        description: 'Anatomical adaptation, tendon readiness, and foundational compound strength.',
        lessons: [
          { id: 'l1', title: 'The FI7 Strength Periodization Blueprint', duration: '32 min', preview: true },
          { id: 'l2', title: 'Lower Body Compound Mastery', duration: '40 min', preview: false },
          { id: 'l3', title: 'Upper Body Press & Pull Periodization', duration: '35 min', preview: false },
        ],
      },
      {
        id: 'm2',
        title: 'Module 2: Intensification & Peak Power',
        description: 'Heavy strength phase, rate of force development, and nervous system recovery.',
        lessons: [
          { id: 'l4', title: 'Linear Loading & Autoregulation (RPE)', duration: '28 min', preview: false },
          { id: 'l5', title: 'Accessory Work for Longevity', duration: '33 min', preview: false },
          { id: 'l6', title: 'Deload Protocols & Testing Your 1RM', duration: '45 min', preview: false },
        ],
      },
    ],
  },
  {
    title: 'FI7 Peak Performance',
    slug: 'fi7-peak-performance',
    tagline: 'Speed, Power & Athletic Development',
    description:
      'Designed for competitive athletes and elite performers. Maximize power output, sprint speed, multidirectional agility, and sport-specific physical resilience with quantitative testing benchmarks.',
    category: 'Athlete Development',
    badge: 'ELITE',
    badgeColor: '#e5c03a',
    accessType: 'paid',
    price: 13999,
    priceFormatted: '₹13,999',
    duration: '16 Weeks',
    schedule: '4 Sessions per Week',
    icon: '⚡',
    sortOrder: 3,
    published: true,
    learningObjectives: [
      'Force-velocity profiling and rate of force development (RFD)',
      'Acceleration mechanics, top-end sprint speed, and deceleration',
      'Plyometric progression from eccentric landing to reactive power',
      'Sport-specific energy system conditioning',
      'Data-driven performance testing and readiness tracking',
    ],
    modules: [
      {
        id: 'm1',
        title: 'Module 1: Explosive Power & Reactive Strength',
        description: 'Plyometrics, kinetic chain transfer, and acceleration drills.',
        lessons: [
          { id: 'l1', title: 'Athletic Assessment Protocol & Baseline Testing', duration: '25 min', preview: true },
          { id: 'l2', title: 'Sprint Acceleration & First-Step Quickness', duration: '38 min', preview: false },
          { id: 'l3', title: 'Elastic Power: Shock Method & Box Jumps', duration: '30 min', preview: false },
        ],
      },
      {
        id: 'm2',
        title: 'Module 2: Agility & Deceleration Mechanics',
        description: 'Change of direction, knee ACL resilience, and reactive agility.',
        lessons: [
          { id: 'l4', title: 'Deceleration Mechanics & Cutting Angles', duration: '34 min', preview: false },
          { id: 'l5', title: 'Conditioning for Repeated High-Intensity Efforts', duration: '40 min', preview: false },
        ],
      },
    ],
  },
  {
    title: 'FI7 Mobility Mastery',
    slug: 'fi7-mobility-mastery',
    tagline: 'Mobility & Movement Quality for Longevity',
    description:
      'Unlock pain-free movement, eliminate joint stiffness, and expand functional active range of motion. Combines controlled articular rotations (CARs), PNF stretching, and thoracic decompression.',
    category: 'Movement & Recovery',
    badge: 'MOBILITY',
    badgeColor: '#10b981',
    accessType: 'free',
    price: 0,
    priceFormatted: 'Free',
    duration: '6 Weeks',
    schedule: 'Daily 15-Min Protocols',
    icon: '🧘',
    sortOrder: 4,
    published: true,
    learningObjectives: [
      'Restore full glenohumeral, hip, and thoracic spine active mobility',
      'Eliminate desk-bound anterior pelvic tilt and rounded shoulders',
      'Learn Controlled Articular Rotations (CARs) for daily joint hygiene',
      'Build end-range joint strength to prevent muscle tears and impingement',
    ],
    modules: [
      {
        id: 'm1',
        title: 'Module 1: Daily Joint Hygiene & Assessment',
        description: 'Morning mobility routines and joint limitation self-tests.',
        lessons: [
          { id: 'l1', title: 'The 10-Minute Morning CARs Flow', duration: '15 min', preview: true },
          { id: 'l2', title: 'Hip Opening: 90/90 Protocol & Internal Rotation', duration: '22 min', preview: false },
          { id: 'l3', title: 'Thoracic Mobility & Overhead Shoulder Clearance', duration: '20 min', preview: false },
        ],
      },
    ],
  },
  {
    title: 'FI7 Running Club',
    slug: 'fi7-running-club',
    tagline: 'Running & Endurance Development',
    description:
      'A structured running development program for 5K, 10K, and half-marathon runners. Focuses on stride mechanics, aerobic base building, injury prevention, and runner-specific strength training.',
    category: 'Community',
    badge: 'COMMUNITY',
    badgeColor: '#c8860a',
    accessType: 'paid',
    price: 2999,
    priceFormatted: '₹2,999/mo',
    duration: 'Ongoing Membership',
    schedule: 'Weekly Programming & Coached Sessions',
    icon: '🏃',
    sortOrder: 5,
    published: true,
    learningObjectives: [
      'Cadence, foot strike mechanics, and energy conservation',
      'Zone 2 polarized aerobic base periodization',
      'Strength training for runners to prevent shin splints and runner’s knee',
      'Race-day pacing strategies and hydration/nutrition science',
    ],
    modules: [
      {
        id: 'm1',
        title: 'Module 1: Biomechanics & Aerobic Base',
        description: 'Foot strike analysis, heart rate zones, and stride cadence.',
        lessons: [
          { id: 'l1', title: 'Video Running Gait Analysis & Form Fixes', duration: '28 min', preview: true },
          { id: 'l2', title: 'Building the Aerobic Engine: Zone 2 Principles', duration: '35 min', preview: false },
        ],
      },
    ],
  },
  {
    title: 'FI7 Traditional Movement',
    slug: 'fi7-traditional-movement',
    tagline: 'Mudgar, Indian Clubs & Ancient Conditioning',
    description:
      'Integrate ancient Indian physical culture into modern athletic conditioning. Master heavy Mudgar (Karlakattai) swinging, Gada dynamics, and circular shoulder girdle rotational strength.',
    category: 'Movement & Recovery',
    badge: 'HERITAGE',
    badgeColor: '#f07c20',
    accessType: 'free',
    price: 0,
    priceFormatted: 'Free',
    duration: '6 Weeks',
    schedule: '3 Sessions per Week',
    icon: '🏺',
    sortOrder: 6,
    published: true,
    learningObjectives: [
      'Safety and hand grip fundamentals for traditional club swinging',
      'Bulletproof shoulder capsule strength through rotational swinging',
      'Core rotational transfer and pelvic stabilization',
      'Integrating ancient club swinging with barbell strength routines',
    ],
    modules: [
      {
        id: 'm1',
        title: 'Module 1: Mudgar Fundamentals',
        description: 'Basic swings, safety arcs, and breathing rhythms.',
        lessons: [
          { id: 'l1', title: 'History & Anatomy of Mudgar / Karlakattai Training', duration: '20 min', preview: true },
          { id: 'l2', title: 'The Single-Hand & Double-Hand Cast Technique', duration: '26 min', preview: false },
        ],
      },
    ],
  },
  {
    title: 'FI7 Yoga & Recovery',
    slug: 'fi7-yoga-recovery',
    tagline: 'Breathwork, Yoga & Nervous System Downregulation',
    description:
      'Training is only as good as your recovery. This course delivers science-backed parasympathetic breathing practices, restorative yoga asanas, and sleep protocols to accelerate muscular adaptation.',
    category: 'Movement & Recovery',
    badge: 'RECOVERY',
    badgeColor: '#38bdf8',
    accessType: 'free',
    price: 0,
    priceFormatted: 'Free',
    duration: '4 Weeks',
    schedule: 'Daily Restorative Practices',
    icon: '✨',
    sortOrder: 7,
    published: true,
    learningObjectives: [
      'Pranayama and box breathing protocols for heart rate variability (HRV)',
      'Post-workout down-regulation routines to shift into parasympathetic mode',
      'Targeted hip, spine, and hamstring restoration flows',
      'Sleep hygiene optimization for peak growth hormone release',
    ],
    modules: [
      {
        id: 'm1',
        title: 'Module 1: Active Parasympathetic Reset',
        description: 'Breath pacing, vagus nerve stimulation, and restorative holds.',
        lessons: [
          { id: 'l1', title: 'Breath Pacing for Autonomic Nervous System Control', duration: '18 min', preview: true },
          { id: 'l2', title: 'Evening Restorative Asana Sequence for Deep Sleep', duration: '25 min', preview: false },
        ],
      },
    ],
  },
  {
    title: 'FI7 Everyday Elevate',
    slug: 'fi7-everyday-elevate',
    tagline: 'Sustainable Fitness & Healthy Habits',
    description:
      'Designed for busy professionals and everyday adults. Combines time-efficient full-body workouts, habit architecture, and realistic nutrition that fits into a demanding career and family life.',
    category: 'Athlete Development',
    badge: 'LIFESTYLE',
    badgeColor: '#d4a017',
    accessType: 'paid',
    price: 6999,
    priceFormatted: '₹6,999',
    duration: '8 Weeks',
    schedule: '3 Sessions per Week (45 mins)',
    icon: '🔥',
    sortOrder: 8,
    published: true,
    learningObjectives: [
      'Efficient 45-minute strength circuits that maximize metabolic output',
      'Habit stacking techniques for nutrition and hydration consistency',
      'Desk worker posture corrective protocols',
      'Stress management and mental resilience strategies',
    ],
    modules: [
      {
        id: 'm1',
        title: 'Module 1: High-Efficiency Training',
        description: 'Compound supersets, density training, and sustainable routine.',
        lessons: [
          { id: 'l1', title: 'The 45-Minute Executive Training Formula', duration: '22 min', preview: true },
          { id: 'l2', title: 'Meal Prep Strategies for Demanding Schedules', duration: '28 min', preview: false },
        ],
      },
    ],
  },
];

/**
 * Idempotent seeder: Inserts initial courses if they don't exist yet,
 * preserving existing documents and administrator changes.
 */
export async function seedInitialCourses() {
  const collection = await getCoursesCollection();
  const results = { inserted: 0, skipped: 0 };

  for (const course of INITIAL_COURSES) {
    const existing = await collection.findOne({ slug: course.slug });
    if (!existing) {
      await collection.insertOne({
        ...course,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      results.inserted += 1;
    } else {
      results.skipped += 1;
    }
  }

  return results;
}

/**
 * Admin: Retrieve paginated list of all courses (published, draft, archived)
 * with enrollment counts, module counts, and lesson counts.
 */
export async function getAllAdminCourses({
  search = '',
  category = 'all',
  accessType = 'all',
  published = 'all',
  page = 1,
  limit = 10,
} = {}) {
  const collection = await getCoursesCollection();
  const db = await getDatabase();
  const enrollmentsColl = db.collection('enrollments');

  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (safePage - 1) * safeLimit;

  const query = {};

  if (search && search.trim()) {
    const s = search.trim();
    query.$or = [
      { title: { $regex: s, $options: 'i' } },
      { slug: { $regex: s, $options: 'i' } },
      { category: { $regex: s, $options: 'i' } },
    ];
  }

  if (category && category !== 'all') {
    query.category = category;
  }

  if (accessType && accessType !== 'all') {
    query.accessType = accessType;
  }

  if (published !== 'all') {
    query.published = published === 'true' || published === true;
  }

  const [courses, total] = await Promise.all([
    collection.find(query).sort({ sortOrder: 1, createdAt: -1 }).skip(skip).limit(safeLimit).toArray(),
    collection.countDocuments(query),
  ]);

  // Aggregate enrollment counts for these courses
  const courseIds = courses.map((c) => c._id);
  const enrollmentCounts = await enrollmentsColl
    .aggregate([
      { $match: { courseId: { $in: courseIds } } },
      { $group: { _id: '$courseId', count: { $sum: 1 } } },
    ])
    .toArray();

  const enrollMap = {};
  for (const item of enrollmentCounts) {
    enrollMap[item._id.toString()] = item.count;
  }

  const enriched = courses.map((doc) => {
    const formatted = formatCourse(doc);
    let totalLessons = 0;
    let totalModules = 0;
    if (formatted.modules && Array.isArray(formatted.modules)) {
      totalModules = formatted.modules.length;
      for (const m of formatted.modules) {
        if (m.lessons && Array.isArray(m.lessons)) {
          totalLessons += m.lessons.length;
        }
      }
    }
    return {
      ...formatted,
      moduleCount: totalModules,
      lessonCount: totalLessons,
      enrollmentCount: enrollMap[formatted.id] || 0,
    };
  });

  return {
    courses: enriched,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit) || 1,
    },
  };
}

/**
 * Generate a clean, URL-safe slug from a title.
 */
export function slugify(text) {
  return (text || '')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

/**
 * Admin: Create a new course with server validation.
 */
export async function createCourse(data) {
  const collection = await getCoursesCollection();

  const title = (data.title || '').trim();
  if (!title || title.length < 2) {
    throw new Error('Course title must be at least 2 characters long.');
  }

  let slug = slugify(data.slug || title);
  if (!slug) {
    throw new Error('Valid URL slug is required.');
  }

  // Ensure unique slug
  const existingSlug = await collection.findOne({ slug });
  if (existingSlug) {
    slug = `${slug}-${Date.now().toString().slice(-4)}`;
  }

  const accessType = data.accessType === 'paid' ? 'paid' : 'free';
  const price = accessType === 'paid' ? Math.max(0, parseFloat(data.price) || 0) : 0;
  const priceFormatted = accessType === 'paid' ? `₹${price.toLocaleString('en-IN')}` : 'Free';

  const now = new Date();
  const newCourse = {
    title,
    slug,
    tagline: (data.tagline || '').trim(),
    description: (data.description || '').trim(),
    category: data.category || 'Foundation',
    badge: data.badge || (accessType === 'paid' ? 'PREMIUM' : 'FREE'),
    badgeColor: data.badgeColor || (accessType === 'paid' ? '#f07c20' : '#10b981'),
    accessType,
    price,
    priceFormatted,
    duration: data.duration || '4 Weeks',
    schedule: data.schedule || '3 Sessions per Week',
    icon: data.icon || '🏋️',
    thumbnail: data.thumbnail || null,
    sortOrder: parseInt(data.sortOrder, 10) || 99,
    published: Boolean(data.published),
    archived: false,
    learningObjectives: Array.isArray(data.learningObjectives)
      ? data.learningObjectives.filter((obj) => typeof obj === 'string' && obj.trim().length > 0)
      : [],
    modules: Array.isArray(data.modules) ? data.modules : [],
    createdAt: now,
    updatedAt: now,
  };

  const result = await collection.insertOne(newCourse);
  return formatCourse({ ...newCourse, _id: result.insertedId });
}

/**
 * Admin: Update existing course metadata while preserving lessons and enrollments.
 */
export async function updateCourse(id, data) {
  if (!id) throw new Error('Course ID is required.');
  const collection = await getCoursesCollection();
  const query = typeof id === 'string' && ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id };

  const existing = await collection.findOne(query);
  if (!existing) {
    throw new Error('Course not found.');
  }

  const updateFields = { updatedAt: new Date() };

  if (data.title !== undefined) updateFields.title = data.title.trim();
  if (data.tagline !== undefined) updateFields.tagline = data.tagline.trim();
  if (data.description !== undefined) updateFields.description = data.description.trim();
  if (data.category !== undefined) updateFields.category = data.category;
  if (data.badge !== undefined) updateFields.badge = data.badge;
  if (data.badgeColor !== undefined) updateFields.badgeColor = data.badgeColor;
  if (data.duration !== undefined) updateFields.duration = data.duration;
  if (data.schedule !== undefined) updateFields.schedule = data.schedule;
  if (data.icon !== undefined) updateFields.icon = data.icon;
  if (data.thumbnail !== undefined) updateFields.thumbnail = data.thumbnail;
  if (data.sortOrder !== undefined) updateFields.sortOrder = parseInt(data.sortOrder, 10) || 0;
  if (data.published !== undefined) updateFields.published = Boolean(data.published);

  if (data.accessType !== undefined) {
    updateFields.accessType = data.accessType === 'paid' ? 'paid' : 'free';
    if (updateFields.accessType === 'free') {
      updateFields.price = 0;
      updateFields.priceFormatted = 'Free';
    } else if (data.price !== undefined) {
      updateFields.price = Math.max(0, parseFloat(data.price) || 0);
      updateFields.priceFormatted = `₹${updateFields.price.toLocaleString('en-IN')}`;
    }
  } else if (data.price !== undefined && existing.accessType === 'paid') {
    updateFields.price = Math.max(0, parseFloat(data.price) || 0);
    updateFields.priceFormatted = `₹${updateFields.price.toLocaleString('en-IN')}`;
  }

  if (data.learningObjectives !== undefined && Array.isArray(data.learningObjectives)) {
    updateFields.learningObjectives = data.learningObjectives.filter(
      (obj) => typeof obj === 'string' && obj.trim().length > 0
    );
  }

  if (data.slug && data.slug !== existing.slug) {
    const cleanSlug = slugify(data.slug);
    const slugClash = await collection.findOne({ slug: cleanSlug, _id: { $ne: existing._id } });
    if (slugClash) {
      throw new Error(`The slug "${cleanSlug}" is already in use by another course.`);
    }
    updateFields.slug = cleanSlug;
  }

  await collection.updateOne(query, { $set: updateFields });
  const updated = await collection.findOne(query);
  return formatCourse(updated);
}

/**
 * Admin: Delete or Archive course.
 * If course has enrollments, archives it by default to protect historical purchases.
 */
export async function deleteOrArchiveCourse(id, { permanent = false } = {}) {
  if (!id) throw new Error('Course ID is required.');
  const collection = await getCoursesCollection();
  const db = await getDatabase();
  const enrollmentsColl = db.collection('enrollments');

  const query = typeof id === 'string' && ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id };
  const course = await collection.findOne(query);
  if (!course) {
    throw new Error('Course not found.');
  }

  const enrollmentCount = await enrollmentsColl.countDocuments({ courseId: course._id });

  if (enrollmentCount > 0 && !permanent) {
    // Soft-archive to protect user access & audit history
    await collection.updateOne(query, {
      $set: { published: false, archived: true, updatedAt: new Date() },
    });
    return {
      action: 'archived',
      enrollmentCount,
      message: `Course has ${enrollmentCount} active athlete enrollments. It has been safely unpublished and archived rather than permanently deleted.`,
    };
  }

  await collection.deleteOne(query);
  return {
    action: 'deleted',
    enrollmentCount,
    message: 'Course has been permanently removed.',
  };
}

/**
 * Admin: Add module to a course.
 */
export async function addModuleToCourse(courseId, { title, description = '' }) {
  const collection = await getCoursesCollection();
  const query = typeof courseId === 'string' && ObjectId.isValid(courseId) ? { _id: new ObjectId(courseId) } : { _id: courseId };

  const moduleId = 'm_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
  const newModule = {
    id: moduleId,
    title: (title || '').trim() || 'New Module',
    description: (description || '').trim(),
    lessons: [],
  };

  await collection.updateOne(query, {
    $push: { modules: newModule },
    $set: { updatedAt: new Date() },
  });

  return newModule;
}

/**
 * Admin: Update module in a course.
 */
export async function updateCourseModule(courseId, moduleId, { title, description }) {
  const collection = await getCoursesCollection();
  const query = typeof courseId === 'string' && ObjectId.isValid(courseId) ? { _id: new ObjectId(courseId) } : { _id: courseId };

  const updateDoc = {};
  if (title !== undefined) updateDoc['modules.$.title'] = title.trim();
  if (description !== undefined) updateDoc['modules.$.description'] = description.trim();
  updateDoc.updatedAt = new Date();

  await collection.updateOne({ ...query, 'modules.id': moduleId }, { $set: updateDoc });
  return { id: moduleId, title, description };
}

/**
 * Admin: Delete module from a course.
 */
export async function deleteCourseModule(courseId, moduleId) {
  const collection = await getCoursesCollection();
  const query = typeof courseId === 'string' && ObjectId.isValid(courseId) ? { _id: new ObjectId(courseId) } : { _id: courseId };

  await collection.updateOne(query, {
    $pull: { modules: { id: moduleId } },
    $set: { updatedAt: new Date() },
  });

  return { success: true };
}

/**
 * Admin: Add lesson to a module.
 */
export async function addLessonToModule(courseId, moduleId, lessonData) {
  const collection = await getCoursesCollection();
  const query = typeof courseId === 'string' && ObjectId.isValid(courseId) ? { _id: new ObjectId(courseId) } : { _id: courseId };

  const lessonId = lessonData.id ? slugify(lessonData.id) : 'l_' + Date.now().toString(36);
  const newLesson = {
    id: lessonId,
    title: (lessonData.title || '').trim() || 'New Lesson',
    duration: lessonData.duration || '20 min',
    preview: Boolean(lessonData.preview),
    description: (lessonData.description || '').trim(),
    videoFileName: lessonData.videoFileName || null,
    thumbnail: lessonData.thumbnail || null,
    published: lessonData.published !== false,
    createdAt: new Date(),
  };

  await collection.updateOne(
    { ...query, 'modules.id': moduleId },
    {
      $push: { 'modules.$.lessons': newLesson },
      $set: { updatedAt: new Date() },
    }
  );

  return newLesson;
}

/**
 * Admin: Update an existing lesson.
 */
export async function updateCourseLesson(courseId, lessonId, lessonData) {
  const collection = await getCoursesCollection();
  const query = typeof courseId === 'string' && ObjectId.isValid(courseId) ? { _id: new ObjectId(courseId) } : { _id: courseId };

  const course = await collection.findOne(query);
  if (!course || !course.modules) throw new Error('Course not found.');

  let found = false;
  const updatedModules = course.modules.map((mod) => {
    const updatedLessons = (mod.lessons || []).map((les) => {
      if (les.id === lessonId) {
        found = true;
        return {
          ...les,
          title: lessonData.title !== undefined ? lessonData.title.trim() : les.title,
          duration: lessonData.duration !== undefined ? lessonData.duration.trim() : les.duration,
          preview: lessonData.preview !== undefined ? Boolean(lessonData.preview) : les.preview,
          description: lessonData.description !== undefined ? lessonData.description.trim() : les.description,
          videoFileName: lessonData.videoFileName !== undefined ? lessonData.videoFileName : les.videoFileName,
          thumbnail: lessonData.thumbnail !== undefined ? lessonData.thumbnail : les.thumbnail,
          published: lessonData.published !== undefined ? Boolean(lessonData.published) : les.published,
          updatedAt: new Date(),
        };
      }
      return les;
    });
    return { ...mod, lessons: updatedLessons };
  });

  if (!found) throw new Error('Lesson not found in this course.');

  await collection.updateOne(query, {
    $set: { modules: updatedModules, updatedAt: new Date() },
  });

  return { success: true };
}

/**
 * Admin: Delete a lesson from a course.
 */
export async function deleteCourseLesson(courseId, lessonId) {
  const collection = await getCoursesCollection();
  const query = typeof courseId === 'string' && ObjectId.isValid(courseId) ? { _id: new ObjectId(courseId) } : { _id: courseId };

  const course = await collection.findOne(query);
  if (!course || !course.modules) throw new Error('Course not found.');

  const updatedModules = course.modules.map((mod) => ({
    ...mod,
    lessons: (mod.lessons || []).filter((l) => l.id !== lessonId),
  }));

  await collection.updateOne(query, {
    $set: { modules: updatedModules, updatedAt: new Date() },
  });

  return { success: true };
}

/**
 * Admin: Reorder lessons within a module.
 */
export async function reorderCourseLessons(courseId, moduleId, orderedLessonIds) {
  const collection = await getCoursesCollection();
  const query = typeof courseId === 'string' && ObjectId.isValid(courseId) ? { _id: new ObjectId(courseId) } : { _id: courseId };

  const course = await collection.findOne(query);
  if (!course || !course.modules) throw new Error('Course not found.');

  const updatedModules = course.modules.map((mod) => {
    if (mod.id === moduleId && Array.isArray(mod.lessons)) {
      const lessonMap = new Map(mod.lessons.map((l) => [l.id, l]));
      const reordered = [];
      for (const id of orderedLessonIds) {
        if (lessonMap.has(id)) {
          reordered.push(lessonMap.get(id));
          lessonMap.delete(id);
        }
      }
      // append any lessons not in orderedLessonIds
      for (const remaining of lessonMap.values()) {
        reordered.push(remaining);
      }
      return { ...mod, lessons: reordered };
    }
    return mod;
  });

  await collection.updateOne(query, {
    $set: { modules: updatedModules, updatedAt: new Date() },
  });

  return { success: true };
}

/**
 * Admin: Reorder entire course playlist across modules.
 */
export async function reorderCoursePlaylist(courseId, orderedLessonIds) {
  const collection = await getCoursesCollection();
  const query = typeof courseId === 'string' && ObjectId.isValid(courseId) ? { _id: new ObjectId(courseId) } : { _id: courseId };

  const course = await collection.findOne(query);
  if (!course || !course.modules) throw new Error('Course not found.');

  const allLessonsMap = new Map();
  for (const mod of course.modules) {
    for (const les of mod.lessons || []) {
      allLessonsMap.set(les.id, les);
    }
  }

  const orderedLessons = [];
  for (const id of orderedLessonIds) {
    if (allLessonsMap.has(id)) {
      orderedLessons.push(allLessonsMap.get(id));
      allLessonsMap.delete(id);
    }
  }
  for (const remaining of allLessonsMap.values()) {
    orderedLessons.push(remaining);
  }

  let cursor = 0;
  const updatedModules = course.modules.map((mod) => {
    const modCount = (mod.lessons || []).length;
    const modLessons = orderedLessons.slice(cursor, cursor + modCount);
    cursor += modCount;
    return { ...mod, lessons: modLessons };
  });

  if (cursor < orderedLessons.length && updatedModules.length > 0) {
    const lastMod = updatedModules[updatedModules.length - 1];
    lastMod.lessons = [...lastMod.lessons, ...orderedLessons.slice(cursor)];
  }

  await collection.updateOne(query, {
    $set: { modules: updatedModules, updatedAt: new Date() },
  });

  return { success: true };
}

