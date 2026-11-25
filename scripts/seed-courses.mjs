/**
 * Idempotent Course Seeder Script
 * Run with: npm run seed
 */
import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';

// Parse .env.local or .env if present
function loadEnv() {
  const envFiles = ['.env.local', '.env'];
  for (const file of envFiles) {
    const fullPath = path.resolve(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      content.split('\n').forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx !== -1) {
            const key = trimmed.slice(0, eqIdx).trim();
            const val = trimmed.slice(eqIdx + 1).trim();
            if (!process.env[key]) {
              process.env[key] = val.replace(/^["']|["']$/g, '');
            }
          }
        }
      });
      console.log(`[Seed] Loaded environment variables from ${file}`);
      break;
    }
  }
}

loadEnv();

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'fitnessinfu';

if (!uri) {
  console.error('\n❌ [Seed Error] MONGODB_URI is not set!');
  console.error('Please create a .env.local file with your MongoDB connection string:');
  console.error('Example: MONGODB_URI=mongodb://localhost:27017/fitnessinfu\n');
  process.exit(1);
}

const INITIAL_COURSES = [
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

async function seed() {
  console.log(`[Seed] Connecting to MongoDB (${dbName})...`);
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(dbName);
    const coursesCollection = db.collection('courses');

    await coursesCollection.createIndex({ slug: 1 }, { unique: true });
    await coursesCollection.createIndex({ published: 1, accessType: 1 });

    console.log('[Seed] Seeding initial courses...');
    let inserted = 0;
    let skipped = 0;

    for (const course of INITIAL_COURSES) {
      const existing = await coursesCollection.findOne({ slug: course.slug });
      if (!existing) {
        await coursesCollection.insertOne({
          ...course,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        console.log(`  ➕ Added: ${course.title} (${course.accessType.toUpperCase()})`);
        inserted++;
      } else {
        console.log(`  ⏭️ Skipped (already exists): ${course.title}`);
        skipped++;
      }
    }

    console.log(`\n✅ Seeding complete! ${inserted} inserted, ${skipped} already existed.`);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

seed();
