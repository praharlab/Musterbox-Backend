const Sequelize = require('sequelize');
const UserMasterModel = require('../models/userMaster');
const Visit = require('../models/visit');
const logger = require('../config/logger');
const message = require('../response_message/message');
const sequelize = require('../config/database');
const CompanyMasterModel = require('../models/companyMaster');
const customer = require('../models/customer');
const UserMaster = require('../models/userMaster');
const product = require('../models/product');
const visitPurpose = require('../models/visitPurpose');
const VisitCustomizeFieldValueModel = require('../models/visitreportcustomizevalue');
const Tracking = require('../models/tracking');
const Notification = require('../config/firebase');
const EmployeeDepartment = require('../models/employeeDepartment');
const EmployeeDesignation = require('../models/employeeDesignation');
const EmployeeBranch = require('../models/employeeBranch');
const VisitFormCustomizeFieldValueModel = require('../models/visitformcustomizevalue');
const VisitFormCustomize = require('../models/visitformcustomize');
const VisitReportCustomize = require('../models/visitreportcustomize');
const { executeQuery } = require('./common.controller');
const reportTo = require('../models/employeeReportTo');
const attendanceTransaction = require('../models/attendanceTransaction');
const visitFormCustomizeValues = require('../models/visitformcustomizevalue');
const {
  sendNotification,
  asiaKolkataDateTime,
  getSixLevelReportsToData,
} = require('../utils/commonUtilFunctions');
const Customer = require('../models/customer');
const Product = require('../models/product');
const VisitPurpose = require('../models/visitPurpose');
const CityMaster = require('../models/citymaster');
const { includes } = require('lodash');
const StateMaster = require('../models/statemaster');
const CountryMaster = require('../models/countrymaster');
const { accessibleUsers } = require('../utils/commonUtilFunctions');
const VisitReportCustomizeValue = require('../models/visitreportcustomizevalue');
const { userAttributes } = require('../utils/commonVars');
const EmployeeJoiningDetails = require('../models/employeeJoiningDetails');
const { generateExcelForVisitReport } = require('../utils/exportData');
const BranchMaster = require('../models/branchMaster');
const Department = require('../models/department');
const Designation = require('../models/designation');
const companyMaster = require('../models/companyMaster');
const moment = require('moment');
const notification_options = {
  priority: 'high',
  timeToLive: 60 * 60 * 24,
};

exports.postAddVisit = async (req, res, next) => {
  try {
    let {
      customerID,
      assignID,
      coPersonID,
      visitPurposeID,
      productID,
      visitDate,
      visitTime,
      checkInDateTime,
      checkInLatitude,
      checkInLongitude,
      checkInLocation,
      checkOutDateTime,
      checkOutLatitude,
      checkOutLongitude,
      checkOutLocation,
      visitStatus,
      companyMasterID,
      createBy,
      createByIp,
    } = await req.body;

    let result = await sequelize.transaction(async (t) => {
      let insert_db_status = await Visit.create(
        {
          customerID,
          assignID,
          coPersonID,
          visitPurposeID,
          productID,
          visitDate,
          visitTime,
          checkInDateTime,
          checkInLatitude,
          checkInLongitude,
          checkInLocation,
          checkOutDateTime,
          checkOutLatitude,
          checkOutLongitude,
          checkOutLocation,
          visitStatus,
          companyMasterID,
          createBy,
          createByIp,
        },
        { transaction: t }
      );

      const notification = {
        title: 'Visit',
        body: 'New Visit Assigned To You. Please Check',
      };
      const data = {
        screen: 'visit',
      };

      await sendNotification(req.body.assignID, notification, data);

      res.status(200).json({
        status: 200,
        message: message.usermessage.visitadd,
        data: insert_db_status,
      });
      //  return insert_db_status;

      return insert_db_status;
    });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

exports.getVisitById = async (req, res, next) => {
  try {
    let get_one_data = await Visit.findOne({
      where: {
        visitID: req.params.id,
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
      },
      include: [
        { model: UserMaster, as: 'assign' },
        {
          model: Customer,
          include: {
            model: CityMaster,
            include: {
              model: StateMaster,
              include: {
                model: CountryMaster,
              },
            },
          },
        },
        { model: Product },
        { model: VisitPurpose },
        { model: CompanyMasterModel },
      ],
    });

    if (!get_one_data) {
      return res
        .status(200)
        .json({ status: 200, message: message.usermessage.deletedrecord });
    } else {
      let coPersonID = get_one_data.coPersonID;
      let get_user_data = await UserMasterModel.findAll({
        where: {
          userMasterID: {
            [Sequelize.Op.in]: coPersonID,
          },
        },
      });
      get_one_data['coPersonID'] = get_user_data;

      return res.status(200).json({ status: 200, data: get_one_data });
    }
  } catch (err) {
    next(err);
  }
};

/**
 * update data
 *
 * @param {id} visitID  to update id
 */
exports.postUpdateVisit = async (req, res, next) => {
  try {
    const {
      visitID,
      customerID,
      assignID,
      coPersonID,
      visitPurposeID,
      productID,
      visitDate,
      visitTime,
      checkInDateTime,
      checkInLatitude,
      checkInLongitude,
      checkInLocation,
      checkOutDateTime,
      checkOutLatitude,
      checkOutLongitude,
      checkOutLocation,
      visitStatus,
      companyMasterID,
      updateBy,
      updateByIp,
    } = await req.body;

    let change_data_status = await Visit.update(
      {
        customerID,
        assignID,
        coPersonID,
        visitPurposeID,
        productID,
        visitDate,
        visitTime,
        checkInDateTime,
        checkInLatitude,
        checkInLongitude,
        checkInLocation,
        checkOutDateTime,
        checkOutLatitude,
        checkOutLongitude,
        checkOutLocation,
        visitStatus,
        companyMasterID,
        updateBy,
        updateByIp,
      },
      {
        where: { visitID: visitID },
      }
    );

    res
      .status(200)
      .json({ status: 200, message: message.usermessage.visitupdate });
    return change_data_status;
  } catch (err) {
    next(err);
  }
};

/**
 * update status
 *
 * @param {id} visitID  to update status of shift
 */

exports.poststatuschange = async (req, res, next) => {
  try {
    let = { visitID, status } = await req.body;
    let delete_status;
    await sequelize.transaction(async (t) => {
      if (status == '1') {
        delete_status = await Visit.update(
          {
            status: '1',
          },
          {
            where: { visitID: visitID, status: ['1', '0'] },
            transaction: t,
          }
        );
      } else {
        delete_status = await Visit.update(
          {
            status: '0',
          },
          {
            where: { visitID: visitID, status: ['1', '0'] },
            transaction: t,
          }
        );
      }

      if (delete_status != 0) {
        res.status(200).json({
          status: 200,
          message: message.usermessage.visitdelete,
          data: {},
        });
      } else {
        res.status(200).json({
          status: 200,
          message: message.usermessage.deletedrecord,
          data: {},
        });
      }
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 200;
    }
    next(err);
  }
};

/**
 * delete by i
 *
 * @param {id} visitID  to delete id
 */
exports.postDeleteVisitById = async (req, res, next) => {
  try {
    let = { visitID } = await req.body;
    await sequelize.transaction(async (t) => {
      await Visit.update(
        {
          status: 2,
        },
        {
          where: { visitID: visitID },
          transaction: t,
        }
      );

      return res
        .status(200)
        .json({ status: 200, message: message.usermessage.visitdelete });
    });
  } catch (err) {
    next(err);
  }
};

exports.getVisitByCompanyId = async (req, res, next) => {
  try {
    const {
      limit,
      page,
      searchQuery,
      startdate,
      enddate,
      userMasterID,
      exportData,
    } = await req.body;
    const condition = {};
    condition.status = [0, 1];
    if (startdate && enddate)
      condition.visitDate = {
        [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
      };

    if (searchQuery) {
      condition[Sequelize.Op.and] = [
        {
          [Sequelize.Op.or]: [
            {
              '$assign.firstName$': {
                [Sequelize.Op.iLike]: '%' + searchQuery + '%',
              },
            },
            {
              '$product.productName$': {
                [Sequelize.Op.iLike]: '%' + searchQuery + '%',
              },
            },
            {
              '$visitPurpose.visitPurpose$': {
                [Sequelize.Op.iLike]: '%' + searchQuery + '%',
              },
            },
            {
              '$customer.customerName$': {
                [Sequelize.Op.iLike]: '%' + searchQuery + '%',
              },
            },
            {
              '$companyMaster.companyName$': {
                [Sequelize.Op.iLike]: '%' + searchQuery + '%',
              },
            },
          ],
        },
        {
          [Sequelize.Op.or]: [
            { assignID: userMasterID },
            { createBy: userMasterID },
          ],
        },
      ];
    } else {
      condition[Sequelize.Op.or] = [
        { assignID: userMasterID },
        { createBy: userMasterID },
      ];
    }

    const paginationQuery = {};
    if (page && limit && !exportData) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }

    const { rows: visitData, count } = await Visit.findAndCountAll({
      where: condition,
      ...paginationQuery,
      order: [['visitDate', 'DESC']],
      include: [
        {
          required: false,
          model: CompanyMasterModel,
          attributes: ['companyName', 'companyAddress'],
        },
        {
          required: false,
          model: customer,
          attributes: [
            'companyName',
            'customerName',
            'currentLocation',
            'mobileNumber1',
          ],
        },
        {
          required: false,
          model: product,
          attributes: ['productID', 'productName', 'companyMasterID'],
        },
        {
          required: false,
          model: visitPurpose,
          attributes: ['visitPurposeID', 'visitPurpose', 'companyMasterID'],
        },
        {
          required: false,
          model: UserMaster,
          as: 'createdByUserDetails',
          attributes: userAttributes,
        },
        {
          required: false,
          model: UserMaster,
          as: 'updatedByUserDetails',
          attributes: userAttributes,
        },
        {
          required: true,
          model: UserMaster,
          as: 'assign',
          ...accessibleUsers(req.userDetails),
          attributes: userAttributes,
          include: [
            {
              required: false,

              model: EmployeeJoiningDetails,
              attributes: ['employeeCode'],
            },
          ],
        },
        {
          required: false,
          model: visitFormCustomizeValues,
          include: [
            {
              required: false,
              model: VisitFormCustomize,
              include: [{ model: CompanyMasterModel }],
            },
          ],
        },
        // {
        //   required: false,
        //   model: VisitReportCustomizeValue,
        //   include: [
        //     {
        //       required : false,
        //       model: VisitReportCustomize,
        //       include: [{ model: CompanyMasterModel }],
        //     },
        //   ],
        // },
      ],
    });
    const visitCopersonIDs = new Set();
    const visitIDs = new Set();
    for (const visit of visitData) {
      visitIDs.add(visit.visitID);
      for (let person of visit.coPersonID) {
        visitCopersonIDs.add(+person);
      }
    }

    const [visitCopersonUserData, findVisitCustomizeField] = await Promise.all([
      // visitCopersonUserData
      await UserMaster.findAll({
        where: {
          userMasterID: [...visitCopersonIDs],
        },
      }),
      visitFormCustomizeValues.findAll({
        where: {
          visitID: [...visitIDs],
        },
        include: [
          {
            model: VisitFormCustomize,
            include: [{ model: CompanyMasterModel }],
          },
        ],
      }),
    ]);
    const allVisitMainData = [];
    for (let visit of visitData) {
      if (visit.createBy) {
        visit.createById = visit.createBy;
        if (
          visit.assignID == +visit.createBy ||
          +visit.createBy == userMasterID
        ) {
          visit.dataValues.editvisit = true;
        } else {
          visit.dataValues.editvisit = false;
        }
        visit.dataValues.createBy = visit.createdByUserDetails.displayName;
      }

      if (visit.updateBy !== null) {
        visit.dataValues.updateBy = visit.updatedByUserDetails.displayName;
      }
      // Set For Co-Person Name And Number
      const coperson = [];
      for (const person of visit.coPersonID) {
        const user = visitCopersonUserData.find(
          (e) => e.userMasterID == +person
        );
        coperson.push(user.displayName + '(' + user.userNumber + ')');
      }
      visit.coPersonID = coperson.join();

      let employeeCode = '';
      if (visit.assign) {
        if (
          visit.assign.employeeJoiningDetails &&
          visit.assign.employeeJoiningDetails.length > 0
        ) {
          if (visit.assign.employeeJoiningDetails[0].employeeCode) {
            employeeCode = visit.assign.employeeJoiningDetails[0].employeeCode;
          }
        }
      }
      // Formate Visit Date
      const formattedVisitDate = asiaKolkataDateTime(visit.visitDate)
        .slice(0, 10)
        .split('-')
        .reverse()
        .join('-');

      if (
        visit.visitReportCustomizeValue &&
        visit.visitReportCustomizeValue.length > 0
      ) {
        visit.report = 'Yes';
      } else {
        visit.report = 'No';
      }

      allVisitMainData.push({
        VisitID: visit.visitID,
        EmployeeCode: employeeCode,
        UserId: visit.assign.userMasterID,
        assigneduserMasterID: visit.assign.userMasterID,
        Employee:
          visit.assign.displayName + ' (' + visit.assign.userNumber + ')',
        Coperson: visit.coPersonID,
        CustomerCompany: visit.customer ? visit.customer.companyName : '',
        CustomerContact: visit.customer
          ? visit.customer.customerName +
            ' (' +
            visit.customer.mobileNumber1 +
            ')'
          : '',
        CustomerAddress: visit.customer ? visit.customer.currentLocation : '',
        Product: visit.product != undefined ? visit.product.productName : '',
        VisitPurpose:
          visit.visitPurpose != undefined
            ? visit.visitPurpose.visitPurpose
            : '',
        VisitDate: formattedVisitDate,
        VisitTime: visit.visitTime,
        // CheckInDateTime:
        //   visit.checkInDateTime != null
        //     ? moment(visit.checkInDateTime, 'YYYY-MM-DD HH:mm:ss').format(
        //         'DD-MM-YYYY hh:mm A'
        //       )
        //     : '',
        CheckInDateTime:
          visit.checkInDateTime != null
            ? moment(visit.checkInDateTime, 'YYYY-MM-DD HH:mm:ss')
                .subtract(5, 'hours') // Subtract 5 hours
                .subtract(30, 'minutes') // Subtract 30 minutes
                .format('DD-MM-YYYY hh:mm A')
            : '',

        CheckInLocation:
          visit.checkInLocation != null ? visit.checkInLocation : '',
        // CheckOutDateTime:
        //   visit.checkOutDateTime != null
        //     ? moment(visit.checkOutDateTime, 'YYYY-MM-DD HH:mm:ss').format(
        //         'DD-MM-YYYY hh:mm A'
        //       )
        //     : '',
        CheckOutDateTime:
          visit.checkOutDateTime != null
            ? moment(visit.checkOutDateTime, 'YYYY-MM-DD HH:mm:ss')
                .subtract(5, 'hours') // Subtract 5 hours
                .subtract(30, 'minutes') // Subtract 30 minutes
                .format('DD-MM-YYYY hh:mm A')
            : '',

        CheckOutLocation:
          visit.checkOutLocation != null ? visit.checkOutLocation : '',
        visitFormCustomizeValue:
          visit.visitFormCustomizeValues &&
          visit.visitFormCustomizeValues.length > 0
            ? visit.visitFormCustomizeValues
            : [],
        // visitReportCustomizeValue:
        //   visit.visitReportCustomizeValues &&
        //   visit.visitReportCustomizeValues.length > 0
        //     ? visit.visitReportCustomizeValues
        //     : [],
      });
    }

    if (exportData) {
      const finalData = [];

      // Helper function to process customize values
      const processCustomizeValues = (items, key, outputKey) => {
        items.forEach((item) => {
          item[outputKey] = [];
          const customizeValues = item[key] || [];
          customizeValues.forEach(
            ({ visitID, value, visitFormCustomize, visitReportCustomize }) => {
              if (item.VisitID === visitID) {
                const isImage =
                  typeof value === 'string' && value.length > 200
                    ? "it's image visitreportSeperate"
                    : value + ' visitreportSeperate';
                const fieldLabel =
                  visitFormCustomize?.fieldLabel ||
                  visitReportCustomize?.fieldLabel;
                if (fieldLabel) {
                  item[outputKey].push({ value: isImage, fieldLabel });
                }
              }
            }
          );
        });
      };

      // Process visitFormCustomizeValue and visitReportCustomizeValue
      processCustomizeValues(
        allVisitMainData,
        'visitFormCustomizeValue',
        'visitreport'
      );
      // processCustomizeValues(
      //   allVisitMainData,
      //   "visitReportCustomizeValue",
      //   "visitReportCustomizeValue1"
      // );

      // Helper function to generate result string from fields
      const generateResultString = (fields) => {
        const fieldData = {};
        fields.forEach(({ value, fieldLabel }) => {
          fieldData[fieldLabel] = value;
        });
        return Object.entries(fieldData)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ');
      };

      // Build final data for export
      allVisitMainData.forEach((visitItem, i) => {
        const visitFormCustomizeValueResult = visitItem.visitreport
          ? generateResultString(visitItem.visitreport)
          : '';
        // const visitReportCustomizeValue = visitItem.visitReportCustomizeValue1
        //   ? generateResultString(visitItem.visitReportCustomizeValue1)
        //   : "";

        const data = {
          'Employee Code': visitItem.EmployeeCode,
          Name: visitItem.Employee,
          'Co-Person': visitItem.Coperson,
          'Visit Date': visitItem.VisitDate,
          Time: visitItem.VisitTime,
          'Check-In-DateTime': visitItem.CheckInDateTime,
          'Check-In-Location': visitItem.CheckInLocation,
          'Check-Out-DateTime': visitItem.CheckOutDateTime,
          'Check-Out-Location': visitItem.CheckOutLocation,
          Product: visitItem.Product,
          'Visit Purpose': visitItem.VisitPurpose,
          Customer: visitItem.CustomerContact,
          "Customer's Company": visitItem.CustomerCompany,
          "Customer's Address": visitItem.CustomerAddress,
          'Customize Fields': visitFormCustomizeValueResult,
          // "Report Customize Fields": visitReportCustomizeValue,
        };

        finalData.push(data);
      });

      await generateExcelForVisitReport(finalData, 'Visit', 'xlsx', res);
      return;
    }
    return res.status(200).json({
      status: 200,
      data: visitData,
      totalcount: count,
      customFileds:
        findVisitCustomizeField && findVisitCustomizeField.length > 0
          ? findVisitCustomizeField
          : [],
    });
  } catch (err) {
    next(err);
  }
};

exports.getVisitByAssignID = async (req, res, next) => {
  try {
    let get_one_data = await Visit.findAll({
      where: {
        assignID: req.params.id,
        status: 1,
      },
      include: [
        {
          model: UserMaster,
          as: 'assign',
          required: true,
        },
        { model: CompanyMasterModel },
        { model: Customer },
        { model: Product },
        { model: VisitPurpose },
      ],
    });

    if (!get_one_data) {
      return res
        .status(200)
        .json({ status: 200, message: message.usermessage.deletedrecord });
    }
    return res.status(200).json({ status: 200, data: get_one_data });
  } catch (err) {
    next(err);
  }
};

exports.getVisitByUserID = async (req, res, next) => {
  try {
    const { userMasterID, page, limit, date, toDate } = req.body;
    const condition = {};
    condition.status = 1;
    condition.assignID = userMasterID;

    if (toDate) {
      condition.visitDate = {
        [Sequelize.Op.between]: [new Date(date), new Date(toDate)],
      };
    } else {
      condition.visitDate = new Date(date);
    }

    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }

    const visit = await Visit.findAndCountAll({
      where: condition,
      ...paginationQuery,
      order: [['visitDate', 'DESC']],
      include: [
        { model: CompanyMasterModel },
        { model: customer },
        {
          model: UserMaster,
          as: 'assign',
          required: true,
          ...accessibleUsers(req.userDetails),
          attributes: [
            'userMasterID',
            'firstName',
            'middleName',
            'lastName',
            'displayName',
            'userNumber',
            'photo',
          ],
        },
        { model: product },
        { model: visitPurpose },
      ],
    });

    for (let i = 0; i < visit.rows.length; i++) {
      let visitreport = await VisitCustomizeFieldValueModel.findAll({
        where: {
          visitID: visit.rows[i].visitID,
        },
      });

      if (visitreport.length > 0) {
        visit.rows[i].dataValues.report = 'Yes';
      } else {
        visit.rows[i].dataValues.report = 'No';
      }

      let visitValue = await VisitFormCustomizeFieldValueModel.findAll({
        raw: true,
        where: {
          visitID: visit.rows[i].visitID,
        },
        attributes: ['value'],
        include: [{ model: VisitFormCustomize, attributes: ['fieldLabel'] }],
      });

      visit.rows[i].dataValues.VisitValue = visitValue;
    }

    return res.status(200).json({
      status: 200,
      message: message.usermessage.visitget,
      data: visit.rows,
      totalcount: visit.count,
    });
  } catch (err) {
    next(err);
  }
};

exports.getVisitByCreateByID = async (req, res, next) => {
  try {
    let get_one_data = await Visit.findAll({
      where: {
        createBy: req.body.id,
        visitDate: new Date(req.body.date),
        status: 1,
      },
      include: [
        {
          model: UserMaster,
          as: 'assign',
          required: true,
          ...accessibleUsers(req.userDetails),
        },
        { model: CompanyMasterModel },
        { model: Customer },
        { model: Product },
        { model: VisitPurpose },
      ],
    });

    if (!get_one_data.length) {
      return res
        .status(200)
        .json({ status: 200, message: message.usermessage.deletedrecord });
    } else {
      return res.status(200).json({
        status: 200,
        message: message.usermessage.visitget,
        data: get_one_data,
      });
    }
  } catch (err) {
    next(err);
  }
};

exports.VisitByCompanyId = async (req, res, next) => {
  try {
    let {
      limit,
      page,
      companyMasterID,
      branchMasterID,
      departmentid,
      designationid,
      userMasterID,
      startdate,
      enddate,
    } = await req.body;
    let branchid = branchMasterID,
      userid = userMasterID;
    let offset = (page - 1) * limit;
    let data, totalcount;
    let usermaster;

    let maindata = [];

    if (page != '' && limit != '') {
      if (
        userid == '' &&
        branchid == '' &&
        departmentid == '' &&
        designationid == '' &&
        startdate == '' &&
        enddate == ''
      ) {
        usermaster = await executeQuery(
          `
      select A.* from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
      COALESCE((select "branchID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
      ,COALESCE((select "designationID"  from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID" 
       from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID"
        where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            ` ORDER BY "firstName" ASC )  as A limit ` +
            limit +
            ` offset ` +
            offset +
            `
                 `
        );

        totalcount = await executeQuery(
          `
      select count(A.*) from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
      COALESCE((select "branchID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
      ,COALESCE((select "designationID"  from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID" 
       from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID"
        where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            ` ORDER BY "firstName" ASC )  as A  
                 `
        );
      } else if (
        userid != '' &&
        branchid == '' &&
        departmentid == '' &&
        designationid == '' &&
        startdate == '' &&
        enddate == ''
      ) {
        usermaster = await executeQuery(
          ` select A.* from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
      COALESCE((select "branchID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
      ,COALESCE((select "designationID"  from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
      from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
      where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            ` ORDER BY "firstName" ASC ) as A 
                 where A."assignID" IN (` +
            userid +
            `) limit ` +
            limit +
            ` offset ` +
            offset +
            ``
        );

        totalcount = await executeQuery(
          ` select count(A.*) from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
      COALESCE((select "branchID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
      ,COALESCE((select "designationID"  from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
      from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
      where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            ` ORDER BY "firstName" ASC ) as A 
                 where A."assignID" IN (` +
            userid +
            `) `
        );
      } else if (
        userid != '' &&
        branchid != '' &&
        departmentid == '' &&
        designationid == '' &&
        startdate == '' &&
        enddate == ''
      ) {
        usermaster = await executeQuery(
          `  select A.* from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
      COALESCE((select "branchID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
      ,COALESCE((select "designationID"  from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
      from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
      where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            ` ORDER BY "firstName" ASC ) as A where  A."assignID" IN (` +
            userid +
            `) and A."branchID" IN (` +
            branchid +
            `) limit ` +
            limit +
            ` offset ` +
            offset +
            ``
        );

        totalcount = await executeQuery(
          `  select count(A.*) from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
      COALESCE((select "branchID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
      ,COALESCE((select "designationID"  from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
      from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
      where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            ` ORDER BY "firstName" ASC ) as A where  A."assignID" IN (` +
            userid +
            `) and A."branchID" IN (` +
            branchid +
            `) `
        );
      } else if (
        userid != '' &&
        branchid != '' &&
        departmentid != '' &&
        designationid == '' &&
        startdate == '' &&
        enddate == ''
      ) {
        usermaster = await executeQuery(
          `  select A.* from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
      COALESCE((select "branchID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
      ,COALESCE((select "designationID"  from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
      from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
      where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            ` ORDER BY "firstName" ASC ) as A where A."Depart" IN (` +
            departmentid +
            `) and A."assignID" IN (` +
            userid +
            `) and A."branchID" IN (` +
            branchid +
            `) limit ` +
            limit +
            ` offset ` +
            offset +
            ` `
        );

        totalcount = await executeQuery(
          `  select count(A.*) from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
      COALESCE((select "branchID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
      ,COALESCE((select "designationID"  from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
      from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
      where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            ` ORDER BY "firstName" ASC ) as A where A."Depart" IN (` +
            departmentid +
            `) and A."assignID" IN (` +
            userid +
            `) and A."branchID" IN (` +
            branchid +
            `)  `
        );
      } else if (
        userid == '' &&
        branchid != '' &&
        departmentid != '' &&
        designationid != '' &&
        startdate == '' &&
        enddate == ''
      ) {
        usermaster = await executeQuery(
          `  select A.* from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
      COALESCE((select "branchID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
      ,COALESCE((select "designationID"  from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
      from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
      where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            ` ORDER BY "firstName" ASC) as A where A."Depart" IN (` +
            departmentid +
            `) and A."branchID" IN (` +
            branchid +
            `) and A."designationID" IN (` +
            designationid +
            `) limit ` +
            limit +
            ` offset ` +
            offset +
            ``
        );

        totalcount = await executeQuery(
          `  select count(A.*) from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
      COALESCE((select "branchID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
      ,COALESCE((select "designationID"  from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
      from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
      where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            ` ORDER BY "firstName" ASC) as A where A."Depart" IN (` +
            departmentid +
            `) and A."branchID" IN (` +
            branchid +
            `) and A."designationID" IN (` +
            designationid +
            `) `
        );
      } else if (
        userid == '' &&
        branchid != '' &&
        departmentid != '' &&
        designationid == '' &&
        startdate == '' &&
        enddate == ''
      ) {
        usermaster = await executeQuery(
          `  select A.* from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
      COALESCE((select "branchID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
      ,COALESCE((select "designationID"  from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
      from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
      where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            ` ORDER BY "firstName" ASC ) as A where A."Depart" IN (` +
            departmentid +
            `) and A."branchID" IN (` +
            branchid +
            `) limit ` +
            limit +
            ` offset ` +
            offset +
            ``
        );

        totalcount = await executeQuery(
          `  select count(A.*) from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
      COALESCE((select "branchID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
      ,COALESCE((select "designationID"  from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
      from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
      where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            ` ORDER BY "firstName" ASC ) as A where A."Depart" IN (` +
            departmentid +
            `) and A."branchID" IN (` +
            branchid +
            `) `
        );
      } else if (
        userid == '' &&
        branchid != '' &&
        departmentid == '' &&
        designationid == '' &&
        startdate == '' &&
        enddate == ''
      ) {
        usermaster = await executeQuery(
          `  select A.* from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
      COALESCE((select "branchID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
      ,COALESCE((select "designationID"  from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
      from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
      where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            ` ORDER BY "firstName" ASC ) as A where  A."branchID" IN (` +
            branchid +
            `) limit ` +
            limit +
            ` offset ` +
            offset +
            ``
        );

        totalcount = await executeQuery(
          `  select count(A.*) from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
      COALESCE((select "branchID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
      ,COALESCE((select "designationID"  from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
      from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
      where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            ` ORDER BY "firstName" ASC ) as A where  A."branchID" IN (` +
            branchid +
            `) `
        );
      } else if (
        userid == '' &&
        branchid == '' &&
        departmentid != '' &&
        designationid == '' &&
        startdate == '' &&
        enddate == ''
      ) {
        usermaster = await executeQuery(
          `  select A.* from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
      COALESCE((select "branchID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
      ,COALESCE((select "designationID"  from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
      from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
      where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            ` ORDER BY "firstName" ASC ) as A where A."Depart" IN (` +
            departmentid +
            `)limit ` +
            limit +
            ` offset ` +
            offset +
            ` `
        );

        totalcount = await executeQuery(
          `  select count(A.*) from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
      COALESCE((select "branchID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
      ,COALESCE((select "designationID"  from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
      from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
      where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            ` ORDER BY "firstName" ASC ) as A where A."Depart" IN (` +
            departmentid +
            `) `
        );
      } else if (
        userid == '' &&
        branchid == '' &&
        departmentid != '' &&
        designationid != '' &&
        startdate == '' &&
        enddate == ''
      ) {
        usermaster = await executeQuery(
          `  select A.* from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
      COALESCE((select "branchID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
      ,COALESCE((select "designationID"  from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
      from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
      where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            ` ORDER BY "firstName" ASC ) as A where A."Depart" IN (` +
            departmentid +
            `) and  A."designationID" IN (` +
            designationid +
            `) limit ` +
            limit +
            ` offset ` +
            offset +
            ``
        );
        totalcount = await executeQuery(
          `  select count(A.*) from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
      COALESCE((select "branchID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
      ,COALESCE((select "designationID"  from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
      from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
      where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            ` ORDER BY "firstName" ASC ) as A where A."Depart" IN (` +
            departmentid +
            `) and  A."designationID" IN (` +
            designationid +
            `) `
        );
      } else if (
        userid != '' &&
        branchid == '' &&
        departmentid != '' &&
        designationid == '' &&
        startdate == '' &&
        enddate == ''
      ) {
        usermaster = await executeQuery(
          ` select A.* from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
      COALESCE((select "branchID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
      ,COALESCE((select "designationID"  from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
      from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
      where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            ` ORDER BY "firstName" ASC) as A where A."Depart" IN (` +
            departmentid +
            `) and A."assignID" IN (` +
            userid +
            `) limit ` +
            limit +
            ` offset ` +
            offset +
            `  `
        );

        totalcount = await executeQuery(
          ` select count (A.*) from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
      COALESCE((select "branchID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
      ,COALESCE((select "designationID"  from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
      from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
      where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            ` ORDER BY "firstName" ASC) as A where A."Depart" IN (` +
            departmentid +
            `) and A."assignID" IN (` +
            userid +
            `)   `
        );
      } else if (
        userid == '' &&
        branchid == '' &&
        departmentid == '' &&
        designationid != '' &&
        startdate == '' &&
        enddate == ''
      ) {
        usermaster = await executeQuery(
          `  select A.* from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
      COALESCE((select "branchID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
      ,COALESCE((select "designationID"  from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
      from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
      where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            ` ORDER BY "firstName" ASC ) as A where A."designationID" IN (` +
            designationid +
            `) limit ` +
            limit +
            ` offset ` +
            offset +
            ``
        );

        totalcount = await executeQuery(
          `  select count(A.*) from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
      COALESCE((select "branchID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
      ,COALESCE((select "designationID"  from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
      from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
      where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            ` ORDER BY "firstName" ASC ) as A where A."designationID" IN (` +
            designationid +
            `) `
        );
      } else if (
        userid == '' &&
        branchid != '' &&
        departmentid == '' &&
        designationid != '' &&
        startdate == '' &&
        enddate == ''
      ) {
        usermaster = await executeQuery(
          `  select A.* from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
      COALESCE((select "branchID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
      ,COALESCE((select "designationID"  from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
      from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
      where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            ` ORDER BY "firstName" ASC ) as A where A."branchID" IN (` +
            branchid +
            `) and A."designationID" IN (` +
            designationid +
            `) limit ` +
            limit +
            ` offset ` +
            offset +
            ``
        );

        totalcount = await executeQuery(
          `  select count(A.*) from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
      COALESCE((select "branchID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
      ,COALESCE((select "designationID"  from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
      from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
      where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            ` ORDER BY "firstName" ASC ) as A where A."branchID" IN (` +
            branchid +
            `) and A."designationID" IN (` +
            designationid +
            `) `
        );
      } else if (
        userid != '' &&
        branchid == '' &&
        departmentid == '' &&
        designationid != '' &&
        startdate == '' &&
        enddate == ''
      ) {
        usermaster = await executeQuery(
          `  select A.* from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
      COALESCE((select "branchID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
      ,COALESCE((select "designationID"  from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
      from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
      where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            ` ORDER BY "firstName" ASC ) as A where  A."assignID" IN (` +
            userid +
            `) and  A."designationID" IN (` +
            designationid +
            `) limit ` +
            limit +
            ` offset ` +
            offset +
            ``
        );

        totalcount = await executeQuery(
          `  select count (A.*) from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
      COALESCE((select "branchID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
      ,COALESCE((select "designationID"  from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
      from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
      where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            ` ORDER BY "firstName" ASC ) as A where  A."assignID" IN (` +
            userid +
            `) and  A."designationID" IN (` +
            designationid +
            `) `
        );
      } else if (
        userid != '' &&
        branchid == '' &&
        departmentid != '' &&
        designationid != '' &&
        startdate == '' &&
        enddate == ''
      ) {
        usermaster = await executeQuery(
          `  select A.* from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
      COALESCE((select "branchID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
      ,COALESCE((select "designationID"  from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
      from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
      where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            ` ORDER BY "firstName" ASC) as A where A."Depart" IN (` +
            departmentid +
            `) and A."assignID" IN (` +
            userid +
            `) and A."designationID" IN (` +
            designationid +
            `) limit ` +
            limit +
            ` offset ` +
            offset +
            ``
        );

        totalcount = await executeQuery(
          `  select count (A.*) from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
      COALESCE((select "branchID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
      ,COALESCE((select "designationID"  from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
      from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
      where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            ` ORDER BY "firstName" ASC) as A where A."Depart" IN (` +
            departmentid +
            `) and A."assignID" IN (` +
            userid +
            `) and A."designationID" IN (` +
            designationid +
            `) `
        );
      } else if (
        userid != '' &&
        branchid == '' &&
        departmentid == '' &&
        designationid != '' &&
        startdate == '' &&
        enddate == ''
      ) {
        usermaster = await executeQuery(
          ` select A.* from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
      COALESCE((select "branchID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
      ,COALESCE((select "designationID"  from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
      from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
      where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            `  ) as A where  A."assignID" IN (` +
            userid +
            `) and A."designationID" IN (` +
            designationid +
            `) limit ` +
            limit +
            ` offset ` +
            offset +
            ``
        );

        totalcount = await executeQuery(
          ` select count (A.*) from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
      COALESCE((select "branchID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
      ,COALESCE((select "designationID"  from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
      from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
      where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            ` ) as A where  A."assignID" IN (` +
            userid +
            `) and A."designationID" IN (` +
            designationid +
            `) `
        );
      } else if (
        userid != '' &&
        branchid != '' &&
        departmentid != '' &&
        designationid != '' &&
        startdate == '' &&
        enddate == ''
      ) {
        usermaster = await executeQuery(
          `  select A.* from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
      COALESCE((select "branchID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
      ,COALESCE((select "designationID"  from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
      from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
      where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            `  ) as A where A."Depart" IN (` +
            departmentid +
            `) and A."assignID" IN (` +
            userid +
            `) and A."branchID" IN (` +
            branchid +
            `) and A."designationID" IN (` +
            designationid +
            `) limit ` +
            limit +
            ` offset ` +
            offset +
            ``
        );

        totalcount = await executeQuery(
          `  select count (A.*) from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
      COALESCE((select "branchID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
      ,COALESCE((select "designationID"  from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
      from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
      where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            `  ) as A where A."Depart" IN (` +
            departmentid +
            `) and A."assignID" IN (` +
            userid +
            `) and A."branchID" IN (` +
            branchid +
            `) and A."designationID" IN (` +
            designationid +
            `) `
        );
      } else if (
        userid != '' &&
        branchid == '' &&
        departmentid == '' &&
        designationid == '' &&
        startdate != '' &&
        enddate != ''
      ) {
        usermaster = await executeQuery(
          `  select A.* from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
      COALESCE((select "branchID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
      ,COALESCE((select "designationID"  from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
      from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
      where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            ` ) as A where  A."assignID" IN (` +
            userid +
            `) and  A."visitDate" BETWEEN 
      '` +
            startdate +
            `' and '` +
            enddate +
            `' 
      limit ` +
            limit +
            ` offset ` +
            offset +
            ``
        );

        totalcount = await executeQuery(
          `  select count (A.*) from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
      COALESCE((select "branchID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
      ,COALESCE((select "designationID"  from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
      from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
      where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            `  ) as A where  A."assignID" IN (` +
            userid +
            `) and  A."visitDate" BETWEEN 
      '` +
            startdate +
            `' and '` +
            enddate +
            `' 
     `
        );
      } else if (
        userid == '' &&
        branchid != '' &&
        departmentid == '' &&
        designationid == '' &&
        startdate != '' &&
        enddate != ''
      ) {
        usermaster = await executeQuery(
          `  select A.* from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
      COALESCE((select "branchID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
      ,COALESCE((select "designationID"  from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
      from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
      where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            ` ) as A where A."branchID" IN (` +
            branchid +
            `) and  A."visitDate" BETWEEN 
      '` +
            startdate +
            `' and '` +
            enddate +
            `' 
      limit ` +
            limit +
            ` offset ` +
            offset +
            ``
        );

        totalcount = await executeQuery(
          `  select count (A.*) from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
      COALESCE((select "branchID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
      ,COALESCE((select "designationID"  from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
      from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
      where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            `  ) as A where  A."branchID" IN (` +
            branchid +
            `) and A."visitDate" BETWEEN 
      '` +
            startdate +
            `' and '` +
            enddate +
            `' 
     `
        );
      } else if (
        userid == '' &&
        branchid == '' &&
        departmentid != '' &&
        designationid == '' &&
        startdate != '' &&
        enddate != ''
      ) {
        usermaster = await executeQuery(
          `  select A.* from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
      COALESCE((select "branchID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
      ,COALESCE((select "designationID"  from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
      from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
      where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            ` ) as A where A."Depart" IN (` +
            departmentid +
            `) A."visitDate" BETWEEN 
      '` +
            startdate +
            `' and '` +
            enddate +
            `' 
      limit ` +
            limit +
            ` offset ` +
            offset +
            ``
        );

        totalcount = await executeQuery(
          `  select count (A.*) from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
      COALESCE((select "branchID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
      ,COALESCE((select "designationID"  from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
      from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
      where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            `  ) as A where A."Depart" IN (` +
            departmentid +
            `)  and  A."visitDate" BETWEEN 
      '` +
            startdate +
            `' and '` +
            enddate +
            `' 
     `
        );
      } else if (
        userid == '' &&
        branchid == '' &&
        departmentid == '' &&
        designationid != '' &&
        startdate != '' &&
        enddate != ''
      ) {
        usermaster = await executeQuery(
          `  select A.* from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
      COALESCE((select "branchID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
      ,COALESCE((select "designationID"  from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
      from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
      where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            ` ) as A where  A."designationID" IN (` +
            designationid +
            `) and  A."visitDate" BETWEEN 
      '` +
            startdate +
            `' and '` +
            enddate +
            `' 
      limit ` +
            limit +
            ` offset ` +
            offset +
            ``
        );

        totalcount = await executeQuery(
          `  select count (A.*) from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
      COALESCE((select "branchID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
      ,COALESCE((select "designationID"  from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
      from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
      where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            `  ) as A where  A."designationID" IN (` +
            designationid +
            `) and  A."visitDate" BETWEEN 
      '` +
            startdate +
            `' and '` +
            enddate +
            `' 
     `
        );
      } else if (
        userid != '' &&
        branchid != '' &&
        departmentid == '' &&
        designationid == '' &&
        startdate != '' &&
        enddate != ''
      ) {
        usermaster = await executeQuery(
          `  select A.* from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
      COALESCE((select "branchID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
      ,COALESCE((select "designationID"  from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
      from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
      where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            ` ) as A where  A."assignID" IN (` +
            userid +
            `) and A."branchID" IN (` +
            branchid +
            `) and   A."visitDate" BETWEEN 
      '` +
            startdate +
            `' and '` +
            enddate +
            `' 
      limit ` +
            limit +
            ` offset ` +
            offset +
            ``
        );

        totalcount = await executeQuery(
          `  select count (A.*) from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
      COALESCE((select "branchID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
      ,COALESCE((select "designationID"  from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
      from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
      where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            `  ) as A where  A."assignID" IN (` +
            userid +
            `) and A."branchID" IN (` +
            branchid +
            `) and   A."visitDate" BETWEEN 
      '` +
            startdate +
            `' and '` +
            enddate +
            `' 
     `
        );
      } else if (
        userid != '' &&
        branchid == '' &&
        departmentid != '' &&
        designationid == '' &&
        startdate != '' &&
        enddate != ''
      ) {
        usermaster = await executeQuery(
          `  select A.* from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
      COALESCE((select "branchID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
      ,COALESCE((select "designationID"  from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
      from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
      where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            ` ) as A where A."Depart" IN (` +
            departmentid +
            `) and A."assignID" IN (` +
            userid +
            `) and  A."visitDate" BETWEEN 
      '` +
            startdate +
            `' and '` +
            enddate +
            `' 
      limit ` +
            limit +
            ` offset ` +
            offset +
            ``
        );

        totalcount = await executeQuery(
          `  select count (A.*) from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
      COALESCE((select "branchID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
      ,COALESCE((select "designationID"  from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
      from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
      where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            `  ) as A where A."Depart" IN (` +
            departmentid +
            `) and A."assignID" IN (` +
            userid +
            `) and  A."visitDate" BETWEEN 
      '` +
            startdate +
            `' and '` +
            enddate +
            `' 
     `
        );
      } else if (
        userid != '' &&
        branchid == '' &&
        departmentid == '' &&
        designationid != '' &&
        startdate != '' &&
        enddate != ''
      ) {
        usermaster = await executeQuery(
          `  select A.* from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
      COALESCE((select "branchID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
      ,COALESCE((select "designationID"  from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
      from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
      where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            ` ) as A where  A."assignID" IN (` +
            userid +
            `) and  A."designationID" IN (` +
            designationid +
            `) and  A."visitDate" BETWEEN 
      '` +
            startdate +
            `' and '` +
            enddate +
            `' 
      limit ` +
            limit +
            ` offset ` +
            offset +
            ``
        );

        totalcount = await executeQuery(
          `  select count (A.*) from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
      COALESCE((select "branchID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
      ,COALESCE((select "designationID"  from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
      from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
      where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            `  ) as A where  A."assignID" IN (` +
            userid +
            `) and  A."designationID" IN (` +
            designationid +
            `) and  A."visitDate" BETWEEN 
      '` +
            startdate +
            `' and '` +
            enddate +
            `' 
     `
        );
      } else if (
        userid == '' &&
        branchid != '' &&
        departmentid != '' &&
        designationid == '' &&
        startdate != '' &&
        enddate != ''
      ) {
        usermaster = await executeQuery(
          `  select A.* from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
      COALESCE((select "branchID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
      ,COALESCE((select "designationID"  from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
      from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
      where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            ` ) as A where A."Depart" IN (` +
            departmentid +
            `) and  A."branchID" IN (` +
            branchid +
            `) and  A."visitDate" BETWEEN 
      '` +
            startdate +
            `' and '` +
            enddate +
            `' 
      limit ` +
            limit +
            ` offset ` +
            offset +
            ``
        );

        totalcount = await executeQuery(
          `  select count (A.*) from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
      COALESCE((select "branchID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
      ,COALESCE((select "designationID"  from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
      from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
      where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            `  ) as A where A."Depart" IN (` +
            departmentid +
            `) and  A."branchID" IN (` +
            branchid +
            `) and  A."visitDate" BETWEEN 
      '` +
            startdate +
            `' and '` +
            enddate +
            `' 
     `
        );
      } else if (
        userid == '' &&
        branchid != '' &&
        departmentid == '' &&
        designationid != '' &&
        startdate != '' &&
        enddate != ''
      ) {
        usermaster = await executeQuery(
          `  select A.* from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
      COALESCE((select "branchID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
      ,COALESCE((select "designationID"  from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
      from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
      where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            ` ) as A where  A."branchID" IN (` +
            branchid +
            `) and A."designationID" IN (` +
            designationid +
            `) and  A."visitDate" BETWEEN 
      '` +
            startdate +
            `' and '` +
            enddate +
            `' 
      limit ` +
            limit +
            ` offset ` +
            offset +
            ``
        );

        totalcount = await executeQuery(
          `  select count (A.*) from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
      COALESCE((select "branchID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
      ,COALESCE((select "designationID"  from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
      from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
      where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            `  ) as A where  A."branchID" IN (` +
            branchid +
            `) and A."designationID" IN (` +
            designationid +
            `) and  A."visitDate" BETWEEN 
      '` +
            startdate +
            `' and '` +
            enddate +
            `' 
     `
        );
      } else if (
        userid == '' &&
        branchid == '' &&
        departmentid != '' &&
        designationid != '' &&
        startdate != '' &&
        enddate != ''
      ) {
        usermaster = await executeQuery(
          `  select A.* from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
      COALESCE((select "branchID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
      ,COALESCE((select "designationID"  from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
      from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
      where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            ` ) as A where A."Depart" IN (` +
            departmentid +
            `) and  A."designationID" IN (` +
            designationid +
            `) and  A."visitDate" BETWEEN 
      '` +
            startdate +
            `' and '` +
            enddate +
            `' 
      limit ` +
            limit +
            ` offset ` +
            offset +
            ``
        );

        totalcount = await executeQuery(
          `  select count (A.*) from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
      COALESCE((select "branchID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
      ,COALESCE((select "designationID"  from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
      from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
      where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            `  ) as A where A."Depart" IN (` +
            departmentid +
            `) andA."designationID" IN (` +
            designationid +
            `) and  A."visitDate" BETWEEN 
      '` +
            startdate +
            `' and '` +
            enddate +
            `' 
     `
        );
      } else if (
        userid == '' &&
        branchid != '' &&
        departmentid != '' &&
        designationid != '' &&
        startdate != '' &&
        enddate != ''
      ) {
        usermaster = await executeQuery(
          `  select A.* from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
      COALESCE((select "branchID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
      ,COALESCE((select "designationID"  from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
      from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
      where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            ` ) as A where A."Depart" IN (` +
            departmentid +
            `) andA."branchID" IN (` +
            branchid +
            `) and A."designationID" IN (` +
            designationid +
            `) and  A."visitDate" BETWEEN 
      '` +
            startdate +
            `' and '` +
            enddate +
            `' 
      limit ` +
            limit +
            ` offset ` +
            offset +
            ``
        );

        totalcount = await executeQuery(
          `  select count (A.*) from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
      COALESCE((select "branchID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
      ,COALESCE((select "designationID"  from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
      from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
      where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            `  ) as A where A."Depart" IN (` +
            departmentid +
            `) and  A."branchID" IN (` +
            branchid +
            `) and A."designationID" IN (` +
            designationid +
            `) and  A."visitDate" BETWEEN 
      '` +
            startdate +
            `' and '` +
            enddate +
            `' 
     `
        );
      } else {
        usermaster = await executeQuery(
          `  select A.* from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
      COALESCE((select "branchID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
      ,COALESCE((select "designationID"  from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
      from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
      where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            ` ) as A where A."Depart" IN (` +
            departmentid +
            `) and A."assignID" IN (` +
            userid +
            `) and A."branchID" IN (` +
            branchid +
            `) and A."designationID" IN (` +
            designationid +
            `) and  A."visitDate" BETWEEN 
      '` +
            startdate +
            `' and '` +
            enddate +
            `' 
      limit ` +
            limit +
            ` offset ` +
            offset +
            ``
        );

        totalcount = await executeQuery(
          `  select count (A.*) from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
      COALESCE((select "branchID" from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
      ,COALESCE((select "designationID"  from "attendanceTransactions" 
      where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
      from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
      where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            `  ) as A where A."Depart" IN (` +
            departmentid +
            `) and A."assignID" IN (` +
            userid +
            `) and A."branchID" IN (` +
            branchid +
            `) and A."designationID" IN (` +
            designationid +
            `) and  A."visitDate" BETWEEN 
      '` +
            startdate +
            `' and '` +
            enddate +
            `' 
     `
        );
      }
    } else {
      if (
        userid == '' &&
        branchid == '' &&
        departmentid == '' &&
        designationid == '' &&
        startdate == '' &&
        enddate == ''
      ) {
        usermaster = await executeQuery(
          `
        select A.* from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
        COALESCE((select "branchID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
        ,COALESCE((select "designationID"  from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID" 
         from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID"
          where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            ` ORDER BY "firstName" ASC )  as A 
                   `
        );

        totalcount = await executeQuery(
          `
        select count(A.*) from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
        COALESCE((select "branchID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
        ,COALESCE((select "designationID"  from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID" 
         from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID"
          where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            ` ORDER BY "firstName" ASC )  as A  
                   `
        );
      } else if (
        userid != '' &&
        branchid == '' &&
        departmentid == '' &&
        designationid == '' &&
        startdate == '' &&
        enddate == ''
      ) {
        usermaster = await executeQuery(
          ` select A.* from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
        COALESCE((select "branchID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
        ,COALESCE((select "designationID"  from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
        from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
        where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            ` ORDER BY "firstName" ASC ) as A 
                   where A."assignID" IN (` +
            userid +
            `) `
        );

        totalcount = await executeQuery(
          ` select count(A.*) from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
        COALESCE((select "branchID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
        ,COALESCE((select "designationID"  from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
        from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
        where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            ` ORDER BY "firstName" ASC ) as A 
                   where A."assignID" IN (` +
            userid +
            `) `
        );
      } else if (
        userid != '' &&
        branchid != '' &&
        departmentid == '' &&
        designationid == '' &&
        startdate == '' &&
        enddate == ''
      ) {
        usermaster = await executeQuery(
          `  select A.* from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
        COALESCE((select "branchID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
        ,COALESCE((select "designationID"  from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
        from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
        where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            ` ORDER BY "firstName" ASC ) as A where  A."assignID" IN (` +
            userid +
            `) and A."branchID" IN (` +
            branchid +
            `) `
        );

        totalcount = await executeQuery(
          `  select count(A.*) from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
        COALESCE((select "branchID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
        ,COALESCE((select "designationID"  from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
        from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
        where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            ` ORDER BY "firstName" ASC ) as A where  A."assignID" IN (` +
            userid +
            `) and A."branchID" IN (` +
            branchid +
            `) `
        );
      } else if (
        userid != '' &&
        branchid != '' &&
        departmentid != '' &&
        designationid == '' &&
        startdate == '' &&
        enddate == ''
      ) {
        usermaster = await executeQuery(
          `  select A.* from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
        COALESCE((select "branchID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
        ,COALESCE((select "designationID"  from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
        from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
        where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            ` ORDER BY "firstName" ASC ) as A where A."Depart" IN (` +
            departmentid +
            `) and A."assignID" IN (` +
            userid +
            `) and A."branchID" IN (` +
            branchid +
            `)  `
        );

        totalcount = await executeQuery(
          `  select count(A.*) from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
        COALESCE((select "branchID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
        ,COALESCE((select "designationID"  from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
        from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
        where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            ` ORDER BY "firstName" ASC ) as A where A."Depart" IN (` +
            departmentid +
            `) and A."assignID" IN (` +
            userid +
            `) and A."branchID" IN (` +
            branchid +
            `)  `
        );
      } else if (
        userid == '' &&
        branchid != '' &&
        departmentid != '' &&
        designationid != '' &&
        startdate == '' &&
        enddate == ''
      ) {
        usermaster = await executeQuery(
          `  select A.* from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
        COALESCE((select "branchID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
        ,COALESCE((select "designationID"  from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
        from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
        where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            ` ORDER BY "firstName" ASC) as A where A."Depart" IN (` +
            departmentid +
            `) and A."branchID" IN (` +
            branchid +
            `) and A."designationID" IN (` +
            designationid +
            `) `
        );

        totalcount = await executeQuery(
          `  select count(A.*) from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
        COALESCE((select "branchID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
        ,COALESCE((select "designationID"  from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
        from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
        where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            ` ORDER BY "firstName" ASC) as A where A."Depart" IN (` +
            departmentid +
            `) and A."branchID" IN (` +
            branchid +
            `) and A."designationID" IN (` +
            designationid +
            `) `
        );
      } else if (
        userid == '' &&
        branchid != '' &&
        departmentid != '' &&
        designationid == '' &&
        startdate == '' &&
        enddate == ''
      ) {
        usermaster = await executeQuery(
          `  select A.* from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
        COALESCE((select "branchID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
        ,COALESCE((select "designationID"  from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
        from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
        where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            ` ORDER BY "firstName" ASC ) as A where A."Depart" IN (` +
            departmentid +
            `) and A."branchID" IN (` +
            branchid +
            `) `
        );

        totalcount = await executeQuery(
          `  select count(A.*) from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
        COALESCE((select "branchID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
        ,COALESCE((select "designationID"  from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
        from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
        where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            ` ORDER BY "firstName" ASC ) as A where A."Depart" IN (` +
            departmentid +
            `) and A."branchID" IN (` +
            branchid +
            `) `
        );
      } else if (
        userid == '' &&
        branchid != '' &&
        departmentid == '' &&
        designationid == '' &&
        startdate == '' &&
        enddate == ''
      ) {
        usermaster = await executeQuery(
          `  select A.* from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
        COALESCE((select "branchID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
        ,COALESCE((select "designationID"  from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
        from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
        where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            ` ORDER BY "firstName" ASC ) as A where  A."branchID" IN (` +
            branchid +
            `) `
        );

        totalcount = await executeQuery(
          `  select count(A.*) from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
        COALESCE((select "branchID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
        ,COALESCE((select "designationID"  from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
        from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
        where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            ` ORDER BY "firstName" ASC ) as A where  A."branchID" IN (` +
            branchid +
            `) `
        );
      } else if (
        userid == '' &&
        branchid == '' &&
        departmentid != '' &&
        designationid == '' &&
        startdate == '' &&
        enddate == ''
      ) {
        usermaster = await executeQuery(
          `  select A.* from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
        COALESCE((select "branchID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
        ,COALESCE((select "designationID"  from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
        from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
        where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            ` ORDER BY "firstName" ASC ) as A where A."Depart" IN (` +
            departmentid +
            `) `
        );

        totalcount = await executeQuery(
          `  select count(A.*) from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
        COALESCE((select "branchID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
        ,COALESCE((select "designationID"  from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
        from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
        where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            ` ORDER BY "firstName" ASC ) as A where A."Depart" IN (` +
            departmentid +
            `) `
        );
      } else if (
        userid == '' &&
        branchid == '' &&
        departmentid != '' &&
        designationid != '' &&
        startdate == '' &&
        enddate == ''
      ) {
        usermaster = await executeQuery(
          `  select A.* from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
        COALESCE((select "branchID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
        ,COALESCE((select "designationID"  from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
        from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
        where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            ` ORDER BY "firstName" ASC ) as A where A."Depart" IN (` +
            departmentid +
            `) and  A."designationID" IN (` +
            designationid +
            `) `
        );
        totalcount = await executeQuery(
          `  select count(A.*) from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
        COALESCE((select "branchID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
        ,COALESCE((select "designationID"  from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
        from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
        where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            ` ORDER BY "firstName" ASC ) as A where A."Depart" IN (` +
            departmentid +
            `) and  A."designationID" IN (` +
            designationid +
            `) `
        );
      } else if (
        userid != '' &&
        branchid == '' &&
        departmentid != '' &&
        designationid == '' &&
        startdate == '' &&
        enddate == ''
      ) {
        usermaster = await executeQuery(
          ` select A.* from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
        COALESCE((select "branchID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
        ,COALESCE((select "designationID"  from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
        from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
        where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            ` ORDER BY "firstName" ASC) as A where A."Depart" IN (` +
            departmentid +
            `) and A."assignID" IN (` +
            userid +
            `)  `
        );

        totalcount = await executeQuery(
          ` select count (A.*) from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
        COALESCE((select "branchID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
        ,COALESCE((select "designationID"  from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
        from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
        where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            ` ORDER BY "firstName" ASC) as A where A."Depart" IN (` +
            departmentid +
            `) and A."assignID" IN (` +
            userid +
            `)   `
        );
      } else if (
        userid == '' &&
        branchid == '' &&
        departmentid == '' &&
        designationid != '' &&
        startdate == '' &&
        enddate == ''
      ) {
        usermaster = await executeQuery(
          `  select A.* from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
        COALESCE((select "branchID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
        ,COALESCE((select "designationID"  from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
        from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
        where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            ` ORDER BY "firstName" ASC ) as A where A."designationID" IN (` +
            designationid +
            `) `
        );

        totalcount = await executeQuery(
          `  select count(A.*) from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
        COALESCE((select "branchID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
        ,COALESCE((select "designationID"  from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
        from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
        where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            ` ORDER BY "firstName" ASC ) as A where A."designationID" IN (` +
            designationid +
            `) `
        );
      } else if (
        userid == '' &&
        branchid != '' &&
        departmentid == '' &&
        designationid != '' &&
        startdate == '' &&
        enddate == ''
      ) {
        usermaster = await executeQuery(
          `  select A.* from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
        COALESCE((select "branchID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
        ,COALESCE((select "designationID"  from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
        from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
        where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            ` ORDER BY "firstName" ASC ) as A where A."branchID" IN (` +
            branchid +
            `) and A."designationID" IN (` +
            designationid +
            `)`
        );

        totalcount = await executeQuery(
          `  select count(A.*) from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
        COALESCE((select "branchID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
        ,COALESCE((select "designationID"  from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
        from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
        where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            ` ORDER BY "firstName" ASC ) as A where A."branchID" IN (` +
            branchid +
            `) and A."designationID" IN (` +
            designationid +
            `) `
        );
      } else if (
        userid != '' &&
        branchid == '' &&
        departmentid == '' &&
        designationid != '' &&
        startdate == '' &&
        enddate == ''
      ) {
        usermaster = await executeQuery(
          `  select A.* from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
        COALESCE((select "branchID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
        ,COALESCE((select "designationID"  from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
        from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
        where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            ` ORDER BY "firstName" ASC ) as A where  A."assignID" IN (` +
            userid +
            `) and  A."designationID" IN (` +
            designationid +
            `) `
        );

        totalcount = await executeQuery(
          `  select count (A.*) from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
        COALESCE((select "branchID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
        ,COALESCE((select "designationID"  from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
        from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
        where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            ` ORDER BY "firstName" ASC ) as A where  A."assignID" IN (` +
            userid +
            `) and  A."designationID" IN (` +
            designationid +
            `) `
        );
      } else if (
        userid != '' &&
        branchid == '' &&
        departmentid != '' &&
        designationid != '' &&
        startdate == '' &&
        enddate == ''
      ) {
        usermaster = await executeQuery(
          `  select A.* from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
        COALESCE((select "branchID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
        ,COALESCE((select "designationID"  from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
        from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
        where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            ` ORDER BY "firstName" ASC) as A where A."Depart" IN (` +
            departmentid +
            `) and A."assignID" IN (` +
            userid +
            `) and A."designationID" IN (` +
            designationid +
            `) `
        );

        totalcount = await executeQuery(
          `  select count (A.*) from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
        COALESCE((select "branchID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
        ,COALESCE((select "designationID"  from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
        from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
        where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            ` ORDER BY "firstName" ASC) as A where A."Depart" IN (` +
            departmentid +
            `) and A."assignID" IN (` +
            userid +
            `) and A."designationID" IN (` +
            designationid +
            `) `
        );
      } else if (
        userid != '' &&
        branchid == '' &&
        departmentid == '' &&
        designationid != '' &&
        startdate == '' &&
        enddate == ''
      ) {
        usermaster = await executeQuery(
          ` select A.* from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
        COALESCE((select "branchID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
        ,COALESCE((select "designationID"  from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
        from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
        where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            `  ) as A where  A."assignID" IN (` +
            userid +
            `) and A."designationID" IN (` +
            designationid +
            `) `
        );

        totalcount = await executeQuery(
          ` select count (A.*) from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
        COALESCE((select "branchID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
        ,COALESCE((select "designationID"  from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
        from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
        where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            ` ) as A where  A."assignID" IN (` +
            userid +
            `) and A."designationID" IN (` +
            designationid +
            `) `
        );
      } else if (
        userid != '' &&
        branchid != '' &&
        departmentid != '' &&
        designationid != '' &&
        startdate == '' &&
        enddate == ''
      ) {
        usermaster = await executeQuery(
          `  select A.* from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
        COALESCE((select "branchID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
        ,COALESCE((select "designationID"  from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
        from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
        where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            `  ) as A where A."Depart" IN (` +
            departmentid +
            `) and A."assignID" IN (` +
            userid +
            `) and A."branchID" IN (` +
            branchid +
            `) and A."designationID" IN (` +
            designationid +
            `) `
        );

        totalcount = await executeQuery(
          `  select count (A.*) from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
        COALESCE((select "branchID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
        ,COALESCE((select "designationID"  from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
        from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
        where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            `  ) as A where A."Depart" IN (` +
            departmentid +
            `) and A."assignID" IN (` +
            userid +
            `) and A."branchID" IN (` +
            branchid +
            `) and A."designationID" IN (` +
            designationid +
            `) `
        );
      } else if (
        userid != '' &&
        branchid == '' &&
        departmentid == '' &&
        designationid == '' &&
        startdate != '' &&
        enddate != ''
      ) {
        usermaster = await executeQuery(
          `  select A.* from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
        COALESCE((select "branchID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
        ,COALESCE((select "designationID"  from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
        from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
        where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            ` ) as A where  A."assignID" IN (` +
            userid +
            `) and  A."visitDate" BETWEEN 
        '` +
            startdate +
            `' and '` +
            enddate +
            `' 
        `
        );

        totalcount = await executeQuery(
          `  select count (A.*) from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
        COALESCE((select "branchID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
        ,COALESCE((select "designationID"  from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
        from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
        where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            `  ) as A where  A."assignID" IN (` +
            userid +
            `) and  A."visitDate" BETWEEN 
        '` +
            startdate +
            `' and '` +
            enddate +
            `' 
       `
        );
      } else if (
        userid == '' &&
        branchid != '' &&
        departmentid == '' &&
        designationid == '' &&
        startdate != '' &&
        enddate != ''
      ) {
        usermaster = await executeQuery(
          `  select A.* from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
        COALESCE((select "branchID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
        ,COALESCE((select "designationID"  from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
        from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
        where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            ` ) as A where A."branchID" IN (` +
            branchid +
            `) and  A."visitDate" BETWEEN 
        '` +
            startdate +
            `' and '` +
            enddate +
            `' 
        `
        );

        totalcount = await executeQuery(
          `  select count (A.*) from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
        COALESCE((select "branchID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
        ,COALESCE((select "designationID"  from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
        from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
        where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            `  ) as A where  A."branchID" IN (` +
            branchid +
            `) and A."visitDate" BETWEEN 
        '` +
            startdate +
            `' and '` +
            enddate +
            `' 
       `
        );
      } else if (
        userid == '' &&
        branchid == '' &&
        departmentid != '' &&
        designationid == '' &&
        startdate != '' &&
        enddate != ''
      ) {
        usermaster = await executeQuery(
          `  select A.* from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
        COALESCE((select "branchID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
        ,COALESCE((select "designationID"  from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
        from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
        where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            ` ) as A where A."Depart" IN (` +
            departmentid +
            `) A."visitDate" BETWEEN 
        '` +
            startdate +
            `' and '` +
            enddate +
            `' 
        `
        );

        totalcount = await executeQuery(
          `  select count (A.*) from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
        COALESCE((select "branchID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
        ,COALESCE((select "designationID"  from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
        from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
        where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            `  ) as A where A."Depart" IN (` +
            departmentid +
            `)  and  A."visitDate" BETWEEN 
        '` +
            startdate +
            `' and '` +
            enddate +
            `' 
       `
        );
      } else if (
        userid == '' &&
        branchid == '' &&
        departmentid == '' &&
        designationid != '' &&
        startdate != '' &&
        enddate != ''
      ) {
        usermaster = await executeQuery(
          `  select A.* from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
        COALESCE((select "branchID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
        ,COALESCE((select "designationID"  from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
        from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
        where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            ` ) as A where  A."designationID" IN (` +
            designationid +
            `) and  A."visitDate" BETWEEN 
        '` +
            startdate +
            `' and '` +
            enddate +
            `' 
        `
        );

        totalcount = await executeQuery(
          `  select count (A.*) from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
        COALESCE((select "branchID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
        ,COALESCE((select "designationID"  from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
        from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
        where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            `  ) as A where  A."designationID" IN (` +
            designationid +
            `) and  A."visitDate" BETWEEN 
        '` +
            startdate +
            `' and '` +
            enddate +
            `' 
       `
        );
      } else if (
        userid != '' &&
        branchid != '' &&
        departmentid == '' &&
        designationid == '' &&
        startdate != '' &&
        enddate != ''
      ) {
        usermaster = await executeQuery(
          `  select A.* from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
        COALESCE((select "branchID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
        ,COALESCE((select "designationID"  from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
        from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
        where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            ` ) as A where  A."assignID" IN (` +
            userid +
            `) and A."branchID" IN (` +
            branchid +
            `) and   A."visitDate" BETWEEN 
        '` +
            startdate +
            `' and '` +
            enddate +
            `' 
        `
        );

        totalcount = await executeQuery(
          `  select count (A.*) from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
        COALESCE((select "branchID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
        ,COALESCE((select "designationID"  from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
        from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
        where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            `  ) as A where  A."assignID" IN (` +
            userid +
            `) and A."branchID" IN (` +
            branchid +
            `) and   A."visitDate" BETWEEN 
        '` +
            startdate +
            `' and '` +
            enddate +
            `' 
       `
        );
      } else if (
        userid != '' &&
        branchid == '' &&
        departmentid != '' &&
        designationid == '' &&
        startdate != '' &&
        enddate != ''
      ) {
        usermaster = await executeQuery(
          `  select A.* from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
        COALESCE((select "branchID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
        ,COALESCE((select "designationID"  from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
        from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
        where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            ` ) as A where A."Depart" IN (` +
            departmentid +
            `) and A."assignID" IN (` +
            userid +
            `) and  A."visitDate" BETWEEN 
        '` +
            startdate +
            `' and '` +
            enddate +
            `' 
        `
        );

        totalcount = await executeQuery(
          `  select count (A.*) from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
        COALESCE((select "branchID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
        ,COALESCE((select "designationID"  from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
        from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
        where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            `  ) as A where A."Depart" IN (` +
            departmentid +
            `) and A."assignID" IN (` +
            userid +
            `) and  A."visitDate" BETWEEN 
        '` +
            startdate +
            `' and '` +
            enddate +
            `' 
       `
        );
      } else if (
        userid != '' &&
        branchid == '' &&
        departmentid == '' &&
        designationid != '' &&
        startdate != '' &&
        enddate != ''
      ) {
        usermaster = await executeQuery(
          `  select A.* from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
        COALESCE((select "branchID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
        ,COALESCE((select "designationID"  from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
        from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
        where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            ` ) as A where  A."assignID" IN (` +
            userid +
            `) and  A."designationID" IN (` +
            designationid +
            `) and  A."visitDate" BETWEEN 
        '` +
            startdate +
            `' and '` +
            enddate +
            `' 
        `
        );

        totalcount = await executeQuery(
          `  select count (A.*) from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
        COALESCE((select "branchID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
        ,COALESCE((select "designationID"  from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
        from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
        where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            `  ) as A where  A."assignID" IN (` +
            userid +
            `) and  A."designationID" IN (` +
            designationid +
            `) and  A."visitDate" BETWEEN 
        '` +
            startdate +
            `' and '` +
            enddate +
            `' 
       `
        );
      } else if (
        userid == '' &&
        branchid != '' &&
        departmentid != '' &&
        designationid == '' &&
        startdate != '' &&
        enddate != ''
      ) {
        usermaster = await executeQuery(
          `  select A.* from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
        COALESCE((select "branchID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
        ,COALESCE((select "designationID"  from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
        from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
        where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            ` ) as A where A."Depart" IN (` +
            departmentid +
            `) and  A."branchID" IN (` +
            branchid +
            `) and  A."visitDate" BETWEEN 
        '` +
            startdate +
            `' and '` +
            enddate +
            `' 
        `
        );

        totalcount = await executeQuery(
          `  select count (A.*) from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
        COALESCE((select "branchID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
        ,COALESCE((select "designationID"  from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
        from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
        where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            `  ) as A where A."Depart" IN (` +
            departmentid +
            `) and  A."branchID" IN (` +
            branchid +
            `) and  A."visitDate" BETWEEN 
        '` +
            startdate +
            `' and '` +
            enddate +
            `' 
       `
        );
      } else if (
        userid == '' &&
        branchid != '' &&
        departmentid == '' &&
        designationid != '' &&
        startdate != '' &&
        enddate != ''
      ) {
        usermaster = await executeQuery(
          `  select A.* from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
        COALESCE((select "branchID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
        ,COALESCE((select "designationID"  from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
        from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
        where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            ` ) as A where  A."branchID" IN (` +
            branchid +
            `) and A."designationID" IN (` +
            designationid +
            `) and  A."visitDate" BETWEEN 
        '` +
            startdate +
            `' and '` +
            enddate +
            `' 
        `
        );

        totalcount = await executeQuery(
          `  select count (A.*) from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
        COALESCE((select "branchID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
        ,COALESCE((select "designationID"  from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
        from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
        where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            `  ) as A where  A."branchID" IN (` +
            branchid +
            `) and A."designationID" IN (` +
            designationid +
            `) and  A."visitDate" BETWEEN 
        '` +
            startdate +
            `' and '` +
            enddate +
            `' 
       `
        );
      } else if (
        userid == '' &&
        branchid == '' &&
        departmentid != '' &&
        designationid != '' &&
        startdate != '' &&
        enddate != ''
      ) {
        usermaster = await executeQuery(
          `  select A.* from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
        COALESCE((select "branchID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
        ,COALESCE((select "designationID"  from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
        from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
        where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            ` ) as A where A."Depart" IN (` +
            departmentid +
            `) and  A."designationID" IN (` +
            designationid +
            `) and  A."visitDate" BETWEEN 
        '` +
            startdate +
            `' and '` +
            enddate +
            `' 
        `
        );

        totalcount = await executeQuery(
          `  select count (A.*) from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
        COALESCE((select "branchID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
        ,COALESCE((select "designationID"  from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
        from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
        where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            `  ) as A where A."Depart" IN (` +
            departmentid +
            `) andA."designationID" IN (` +
            designationid +
            `) and  A."visitDate" BETWEEN 
        '` +
            startdate +
            `' and '` +
            enddate +
            `' 
       `
        );
      } else if (
        userid == '' &&
        branchid != '' &&
        departmentid != '' &&
        designationid != '' &&
        startdate != '' &&
        enddate != ''
      ) {
        usermaster = await executeQuery(
          `  select A.* from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
        COALESCE((select "branchID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
        ,COALESCE((select "designationID"  from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
        from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
        where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            ` ) as A where A."Depart" IN (` +
            departmentid +
            `) andA."branchID" IN (` +
            branchid +
            `) and A."designationID" IN (` +
            designationid +
            `) and  A."visitDate" BETWEEN 
        '` +
            startdate +
            `' and '` +
            enddate +
            `' 
        `
        );

        totalcount = await executeQuery(
          `  select count (A.*) from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
        COALESCE((select "branchID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
        ,COALESCE((select "designationID"  from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
        from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
        where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            `  ) as A where A."Depart" IN (` +
            departmentid +
            `) and  A."branchID" IN (` +
            branchid +
            `) and A."designationID" IN (` +
            designationid +
            `) and  A."visitDate" BETWEEN 
        '` +
            startdate +
            `' and '` +
            enddate +
            `' 
       `
        );
      } else {
        usermaster = await executeQuery(
          `  select A.* from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
        COALESCE((select "branchID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
        ,COALESCE((select "designationID"  from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
        from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
        where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            ` ) as A where A."Depart" IN (` +
            departmentid +
            `) and A."assignID" IN (` +
            userid +
            `) and A."branchID" IN (` +
            branchid +
            `) and A."designationID" IN (` +
            designationid +
            `) and  A."visitDate" BETWEEN 
        '` +
            startdate +
            `' and '` +
            enddate +
            `' 
        `
        );

        totalcount = await executeQuery(
          `  select count (A.*) from( select vs.*,COALESCE((select "departmentID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "Depart",
        COALESCE((select "branchID" from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "branchID"
        ,COALESCE((select "designationID"  from "attendanceTransactions" 
        where "userMasterID"=vs."assignID" ORDER BY "AttendanceDate" desc limit 1),0) as "designationID"  
        from visits as vs JOIN "userMasters" as us ON vs."assignID" = us."userMasterID" 
        where vs."status" IN (0,1) and us."companyMasterId"=` +
            companyMasterID +
            `  ) as A where A."Depart" IN (` +
            departmentid +
            `) and A."assignID" IN (` +
            userid +
            `) and A."branchID" IN (` +
            branchid +
            `) and A."designationID" IN (` +
            designationid +
            `) and  A."visitDate" BETWEEN 
        '` +
            startdate +
            `' and '` +
            enddate +
            `' 
       `
        );
      }
    }

    function padTo2Digits(num) {
      return num.toString().padStart(2, '0');
    }

    function formatDate(date) {
      return (
        [
          padTo2Digits(date.getDate()),
          padTo2Digits(date.getMonth() + 1),
          date.getFullYear(),
        ].join('-') +
        ' ' +
        [
          padTo2Digits(date.getHours()),
          padTo2Digits(date.getMinutes()),
          padTo2Digits(date.getSeconds()),
        ].join(':')
      );
    }

    function formatDate1(date) {
      return [
        padTo2Digits(date.getDate()),
        padTo2Digits(date.getMonth() + 1),
        date.getFullYear(),
      ].join('-');
    }

    for (var j = 0; j < usermaster.length; j++) {
      let coper = [];
      if (usermaster[j].coPersonID) {
        for (var k = 0; k < usermaster[j].coPersonID.length; k++) {
          let user3 = await UserMaster.findOne({
            where: {
              userMasterID: usermaster[j].coPersonID[k],
            },
          });
          coper.push(
            user3.firstName +
              ' ' +
              user3.middleName +
              ' ' +
              user3.lastName +
              '(' +
              user3.userNumber +
              ')'
          );
        }
        usermaster[j].coPersonID = coper.join();
      }
    }

    for (var n = 0; n < usermaster.length; n++) {
      let Customer = await customer.findOne({
        where: {
          customerID: usermaster[n].customerID,
        },
      });
      let Product = await product.findOne({
        where: {
          productID: usermaster[n].productID,
        },
      });
      let purpose = await visitPurpose.findOne({
        where: {
          visitPurposeID: usermaster[n].visitPurposeID,
        },
      });
      let user = await UserMaster.findOne({
        where: {
          userMasterID: usermaster[n].assignID,
        },
      });
      let visitreport = await VisitCustomizeFieldValueModel.findAll({
        where: {
          visitID: usermaster[n].visitID,
        },
      });
      let report;
      if (visitreport.length > 0) {
        report = 'Yes';
      } else {
        report = 'No';
      }

      maindata.push({
        VisitID: usermaster[n].visitID,
        UserId: usermaster[n].assignID,
        Employee: user.displayName,

        VisitDate: formatDate1(usermaster[n].visitDate),
        Coperson: usermaster[n].coPersonID,
        // CustomerCompany: tour[n].customer.companyName,
        CustomerName: Customer ? Customer.customerName : '',
        ProductName: Product ? Product.productName : '',

        VisitPurpose: purpose ? purpose.visitPurpose : '',
        CheckInDateTime: usermaster[n].checkInDateTime,
        CheckOutDateTime: usermaster[n].checkOutDateTime,
        Report: report,
        status: usermaster[n].status,
      });
    }

    res
      .status(200)
      .json({ status: 200, data: maindata, totalcount: totalcount[0].count });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 401;
    }
    next(err);
  }
};

exports.TeamVisit = async (req, res, next) => {
  try {
    let {
      limit,
      page,
      startdate,
      enddate,
      status,
      filter,
      userMasterID,
      exportData,
    } = await req.body;
    const includeData = [
      {
        required: false,
        model: CompanyMasterModel,
        attributes: ['companyName', 'companyAddress'],
      },
      {
        required: false,
        model: Customer,
        attributes: [
          'companyName',
          'customerName',
          'currentLocation',
          'mobileNumber1',
        ],
      },
      {
        required: false,
        model: Product,
        attributes: ['productID', 'productName', 'companyMasterID'],
      },
      {
        required: false,
        model: VisitPurpose,
        attributes: ['visitPurposeID', 'visitPurpose', 'companyMasterID'],
      },
      {
        required: false,
        model: UserMaster,
        as: 'createdByUserDetails',
        attributes: userAttributes,
      },
      {
        required: false,
        model: UserMaster,
        as: 'updatedByUserDetails',
        attributes: userAttributes,
      },
      {
        required: true,
        model: UserMaster,
        as: 'assign',
        attributes: userAttributes,
        include: [
          {
            required: false,
            model: EmployeeJoiningDetails,
            attributes: ['employeeCode'],
          },
        ],
      },
      {
        required: false,
        model: visitFormCustomizeValues,
        include: [
          {
            required: false,
            model: VisitFormCustomize,
            include: [{ model: CompanyMasterModel }],
          },
        ],
      },
      // {
      //   required: false,
      //   model: VisitReportCustomizeValue,
      //   include: [
      //     {
      //       required : false,
      //       model: VisitReportCustomize,
      //       include: [{ model: CompanyMasterModel }],
      //     },
      //   ],
      // },
    ];

    const condition = {};
    condition.status = ['0', '1'];
    if (userMasterID && userMasterID.length > 0) {
      condition.assignID = userMasterID;
    }

    if (filter == 'true') {
      if (status != '3') {
        condition.checkInDateTime = {
          [Sequelize.Op.is]: null,
        };
        condition.checkOutDateTime = {
          [Sequelize.Op.is]: null,
        };
      }
      if (startdate && enddate) {
        condition.visitDate = {
          [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
        };
      }
    }

    const paginationQuery = {};
    if (page && limit && !exportData) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }
    const order = [
      ['visitDate', 'DESC'],
      ['visitID', 'DESC'],
    ];
    const { rows: teamVisitData, count } = await Visit.findAndCountAll({
      // raw: true,
      where: condition,
      ...paginationQuery,
      order,
      include: includeData,
    });

    const visitCopersonIDs = new Set();
    const visitIDs = new Set();
    for (const visit of teamVisitData) {
      visitIDs.add(visit.visitID);
      for (let person of visit.coPersonID) {
        visitCopersonIDs.add(+person);
      }
    }

    const [visitCopersonUserData, findVisitCustomizeField] = await Promise.all([
      await UserMaster.findAll({
        where: {
          userMasterID: [...visitCopersonIDs],
        },
        attributes: userAttributes,
      }),
      visitFormCustomizeValues.findAll({
        where: {
          visitID: [...visitIDs],
        },
        attributes: ['visitID', 'value'],
        include: [
          {
            model: VisitFormCustomize,
            include: [{ model: CompanyMasterModel }],
          },
        ],
      }),
    ]);

    const allVisitMainData = [];
    for (const visit of teamVisitData) {
      if (visit.createBy) {
        visit.createById = visit.createBy;
        if (
          visit.assignID == +visit.createBy ||
          +visit.createBy == userMasterID
        ) {
          visit.dataValues.editvisit = true;
        } else {
          visit.dataValues.editvisit = false;
        }
        visit.createBy = visit.createdByUserDetails.displayName;
      }

      if (visit.updateBy !== null) {
        visit.updateBy = visit.updatedByUserDetails.displayName;
      }
      // Set For Co-Person Name And Number
      const coperson = [];
      for (const person of visit.coPersonID) {
        const user = visitCopersonUserData.find(
          (e) => e.userMasterID == +person
        );
        coperson.push(user.displayName + '(' + user.userNumber + ')');
      }
      visit.coPersonID = coperson.join();

      let employeeCode = '';
      if (visit.assign) {
        if (
          visit.assign.employeeJoiningDetails &&
          visit.assign.employeeJoiningDetails.length > 0
        ) {
          if (visit.assign.employeeJoiningDetails[0].employeeCode) {
            employeeCode = visit.assign.employeeJoiningDetails[0].employeeCode;
          }
        }
      }
      // Formate Visit Date
      const formattedVisitDate = asiaKolkataDateTime(visit.visitDate)
        .slice(0, 10)
        .split('-')
        .reverse()
        .join('-');

      if (
        visit.visitReportCustomizeValue &&
        visit.visitReportCustomizeValue.length > 0
      ) {
        visit.report = 'Yes';
      } else {
        visit.report = 'No';
      }

      allVisitMainData.push({
        VisitID: visit.visitID,
        EmployeeCode: employeeCode,
        UserId: visit.assign.userMasterID,
        assigneduserMasterID: visit.assign.userMasterID,
        Employee:
          visit.assign.displayName + ' (' + visit.assign.userNumber + ')',
        Coperson: visit.coPersonID,
        CustomerCompany: visit.customer ? visit.customer.companyName : '',
        CustomerContact: visit.customer
          ? visit.customer.customerName +
            ' (' +
            visit.customer.mobileNumber1 +
            ')'
          : '',
        CustomerAddress: visit.customer ? visit.customer.currentLocation : '',
        Product: visit.product != undefined ? visit.product.productName : '',
        VisitPurpose:
          visit.visitPurpose != undefined
            ? visit.visitPurpose.visitPurpose
            : '',
        VisitDate: formattedVisitDate,
        VisitTime: visit.visitTime,
        // CheckInDateTime:
        //   visit.checkInDateTime != null
        //     ? moment(visit.checkInDateTime, 'YYYY-MM-DD HH:mm:ss').format(
        //         'DD-MM-YYYY hh:mm A'
        //       )
        //     : '',
        CheckInDateTime:
          visit.checkInDateTime != null
            ? moment(visit.checkInDateTime, 'YYYY-MM-DD HH:mm:ss')
                .subtract(5, 'hours') // Subtract 5 hours
                .subtract(30, 'minutes') // Subtract 30 minutes
                .format('DD-MM-YYYY hh:mm A')
            : '',
        CheckInLocation:
          visit.checkInLocation != null ? visit.checkInLocation : '',
        // CheckOutDateTime:
        //   visit.checkOutDateTime != null
        //     ? moment(visit.checkOutDateTime, 'YYYY-MM-DD HH:mm:ss')
        //         .subtract(5, 'hours') // Subtract 5 hours
        //         .subtract(30, 'minutes') // Subtract 30 minutes
        //         .format('DD-MM-YYYY hh:mm A')
        //     : '',
        CheckOutDateTime:
          visit.checkOutDateTime != null
            ? moment(visit.checkOutDateTime, 'YYYY-MM-DD HH:mm:ss')
                .subtract(5, 'hours') // Subtract 5 hours
                .subtract(30, 'minutes') // Subtract 30 minutes
                .format('DD-MM-YYYY hh:mm A')
            : '',
        CheckOutLocation:
          visit.checkOutLocation != null ? visit.checkOutLocation : '',
        visitFormCustomizeValue:
          visit.visitFormCustomizeValues &&
          visit.visitFormCustomizeValues.length > 0
            ? visit.visitFormCustomizeValues
            : [],
        // visitReportCustomizeValue:
        //   visit.visitReportCustomizeValues &&
        //   visit.visitReportCustomizeValues.length > 0
        //     ? visit.visitReportCustomizeValues
        //     : [],
      });
    }

    if (exportData) {
      const finalData = [];

      // Helper function to process customize values
      const processCustomizeValues = (items, key, outputKey) => {
        items.forEach((item) => {
          item[outputKey] = [];
          const customizeValues = item[key] || [];
          customizeValues.forEach(
            ({ visitID, value, visitFormCustomize, visitReportCustomize }) => {
              if (item.VisitID === visitID) {
                const isImage =
                  typeof value === 'string' && value.length > 200
                    ? "it's image visitreportSeperate"
                    : value + ' visitreportSeperate';
                const fieldLabel =
                  visitFormCustomize?.fieldLabel ||
                  visitReportCustomize?.fieldLabel;
                if (fieldLabel) {
                  item[outputKey].push({ value: isImage, fieldLabel });
                }
              }
            }
          );
        });
      };

      // Process visitFormCustomizeValue and visitReportCustomizeValue
      processCustomizeValues(
        allVisitMainData,
        'visitFormCustomizeValue',
        'visitreport'
      );

      const generateResultString = (fields) => {
        const fieldData = {};
        fields.forEach(({ value, fieldLabel }) => {
          fieldData[fieldLabel] = value;
        });
        return Object.entries(fieldData)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ');
      };

      // Build final data for export
      allVisitMainData.forEach((visitItem, i) => {
        const visitFormCustomizeValueResult = visitItem.visitreport
          ? generateResultString(visitItem.visitreport)
          : '';

        const data = {
          'Employee Code': visitItem.EmployeeCode,
          Name: visitItem.Employee,
          'Co-Person': visitItem.Coperson,
          'Visit Date': visitItem.VisitDate,
          Time: visitItem.VisitTime,
          'Check-In-DateTime': visitItem.CheckInDateTime,
          'Check-In-Location': visitItem.CheckInLocation,
          'Check-Out-DateTime': visitItem.CheckOutDateTime,
          'Check-Out-Location': visitItem.CheckOutLocation,
          Product: visitItem.Product,
          'Visit Purpose': visitItem.VisitPurpose,
          Customer: visitItem.CustomerContact,
          "Customer's Company": visitItem.CustomerCompany,
          "Customer's Address": visitItem.CustomerAddress,
          'Customize Fields': visitFormCustomizeValueResult,
          // "Report Customize Fields": visitReportCustomizeValue,
        };

        finalData.push(data);
      });

      await generateExcelForVisitReport(finalData, 'Visit', 'xlsx', res);
      return;
    }

    return res.status(200).json({
      status: 200,
      customFileds:
        findVisitCustomizeField && findVisitCustomizeField.length > 0
          ? findVisitCustomizeField
          : [],
      data: teamVisitData,
      totalcount: count,
    });
  } catch (err) {
    next(err);
  }
};
