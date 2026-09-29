const Sequelize = require("sequelize");
const Division = require("../models/division");
const sequelize = require("../config/database");
const companyMaster = require("../models/companyMaster");
const { generateExcel } = require("../utils/exportData");
const readXlsxFile = require("read-excel-file/node");
const fs = require("fs");
const EmployeeDivision = require("../models/employeeDivision");
const message = require("../response_message/message");
const { DatabaseOperationEnum } = require("../utils/dbUtils");
const path = require("path");
const UserMaster = require("../models/userMaster");

exports.addData = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    let { companyMasterID, divisionName } = req.body;
    const dbOperation = DatabaseOperationEnum.CREATE;
    divisionName = divisionName.trim();
    const findDivision = await Division.findOne({
      where: {
        divisionName: {
          [Sequelize.Op.iLike]: divisionName,
        },
        companyMasterID: companyMasterID,
        status: 1,
      },
      transaction,
    });

    if (findDivision) {
      await transaction.rollback();
      return res.status(200).json({
        status: 401,
        message: message.usermessage.alreadyExists("Division With Same Name"),
      });
    }
    await Division.create(
      {
        companyMasterID,
        divisionName,
      },
      {
        user: req.userDetails,
        individualHooks: true,
        transaction,
        dbOperation,
      }
    );

    return res.status(200).json({
      status: 200,
      message: message.usermessage.addMessage("Division"),
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

    const { divisionName } = req.body;
    const dbOperation = DatabaseOperationEnum.UPDATE;
    const findData = await Division.findByPk(id);
    const findDivision = await Division.findOne({
      where: {
        divisionName: {
          [Sequelize.Op.iLike]: divisionName,
        },
        companyMasterID: findData.companyMasterID,
        id: { [Sequelize.Op.notIn]: [findData.id] },
        status: 1,
      },
      transaction,
    });
    if (findDivision) {
      await transaction.rollback();
      return res.status(200).json({
        status: 401,
        message: message.usermessage.alreadyExists("Division"),
      });
    }

    findData.divisionName = divisionName;

    await findData.save({
      user: req.userDetails,
      individualHooks: true,
      transaction,
      dbOperation,
    });

    return res.status(200).json({
      status: 200,
      message: message.usermessage.updateMessage("Division"),
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
        { divisionName: { [Sequelize.Op.iLike]: `%${search}%` } },
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

    const { rows: divisionData, count } = await Division.findAndCountAll({
      raw: true,
      where: condition,
      ...paginationQuery,
      include: [{ model: companyMaster, attributes: ["companyName"] }],
      order: [["id", "DESC"]],
    });

    if (Export == "true") {
      const finaldata = divisionData.map((e) => {
        return {
          "Company Name": e["companyMaster.companyName"],
          "Division Name": e.divisionName,
          Status: e.status == 0 ? "Deactive" : "Active",
        };
      });

      return await generateExcel(finaldata, "Division", "xlsx", res);
    }

    return res.status(200).json({
      status: 200,
      data: divisionData,
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

    const findEmployeeDivision = await EmployeeDivision.findOne({
      where: {
        divisionId: id,
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

    if (findEmployeeDivision) {
      await transaction.rollback();
      return res.status(200).json({
        status: 401,
        message: message.usermessage.alreadyAssign("Division", "Delete"),
      });
    }

    const findData = await Division.findByPk(id, { transaction });

    await findData.destroy({
      user: req.userDetails,
      individualHooks: true,
      transaction,
      dbOperation,
    });

    return res.status(200).json({
      status: 200,
      message: message.usermessage.deleteMessage("Division"),
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const findData = await Division.findByPk(id, {
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

exports.uploadExcel = async (req, res, next) => {
  const filePath = path.join(__dirname, `../uploads/${req.file.filename}`);

  try {
    const { companyMasterID, createBy, createByIp } = req.body;
    const dbOperation = DatabaseOperationEnum.CREATE;

    // let path = './uploads/' + req.file.filename;

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

        const findDivision = await Division.findOne({
          where: Sequelize.and(
            Sequelize.where(
              sequelize.fn(
                "TRIM",
                sequelize.fn("LOWER", sequelize.col("divisionName"))
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
            message: "Division already exist : " + `${row[0]}`,
          });

        finalData.push({
          companyMasterID,
          divisionName: row[0],
          createBy,
          createByIp,
        });
      }

      await sequelize.transaction(async (t) => {
        await Division.bulkCreate(finalData, {
          transaction: t,
          dbOperation,
          individualHooks: true,
        });
      });

      fs.unlink(filePath, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("delete");
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
    const data = ["Division Name"];

    return await generateExcel(data, "Division", "xlsx", res);
  } catch (error) {
    next(error);
  }
};

exports.updateStatus = async (req, res, next) => {``
  const transaction = await sequelize.transaction();
  try {
    const { id, status } = req.body;
    const dbOperation = DatabaseOperationEnum.UPDATE;

    if (status == 0) {
      const findEmployeeDivision = await EmployeeDivision.findOne({
        where: {
          divisionId: id,
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
      if (findEmployeeDivision) {
        await transaction.rollback();
        return res.status(200).json({
          status: 401,
          message: message.usermessage.alreadyAssign("Division", "deactive"),
        });
      }
    }

    const findData = await Division.findByPk(id, { transaction });
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
          ? message.usermessage.activeMessage("Division")
          : message.usermessage.deactiveMessage("Division"),
    });
  } catch (error) {
    await transaction.rollback();
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
        const divisionName = row[0]; // Assuming the Division name is in the first column
        let divisionMaster = {
          divisionName: divisionName,
          companyMasterID: req.body.companyMasterID,
          remarks: "",
        };

        const duplicateInExcel = data.find(
          (s) =>
            s.divisionName &&
            typeof s.divisionName === "string" &&
            s.divisionName.toLowerCase() ===
              divisionMaster.divisionName.toLowerCase()
        );

        if (duplicateInExcel) {
          divisionMaster.remarks = "Duplicate Division Name in Excel";
        } else {
          const condition = {
            companyMasterID: req.body.companyMasterID,
            status: [0, 1],
            divisionName: {
              [Sequelize.Op.iLike]: divisionMaster.divisionName,
            },
          };

          const uniquedata = await Division.findAll({
            where: condition,
          });

          if (uniquedata.length > 0) {
            divisionMaster.remarks = "Division Already Exists";
          }
        }

        data.push(divisionMaster);
      }
    }
    fs.unlink(filePath, function (err) {
      if (err) console.log(err);
    });
    return res.status(200).json({
      status: 200,
      message: message.usermessage.divisionValidate,
      data: data,
    });
  } catch (error) {
    next(error);
  }
};

exports.reValidateDivision = async (req, res, next) => {
  try {
    const { divisionName, companyMasterID } = req.body;

    let data = [];
    for (const row of divisionName) {
      if (row != null && row != "") {
        let divisionMaster = {
          divisionName: row.trim(),
          remarks: "",
        };
        const duplicateInData = data.some(
          (s) =>
            s.divisionName.trim().toLowerCase() ===
            divisionMaster.divisionName.trim().toLowerCase()
        );

        if (duplicateInData) {
          divisionMaster.remarks = "Duplicate Division Name in Data";
        } else {
          const condition = {};
          condition.companyMasterID = companyMasterID;
          condition.status = [0, 1];
          condition.divisionName = {
            [Sequelize.Op.iLike]: divisionMaster.divisionName,
          };
          let uniquedata = await Division.findAll({
            where: condition,
          });
          if (uniquedata && uniquedata.length > 0) {
            divisionMaster.remarks = "Division Already Exists";
          }
        }

        data.push(divisionMaster);
      }
    }
    return res.status(200).json({
      status: 200,
      message: message.usermessage.divisionValidate,
      data: data,
    });
  } catch (error) {
    next(error);
  }
};

exports.addValidateDivision = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { divisionName, companyMasterID } = req.body;
    const dbOperation = DatabaseOperationEnum.CREATE;

    await Division.bulkCreate(
      divisionName.map((item) => ({
        divisionName: item.trim(),
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
      message: message.usermessage.divisionadd,
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};
