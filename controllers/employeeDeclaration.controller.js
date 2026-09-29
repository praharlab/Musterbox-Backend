const Sequelize = require('sequelize');
const EmployeeDeclaration = require('../models/employeeDeclaration');
const UserMaster = require('../models/userMaster');
const tdsSubSection = require('../models/tdsSubSection');
const tdsSection = require('../models/tdsSection');
const employeeDeclaration = require('../models/employeeDeclaration');
const { cond } = require('lodash');
const sequelize = require('../config/database');
const {
  getAllUserByBranchDateWise,
  asiaKolkataDateTime,
  employeeBranch,
  employeeDepartment,
  getAllMonthWithFinancialYear,
  financialMonths,
  getAllSalaryMasterByRange,
  getAllSalaryDataByRange,
  getCurrentFinancialYear,
  employeeSalaryPolicy,
  daysInMonth,
  getPreviousMonthSalaryCycleDate,
  getFinancialYearByMonth,
  incomeTaxCalculationByRegime,
  getYearMonthByRange,
  getFinancialYears,
  incomeTaxCalculationByUserId,
  employeeDesignation,
  paginate,
  getUserByCompanyandDateRange,
  getUserByBranchandDateRange,
  incomeTaxCalculationandComputation,
  accessibleUsers,
} = require('../utils/commonUtilFunctions');
const TdsSubSectionCategory = require('../models/tdsSubSectionCategory');
const EmployeeBranch = require('../models/employeeBranch');
const BranchMaster = require('../models/branchMaster');
const EmployeeDepartment = require('../models/employeeDepartment');
const Department = require('../models/department');
const EmployeeDesignation = require('../models/employeeDesignation');
const Designation = require('../models/designation');
const HRSalaryMasterFields = require('../models/hrSalaryMaster');
const EmployeeJoiningDetails = require('../models/employeeJoiningDetails');
const manualIncomeTaxdeduction = require('../models/manualIncomeTaxDeduction');
const HRSalaryTrasaction = require('../models/hrSalaryTransaction');
const { generateExcel } = require('../utils/exportData');
const EmployeeTaxRegime = require('../models/employeeTaxRegime');

exports.postAddDeclarationRequest = async (req, res, next) => {
  try {
    const {
      userMasterID,
      tdsSubSectionID,
      assessmentYear,
      declarationAmount,
      remarks,
      createBy,
      createByIp,
      declarationFrom,
    } = await req.body;
    let { oldAttachments } = await req.body;

    if (oldAttachments) {
      if (oldAttachments.length > 0) {
        oldAttachments = oldAttachments.split(',');
      } else {
        oldAttachments = [];
      }
    } else {
      oldAttachments = [];
    }

    if (req.files) {
      for (const file of req.files) oldAttachments.push(file.filename);
    }

    // let flag = 1;

    await sequelize.transaction(async (t) => {
      const declarationdata = await employeeDeclaration.findOne({
        where: {
          userMasterID,
          assessmentYear,
          tdsSubSectionID,
        },
      });

      if (declarationdata) {
        // if (declarationdata.authStatus == 1) {
        //   flag = 0;
        // } else {
        declarationdata.declarationAmount = declarationAmount;
        declarationdata.remarks = remarks;
        declarationdata.attachments = oldAttachments;
        declarationdata.authStatus =
          (declarationFrom && declarationFrom) == 'admin' ? 1 : 0;

        await declarationdata.save({ user: req.userDetails, transaction: t });
        // }
      } else {
        await EmployeeDeclaration.create(
          {
            userMasterID,
            tdsSubSectionID,
            assessmentYear,
            declarationAmount,
            remarks,
            attachments: oldAttachments,
            createBy,
            createByIp,
          },
          { user: req.userDetails, transaction: t }
        );
      }
    });

    // if (flag == 0)
    //   return res.status(200).json({
    //     status: 401,
    //     message:
    //       'Employee Declaration Already Approved.So,You Can Not Edit it!',
    //   });
    // else
    return res.status(200).json({
      status: 200,
      message: 'Declaration request sent successfully',
    });
  } catch (err) {
    next(err);
  }
};

exports.getDeclarationRequestByID = async (req, res, next) => {
  try {
    const getRequestByID = await EmployeeDeclaration.findOne({
      where: { employeeDeclarationID: req.params.id },
      raw: true,
      include: [
        { model: UserMaster, attributes: ['userNumber', 'displayName'] },
        {
          model: tdsSubSection,
          attributes: [
            'tdsSectionID',
            'tdsSubSectionName',
            'tdsSubSectionDescription',
          ],
          include: [
            {
              model: tdsSection,
              attributes: ['tdsSectionName', 'tdsSectionDescription'],
            },
          ],
        },
      ],
    });

    if (getRequestByID)
      return res.status(200).json({ status: 200, data: getRequestByID });
    else
      return res
        .status(200)
        .json({ status: 401, data: {}, message: 'Record not found!' });
  } catch (err) {
    next(err);
  }
};

exports.postUpdateDeclarationRequest = async (req, res, next) => {
  try {
    const {
      employeeDeclarationID,
      userMasterID,
      tdsSubSectionID,
      assessmentYear,
      declarationAmount,
      remarks,
      attachments,
    } = await req.body;

    let attachmentsUpdates;

    if (attachments && attachments !== 'null') {
      attachmentsUpdates = attachments.split(',');
    }

    if (req.files) {
      const newFilePaths = req.files.map((file) => file.path);
      attachmentsUpdates = attachmentsUpdates
        ? attachmentsUpdates.concat(newFilePaths)
        : newFilePaths;
    }

    await sequelize.transaction(async (t) => {
      const employeeDeclarationdata = await employeeDeclaration.findOne({
        where: {
          employeeDeclarationID: employeeDeclarationID,
        },
      });

      if (!employeeDeclarationdata)
        return res.status(200).json({
          status: 401,
          message: 'Employee Declaration Not Found!',
        });

      if (employeeDeclarationdata.authStatus == 1)
        return res.status(200).json({
          status: 401,
          message:
            'Employee Declaration Already Approved.So,You Can Not Edit it!',
        });

      (employeeDeclarationdata.declarationAmount = declarationAmount),
        (employeeDeclarationdata.attachments = attachmentsUpdates);

      await employeeDeclarationdata.save({
        user: req.userDetails,
        transaction: t,
      });
      return res
        .status(200)
        .json({ status: 200, message: 'Request updated successfully' });
    });
  } catch (err) {
    next(err);
  }
};

exports.postDeleteDeclarationRequest = async (req, res, next) => {
  try {
    const { employeeDeclarationID } = await req.body;

    const employeeDeclarationdata = await employeeDeclaration.findOne({
      where: {
        employeeDeclarationID: employeeDeclarationID,
      },
    });

    if (!employeeDeclarationdata)
      return res.status(200).json({
        status: 401,
        message: 'Employee Declaration Not Found!',
      });

    if (
      employeeDeclarationdata.authStatus == 1 ||
      employeeDeclarationdata.authStatus == 2
    )
      return res.status(200).json({
        status: 401,
        message:
          'Employee Declaration Already ' +
          `${
            employeeDeclarationdata.authStatus == 1 ? 'Accepted' : 'Rejected'
          }.` +
          'So,You Can Not delete it.',
      });

    await sequelize.transaction(async (t) => {
      await employeeDeclarationdata.destroy({
        user: req.userDetails,
        transaction: t,
      });
    });
    return res
      .status(200)
      .json({ status: 200, message: 'Request deleted successfully' });
  } catch (err) {
    next(err);
  }
};

exports.listDeclarationRequest = async (req, res, next) => {
  try {
    const {
      page,
      limit,
      userMasterID,
      searchQuery,
      companyMasterID,
      branchMasterID,
      financialYear,
      authStatus,
      Export,
    } = req.body;

    const condition = {};
    const date = asiaKolkataDateTime(new Date()).slice(0, 10);

    if (userMasterID.length != 0) condition.userMasterID = userMasterID;
    else {
      if (companyMasterID && branchMasterID) {
        req.userDetails.accessibleBranches = branchMasterID;
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

        const userdata = await EmployeeJoiningDetails.findAndCountAll({
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

        // const userdata = await getAllUserByBranchDateWise(branchMasterID, '', '', '');
        condition.userMasterID = userdata.rows.map((e) => e.userMasterID);
      } else {
        req.userDetails.accessibleCompanies = companyMasterID;
        condition['$userMaster.companyMasterId$'] = companyMasterID;
      }
    }

    if (authStatus) condition.authStatus = authStatus;
    if (financialYear) condition.assessmentYear = financialYear;

    if (searchQuery)
      condition[Sequelize.Op.or] = [
        {
          '$userMaster.userNumber$': {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
        {
          '$userMaster.displayName$': {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
        {
          '$tdsSubSection.tdsSubSectionName$': {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
        {
          '$tdsSubSection.tdsSection.tdsSectionName$': {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
        {
          '$tdsSubSection.tdsSubSectionCategory.categoryName$': {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
      ];

    const order = [['createdAt', 'DESC']];

    const paginationQuery = !Export
      ? page && limit
        ? { offset: (page - 1) * limit, limit: limit }
        : {}
      : {};

    const allDeclarationRequests = await EmployeeDeclaration.findAndCountAll({
      raw: true,
      where: condition,
      ...paginationQuery,
      order,
      include: [
        {
          model: UserMaster,
          required: true,
          ...accessibleUsers(req.userDetails),
          // attributes: [],
        },
        {
          model: tdsSubSection,
          attributes: [
            'tdsSectionID',
            'tdsSubSectionName',
            'tdsSubSectionDescription',
          ],
          include: [
            {
              model: tdsSection,
              attributes: ['tdsSectionName', 'tdsSectionDescription'],
            },
            { model: TdsSubSectionCategory, attributes: ['categoryName'] },
          ],
        },
      ],
    });

    const ids = allDeclarationRequests.rows.map((e) => e.userMasterID);

    const a = {
      raw: true,
      where: {
        userMasterID: ids,
        status: 1,
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
            endDate: { [Sequelize.Op.eq]: null },
          },
        ],
      },
    };

    const [branch, depart, desig] = await Promise.all([
      EmployeeBranch.findAll({
        ...a,
        ...{
          include: [
            {
              model: BranchMaster,
              as: 'branchMaster',
            },
          ],
          attributes: [
            'userMasterID',
            [sequelize.col('branchMaster.branchName'), 'branchName'],
          ],
        },
      }),
      EmployeeDepartment.findAll({
        ...a,
        ...{
          include: [
            {
              model: Department,
              as: 'department',
            },
          ],
          attributes: [
            'userMasterID',
            [sequelize.col('department.departmentName'), 'departmentName'],
          ],
        },
      }),
      EmployeeDesignation.findAll({
        ...a,
        ...{
          include: [
            {
              model: Designation,
              as: 'designation',
            },
          ],
          attributes: [
            'userMasterID',
            [sequelize.col('designation.designationName'), 'designationName'],
          ],
        },
      }),
    ]);

    const listData = allDeclarationRequests.rows.map((e) => {
      const findUserBranch = branch.find(
        (b) => b.userMasterID == e.userMasterID
      );
      const findUserDepart = depart.find(
        (b) => b.userMasterID == e.userMasterID
      );
      const findUserDesig = desig.find((b) => b.userMasterID == e.userMasterID);
      return {
        ...e,
        employeeBranch: findUserBranch ? findUserBranch.branchName : '',
        employeeDepartment: findUserDepart ? findUserDepart.departmentName : '',
        employeeDesignation: findUserDesig ? findUserDesig.designationName : '',
      };
    });

    if (Export) {
    }

    return res.status(200).json({
      message: 'Declaration Request fetched Successfully',
      status: 200,
      data: listData,
      totalcount: allDeclarationRequests.count,
    });
  } catch (err) {
    next(err);
  }
};

exports.acceptRejectDeclarationRequest = async (req, res, next) => {
  try {
    const { employeeDeclarationID, acceptRejectRemark, authStatus } =
      await req.body;

    await sequelize.transaction(async (t) => {
      const getRequestByID = await EmployeeDeclaration.findOne({
        where: { employeeDeclarationID: employeeDeclarationID, authStatus: 0 },
      });

      if (!getRequestByID)
        return res
          .status(200)
          .json({ status: 200, message: 'No Pending request found' });

      getRequestByID.authStatus = authStatus;
      getRequestByID.acceptRejectRemark = acceptRejectRemark;

      await getRequestByID.save({
        user: req.userDetails,
        transaction: t,
      });
    });
    const message =
      authStatus == 1
        ? 'Request accepted successfully'
        : 'Request rejected successfully';

    return res.status(200).json({ status: 200, message: message });
  } catch (err) {
    next(err);
  }
};

exports.getByUserId = async (req, res, next) => {
  try {
    const { page, limit, userMasterID, assessmentYear } = req.query;

    const paginateCondition =
      page && limit ? { offset: (page - 1) * limit, limit: limit } : {};

    const { rows: data, count: totalcount } =
      await employeeDeclaration.findAndCountAll({
        raw: true,
        where: {
          userMasterID: userMasterID,
          assessmentYear: assessmentYear,
          status: 1,
        },
        ...paginateCondition,
        include: [
          {
            model: UserMaster,
            required: true,
            ...accessibleUsers(req.userDetails),
          },
          { model: tdsSubSection, attributes: ['tdsSubSectionName'] },
        ],
      });

    return res.status(200).json({
      status: 200,
      data: data,
      totalcount: totalcount,
    });
  } catch (error) {
    next(error);
  }
};

exports.getDeclarationDatailsByUserId = async (req, res, next) => {
  try {
    const { userMasterID, financialYear } = req.query;

    const [categoryData, employeeDeclarationData] = await Promise.all([
      TdsSubSectionCategory.findAll({
        raw: true,
        order: [['tdsSubSectionCategoryID', 'ASC']],
      }),
      employeeDeclaration.findAll({
        raw: true,
        where: {
          userMasterID,
          assessmentYear: financialYear,
        },
        include: [
          {
            model: UserMaster,
            required: true,
            ...accessibleUsers(req.userDetails),
          },
          { model: tdsSubSection, attributes: [] },
        ],
        attributes: [
          'attachments',
          'authStatus',
          'declarationAmount',
          [
            sequelize.col('tdsSubSection.tdsSubSectionCategoryID'),
            'tdsSubSectionCategoryID',
          ],
          [sequelize.col('tdsSubSection.maxLimit'), 'maxLimit'],
        ],
      }),
    ]);

    const finalData = categoryData.map((e) => {
      const filterData = employeeDeclarationData.filter(
        (f) => f.tdsSubSectionCategoryID == e.tdsSubSectionCategoryID
      );
      const amountDeclared = filterData.reduce(
        (acc, obj) => acc + +obj.declarationAmount,
        0
      );
      let proof = 0,
        amountRejected = 0,
        amountAccepted = 0,
        actualApprovedAmount = 0;
      if (+filterData.length > 0) {
        proof = filterData.reduce(
          (acc, obj) => acc + +obj.attachments.length,
          0
        );
        amountRejected = filterData
          .filter((r) => r.authStatus == 2)
          .reduce((acc, obj) => acc + +obj.declarationAmount, 0);
        amountAccepted = filterData
          .filter((r) => r.authStatus == 1)
          .reduce((acc, obj) => acc + +obj.declarationAmount, 0);

        // for 1.5 lakhs limit data
        if (e.tdsSubSectionCategoryID == 1) {
          actualApprovedAmount =
            amountAccepted > 150000 ? 150000 : +amountAccepted;
        }
        // other categorydata
        else {
          filterData.map((o) => {
            if (o.authStatus == 1)
              actualApprovedAmount += o.maxLimit
                ? +o.declarationAmount > +o.maxLimit
                  ? +o.maxLimit
                  : +o.declarationAmount
                : +o.declarationAmount;
          });
        }
      }

      return {
        categoryName: e.categoryName,
        noOfDeclaration: +filterData.length,
        amountDeclared: +amountDeclared,
        proof: proof,
        amountRejected: amountRejected,
        amountAccepted: amountAccepted,
        actualApprovedAmount: actualApprovedAmount,
      };
    });

    return res.status(200).json({
      status: 200,
      data: finalData,
    });
  } catch (error) {
    next(error);
  }
};

exports.getYearlyIncometaxCalculationByUserId = async (req, res, next) => {
  try {
    const { userMasterID, financialYear } = req.query;

    if (!userMasterID || !financialYear)
      return res.status(200).json({
        status: 401,
        message: 'userMasterID and financialYear are required fields.',
      });

    const data = await incomeTaxCalculationByUserId(
      userMasterID,
      financialYear
    );

    return res.status(200).json({
      status: 200,
      ...data,
    });
  } catch (error) {
    next(error);
  }
};

exports.getFinancialYear = async (req, res, next) => {
  try {
    const financialYears = await getFinancialYears(new Date());

    return res.status(200).json({
      status: 200,
      data: financialYears,
    });
  } catch (error) {
    next(error);
  }
};

exports.getMonthlyTaxDeductionsOfEmployees = async (req, res, next) => {
  try {
    const {
      page,
      limit,
      companyMasterID,
      branchMasterID,
      userMasterID,
      financialYear,
      Export,
    } = req.query;

    let user = [],
      userdata = [],
      totalcount;

    const yearRange = financialYear.split('-');

    const startDate = yearRange[0] + '-' + '04' + '-' + '01';
    const endDate = yearRange[1] + '-' + '03' + '-' + '31';

    if (companyMasterID && branchMasterID) {
      let startdate = startDate,
        enddate = endDate;
      const get_branch_users = await EmployeeBranch.findAndCountAll({
        raw: true,
        where: {
          branchID: branchMasterID,
          applicableDate: {
            [Sequelize.Op.lte]: new Date(enddate),
          },
          [Sequelize.Op.or]: [
            {
              endDate: {
                [Sequelize.Op.gte]: new Date(startdate),
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
      const paginateCondition = {};
      // if (page && limit && Export != 'true') { paginateCondition.offset = (page - 1) * limit; paginateCondition.limit = limit; }

      const data = await EmployeeJoiningDetails.findAndCountAll({
        raw: true,
        where: {
          joiningDate: {
            [Sequelize.Op.lte]: new Date(enddate),
          },
          [Sequelize.Op.or]: [
            {
              leavingDate: { [Sequelize.Op.gte]: new Date(startdate) },
            },
            {
              leavingDate: { [Sequelize.Op.eq]: null },
              [Sequelize.Op.or]: [
                {
                  '$userMaster.deactiveDate$': {
                    [Sequelize.Op.gte]: new Date(startdate),
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
        ...paginateCondition,
        include: [
          {
            model: UserMaster,
            required: true,
            ...accessibleUsers(req.userDetails),
          },
        ],
        order: [[{ model: UserMaster }, 'displayName', 'ASC']],
      });

      data.rows.forEach((row) => {
        const branchData = get_branch_users.rows.find(
          (user) => user.userMasterID === row.userMasterID
        );
        if (branchData) {
          row.branchStartDate = branchData.applicableDate;
          row.branchEndDate = branchData.endDate;
        }
      });

      // const data = await getUserByBranchandDateRange(
      //   branchMasterID,
      //   Export == 'true' ? '' : page,
      //   Export == 'true' ? '' : limit,
      //   startDate,
      //   endDate
      // );
      totalcount = data.count;
      userdata = data.rows;
    } else if (companyMasterID && !branchMasterID) {
      let startdate = startDate,
        enddate = endDate;
      const paginateCondition = {};
      // if (page && limit && Export != 'true') {
      //   paginateCondition.offset = (page - 1) * limit;
      //   paginateCondition.limit = limit;
      // }

      const data = await EmployeeJoiningDetails.findAndCountAll({
        raw: true,
        where: {
          joiningDate: {
            [Sequelize.Op.lte]: new Date(enddate),
          },
          [Sequelize.Op.or]: [
            {
              leavingDate: { [Sequelize.Op.gte]: new Date(startdate) },
            },
            {
              leavingDate: { [Sequelize.Op.eq]: null },
              [Sequelize.Op.or]: [
                {
                  '$userMaster.deactiveDate$': {
                    [Sequelize.Op.gte]: new Date(startdate),
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
        ...paginateCondition,
        include: [
          {
            model: UserMaster,
            required: true,
            ...accessibleUsers(req.userDetails),
          },
        ],
        order: [[Sequelize.literal(`"userMaster.displayName"`), 'ASC']],
      });

      // const data = await getUserByCompanyandDateRange(
      //   companyMasterID,
      //   Export == 'true' ? '' : page,
      //   Export == 'true' ? '' : limit,
      //   startDate,
      //   endDate
      // );
      totalcount = data.count;
      userdata = data.rows;
    }

    if (userMasterID && userMasterID.length > 0) {
      userdata = userdata.filter((e) =>
        userMasterID.includes(e.userMasterID.toString())
      );
    }

    let finalUserData = [];

    if (Export == 'true') finalUserData = userdata;
    else finalUserData = paginate(userdata, limit, page);

    totalcount = userdata.length;

    const finalData = [];

    for (const user of finalUserData) {
      const userMasterID = user.userMasterID;
      const incometaxdata = await incomeTaxCalculationByUserId(
        userMasterID,
        financialYear
      );
      const empBranch = await employeeBranch(userMasterID, endDate);
      const empDepart = await employeeDepartment(userMasterID, endDate);
      const empDesig = await employeeDesignation(userMasterID, endDate);

      finalData.push({
        userMasterID: userMasterID,
        'Employee Code': user.employeeCode,
        'Employee Name': user['userMaster.displayName'],
        Number: user['userMaster.userNumber'],
        Branch: empBranch ? empBranch['branchMaster.branchName'] : '',
        Department: empDepart ? empDepart['department.departmentName'] : '',
        Designation: empDesig ? empDesig['designation.designationName'] : '',
        ...incometaxdata,
      });
    }

    if (Export == 'true') {
      const excelData = finalData.map((e) => {
        const {
          userMasterID,
          previousMonth,
          paidAmount,
          remainingAmount,
          payableAmount,
          futureSalary,
          previousSalary,
          previousUploadedSalary,
          data,
          ...rest
        } = e;

        data.forEach((element) => {
          rest[element.month] = element.amount;
        });
        rest['Payable Amount'] = payableAmount;
        rest['Paid Amount'] = paidAmount;
        rest['Remaining Amount'] = remainingAmount;

        return rest;
      });

      return generateExcel(
        excelData,
        'Monthly Income Tax Of Employees  ' + `${financialYear}`,
        'xlsx',
        res
      );
    }

    return res.status(200).json({
      status: 200,
      data: finalData,
      totalcount: totalcount,
    });
  } catch (error) {
    next(error);
  }
};

exports.addManualInxomeTaxAmount = async (req, res, next) => {
  try {
    const {
      userMasterID,
      yearMonth,
      previousMonth,
      lastMonth,
      amount,
      remainingAmount,
      createBy,
      createByIp,
    } = req.body;

    // if (+previousMonth > +yearMonth)
    //   return res.status(200).json({
    //     status: 401,
    //     message: 'You can not change amount of prevoius month.',
    //   });

    if (+lastMonth == +yearMonth)
      return res.status(200).json({
        status: 401,
        message: 'You can not change amount of last month of financial year.',
      });

    if (+amount > +remainingAmount)
      return res.status(200).json({
        status: 401,
        message: 'you can not save amount more than remaining amount',
      });

    if (+amount < 0)
      return res.status(200).json({
        status: 401,
        message: 'Amount must be positive value.',
      });

    if (+previousMonth == +yearMonth) {
      const salary = await HRSalaryTrasaction.findOne({
        where: {
          userMasterID: userMasterID,
          salaryYYYYMM: previousMonth,
        },
      });

      if (salary)
        return res.status(200).json({
          status: 401,
          message:
            'Salary already calculated so , you can not change amount of that month.',
        });
    }

    await sequelize.transaction(async (t) => {
      const manualTaxdata = await manualIncomeTaxdeduction.findOne({
        where: {
          userMasterID,
          yearMonth,
        },
      });

      if (manualTaxdata) {
        await manualTaxdata.destroy({ user: req.userDetails, transaction: t });
      }

      await manualIncomeTaxdeduction.create(
        {
          userMasterID,
          yearMonth,
          amount,
          createBy,
          createByIp,
        },
        { user: req.userDetails, transaction: t }
      );
    });

    return res.status(200).json({
      status: 200,
      message: 'data save successfully.',
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteManualAmount = async (req, res, next) => {
  try {
    const { userMasterID, yearMonth } = req.body;

    const manualChangedData = await manualIncomeTaxdeduction.findOne({
      where: {
        yearMonth,
        userMasterID,
      },
    });

    if (!manualChangedData)
      return res.status(200).json({
        status: 401,
        message: 'data not found!',
      });
    await sequelize.transaction(async (t) => {
      await manualChangedData.destroy({
        user: req.userDetails,
        transaction: t,
      });
    });

    return res.status(200).json({
      status: 200,
      message: 'Manual amount deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

exports.getIncomeTaxComputation = async (req, res, next) => {
  try {
    const { userMasterID, financialYear } = req.query;

    if (!userMasterID || !financialYear)
      return res.status(200).json({
        status: 401,
        message: 'userMasterID   and financialYear are required fields.',
      });

    const data = await incomeTaxCalculationandComputation(
      userMasterID,
      financialYear
    );

    return res.status(200).json({
      status: 200,
      ...data,
    });
  } catch (error) {
    next(error);
  }
};

exports.getEmployeeDeclarationReport = async (req, res, next) => {
  try {
    const {
      page,
      limit,
      companyMasterID,
      branchMasterID,
      departmentID,
      designationID,
      userID,
      assessmentYear,
      authStatus,
      Export,
    } = req.body;

    const paginateCondition =
      !Export && page && limit ? { offset: (page - 1) * limit, limit } : {};
    const condition = {};
    const date = asiaKolkataDateTime(new Date()).slice(0, 10);

    if (assessmentYear) condition.assessmentYear = assessmentYear;
    if (authStatus && authStatus.length > 0)
      condition.authStatus = {
        [Sequelize.Op.in]: authStatus,
      };
    if (userID && userID.length > 0)
      condition.userMasterID = {
        [Sequelize.Op.in]: userID,
      };

    const { rows: declarationData, count: totalcount } =
      await employeeDeclaration.findAndCountAll({
        where: condition,
        ...paginateCondition,
        include: [
          {
            required: true,
            model: UserMaster,
            where: {
              companyMasterId: companyMasterID,
              status: 1,
            },
            ...accessibleUsers(req.userDetails, false, false),
            include: [
              {
                model: EmployeeDesignation,
                where: {
                  status: 1,
                  ...(designationID && { designationID }),
                  applicableDate: { [Sequelize.Op.lte]: new Date(date) },
                  [Sequelize.Op.or]: [
                    { endDate: { [Sequelize.Op.gte]: new Date(date) } },
                    { endDate: { [Sequelize.Op.eq]: null } },
                  ],
                },
                required: designationID ? true : false,
                attributes: ['designationID'],
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
                  ...(departmentID && { departmentID }),
                  applicableDate: { [Sequelize.Op.lte]: new Date(date) },
                  [Sequelize.Op.or]: [
                    { endDate: { [Sequelize.Op.gte]: new Date(date) } },
                    { endDate: { [Sequelize.Op.eq]: null } },
                  ],
                },
                required: departmentID ? true : false,
                attributes: ['departmentID'],
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
                  ...(branchMasterID && { branchID: branchMasterID }),
                  applicableDate: { [Sequelize.Op.lte]: new Date(date) },
                  [Sequelize.Op.or]: [
                    { endDate: { [Sequelize.Op.gte]: new Date(date) } },
                    { endDate: { [Sequelize.Op.eq]: null } },
                  ],
                },
                required: branchMasterID ? true : false,
                attributes: ['branchID'],
                include: [
                  {
                    model: BranchMaster,
                    as: 'branchMaster',
                    attributes: ['branchName'],
                  },
                ],
              },
              {
                required: false,
                model: EmployeeJoiningDetails,
                attributes: ['employeeCode'],
              },
            ],
          },
          {
            model: tdsSubSection,
            attributes: ['tdsSubSectionName', 'tdsSectionID'],
            include: [
              {
                model: tdsSection,
                attributes: ['tdsSectionName'],
              },
            ],
          },
        ],
        order: [
          [Sequelize.literal('"userMaster.displayName"'), 'ASC'],
          ['employeeDeclarationID', 'ASC'],
        ],
      });

    const finalData = declarationData.map((e) => {
      return {
        'Employee Code':
          e.userMaster.employeeJoiningDetails &&
          e.userMaster.employeeJoiningDetails.length > 0
            ? e.userMaster.employeeJoiningDetails[0].employeeCode
            : '',
        'Employee Name': e.userMaster.displayName,
        Number: e.userMaster.userNumber,
        Branch:
          e.userMaster.employeeBranches &&
          e.userMaster.employeeBranches.length > 0 &&
          e.userMaster.employeeBranches[0].branchMaster
            ? e.userMaster.employeeBranches[0].branchMaster.branchName
            : '',
        Department:
          e.userMaster.employeeDepartments &&
          e.userMaster.employeeDepartments.length > 0 &&
          e.userMaster.employeeDepartments[0].department
            ? e.userMaster.employeeDepartments[0].department.departmentName
            : '',
        Designation:
          e.userMaster.employeeDesignations &&
          e.userMaster.employeeDesignations.length > 0 &&
          e.userMaster.employeeDesignations[0].designation
            ? e.userMaster.employeeDesignations[0].designation.designationName
            : '',
        'Assessment Year': e.assessmentYear,
        'TDS Section': e.tdsSubSection.tdsSection.tdsSectionName,
        'TDS Sub-Section': e.tdsSubSection.tdsSubSectionName,
        'Declared Amount': e.declarationAmount,
        'Auth Status':
          e.authStatus == 1
            ? 'Accepted'
            : e.authStatus == 2
              ? 'Rejected'
              : 'Pending',
      };
    });

    if (Export)
      return await generateExcel(
        finalData,
        'Employee Declaration Report',
        'xlsx',
        res
      );

    return res.status(200).json({
      status: 200,
      data: finalData,
      totalcount,
    });
  } catch (error) {
    next(error);
  }
};
