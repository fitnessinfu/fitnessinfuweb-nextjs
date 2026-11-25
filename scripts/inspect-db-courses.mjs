import fs from 'fs';
import { MongoClient } from 'mongodb';

const envContent = fs.readFileSync('.env.local', 'utf-8');
let uri = '';
let dbName = 'fitnessinfu';
for (const line of envContent.split(/\r?\n/)) {
  if (line.startsWith('MONGODB_URI=')) uri = line.replace('MONGODB_URI=', '').trim();
  if (line.startsWith('MONGODB_DB=')) dbName = line.replace('MONGODB_DB=', '').trim();
}

async function run() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  const courses = await db.collection('courses').find({}).toArray();
  console.log(`Found ${courses.length} courses in database:`);
  for (const c of courses) {
    console.log('----------------------------------------------------');
    console.log(`Course: "${c.title}" (slug: ${c.slug}, id: ${c._id})`);
    if (!c.modules || c.modules.length === 0) {
      console.log('  [No modules found]');
    } else {
      for (const m of c.modules) {
        console.log(`  Module [${m.id || m._id}]: ${m.title}`);
        if (m.lessons && m.lessons.length > 0) {
          for (const l of m.lessons) {
            console.log(`    Lesson [${l.id || l._id}]: "${l.title}" (duration: ${l.duration}, preview: ${l.preview ?? l.isFreePreview}, videoFileName: ${l.videoFileName}, videoAssetId: ${l.videoAssetId})`);
          }
        } else {
          console.log('    [No lessons in module]');
        }
      }
    }
  }
  await client.close();
}

run().catch(console.error);
