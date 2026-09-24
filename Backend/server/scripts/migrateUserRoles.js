require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const connectDB = require('../db');
const User = require('../models/User');

async function migrateUserRoles() {
  await connectDB();
  // `user` was the old default. Preserve existing administrators and make all
  // other legacy accounts safe buyer accounts.
  const result = await User.updateMany(
    { $or: [{ role: 'user' }, { role: { $exists: false } }] },
    { $set: { role: 'buyer', accountStatus: 'active' } },
  );
  console.log(`Migrated ${result.modifiedCount} legacy user role(s).`);
  process.exit(0);
}

migrateUserRoles().catch((error) => { console.error(error); process.exit(1); });
