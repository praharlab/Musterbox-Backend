const { Sequelize, Op } = require('sequelize');
const sequelize = require('../config/database');
const HRSalaryFields = require('../models/hrSalaryFields');
const Payheadmaster = require('../models/payhead');
const PreviousSalary = require('../models/previousSalary');
const {
  getAllUserByCompanyDateWise,
  employeeDepartment,
  employeeBranch,
} = require('../utils/commonUtilFunctions');
const {
  generateDemoExcelForPreviousSalary,
  generateExcel,
} = require('../utils/exportData');
const readXlsxFile = require('read-excel-file/node');
const UserMaster = require('../models/userMaster');
const HRSalaryTrasaction = require('../models/hrSalaryTransaction');
const fs = require('fs');
const EmployeeJoiningDetails = require('../models/employeeJoiningDetails');
const { executeQuery } = require('./common.controller');
const message = require('../response_message/message');
const { accessibleUsers } = require('../utils/commonUtilFunctions');
const companyMaster = require('../models/companyMaster');
const { FileUploadType } = require('../utils/dbUtils');
const path = require('path');

exports.getDemoExcel = async (req, res, next) => {
  try {
    const { companyMasterID, month } = req.query;

    const date =
      new Date().getFullYear() +
      '-' +
      ('0' + (new Date().getMonth() + 1)).slice(-2) +
      '-' +
      ('0' + new Date().getDate()).slice(-2);

    const users = (
      await EmployeeJoiningDetails.findAndCountAll({
        raw: true,
        where: {
          joiningDate: {
            [Sequelize.Op.lte]: date,
          },
          [Sequelize.Op.or]: [
            {
              leavingDate: { [Sequelize.Op.gte]: date },
            },
            {
              leavingDate: { [Sequelize.Op.eq]: null },
              [Sequelize.Op.or]: [
                {
                  '$userMaster.deactiveDate$': { [Sequelize.Op.gte]: date },
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
      })
    ).rows // await getAllUserByCompanyDateWise(companyMasterID, '', '', date)
      .filter((e) => e['userMaster.status'] == 1);

    const ids = users.map((e) => e.userMasterID);

    const [AllPayheads, previousSalaryData] = await Promise.all([
      HRSalaryFields.findAll({
        raw: true,
        where: {
          companyMasterID: companyMasterID,
          status: 1,
          payheadMasterId: {
            [Op.notIn]: [1, 50, 92],
          },
        },
        include: [{ model: Payheadmaster }],
        order: [['salaryFieldID', 'ASC']],
        attributes: [
          'salaryFieldSrNo',
          [sequelize.col('Payheadmaster.payheadName'), 'payheadName'],
        ],
      }),
      PreviousSalary.findAll({
        raw: true,
        where: {
          userMasterID: {
            [Op.in]: ids,
          },
          yearMonth: month,
        },
        include: [{ model: Payheadmaster, attributes: ['payheadName'] }],
      }),
    ]);

    const employeeEarningHeader = AllPayheads.filter(
      (e) => e.salaryFieldSrNo == 'A'
    ).map((n) => n.payheadName);
    const employeeContributionHeader = AllPayheads.filter(
      (e) => e.salaryFieldSrNo == 'B'
    ).map((n) => n.payheadName);
    const employerContributionHeader = AllPayheads.filter(
      (e) => e.salaryFieldSrNo == 'C'
    ).map((n) => n.payheadName);
    const otherDeductionHeader = AllPayheads.filter(
      (e) => e.salaryFieldSrNo == 'D'
    ).map((n) => n.payheadName);

    const finalHeader = [
      ...employeeEarningHeader,
      ...['GROSS'],
      ...employeeContributionHeader,
      ...['NET SALARY'],
      ...employerContributionHeader,
      ...otherDeductionHeader,
    ];

    const final = await Promise.all(
      users.map(async (u) => {
        const salaryData = previousSalaryData.filter(
          (e) => e.userMasterID == u.userMasterID && e.yearMonth == month
        );

        const s_data = {};
        // set key as a payhead name and value as a amount
        salaryData.forEach((el) => {
          el.val = Number(el.amount);
          let key = el['Payheadmaster.payheadName'];
          s_data[key] = el.val;
        });

        const object = {};

        // set allpayhead of company in object

        finalHeader.forEach((e) => {
          object[e] = s_data[e] ? s_data[e] : '';
        });

        const department = await employeeDepartment(u.userMasterID, date);
        const branch = await employeeBranch(u.userMasterID, date);

        return {
          ...{
            'Employee Code': u.employeeCode,
            'Employee Name': u['userMaster.displayName'],
            'Mobile No.': u['userMaster.userNumber'],
            Branch: branch ? branch['branchMaster.branchName'] : '',
            Department: department
              ? department['department.departmentName']
              : '',
          },
          ...object,
        };
      })
    );

    if (+final.length === 0) {
      return res.status(200).json({
        message: 'No data found to export!',
      });
    }
    await generateDemoExcelForPreviousSalary(
      employeeEarningHeader,
      employeeContributionHeader,
      employerContributionHeader,
      otherDeductionHeader,
      final,
      `Previous Salary Demo`,
      'xlsx',
      res
    );
  } catch (error) {
    next(error);
  }
};

exports.uploadExcel = async (req, res, next) => {
  const filePath = path.join(__dirname, `../uploads/${req.file.filename}`);

  try {
    const { companyMasterID, month } = await req.body;

    const currentMonth =
      new Date().getFullYear() + ('0' + (new Date().getMonth() + 1)).slice(-2);

    if (+month > currentMonth)
      return res.status(200).json({
        status: 401,
        message: 'You can not upload future month salary!',
      });

    readXlsxFile(filePath).then(async (rows) => {
      const headerPart = rows[1].slice(5);

      rows.splice(0, 2);

      const finaldata = [];

      await sequelize
        .transaction(async (t) => {
          const [allPayHead, userdata, payheadForGrossandNet, companyData] =
            await Promise.all([
              HRSalaryFields.findAll({
                raw: true,
                where: {
                  companyMasterID: companyMasterID,
                  status: 1,
                  payheadMasterId: {
                    [Sequelize.Op.notIn]: [1, 50, 92],
                  },
                },
                include: [
                  { model: Payheadmaster, attributes: ['payheadName'] },
                ],
              }),
              UserMaster.findAll({
                raw: true,
                where: {
                  companyMasterId: companyMasterID,
                  status: 1,
                },
                include: {
                  model: EmployeeJoiningDetails,
                  attributes: ['employeeCode'],
                },
              }),
              Payheadmaster.findAll({
                raw: true,
                where: {
                  payheadMasterId: [50, 92],
                },
              }),
              companyMaster.findOne({
                raw: true,
                where: { companyMasterID },
                attributes: ['fileUploadType'],
              }),
            ]);

          for (const row of rows) {
            let user;
            if (companyData == FileUploadType.EMPLOYEE_CODE) {
              user = userdata.find(
                (e) =>
                  String(e['employeeJoiningDetails.employeeCode']) ==
                  String(row[2])
              );
            } else {
              user = userdata.find(
                (e) => String(e.userNumber) == String(row[2])
              );
            }

            if (!user) continue;

            let incomingGross = 0,
              incomingNetSalary = 0,
              calculatedGross = 0,
              calculatedDeduction = 0;

            for (const [index, value] of headerPart.entries()) {
              if (
                row[5 + index] != null &&
                row[5 + index] > 0 &&
                typeof row[5 + index] === 'number'
              ) {
                const findMainPayHead = payheadForGrossandNet.find(
                  (e) =>
                    String(e.payheadName).trim().toLowerCase() ==
                    String(value).trim().toLowerCase()
                );

                // for gross

                if (findMainPayHead) {
                  if (findMainPayHead.payheadMasterId == 50)
                    incomingGross = +row[5 + index];
                  if (findMainPayHead.payheadMasterId == 92)
                    incomingNetSalary = +row[5 + index];

                  continue;
                }

                const payhead = allPayHead.find(
                  (e) =>
                    String(e['Payheadmaster.payheadName'])
                      .trim()
                      .toLowerCase() == String(value).trim().toLowerCase()
                );
                if (!payhead) continue;

                if (payhead.salaryFieldSrNo == 'A')
                  calculatedGross += +row[5 + index];
                if (payhead.salaryFieldSrNo == 'B')
                  calculatedDeduction += +row[5 + index];

                const salary = await HRSalaryTrasaction.findOne({
                  where: {
                    userMasterID: user.userMasterID,
                    salaryYYYYMM: +month,
                  },
                });

                if (salary) {
                  // delete file
                  fs.unlink(filePath, function (err) {
                    if (err) {
                      console.log(err);
                    } else {
                      console.log('delete');
                    }
                  });

                  return res.status(200).json({
                    status: 401,
                    message:
                      'Salary already calculated for ' +
                      `'${user.userNumber}' so, you can not upload previous salary.`,
                  });
                }

                const find_previousSalary = await PreviousSalary.findAll({
                  //  raw: true,
                  where: {
                    userMasterID: user.userMasterID,
                    yearMonth: +month,
                  },
                });

                if (find_previousSalary.length > 0) {
                  for (const data of find_previousSalary) {
                    await data.destroy({
                      user: req.userDetails,
                      transaction: t,
                    });
                  }
                }

                finaldata.push({
                  userMasterID: user.userMasterID,
                  yearMonth: +month,
                  amount: +row[5 + index],
                  payheadMasterId: +payhead.payheadMasterId,
                  salaryFieldSrNo: payhead.salaryFieldSrNo,
                  status: 1,
                  createBy: +req.userDetails.userMasterId,
                  // createByIp: '',
                });
              }
            }

            if (
              incomingGross == 0 &&
              incomingNetSalary == 0 &&
              calculatedGross == 0 &&
              calculatedDeduction == 0
            )
              continue;

            const calculatedNet = +calculatedGross - +calculatedDeduction;

            // for gross
            if (+incomingGross != calculatedGross) {
              // delete file
              fs.unlink(filePath, function (err) {
                if (err) {
                  console.log(err);
                } else {
                  console.log('delete');
                }
              });

              return res.status(200).json({
                status: 401,
                message: `GROSS Salary does not match of : ${user.userNumber}`,
              });
            }
            // for netpay
            if (incomingNetSalary != calculatedNet) {
              // delete file
              fs.unlink(filePath, function (err) {
                if (err) {
                  console.log(err);
                } else {
                  console.log('delete');
                }
              });

              return res.status(200).json({
                status: 401,
                message: `NET SALARY does not match of : ${user.userNumber}`,
              });
            }
            // push gross and net pay in finaldata

            finaldata.push(
              {
                userMasterID: user.userMasterID,
                yearMonth: +month,
                amount: +incomingGross,
                payheadMasterId: 50,
                salaryFieldSrNo: '',
                status: 1,
                createBy: +req.userDetails.userMasterId,
              },
              {
                userMasterID: user.userMasterID,
                yearMonth: +month,
                amount: +incomingNetSalary,
                payheadMasterId: 92,
                salaryFieldSrNo: '',
                status: 1,
                createBy: +req.userDetails.userMasterId,
              }
            );
          }

          await PreviousSalary.bulkCreate(finaldata, { transaction: t });

          fs.unlink(filePath, function (err) {
            if (err) {
              console.log(err);
            } else {
              console.log('delete');
            }
          });

          return res.status(200).send({
            status: 200,
            message: ' The File Upload Successfully: ' + req.file.originalname,
          });
        })
        .catch((err) => {
          res.status(200).send({
            status: 401,
            message: 'Fail to import data into database!' + err.message,
            error: err.message,
          });
        });
    });
  } catch (error) {
    next(error);
  }
};

exports.getPreviousSalaryData = async (req, res, next) => {
  try {
    let {
      companyMasterID,
      branchMasterID,
      userMasterID,
      month,
      page,
      limit,
      Export,
    } = req.body;
    let companyId = companyMasterID,
      branchId = branchMasterID,
      user = userMasterID;

    let offset = (page - 1) * limit;

    if (Export) (page = ''), (limit = ''), (offset = '');
    if (user.length === 0) user = '';

    const date =
      new Date().getFullYear() +
      '-' +
      ('0' + (new Date().getMonth() + 1)).slice(-2) +
      '-' +
      ('0' + new Date().getDate()).slice(-2);

    async function fetchUserMaster(
      page,
      limit,
      user,
      companyId,
      branchId,
      date,
      yearMonth,
      offset
    ) {
      let query = `
          SELECT DISTINCT(ps."userMasterID") 
          FROM "previousSalaries" AS ps `;
      let countQuery = `SELECT COUNT(DISTINCT(ps."userMasterID")) 
                        FROM "previousSalaries" AS ps `;

      if (companyId && branchId && !user) {
        query +=
          ` LEFT OUTER JOIN "employeeBranches" AS empbranch ON ps."userMasterID" = empbranch."userMasterID" WHERE ps."yearMonth" = ` +
          yearMonth +
          ` and ps."deletedAt" is NULL AND empbranch."status" = 1 
                     AND empbranch."branchID" = ` +
          branchId +
          `
                     AND empbranch."applicableDate" <= '` +
          date +
          `'
                     AND (empbranch."endDate" IS NULL OR empbranch."endDate" >= '` +
          date +
          `')`;

        countQuery +=
          ` LEFT OUTER JOIN "employeeBranches" AS empbranch ON ps."userMasterID" = empbranch."userMasterID" WHERE ps."yearMonth" = ` +
          yearMonth +
          ` and ps."deletedAt" is NULL AND empbranch."status" = 1 
          AND empbranch."branchID" = ` +
          branchId +
          `
          AND empbranch."applicableDate" <= '` +
          date +
          `'
          AND (empbranch."endDate" IS NULL OR empbranch."endDate" >= '` +
          date +
          `')`;
      } else if (companyId && !branchId && !user) {
        query +=
          ` left OUTER join "userMasters" as um on ps."userMasterID" =um."userMasterID" where "companyMasterId"=` +
          companyId +
          ` and ps."yearMonth"=` +
          yearMonth +
          ` and ps."deletedAt" is NULL`;
        countQuery +=
          ` left OUTER join "userMasters" as um on ps."userMasterID" =um."userMasterID" where "companyMasterId"=` +
          companyId +
          ` and ps."yearMonth"=` +
          yearMonth +
          ` and ps."deletedAt" is NULL`;
      } else {
        query +=
          ` WHERE ps."yearMonth" = ` +
          yearMonth +
          ` and ps."userMasterID" IN (${user}) and ps."deletedAt" is NULL`;
        countQuery +=
          ` WHERE ps."yearMonth" = ` +
          yearMonth +
          ` and ps."userMasterID" IN (${user}) and ps."deletedAt" is NULL`;
      }

      if (page && limit) {
        query += ` OFFSET ` + offset + ` LIMIT ` + limit + ``;
      }

      let userMaster = await executeQuery(query);
      let totalCount = await executeQuery(countQuery);

      return { userMaster, totalCount };
    }

    const usermasterdata = await fetchUserMaster(
      page,
      limit,
      user,
      companyId,
      branchId,
      date,
      month,
      offset
    );

    const usermaster = usermasterdata.userMaster;
    const totalcount = usermasterdata.totalCount;

    const ids = usermaster.map((e) => e.userMasterID);

    const [userData, previousSalaryData, hrSalaryFields] = await Promise.all([
      UserMaster.findAll({
        raw: true,
        where: {
          userMasterID: {
            [Op.in]: ids,
          },
        },
        include: [
          { model: EmployeeJoiningDetails, attributes: ['employeeCode'] },
        ],
      }),
      PreviousSalary.findAll({
        raw: true,
        where: {
          userMasterID: {
            [Op.in]: ids,
          },
          yearMonth: month,
        },
        include: [{ model: Payheadmaster, attributes: ['payheadName'] }],
      }),
      HRSalaryFields.findAll({
        raw: true,
        where: {
          companyMasterID: companyId,
          status: 1,
          payheadMasterId: {
            [Op.notIn]: [1, 50],
          },
        },
        order: [
          ['salaryFieldSrNo', 'ASC'],
          ['salaryFieldID', 'ASC'],
        ],
        include: [{ model: Payheadmaster, attributes: ['payheadName'] }],
      }),
    ]);

    // all payhead of company

    const employeeEarningHeader = hrSalaryFields
      .filter((e) => e.salaryFieldSrNo == 'A')
      .map((n) => n['Payheadmaster.payheadName']);
    const employeeContributionHeader = hrSalaryFields
      .filter((e) => e.salaryFieldSrNo == 'B')
      .map((n) => n['Payheadmaster.payheadName']);
    const employerContributionHeader = hrSalaryFields
      .filter((e) => e.salaryFieldSrNo == 'C')
      .map((n) => n['Payheadmaster.payheadName']);
    const otherDeductionHeader = hrSalaryFields
      .filter((e) => e.salaryFieldSrNo == 'D')
      .map((n) => n['Payheadmaster.payheadName']);

    const headers = [
      ...employeeEarningHeader,
      ...['GROSS'],
      ...employeeContributionHeader,
      ...['NET SALARY'],
      ...employerContributionHeader,
      ...otherDeductionHeader,
    ];

    const finalData = [];

    for (const user of usermaster) {
      const userDetails = userData.find(
        (e) => e.userMasterID == user.userMasterID
      );
      const salaryData = previousSalaryData.filter(
        (e) => e.userMasterID == user.userMasterID && e.yearMonth == month
      );

      if (!userDetails || salaryData.length === 0) continue;

      const s_data = {};
      // set key as a payhead name and value as a amount
      salaryData.forEach((el) => {
        el.val = Number(el.amount);
        let key = el['Payheadmaster.payheadName'];
        s_data[key] = el.val;
      });

      const object = {};

      // set allpayhead of company in object

      headers.forEach((e) => {
        object[e] = s_data[e] ? s_data[e] : '';
      });

      const department = await employeeDepartment(user.userMasterID, date);
      const branch = await employeeBranch(user.userMasterID, date);

      const data = {};

      if (!Export) data['userMasterID'] = userDetails.userMasterID;

      data['Employee Code'] =
        userDetails['employeeJoiningDetails.employeeCode'];
      data['Employee Name'] = userDetails.displayName;
      data['Mobile No.'] = userDetails.userNumber;
      data['Branch'] = branch ? branch['branchMaster.branchName'] : '';
      data['Department'] = department
        ? department['department.departmentName']
        : '';

      finalData.push({ ...data, ...object });
    }

    if (Export)
      return await generateExcel(
        finalData,
        'Previous Salary Data',
        'xlsx',
        res
      );

    return res.status(200).json({
      status: 200,
      data: finalData,
      totalcount: +totalcount[0].count,
    });
  } catch (error) {
    next(error);
  }
};

exports.delete = async (req, res, next) => {
  try {
    const { userMasterID, yearMonth } = req.body;

    const previousSalaryData = await PreviousSalary.findAll({
      where: {
        userMasterID,
        yearMonth,
      },
    });

    if (previousSalaryData.length === 0) {
      return res.status(200).json({
        status: 401,
        message: 'data not found!',
      });
    }

    for (const data of previousSalaryData) {
      await data.destroy({
        user: req.userDetails,
      });
    }

    return res.status(200).json({
      status: 200,
      message: message.usermessage.deleteMessage('Previous salary'),
    });
  } catch (error) {
    next(error);
  }
};
