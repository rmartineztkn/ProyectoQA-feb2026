const { MongoClient } = require('mongodb');

// URL de conexión
const url = 'mongodb://localhost:27017';
const client = new MongoClient(url);

// Nombres CORRECTOS (según lo visto en el diagnóstico)
const dbName = 'ProyectQA_DB';
const collectionName = 'users'; // ¡Aquí estaba el error, era minúscula!

async function main() {
    try {
        await client.connect();
        console.log('✅ Conexión exitosa al servidor de MongoDB');

        const db = client.db(dbName);
        const collection = db.collection(collectionName);

        // 🔍 PRUEBA DE QA: Buscar el documento
        console.log(`🔎 Buscando en la colección: '${collectionName}'...`);
        const user = await collection.findOne({ rol: 'QA Automation' });

        if (user) {
            console.log('\n🚀 ¡ÉXITO! Datos encontrados:');
            console.log('------------------------------------------------');
            console.log(user);
            console.log('------------------------------------------------');
        } else {
            console.log('\n⚠️ Sigue sin encontrarse. Verifica que el campo "rol" sea idéntico.');

            // Si falla, mostramos qué hay para ayudar
            const all = await collection.find().toArray();
            console.log('   Contenido actual de la colección:', all);
        }

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await client.close();
    }
}

main();