// One-off migration runner. Reads DATABASE_URL from env (never hardcode it).
// Usage: DATABASE_URL='postgresql://...' node scripts/migrate.mjs
import { readFileSync } from "node:fs";
import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Set DATABASE_URL env var.");
  process.exit(1);
}

const files = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ["supabase/migrations/0001_init.sql", "supabase/migrations/0002_storage.sql"];
const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });

async function applyFile(f) {
  const sql = readFileSync(f, "utf8");
  try {
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("COMMIT");
    console.log(`  ✓ applied ${f}`);
    return true;
  } catch (e) {
    await client.query("ROLLBACK");
    console.error(`  ✗ ${f}: ${e.message}`);
    return false;
  }
}

(async () => {
  await client.connect();
  console.log("connected.");
  for (const f of files) {
    const ok = await applyFile(f);
    // storage policies can hit an owner quirk on some projects — non-fatal
    if (!ok && !f.includes("storage")) {
      console.error("aborting.");
      await client.end();
      process.exit(1);
    }
  }

  const { rows } = await client.query(
    "select table_name from information_schema.tables where table_schema='public' order by table_name"
  );
  console.log(`\npublic tables (${rows.length}): ${rows.map((r) => r.table_name).join(", ")}`);

  const trig = await client.query("select 1 from pg_trigger where tgname='on_auth_user_created'");
  console.log(`handle_new_user trigger present: ${trig.rowCount === 1 ? "yes ✓" : "NO"}`);

  await client.end();
  console.log("\ndone.");
})().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
