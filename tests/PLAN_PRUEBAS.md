# Plan de Pruebas Manuales (Test Plan)

Antes de automatizar, definimos qué pasos haríamos manualmente para verificar que la aplicación funciona.

## Caso de Prueba 1: Verificar Carga de Página
**Objetivo**: Asegurar que la aplicación carga correctamente.
1. Abrir navegador.
2. Ir a `http://localhost:3000/champions`.
3. **Resultado Esperado**: El título de la pestaña dice "Proyecto Campeones de Wild Rift" y se ve la lista de campeones.

## Caso de Prueba 2: Verificar Listado de Datos
**Objetivo**: Asegurar que se muestran los campeones traídos de la base de datos.
1. Observar la tabla.
2. **Resultado Esperado**: La tabla no está vacía (tiene filas) y muestra columnas como Icono, Nombre, Daño, Tipo.

## Caso de Prueba 3: Verificar Búsqueda
**Objetivo**: Asegurar que el filtro por nombre funciona.
1. En el campo "Nombre", escribir "Yasuo".
2. Clic en "Filtrar".
3. **Resultado Esperado**: La tabla se actualiza y muestra solo campeones que coinciden con "Yasuo".
