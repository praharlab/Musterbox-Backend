/**
 * Local-only fix for the "operations" master.
 *
 * The Angular app decides whether to show an Add button with:
 *
 *   permissioncreate = permission.filter(p =>
 *     p.formName == '<Form>' && p.operationName.includes('Create'));
 *
 * and the shared header renders the button only when that array is non-empty
 * (list-page-header.component.html: *ngIf="showadd.length != 0").
 *
 * 224 components in the frontend filter on 'Create'; none filter on 'Add'.
 * This local database was seeded with the operation named 'Add', so
 * permissioncreate is always [] and EVERY Add button in the app stays hidden
 * for role-based users. Renaming the row fixes all of them at once.
 *
 * operationID is unchanged, so productPermissions / rolePermissions rows that
 * reference it keep working.
 *
 * Run:  node scripts/fixOperationNames.js
 */
const sequelize = require('../config/database');

(async () => {
  try {
    const [before] = await sequelize.query(
      `SELECT "operationID","operationName" FROM "operations" ORDER BY 1`
    );
    console.log(
      'before:',
      before.map((r) => `${r.operationID}:${r.operationName}`).join(', ')
    );

    const [, meta] = await sequelize.query(
      `UPDATE "operations" SET "operationName"='Create', "updatedAt"=now() WHERE "operationName"='Add'`
    );
    console.log('rows renamed:', meta.rowCount);

    const [after] = await sequelize.query(
      `SELECT "operationID","operationName" FROM "operations" ORDER BY 1`
    );
    console.log(
      'after :',
      after.map((r) => `${r.operationID}:${r.operationName}`).join(', ')
    );

    const [linked] = await sequelize.query(
      `SELECT count(*)::int c FROM "rolePermissions" rp
       JOIN "operations" o ON o."operationID" = rp."operationID"
       WHERE o."operationName" = 'Create'`
    );
    console.log('rolePermissions granting Create:', linked[0].c);
  } catch (err) {
    console.error('Failed:', err.message);
    process.exit(1);
  }
  process.exit(0);
})();
