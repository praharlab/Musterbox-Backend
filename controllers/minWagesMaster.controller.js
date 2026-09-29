const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const message = require('../response_message/message');
const MinWagesMaster = require('../models/minWagesMaster');
const StateMaster = require('../models/statemaster');
const companyMaster = require('../models/companyMaster');
const {
  month_dict,
  getYearMonthByRange,
  assignSalaryStructure,
  chunkArray,
  getNextMonth,
  getPreviousMonth,
} = require('../utils/commonUtilFunctions');
const { generateExcel } = require('../utils/exportData');
const HrSalaryMaster = require('../models/hrSalaryMaster');
const GradeSalaryStructure = require('../models/gradeSalaryStructure');
const UserMaster = require('../models/userMaster');
const GradeStructure = require('../models/gradeStructure');
const HRSalaryFields = require('../models/hrSalaryFields');
const Payheadmaster = require('../models/payhead');
const HRSalaryTrasaction = require('../models/hrSalaryTransaction');
const ProfessionalTaxSlabMaster = require('../models/professionaltaxmaster');

exports.addData = async (req, res, next) => {
  try {
    const {
      companyMasterId,
      stateMasterId,
      applicableYYYYMM,
      skilled,
      semiSkilled,
      unSkilled,
    } = req.body;

    const now = new Date();
    const previousYYYYMM = `${now.getFullYear()}${now.getMonth().toString().padStart(2, '0')}`;
    const futureYYYYMM = `${now.getFullYear()}${(now.getMonth() + 2).toString().padStart(2, '0')}`;

    const createBy = req.userDetails.userMasterId;
    const createByIp = req.userDetails.userIpAddress;

    if (!stateMasterId || !applicableYYYYMM || !companyMasterId)
      return res.status(200).json({
        status: 401,
        message: message.usermessage.ValidParameters,
      });

    if (
      (skilled !== '' && +skilled < 0) ||
      (semiSkilled !== '' && +semiSkilled < 0) ||
      (unSkilled !== '' && +unSkilled < 0)
    ) {
      return res.status(200).json({
        status: 401,
        message: 'Please enter positive value!',
      });
    }

    // find all min wages master data
    const allMinWagesMaster = await MinWagesMaster.findAll({
      where: {
        companyMasterId,
        stateMasterId,
      },
      order: [['applicableYYYYMM', 'DESC']],
    });

    const alreadyExist = allMinWagesMaster.find(
      (e) => e.applicableYYYYMM == applicableYYYYMM
    );

    // if already exist on same applicableYYYYMM
    if (alreadyExist)
      return res.status(200).json({
        status: 401,
        message: message.usermessage.alreadyExists('Minimum Wages Master'),
      });

    const lastAddedData = allMinWagesMaster[0] || null;

    // if applicableYYYYMM is less than to last entered YYYYMM
    if (lastAddedData && lastAddedData.applicableYYYYMM > +applicableYYYYMM)
      return res.status(200).json({
        status: 401,
        message: `The applicable YYYYMM must be later than to the last entered YYYYMM '(${lastAddedData.applicableYYYYMM})'.`,
      });

    // check applicableYYYYMM is between previousYYYYMM and futureYYYYMM
    if (
      allMinWagesMaster.length &&
      (+previousYYYYMM > +applicableYYYYMM || +futureYYYYMM < +applicableYYYYMM)
    ) {
      return res.status(200).json({
        status: 401,
        message: `Applicable month (${applicableYYYYMM}) must be between ${previousYYYYMM} and ${futureYYYYMM}.`,
      });
    }

    // find Salary Data
    const hrsalaryMasterData = await HrSalaryMaster.findAll({
      raw: true,
      where: {
        stateid: stateMasterId,
        skillCategory: {
          [Sequelize.Op.ne]: null,
        },

        [Sequelize.Op.or]: [
          {
            [Sequelize.Op.and]: Sequelize.literal(`
           ("hrSalaryMaster"."userMasterID", "hrSalaryMaster"."salaryFromYYYYMM") IN (
                    SELECT "userMasterID", MAX("salaryFromYYYYMM") AS "maxMonth"
                      FROM "hrSalaryMasters"
                      WHERE "salaryFromYYYYMM" <= ${applicableYYYYMM}
                      AND "userMasterID" IN (SELECT "userMasterID" from "userMasters" WHERE "companyMasterId"=${companyMasterId} and status=1)
                       and stateid = ${stateMasterId} and "skillCategory" IS NOT NULL 
                      GROUP BY "userMasterID"
        )
                  `),
          },
          {
            [Sequelize.Op.and]: Sequelize.literal(`
           ("hrSalaryMaster"."userMasterID", "hrSalaryMaster"."salaryFromYYYYMM") IN (
                    SELECT "userMasterID", "salaryFromYYYYMM"
                      FROM "hrSalaryMasters"
                      WHERE "salaryFromYYYYMM" > ${applicableYYYYMM}
                      AND "userMasterID" IN (SELECT "userMasterID" from "userMasters" WHERE "companyMasterId"=${companyMasterId} and status=1)
                       and stateid = ${stateMasterId} and "skillCategory" IS NOT NULL 
                      GROUP BY "userMasterID","salaryFromYYYYMM"
        )
                  `),
          },
        ],
      },
      include: [
        {
          required: true,
          model: UserMaster,
          where: {
            companyMasterId,
            status: 1,
          },
          attributes: [],
        },
        {
          model: GradeSalaryStructure,
          as: 'GSS',
          attributes: [],
          include: [
            { model: GradeStructure, attributes: [] },
            {
              model: HRSalaryFields,
              as: 'HSF',
              include: [
                {
                  model: Payheadmaster,
                  as: 'PHM',
                  attributes: [],
                },
              ],
              attributes: [],
            },
          ],
        },
      ],
      attributes: [
        'salaryMasterID',
        'userMasterID',
        'salaryFromYYYYMM',
        'EmployeeSalaryAmount',
        'ActualEmployeeSalaryAmount',
        'gradeSalaryStructureID',
        'stateid',
        'AmountIn',
        'skillCategory',
        'corporationId',
        [sequelize.col('userMaster.displayName'), 'displayName'],
        [sequelize.col('userMaster.gender'), 'gender'],
        [sequelize.col('GSS.gradeStructureID'), 'gradeStructureID'],
        [sequelize.col('GSS.salaryFieldID'), 'salaryFieldID'],
        [sequelize.col('GSS.fieldFixAmount'), 'fieldFixAmount'],
        [sequelize.col('GSS.formula'), 'formula'],
        [sequelize.col('GSS.salaryfieldindex'), 'salaryfieldindex'],
        [sequelize.col('GSS.salaryfieldmaxrange'), 'salaryfieldmaxrange'],
        [sequelize.col('GSS.fieldFixAmount1'), 'fieldFixAmount1'],
        [sequelize.col('GSS.formula1'), 'formula1'],
        [sequelize.col('GSS.formulaPreference'), 'formulaPreference'],
        [sequelize.col('GSS.HSF.payheadMasterId'), 'payheadMasterId'],
        [sequelize.col('GSS.HSF.salaryFieldSide'), 'salaryFieldSide'],
        [sequelize.col('GSS.HSF.salaryFieldAttanChk'), 'salaryFieldAttanChk'],
        [sequelize.col('GSS.HSF.salaryFieldWhenMonth'), 'salaryFieldWhenMonth'],
        [sequelize.col('GSS.HSF.salaryFieldRound'), 'salaryFieldRound'],
        [sequelize.col('GSS.HSF.salaryFieldRoundNo'), 'salaryFieldRoundNo'],
        [sequelize.col('GSS.HSF.salaryFieldSrNo'), 'salaryFieldSrNo'],
        [sequelize.col('GSS.HSF.companyMasterID'), 'companyMasterID'],
        [sequelize.col('GSS.HSF.payheadDisplayName'), 'payheadDisplayName'],
        [sequelize.col('GSS.HSF.roundOffType'), 'roundOffType'],
        [sequelize.col('GSS.HSF.considerIn'), 'considerIn'],
        [sequelize.col('GSS.HSF.PHM.payheadName'), 'payheadName'],
        [
          sequelize.col('GSS.gradeStructure.baseOnCalculation'),
          'baseOnCalculation',
        ],
      ],
      order: [
        [
          { model: GradeSalaryStructure, as: 'GSS' },
          { model: HRSalaryFields, as: 'HSF' },
          'salaryFieldSrNo',
          'ASC',
        ],

        [{ model: GradeSalaryStructure, as: 'GSS' }, 'salaryfieldindex', 'ASC'],

        // Order by payheadName in Payheadmaster
        [
          { model: GradeSalaryStructure, as: 'GSS' },
          { model: HRSalaryFields, as: 'HSF' },
          { model: Payheadmaster, as: 'PHM' },
          'payheadName',
          'ASC',
        ],
      ],
    });

    // all userIds

    const grouped = {};

    for (const item of hrsalaryMasterData) {
      const key = `${item.userMasterID}_${item.salaryFromYYYYMM}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(item);
    }

    const allUserIdsData = Object.entries(grouped).map(([key, items]) => ({
      userMasterID: items[0].userMasterID,
      salaryFromYYYYMM: items[0].salaryFromYYYYMM,
      records: items,
    }));

    const beforeFutureMonthUserIds = [
      ...new Set(
        allUserIdsData
          .filter((e) => +e.salaryFromYYYYMM <= +futureYYYYMM)
          .map((a) => a.userMasterID)
      ),
    ];

    // ----------------------------find if salary calculated -----------------------------

    let startMonth = applicableYYYYMM,
      endMonth = applicableYYYYMM;

    if (+applicableYYYYMM < +futureYYYYMM) {
      endMonth = futureYYYYMM;
    }

    const YYYYMMArray = await getYearMonthByRange(startMonth, endMonth);

    const salary = await HRSalaryTrasaction.findOne({
      where: {
        userMasterID: {
          [Sequelize.Op.in]: beforeFutureMonthUserIds,
        },
        salaryYYYYMM: {
          [Sequelize.Op.in]: YYYYMMArray,
        },
      },
      include: [
        {
          model: UserMaster,
          attributes: ['displayName'],
        },
      ],
    });

    if (salary)
      return res.status(200).json({
        status: 401,
        message: `Salary for '${salary.userMaster?.displayName}' has already been calculated for '${salary.salaryYYYYMM}'.`,
      });

    // find all PT data
    const ptSlabData = await ProfessionalTaxSlabMaster.findAll({
      where: {
        stateMasterID: +stateMasterId,
        status: 1,
      },
    });

    // start transaction

    await sequelize.transaction(async (t) => {
      const minWagesMasterData = await MinWagesMaster.create(
        {
          companyMasterId,
          stateMasterId,
          applicableYYYYMM,
          skilled: skilled == '' ? null : skilled,
          semiSkilled: semiSkilled == '' ? null : semiSkilled,
          unSkilled: unSkilled == '' ? null : unSkilled,
        },
        {
          user: req.userDetails,
          transaction: t,
        }
      );

      const ToDeleteDataQueryArray = [];
      const ToAddArray = [];

      for (const user of allUserIdsData) {
        const userMasterID = user.userMasterID;
        const salaryFromYYYYMM = user.salaryFromYYYYMM;

        const structureData = user.records || [];

        const AmountIn = structureData[0].AmountIn;

        const payheadId = AmountIn == 0 ? 1 : 50;

        const ctcAmount =
          structureData.find((e) => e.payheadMasterId == payheadId)
            ?.EmployeeSalaryAmount || 0;
        const gender = structureData?.[0]?.gender || null;
        const skillCategory = structureData?.[0]?.skillCategory || null;
        const corporationId = structureData?.[0]?.corporationId || null;

        const forCalculateYYYYMM =
          +salaryFromYYYYMM > applicableYYYYMM
            ? salaryFromYYYYMM
            : applicableYYYYMM;

        const { salaryStructureData, minWagesMasterId } =
          await assignSalaryStructure(
            structureData,
            ctcAmount,
            stateMasterId,
            AmountIn,
            forCalculateYYYYMM,
            gender,
            corporationId,
            companyMasterId,
            skillCategory,
            null,
            0,
            true,
            ptSlabData,
            minWagesMasterData
          );

        if (+salaryFromYYYYMM >= applicableYYYYMM) {
          ToDeleteDataQueryArray.push(
            HrSalaryMaster.destroy({
              where: {
                userMasterID,
                salaryFromYYYYMM,
              },
              transaction: t,
            })
          );
        }

        // push user data

        salaryStructureData.forEach((e) => {
          ToAddArray.push({
            userMasterID,
            gradeSalaryStructureID: e.gradeSalaryStructureID,
            EmployeeSalaryAmount: e.finalvalue,
            salaryFromYYYYMM: forCalculateYYYYMM,
            stateid: stateMasterId,
            AmountIn: AmountIn,
            ActualEmployeeSalaryAmount: e.actualvalue,
            skillCategory: skillCategory,
            corporationId: corporationId,
            minWagesMasterId: minWagesMasterId,
            createBy,
            createByIp,
          });
        });
      }

      // Delete in 500 chunks
      const deleteChunks = chunkArray(ToDeleteDataQueryArray, 500);
      for (const chunk of deleteChunks) {
        await Promise.all(chunk);
      }

      // Insert in 5000 chunks
      const insertChunks = chunkArray(ToAddArray, 5000);
      for (const chunk of insertChunks) {
        await HrSalaryMaster.bulkCreate(chunk, { transaction: t });
      }
    });

    return res.status(200).json({
      status: 200,
      message: message.usermessage.addMessage('Minimum Wages Master'),
    });
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const data = await MinWagesMaster.findByPk(id, {
      include: [
        { model: StateMaster, attributes: ['stateName'] },
        { model: companyMaster, attributes: ['companyName'] },
      ],
    });

    return res.status(200).json({
      status: 200,
      data,
    });
  } catch (err) {
    next(err);
  }
};

exports.updateData = async (req, res, next) => {
  try {
    const { skilled, semiSkilled, unSkilled } = req.body;

    const { id } = req.params;

    const createBy = req.userDetails.userMasterId;
    const createByIp = req.userDetails.userIpAddress;

    if (
      (skilled !== '' && +skilled < 0) ||
      (semiSkilled !== '' && +semiSkilled < 0) ||
      (unSkilled !== '' && +unSkilled < 0)
    ) {
      return res.status(200).json({
        status: 401,
        message: 'Please enter positive value!',
      });
    }

    const data = await MinWagesMaster.findByPk(id);

    if (!data)
      return res.status(200).json({
        status: 401,
        message: message.usermessage.notFoundMessage('Minimum Wages Master'),
      });

    const companyMasterId = data.companyMasterId;
    const stateMasterId = data.stateMasterId;
    const applicableYYYYMM = data.applicableYYYYMM;

    // find all min wages master data
    const allMinWagesMaster = await MinWagesMaster.findAll({
      where: {
        companyMasterId,
        stateMasterId,
        id: {
          [Sequelize.Op.ne]: id,
        },
      },
      order: [['applicableYYYYMM', 'ASC']],
    });

    const alreadyExist = allMinWagesMaster.find(
      (e) => e.applicableYYYYMM == applicableYYYYMM
    );

    if (alreadyExist)
      return res.status(200).json({
        status: 401,
        message: message.usermessage.alreadyExists('Minimum Wages Master'),
      });

    // find Salary Data
    const hrsalaryMasterData = await HrSalaryMaster.findAll({
      raw: true,
      where: {
        [Sequelize.Op.or]: [
          {
            minWagesMasterId: id,
          },
          {
            [Sequelize.Op.and]: Sequelize.literal(`
           ("hrSalaryMaster"."userMasterID", "hrSalaryMaster"."salaryFromYYYYMM") IN (
                    SELECT "userMasterID", MAX("salaryFromYYYYMM") AS "maxMonth"
                      FROM "hrSalaryMasters"
                      WHERE "salaryFromYYYYMM" <= ${applicableYYYYMM}
                      AND "userMasterID" IN (SELECT "userMasterID" from "userMasters" WHERE "companyMasterId"=${companyMasterId} and status=1)
                       and stateid = ${stateMasterId} and "skillCategory" IS NOT NULL 
                      GROUP BY "userMasterID"
        )
                  `),
          },
        ],
      },
      include: [
        {
          required: true,
          model: UserMaster,
          where: {
            companyMasterId,
            status: 1,
          },
          attributes: [],
        },
        {
          model: GradeSalaryStructure,
          as: 'GSS',
          attributes: [],
          include: [
            { model: GradeStructure, attributes: [] },
            {
              model: HRSalaryFields,
              as: 'HSF',
              include: [
                {
                  model: Payheadmaster,
                  as: 'PHM',
                  attributes: [],
                },
              ],
              attributes: [],
            },
          ],
        },
      ],
      attributes: [
        'salaryMasterID',
        'userMasterID',
        'salaryFromYYYYMM',
        'EmployeeSalaryAmount',
        'ActualEmployeeSalaryAmount',
        'gradeSalaryStructureID',
        'stateid',
        'AmountIn',
        'skillCategory',
        'corporationId',
        [sequelize.col('userMaster.displayName'), 'displayName'],
        [sequelize.col('userMaster.gender'), 'gender'],
        [sequelize.col('GSS.gradeStructureID'), 'gradeStructureID'],
        [sequelize.col('GSS.salaryFieldID'), 'salaryFieldID'],
        [sequelize.col('GSS.fieldFixAmount'), 'fieldFixAmount'],
        [sequelize.col('GSS.formula'), 'formula'],
        [sequelize.col('GSS.salaryfieldindex'), 'salaryfieldindex'],
        [sequelize.col('GSS.salaryfieldmaxrange'), 'salaryfieldmaxrange'],
        [sequelize.col('GSS.fieldFixAmount1'), 'fieldFixAmount1'],
        [sequelize.col('GSS.formula1'), 'formula1'],
        [sequelize.col('GSS.formulaPreference'), 'formulaPreference'],
        [sequelize.col('GSS.HSF.payheadMasterId'), 'payheadMasterId'],
        [sequelize.col('GSS.HSF.salaryFieldSide'), 'salaryFieldSide'],
        [sequelize.col('GSS.HSF.salaryFieldAttanChk'), 'salaryFieldAttanChk'],
        [sequelize.col('GSS.HSF.salaryFieldWhenMonth'), 'salaryFieldWhenMonth'],
        [sequelize.col('GSS.HSF.salaryFieldRound'), 'salaryFieldRound'],
        [sequelize.col('GSS.HSF.salaryFieldRoundNo'), 'salaryFieldRoundNo'],
        [sequelize.col('GSS.HSF.salaryFieldSrNo'), 'salaryFieldSrNo'],
        [sequelize.col('GSS.HSF.companyMasterID'), 'companyMasterID'],
        [sequelize.col('GSS.HSF.payheadDisplayName'), 'payheadDisplayName'],
        [sequelize.col('GSS.HSF.roundOffType'), 'roundOffType'],
        [sequelize.col('GSS.HSF.considerIn'), 'considerIn'],
        [sequelize.col('GSS.HSF.PHM.payheadName'), 'payheadName'],
        [
          sequelize.col('GSS.gradeStructure.baseOnCalculation'),
          'baseOnCalculation',
        ],
      ],
      order: [
        [
          { model: GradeSalaryStructure, as: 'GSS' },
          { model: HRSalaryFields, as: 'HSF' },
          'salaryFieldSrNo',
          'ASC',
        ],

        [{ model: GradeSalaryStructure, as: 'GSS' }, 'salaryfieldindex', 'ASC'],

        // Order by payheadName in Payheadmaster
        [
          { model: GradeSalaryStructure, as: 'GSS' },
          { model: HRSalaryFields, as: 'HSF' },
          { model: Payheadmaster, as: 'PHM' },
          'payheadName',
          'ASC',
        ],
      ],
    });

    // all userIds

    const grouped = {};

    for (const item of hrsalaryMasterData) {
      const key = `${item.userMasterID}_${item.salaryFromYYYYMM}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(item);
    }

    const allUserIdsData = Object.entries(grouped).map(([key, items]) => ({
      userMasterID: items[0].userMasterID,
      salaryFromYYYYMM: items[0].salaryFromYYYYMM,
      records: items,
    }));

    const nextMinWagesMaster =
      allMinWagesMaster.find((e) => e.applicableYYYYMM > applicableYYYYMM) ||
      null;

    const userMasterIds = [
      ...new Set(allUserIdsData.map((e) => e.userMasterID)),
    ];

    const salaryCondition = {
      userMasterID: {
        [Sequelize.Op.in]: userMasterIds,
      },
    };

    // set condition for deleting salary master data

    const afterAppYYYYMMUserIds = allUserIdsData.filter(e=>+e.salaryFromYYYYMM >= +applicableYYYYMM).map(u=>u.userMasterID);

    const salaryMasterCondition = {};

    // if next min wages is exist
    if (nextMinWagesMaster) {
      const endMonth = getPreviousMonth(nextMinWagesMaster.applicableYYYYMM);
      salaryCondition.salaryYYYYMM = {
        [Sequelize.Op.between]: [applicableYYYYMM, endMonth],
      };

      salaryMasterCondition.salaryFromYYYYMM = {
        [Sequelize.Op.between]: [applicableYYYYMM, endMonth],
      };
    } else {
      salaryCondition.salaryYYYYMM = {
        [Sequelize.Op.gte]: applicableYYYYMM,
      };

      salaryMasterCondition.salaryFromYYYYMM = {
        [Sequelize.Op.gte]: applicableYYYYMM,
      };
    }

    const salary = await HRSalaryTrasaction.findOne({
      where: salaryCondition,
      include: [
        {
          model: UserMaster,
          attributes: ['displayName'],
        },
      ],
    });

    // if salary exist

    if (salary)
      return res.status(200).json({
        status: 401,
        message: `Salary for '${salary.userMaster?.displayName}' has already been calculated for '${salary.salaryYYYYMM}'.`,
      });

    // find all PT data
    const ptSlabData = await ProfessionalTaxSlabMaster.findAll({
      where: {
        stateMasterID: +stateMasterId,
        status: 1,
      },
    });

    // start transaction

    await sequelize.transaction(async (t) => {
      data.skilled = skilled == '' ? null : skilled;
      data.semiSkilled = semiSkilled == '' ? null : semiSkilled;
      data.unSkilled = unSkilled == '' ? null : unSkilled;

      await data.save({ user: req.userDetails, transaction: t });

      const ToAddArray = [];

      for (const user of allUserIdsData) {
        const userMasterID = user.userMasterID;
        const salaryFromYYYYMM = user.salaryFromYYYYMM >= applicableYYYYMM ? user.salaryFromYYYYMM:applicableYYYYMM;

        const structureData = user.records || [];

        const AmountIn = structureData[0].AmountIn;

        const payheadId = AmountIn == 0 ? 1 : 50;

        const ctcAmount =
          structureData.find((e) => e.payheadMasterId == payheadId)
            ?.EmployeeSalaryAmount || 0;
        const gender = structureData?.[0]?.gender || null;
        const skillCategory = structureData?.[0]?.skillCategory || null;
        const corporationId = structureData?.[0]?.corporationId || null;

        const { salaryStructureData, minWagesMasterId } =
          await assignSalaryStructure(
            structureData,
            ctcAmount,
            stateMasterId,
            AmountIn,
            salaryFromYYYYMM,
            gender,
            corporationId,
            companyMasterId,
            skillCategory,
            null,
            0,
            true,
            ptSlabData,
            data
          );

        // push user data

        salaryStructureData.forEach((e) => {
          ToAddArray.push({
            userMasterID,
            gradeSalaryStructureID: e.gradeSalaryStructureID,
            EmployeeSalaryAmount: e.finalvalue,
            salaryFromYYYYMM: salaryFromYYYYMM,
            stateid: stateMasterId,
            AmountIn: AmountIn,
            ActualEmployeeSalaryAmount: e.actualvalue,
            skillCategory: skillCategory,
            corporationId: corporationId,
            minWagesMasterId: minWagesMasterId,
            createBy,
            createByIp,
          });
        });
      }

      // Delete in 500 chunks
      const deleteChunks = chunkArray(afterAppYYYYMMUserIds, 500);
      for (const chunk of deleteChunks) {
        await HrSalaryMaster.destroy({
          where: {
            userMasterID: {
              [Sequelize.Op.in]: chunk,
            },
            ...salaryMasterCondition,
          },
          transaction: t,
        });
      }

      // Insert in 5000 chunks
      const insertChunks = chunkArray(ToAddArray, 5000);
      for (const chunk of insertChunks) {
        await HrSalaryMaster.bulkCreate(chunk, { transaction: t });
      }
    });

    return res.status(200).json({
      status: 200,
      message: message.usermessage.updateMessage('Minimum Wages Master'),
    });
  } catch (err) {
    next(err);
  }
};

exports.delete = async (req, res, next) => {
  try {
    const { id } = req.params;

    const data = await MinWagesMaster.findByPk(id);

    if (!data)
      return res.status(200).json({
        status: 401,
        message: message.usermessage.notFoundMessage('Minimum Wages Master'),
      });

    await data.destroy({ user: req.userDetails });

    return res.status(200).json({
      status: 200,
      message: message.usermessage.deleteMessage('Minimum Wages Master'),
    });
  } catch (err) {
    next(err);
  }
};

exports.list = async (req, res, next) => {
  try {
    const { page, limit, companyMasterId, stateMasterId, Export } = req.body;

    if (!companyMasterId)
      return res.status(200).json({
        status: 401,
        message: message.usermessage.ValidParameters,
      });

    const paginateCondition =
      page && limit && !Export ? { offset: (page - 1) * limit, limit } : {};

    const condition = { companyMasterId };

    if (stateMasterId) condition.stateMasterId = stateMasterId;

    const { rows: data, count } = await MinWagesMaster.findAndCountAll({
      where: condition,
      ...paginateCondition,
      include: [
        { model: StateMaster, attributes: ['stateName'] },
        { model: companyMaster, attributes: ['companyName'] },
      ],
    });

    if (Export) {
      const finalData = data.map((e) => {
        return {
          'Company Name': e.companyMaster?.companyName || '',
          'State Name': e.stateMaster?.stateName || '',
          'Applicable From':
            month_dict[`${String(e.applicableYYYYMM).slice(4, 6)}`] +
            '-' +
            `${String(e.applicableYYYYMM).slice(0, 4)}`,
          Skilled: e.skilled,
          'Semi-Skilled': e.semiSkilled,
          'Un-Skilled': e.unSkilled,
        };
      });

      return await generateExcel(
        finalData,
        'Minimum Wages Master',
        'xlsx',
        res
      );
    }

    return res.status(200).json({
      status: 200,
      data,
      totalcount: count,
    });
  } catch (error) {
    next(error);
  }
};
