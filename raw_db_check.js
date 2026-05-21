const { MongoClient } = require('mongodb');
const url = 'mongodb://localhost:27017';
const dbName = 'parking_system';

async function main() {
    const client = new MongoClient(url);
    try {
        await client.connect();
        console.log('Connected to MongoDB');
        const db = client.db(dbName);

        const collections = await db.listCollections().toArray();
        console.log('Collections:', collections.map(c => c.name));

        const parkingLots = db.collection('parkinglots');
        const total = await parkingLots.countDocuments({});
        console.log('Total Parking Lots:', total);

        const active = await parkingLots.countDocuments({ isActive: true });
        console.log('Active Parking Lots:', active);

        const sample = await parkingLots.find({}).limit(5).toArray();
        console.log('Sample Data (first 5):');
        sample.forEach(s => {
            console.log(`- Name: ${s.name}, Active: ${s.isActive}, Coords: ${JSON.stringify(s.location?.coordinates)}`);
        });

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.close();
    }
}
main();
