import bcrypt from 'bcryptjs';

const password = process.argv[2] || 'Admin@FitnessInfu2026!';
const saltRounds = 10;

const hash = await bcrypt.hash(password, saltRounds);

console.log('----------------------------------------------------');
console.log('Fitnessinfu Administrator Password Hash Generator');
console.log('----------------------------------------------------');
console.log(`Password:      ${password}`);
console.log(`Bcrypt Hash:   ${hash}`);
console.log('----------------------------------------------------');
console.log('Add the following to your .env.local file:');
console.log(`ADMIN_EMAIL=admin@fitnessinfu.com`);
// Next.js dotenv-expand requires literal $ in .env files to be escaped with \
const escapedHash = hash.replace(/\$/g, '\\$');
console.log(`ADMIN_PASSWORD_HASH="${escapedHash}"`);
console.log(`ADMIN_SESSION_SECRET=fitnessinfu_admin_secret_key_change_in_production_min32chars!`);
console.log('----------------------------------------------------');
