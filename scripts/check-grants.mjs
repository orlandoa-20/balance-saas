import pg from "pg";
const c = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
await c.connect();
const { rows } = await c.query(`
  select column_name from information_schema.column_privileges
  where table_schema='public' and table_name='profiles'
    and grantee='authenticated' and privilege_type='UPDATE'
  order by column_name`);
const updatable = rows.map((r) => r.column_name);
console.log("authenticated CAN update:", updatable.join(", ") || "(none)");
for (const s of ["role", "plan", "verify_status"]) {
  console.log(`  ${s} updatable by user? ${updatable.includes(s) ? "YES ✗ BAD" : "no ✓"}`);
}
await c.end();
