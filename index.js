const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const fs = require("fs");
const path = require("path");
const app = express();
const port = 3000;

const url = "mongodb://127.0.0.1:27017";
const dbName = "Proyecto-Wildrift";
let client = new MongoClient(url, { serverSelectionTimeoutMS: 2000 });
let collection = null;
let objectsCollection = null; // Nueva colección para objetos

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

async function connectToDB() {
    try {
        if (!collection) {
            await client.connect();
            const db = client.db(dbName);
            collection = db.collection("champions");
            objectsCollection = db.collection("objetos"); // Inicializar colección de objetos
            console.log("Successfully connected to MongoDB");
        }
        return { champions: collection, objects: objectsCollection };
    } catch (error) {
        console.warn("MongoDB connection failed. Using mock data:", error.message);
        collection = null;
        objectsCollection = null;
        return { champions: null, objects: null };
    }
}

let fallbackChampions = [];
try {
    const data = fs.readFileSync(path.join(__dirname, "champions.json"), "utf8");
    fallbackChampions = JSON.parse(data).map((c, i) => ({
        ...c,
        id: c.id || (i + 1)
    }));
} catch (e) {
    console.error("Failed to load local data:", e);
}

app.get("/champions", async (req, res) => {
    try {
        const { champions: activeCollection } = await connectToDB();

        const searchId = req.query.searchId || "";
        const searchNombre = req.query.searchNombre || "";
        const searchDamage = req.query.searchDamage || "";
        const searchTipo = req.query.searchTipo || "";
        const searchPosicion = req.query.searchPosicion || "";

        const sortBy = req.query.sort || "id";
        const order = req.query.order || "asc";

        let champions = [];

        if (activeCollection) {
            let query = {};
            if (searchId) {
                const idNum = parseInt(searchId);
                query.$or = [{ id: idNum }, { id: searchId }];
            }
            if (searchNombre) query.nombre = { $regex: searchNombre.trim(), $options: "i" };
            if (searchDamage) query.damage = parseInt(searchDamage);
            if (searchTipo) query.tipo = searchTipo; // Tipo suele ser exacto (AD, AP, etc)
            if (searchPosicion) query.posicion = searchPosicion;

            let sortOptions = {};
            sortOptions[sortBy] = (order === "asc" ? 1 : -1);
            champions = await activeCollection.find(query).sort(sortOptions).toArray();
        } else {
            champions = [...fallbackChampions];
            if (searchId) champions = champions.filter(c => c.id == searchId);
            if (searchNombre) {
                const term = searchNombre.trim().toLowerCase();
                champions = champions.filter(c => c.nombre && c.nombre.toLowerCase().includes(term));
            }
            if (searchDamage) champions = champions.filter(c => c.damage === parseInt(searchDamage));
            if (searchTipo) champions = champions.filter(c => c.tipo === searchTipo);
            if (searchPosicion) champions = champions.filter(c => c.posicion === searchPosicion);

            champions.sort((a, b) => {
                const valA = a[sortBy];
                const valB = b[sortBy];
                if (order === "asc") return valA > valB ? 1 : -1;
                return valA < valB ? 1 : -1;
            });
        }

        const getSortLink = (field) => {
            const nextOrder = (sortBy === field && order === "asc") ? "desc" : "asc";
            const params = new URLSearchParams({
                searchId, searchNombre, searchDamage, searchTipo, searchPosicion,
                sort: field,
                order: nextOrder
            });
            return `/champions?${params.toString()}`;
        };

        const getArrow = (field) => {
            if (sortBy !== field) return "<span style=\"color: #5b5a56; font-size: 0.8em\">⇅</span>";
            return order === "asc" ? "▲" : "▼";
        };

        const isFiltering = searchId || searchNombre || searchDamage || searchTipo || searchPosicion;

        let html = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Proyecto Campeones de Wild Rift</title>
            <link href="https://fonts.googleapis.com/css2?family=Beaufort+for+LOL:wght@400;700&family=Spiegel:wght@400;600&display=swap" rel="stylesheet">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
            <style>
                :root {
                    --hextech-black: #010a13;
                    --hextech-blue: #0ac8b9;
                    --hextech-gold: #c89b3c;
                    --hextech-gold-light: #f0e6d2;
                    --dark-blue: #091428;
                    --medium-blue: #0a323c;
                }
                body { 
                    font-family: 'Spiegel', 'Segoe UI', sans-serif; 
                    margin: 0; 
                    padding: 40px 20px; 
                    background-color: var(--hextech-black);
                    background-image: linear-gradient(to bottom, #091428, #010a13);
                    color: var(--hextech-gold-light);
                    min-height: 100vh;
                }
                .container { 
                    max-width: 1100px; 
                    margin: 0 auto; 
                    background: rgba(10, 50, 60, 0.6); 
                    backdrop-filter: blur(10px);
                    padding: 30px; 
                    border: 1px solid #463714;
                    border-top: 3px solid var(--hextech-gold);
                    box-shadow: 0 0 20px rgba(0,0,0,0.5); 
                }
                h1 { 
                    font-family: 'Beaufort for LOL', serif;
                    color: var(--hextech-gold); 
                    text-align: center; 
                    margin-bottom: 40px; 
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    font-size: 2.5rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 20px;
                }
                .main-logo {
                    width: 90px;
                    height: 90px;
                    border-radius: 50%;
                    object-fit: cover;
                    filter: drop-shadow(0 0 10px rgba(200, 155, 60, 0.5));
                }
                .panel { 
                    background: rgba(1, 10, 19, 0.8); 
                    border: 1px solid #1c2636;
                    padding: 25px; 
                    margin-bottom: 30px; 
                    position: relative;
                }
                .panel::before {
                    content: '';
                    position: absolute;
                    top: -1px; left: -1px; right: -1px;
                    height: 1px;
                    background: linear-gradient(90deg, transparent, var(--hextech-gold), transparent);
                }
                .panel-header { 
                    margin-top: 0; 
                    font-family: 'Spiegel', sans-serif;
                    font-weight: bold;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    font-size: 1.4rem; 
                    color: var(--hextech-gold-light); 
                    border-bottom: 1px solid #1c2636; 
                    padding-bottom: 15px; 
                    margin-bottom: 20px; 
                    display: flex; 
                    justify-content: space-between; 
                    align-items: center; 
                }
                .filter-group { display: flex; gap: 15px; flex-wrap: wrap; align-items: flex-end; }
                .filter-item { flex: 1; min-width: 140px; }
                .filter-item label { 
                    display: block; 
                    font-size: 0.75em; 
                    color: #a09b8c; 
                    margin-bottom: 8px; 
                    text-transform: uppercase; 
                }
                input, select { 
                    width: 100%; 
                    padding: 12px; 
                    background-color: #010a13; 
                    border: 1px solid #3c3c41; 
                    color: #f0e6d2;
                    font-family: 'Spiegel', sans-serif;
                }
                
                /* Estilos Base de Botones */
                button { 
                    padding: 12px 25px; 
                    cursor: pointer; 
                    font-weight: bold; 
                    text-transform: uppercase; 
                    letter-spacing: 1px;
                    border: 1px solid var(--hextech-gold);
                    transition: all 0.3s;
                    font-family: 'Beaufort for LOL', sans-serif;
                }
                .btn-search { background: linear-gradient(to bottom, #1e282d, #010a13); color: var(--hextech-gold); }
                .btn-add { background: linear-gradient(to bottom, #0ac8b9, #005a82); color: #010a13; border-color: #0ac8b9; width: 100%; }
                .btn-clear { color: #cd3333; text-decoration: none; border: 1px solid #cd3333; padding: 5px 10px; }

                /* Estilos de Tabla */
                table { width: 100%; border-collapse: collapse; margin-top: 10px; table-layout: fixed; }
                th { 
                    text-align: left; 
                    padding: 15px; 
                    background-color: rgba(1, 10, 19, 0.9); 
                    color: #a09b8c; 
                    font-family: 'Beaufort for LOL', serif;
                    text-transform: uppercase;
                    border-bottom: 2px solid #3c3c41;
                }
                td { padding: 15px; border-bottom: 1px solid #1c2636; color: #f0e6d2; vertical-align: middle; }
                
                /* Anchos de Columna para Alineación */
                th:nth-child(1), td:nth-child(1) { width: 60px; } /* ID */
                th:nth-child(2), td:nth-child(2) { width: 70px; text-align: center; } /* Icono */
                th:nth-child(3), td:nth-child(3) { width: 140px; } /* Nombre */
                th:nth-child(4), td:nth-child(4) { width: 80px; } /* Daño */
                th:nth-child(5), td:nth-child(5) { width: 100px; } /* Tipo */
                th:nth-child(6), td:nth-child(6) { width: 110px; } /* Posición */
                th:nth-child(7), td:nth-child(7) { width: auto; } /* Descripción */
                th:nth-child(8), td:nth-child(8) { width: 120px; text-align: center; } /* Acciones */

                .champ-icon { width: 40px; height: 40px; border-radius: 50%; border: 2px solid var(--hextech-gold); object-fit: cover; }
                .badge { padding: 4px 10px; font-size: 0.75em; text-transform: uppercase; border: 1px solid; }
                .bg-ad { color: #ff8c00; border-color: #ff8c00; background: rgba(255, 140, 0, 0.1); }
                .bg-ap { color: #9d4eff; border-color: #9d4eff; background: rgba(157, 78, 255, 0.1); }
                .bg-tank { color: #2ecc71; border-color: #2ecc71; background: rgba(46, 204, 113, 0.1); }
                .bg-mix { color: #a0a0a0; border-color: #a0a0a0; background: rgba(160, 160, 160, 0.1); }
                
                /* Estilos para Botones de Acción */
                .btn-edit { background: transparent; color: var(--hextech-blue); border: 1px solid var(--hextech-blue); padding: 8px 12px; font-size: 0.9rem; margin-right: 5px; width: auto !important; border-radius: 4px; }
                .btn-delete { background: transparent; color: #cd3333; border: 1px solid #cd3333; padding: 8px 12px; font-size: 0.9rem; width: auto !important; border-radius: 4px; }
                .btn-edit:hover { background: var(--hextech-blue); color: var(--hextech-black); }
                .btn-delete:hover { background: #cd3333; color: white; }

                /* Estilos para Modales */
                .modal { display: none; position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); backdrop-filter: blur(5px); }
                .modal-content { background: var(--hextech-black); margin: 5% auto; padding: 30px; border: 1px solid var(--hextech-gold); width: 90%; max-width: 500px; box-shadow: 0 0 30px rgba(0,0,0,1); }
                .modal-header { border-bottom: 1px solid #1c2636; padding-bottom: 15px; margin-bottom: 20px; color: var(--hextech-gold); font-family: 'Beaufort for LOL', serif; text-transform: uppercase; }
                .modal-footer { margin-top: 25px; display: flex; justify-content: flex-end; gap: 10px; }
                .btn-cancel { background: #1e2328; color: #a09b8c; border: 1px solid #5b5a56; width: auto; }
                .btn-confirm-del { background: #cd3333; color: white; border: 1px solid #cd3333; width: auto; }
                .btn-save-edit { background: var(--hextech-gold); color: var(--hextech-black); border: 1px solid var(--hextech-gold); width: auto; }

                /* Success Modal Específico */
                .modal-success { max-width: 400px !important; text-align: center; border-color: var(--hextech-blue) !important; }
                .success-icon { color: var(--hextech-blue); font-size: 3rem; margin-bottom: 15px; }
                .btn-close-success { background: var(--hextech-blue); color: var(--hextech-black); border: none; padding: 10px 20px; font-family: 'Beaufort for LOL', serif; font-weight: bold; cursor: pointer; text-transform: uppercase; margin-top: 15px; }

                /* Botón Lateral de Objetos */
                .side-tab {
                    position: fixed;
                    right: 0;
                    top: 50%;
                    transform: translateY(-50%);
                    background: var(--hextech-gold);
                    color: var(--hextech-black);
                    padding: 20px 10px;
                    writing-mode: vertical-rl;
                    text-orientation: mixed;
                    cursor: pointer;
                    font-family: 'Beaufort for LOL', serif;
                    font-weight: bold;
                    text-transform: uppercase;
                    border-radius: 5px 0 0 5px;
                    box-shadow: -2px 0 10px rgba(0,0,0,0.5);
                    z-index: 900;
                    transition: all 0.3s;
                }
                .side-tab:hover {
                    padding-right: 25px;
                    background: var(--hextech-gold-light);
                }
                .side-icon {
                    width: 30px;
                    height: 30px;
                    margin-bottom: 10px;
                    filter: drop-shadow(0 0 2px rgba(0,0,0,0.5));
                }
                .header-icon {
                    width: 35px;
                    height: 35px;
                    vertical-align: middle;
                    margin-right: 15px;
                    filter: drop-shadow(0 0 5px rgba(200, 155, 60, 0.3));
                }

                /* Estilos especiales para el modal de objetos */
                #objectsModal .modal-content {
                    max-width: 800px;
                    max-height: 80vh;
                    overflow-y: auto;
                }
                .item-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    gap: 15px;
                    margin-top: 20px;
                }
                .item-card {
                    background: rgba(1, 10, 19, 0.9);
                    border: 1px solid #3c3c41;
                    padding: 15px;
                    border-radius: 4px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    transition: transform 0.2s;
                }
                .item-card:hover {
                    transform: translateY(-5px);
                    border-color: var(--hextech-gold);
                }
                .item-img {
                    width: 64px;
                    height: 64px;
                    border: 2px solid var(--hextech-gold);
                    margin-bottom: 12px;
                    background: #010a13;
                }
                .item-name {
                    color: var(--hextech-gold);
                    font-weight: bold;
                    margin-bottom: 5px;
                    font-family: 'Beaufort for LOL', serif;
                }
                .item-type {
                    font-size: 0.7em;
                    text-transform: uppercase;
                    color: #0ac8b9;
                    margin-bottom: 8px;
                }
                .item-attr {
                    font-size: 0.8em;
                    margin: 5px 0;
                    color: #f0e6d2;
                    flex-grow: 1;
                }
                .item-cost {
                    color: #f0e6d2;
                    font-weight: bold;
                    font-size: 0.85rem;
                    margin-top: 5px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 4px;
                }
                .gold-icon {
                    color: #ffd700;
                    font-size: 0.8rem;
                }

                /* Pestañas de categoría */
                .category-tabs {
                    display: flex;
                    gap: 8px;
                    margin-bottom: 20px;
                    flex-wrap: wrap;
                    justify-content: center;
                }
                .cat-tab {
                    padding: 8px 15px;
                    background: rgba(1, 10, 19, 0.8);
                    border: 1px solid #3c3c41;
                    color: #a09b8c;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 0.8rem;
                    transition: all 0.3s;
                    text-transform: uppercase;
                    font-family: 'Beaufort for LOL', serif;
                }
                .cat-tab:hover {
                    color: var(--hextech-gold);
                    border-color: var(--hextech-gold);
                }
                .cat-tab.active {
                    background: var(--hextech-gold);
                    color: var(--hextech-black);
                    border-color: var(--hextech-gold);
                    font-weight: bold;
                    box-shadow: 0 0 10px rgba(200, 155, 60, 0.4);
                }
            </style>
        </head>
        <body>
            <!-- Pestaña lateral -->
            <div class="side-tab" onclick="openObjectsModal()">
                <img src="/items.png" alt="Items" class="side-icon">
                Ver Objetos
            </div>
            <main class="container">
                <h1>
                    <img src="/logo.png" alt="Wild Rift Logo" class="main-logo">
                    Proyecto Campeones de Wild Rift
                </h1>
                <div class="panel">
                    <h2 class="panel-header">
                        🔍 Buscar Campeones
                        ${isFiltering ? "<a href=\"/champions\" class=\"btn-clear\">Limpiar Filtros</a>" : ""}
                    </h2>
                    <form action="/champions" method="GET">
                        <input type="hidden" name="sort" value="${sortBy}">
                        <input type="hidden" name="order" value="${order}">
                        <div class="filter-group">
                            <div class="filter-item" style="max-width: 80px;">
                                <label for="searchId">ID</label>
                                <input type="number" name="searchId" id="searchId" value="${searchId}">
                            </div>
                            <div class="filter-item">
                                <label for="searchNombre">Nombre</label>
                                <input type="text" name="searchNombre" id="searchNombre" value="${searchNombre}">
                            </div>
                            <div class="filter-item">
                                <label for="searchTipo">Tipo</label>
                                <select name="searchTipo" id="searchTipo" aria-label="Filtrar por tipo de daño">
                                    <option value="">Todos</option>
                                    <option value="AD" ${searchTipo === "AD" ? "selected" : ""}>AD</option>
                                    <option value="AP" ${searchTipo === "AP" ? "selected" : ""}>AP</option>
                                    <option value="Mixto" ${searchTipo === "Mixto" ? "selected" : ""}>Mixto</option>
                                    <option value="Tanque" ${searchTipo === "Tanque" ? "selected" : ""}>Tanque</option>
                                </select>
                            </div>
                            <div class="filter-item">
                                <label for="searchPosicion">Posición</label>
                                <select name="searchPosicion" id="searchPosicion" aria-label="Filtrar por posición en el mapa">
                                    <option value="">Todas</option>
                                    <option value="Luchador" ${searchPosicion === "Luchador" ? "selected" : ""}>Luchador</option>
                                    <option value="Mago" ${searchPosicion === "Mago" ? "selected" : ""}>Mago</option>
                                    <option value="Asesino" ${searchPosicion === "Asesino" ? "selected" : ""}>Asesino</option>
                                    <option value="Tirador" ${searchPosicion === "Tirador" ? "selected" : ""}>Tirador</option>
                                    <option value="Tanque" ${searchPosicion === "Tanque" ? "selected" : ""}>Tanque</option>
                                    <option value="Apoyo" ${searchPosicion === "Apoyo" ? "selected" : ""}>Apoyo</option>
                                </select>
                            </div>
                            <div class="filter-item" style="max-width: 120px;">
                                <button type="submit" class="btn-search">Filtrar</button>
                            </div>
                        </div>
                    </form>
                </div>
                
                <div class="panel" style="border-left: 2px solid #0ac8b9;">
                    <h2 class="panel-header" style="color: #0ac8b9;">⚔️ Agregar Nuevo Campeón</h2>
                    <form action="/champions" method="POST">
                        <div class="filter-group">
                            <div class="filter-item">
                                <label for="nombre">Nombre *</label>
                                <input type="text" name="nombre" id="nombre" placeholder="Ej: Jinx" required>
                            </div>
                            <div class="filter-item">
                                <label for="damage">Daño</label>
                                <input type="number" name="damage" id="damage" placeholder="0-100">
                            </div>
                            <div class="filter-item">
                                <label for="tipo">Tipo</label>
                                <select name="tipo" id="tipo" aria-label="Seleccionar tipo de daño">
                                    <option value="">Seleccionar...</option>
                                    <option value="AD">AD</option>
                                    <option value="AP">AP</option>
                                    <option value="Tanque">Tanque</option>
                                    <option value="Mixto">Mixto</option>
                                </select>
                            </div>
                            <div class="filter-item">
                                <label for="posicion">Posición</label>
                                <select name="posicion" id="posicion" aria-label="Seleccionar posición de juego">
                                    <option value="">Seleccionar...</option>
                                    <option value="Luchador">Luchador</option>
                                    <option value="Mago">Mago</option>
                                    <option value="Asesino">Asesino</option>
                                    <option value="Tirador">Tirador</option>
                                    <option value="Tanque">Tanque</option>
                                    <option value="Apoyo">Apoyo</option>
                                </select>
                            </div>
                            <div class="filter-item" style="flex: 2; min-width: 250px;">
                                <label for="descripcion">Descripción *</label>
                                <input type="text" name="descripcion" id="descripcion" placeholder="Breve resumen de habilidades..." required>
                            </div>
                            <div class="filter-item" style="flex: 0; min-width: 120px;">
                                <label>&nbsp;</label>
                                <button type="submit" class="btn-add">Guardar</button>
                            </div>
                        </div>
                    </form>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th><a href="${getSortLink("id")}">ID ${getArrow("id")}</a></th>
                            <th style="width: 60px;">Icono</th>
                            <th><a href="${getSortLink("nombre")}">Nombre ${getArrow("nombre")}</a></th>
                            <th>Daño</th>
                            <th>Tipo</th>
                            <th>Posición</th>
                            <th>Descripción</th>
                            <th style="width: 150px;">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        if (champions.length === 0) {
            html += "<tr><td colspan=\"8\" style=\"text-align:center;\">No se encontraron campeones.</td></tr>";
        } else {
            const getChampImage = (name) => {
                let cleanName = name.replace(/[^a-zA-Z]/g, "");
                if (name === "Wukong") cleanName = "MonkeyKing";
                return `https://ddragon.leagueoflegends.com/cdn/14.3.1/img/champion/${cleanName}.png`;
            };

            champions.forEach(champ => {
                let badgeClass = "bg-mix";
                if (champ.tipo === "AD") badgeClass = "bg-ad";
                if (champ.tipo === "AP") badgeClass = "bg-ap";
                if (champ.tipo === "Tanque") badgeClass = "bg-tank";

                html += `
                    <tr>
                        <td>#${champ.id || "N/A"}</td>
                        <td><img src="${getChampImage(champ.nombre)}" alt="Icono de ${champ.nombre}" class="champ-icon" onerror="this.onerror=null; this.src='https://ddragon.leagueoflegends.com/cdn/14.3.1/img/champion/Sona.png'"></td>
                        <td style="font-weight: bold;">${champ.nombre}</td>
                        <td>${champ.damage}</td>
                        <td><span class="badge ${badgeClass}">${champ.tipo}</span></td>
                        <td style="font-size: 0.9rem;">${champ.posicion || ""}</td>
                        <td style="color: #a09b8c; font-size: 0.85rem;">${champ.descripcion || ""}</td>
                        <td>
                            <button onclick='openEditModal(${JSON.stringify(champ).replace(/'/g, "&apos;")})' class="btn-edit" title="Editar"><i class="fa-solid fa-pen-to-square"></i></button>
                            <button onclick="openDeleteModal('${champ._id || champ.id}', '${champ.nombre.replace(/'/g, "\\'")}')" class="btn-delete" title="Eliminar"><i class="fa-solid fa-trash-can"></i></button>
                        </td>
                </tr>
                `;
            });
        }

        html += `
                    </tbody>
                </table>
                  <div style="margin-top: 25px; font-size: 0.8rem; color: #5b5a56; text-align: center; border-top: 1px solid #1c2636; padding-top: 15px;">
                    PROYECTO WILD RIFT • ${collection ? "MODO DB" : "<span style=\"color: #cd3333;\">MODO MOCK (Sin DB)</span>"} | TOTAL: ${champions.length}
                </div>
            </main>

            <!-- Modal Eliminar -->
            <div id="deleteModal" class="modal">
                <div class="modal-content">
                    <h2 class="modal-header">⚠️ Confirmar Eliminación</h2>
                    <p>¿Estás seguro de que deseas eliminar a <strong id="deleteChampName"></strong>?</p>
                    <p style="font-size: 0.8rem; color: #cd3333;">Esta acción no se puede deshacer.</p>
                    <form id="deleteForm" method="POST">
                        <div class="modal-footer">
                            <button type="button" class="btn-cancel" onclick="closeModal('deleteModal')">Cancelar</button>
                            <button type="submit" class="btn-confirm-del">Eliminar Permanente</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Modal Editar -->
            <div id="editModal" class="modal">
                <div class="modal-content" style="max-width: 600px;">
                    <h2 class="modal-header">⚔️ Editar Campeón</h2>
                    <form id="editForm" method="POST">
                        <div class="filter-item" style="margin-bottom: 15px;">
                            <label for="editNombre">Nombre *</label>
                            <input type="text" name="nombre" id="editNombre" required>
                        </div>
                        <div style="display: flex; gap: 15px; margin-bottom: 15px;">
                            <div class="filter-item">
                                <label for="editDamage">Daño</label>
                                <input type="number" name="damage" id="editDamage">
                            </div>
                            <div class="filter-item">
                                <label for="editTipo">Tipo</label>
                                <select name="tipo" id="editTipo" aria-label="Editar tipo de daño">
                                    <option value="">Seleccionar...</option>
                                    <option value="AD">AD</option>
                                    <option value="AP">AP</option>
                                    <option value="Tanque">Tanque</option>
                                    <option value="Mixto">Mixto</option>
                                </select>
                            </div>
                        </div>
                        <div class="filter-item" style="margin-bottom: 15px;">
                            <label for="editPosicion">Posición</label>
                            <select name="posicion" id="editPosicion" aria-label="Editar posición de juego">
                                <option value="">Seleccionar...</option>
                                <option value="Luchador">Luchador</option>
                                <option value="Mago">Mago</option>
                                <option value="Asesino">Asesino</option>
                                <option value="Tirador">Tirador</option>
                                <option value="Tanque">Tanque</option>
                                <option value="Apoyo">Apoyo</option>
                            </select>
                        </div>
                        <div class="filter-item">
                            <label for="editDescripcion">Descripción *</label>
                            <input type="text" name="descripcion" id="editDescripcion" required>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn-cancel" onclick="closeModal('editModal')">Cancelar</button>
                            <button type="submit" class="btn-save-edit">Guardar Cambios</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Modal Éxito -->
            <div id="successModal" class="modal">
                <div class="modal-content modal-success">
                    <div class="success-icon"><i class="fa-solid fa-circle-check"></i></div>
                    <h2 class="modal-header" style="border:none; margin:0; color:var(--hextech-blue);">¡Éxito!</h2>
                    <p>El cambio fue ejecutado correctamente.</p>
                    <button class="btn-close-success" onclick="closeModal('successModal')">Cerrar</button>
                </div>
            </div>


            <!-- Modal Listado de Objetos -->
            <div id="objectsModal" class="modal">
                <div class="modal-content">
                    <h2 class="modal-header">
                        <img src="/items.png" alt="Items" class="header-icon">
                        Inventario de Objetos Wild Rift
                    </h2>
                    
                    <!-- Buscador de Objetos -->
                    <div style="margin-bottom: 15px;">
                        <input type="text" id="objectSearchInput" placeholder="Buscar objeto por nombre..." 
                               style="width: 100%; box-sizing: border-box; padding: 12px; border-radius: 4px;"
                               onkeyup="filterObjects()">
                    </div>

                    <!-- Filtros por Tipo (Categorías) -->
                    <div class="category-tabs" id="categoryTabs">
                        <button class="cat-tab active" onclick="setCategory('all', this)">Todos</button>
                        <button class="cat-tab" onclick="setCategory('fisico', this)">Físico</button>
                        <button class="cat-tab" onclick="setCategory('magico', this)">Mágico</button>
                        <button class="cat-tab" onclick="setCategory('defensa', this)">Defensa</button>
                        <button class="cat-tab" onclick="setCategory('botas', this)">Botas</button>
                        <button class="cat-tab" onclick="setCategory('encantamiento', this)">Hechizos</button>
                    </div>

                    <div id="objectsList" class="item-grid">
                        <p style="text-align: center; width: 100%;">Cargando objetos...</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn-cancel" onclick="closeModal('objectsModal')">Cerrar</button>
                    </div>
                </div>
            </div>

            <script>
                // Verificar si hay un parámetro de éxito en la URL
                window.onload = function() {
                    const urlParams = new URLSearchParams(window.location.search);
                    if (urlParams.get('success') === 'true') {
                        document.getElementById('successModal').style.display = 'block';
                        // Limpiar la URL sin recargar la página
                        const newUrl = window.location.pathname + (window.location.search.replace(/[?&]success=true/, '').replace(/^&/, '?'));
                        window.history.replaceState({}, document.title, newUrl);
                    }
                }
                function openDeleteModal(id, name) {
                    document.getElementById('deleteChampName').innerText = name;
                    document.getElementById('deleteForm').action = '/champions/delete/' + id;
                    document.getElementById('deleteModal').style.display = 'block';
                }

                function openEditModal(champ) {
                    document.getElementById('editNombre').value = champ.nombre || '';
                    document.getElementById('editDamage').value = champ.damage || 0;
                    document.getElementById('editTipo').value = champ.tipo || '';
                    document.getElementById('editPosicion').value = champ.posicion || '';
                    document.getElementById('editDescripcion').value = champ.descripcion || '';
                    // Priorizar el uso de _id para MongoDB
                    const identifier = champ._id || champ.id;
                    document.getElementById('editForm').action = '/champions/edit/' + identifier;
                    document.getElementById('editModal').style.display = 'block';
                }

                function closeModal(modalId) {
                    document.getElementById(modalId).style.display = 'none';
                }

                let allObjects = []; // Almacén global para filtrado rápido
                let currentCategory = 'all';

                async function openObjectsModal() {
                    document.getElementById('objectsModal').style.display = 'block';
                    document.getElementById('objectSearchInput').value = '';
                    
                    // Resetear pestañas al abrir
                    currentCategory = 'all';
                    const tabs = document.querySelectorAll('.cat-tab');
                    tabs.forEach(tab => tab.classList.remove('active'));
                    if(tabs[0]) tabs[0].classList.add('active');

                    const listContainer = document.getElementById('objectsList');
                    listContainer.innerHTML = '<p style="text-align: center; width: 100%;">Cargando objetos...</p>';
                    
                    try {
                        const response = await fetch('/items');
                        allObjects = await response.json();
                        renderObjects(allObjects);
                    } catch (error) {
                        listContainer.innerHTML = '<p style="color: #cd3333;">Error al cargar los objetos.</p>';
                    }
                }

                function setCategory(category, element) {
                    currentCategory = category;
                    
                    // UI: Actualizar clase activa
                    const tabs = document.querySelectorAll('.cat-tab');
                    tabs.forEach(tab => tab.classList.remove('active'));
                    element.classList.add('active');
                    
                    filterObjects();
                }

                function renderObjects(items) {
                    const listContainer = document.getElementById('objectsList');
                    if (items.length === 0) {
                        listContainer.innerHTML = '<p style="text-align: center; width: 100%; color: #a09b8c;">No se encontraron objetos.</p>';
                        return;
                    }

                    const nameMap = {
                        "Filo Infinito": "infinity-edge",
                        "Sanguinaria": "bloodthirster",
                        "Recolector": "the-collector",
                        "Huracán de Runaan": "runaans-hurricane",
                        "Bailarín Espectral": "phantom-dancer",
                        "Hoja del Rey Arruinado": "blade-of-the-ruined-king",
                        "Cuchilla Negra": "black-cleaver",
                        "Fuerza de la Trinidad": "trinity-force",
                        "Devorador de Almas": "awakened-soulstealer",
                        "Recordatorio Mortal": "mortal-reminder",
                        "Sombrero Mortal de Rabadon": "rabadons-deathcap",
                        "Eco de Luden": "ludens-echo",
                        "Tormento de Liandry": "liandrys-torment",
                        "Orbe del Infinito": "infinity-orb",
                        "Diente de Nashor": "nashors-tooth",
                        "Bastón del Vacío": "void-staff",
                        "Morellonomicón": "morellonomicon",
                        "Cristal de Rylai": "rylais-crystal-scepter",
                        "Égida de Fuego Solar": "sunfire-aegis",
                        "Malla de Espinas": "thornmail",
                        "Rostro Espiritual": "spirit-visage",
                        "Presagio de Randuin": "randuins-omen",
                        "Fuerza de la Naturaleza": "force-of-nature",
                        "Grebas de Berserker": "berserkers-greaves",
                        "Botas Jonias de la Lucidez": "ionian-boots-of-lucidity",
                        "Botas Blindadas": "plated-steelcaps",
                        "Botas de Mercurio": "mercurys-treads",
                        "Encantamiento Estasis": "stasis",
                        "Encantamiento Protocinturón": "protobelt",
                        "Encantamiento Redención": "redemption",
                        "Encantamiento Medallón": "locket",
                        // Nuevos Objetos
                        "Daga de Statikk": "statikk-shiv",
                        "Cañón de Fuego Rápido": "rapid-firecannon",
                        "Espada Fantasma de Youmuu": "youmuus-ghostblade",
                        "Hoja Crepuscular de Draktharr": "duskblade-of-draktharr",
                        "Recuerdo de Lord Dominik": "lord-dominiks-regards",
                        "Colmillo de Serpiente": "serpents-fang",
                        "Rencor de Serylda": "seryldas-grudge",
                        "Vara de las Edades": "rod-of-ages",
                        "Perdición del Liche": "lich-bane",
                        "Abrazo del Serafín": "archangels-staff",
                        "Creador de Grietas": "riftmaker",
                        "Impulso Cósmico": "cosmic-drive",
                        "Eco Armónico": "harmonic-echo",
                        "Ángel Guardián": "guardian-angel",
                        "Coraza del Hombre Muerto": "dead-mans-plate",
                        "Corazón de Hielo": "frozen-heart",
                        "Protector Pétreo de Amaranth": "amaranths-twinguard",
                        "Manto de la Duodécima Hora": "mantle-of-the-twelfth-hour",
                        "Invierno Nórdico": "winters-approach",
                        // --- Básicos ---
                        "Guantes de Riña": "brawlers-gloves",
                        "Daga": "dagger",
                        "Espada Larga": "long-sword",
                        "Hoz Espectral": "spectrals-sickle",
                        "Tomo Amplificador": "amplifying-tome",
                        "Moneda Antigua": "ancient-coin",
                        "Anillo de Revelación": "ring-of-revelation",
                        "Cristal de Zafiro": "common-sapphire-crystal",
                        "Armadura de Tela": "cloth-armor",
                        "Manto de Anulación": "null-magic-mantle",
                        "Escudo Reliquia": "relic-shield",
                        "Rubí de Cristal": "ruby-crystal",
                        "Chispa Resplandeciente": "shimmering-spark",
                        // --- Intermedios ---
                        "Espadón": "b-f-sword",
                        "Martillo de Caulfield": "caulfields-warhammer",
                        "Capa de Agilidad": "cloak-of-agility",
                        "Llamado del Verdugo": "executioners-calling",
                        "Fragmento de Kircheis": "kircheis-shard",
                        "Último Suspiro": "last-whisper",
                        "Cajacuaj": "noonquiver",
                        "Bacteriófago": "phage",
                        "Arco Recurvato": "recurve-bow",
                        "Puñal Serrado": "serrated-dirk",
                        "Aguijón": "stinger",
                        "Cetro Vampírico": "vampiric-scepter",
                        "Fervor": "zeal",
                        "Capa de Fuego": "bamis-cinder",
                        "Vestidura de Zarzas": "bramble-vest",
                        "Catalizador de Eones": "catalyst-of-aeons",
                        "Cota de Malla": "chain-vest",
                        "Cinturón de Gigante": "giants-belt",
                        "Sudario Glacial": "glacial-shroud",
                        "Sorbehechizos": "hexdrinker",
                        "Puño de Jaurim": "jaurims-fist",
                        "Gema de Avivamiento": "kindlegem",
                        "Capa de Negatrón": "negatron-cloak",
                        "Hábito del Espectro": "spectres-cowl",
                        "Protector del Guardián": "wardens-mail",
                        // --- Botas y Otros ---
                        "Botas de Dinamismo": "boots-of-dynamism",
                        "Botas de Maná": "boots-of-mana",
                        "Botas Voraces": "gluttonous-greaves",
                        "Botas de Velocidad": "boots-of-speed",
                        "Encantamiento Fajín": "quicksilver",
                        "Encantamiento de Gárgola": "gargoyle",
                        "Encantamiento de Gloria": "glorious",
                        "Encantamiento Magnetrón": "magnetron",
                        "Encantamiento de Meteoro": "meteor",
                        "Encantamiento de Repulsor": "repulsor",
                        "Encantamiento de Velo": "veil",
                        "Terminus": "terminus",
                        "Corazón de Acero": "heartsteel",
                        "Lanza de Shojin": "spear-of-shojin",
                        "Hidra Titánica": "titanic-hydra",
                        "Guantelete Nacido del Hielo": "iceborn-gauntlet",
                        "Final del Ingenio": "wits-end"
                    };

                    listContainer.innerHTML = items.map(item => {
                        const slug = nameMap[item.nombre] || item.nombre.toLowerCase().replace(/ /g, '-');
                        const imgUrl = \`https://www.wildriftfire.com/images/items/\${slug}.png\`;
                        
                        return \`
                            <div class="item-card">
                                <img src="\${imgUrl}" alt="Icono de \${item.nombre}" class="item-img" onerror="this.src='/items.png'">
                                <div class="item-name">#\${item.id} \${item.nombre}</div>
                                <div class="item-type">\${item.tipo} - \${item.tier}</div>
                                <div class="item-cost">
                                    <i class="fa-solid fa-coins gold-icon"></i> \${item.costo || 0}
                                </div>
                                <div class="item-attr">\${item.atributos.join('<br>')}</div>
                                <div style="font-size: 0.75rem; color: #a09b8c; border-top: 1px solid #1c2636; margin-top: 8px; padding-top: 5px; width: 100%; text-align: left;">
                                    <strong>P:</strong> \${item.descripcion.pasiva}
                                    \${item.descripcion.activa && item.descripcion.activa !== 'No tiene.' && item.descripcion.activa !== 'No tiene' ? 
                                        \`<br><strong style="color: #0ac8b9">A:</strong> \${item.descripcion.activa}\` : ''}
                                </div>
                            </div>
                        \`;
                    }).join('');
                }

                function filterObjects() {
                    const searchTerm = document.getElementById('objectSearchInput').value.toLowerCase().trim();
                    const filtered = allObjects.filter(item => {
                        const matchesName = item.nombre.toLowerCase().includes(searchTerm);
                        const matchesCategory = currentCategory === 'all' || item.tipo === currentCategory;
                        return matchesName && matchesCategory;
                    });
                    renderObjects(filtered);
                }

                window.onclick = function(event) {
                    if (event.target.className === 'modal') {
                        event.target.style.display = 'none';
                    }
                }
            </script>
        </body>
        </html>
        `;
        res.send(html);
    } catch (error) {
        console.error("Error fetching champions:", error);
        res.status(500).send("Error");
    }
});

app.post("/champions", async (req, res) => {
    try {
        const { champions: activeCollection } = await connectToDB();

        // Obtener el ID más alto para autoincrementar
        let nextId = 1;
        if (activeCollection) {
            const lastChamp = await activeCollection.find().sort({ id: -1 }).limit(1).toArray();
            if (lastChamp.length > 0) nextId = (lastChamp[0].id || 0) + 1;
        } else {
            const maxId = Math.max(...fallbackChampions.map(c => c.id || 0), 0);
            nextId = maxId + 1;
        }

        const newChamp = {
            id: nextId,
            nombre: req.body.nombre,
            damage: parseInt(req.body.damage) || 0,
            tipo: req.body.tipo || "",
            posicion: req.body.posicion || "",
            descripcion: req.body.descripcion
        };

        if (activeCollection) {
            await activeCollection.insertOne(newChamp);
        } else {
            fallbackChampions.push(newChamp);
            // Intentar guardar en el JSON local para persistencia en modo mock
            try {
                fs.writeFileSync(path.join(__dirname, "champions.json"), JSON.stringify(fallbackChampions, null, 4));
            } catch (e) { console.error("Error saving to local JSON:", e); }
        }

        res.redirect("/champions?success=true");
    } catch (error) {
        console.error("Error creating champion:", error);
        res.status(500).send("Error al crear el campeón");
    }
});

app.post("/champions/delete/:id", async (req, res) => {
    try {
        const idParam = req.params.id;
        console.log(`[DEBUG] Attempting to delete champion with ID: ${idParam}`);
        const id = parseInt(idParam);
        const { champions: activeCollection } = await connectToDB();

        if (activeCollection) {
            const query = ObjectId.isValid(req.params.id) ? { _id: new ObjectId(req.params.id) } : { id: parseInt(req.params.id) || req.params.id };
            await activeCollection.deleteOne(query);
        } else {
            fallbackChampions = fallbackChampions.filter(c => c.id !== id);
            try {
                fs.writeFileSync(path.join(__dirname, "champions.json"), JSON.stringify(fallbackChampions, null, 4));
            } catch (e) { console.error("Error updating local JSON after delete:", e); }
        }
        res.redirect("/champions?success=true");
    } catch (error) {
        console.error("Delete error:", error);
        res.status(500).send("Error al eliminar");
    }
});

app.post("/champions/edit/:id", async (req, res) => {
    try {
        const idParam = req.params.id;
        const { champions: activeCollection } = await connectToDB();
        const updatedData = {
            nombre: req.body.nombre,
            damage: parseInt(req.body.damage) || 0,
            tipo: req.body.tipo || "",
            posicion: req.body.posicion || "",
            descripcion: req.body.descripcion
        };

        if (activeCollection) {
            let query = {};
            if (ObjectId.isValid(idParam)) {
                query = { _id: new ObjectId(idParam) };
            } else {
                query = { $or: [{ id: parseInt(idParam) || -1 }, { id: idParam }] };
            }
            const result = await activeCollection.updateOne(query, { $set: updatedData });
            console.log(`Update handled for ${idParam}. Result: ${result.modifiedCount} updated.`);
        } else {
            const idInt = parseInt(idParam);
            const index = fallbackChampions.findIndex(c => c.id === idInt);
            if (index !== -1) {
                fallbackChampions[index] = { ...fallbackChampions[index], ...updatedData };
                try {
                    fs.writeFileSync(path.join(__dirname, "champions.json"), JSON.stringify(fallbackChampions, null, 4));
                } catch (e) { console.error("Error updating local JSON after edit:", e); }
            }
        }
        res.redirect("/champions?success=true");
    } catch (error) {
        console.error("Edit error:", error);
        res.status(500).send("Error al editar");
    }
});

// Nuevo endpoint para obtener los objetos
app.get("/items", async (req, res) => {
    try {
        const { objects: activeCollection } = await connectToDB();
        if (activeCollection) {
            const items = await activeCollection.find().sort({ id: 1 }).toArray();
            res.json(items);
        } else {
            // Fallback si no hay conexión a DB
            const data = fs.readFileSync(path.join(__dirname, "objetos.json"), "utf8");
            res.json(JSON.parse(data).map((item, i) => ({ id: i + 1, ...item })));
        }
    } catch (error) {
        console.error("Fetch items error:", error);
        res.status(500).json({ error: "Error al cargar objetos" });
    }
});

app.get("/", (req, res) => res.redirect("/champions"));
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    connectToDB(); // Intento de conexión inicial silencioso
});
