// Production-safe catalogue setup: deliberately creates NO demonstration rows.
//
// A fresh production database must start empty — no suppliers, locations,
// products or opening balances until real ones are created through the
// application. The demonstration catalogue used by local development and
// Playwright is seeded separately via `npm run db:seed:demo`
// (backend/api/prisma/seed-catalog-demo.ts) and must never run in production.
console.log("Empty catalogue setup complete: no demonstration rows created.");
