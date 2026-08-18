# Fix: Partial payments in receivables and statistics

**Type:** Fix
**Status:** completed
**Branch:** `fix/partial-payments-receivables`

## Problem

La card `Por cobrar` solo consideraba pedidos `Pendiente` y sumaba el total
bruto. Un pedido de `$500` pendiente más uno de `$300` con un abono de `$100`
mostraba `$500` en lugar de `$700`.

La tabla tampoco mostraba cuánto se había pagado y cuánto quedaba pendiente.
Además, el filtro de fecha inicialmente usaba `delivered_at`, aunque la columna
visible `Fecha` muestra `created_at`, provocando resultados que no coincidían con
las fechas que el usuario veía.

## Fix delivered

- `Por cobrar` suma `max(total - paidAmount, 0)` para pedidos pendientes y
  parciales, excluyendo pagados y cancelados.
- La tabla muestra `Total pagado` y `Pendiente de pago` inmediatamente después
  de `Total`.
- Estadísticas y receivables se verifican con una operación de abono persistida.
- Se añadieron filtros server-side y locales por cliente y fecha del pedido.
- Los filtros se guardan en la URL (`client` y `date`) y sobreviven reload.
- El filtro de fecha usa `created_at`, que corresponde a la columna visible
  `Fecha`.
- Los resultados paginados incluyen `client_id` y la fecha de creación en la
  consulta real de Supabase.

## Verification

| Check | Result |
| --- | --- |
| `npm run test:run` | 499 passed in 34 files |
| `npm run test:e2e` | 26 passed with 4 workers |
| Partial-payment E2E | receivables and revenue deltas verified after reload |
| Client/date filter E2E | filters applied and survived reload |
| `npm run build` | passed |
| `npm run lint` | passed |
| Prettier changed files | passed |
| `git diff --check` | passed |

## How to try it

1. Open `/pedidos` and confirm the columns `Total pagado` and `Pendiente de pago`.
2. Create or locate a `$500` pending order and a `$300` order with a `$100`
   payment. Confirm `Por cobrar` shows `$700`.
3. Use `Filtrar por cliente` and `Filtrar por fecha del pedido`; reload and
   confirm the table keeps the filtered results.
4. Open `/estadisticas` and confirm the partial payment contributes only the
   amount actually paid to revenue.
