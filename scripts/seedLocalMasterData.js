/**
 * Local-only seed for the master rows that postAddCompany hard-codes.
 *
 * controllers/companymaster.controller.js inserts hrSalaryFields / hrLeaveTypes
 * with fixed payheadMasterId and LeaveID values. If those rows are missing from
 * "Payheadmasters" / "hrLeaveMasters", the FK fails, the transaction aborts and
 * the new company is silently rolled back.
 *
 * Names below are placeholders taken from the comments in that controller.
 * Replace them with a real dump from dev/production when you have one.
 *
 * Run:  node scripts/seedLocalMasterData.js
 */
const sequelize = require('../config/database');

// [id, name, side]  side: E = earning, D = deduction
const payheads = [
  [4, 'PF', 'D'],
  [5, 'EPF', 'D'],
  [12, 'EPS', 'D'],
  [13, 'ESI', 'D'],
  [14, 'Employer Side ESIC', 'D'],
  [15, 'PT', 'D'],
  [25, 'Admin Charges', 'D'],
  [66, 'EDLI', 'D'],
  [67, 'Leave Encashment', 'E'],
  [92, 'Net Salary', 'E'],
  [96, 'Payhead 96', 'D'],
  [97, 'Payhead 97', 'E'],
  [101, 'Bonus Pay', 'E'],
];

const leaves = [
  [25, 'Out Duty'],
  [28, 'Leave Type 28'],
  [29, 'Leave Type 29'],
  [30, 'Leave Type 30'],
  [31, 'Leave Type 31'],
  [32, 'Leave Type 32'],
];

// every id postAddCompany depends on, for the verification pass
const requiredPayheads = [
  1, 4, 5, 9, 12, 13, 14, 15, 16, 17, 24, 25, 34, 43, 50, 66, 67, 78, 83, 92,
  96, 97, 101,
];
const requiredLeaves = [1, 5, 6, 7, 9, 18, 20, 21, 22, 25, 28, 29, 30, 31, 32];

(async () => {
  const transaction = await sequelize.transaction();
  try {
    for (const [id, name, side] of payheads) {
      await sequelize.query(
        `INSERT INTO "Payheadmasters"
           ("payheadMasterId","payheadName","payheadDesc","status","createBy","createByIp","taxApplicability","createdAt","updatedAt")
         VALUES (:id, :name, :desc, 1, 1, '127.0.0.1', 'NA', now(), now())
         ON CONFLICT ("payheadMasterId") DO NOTHING`,
        {
          replacements: {
            id,
            name: `${name} (${side === 'E' ? 'Earning' : 'Deduction'})`,
            desc: 'Local placeholder - replace with real name from production',
          },
          transaction,
        }
      );
    }

    for (const [id, name] of leaves) {
      await sequelize.query(
        `INSERT INTO "hrLeaveMasters"
           ("LeaveID","LeaveName","LeaveDesc","status","createBy","createByIp","createdAt","updatedAt")
         VALUES (:id, :name, :desc, 1, 1, '127.0.0.1', now(), now())
         ON CONFLICT ("LeaveID") DO NOTHING`,
        {
          replacements: {
            id,
            name,
            desc: `${name} (local placeholder name - replace from production)`,
          },
          transaction,
        }
      );
    }

    // keep the serials ahead of the explicit ids inserted above
    await sequelize.query(
      `SELECT setval(pg_get_serial_sequence('"Payheadmasters"','payheadMasterId'), (SELECT max("payheadMasterId") FROM "Payheadmasters"))`,
      { transaction }
    );
    await sequelize.query(
      `SELECT setval(pg_get_serial_sequence('"hrLeaveMasters"','LeaveID'), (SELECT max("LeaveID") FROM "hrLeaveMasters"))`,
      { transaction }
    );

    await transaction.commit();
    console.log('Seed committed.');
  } catch (err) {
    await transaction.rollback();
    console.error('Seed failed, nothing was written:', err.message);
    process.exit(1);
  }

  const [payheadRows] = await sequelize.query(
    `SELECT "payheadMasterId" FROM "Payheadmasters"`
  );
  const havePayheads = payheadRows.map((row) => +row.payheadMasterId);
  const [leaveRows] = await sequelize.query(
    `SELECT "LeaveID" FROM "hrLeaveMasters"`
  );
  const haveLeaves = leaveRows.map((row) => +row.LeaveID);

  const missingPayheads = requiredPayheads.filter(
    (id) => !havePayheads.includes(id)
  );
  const missingLeaves = requiredLeaves.filter((id) => !haveLeaves.includes(id));

  console.log('Payhead ids still missing:', missingPayheads);
  console.log('Leave ids still missing:', missingLeaves);
  if (missingPayheads.length === 0 && missingLeaves.length === 0) {
    console.log('All ids postAddCompany needs are present.');
  }
  process.exit(0);
})();
