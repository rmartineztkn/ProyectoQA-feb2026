const mongoose = require('mongoose');
const champions = require('./champions.json');

async function run() {
    try {
        await mongoose.connect('mongodb://localhost:27017/wildrift');

        const db = mongoose.connection.db;
        const collection = db.collection('champions');

        await collection.insertMany(champions);

        console.log('✅ Campeones importados correctamente');
    } catch (error) {
        console.error('❌ Error al importar:', error);
    } finally {
        await mongoose.disconnect();
    }
}

run();
