require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const connectDB = require('../db');
const Gig = require('../models/Gig');

async function migrate() {
  await connectDB();
  const legacyGigs = await Gig.collection.find({ sellerId: { $exists: false }, 'seller.id': { $exists: true } }).toArray();
  let migrated = 0;
  for (const gig of legacyGigs) {
    await Gig.collection.updateOne(
      { _id: gig._id },
      { $set: { sellerId: gig.seller.id }, $unset: { seller: '' } },
    );
    migrated += 1;
  }
  console.log(`Migrated ${migrated} gigs to sellerId references.`);
  process.exit(0);
}

migrate().catch((error) => {
  console.error('Gig migration failed:', error);
  process.exit(1);
});
