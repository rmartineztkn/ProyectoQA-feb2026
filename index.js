const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

const url = 'mongodb://127.0.0.1:27017';
const dbName = 'Proyecto-Wildrift';
let client = new MongoClient(url, { serverSelectionTimeoutMS: 2000 });
let collection = null;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

async function connectToDB() {
    try {
        if (!collection) {
            await client.connect();
            const db = client.db(dbName);
            collection = db.collection('champions');
            console.log('Successfully connected to MongoDB');
        }
        return collection;
    } catch (error) {
        console.warn('MongoDB connection failed. Using mock data.');
        collection = null;
        return null;
    }
}

let fallbackChampions = [];
try {
    const data = fs.readFileSync(path.join(__dirname, 'champions.json'), 'utf8');
    fallbackChampions = JSON.parse(data).map((c, i) => ({
        ...c,
        id: c.id || (i + 1)
    }));
} catch (e) {
    console.error('Failed to load local data:', e);
}

app.get('/champions', async (req, res) => {
    try {
        const activeCollection = await connectToDB();

        const searchId = req.query.searchId || '';
        const searchNombre = req.query.searchNombre || '';
        const searchDamage = req.query.searchDamage || '';
        const searchTipo = req.query.searchTipo || '';
        const searchPosicion = req.query.searchPosicion || '';

        const sortBy = req.query.sort || 'id';
        const order = req.query.order || 'asc';

        let champions = [];

        if (activeCollection) {
            let query = {};
            if (searchId) {
                const idNum = parseInt(searchId);
                query.$or = [{ id: idNum }, { id: searchId }];
            }
            if (searchNombre) query.nombre = { $regex: searchNombre.trim(), $options: 'i' };
            if (searchDamage) query.damage = parseInt(searchDamage);
            if (searchTipo) query.tipo = searchTipo; // Tipo suele ser exacto (AD, AP, etc)
            if (searchPosicion) query.posicion = searchPosicion;

            let sortOptions = {};
            sortOptions[sortBy] = (order === 'asc' ? 1 : -1);
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
                if (order === 'asc') return valA > valB ? 1 : -1;
                return valA < valB ? 1 : -1;
            });
        }

        const getSortLink = (field) => {
            const nextOrder = (sortBy === field && order === 'asc') ? 'desc' : 'asc';
            const params = new URLSearchParams({
                searchId, searchNombre, searchDamage, searchTipo, searchPosicion,
                sort: field,
                order: nextOrder
            });
            return `/champions?${params.toString()}`;
        };

        const getArrow = (field) => {
            if (sortBy !== field) return '<span style="color: #5b5a56; font-size: 0.8em">⇅</span>';
            return order === 'asc' ? '▲' : '▼';
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
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Proyecto Campeones de Wild Rift</h1>
                <div class="panel">
                    <h2 class="panel-header">
                        🔍 Buscar Campeones
                        ${isFiltering ? '<a href="/champions" class="btn-clear">Limpiar Filtros</a>' : ''}
                    </h2>
                    <form action="/champions" method="GET">
                        <input type="hidden" name="sort" value="${sortBy}">
                        <input type="hidden" name="order" value="${order}">
                        <div class="filter-group">
                            <div class="filter-item" style="max-width: 80px;">
                                <label>ID</label>
                                <input type="number" name="searchId" value="${searchId}">
                            </div>
                            <div class="filter-item">
                                <label>Nombre</label>
                                <input type="text" name="searchNombre" value="${searchNombre}">
                            </div>
                            <div class="filter-item">
                                <label>Tipo</label>
                                <select name="searchTipo">
                                    <option value="">Todos</option>
                                    <option value="AD" ${searchTipo === 'AD' ? 'selected' : ''}>AD</option>
                                    <option value="AP" ${searchTipo === 'AP' ? 'selected' : ''}>AP</option>
                                    <option value="Mixto" ${searchTipo === 'Mixto' ? 'selected' : ''}>Mixto</option>
                                    <option value="Tanque" ${searchTipo === 'Tanque' ? 'selected' : ''}>Tanque</option>
                                </select>
                            </div>
                            <div class="filter-item">
                                <label>Posición</label>
                                <select name="searchPosicion">
                                    <option value="">Todas</option>
                                    <option value="Luchador" ${searchPosicion === 'Luchador' ? 'selected' : ''}>Luchador</option>
                                    <option value="Mago" ${searchPosicion === 'Mago' ? 'selected' : ''}>Mago</option>
                                    <option value="Asesino" ${searchPosicion === 'Asesino' ? 'selected' : ''}>Asesino</option>
                                    <option value="Tirador" ${searchPosicion === 'Tirador' ? 'selected' : ''}>Tirador</option>
                                    <option value="Tanque" ${searchPosicion === 'Tanque' ? 'selected' : ''}>Tanque</option>
                                    <option value="Apoyo" ${searchPosicion === 'Apoyo' ? 'selected' : ''}>Apoyo</option>
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
                                <label>Nombre *</label>
                                <input type="text" name="nombre" placeholder="Ej: Jinx" required>
                            </div>
                            <div class="filter-item">
                                <label>Daño</label>
                                <input type="number" name="damage" placeholder="0-100">
                            </div>
                            <div class="filter-item">
                                <label>Tipo</label>
                                <select name="tipo">
                                    <option value="">Seleccionar...</option>
                                    <option value="AD">AD</option>
                                    <option value="AP">AP</option>
                                    <option value="Tanque">Tanque</option>
                                    <option value="Mixto">Mixto</option>
                                </select>
                            </div>
                            <div class="filter-item">
                                <label>Posición</label>
                                <select name="posicion">
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
                                <label>Descripción *</label>
                                <input type="text" name="descripcion" placeholder="Breve resumen de habilidades..." required>
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
                            <th><a href="${getSortLink('id')}">ID ${getArrow('id')}</a></th>
                            <th style="width: 60px;">Icono</th>
                            <th><a href="${getSortLink('nombre')}">Nombre ${getArrow('nombre')}</a></th>
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
            html += `<tr><td colspan="8" style="text-align:center;">No se encontraron campeones.</td></tr>`;
        } else {
            const getChampImage = (name) => {
                let cleanName = name.replace(/[^a-zA-Z]/g, '');
                if (name === 'Wukong') cleanName = 'MonkeyKing';
                return `https://ddragon.leagueoflegends.com/cdn/14.3.1/img/champion/${cleanName}.png`;
            };

            champions.forEach(champ => {
                let badgeClass = 'bg-mix';
                if (champ.tipo === 'AD') badgeClass = 'bg-ad';
                if (champ.tipo === 'AP') badgeClass = 'bg-ap';
                if (champ.tipo === 'Tanque') badgeClass = 'bg-tank';

                html += `
                    <tr>
                        <td>#${champ.id || 'N/A'}</td>
                        <td><img src="${getChampImage(champ.nombre)}" class="champ-icon" onerror="this.onerror=null; this.src='https://ddragon.leagueoflegends.com/cdn/14.3.1/img/champion/Sona.png'"></td>
                        <td style="font-weight: bold;">${champ.nombre}</td>
                        <td>${champ.damage}</td>
                        <td><span class="badge ${badgeClass}">${champ.tipo}</span></td>
                        <td style="font-size: 0.9rem;">${champ.posicion || ''}</td>
                        <td style="color: #a09b8c; font-size: 0.85rem;">${champ.descripcion || ''}</td>
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
                    PROYECTO WILD RIFT • ${collection ? 'MODO DB' : '<span style="color: #cd3333;">MODO MOCK (Sin DB)</span>'} | TOTAL: ${champions.length}
                </div>
            </div>

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
                            <label>Nombre *</label>
                            <input type="text" name="nombre" id="editNombre" required>
                        </div>
                        <div style="display: flex; gap: 15px; margin-bottom: 15px;">
                            <div class="filter-item">
                                <label>Daño</label>
                                <input type="number" name="damage" id="editDamage">
                            </div>
                            <div class="filter-item">
                                <label>Tipo</label>
                                <select name="tipo" id="editTipo">
                                    <option value="">Seleccionar...</option>
                                    <option value="AD">AD</option>
                                    <option value="AP">AP</option>
                                    <option value="Tanque">Tanque</option>
                                    <option value="Mixto">Mixto</option>
                                </select>
                            </div>
                        </div>
                        <div class="filter-item" style="margin-bottom: 15px;">
                            <label>Posición</label>
                            <select name="posicion" id="editPosicion">
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
                            <label>Descripción *</label>
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

app.post('/champions', async (req, res) => {
    try {
        const activeCollection = await connectToDB();

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
            tipo: req.body.tipo || '',
            posicion: req.body.posicion || '',
            descripcion: req.body.descripcion
        };

        if (activeCollection) {
            await activeCollection.insertOne(newChamp);
        } else {
            fallbackChampions.push(newChamp);
            // Intentar guardar en el JSON local para persistencia en modo mock
            try {
                fs.writeFileSync(path.join(__dirname, 'champions.json'), JSON.stringify(fallbackChampions, null, 4));
            } catch (e) { console.error("Error saving to local JSON:", e); }
        }

        res.redirect('/champions?success=true');
    } catch (error) {
        console.error("Error creating champion:", error);
        res.status(500).send("Error al crear el campeón");
    }
});

app.post('/champions/delete/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const activeCollection = await connectToDB();

        if (activeCollection) {
            const query = ObjectId.isValid(req.params.id) ? { _id: new ObjectId(req.params.id) } : { id: parseInt(req.params.id) || req.params.id };
            await activeCollection.deleteOne(query);
        } else {
            fallbackChampions = fallbackChampions.filter(c => c.id !== id);
            try {
                fs.writeFileSync(path.join(__dirname, 'champions.json'), JSON.stringify(fallbackChampions, null, 4));
            } catch (e) { console.error("Error updating local JSON after delete:", e); }
        }
        res.redirect('/champions?success=true');
    } catch (error) {
        res.status(500).send("Error al eliminar");
    }
});

app.post('/champions/edit/:id', async (req, res) => {
    try {
        const idParam = req.params.id;
        const activeCollection = await connectToDB();
        const updatedData = {
            nombre: req.body.nombre,
            damage: parseInt(req.body.damage) || 0,
            tipo: req.body.tipo || '',
            posicion: req.body.posicion || '',
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
                    fs.writeFileSync(path.join(__dirname, 'champions.json'), JSON.stringify(fallbackChampions, null, 4));
                } catch (e) { console.error("Error updating local JSON after edit:", e); }
            }
        }
        res.redirect('/champions?success=true');
    } catch (error) {
        console.error("Edit error:", error);
        res.status(500).send("Error al editar");
    }
});

app.get('/', (req, res) => res.redirect('/champions'));
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    connectToDB(); // Intento de conexión inicial silencioso
});
