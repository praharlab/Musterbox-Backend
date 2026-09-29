/**
 * Removes the two sentimentPunchIns rows created while diagnosing the mood
 * tracker (ids 1 and 2, for userMasterId 2 and 1).
 *
 * The mood widget only renders when today's fetch returns zero rows
 * (chat-notification.component.ts -> getFeedbackData), so leaving test rows in
 * place hides the widget for those users for the rest of the day.
 *
 * Run:  node scripts/cleanupTestMoods.js
 */
const sequelize = require('../config/database');

(async () => {
  try {
    const [before] = await sequelize.query(
      `SELECT "id","mood","userMasterId","createdAt" FROM "sentimentPunchIns" ORDER BY "id"`
    );
    console.log('rows before:', JSON.stringify(before));

    const [, meta] = await sequelize.query(
      `DELETE FROM "sentimentPunchIns" WHERE "id" IN (1, 2)`
    );
    console.log('rows deleted:', meta.rowCount);

    const [after] = await sequelize.query(
      `SELECT count(*)::int c FROM "sentimentPunchIns"`
    );
    console.log('rows remaining:', after[0].c);
  } catch (err) {
    console.error('Failed:', err.message);
    process.exit(1);
  }
  process.exit(0);
})();
