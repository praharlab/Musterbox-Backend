const Sequelize = require("sequelize");
const sequelize = require("../config/database");
const Project = require("../models/project");
const EmployeeProject = require("../models/employeeProject");
const UserMaster = require("../models/userMaster");
const companyMaster = require("../models/companyMaster");

const readXlsxFile = require("read-excel-file/node");
const fs = require("fs");

const { generateDemoExcelForDivision } = require("../utils/exportData");
const EmployeeJoiningDetails = require("../models/employeeJoiningDetails");
const message = require("../response_message/message");
const path = require("path");
const { userAttributes } = require("../utils/commonVars");
const {
  nearestPastDate,
  asiaKolkataDateTime,
  accessibleUsers,
} = require("../utils/commonUtilFunctions");
const UserExpense = require("../models/userExpense");

exports.assignProject = async (req, res, next) => {
  try {
    const { userMasterID, projectID, startDate, releaseDate } = await req.body;
    const findEmployeeProject = await EmployeeProject.findAll({
      where: {
        userMasterID: userMasterID,
        status: 1,
      },
    });

    const startDateData =
      findEmployeeProject && findEmployeeProject.length
        ? findEmployeeProject.find(
            (e) =>
              (e.releaseDate == null || e.releaseDate >= startDate) &&
              e.startDate <= startDate &&
              e.projectID == projectID
          )
        : null;

    if (startDateData) {
      return res.status(200).json({
        status: 401,
        message: "Project is Already Assigned Within Dates",
      });
    }

    await EmployeeProject.create(
      {
        userMasterID,
        projectID,
        startDate,
        releaseDate,
      },
      { user: req.userDetails }
    );
    return res.status(200).json({
      status: 200,
      message: message.usermessage.assignMessage("Project"),
    });
  } catch (err) {
    next(err);
  }
};

exports.assignProjectBulk = async (req, res, next) => {
  try {
    const { userMasterID, projectID, startDate, releaseDate } = await req.body;
    const findAllEmployeeProject = await EmployeeProject.findAll({
      where: {
        userMasterID: userMasterID,
        status: 1,
      },
    });

    const AlredAssignedUsers = [];
    const createData = [];
    for (let user of userMasterID) {
      const findProject =
        findAllEmployeeProject && findAllEmployeeProject.length
          ? findAllEmployeeProject.filter((e) => e.userMasterID == user)
          : null;
      const startDateData =
        findProject && findProject.length
          ? findProject.find(
              (e) =>
                (e.releaseDate == null || e.releaseDate >= startDate) &&
                e.startDate <= startDate &&
                e.projectID == projectID
            )
          : null;

      if (startDateData) {
        AlredAssignedUsers.push(user);
        continue;
      }
      const create = {
        userMasterID: user,
        projectID,
        startDate,
        releaseDate,
        createBy: req.userDetails.userMasterId,
        createByIp: req.userDetails.userIpAddress,
      };
      createData.push(create);
    }
    const insertedRecords = await EmployeeProject.bulkCreate(createData, {
      user: req.userDetails,
    });

    const addedCount = insertedRecords.length;

    const AlredAssignedUsersData = await UserMaster.findAll({
      where: { userMasterID: AlredAssignedUsers },
      attributes: userAttributes,
    });
    const alreadyExistsUsers = [];
    let finalMessage = `Total records added successfully: ${addedCount}.`;

    for (let user of AlredAssignedUsersData) {
      alreadyExistsUsers.push(user.displayName);
    }

    if (alreadyExistsUsers.length > 0) {
      finalMessage += ` (Project already exists for: ${alreadyExistsUsers.join(
        ", "
      )})`;
    }
    return res.status(200).json({
      status: 200,
      message:
        AlredAssignedUsers && AlredAssignedUsers.length == 0
          ? message.usermessage.assignMessage("Project")
          : finalMessage,
    });
  } catch (err) {
    next(err);
  }
};

exports.getEmployeeProjectByuserMasterID = async (req, res, next) => {
  try {
    const { userMasterID } = await req.query;
    const currentdate = asiaKolkataDateTime(new Date()).slice(0, 10);

    const findAllEmployeeProject = await EmployeeProject.findAll({
      where: {
        userMasterID,
        status: 1,
      },
      order: [["startDate", "ASC"]],
      include: [
        {
          model: Project,
          include: [
            {
              model: UserMaster,
              as: "createdByUserDetails",
              attributes: userAttributes,
            },
            {
              required: false,
              model: UserMaster,
              as: "updatedByUserDetails",
              attributes: userAttributes,
            },
          ],
        },
        {
          model: UserMaster,
          as: "createdByUserDetails",
          attributes: userAttributes,
        },
        {
          required: false,
          model: UserMaster,
          as: "updatedByUserDetails",
          attributes: userAttributes,
        },
      ],
    });

    if (findAllEmployeeProject.length > 0) {
      for (let project of findAllEmployeeProject) {
        if (currentdate == project.startDate) {
          project.dataValues.employeeProjectStatus = 1;
          project.dataValues.showDelete = true;
        } else if (
          currentdate > project.startDate &&
          (currentdate <= project.releaseDate || project.releaseDate == null)
        ) {
          project.dataValues.employeeProjectStatus = 1;
          project.dataValues.showDelete = true;
        } else if (currentdate < project.startDate) {
          project.dataValues.employeeProjectStatus = 0;
          project.dataValues.showDelete = true;
        } else {
          project.dataValues.employeeProjectStatus = 0;
          project.dataValues.showDelete = false;
        }
        // }
      }
    }
    return res.status(200).json({ status: 200, data: findAllEmployeeProject });
  } catch (err) {
    next(err);
  }
};

exports.deleteEmployeeProject = async (req, res, next) => {
  try {
    const { employeeProjectID } = await req.body;
    const findData = await EmployeeProject.findByPk(employeeProjectID);

    const findProjectExpense = await UserExpense.findOne({
      where: {
        projectID: findData.projectID,
        userMasterID: findData.userMasterID
      },
    });
    if (findProjectExpense) {
      return res.status(200).json({
        status: 401,
        message: "Employee Project Can Not be removed Employee Already Applied For Expense",
      });
    }
    await findData.destroy({
      user: req.userDetails,
    });

    return res.status(200).json({
      status: 200,
      message: message.usermessage.deleteMessage("Employee Project"),
    });
  } catch (err) {
    next(err);
  }
};

exports.getEmployeeProjectByCompany = async (req, res, next) => {
  try {
    const { page, limit, searchQuery, companyMasterID } = req.body;

    const currentdate = asiaKolkataDateTime(new Date()).slice(0, 10);
    const condition = {};

    if (searchQuery)
      condition[Sequelize.Op.or] = [
        { displayName: { [Sequelize.Op.iLike]: "%" + searchQuery + "%" } },
        { userNumber: { [Sequelize.Op.iLike]: "%" + searchQuery + "%" } },
      ];

    if (companyMasterID)
      condition.companyMasterId =
        req.userDetails.accessibleCompanies.length > 0
          ? req.userDetails.accessibleCompanies
          : req.userDetails.companyMasterId;

    condition.status = 1;

    const paginatecondition =
      page && limit ? { offset: (page - 1) * limit, limit } : {};

    const { rows: userData, count } = await UserMaster.findAndCountAll({
      where: condition,
      ...paginatecondition,
      ...accessibleUsers(req.userDetails, false),
      distinct: true,
      include: [
        {
          required: false,
          model: EmployeeProject,
          order: [["startDate", "ASC"]],
          include: [
            {
              model: Project,
              attributes: ["projectName"],
              include: [
                {
                  model: UserMaster,
                  as: "createdByUserDetails",
                  attributes: userAttributes,
                },
                {
                  required: false,
                  model: UserMaster,
                  as: "updatedByUserDetails",
                  attributes: userAttributes,
                },
              ],
            },
            {
              model: UserMaster,
              as: "createdByUserDetails",
              attributes: userAttributes,
            },
            {
              required: false,
              model: UserMaster,
              as: "updatedByUserDetails",
              attributes: userAttributes,
            },
          ],
        },
      ],
      order: [["displayName", "ASC"]],
      attributes: userAttributes,
    });

    for (let user of userData) {
      for (let project of user.employeeProjects) {
        if (currentdate == project.startDate) {
          project.dataValues.employeeProjectStatus = 1;
          project.dataValues.showDelete = true;
        } else if (
          currentdate > project.startDate &&
          (currentdate <= project.releaseDate || project.releaseDate == null)
        ) {
          project.dataValues.employeeProjectStatus = 1;
          project.dataValues.showDelete = true;
        } else if (currentdate < project.startDate) {
          project.dataValues.employeeProjectStatus = 0;
          project.dataValues.showDelete = true;
        } else {
          project.dataValues.employeeProjectStatus = 0;
          project.dataValues.showDelete = false;
        }
      }
    }

    return res.status(200).json({
      status: 200,
      data: userData,
      totalcount: count,
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllEmployeeProject = async (req, res, next) => {
  try {
    const { userMasterID } = req.body;

    const currentdate = asiaKolkataDateTime(new Date()).slice(0, 10);
    const condition = {};
    condition.userMasterID = userMasterID;
    const employeeProjectData = await EmployeeProject.findAll({
      where: condition,
      order: [["startDate", "ASC"]],
      include: [
        {
          model: Project,
        },
      ],
    });

    const projectData = [];
    const projectIDs = [];
    for (let empProject of employeeProjectData) {
      if (projectIDs.includes(+empProject.projectID)) {
        continue;
      }
      projectData.push(empProject.project);
      projectIDs.push(+empProject.projectID);
    }

    return res.status(200).json({
      status: 200,
      data: projectData,
    });
  } catch (error) {
    next(error);
  }
};
