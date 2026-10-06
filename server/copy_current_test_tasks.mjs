import pg from 'pg';
import dotenv from 'dotenv';
import { randomUUID } from 'node:crypto';
dotenv.config({ quiet: true });
const pool = new pg.Pool({ host: process.env.DB_HOST, user: process.env.DB_USER,
  password: process.env.DB_PASSWORD, database: process.env.DB_NAME, port: process.env.DB_PORT });
const client = await pool.connect();
const batch = 'current-test-tasks-2026-10-05';
try {
  await client.query('BEGIN');
  await client.query("SET LOCAL TIME ZONE 'America/Chicago'");
  const existing = await client.query("SELECT count(*) FROM tasks WHERE metadata->>'copyBatch' = $1", [batch]);
  if (Number(existing.rows[0].count)) throw new Error('This copy batch already exists; refusing duplicate copies.');
  const originals = await client.query("SELECT * FROM tasks WHERE COALESCE(due_date, created_at) < '2026-10-05'::timestamptz ORDER BY created_at, id FOR SHARE");
  let assignments = 0, steps = 0;
  for (const [index, task] of originals.rows.entries()) {
    const id = randomUUID();
    const dayOffset = index % 14;
    await client.query(`INSERT INTO tasks
      (id,title,project_id,organization_id,status,priority,due_date,description,metadata,created_at,updated_at,created_by,completed_at)
      VALUES ($1,$2,$3,$4,$5,$6,'2026-10-05 12:00:00 America/Chicago'::timestamptz + $7 * interval '1 day',$8,$9,now(),now(),$10,
        CASE WHEN $5::varchar = 'done' THEN '2026-10-05 12:00:00 America/Chicago'::timestamptz + $7 * interval '1 day' ELSE NULL END)`,
      [id,task.title,task.project_id,task.organization_id,task.status,task.priority,dayOffset,task.description,
        JSON.stringify({...task.metadata,copyBatch:batch,copiedFromTaskId:task.id}),task.created_by]);
    const collaborators = await client.query(`INSERT INTO task_collaborators (task_id,user_id,access_level,invited_at,joined_at)
      SELECT $1,user_id,access_level,now(),CASE WHEN joined_at IS NULL THEN NULL ELSE now() END
      FROM task_collaborators WHERE task_id=$2`, [id,task.id]);
    assignments += collaborators.rowCount;
    const copiedSteps = await client.query(`INSERT INTO task_steps (task_id,title,is_completed,order_index,created_at)
      SELECT $1,title,is_completed,order_index,now() FROM task_steps WHERE task_id=$2`, [id,task.id]);
    steps += copiedSteps.rowCount;
  }
  const verification = await client.query(`SELECT count(*) AS copies,min(due_date) AS first_date,max(due_date) AS last_date
    FROM tasks t WHERE metadata->>'copyBatch'=$1`, [batch]);
  if (Number(verification.rows[0].copies) !== originals.rowCount) throw new Error('Copy verification failed');
  await client.query('COMMIT');
  console.log(JSON.stringify({ ...verification.rows[0], preservedAssignments: assignments, copiedSteps:steps }));
} catch (error) {
  await client.query('ROLLBACK');
  console.error(error.message);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
