# Feature: Catalog, settings, stats and auth E2E

**From build-plan:** feature 19g
**Status:** completed
**Branch:** `feature/catalog-settings-stats-auth-e2e`

## Goal

Completar la cobertura E2E de los flujos visibles del negocio: autenticacion,
configuracion, catalogo publico y estadisticas, junto con la consolidacion de
los flujos E2E de pedidos, inventario, productos, clientes y pagos.

## Delivered

- Logout con redireccion verificable al login.
- Actualizacion de configuracion del negocio y persistencia tras recarga.
- Catalogo publico con productos publicados y sin productos no publicados.
- Estadisticas con datos derivados de operaciones reales.
- CRUD de clientes, productos y pedidos cubierto end-to-end.
- Pagos parciales y completos, estados de pedido e inventario verificados.
- Casos negativos para stock insuficiente, saldo excedido, nombre invalido,
  imagen insegura y SKU duplicado.
- Seed idempotente para el usuario E2E, con restauracion de stock mutable.
- Ejecucion paralela de Playwright con 4 workers sin dependencia entre tests.
- Limpieza de fixtures incompatibles con las credenciales anonimas de E2E.

## Evidence

| Check | Result |
| --- | --- |
| `npm run test:e2e` | 25 passed with 4 workers |
| `npm run test:run` | 497 passed in 34 files |
| `npm run build` | passed |
| `npm run lint` | passed with no warnings |
| Prettier and `git diff --check` | passed |

## E2E Testing Playbook

### Como validar que un test prueba comportamiento real

- Partir de una accion que el vendedor ejecuta, no de un componente aislado.
- Esperar la request o el estado resultante antes de continuar; no usar pausas
  arbitrarias como sincronizacion.
- Verificar el resultado persistido mediante recarga, una consulta posterior o
  el siguiente flujo de negocio.
- Para inventario, pagos y estados, comprobar el efecto sobre los datos
  relacionados, no solo el texto de la fila modificada.
- En catalogo y estadisticas, preparar datos conocidos y comprobar que la salida
  deriva de esos datos.

### Como distinguir un issue real de un success forzado

- Usar roles y nombres accesibles para interactuar con controles reales.
- Si un elemento esta oculto, deshabilitado o cubierto, inspeccionar el DOM y el
  flujo antes de desactivar `pointer-events` o forzar la interaccion.
- No aceptar un toast, una URL o una fila optimista como prueba unica de exito.
- En errores, comprobar el mensaje visible y que el estado invalido no se
  persistio.
- Reproducir el flujo con workers paralelos para descubrir estado compartido,
  datos contaminados y carreras.

### Datos y aislamiento

- Usar un usuario y registros dedicados para E2E.
- Hacer el seed idempotente y ejecutarlo en `globalSetup`.
- Restaurar valores mutables que otros tests puedan consumir, especialmente
  stock.
- Cada test debe preparar y limpiar sus propios datos; no depender del orden.

## Manual try path

Ejecutar `npm run dev`, abrir `http://localhost:5173`, iniciar sesion con el
usuario E2E y recorrer `/ajustes`, `/catalogo/mi-negocio` y `/estadisticas`.
Para el recorrido completo de pedidos, productos, clientes y validaciones,
ejecutar `/try latest`.
