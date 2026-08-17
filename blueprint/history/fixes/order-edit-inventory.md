# Fix: Edit order quantities and inventory availability

**Type:** Fix
**Status:** completed
**Branch:** `fix/order-edit-inventory`

## Problem

Al editar un pedido existente que había reservado 9 unidades, la UI podía
ejecutar `create_order` en lugar de `update_order`. En el caso reproducido, una
variante con stock inicial de 10 quedaba en 1; al cambiar el pedido de 9 a 7,
el flujo intentaba crear otro pedido y recibía `Insufficient stock`.

El editor también mostraba `10 disponibles` como si fuera el stock físico, aunque
solo había 1 unidad en almacén. Ese valor era la capacidad máxima de edición al
devolver la reserva original, no el inventario real.

## Root cause

La edición se resolvía desde la URL en `PageRouter`, pero `useOrderEditor` solo
consideraba su estado interno `orderEditor`. Como ese estado no se sincronizaba
con el pedido de la ruta, `handleOrderSubmit` seguía el camino de creación.

## Fix delivered

- `PageRouter` pasa el pedido resuelto desde la ruta al submit de edición.
- `useOrderEditor` prioriza ese pedido y ejecuta `updateExistingOrder`.
- El editor separa stock físico de capacidad editable, mostrando por ejemplo
  `991 en almacén · hasta 1000 en este pedido`.
- Se añadió una prueba E2E que crea 9 unidades, edita a 7, confirma el RPC
  `update_order`, confirma que no se llama `create_order`, y verifica pedido e
  inventario después de recargar.

## Verification

| Check | Result |
| --- | --- |
| `npm run test:run` | 497 passed in 34 files |
| `npm run test:e2e` | 26 passed with 4 workers |
| Focused edit E2E | passed in 14.3s |
| `npm run build` | passed |
| `npm run lint` | passed |
| Prettier changed files | passed |
| `git diff --check` | passed |

## How to try it

1. In `/pedidos`, create a pending order for 9 units of a stocked variant.
2. Open the order and choose `Editar pedido`.
3. Confirm the editor shows physical stock separately from the editable limit.
4. Change the quantity to 7 and save.
5. Confirm the order has 7 units and the inventory has recovered 2 units after
   navigating away and returning.
