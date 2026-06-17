// Creates a confirmed admin user via the Auth admin API (proving the
// handle_new_user trigger), then seeds a realistic week of real rows.
// Env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL,
//      SEED_EMAIL, SEED_PASSWORD
import pg from "pg";

const SUPA = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SVC = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DB = process.env.DATABASE_URL;
const email = process.env.SEED_EMAIL;
const password = process.env.SEED_PASSWORD;

async function createUser() {
  const res = await fetch(`${SUPA}/auth/v1/admin/users`, {
    method: "POST",
    headers: { "content-type": "application/json", apikey: SVC, authorization: `Bearer ${SVC}` },
    body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { full_name: "Orlando" } }),
  });
  const j = await res.json();
  if (res.ok && j.id) return { id: j.id, created: true };
  console.log("  (create returned", res.status, "-", JSON.stringify(j).slice(0, 120), ")");
  return { id: null, created: false };
}

// [title, pillar, type, minutes, time, done, weekdayOffset]  (offset 0 = Monday)
const ITEMS = [
  ["Algorithmique", "academics", "class", 120, "09:00", true, 0],
  ["Statistiques", "academics", "class", 90, "11:00", true, 1],
  ["Révisions algèbre", "academics", "study", 90, "17:00", true, 0],
  ["TP réseau", "academics", "study", 120, "14:00", true, 2],
  ["Bases de données", "academics", "class", 120, "09:00", true, 2],
  ["Partiel de Statistiques", "academics", "exam", 120, "10:00", false, 4],
  ["Rendre le rapport projet", "academics", "task", 45, null, false, 3],
  ["Méditation", "health", "event", 20, "08:00", true, 0],
  ["Sommeil réparateur", "health", "event", 60, "23:00", true, 0],
  ["Yoga doux", "health", "event", 40, "07:30", true, 1],
  ["Marche nature", "health", "event", 45, "12:00", true, 2],
  ["Repas équilibré", "health", "task", 45, null, true, 2],
  ["Shift café", "work", "work", 240, "18:00", true, 1],
  ["Shift café", "work", "work", 240, "18:00", false, 4],
  ["Course à pied", "sports", "task", 45, "07:00", true, 0],
  ["Séance muscu", "sports", "task", 60, "19:00", true, 2],
  ["Match de foot", "sports", "task", 90, "16:00", false, 5],
  ["Déjeuner avec Léa", "relationships", "event", 90, "12:30", true, 1],
  ["Appel famille", "relationships", "event", 30, "20:00", false, 2],
  ["Soirée jeux", "relationships", "event", 120, "20:00", false, 4],
  ["Lecture (1 chapitre)", "growth", "study", 40, "21:00", true, 0],
  ["Cours en ligne", "growth", "study", 60, null, true, 2],
  ["Projet perso", "growth", "task", 60, null, false, 3],
];
const COURSES = [
  ["Algorithmique", 6, "A-"],
  ["Statistiques", 5, "B+"],
  ["Bases de données", 4, "A"],
  ["Anglais", 3, "B"],
];

const client = new pg.Client({ connectionString: DB, ssl: { rejectUnauthorized: false } });

(async () => {
  const { id: created } = await createUser();
  await client.connect();
  let id = created;
  if (!id) {
    const r = await client.query("select id from auth.users where email=$1", [email]);
    id = r.rows[0]?.id;
  }
  if (!id) throw new Error("could not resolve user id");
  console.log("  user id:", id);

  const prof = await client.query("select id, plan, onboarded from public.profiles where id=$1", [id]);
  console.log("  profile auto-created by trigger:", prof.rowCount === 1 ? "yes ✓" : "NO ✗");

  await client.query(
    `update public.profiles set full_name='Orlando', role='admin', onboarded=true,
       verify_status='verified', priorities=array['academics','health','relationships']::pillar[]
     where id=$1`,
    [id]
  );

  await client.query("delete from public.items where user_id=$1", [id]);
  for (const [title, pillar, type, dur, time, done, off] of ITEMS) {
    await client.query(
      `insert into public.items (user_id,title,pillar,type,duration_min,start_time,done,date)
       values ($1,$2,$3,$4,$5,$6,$7,(date_trunc('week', current_date)::date + ($8)::int))`,
      [id, title, pillar, type, dur, time, done, off]
    );
  }
  // streak anchor (today) + history (prior days), small studies marked done
  await client.query(
    `insert into public.items (user_id,title,pillar,type,duration_min,done,date)
     values ($1,'Révision du jour','academics','study',30,true,current_date)`,
    [id]
  );
  for (let d = 1; d <= 6; d++) {
    await client.query(
      `insert into public.items (user_id,title,pillar,type,duration_min,done,date)
       values ($1,'Révision',$2,'study',30,true,current_date - ($3)::int)`,
      [id, d % 2 ? "academics" : "growth", d]
    );
  }

  await client.query("delete from public.courses where user_id=$1", [id]);
  for (const [name, credits, grade] of COURSES) {
    await client.query("insert into public.courses (user_id,name,credits,grade) values ($1,$2,$3,$4)", [id, name, credits, grade]);
  }

  const n = await client.query("select count(*)::int n from public.items where user_id=$1", [id]);
  const t = await client.query("select * from public.pillar_targets where user_id=$1", [id]);
  console.log("  items seeded:", n.rows[0].n, "| targets row:", t.rowCount === 1 ? "yes ✓" : "NO");
  await client.end();
  console.log("seed done.");
})().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
