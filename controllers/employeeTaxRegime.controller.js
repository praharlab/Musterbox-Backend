const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const UserMaster = require('../models/userMaster');
const EmployeeTaxRegime = require('../models/employeeTaxRegime');
const {
  getAllUserByCompany,
  getAllUserByCompanyDateWise,
  getAllUserByBranchDateWise,
  asiaKolkataDateTime,
} = require('../utils/commonUtilFunctions');
const { Op } = require('sequelize');
const { generateExcel } = require('../utils/exportData');
const companyMaster = require('../models/companyMaster');
const EmployeeJoiningDetails = require('../models/employeeJoiningDetails');
const { accessibleUsers } = require('../utils/commonUtilFunctions');
const EmployeeBranch = require('../models/employeeBranch');
const EmployeeDesignation = require('../models/employeeDesignation');
const Designation = require('../models/designation');
const EmployeeDepartment = require('../models/employeeDepartment');
const Department = require('../models/department');
const BranchMaster = require('../models/branchMaster');

exports.postAddData = async (req, res, next) => {
  try {
    const { userMasterID, financialYear, regime, createBy, createByIp } =
      req.body;

    const data = [];

    for (const e of userMasterID) {
      const regimedata = await EmployeeTaxRegime.findOne({
        where: {
          userMasterID: e,
          financialYear: financialYear,
        },
      });

      if (regimedata && +userMasterID.length === 1)
        return res.status(200).json({
          status: 401,
          message: 'Income Tax Regime Already Added!',
        });

      if (regimedata) continue;

      data.push({
        userMasterID: e,
        financialYear: financialYear,
        regime: regime,
        createBy: req.userDetails.userMasterId || createBy,
        createByIp: createByIp,
      });
    }

    await sequelize.transaction(async (t) => {
      await EmployeeTaxRegime.bulkCreate(data, { transaction: t });
    });

    return res.status(200).json({
      status: 200,
      message: 'Employee Tax Regime Added Successfully.',
    });
  } catch (error) {
    next(error);
  }
};

exports.updatedata = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { regime, updateBy, updateByIp } = req.body;

    await sequelize.transaction(async (t) => {
      await EmployeeTaxRegime.update(
        {
          regime,
          updateBy,
          updateByIp,
        },
        {
          where: {
            employeeTaxRegimeID: id,
          },
          transaction: t,
        }
      );
    });

    return res.status(200).json({
      status: 200,
      message: 'Employee Tax Regime updated successfully.',
    });
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const regimedata = await EmployeeTaxRegime.findOne({
      raw: true,
      where: {
        employeeTaxRegimeID: id,
      },
      include: [
        {
          model: UserMaster,
          include: [{ model: companyMaster, attributes: ['companyName'] }],
        },
      ],
    });

    return res.status(200).json({
      status: 200,
      data: regimedata,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const regimedata = await EmployeeTaxRegime.findOne({
      where: {
        employeeTaxRegimeID: id,
      },
    });

    if (!regimedata)
      return res.status(200).json({
        status: 401,
        message: 'Employee Tax Regime not found!',
      });

    await sequelize.transaction(async (t) => {
      await regimedata.destroy({ user: req.userDetails, transaction: t });
    });

    return res.status(200).json({
      status: 200,
      message: 'Employee Tax Regime Deleted Successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// exports.getlistdata = async (req, res, next) => {
//   try {
//     const {
//       page,
//       limit,
//       searchQuery,
//       companyMasterID,
//       branchMasterID,
//       userMasterID,
//       financialYear,
//       regime,
//       Export,
//     } = req.query;

//     let userdata = [];
//     if (companyMasterID && !branchMasterID) {
//       const data = await EmployeeJoiningDetails.findAndCountAll({
//         raw: true,
//         where: {
//           joiningDate: {
//             [Sequelize.Op.lte]: new Date(),
//           },
//           [Sequelize.Op.or]: [
//             {
//               leavingDate: { [Sequelize.Op.gte]: new Date() },
//             },
//             {
//               leavingDate: { [Sequelize.Op.eq]: null },
//               [Sequelize.Op.or]: [
//                 {
//                   '$userMaster.deactiveDate$': { [Sequelize.Op.gte]: new Date() },
//                 },
//                 {
//                   '$userMaster.deactiveDate$': { [Sequelize.Op.eq]: null },
//                 },
//               ],
//             },
//           ],
//           '$userMaster.companyMasterId$': companyMasterID,
//           '$userMaster.status$': [0, 1],
//         },
//         include: [{ model: UserMaster, required: true, ...accessibleUsers(req.userDetails) }],
//         order: [[{ model: UserMaster }, 'displayName', 'ASC']],
//       })
//       // const data = await getAllUserByCompanyDateWise(companyMasterID, '', '', '');

//       userdata = data.rows;
//     }

//     if (companyMasterID && branchMasterID) {
//       const get_branch_users = await EmployeeBranch.findAndCountAll({
//         raw: true,
//         where: {
//           branchID: branchMasterID,
//           applicableDate: {
//             [Sequelize.Op.lte]: new Date(),
//           },
//           [Sequelize.Op.or]: [
//             {
//               endDate: {
//                 [Sequelize.Op.gte]: new Date(),
//               },
//             },
//             {
//               endDate: null,
//             },
//           ],
//           status: 1,
//         },
//       });
//       let allActiveUsersID = [];
//       for (let userID of get_branch_users.rows) {
//         allActiveUsersID.push(userID.userMasterID);
//       }

//       const data = await EmployeeJoiningDetails.findAndCountAll({
//         raw: true,
//         where: {
//           joiningDate: {
//             [Sequelize.Op.lte]: new Date(),
//           },
//           [Sequelize.Op.or]: [
//             {
//               leavingDate: { [Sequelize.Op.gte]: new Date() },
//             },
//             {
//               leavingDate: { [Sequelize.Op.eq]: null },
//               [Sequelize.Op.or]: [
//                 {
//                   '$userMaster.deactiveDate$': { [Sequelize.Op.gte]: new Date() },
//                 },
//                 {
//                   '$userMaster.deactiveDate$': { [Sequelize.Op.eq]: null },
//                 },
//               ],
//             },
//           ],
//           userMasterID: allActiveUsersID,
//           '$userMaster.status$': [0, 1],
//         },
//         include: [{ model: UserMaster, required: true, ...accessibleUsers(req.userDetails) }],
//         order: [[{ model: UserMaster }, 'displayName', 'ASC']],
//       });
//       // const data = await getAllUserByBranchDateWise(branchMasterID, '', '', '');

//       userdata = data.rows;
//     }

//     let userids = userdata.map((e) => e.userMasterID);

//     if (userMasterID && +userMasterID.length > 0) {
//       userids = userMasterID;
//     }

//     const paginateCondition = !Export
//       ? page && limit
//         ? { offset: (page - 1) * limit, limit: limit }
//         : {}
//       : {};
//     const condition = {};

//     if (userids) condition.userMasterID = { [Op.in]: userids };

//     if (financialYear) condition.financialYear = financialYear;
//     if (regime) condition.regime = regime;

//     if (searchQuery) {
//       condition[Op.or] = [
//         { financialYear: { [Op.iLike]: `%${searchQuery}%` } },
//         { regime: { [Op.iLike]: `%${searchQuery}%` } },
//         {
//           '$userMaster.displayName$': { [Op.iLike]: `%${searchQuery}%` },
//         },
//       ];
//     }

//     const regimedata = await EmployeeTaxRegime.findAndCountAll({
//       raw: true,
//       where: condition,
//       ...paginateCondition,
//       include: [{ model: UserMaster, attributes: [] }],
//       order: [[{ model: UserMaster }, 'displayName', 'ASC']],
//       attributes: [
//         'employeeTaxRegimeID',
//         [Sequelize.col('userMaster.displayName'), 'Employee Name'],
//         [Sequelize.col('financialYear'), 'Financial Year'],
//         [Sequelize.col('regime'), 'Regime'],
//       ],
//     });

//     if (Export == 'true') {
//       if (+regimedata.rows.length === 0)
//         return res.status(200).json({
//           status: 401,
//           message: 'No data found to export!',
//         });

//       console.log(regimedata.rows, '1234');

//       const finaldata = regimedata.rows.map((e) => {
//         return {
//           'Employee Name': e['Employee Name'],
//           'Financial Year': e['Financial Year'],
//           Regime: e['Regime'],
//         };
//       });

//       return await generateExcel(finaldata, 'Employee Tax Regime', 'xlsx', res);
//     }

//     return res.status(200).json({
//       status: 200,
//       data: regimedata.rows,
//       totalcount: regimedata.count,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

exports.getlistdata = async (req, res, next) => {
  try {
    const {
      page,
      limit,
      searchQuery,
      companyMasterID,
      branchMasterID,
      userMasterID,
      financialYear,
      regime,
      Export,
    } = req.body;

    const date = asiaKolkataDateTime(new Date()).slice(0, 10);

    let userdata = [];
    if (companyMasterID && !branchMasterID) {
      const data = await EmployeeJoiningDetails.findAndCountAll({
        raw: true,
        where: {
          joiningDate: {
            [Sequelize.Op.lte]: new Date(date),
          },
          [Sequelize.Op.or]: [
            {
              leavingDate: { [Sequelize.Op.gte]: new Date(date) },
            },
            {
              leavingDate: { [Sequelize.Op.eq]: null },
              [Sequelize.Op.or]: [
                {
                  '$userMaster.deactiveDate$': {
                    [Sequelize.Op.gte]: new Date(date),
                  },
                },
                {
                  '$userMaster.deactiveDate$': { [Sequelize.Op.eq]: null },
                },
              ],
            },
          ],
          '$userMaster.companyMasterId$': companyMasterID,
          '$userMaster.status$': [0, 1],
        },
        include: [
          {
            model: UserMaster,
            required: true,
            ...accessibleUsers(req.userDetails),
          },
        ],
        order: [
          [{ model: UserMaster, as: 'userMaster' }, 'displayName', 'ASC'],
        ],
      });

      userdata = data.rows;
    }

    if (companyMasterID && branchMasterID) {
      const get_branch_users = await EmployeeBranch.findAndCountAll({
        raw: true,
        where: {
          branchID: branchMasterID,
          applicableDate: {
            [Sequelize.Op.lte]: new Date(date),
          },
          [Sequelize.Op.or]: [
            {
              endDate: {
                [Sequelize.Op.gte]: new Date(date),
              },
            },
            {
              endDate: null,
            },
          ],
          status: 1,
        },
      });
      let allActiveUsersID = [];
      for (let userID of get_branch_users.rows) {
        allActiveUsersID.push(userID.userMasterID);
      }

      const data = await EmployeeJoiningDetails.findAndCountAll({
        raw: true,
        where: {
          joiningDate: {
            [Sequelize.Op.lte]: new Date(date),
          },
          [Sequelize.Op.or]: [
            {
              leavingDate: { [Sequelize.Op.gte]: new Date(date) },
            },
            {
              leavingDate: { [Sequelize.Op.eq]: null },
              [Sequelize.Op.or]: [
                {
                  '$userMaster.deactiveDate$': {
                    [Sequelize.Op.gte]: new Date(date),
                  },
                },
                {
                  '$userMaster.deactiveDate$': { [Sequelize.Op.eq]: null },
                },
              ],
            },
          ],
          userMasterID: allActiveUsersID,
          '$userMaster.status$': [0, 1],
        },
        include: [
          {
            model: UserMaster,
            required: true,
            as: 'userMaster',
            ...accessibleUsers(req.userDetails),
          },
        ],
        order: [
          [{ model: UserMaster, as: 'userMaster' }, 'displayName', 'ASC'],
        ],
      });

      userdata = data.rows;
    }

    let userids = userdata.map((e) => e.userMasterID);

    if (userMasterID && +userMasterID.length > 0) {
      userids = userMasterID;
    }

    const paginateCondition = !Export
      ? page && limit
        ? { offset: (page - 1) * limit, limit: limit }
        : {}
      : {};
    const condition = {};

    if (userids) condition.userMasterID = { [Op.in]: userids };

    if (financialYear) condition.financialYear = financialYear;
    if (regime) condition.regime = regime;

    if (searchQuery) {
      condition[Op.or] = [
        { financialYear: { [Op.iLike]: `%${searchQuery}%` } },
        { regime: { [Op.iLike]: `%${searchQuery}%` } },
        {
          '$userMaster.displayName$': { [Op.iLike]: `%${searchQuery}%` },
        },
      ];
    }

    const regimedata = await EmployeeTaxRegime.findAndCountAll({
      // raw: true,
      where: condition,
      ...paginateCondition,
      include: [
        {
          model: UserMaster,
          required: true,
          as: 'userMaster',
          attributes: ['displayName', 'userNumber', 'userMasterID'],
          include: [
            {
              model: EmployeeDesignation,
              where: {
                status: 1,
                applicableDate: { [Sequelize.Op.lte]: new Date(date) },
                [Sequelize.Op.or]: [
                  { endDate: { [Sequelize.Op.gte]: new Date(date) } },
                  { endDate: { [Sequelize.Op.eq]: null } },
                ],
              },
              required: false,
              attributes: ['designationID', 'applicableDate'],
              include: [
                {
                  model: Designation,
                  as: 'designation',
                  attributes: ['designationName'],
                },
              ],
            },
            {
              model: EmployeeDepartment,
              where: {
                status: 1,
                applicableDate: { [Sequelize.Op.lte]: new Date(date) },
                [Sequelize.Op.or]: [
                  { endDate: { [Sequelize.Op.gte]: new Date(date) } },
                  { endDate: { [Sequelize.Op.eq]: null } },
                ],
              },
              required: false,
              attributes: ['departmentID', 'applicableDate'],
              include: [
                {
                  model: Department,
                  as: 'department',
                  attributes: ['departmentName'],
                },
              ],
            },
            {
              model: EmployeeBranch,
              where: {
                status: 1,
                applicableDate: { [Sequelize.Op.lte]: new Date(date) },
                [Sequelize.Op.or]: [
                  { endDate: { [Sequelize.Op.gte]: new Date(date) } },
                  { endDate: { [Sequelize.Op.eq]: null } },
                ],
              },
              required: false,
              attributes: ['branchID', 'applicableDate'],
              include: [
                {
                  model: BranchMaster,
                  as: 'branchMaster',
                  attributes: ['branchName'],
                },
              ],
            },
            {
              required: true,
              model: EmployeeJoiningDetails,
              as: 'employeeJoiningDetails',
              attributes: ['employeeCode'],
            },
          ],
        },
      ],
      // order: [[{ model: UserMaster, as: 'userMaster' }, 'displayName', 'ASC']],
      attributes: [
        'employeeTaxRegimeID',
        [Sequelize.col('userMaster.displayName'), 'EmployeeName'],
        [Sequelize.col('financialYear'), 'financialYear'],
        [Sequelize.col('regime'), 'regime'],
      ],
    });

    if (Export == 'true') {
      if (+regimedata.rows.length === 0)
        return res.status(200).json({
          status: 401,
          message: 'No data found to export!',
        });

      const finaldata = regimedata.rows.map((e) => {
        return {
          'Employee Code':
            e.userMaster.employeeJoiningDetails &&
            e.userMaster.employeeJoiningDetails.length > 0
              ? e.userMaster.employeeJoiningDetails[0].employeeCode
              : '',
          'Employee Name': e.userMaster.displayName,
          Branch:
            e.userMaster.employeeBranches &&
            e.userMaster.employeeBranches.length > 0
              ? e.userMaster.employeeBranches[0].branchMaster
                ? e.userMaster.employeeBranches[0].branchMaster.branchName
                : ''
              : '',
          Department:
            e.userMaster.employeeDepartments &&
            e.userMaster.employeeDepartments.length > 0
              ? e.userMaster.employeeDepartments[0].department
                ? e.userMaster.employeeDepartments[0].department.departmentName
                : ''
              : '',
          Designation:
            e.userMaster.employeeDesignations &&
            e.userMaster.employeeDesignations.length > 0
              ? e.userMaster.employeeDesignations[0].designation
                ? e.userMaster.employeeDesignations[0].designation
                    .designationName
                : ''
              : '',

          'Financial Year': e.financialYear,
          Regime: e.regime,
        };
      });

      return await generateExcel(finaldata, 'Employee Tax Regime', 'xlsx', res);
    }

    return res.status(200).json({
      status: 200,
      data: regimedata.rows,
      totalcount: regimedata.count,
    });
  } catch (error) {
    next(error);
  }
};

exports.getnonRegimeUserlist = async (req, res, next) => {
  try {
    const { companyMasterID, branchMasterID, financialYear } = req.query;

    let userdata = [];

    if (companyMasterID && !branchMasterID) {
      const data = await EmployeeJoiningDetails.findAndCountAll({
        raw: true,
        where: {
          joiningDate: {
            [Sequelize.Op.lte]: new Date(),
          },
          [Sequelize.Op.or]: [
            {
              leavingDate: { [Sequelize.Op.gte]: new Date() },
            },
            {
              leavingDate: { [Sequelize.Op.eq]: null },
              [Sequelize.Op.or]: [
                {
                  '$userMaster.deactiveDate$': {
                    [Sequelize.Op.gte]: new Date(),
                  },
                },
                {
                  '$userMaster.deactiveDate$': { [Sequelize.Op.eq]: null },
                },
              ],
            },
          ],
          '$userMaster.companyMasterId$': companyMasterID,
          '$userMaster.status$': [0, 1],
        },
        include: [
          {
            model: UserMaster,
            required: true,
            ...accessibleUsers(req.userDetails),
          },
        ],
        order: [[{ model: UserMaster }, 'displayName', 'ASC']],
      });
      // const data = await getAllUserByCompanyDateWise(companyMasterID, '', '', '');
      userdata = data.rows;
    }

    if (companyMasterID && branchMasterID) {
      const get_branch_users = await EmployeeBranch.findAndCountAll({
        raw: true,
        where: {
          branchID: branchMasterID,
          applicableDate: {
            [Sequelize.Op.lte]: new Date(),
          },
          [Sequelize.Op.or]: [
            {
              endDate: {
                [Sequelize.Op.gte]: new Date(),
              },
            },
            {
              endDate: null,
            },
          ],
          status: 1,
        },
      });
      let allActiveUsersID = [];
      for (let userID of get_branch_users.rows) {
        allActiveUsersID.push(userID.userMasterID);
      }

      const data = await EmployeeJoiningDetails.findAndCountAll({
        raw: true,
        where: {
          joiningDate: {
            [Sequelize.Op.lte]: new Date(),
          },
          [Sequelize.Op.or]: [
            {
              leavingDate: { [Sequelize.Op.gte]: new Date() },
            },
            {
              leavingDate: { [Sequelize.Op.eq]: null },
              [Sequelize.Op.or]: [
                {
                  '$userMaster.deactiveDate$': {
                    [Sequelize.Op.gte]: new Date(),
                  },
                },
                {
                  '$userMaster.deactiveDate$': { [Sequelize.Op.eq]: null },
                },
              ],
            },
          ],
          userMasterID: allActiveUsersID,
          '$userMaster.status$': [0, 1],
        },
        include: [
          {
            model: UserMaster,
            required: true,
            ...accessibleUsers(req.userDetails),
          },
        ],
        order: [[{ model: UserMaster }, 'displayName', 'ASC']],
      });
      // const data = await getAllUserByBranchDateWise(branchMasterID, '', '', '');
      userdata = data.rows;
    }

    const userids = userdata.map((e) => e.userMasterID);

    const regimedata = await EmployeeTaxRegime.findAll({
      raw: true,
      where: {
        userMasterID: {
          [Sequelize.Op.in]: userids,
        },
        financialYear: financialYear,
      },
    });

    const allusersRegimeIds = regimedata.map((e) => e.userMasterID);

    const finaldata = userdata.filter(
      (obj) => !allusersRegimeIds.includes(obj.userMasterID)
    );

    return res.status(200).json({
      status: 200,
      data: finaldata,
    });
  } catch (error) {
    next(error);
  }
};

exports.getByUserId = async (req, res, next) => {
  try {
    const { userMasterID, page, limit } = req.query;

    if (!userMasterID)
      return res.status(200).json({
        status: 401,
        message: 'User Id is required field!',
      });

    const paginateCondition =
      page && limit ? { offset: (page - 1) * limit, limit: limit } : {};

    const regimeData = await EmployeeTaxRegime.findAndCountAll({
      raw: true,
      where: {
        userMasterID: userMasterID,
      },
      ...paginateCondition,
      order: [['financialYear', 'DESC']],
      include: [
        {
          model: UserMaster,
          required: true,
          ...accessibleUsers(req.userDetails),
        },
      ],
    });

    return res.status(200).json({
      status: 200,
      data: regimeData.rows,
      totalcount: +regimeData.count,
    });
  } catch (error) {
    next(error);
  }
};
