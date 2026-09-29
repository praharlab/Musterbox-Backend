const toursMaster = require('../models/toursMaster');
const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const logger = require('../config/logger');
const message = require('../response_message/message');
const companyMaster = require('../models/companyMaster');
const UserMaster = require('../models/userMaster');
const Notification = require('../config/firebase');
const { executeQuery } = require('./common.controller');
const EmployeeDepartment = require('../models/employeeDepartment');
const EmployeeDesignation = require('../models/employeeDesignation');
const EmployeeBranch = require('../models/employeeBranch');
const {
  sendNotification,
  asiaKolkataDateTime,
} = require('../utils/commonUtilFunctions');
const { accessibleUsers } = require('../utils/commonUtilFunctions');
const Designation = require('../models/designation');
const Department = require('../models/department');
const BranchMaster = require('../models/branchMaster');
const { user } = require('../config/erpdatabase');
const { userAttributes } = require('../utils/commonVars');
const { generateExcel } = require('../utils/exportData');

exports.postAddtoursMaster = async (req, res, next) => {
  try {
    let {
      ToursName,
      FromDate,
      ToDate,
      TotalDays,
      CoPersonId,
      Description,
      userMasterID,
    } = await req.body;

    await toursMaster.create({
      ToursName,
      FromDate,
      ToDate,
      TotalDays,
      CoPersonId,
      Description,
      UserMasterID: userMasterID,
      createBy: req.userDetails.userMasterId,
      createByIp: req.userDetails.userIpAddress,
    });

    const notification = {
      title: 'Tour',
      body: 'Tour Assigned you successfully',
    };
    const data = {
      screen: 'tour',
    };

    sendNotification(userMasterID, notification, data);

    return res.status(200).json({
      status: 200,
      message: message.usermessage.toursMasteradd,
    });
  } catch (err) {
    next(err);
  }
};

// return all toursMaster data
exports.postViewtoursMaster = async (req, res, next) => {
  try {
    let { limit, page } = await req.body;
    let offset = (page - 1) * limit;
    let toursMaster_data;
    if (limit == '' && page == '') {
      toursMaster_data = await toursMaster.findAll({
        order: [['FromDate', 'ASC']],
        where: {
          status: {
            [Sequelize.Op.in]: [0, 1],
          },
        },
        include: [{ all: true, nested: true }],
      });
    } else {
      toursMaster_data = await toursMaster.findAll({
        //raw: true,
        limit: limit,
        offset: offset,
        order: [['FromDate', 'ASC']],
        where: {
          status: {
            [Sequelize.Op.in]: [0, 1],
          },
        },

        include: [{ all: true, nested: true }],
      });
    }
    const totalcount = await toursMaster.count({
      // raw: true,
      where: { status: ['0', '1'] },
    });

    for (var i = 0; i < toursMaster_data.length; i++) {
      if (toursMaster_data[i].CoPersonId != null) {
        for (var j = 0; j < toursMaster_data[i].CoPersonId.length; j++) {
          let temp_data = await UserMaster.findOne({
            where: {
              userMasterID: toursMaster_data[i].CoPersonId[j],
            },
          });
          toursMaster_data[i].CoPersonId[j] = {
            UserMasterID: toursMaster_data[i].CoPersonId[j],
            Name:
              temp_data.firstName +
              ' ' +
              temp_data.middleName +
              ' ' +
              temp_data.lastName,
          };
        }
      }
    }

    return res
      .status(200)
      .json({ status: 200, data: toursMaster_data, totalcount: totalcount });
  } catch (err) {
    next(err);
  }
};

// to add transaction section in this
exports.postUpdatetoursMaster = async (req, res, next) => {
  try {
    let {
      ToursMasterID,
      ToursName,
      FromDate,
      ToDate,
      TotalDays,
      CoPersonId,
      Description,
      userMasterID,
      Authorization,
    } = await req.body;

    await toursMaster.update(
      {
        ToursName,
        FromDate,
        ToDate,
        TotalDays,
        CoPersonId,
        Description,
        UserMasterID: userMasterID,
        Authorization,
        updateBy: req.userDetails.userMasterId,
        updateByIp: req.userDetails.userIpAddress,
      },
      {
        where: {
          ToursMasterID: ToursMasterID,
        },
      }
    );

    return res
      .status(200)
      .json({ status: 200, message: message.usermessage.toursMasterupdate });
  } catch (err) {
    next(err);
  }
};

exports.posttoursMasterById = async (req, res, next) => {
  try {
    var data = await toursMaster.findOne({
      where: {
        ToursMasterID: req.params.id,
        status: 1,
      },
      include: [{ model: UserMaster, as: 'assign' }],
    });

    if (data != null && data.CoPersonId != null) {
      for (var j = 0; j < data.CoPersonId.length; j++) {
        console.log(data.CoPersonId[j]);
        let temp_data = await UserMaster.findOne({
          where: {
            userMasterID: data.CoPersonId[j],
          },
        });
        data.CoPersonId[j] = {
          UserMasterID: data.CoPersonId[j],
          Name:
            temp_data.firstName +
            ' ' +
            temp_data.middleName +
            ' ' +
            temp_data.lastName,
          userNumber: temp_data.userNumber,
        };
      }
    }

    if (!data) {
      return res
        .status(200)
        .json({ status: 200, message: message.usermessage.deletedrecord });
    } else {
      return res.status(200).json({ status: 200, data: data });
    }
  } catch (err) {
    next(err);
  }
};

exports.getDeletetoursMasterById = async (req, res, next) => {
  try {
    const id = req.params.id;
    await toursMaster.update(
      {
        status: 2,
      },
      {
        where: { ToursMasterID: id },
      }
    );

    return res
      .status(200)
      .json({ status: 200, message: message.usermessage.toursMasterdelete });
  } catch (err) {
    next(err);
  }
};

exports.postchangestatus = async (req, res, next) => {
  try {
    const { ToursMasterID, status } = await req.body;

    if (status != '0' && status != '1') {
      return res
        .status(200)
        .json({ status: 401, message: 'Pass Valid Status' });
    }

    await toursMaster.update(
      {
        status,
      },
      {
        where: { ToursMasterID: ToursMasterID },
      }
    );

    return res.status(200).json({
      status: 200,
      message:
        status == '0'
          ? message.usermessage.deactiveMessage('Tour')
          : message.usermessage.activeMessage('Tour'),
    });
  } catch (err) {
    next(err);
  }
};

exports.gettouruserid = async (req, res, next) => {
  try {
    const { limit, page, searchQuery, startdate, enddate, userMasterID } =
      await req.body;
    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }
    const condition = { UserMasterID: userMasterID, status: [0, 1] };
    if (startdate && enddate)
      condition.createdAt = {
        [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
      };

    if (searchQuery)
      condition[Sequelize.Op.or] = [
        {
          ToursName: { [Sequelize.Op.iLike]: '%' + searchQuery + '%' },
        },
      ];

    const TourMasterData = await toursMaster.findAndCountAll({
      where: condition,
      ...paginationQuery,
      order: [['FromDate', 'ASC']],
      include: [
        {
          model: UserMaster,
          as: 'assign',
          required: true,
          ...accessibleUsers(req.userDetails),
        },
        {
          model: UserMaster,
          as: 'createByUser',
          attributes: ['displayName'],
        },
        {
          model: UserMaster,
          as: 'updateByUser',
          attributes: ['displayName'],
        },
      ],
    });
    for (var j = 0; j < TourMasterData.rows.length; j++) {
      if (TourMasterData.rows[j].CoPersonId != null) {
        for (var k = 0; k < TourMasterData.rows[j].CoPersonId.length; k++) {
          let copersonuser = await UserMaster.findOne({
            where: {
              userMasterID: Number(TourMasterData.rows[j].CoPersonId[k]),
            },
            attributes: ['userMasterID', 'displayName', 'userNumber'],
          });
          TourMasterData.rows[j].CoPersonId[k] = copersonuser;
        }
      }
    }

    return res.status(200).json({
      status: 200,
      data: TourMasterData.rows,
      totalcount: TourMasterData.count,
    });
  } catch (err) {
    next(err);
  }
};

exports.gettourdatabycompanyid = async (req, res, next) => {
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
      Export,
    } = await req.body;

    if (!companyMasterID) {
      return res.status(200).json({
        status: 401,
        message: message.usermessage.ValidParameters,
      });
    }

    const paginationQuery = {};
    if (page && limit && !Export) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }
    const filterDate = asiaKolkataDateTime(new Date()).slice(0, 10);

    let maindata = [];
    const condition = {};
    condition.status = 1;
    if (startdate && enddate) {
      condition.FromDate = {
        [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
      };
      condition.ToDate = {
        [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
      };
    }

    if (userMasterID) condition.UserMasterID = userMasterID;

    const { rows: usermaster, count } = await toursMaster.findAndCountAll({
      where: condition,
      ...paginationQuery,
      include: [
        {
          model: UserMaster,
          as: 'assign',
          where: {
            companyMasterId: companyMasterID,
          },
          ...accessibleUsers(req.userDetails),
          include: [
            {
              model: EmployeeDesignation,
              where: {
                status: 1,
                ...(designationid &&
                  (!Array.isArray(designationid) || designationid.length) && {
                    designationID: designationid,
                  }),
                applicableDate: { [Sequelize.Op.lte]: new Date(filterDate) },
                [Sequelize.Op.or]: [
                  { endDate: { [Sequelize.Op.gte]: new Date(filterDate) } },
                  { endDate: { [Sequelize.Op.eq]: null } },
                ],
              },
              required: designationid && designationid.length ? true : false,
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
                ...(departmentid &&
                  (!Array.isArray(departmentid) || departmentid.length) && {
                    departmentID: departmentid,
                  }),
                applicableDate: { [Sequelize.Op.lte]: new Date(filterDate) },
                [Sequelize.Op.or]: [
                  { endDate: { [Sequelize.Op.gte]: new Date(filterDate) } },
                  { endDate: { [Sequelize.Op.eq]: null } },
                ],
              },
              required: departmentid && departmentid.length ? true : false,
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
                ...(branchMasterID &&
                  (!Array.isArray(branchMasterID) || branchMasterID.length) && {
                    branchID: branchMasterID,
                  }),
                applicableDate: { [Sequelize.Op.lte]: new Date(filterDate) },
                [Sequelize.Op.or]: [
                  { endDate: { [Sequelize.Op.gte]: new Date(filterDate) } },
                  { endDate: { [Sequelize.Op.eq]: null } },
                ],
              },
              required: branchMasterID && branchMasterID.length ? true : false,
              attributes: ['branchID'],
              include: [
                {
                  model: BranchMaster,
                  as: 'branchMaster',
                  attributes: ['branchName'],
                },
              ],
            },
          ],
        },
      ],
      order: [['FromDate', 'DESC']],
    });
    const uniqueCoPersonIds = new Set(); // Collect unique IDs

    for (let j = 0; j < usermaster.length; j++) {
      if (usermaster[j].CoPersonId) {
        usermaster[j].CoPersonId.forEach((id) => uniqueCoPersonIds.add(id));
      }
    }

    // If needed, convert Set to array
    const uniqueCoPersonIdArray = Array.from(uniqueCoPersonIds);
    const findallUserData = await UserMaster.findAll({
      where: {
        userMasterID: uniqueCoPersonIdArray,
      },
      attributes: userAttributes,
    });
    for (let n = 0; n < usermaster.length; n++) {
      let coper = [];

      if (usermaster[n].CoPersonId) {
        for (let k = 0; k < usermaster[n].CoPersonId.length; k++) {
          const findUser = findallUserData.find(
            (user) => user.userMasterID === +usermaster[n].CoPersonId[k]
          );
          coper.push(findUser.displayName + '(' + findUser.userNumber + ')');
        }
      }

      const data = {
        Employee: usermaster[n].assign?.displayName || '',
        Number: usermaster[n].assign?.userNumber || '',
        Branch:
          usermaster[n].assign?.employeeBranches?.[0]?.branchMaster
            ?.branchName || '',
        Department:
          usermaster[n].assign?.employeeDepartments?.[0]?.department
            ?.departmentName || '',
        Designation:
          usermaster[n].assign?.employeeDesignations?.[0]?.designation
            ?.designationName || '',
        TourName: usermaster[n].ToursName,
        TourFromDate:
          String(usermaster[n].FromDate)?.split('-').reverse().join('-') || '',
        TourEndDate:
          String(usermaster[n].ToDate)?.split('-').reverse().join('-') || '',
        TotalDays: usermaster[n].TotalDays,
        Coperson: coper.join(','),
      };

      if (!Export) {
        data.TourID = usermaster[n].ToursMasterID;
        data.UserId = usermaster[n].UserMasterID;
      }
      maindata.push(data);
    }

    if (Export)
      return await generateExcel(maindata, 'Tour Report', 'xlsx', res);

    return res.status(200).json({
      status: 200,
      data: maindata,
      totalcount: count,
    });
  } catch (err) {
    next(err.message);
  }
};
