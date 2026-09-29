const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const EmployeeRentedResidence = require('../models/employeeRentedResidence');
const { dataUnverify } = require('./hrLeavesMonthlyTrans.controller');
const {
  month_dict,
  getAllUserByBranchDateWise,
  asiaKolkataDateTime,
  getYearMonthByRange,
  accessibleUsers,
} = require('../utils/commonUtilFunctions');
const UserMaster = require('../models/userMaster');
const EmployeeBranch = require('../models/employeeBranch');
const EmployeeDepartment = require('../models/employeeDepartment');
const EmployeeDesignation = require('../models/employeeDesignation');
const BranchMaster = require('../models/branchMaster');
const Department = require('../models/department');
const Designation = require('../models/designation');
const employeeDeclaration = require('../models/employeeDeclaration');

exports.addData = async (req, res, next) => {
  try {
    const formData = req.body;
    const files = req.files;

    const values = [];

    const entryCount = Object.keys(formData).filter((key) =>
      key.startsWith('fromMonth')
    ).length;

    let index_attch = 0,
      index_ownAttach = 0;

    let allMonths = [];

    for (let i = 0; i < entryCount; i++) {
      const checkAttach = formData[`isattachment${i}`] == 'yes' ? true : false;
      const checkOwnAttach =
        formData[`isownerAttachment${i}`] == 'yes' ? true : false;

      if (+formData[`fromMonth${i}`] > +formData[`toMonth${i}`])
        return res.status(200).json({
          status: 401,
          message: 'To Month should be greater than to From Month!',
        });

      // check months occurance
      const range = await getYearMonthByRange(
        formData[`fromMonth${i}`],
        formData[`toMonth${i}`]
      );

      const isPresent = allMonths.filter((item) => range.includes(item));

      if (isPresent.length > 0)
        return res.status(200).json({
          status: 401,
          message: 'From Month and To month are not valid range!',
        });

      allMonths = [...allMonths, ...range];

      // Amount Validation

      if (+formData[`amount${i}`] < 0)
        return res.status(200).json({
          status: 401,
          message: 'Rent Amount should be positive value!',
        });

      // Pan Validation

      if (formData[`ownerPAN${i}`]) {
        let regex = new RegExp('^[A-Z]{5}[0-9]{4}[A-Z]{1}$');

        let data = regex.test(formData[`ownerPAN${i}`]);

        if (data == false) {
          return res.status(200).send({
            status: 401,
            message: 'PANNo is not valid of Owner' + ':' + `${i + 1}`,
          });
        }
      }

      values.push({
        userMasterID: formData[`userMasterID${i}`],
        financialYear: formData[`financialYear${i}`],
        fromMonth: formData[`fromMonth${i}`],
        toMonth: formData[`toMonth${i}`],
        amount: formData[`amount${i}`],
        address: formData[`address${i}`],
        city: formData[`city${i}`],
        ownerName: formData[`ownerName${i}`],
        ownerAddress: formData[`ownerAddress${i}`],
        ownerPAN: formData[`ownerPAN${i}`],
        attachment:
          files.attachment && files.attachment[index_attch] && checkAttach
            ? files.attachment[index_attch].filename
            : null,
        ownerAttachment:
          files.ownerAttachment &&
            files.ownerAttachment[index_ownAttach] &&
            checkOwnAttach
            ? files.ownerAttachment[index_ownAttach].filename
            : null,
        createBy: req.userDetails.userMasterId,
      });

      if (checkAttach) index_attch++;
      if (checkOwnAttach) index_ownAttach++;
    }

    await EmployeeRentedResidence.bulkCreate(values);

    return res.status(200).json({
      status: 200,
      message: 'Declaration request sent successfully.',
    });
  } catch (err) {
    next(err);
  }
};

exports.getData = async (req, res, next) => {
  try {
    const { userMasterID, financialYear } = req.query;

    const employeeRentedResidenceData = await EmployeeRentedResidence.findAll({
      raw: true,
      where: {
        userMasterID,
        financialYear,
        status: 1,
      },
      include: [
        {
          model: UserMaster,
          required: true,
          ...accessibleUsers(req.userDetails),
        },
      ],
    });

    employeeRentedResidenceData.map((e) => {
      e.fromMonth1 =
        month_dict[String(e.fromMonth).slice(4, 6)] +
        '-' +
        String(e.fromMonth).slice(0, 4);
      e.toMonth1 =
        month_dict[String(e.toMonth).slice(4, 6)] +
        '-' +
        String(e.toMonth).slice(0, 4);

      return e;
    });

    return res.status(200).json({
      status: 200,
      data: employeeRentedResidenceData,
    });
  } catch (error) {
    next(error);
  }
};

exports.delete = async (req, res, next) => {
  try {
    const { userMasterID, financialYear } = req.body;

    const data = await EmployeeRentedResidence.findAll({
      where: {
        userMasterID,
        financialYear,
      },
    });

    if (data.length === 0)
      return res.status(200).json({
        status: 401,
        message: 'Employee Rented Residency details Not Found!',
      });

    if (data[0].authStatus == 1 || data[0].authStatus == 2)
      return res.status(200).json({
        status: 401,
        message:
          'Rented Residency details Already ' +
          `${data[0].authStatus == 1 ? 'Accepted' : 'Rejected'}.` +
          'So,You Can Not delete it.',
      });

    await sequelize.transaction(async (t) => {
      for (const item of data) {
        await item.destroy({
          user: req.userDetails,
          transaction: t,
        });
      }
    });
    return res.status(200).json({
      status: 200,
      message: 'Rented Residency details deleted successfully',
    });
  } catch (error) {
    next(error);
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
                    '$userMaster.deactiveDate$': { [Sequelize.Op.gte]: new Date() },
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
          include: [{ model: UserMaster, required: true, ...accessibleUsers(req.userDetails) }],
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
    if (financialYear) condition.financialYear = financialYear;

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
      ];

    const order = [['createdAt', 'DESC']];

    const paginationQuery = !Export
      ? page && limit
        ? { offset: (page - 1) * limit, limit: limit }
        : {}
      : {};

    const allDeclarationRequests =
      await EmployeeRentedResidence.findAndCountAll({
        raw: true,
        where: condition,
        ...paginationQuery,
        order,
        include: [
          {
            model: UserMaster,
            required: true,
            ...accessibleUsers(req.userDetails),
            attributes: ['userNumber', 'displayName', 'userMasterID'],
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

      e.fromMonth =
        month_dict[String(e.fromMonth).slice(4, 6)] +
        '-' +
        String(e.fromMonth).slice(0, 4);
      e.toMonth =
        month_dict[String(e.toMonth).slice(4, 6)] +
        '-' +
        String(e.toMonth).slice(0, 4);

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
    const { id, acceptRejectRemark, authStatus } = await req.body;

    await sequelize.transaction(async (t) => {
      const getRequestByID = await EmployeeRentedResidence.findOne({
        where: { id, authStatus: 0 },
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
