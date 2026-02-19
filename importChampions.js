const fs = require('fs');
const { MongoClient } = require('mongodb');

// Configuration
const url = 'mongodb://localhost:27017';
const dbName = 'Proyecto-Wildrift';
const collectionName = 'champions';
const sourceFile = 'champions.json';

async function importData() {
    const client = new MongoClient(url);

    try {
        console.log(`Reading ${sourceFile}...`);
        const data = fs.readFileSync(sourceFile, 'utf8');

        // The file is now a VALID JSON array, so we don't need to wrap it.
        let champions;
        try {
            champions = JSON.parse(data);
        } catch (e) {
            console.error("Error parsing JSON:", e.message);
            return;
        }

        console.log(`Parsed ${champions.length} champions.`);

        // --- PART 1: AUTO-INCREMENT LOGIC ---
        const championsWithIds = champions.map((champ, index) => {
            return {
                ...champ,
                id: index + 1
            };
        });
        console.log("IDs auto-incrementables generados (1, 2, 3...).");

        console.log("Connecting to MongoDB...");
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection(collectionName);

        // --- PART 2: CLEAN SLATE ---
        try {
            await collection.drop();
            console.log("Coleccion anterior eliminada para una importacion limpia.");
        } catch (error) {
            if (error.codeName !== 'NamespaceNotFound') {
                throw error;
            }
        }

        console.log(`Inserting ${championsWithIds.length} documents...`);
        const insertResult = await collection.insertMany(championsWithIds);
        console.log(`Inserted ${insertResult.insertedCount} documents successfully!`);

    } catch (err) {
        console.error("An error occurred:", err);
    } finally {
        await client.close();
        console.log("Connection closed.");
    }
}

importData();
