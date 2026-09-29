const Sequelize = require('sequelize');
const AnnouncementModel = require('../models/announcement');
const sequelize = require('../config/database');
const message = require('../response_message/message');
const UserMaster = require('../models/userMaster');
const EmployeeBranch = require('../models/employeeBranch');
const EmployeeDesignation = require('../models/employeeDesignation');
const EmployeeDepartment = require('../models/employeeDepartment');
const UserAnnouncement = require('../models/userAnnouncement');
const {
  sendNotification,
  accessibleUsers,
} = require('../utils/commonUtilFunctions');
const BranchMaster = require('../models/branchMaster');
const Designation = require('../models/designation');
const Department = require('../models/department');
const { convert } = require('html-to-text');
const companyMaster = require('../models/companyMaster');

exports.postAddAnnouncement = async (req, res, next) => {
  try {
    let {
      announcement,
      announcementDate,
      companyMasterID,
      branchMasterID,
      designationId,
      departmentId,
      gender,
    } = await req.body;
    const createBy = req.userDetails.userMasterId;
    const createByIp = req.userDetails.userIpAddress;
    let attachment = '';
    let announcementID;
    let user = [];
    let ft = [];

    if (req.file) {
      attachment = req.file.filename;
    }

    if (branchMasterID == 'null') {
      branchMasterID = null;
    }

    if (designationId == 'null') {
      designationId = null;
    }

    if (departmentId == 'null') {
      departmentId = null;
    }

    let result = await sequelize.transaction(async (t) => {
      let insert_db_status = await AnnouncementModel.create(
        {
          announcement,
          announcementDate,
          attachment,
          companyMasterID,
          branchMasterID,
          designationId,
          departmentId,
          gender,
          createBy,
          createByIp,
        },
        { transaction: t }
      );

      announcementID = insert_db_status.announcementID;
      //company
      if (
        companyMasterID &&
        !branchMasterID &&
        !designationId &&
        !departmentId
      ) {
        let user1 = await UserMaster.findAll({
          where: {
            companyMasterId: companyMasterID,
            status: 1,
          },
          order: [['userMasterID', 'ASC']],
        });
        for (var i = 0; i < user1.length; i++) {
          if (user1[i]['employee.gender'] == gender) {
            user.push(user1[i].userMasterID);
            ft.push(user1[i]['employee.firebaseToken']);
          } else if (gender == 'all') {
            user.push(user1[i].userMasterID);
            ft.push(user1[i]['employee.firebaseToken']);
          }
        }
      }
      //company-branch
      else if (
        companyMasterID &&
        branchMasterID &&
        !designationId &&
        !departmentId
      ) {
        let user1 = await EmployeeBranch.findAll({
          raw: true,
          where: {
            status: 1,
            branchID: branchMasterID,
            applicableDate: {
              [Sequelize.Op.lte]: new Date(),
            },
            [Sequelize.Op.or]: [
              {
                endDate: { [Sequelize.Op.gte]: new Date() },
              },
              {
                endDate: { [Sequelize.Op.eq]: null },
              },
            ],
          },
          order: [['userMasterID', 'ASC']],
          include: { model: UserMaster, as: 'employee' },
        });
        for (var i = 0; i < user1.length; i++) {
          if (user1[i]['employee.gender'] == gender) {
            user.push(user1[i].userMasterID);
            ft.push(user1[i]['employee.firebaseToken']);
          } else if (gender == 'all') {
            user.push(user1[i].userMasterID);
            ft.push(user1[i]['employee.firebaseToken']);
          }
        }
      }
      //company-designation
      else if (
        companyMasterID &&
        !branchMasterID &&
        designationId &&
        !departmentId
      ) {
        let user1 = await EmployeeDesignation.findAll({
          raw: true,
          where: {
            status: 1,
            designationID: designationId,
            applicableDate: {
              [Sequelize.Op.lte]: new Date(),
            },
            [Sequelize.Op.or]: [
              {
                endDate: { [Sequelize.Op.gte]: new Date() },
              },
              {
                endDate: { [Sequelize.Op.eq]: null },
              },
            ],
          },
          order: [['userMasterID', 'ASC']],
          include: { model: UserMaster, as: 'employee' },
        });
        for (var i = 0; i < user1.length; i++) {
          if (user1[i]['employee.gender'] == gender) {
            user.push(user1[i].userMasterID);
            ft.push(user1[i]['employee.firebaseToken']);
          } else if (gender == 'all') {
            user.push(user1[i].userMasterID);
            ft.push(user1[i]['employee.firebaseToken']);
          }
        }
      }
      //company-department
      else if (
        companyMasterID &&
        !branchMasterID &&
        !designationId &&
        departmentId
      ) {
        let user1 = await EmployeeDepartment.findAll({
          raw: true,
          where: {
            status: 1,
            departmentID: departmentId,
            applicableDate: {
              [Sequelize.Op.lte]: new Date(),
            },
            [Sequelize.Op.or]: [
              {
                endDate: { [Sequelize.Op.gte]: new Date() },
              },
              {
                endDate: { [Sequelize.Op.eq]: null },
              },
            ],
          },
          include: { model: UserMaster, as: 'employee' },
          order: [['userMasterID', 'ASC']],
        });
        for (var i = 0; i < user1.length; i++) {
          if (user1[i]['employee.gender'] == gender) {
            user.push(user1[i].userMasterID);
            ft.push(user1[i]['employee.firebaseToken']);
          } else if (gender == 'all') {
            user.push(user1[i].userMasterID);
            ft.push(user1[i]['employee.firebaseToken']);
          }
        }
      }
      //company-branch-department
      else if (
        companyMasterID &&
        branchMasterID &&
        !designationId &&
        departmentId
      ) {
        let branch = await EmployeeBranch.findAll({
          raw: true,
          where: {
            status: 1,
            branchID: branchMasterID,
            applicableDate: {
              [Sequelize.Op.lte]: new Date(),
            },
            [Sequelize.Op.or]: [
              {
                endDate: { [Sequelize.Op.gte]: new Date() },
              },
              {
                endDate: { [Sequelize.Op.eq]: null },
              },
            ],
          },
          order: [['userMasterID', 'ASC']],
        });
        let temp = [];
        for (var i = 0; i < branch.length; i++) {
          temp.push(branch[i].userMasterID);
        }

        let dept = await EmployeeDepartment.findAll({
          raw: true,
          where: {
            status: 1,
            departmentID: departmentId,
            userMasterID: {
              [Sequelize.Op.in]: temp,
            },
            applicableDate: {
              [Sequelize.Op.lte]: new Date(),
            },
            [Sequelize.Op.or]: [
              {
                endDate: { [Sequelize.Op.gte]: new Date() },
              },
              {
                endDate: { [Sequelize.Op.eq]: null },
              },
            ],
          },
          include: { model: UserMaster, as: 'employee' },
          order: [['userMasterID', 'ASC']],
        });

        for (var i = 0; i < dept.length; i++) {
          if (dept[i]['employee.gender'] == gender) {
            user.push(dept[i].userMasterID);
            ft.push(dept[i]['employee.firebaseToken']);
          } else if (gender == 'all') {
            user.push(dept[i].userMasterID);
            ft.push(dept[i]['employee.firebaseToken']);
          }
        }
      }
      //company-branch-designation
      else if (
        companyMasterID &&
        branchMasterID &&
        designationId &&
        !departmentId
      ) {
        let branch = await EmployeeBranch.findAll({
          raw: true,
          where: {
            status: 1,
            branchID: branchMasterID,
            applicableDate: {
              [Sequelize.Op.lte]: new Date(),
            },
            [Sequelize.Op.or]: [
              {
                endDate: { [Sequelize.Op.gte]: new Date() },
              },
              {
                endDate: { [Sequelize.Op.eq]: null },
              },
            ],
          },
          order: [['userMasterID', 'ASC']],
        });
        let temp = [];
        for (var i = 0; i < branch.length; i++) {
          temp.push(branch[i].userMasterID);
        }
        let desig = await EmployeeDesignation.findAll({
          raw: true,
          where: {
            status: 1,
            designationID: designationId,
            userMasterID: {
              [Sequelize.Op.in]: temp,
            },
            applicableDate: {
              [Sequelize.Op.lte]: new Date(),
            },
            [Sequelize.Op.or]: [
              {
                endDate: { [Sequelize.Op.gte]: new Date() },
              },
              {
                endDate: { [Sequelize.Op.eq]: null },
              },
            ],
          },
          include: { model: UserMaster, as: 'employee' },
          order: [['userMasterID', 'ASC']],
        });
        for (var i = 0; i < desig.length; i++) {
          if (desig[i]['employee.gender'] == gender) {
            user.push(desig[i].userMasterID);
            ft.push(desig[i]['employee.firebaseToken']);
          } else if (gender == 'all') {
            user.push(desig[i].userMasterID);
            ft.push(desig[i]['employee.firebaseToken']);
          }
        }
      }
      //company-department-designation
      else if (
        companyMasterID &&
        !branchMasterID &&
        designationId &&
        departmentId
      ) {
        let dept = await EmployeeDepartment.findAll({
          raw: true,
          where: {
            status: 1,
            departmentID: departmentId,
            applicableDate: {
              [Sequelize.Op.lte]: new Date(),
            },
            [Sequelize.Op.or]: [
              {
                endDate: { [Sequelize.Op.gte]: new Date() },
              },
              {
                endDate: { [Sequelize.Op.eq]: null },
              },
            ],
          },
          order: [['userMasterID', 'ASC']],
        });
        let temp = [];
        for (var i = 0; i < dept.length; i++) {
          temp.push(dept[i].userMasterID);
        }
        let desig = await EmployeeDesignation.findAll({
          raw: true,
          where: {
            status: 1,
            designationID: designationId,
            userMasterID: {
              [Sequelize.Op.in]: temp,
            },
            applicableDate: {
              [Sequelize.Op.lte]: new Date(),
            },
            [Sequelize.Op.or]: [
              {
                endDate: { [Sequelize.Op.gte]: new Date() },
              },
              {
                endDate: { [Sequelize.Op.eq]: null },
              },
            ],
          },
          include: { model: UserMaster, as: 'employee' },
          order: [['userMasterID', 'ASC']],
        });
        for (var i = 0; i < desig.length; i++) {
          if (desig[i]['employee.gender'] == gender) {
            user.push(desig[i].userMasterID);
            ft.push(desig[i]['employee.firebaseToken']);
          } else if (gender == 'all') {
            user.push(desig[i].userMasterID);
            ft.push(desig[i]['employee.firebaseToken']);
          }
        }
      }
      //all
      else if (
        companyMasterID &&
        branchMasterID &&
        designationId &&
        departmentId
      ) {
        let branch = await EmployeeBranch.findAll({
          raw: true,
          where: {
            status: 1,
            branchID: branchMasterID,
            applicableDate: {
              [Sequelize.Op.lte]: new Date(),
            },
            [Sequelize.Op.or]: [
              {
                endDate: { [Sequelize.Op.gte]: new Date() },
              },
              {
                endDate: { [Sequelize.Op.eq]: null },
              },
            ],
          },
          order: [['userMasterID', 'ASC']],
        });
        let temp1 = [];
        for (var i = 0; i < branch.length; i++) {
          temp1.push(branch[i].userMasterID);
        }
        let dept = await EmployeeDepartment.findAll({
          raw: true,
          where: {
            status: 1,
            departmentID: departmentId,
            userMasterID: {
              [Sequelize.Op.in]: temp1,
            },
            applicableDate: {
              [Sequelize.Op.lte]: new Date(),
            },
            [Sequelize.Op.or]: [
              {
                endDate: { [Sequelize.Op.gte]: new Date() },
              },
              {
                endDate: { [Sequelize.Op.eq]: null },
              },
            ],
          },
          order: [['userMasterID', 'ASC']],
        });
        let temp = [];
        for (var i = 0; i < dept.length; i++) {
          temp.push(dept[i].userMasterID);
        }
        let desig = await EmployeeDesignation.findAll({
          raw: true,
          where: {
            status: 1,
            designationID: designationId,
            userMasterID: {
              [Sequelize.Op.in]: temp,
            },
            applicableDate: {
              [Sequelize.Op.lte]: new Date(),
            },
            [Sequelize.Op.or]: [
              {
                endDate: { [Sequelize.Op.gte]: new Date() },
              },
              {
                endDate: { [Sequelize.Op.eq]: null },
              },
            ],
          },
          include: { model: UserMaster, as: 'employee' },
          order: [['userMasterID', 'ASC']],
        });
        for (var i = 0; i < desig.length; i++) {
          if (desig[i]['employee.gender'] == gender) {
            user.push(desig[i].userMasterID);
            ft.push(desig[i]['employee.firebaseToken']);
          } else if (gender == 'all') {
            user.push(desig[i].userMasterID);
            ft.push(desig[i]['employee.firebaseToken']);
          }
        }
      }
      // convert html to Normal Text
      req.body.announcement = convert(req.body.announcement);
      for (var i = 0; i < ft.length; i++) {
        const notification = {
          title: 'Announcement',
          body: req.body.announcement,
          // isScheduled: 'true',
          // scheduledTime: req.body.announcementDate,
        };
        const data = {
          screen: 'announcement',
          isScheduled: 'true',
          scheduledTime: req.body.announcementDate,
        };
        await sendNotification(user[i], notification, data);
      }

      let result1 = user.map((userID) => ({
        announcementID: announcementID,
        userMasterID: userID,
        createBy: createBy,
        createByIp: createByIp,
      }));
      //saving userId in UserAnnouncement table
      let insertData = await UserAnnouncement.bulkCreate(result1, {
        transaction: t,
      });

      ft = [];
      user = []; //array being empty
      return res.status(200).json({
        status: 200,
        message: message.usermessage.announcementadd,
        data: insert_db_status,
      });
    });
  } catch (err) {
    next(err);
  }
};

exports.getAnnouncementByUserId = async (req, res, next) => {
  try {
    const { page, limit, userMasterID } = await req.body;
    const updateBy = req.userDetails.userMasterId;
    const updateByIp = req.userDetails.userIpAddress;
    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }
    const announcement = await UserAnnouncement.findAll({
      raw: true,
      where: {
        userMasterID: userMasterID,
        readstatus: ['0', '1'],
      },
      ...paginationQuery,

      include: [
        {
          model: AnnouncementModel,
        },
        {
          model: UserMaster,
          required: true,
          ...accessibleUsers(req.userDetails),
        },
      ],
      order: [[{ model: AnnouncementModel }, 'announcementDate', 'DESC']],
    });

    await UserAnnouncement.update(
      {
        readstatus: 1,
        updateBy,
        updateByIp,
      },
      {
        where: {
          userMasterID: userMasterID,
          readstatus: 0,
        },
      }
    );

    let responseData = announcement.map((item) => {
      return {
        announcementID: item.announcementID,
        announcement: item['announcement.announcement'],
        announcementDate: item['announcement.announcementDate'],
        attachment: item['announcement.attachment'],
        userMasterID: item.userMasterID,
        companyMasterID: item['announcement.companyMasterID'],
        status: item['announcement.status'],
        createBy: item['announcement.createBy'],
        createByIp: item['announcement.createByIp'],
        updateBy: item['announcement.updateBy'],
        updateByIp: item['announcement.updateByIp'],
        createdAt: item['announcement.createdAt'],
        updatedAt: item['announcement.updatedAt'],
      };
    });

    return res.status(200).json({
      status: 200,
      message: message.usermessage.fetchMessage('Announcement'),
      data: responseData,
    });
  } catch (err) {
    next(err);
  }
};

exports.countUnreadAnnouncement = async (req, res, next) => {
  try {
    let { userMasterID } = await req.body;
    let totalcount = await UserAnnouncement.count({
      raw: true,
      where: {
        userMasterID: userMasterID,
        readstatus: 0,
      },
      include: [
        {
          model: UserMaster,
          required: true,
          ...accessibleUsers(req.userDetails),
        },
      ],
    });
    res.status(200).json({
      status: 200,
      message: message.usermessage.fetchMessage('Announcement'),
      data: totalcount,
    });
  } catch (err) {
    next(err);
  }
};

exports.getAnnouncementById = async (req, res, next) => {
  try {
    let get_one_data = await AnnouncementModel.findOne({
      where: {
        announcementID: req.params.id,
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
      },
      include: [
        {
          model: companyMaster,
        },
        {
          model: BranchMaster,
        },
        {
          model: Designation,
        },
        {
          model: Department,
        },
      ],
    });

    if (!get_one_data)
      return res
        .status(200)
        .json({ status: 200, message: message.usermessage.deletedrecord });
    else {
      return res.status(200).json({ status: 200, data: get_one_data });
    }
  } catch (err) {
    next(err);
  }
};

exports.getAnnouncementByCompanyId = async (req, res, next) => {
  try {
    const { limit, page, searchQuery, startdate, enddate, companyMasterID } =
      await req.body;

    const paginationQuery = {};
    const condition = {};

    condition.status = [0, 1];

    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }
    const order = [['announcementDate', 'DESC']];

    if (companyMasterID) condition.companyMasterID = companyMasterID;

    if (startdate && enddate) {
      condition.announcementDate = {
        [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
      };
    }

    if (searchQuery)
      condition[Sequelize.Op.or] = [
        { announcement: { [Sequelize.Op.iLike]: '%' + searchQuery + '%' } },
        {
          '$companyMaster.companyName$': {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
      ];

    const { rows: announcement, count } =
      await AnnouncementModel.findAndCountAll({
        where: condition,
        ...paginationQuery,
        order,
        include: [
          {
            model: companyMaster,
          },
          {
            model: BranchMaster,
          },
          {
            model: Designation,
          },
          {
            model: Department,
          },
        ],
      });

    for (let j = 0; j < announcement.length; j++) {
      let user1 = await UserMaster.findOne({
        where: {
          userMasterID: announcement[j].createBy,
        },
      });
      let user2 = await UserMaster.findOne({
        where: {
          userMasterID: announcement[j].updateBy,
        },
      });
      if (user1) {
        announcement[j].createBy = user1.dataValues.displayName;
      }
      if (user2) {
        announcement[j].updateBy = user2.dataValues.displayName;
      }

      if (!page && !limit) {
        announcement[j].announcement = announcement[j].announcement.replace(
          /(<([^>]+)>)/gi,
          ''
        );
      }
    }

    return res
      .status(200)
      .json({ status: 200, data: announcement, totalcount: count });
  } catch (err) {
    next(err);
  }
};

exports.postUpdateAnnouncement = async (req, res, next) => {
  try {
    let { announcementID, announcement, announcementDate, companyMasterID } =
      await req.body;
    const updateBy = req.userDetails.userMasterId;
    const updateByIp = req.userDetails.userIpAddress;
    await AnnouncementModel.update(
      {
        announcement,
        announcementDate,
        companyMasterID,
        updateBy,
        updateByIp,
      },
      {
        where: { announcementID: announcementID },
      }
    );

    return res.status(200).json({
      status: 200,
      message: message.usermessage.updateMessage('Announcement'),
    });
  } catch (err) {
    next(err);
  }
};

exports.poststatuschange = async (req, res, next) => {
  try {
    let { announcementID, status } = await req.body;
    const updateBy = req.userDetails.userMasterId;
    const updateByIp = req.userDetails.userIpAddress;
    await AnnouncementModel.update(
      {
        status: status,
        updateBy,
        updateByIp,
      },
      {
        where: { announcementID: announcementID },
      }
    );
    return res.status(200).json({
      status: 200,
      message: message.usermessage.deleteMessage('Announcement'),
    });
  } catch (err) {
    next(err);
  }
};

exports.postDeleteAnnouncementById = async (req, res, next) => {
  try {
    let { announcementID } = await req.body;
    const updateBy = req.userDetails.userMasterId;
    const updateByIp = req.userDetails.userIpAddress;
    await Promise.all([
      AnnouncementModel.update(
        {
          status: 2,
          updateBy,
          updateByIp,
        },
        {
          where: { announcementID: announcementID },
          transaction: t,
        }
      ),
      UserAnnouncement.update(
        {
          readstatus: 2,
          updateBy,
          updateByIp,
        },
        {
          where: { announcementID: announcementID },
          transaction: t,
        }
      ),
    ]);

    return res.status(200).json({
      status: 200,
      message: message.usermessage.deleteMessage('Announcement'),
    });
  } catch (err) {
    next(err);
  }
};
