const { MongoClient } = require("mongodb");
const fs = require("fs");
const path = require("path");

const url = "mongodb://127.0.0.1:27017";
const dbName = "Proyecto-Wildrift";
const collectionName = "objetos";
const filePath = path.join(__dirname, "objetos.json");

async function importData() {
    const client = new MongoClient(url);
    try {
        console.log("Leyendo archivo objetos.json...");
        const data = fs.readFileSync(filePath, "utf8");
        const docs = JSON.parse(data).map((obj, index) => ({
            id: index + 1,
            ...obj
        }));

        console.log("Conectando a MongoDB...");
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection(collectionName);

        // Limpiar la colección antes de importar para evitar duplicados si se corre varias veces
        console.log(`Limpiando colección "${collectionName}"...`);
        await collection.deleteMany({});

        console.log(`Insertando ${docs.length} objetos en "${dbName}.${collectionName}"...`);
        const result = await collection.insertMany(docs);

        console.log("¡Importación completada con éxito!");
        console.log(`Se insertaron ${result.insertedCount} documentos.`);
    } catch (error) {
        console.error("Error durante la importación:", error);
    } finally {
        await client.close();
    }
}

importData();
