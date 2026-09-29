const Department = require("../models/department");
const AuthorizationRequest = require("../models/authorizationRequest");
const logger = require("../config/logger");
const message = require("../response_message/message");
const Sequelize = require("sequelize");
const companyMasters = require("../models/companyMaster");
const sequelize = require("../config/database");
const UserMaster = require("../models/userMaster");
const FormAuthorization = require("../models/formAuthorizationDetails");
const FormMaster = require("../models/formMaster");
const AuthorizationCriteria = require("../models/authorizationCriteriaMaster");
const readXlsxFile = require("read-excel-file/node");
const jwt = require("jsonwebtoken");
const EmployeeDepartment = require("../models/employeeDepartment");

const { executeQuery } = require("./common.controller");

const { generateExcel } = require("../utils/exportData");
const { DatabaseOperationEnum } = require("../utils/dbUtils");
const fs = require("fs");
const path = require("path");
const { userAttributes } = require("../utils/commonVars");
/**
 * save city data.
 *
 * @body {createBy} createBy user id of user who added the city.
 * @body {number} createBy if any user change data then updateBy id change.
 
 */
exports.postAddDepartment = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    let { departmentName, companyMasterID, status} =
      await req.body;
    departmentName = departmentName.trim();
    const dbOperation = DatabaseOperationEnum.CREATE;
    const findDepartment = await Department.findOne({
      where: {
        departmentName: {
          [Sequelize.Op.iLike]: departmentName,
        },
        companyMasterID: companyMasterID,
        status: 1,
      },
      transaction,
    });

    if (findDepartment) {
      await transaction.rollback();
      return res.status(200).json({
        status: 401,
        message: message.usermessage.alreadyExists("Department With Same Name"),
      });
    }
    await Department.create(
      {
        departmentName,
        companyMasterID,
        status,
        authorizationStatus: 0,
        createBy: req.userDetails.userMasterId,
        createByIp: req.userDetails.userIpAddress,
      },
      {
        individualHooks: true,
        transaction,
        dbOperation,
      }
    );
    return res.status(200).json({
      status: 200,
      message: message.usermessage.addMessage("Department"),
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

/**
 return all city data
 */

/**
 * find data with Department id
 *
 * @param {id} DepartmentID  to fetch city name
 */

exports.getDepartmentId = async (req, res, next) => {
  try {
    const getDepartmentById = await Department.findOne({
      where: { departmentId: req.params.id, status: ["0", "1"] },
      raw: true,
    });

    if (!getDepartmentById) {
      return res.status(200).json({
        status: 200,
        message: message.usermessage.notFoundMessage("Department"),
      });
    }

    return res.status(200).json({ status: 200, data: getDepartmentById });
  } catch (err) {
    next(err);
  }
};

/**
 * update data
 *
 * @param {id} DepartmentID  to update id
 */
exports.postUpdateDepartment = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    let {
      departmentId,
      departmentName,
      companyMasterID,
      status,
      updateBy,
      updateByIp,
    } = await req.body;
    departmentName = departmentName.trim();
    const dbOperation = DatabaseOperationEnum.UPDATE;

    const uniquedata = await Department.findOne({
      where: {
        departmentName: {
          [Sequelize.Op.iLike]: departmentName,
        },
        companyMasterID: companyMasterID,
        departmentId: { [Sequelize.Op.notIn]: [departmentId] },
        status: 1,
      },
      transaction,
    });

    if (uniquedata) {
      return res.status(200).json({
        status: 401,
        message: message.usermessage.alreadyExists("Department"),
        data: {},
      });
    }

    await Department.update(
      {
        departmentName,
        companyMasterID,
        status,
        updateBy,
        updateByIp,
      },
      {
        where: { departmentId: departmentId },
        individualHooks: true,
        transaction,
        dbOperation,
      }
    );

    return res.status(200).json({
      status: 200,
      message: message.usermessage.updateMessage("Department"),
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

/**
 * delete by i
 *
 * @param {id} DepartmentID  to delete id
 */
exports.postDeleteDepartmentById = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    let { departmentId } = await req.body;
    const dbOperation = DatabaseOperationEnum.DELETE;

    const employeeDepartmentData = await EmployeeDepartment.findOne({
      where: {
        departmentID: departmentId,
        status: ["0", "1"],
      },
      include: [
        {
          required: true,
          model: UserMaster,
          as: "employee",
          where: {
            status: [0, 1],
          },
        },
      ],
      transaction,
    });

    if (employeeDepartmentData) {
      await transaction.rollback();
      return res.status(200).json({
        status: 401,
        message: message.usermessage.alreadyAssign("Department", "Deleted"),
      });
    }

    await Department.update(
      {
        status: "2",
      },
      {
        where: { departmentId: departmentId },
        individualHooks: true,
        transaction,
        dbOperation,
      }
    );

    return res.status(200).json({
      status: 200,
      message: message.usermessage.deleteMessage("Department"),
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

exports.poststatuschange = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    let { departmentId, status } = await req.body;
    let delete_status;
    const dbOperation = DatabaseOperationEnum.UPDATE;
    const findDepartmentData = await Department.findOne({
      where: {
        departmentId: departmentId,
        status: [0, 1],
      },
      transaction,
    });

    if (!findDepartmentData) {
      await transaction.rollback();
      return res.status(200).json({
        status: 404,
        message: message.usermessage.notFoundMessage("Department"),
      });
    }
    if (status == "0") {
      const employeeDepartmentData = await EmployeeDepartment.findOne({
        where: {
          departmentID: departmentId,
          status: ["0", "1"],
        },
        include: [
          {
            required: true,
            model: UserMaster,
            as: "employee",
            where: {
              status: [0, 1],
            },
          },
        ],
        transaction,
      });

      if (employeeDepartmentData) {
        await transaction.rollback();
        return res.status(200).json({
          status: 401,
          message: message.usermessage.alreadyAssign(
            "Department",
            "deactivate"
          ),
        });
      }
    }

    await Department.update(
      {
        status: status,
      },
      {
        where: { departmentId: departmentId, status: ["1", "0"] },
        individualHooks: true,
        transaction,
        dbOperation,
      }
    );

    return res.status(200).json({
      status: 200,
      message:
        status == "1"
          ? message.usermessage.activeMessage("Department")
          : message.usermessage.deactiveMessage("Department"),
      data: {},
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

exports.getDepartmentcompanyid = async (req, res, next) => {
  try {
    const { companyMasterID, limit, page, searchQuery, exportData } =
      await req.body;

    const condition = {};

    condition.status = [0, 1];

    if (companyMasterID) condition.companyMasterID = companyMasterID;

    if (searchQuery)
      condition[Sequelize.Op.or] = [
        {
          departmentName: {
            [Sequelize.Op.iLike]: "%" + searchQuery + "%",
          },
        },
        {
          "$companyMaster.companyName$": {
            [Sequelize.Op.iLike]: "%" + searchQuery + "%",
          },
        },
      ];

    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }

    const order = [["createdAt", "DESC"]];

    const { rows: departmentData, count } = await Department.findAndCountAll({
      raw: true,
      where: condition,
      ...paginationQuery,
      order,
      include: [{ model: companyMasters }],
    });

    const uniqueUserIds = new Set();
    departmentData.map((row) => {
      if (row.createBy) {
        uniqueUserIds.add(+row.createBy);
      }
      if (row.updateBy) {
        uniqueUserIds.add(+row.updateBy);
      }
    });
    const userData = await UserMaster.findAll({
      raw: true,
      where: {
        userMasterID: [...uniqueUserIds],
        status: [0, 1],
      },
      attributes: userAttributes,
    });

    for (const department of departmentData) {
      const createUser = userData.find(
        (e) => e.userMasterID == department.createBy
      );
      department.createBy = createUser
        ? createUser.displayName
        : department.createBy;
      if (department.updateBy) {
        const updateUser = userData.find(
          (e) => e.userMasterID == department.updateBy
        );
        department.updateBy = updateUser
          ? updateUser.displayName
          : department.updateBy;
      }
    }
    if (exportData) {
      const finalData = [];
      for (const department of departmentData) {
        const data1 = {
          DepartmentName: department.departmentName,
          CompanyName: department["companyMaster.companyName"],
          Status: department.status == 1 ? "Active" : "Deactive",
        };
        finalData.push(data1);
      }
      await generateExcel(finalData, "department", "xlsx", res);
      return;
    }

    return res.status(200).json({
      status: 200,
      data: departmentData,
      totalcount: count,
    });
  } catch (err) {
    next(err.message);
  }
};

exports.getDepartmentByCompanyId = async (req, res, next) => {
  try {
    let get_one_data = await Department.findAll({
      where: {
        companyMasterID: req.params.id,
        status: 1,
        // authorizationStatus: ['0', '3'],
      },
      raw: true,
    });
    if (!get_one_data) {
      res
        .status(200)
        .json({ status: 200, message: message.usermessage.deletedrecord });
    }
    res.status(200).json({ status: 200, data: get_one_data });
  } catch (err) {
    next(err);
  }
};

exports.getactivedepartmentbycompanyid = async (req, res, next) => {
  try {
    let department;
    const companyid = [];
    companyid.push(parseInt(req.params.id));
    let get_one_data = await companyMasters.findAll({
      where: { parentCompanyMasterID: req.params.id, status: [0, 1] },

      include: [{ all: true, nested: true }],
    });
    for (var i = 0; i < get_one_data.length; i++) {
      companyid.push(get_one_data[i].companyMasterID);
    }
    department = await Department.findAll({
      where: {
        companyMasterID: {
          [Sequelize.Op.in]: companyid,
        },
        status: 1,
        authorizationStatus: ["0", "3"],
      },

      include: [{ all: true, nested: true }],
    });

    res.status(200).json({ status: 200, data: department });
  } catch (err) {
    next(err);
  }
};

exports.uploadexcel = async (req, res) => {
  if (req.file == undefined) {
    return res
      .status(200)
      .send({ status: 400, message: "Please upload an excel file!" });
  }
  const filePath = path.join(__dirname, `../uploads/${req.file.filename}`);

  try {
    // let path = './uploads/' + req.file.filename;
    readXlsxFile(filePath).then(async (rows) => {
      // skip header
      rows.shift();
      let department = [];
      rows.forEach((row) => {
        if (row[0] != null && row[0].trim() != "") {
          let departmentmaster = {
            departmentName: row[0].trim(),
            companyMasterID: req.body.companyMasterID,
            status: 1,
            authorizationStatus: 0,
            createBy: req.body.createBy,
            createByIp: req.body.createByIp,
          };
          department.push(departmentmaster);
        }
      });
      let data = [];
      for (var i = 0; i < department.length; i++) {
        if (data.length > 0) {
          const result = data.filter(
            (s) =>
              s.departmentName.toLowerCase() ==
              department[i].departmentName.toLowerCase()
          );

          if (result.length > 0) {
            return res.status(200).send({
              status: 401,
              message:
                "Duplicate Department Name Exist In Excel. " +
                result[0].departmentName,
            });
          } else {
            let uniquedata = await executeQuery(
              `
           
select * from departments WHERE LOWER(TRIM("departmentName")) = '` +
                department[i].departmentName.trim().toLowerCase() +
                `' and "companyMasterID" = ` +
                req.body.companyMasterID +
                ` and status in(0,1) `
            );

            if (uniquedata.length > 0) {
              return res.status(200).json({
                status: 401,
                message:
                  "Department Already Exist " + uniquedata[0].departmentName,
                data: {},
              });
            }
          }
        }
        data.push(department[i]);
      }

      Department.bulkCreate(department).catch((error) => {
        res.status(200).send({
          status: 401,
          message: "Fail to import excel! " + error.message,
          error: error.message,
        });
      });
      res.status(200).json({
        status: 200,
        message: message.usermessage.departmentadd,
        data: {},
      });
    });
  } catch (error) {
    res.status(500).send({
      message: "Could not upload the file: " + req.file.originalname,
    });
  }
};
exports.validateUploadExcel = async (req, res, next) => {
  if (!req.file) {
    return res
      .status(200)
      .send({ status: 400, message: "Please upload an excel file!" });
  }

  const filePath = path.join(__dirname, `../uploads/${req.file.filename}`);

  try {
    // const path = './uploads/' + req.file.filename;
    const rows = await readXlsxFile(filePath);

    // Skip header
    rows.shift();
    const data = [];

    for (const row of rows) {
      if (row && row.length > 0) {
        const departmentName = row[0]; // Assuming the department name is in the first column
        let departmentmaster = {
          departmentName: departmentName,
          companyMasterID: req.body.companyMasterID,
          remarks: "",
        };

        const duplicateInExcel = data.find(
          (s) =>
            s.departmentName &&
            typeof s.departmentName === "string" &&
            s.departmentName.toLowerCase() ===
              departmentmaster.departmentName.toLowerCase()
        );

        if (duplicateInExcel) {
          departmentmaster.remarks = "Duplicate Department Name in Excel";
        } else {
          const condition = {
            companyMasterID: req.body.companyMasterID,
            status: [0, 1],
            departmentName: {
              [Sequelize.Op.iLike]: departmentmaster.departmentName,
            },
          };

          const uniquedata = await Department.findAll({
            where: condition,
          });

          if (uniquedata.length > 0) {
            departmentmaster.remarks = "Department Already Exists";
          }
        }

        data.push(departmentmaster);
      }
    }
    fs.unlink(filePath, function (err) {
      if (err) console.log(err);
    });
    return res.status(200).json({
      status: 200,
      message: message.usermessage.departmentValidate,
      data: data,
    });
  } catch (error) {
    next(error);
  }
};

exports.revalidateDepartment = async (req, res, next) => {
  try {
    const { departmentName, companyMasterID } = req.body;

    let data = [];
    for (const row of departmentName) {
      if (row != null && row != "") {
        let departmentmaster = {
          departmentName: row.trim(),
          remarks: "",
        };
        const duplicateInData = data.some(
          (s) =>
            s.departmentName.trim().toLowerCase() ===
            departmentmaster.departmentName.trim().toLowerCase()
        );

        if (duplicateInData) {
          departmentmaster.remarks = "Duplicate Department Name in Data";
        } else {
          const condition = {};
          condition.companyMasterID = companyMasterID;
          condition.status = [0, 1];
          condition.departmentName = {
            [Sequelize.Op.iLike]: departmentmaster.departmentName,
          };
          let uniquedata = await Department.findAll({
            where: condition,
          });
          if (uniquedata && uniquedata.length > 0) {
            departmentmaster.remarks = "Department Already Exists";
          }
        }

        data.push(departmentmaster);
      }
    }
    return res.status(200).json({
      status: 200,
      message: message.usermessage.departmentValidate,
      data: data,
    });
  } catch (error) {
    next(error);
  }
};

exports.addValidateDepartment = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { departmentName, companyMasterID } = req.body;
    const dbOperation = DatabaseOperationEnum.CREATE;

    await Department.bulkCreate(
      departmentName.map((item) => ({
        departmentName: item.trim(),
        companyMasterID,
        status: 1,
        authorizationStatus: 0,
        createBy: req.userDetails.userMasterId,
        createByIp: req.userDetails.userIpAddress,
      })),
      { transaction, dbOperation, individualHooks: false }
    );

    return res.status(200).json({
      status: 200,
      message: message.usermessage.departmentadd,
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};
