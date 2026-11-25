import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';

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
      break;
    }
  }
}

loadEnv();

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'fitnessinfu';

async function updateAllCoursesToDemoVideo() {
  if (!uri) {
    console.error('No MONGODB_URI found.');
    return;
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log(`Connected to MongoDB database "${dbName}"`);
    const coursesCollection = client.db(dbName).collection('courses');
    const courses = await coursesCollection.find({}).toArray();
    console.log(`Found ${courses.length} courses in database.`);

    let totalLessonsUpdated = 0;
    for (const course of courses) {
      let modified = false;
      if (course.modules && Array.isArray(course.modules)) {
        for (const mod of course.modules) {
          if (mod.lessons && Array.isArray(mod.lessons)) {
            for (const les of mod.lessons) {
              les.videoFileName = 'demo-development.mp4';
              totalLessonsUpdated++;
              modified = true;
            }
          }
        }
      }

      if (modified) {
        await coursesCollection.updateOne(
          { _id: course._id },
          { $set: { modules: course.modules, updatedAt: new Date() } }
        );
        console.log(`  ✓ Updated course: "${course.title}" (${course.slug})`);
      }
    }

    console.log(`\nSuccessfully updated ${totalLessonsUpdated} lessons across ${courses.length} courses to "demo-development.mp4".`);
  } catch (err) {
    console.error('Error updating courses:', err);
  } finally {
    await client.close();
  }
}

updateAllCoursesToDemoVideo();
