/**
 * Installs the Postgres stored functions the app depends on.
 *
 * sequelize.sync() creates tables only — it does not create functions. A
 * database built that way has zero of them, and any request that reaches one
 * (e.g. SELECT * FROM ms_fun_leaves_name(8)) fails with
 *   error: function ms_fun_leaves_name(integer) does not exist
 *
 * This is the same work GET /function/v1/create performs
 * (controllers/functions.controller.js -> createFunctions), runnable without
 * the server being up — useful precisely when a missing function has crashed it.
 *
 * Run:  node scripts/createDbFunctions.js
 */
const sequelize = require('../config/database');
const { functions } = require('../controllers/functions.controller');

(async () => {
  console.log(`definitions found: ${functions.length}`);
  let created = 0;
  const failures = [];

  for (const fn of functions) {
    try {
      await sequelize.query(fn.definition);
      created++;
      console.log(`  ok    ${fn.name}`);
    } catch (err) {
      failures.push({ name: fn.name, message: err.message.split('\n')[0] });
      console.log(`  FAIL  ${fn.name} -> ${err.message.split('\n')[0]}`);
    }
  }

  const [rows] = await sequelize.query(
    `SELECT p.proname FROM pg_proc p
     JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public' ORDER BY 1`
  );

  console.log(`\nstatements applied : ${created}/${functions.length}`);
  console.log(`functions now in DB: ${rows.length}`);
  console.log(rows.map((r) => r.proname).join(', ') || '(none)');

  if (failures.length) {
    console.log(`\n${failures.length} definition(s) failed:`);
    for (const f of failures) console.log(`  ${f.name}: ${f.message}`);
  }
  process.exit(failures.length ? 1 : 0);
})();
