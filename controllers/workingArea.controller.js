const Sequelize = require("sequelize");
const sequelize = require("../config/database");
const companyMaster = require("../models/companyMaster");
const { generateExcel } = require("../utils/exportData");
const WorkingArea = require("../models/workingArea");
const readXlsxFile = require("read-excel-file/node");
const fs = require("fs");
const EmployeeWorkingArea = require("../models/employeeWorkingArea");
const message = require("../response_message/message");
const { DatabaseOperationEnum } = require("../utils/dbUtils");
const path = require("path");
const UserMaster = require("../models/userMaster");

exports.addData = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    let { companyMasterID, workingAreaName } = req.body;
    workingAreaName = workingAreaName.trim();
    const dbOperation = DatabaseOperationEnum.CREATE;

    const findWorkingArea = await WorkingArea.findOne({
      where: {
        workingAreaName: {
          [Sequelize.Op.iLike]: workingAreaName,
        },
        companyMasterID: companyMasterID,
        status: 1,
      },
      transaction,
    });
    if (findWorkingArea) {
      await transaction.rollback();
      return res.status(200).json({
        status: 401,
        message: message.usermessage.alreadyExists(
          "Working Area With Same Name"
        ),
      });
    }

    await WorkingArea.create(
      {
        companyMasterID,
        workingAreaName,
      },
      { user: req.userDetails, individualHooks: true, transaction, dbOperation }
    );

    return res.status(200).json({
      status: 200,
      message: message.usermessage.addMessage("Working Area"),
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

exports.updateData = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { workingAreaName } = req.body;
    const dbOperation = DatabaseOperationEnum.UPDATE;

    const findData = await WorkingArea.findByPk(id);

    const findWorkingArea = await WorkingArea.findOne({
      where: {
        workingAreaName: {
          [Sequelize.Op.iLike]: workingAreaName,
        },
        companyMasterID: findData.companyMasterID,
        id: { [Sequelize.Op.notIn]: [findData.id] },
        status: 1,
      },
      transaction,
    });

    if (findWorkingArea)
      return res.status(200).json({
        status: 401,
        message: message.usermessage.alreadyExists(
          "Working Area With Same Name"
        ),
      });

    findData.workingAreaName = workingAreaName;

    await findData.save({
      user: req.userDetails,
      individualHooks: true,
      transaction,
      dbOperation,
    });

    return res.status(200).json({
      status: 200,
      message: message.usermessage.updateMessage("Working Area"),
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

exports.listData = async (req, res, next) => {
  try {
    const { page, limit, companyMasterID, search, Export, status } = req.query;

    const condition = {};
    if (status) condition.status = status;

    if (companyMasterID) condition.companyMasterID = companyMasterID;

    if (search)
      condition[Sequelize.Op.or] = [
        { workingAreaName: { [Sequelize.Op.iLike]: `%${search}%` } },
        {
          "$companyMaster.companyName$": {
            [Sequelize.Op.iLike]: `%${search}%`,
          },
        },
      ];

    const paginationQuery = {};
    if (!Export && page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = +limit;
    }

    const { rows: WorkingAreaData, count } = await WorkingArea.findAndCountAll({
      raw: true,
      where: condition,
      ...paginationQuery,
      include: [{ model: companyMaster, attributes: ["companyName"] }],
      order: [["id", "DESC"]],
    });

    if (Export == "true") {
      const finaldata = WorkingAreaData.map((e) => {
        return {
          "Company Name": e["companyMaster.companyName"],
          "Working Area Name": e.workingAreaName,
          Status: e.status == 0 ? "Deactive" : "Active",
        };
      });

      return await generateExcel(finaldata, "Working Area", "xlsx", res);
    }

    return res.status(200).json({
      status: 200,
      data: WorkingAreaData,
      totalcount: count,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteData = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const dbOperation = DatabaseOperationEnum.DELETE;

    const findEmployeeWorkingArea = await EmployeeWorkingArea.findOne({
      where: {
        workingAreaId: id,
        status: ["0", "1"],
      },
      include: [
        {
          required: true,
          model: UserMaster,
          where: {
            status: [0, 1],
          },
        },
      ],
      transaction,
    });

    if (findEmployeeWorkingArea) {
      await transaction.rollback();
      return res.status(200).json({
        status: 401,
        message: message.usermessage.alreadyAssign("Working Area", "delete"),
      });
    }

    const findData = await WorkingArea.findByPk(id, { transaction });

    await findData.destroy({
      user: req.userDetails,
      individualHooks: true,
      transaction,
      dbOperation,
    });

    return res.status(200).json({
      status: 200,
      message: message.usermessage.deleteMessage("Working Area"),
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const findData = await WorkingArea.findByPk(id, {
      include: [{ model: companyMaster, attributes: ["companyName"] }],
    });

    return res.status(200).json({
      status: 200,
      data: findData,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateStatus = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { id, status } = req.body;
    const dbOperation = DatabaseOperationEnum.UPDATE;

    if (status === "0") {
      const findEmployeeWorkingArea = await EmployeeWorkingArea.findOne({
        where: {
          workingAreaId: id,
          status: ["0", "1"],
        },
        include: [
          {
            required: true,
            model: UserMaster,
            where: {
              status: [0, 1],
            },
          },
        ],
        transaction,
      });

      if (findEmployeeWorkingArea) {
        return res.status(200).json({
          status: 401,
          message: message.usermessage.alreadyAssign(
            "Working Area",
            "deactive"
          ),
        });
      }
    }

    const findData = await WorkingArea.findByPk(id, { transaction });

    findData.status = status;

    await findData.save({
      user: req.userDetails,
      individualHooks: true,
      transaction,
      dbOperation,
    });

    return res.status(200).json({
      status: 200,
      message:
        status == 1
          ? message.usermessage.activeMessage("Working Area")
          : message.usermessage.deactiveMessage("Working Area"),
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

exports.uploadExcel = async (req, res, next) => {
  const filePath = path.join(__dirname, `../uploads/${req.file.filename}`);

  try {
    const { companyMasterID, createBy, createByIp } = req.body;

    readXlsxFile(filePath).then(async (rows) => {
      rows.shift();

      const allData = rows.map((e) => e[0]);

      const finalData = [];

      for (const row of rows) {
        if (!row) continue;

        const checkMultipleInExcel = allData.filter(
          (e) => e.trim().toLowerCase() == row[0].trim().toLowerCase()
        );

        if (checkMultipleInExcel.length > 1)
          return res.status(200).json({
            status: 401,
            message: "You have entered multiple time : " + `${row[0]}`,
          });

        const findDivision = await WorkingArea.findOne({
          where: Sequelize.and(
            Sequelize.where(
              sequelize.fn(
                "TRIM",
                sequelize.fn("LOWER", sequelize.col("workingAreaName"))
              ),
              row[0].trim().toLowerCase()
            ),
            Sequelize.where(sequelize.col("companyMasterID"), companyMasterID),
            Sequelize.where(sequelize.col("status"), 1)
          ),
        });

        if (findDivision)
          return res.status(200).json({
            status: 401,
            message: "Working Area already exist : " + `${row[0]}`,
          });

        finalData.push({
          companyMasterID,
          workingAreaName: row[0],
          createBy,
          createByIp,
        });
      }

      await sequelize.transaction(async (t) => {
        await WorkingArea.bulkCreate(finalData, { transaction: t });
      });

      fs.unlink(filePath, function (err) {
        if (err) {
          console.log(err);
        } else {
        }
      });

      return res.status(200).send({
        status: 200,
        message: " The File Upload Successfully: " + req.file.originalname,
      });
    });
  } catch (error) {
    next(error);
  }
};

exports.demoExcel = async (req, res, next) => {
  try {
    const data = ["Working Area Name"];

    return await generateExcel(data, "Working Area", "xlsx", res);
  } catch (error) {
    next(error);
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
    const rows = await readXlsxFile(filePath);

    // Skip header
    rows.shift();
    const data = [];

    for (const row of rows) {
      if (row && row.length > 0) {
        const workingAreaName = row[0]; // Assuming the Working Area name is in the first column
        let workingAreaMaster = {
          workingAreaName: workingAreaName,
          companyMasterID: req.body.companyMasterID,
          remarks: "",
        };

        const duplicateInExcel = data.find(
          (s) =>
            s.workingAreaName &&
            typeof s.workingAreaName === "string" &&
            s.workingAreaName.toLowerCase() ===
              workingAreaMaster.workingAreaName.toLowerCase()
        );

        if (duplicateInExcel) {
          workingAreaMaster.remarks = "Duplicate Working Area Name in Excel";
        } else {
          const condition = {
            companyMasterID: req.body.companyMasterID,
            status: [0, 1],
            workingAreaName: {
              [Sequelize.Op.iLike]: workingAreaMaster.workingAreaName,
            },
          };

          const uniquedata = await WorkingArea.findAll({
            where: condition,
          });

          if (uniquedata.length > 0) {
            workingAreaMaster.remarks = "Working Area Already Exists";
          }
        }

        data.push(workingAreaMaster);
      }
    }
    fs.unlink(filePath, function (err) {
      if (err) console.log(err);
    });
    return res.status(200).json({
      status: 200,
      message: message.usermessage.workingAreaValidate,
      data: data,
    });
  } catch (error) {
    next(error);
  }
};

exports.reValidateWorkingArea = async (req, res, next) => {
  try {
    const { workingAreaName, companyMasterID } = req.body;

    let data = [];
    for (const row of workingAreaName) {
      if (row != null && row != "") {
        let departmentmaster = {
          workingAreaName: row.trim(),
          remarks: "",
        };
        const duplicateInData = data.some(
          (s) =>
            s.workingAreaName.trim().toLowerCase() ===
            departmentmaster.workingAreaName.trim().toLowerCase()
        );

        if (duplicateInData) {
          departmentmaster.remarks = "Duplicate Working Area Name in Data";
        } else {
          const condition = {};
          condition.companyMasterID = companyMasterID;
          (condition.status = [0, 1]),
            (condition.workingAreaName = {
              [Sequelize.Op.iLike]: departmentmaster.workingAreaName,
            });
          let uniquedata = await WorkingArea.findAll({
            where: condition,
          });
          if (uniquedata && uniquedata.length > 0) {
            departmentmaster.remarks = "Working Area Already Exists";
          }
        }

        data.push(departmentmaster);
      }
    }
    return res.status(200).json({
      status: 200,
      message: message.usermessage.workingAreaValidate,
      data: data,
    });
  } catch (error) {
    next(error);
  }
};

exports.addValidateWorkingArea = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { workingAreaName, companyMasterID } = req.body;
    const dbOperation = DatabaseOperationEnum.CREATE;

    await WorkingArea.bulkCreate(
      workingAreaName.map((item) => ({
        workingAreaName: item.trim(),
        companyMasterID,
      })),
      {
        user: req.userDetails,
        transaction,
        dbOperation,
        individualHooks: false,
      }
    );

    return res.status(200).json({
      status: 200,
      message: message.usermessage.workingAreaadd,
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};
