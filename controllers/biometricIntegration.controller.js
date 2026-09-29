const logger = require("../config/logger");
const message = require("../response_message/message");
const Sequelize = require("sequelize");
const sequelize = require("../config/database");
const companyMasters = require("../models/companyMaster");
const empJoining = require("../models/employeeJoiningDetails");
const BiometricIntegration = require("../models/biometricIntegration");
const AttendanceTrans = require("../models/attendanceTransaction");
const UserMaster = require("../models/userMaster");
const { getCompanyTree } = require("../utils/commonUtilFunctions");
const axios = require("axios");
const BiometricLogs = require("../models/biometricLogs");
const getbioMetricsConfig = require("../config/biometricIntegrationdb");
const sql = require("mssql");
const EmployeeJoiningDetails = require("../models/employeeJoiningDetails");
const { userAttributes } = require("../utils/commonVars");
const { generateExcel } = require("../utils/exportData");
/**
 * save biometric_integration data.
 *
 * @body {createBy} createBy user id of user who added the biometric_integration.
 * @body {number} createBy if any user change data then updateBy id change.
 */
exports.postAddBiometricIntegration = async (req, res, next) => {
  try {
    let {
      companyMasterID,
      biometricSerialNo,
      databaseName,
      algorithm,
      direction,
      serverIp,
      tableName,
      table,
      database,
      integrationType,
    } = await req.body;

    //Duplicate Company
    let check_Duplicate = await BiometricIntegration.findOne({
      where: {
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
        companyMasterID: req.body.companyMasterID,
      },
      raw: true,
    });

    if (check_Duplicate) {
      let msg = "Company already added";
      return res.status(200).json({ status: 401, message: msg, added: 0 });
    }

    const companyTreeIds = await getCompanyTree(companyMasterID);

    for (var i = 0; i < integrationType.length; i++) {
      if (integrationType[i] == "AIFaceAttendance") {
        const duplicateAIBiometric = await BiometricIntegration.findOne({
          where: {
            companyMasterID: { [Sequelize.Op.notIn]: companyTreeIds },
            biometricSerialNo: {
              [Sequelize.Op.contains]: [biometricSerialNo[i]],
            },
            status: 1,
          },
          include: {
            model: companyMasters,
            where: { status: 1 },
          },
        });

        if (duplicateAIBiometric) {
          let msg = `Serial Number ${biometricSerialNo[i]} already assigned`;
          return res.status(200).json({ status: 401, message: msg, added: 0 });
        }

        database[i] = "SoftechAttendance";
        table[i] = "AIFaceAttendance";
      } else if (integrationType[i] == "IpBasedBiometric") {
        database[i] = "SoftechAttendance";
        table[i] = "IpBasedBiometric";
      }
    }

    const msg = "Biometric Integration data inserted successfully";
    const insert_db_status = await BiometricIntegration.create({
      companyMasterID,
      biometricSerialNo,
      databaseName,
      serverIp,
      algorithm,
      direction,
      tableName,
      table,
      database,
      integrationType,
      createBy: req.userDetails.userMasterId,
      createByIp: req.userDetails.userIpAddress,
    });

    return res
      .status(200)
      .json({ status: 200, message: msg, added: 1, data: insert_db_status });
  } catch (err) {
    next(err);
  }
};

/**
 return all biometric data
 */

exports.getAllBiometricIntegration = async (req, res, next) => {
  try {
    const { limit, page, searchQuery } = req.body;

    const condition = {};
    condition.status = 1;
    if (searchQuery)
      condition[Sequelize.Op.or] = [
        {
          "$companyMaster.companyName$": {
            [Sequelize.Op.iLike]: "%" + searchQuery + "%",
          },
        },
        {
          "$companyMaster.companyName$": {
            [Sequelize.Op.iLike]: "%" + searchQuery + "%",
          },
        },
      ];

    const order = [["createdAt", "DESC"]];

    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }

    const BiometricList = await BiometricIntegration.findAndCountAll({
      where: condition,
      ...paginationQuery,
      order,
      include: [{ model: companyMasters }],
    });

    res.status(200).json({
      message: "Biometrics fetched Successfully",
      status: 200,
      data: BiometricList.rows,
      totalcount: BiometricList.count,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * find data with  id
 */

exports.getBiometricIntegrationById = async (req, res, next) => {
  try {
    let get_one_data = await BiometricIntegration.findOne({
      where: {
        biometricIntegrationID: req.params.id,
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
      },
      raw: true,
    });

    let changeAllData = 0;
    for (let i = 0; i < get_one_data.biometricSerialNo.length; i++) {
      let get_Data = req.body.data;

      let get_all_data = [];
      get_all_data = await empJoining.findAll({
        where: {
          biometricSerialNo: get_one_data.biometricSerialNo[i],
          status: {
            [Sequelize.Op.in]: [0, 1],
          },
        },
        raw: true,
      });

      if (get_all_data.length == 0) {
        changeAllData = 1;
      } else {
        let count = 0;
        for (let j = 0; j < get_all_data.length; j++) {
          let get_one_data = await AttendanceTrans.findOne({
            where: {
              userMasterID: get_all_data[j].userMasterID,
              Status: {
                [Sequelize.Op.in]: [0, 1],
              },
            },
            raw: true,
          });
          if (get_one_data) {
            changeAllData = 0;
            count++;
          }
        }
        if (count == 0) {
          changeAllData = 1;
        }
      }
    }

    if (!get_one_data)
      res
        .status(200)
        .json({ status: 200, message: message.usermessage.deletedrecord });
    res
      .status(200)
      .json({ status: 200, data: get_one_data, changeAllData: changeAllData });
  } catch (err) {
    next(err);
  }
};

/**
 * update status
 *
 * @param {id} biometricIntegrationID  to update status of bank
 */

exports.poststatuschange = async (req, res, next) => {
  try {
    let { biometricIntegrationID, status } = await req.body;
    let delete_status;
    let result = await sequelize.transaction(async (t) => {
      if (status == "1") {
        delete_status = await BiometricIntegration.update(
          {
            status: "1",
          },
          {
            where: {
              biometricIntegrationID: biometricIntegrationID,
              status: ["1", "0"],
            },
            transaction: t,
          }
        );
      } else {
        delete_status = await BiometricIntegration.update(
          {
            status: "0",
          },
          {
            where: {
              biometricIntegrationID: biometricIntegrationID,
              status: ["1", "0"],
            },
            transaction: t,
          }
        );
      }

      if (delete_status != 0) {
        let msg = "Status updated successfully";
        res.status(200).json({ status: 200, message: msg, data: {} });
      } else {
        res.status(200).json({
          status: 200,
          message: message.usermessage.deletedrecord,
          data: {},
        });
      }
      return delete_status;
    });
  } catch (err) {
    next(err);
  }
};

/**
 * delete by i
 *
 * @param {id} biometricIntegrationID  to delete id
 */
exports.postDeletebiometricIntegrationById = async (req, res, next) => {
  try {
    const { biometricIntegrationID } = await req.body;

    const getBiometricIntegrationData = await BiometricIntegration.findOne({
      where: {
        biometricIntegrationID: biometricIntegrationID,
        status: 1,
      },
      raw: true,
    });
    if (!getBiometricIntegrationData) {
      return res.status(401).json({
        status: 401,
        message: message.usermessage.notFoundMessage("Biometric"),
      });
    }
    for (
      let i = 0;
      i < getBiometricIntegrationData.biometricSerialNo.length;
      i++
    ) {
      const findjoiningSerialNumber = await empJoining.findOne({
        where: {
          biometricSerialNo: getBiometricIntegrationData.biometricSerialNo[i],
          status: {
            [Sequelize.Op.in]: [0, 1],
          },
        },
        include: {
          model: UserMaster,
          companyMasterId: getBiometricIntegrationData.companyMasterID,
          status: [0, 1],
        },
        raw: true,
      });
      if (findjoiningSerialNumber) {
        return res.status(200).json({
          status: 200,
          message: "Serial Number already Assigned to Employees",
          added: 0,
        });
      }
    }
    await BiometricIntegration.update(
      {
        status: 2,
      },
      {
        where: { biometricIntegrationID: biometricIntegrationID },
      }
    );

    return res.status(200).json({
      status: 200,
      message: message.usermessage.deleteMessage("Biometric Record"),
      added: 1,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * update data
 *
 * @param {id} biometricIntegrationID  to update id
 */

exports.postUpdateBiometricIntegration = async (req, res, next) => {
  try {
    let {
      biometricIntegrationID,
      companyMasterID,
      biometricSerialNo,
      databaseName,
      algorithm,
      serverIp,
      direction,
      tableName,
      table,
      database,
      integrationType,
    } = await req.body;

    //Duplicate Company
    let check_Duplicate = [];
    check_Duplicate = await BiometricIntegration.findAll({
      where: {
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
        companyMasterID: req.body.companyMasterID,
      },
      raw: true,
    });

    if (check_Duplicate.length != 0) {
      if (check_Duplicate.length > 1) {
        let msg = "Company already added";
        res.status(200).json({ status: 200, message: msg, added: 0 });
        return msg;
      } else {
        if (
          check_Duplicate[0].biometricIntegrationID !=
          req.body.biometricIntegrationID
        ) {
          let msg = "Company already added";
          res.status(200).json({ status: 200, message: msg, added: 0 });
          return msg;
        }
      }
    }

    //to check removed serial number is already assigned to anyone or not
    let old_serial_numbers = await BiometricIntegration.findOne({
      where: {
        biometricIntegrationID: biometricIntegrationID,
      },
      raw: true,
    });

    let removed_serail_no = [];

    if (old_serial_numbers) {
      for (var i = 0; i < old_serial_numbers.biometricSerialNo.length; i++) {
        if (
          !biometricSerialNo.includes(old_serial_numbers.biometricSerialNo[i])
        ) {
          removed_serail_no.push(old_serial_numbers.biometricSerialNo[i]);
        }
      }
    }

    if (removed_serail_no.length > 0) {
      let joiningdata = await empJoining.findAll({
        where: {
          "$userMaster.companyMasterId$": companyMasterID,
          status: 1,
        },
        include: [{ model: UserMaster }],
        raw: true,
      });

      if (joiningdata.length > 0) {
        for (var index = 0; index < joiningdata.length; index++) {
          if (joiningdata[index].biometricSerialNo) {
            var arr_assign_biometric =
              joiningdata[index].biometricSerialNo.split(",");
            for (var k = 0; k < arr_assign_biometric.length; k++) {
              if (removed_serail_no.includes(arr_assign_biometric[k])) {
                return res.status(200).json({
                  status: 401,
                  message: "Serial Number is already assigned",
                });
              }
            }
          }
        }
      }
    }

    const companyTreeIds = await getCompanyTree(companyMasterID);

    for (var i = 0; i < integrationType.length; i++) {
      if (integrationType[i] == "AIFaceAttendance") {
        const duplicateAIBiometric = await BiometricIntegration.findOne({
          where: {
            companyMasterID: { [Sequelize.Op.notIn]: companyTreeIds },
            biometricSerialNo: {
              [Sequelize.Op.contains]: [biometricSerialNo[i]],
            },
            status: 1,
          },
          include: {
            model: companyMasters,
            where: { status: 1 },
          },
        });

        if (duplicateAIBiometric) {
          let msg = `Serial Number ${biometricSerialNo[i]} already assigned`;
          return res.status(200).json({ status: 401, message: msg, added: 0 });
        }

        database[i] = "SoftechAttendance";
        table[i] = "AIFaceAttendance";
      } else if (integrationType[i] == "IpBasedBiometric") {
        database[i] = "SoftechAttendance";
        table[i] = "IpBasedBiometric";
      }
    }

    await BiometricIntegration.update(
      {
        companyMasterID,
        biometricSerialNo,
        databaseName,
        algorithm,
        serverIp,
        direction,
        tableName,
        table,
        database,
        updateBy: req.userDetails.userMasterId,
        updateByIp: req.userDetails.userIpAddress,
        integrationType,
      },
      {
        where: { biometricIntegrationID: biometricIntegrationID },
      }
    );
    const msg = "Biometric Integration updated successfully";

    return res.status(200).json({
      status: 200,
      message: msg,
      added: 1,
      check_Duplicate: check_Duplicate,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * find data with comp id
 */

exports.getBiometricIntegrationByCompId = async (req, res, next) => {
  try {
    const { companyMasterID, page, limit } = req.body;

    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }

    const biometricData = await BiometricIntegration.findOne({
      where: {
        companyMasterID: companyMasterID,
        status: 1,
      },
      ...paginationQuery,
      raw: true,
    });

    return res.status(200).json({ status: 200, data: biometricData });
  } catch (err) {
    next(err);
  }
};

exports.getBiometricList = async (req, res, next) => {
  try {
    const { companyMasterID } = req.body;

    const biometricData = await BiometricIntegration.findAll({
      where: {
        companyMasterID: companyMasterID,
        status: 1,
      },
      include: [
        {
          model: companyMasters,
          attributes: ["companyName", "companyMasterID"],
        },
      ],
      raw: true,
    });

    const data = [];
    let count = 1;

    for (const item of biometricData) {
      for (var i = 0; i < item.biometricSerialNo.length; i++) {
        const tempObj = {
          srNo: count++,
          companyName: item["companyMaster.companyName"],
          serialno: item.biometricSerialNo[i],
          algorithm:
            item.algorithm[i] == 1
              ? "Multiple Day Single Machine Multiple IN OUT"
              : item.algorithm[i] == 2
                ? "Single Day Single Machine First IN Last Out"
                : item.algorithm[i] == 3
                  ? "Single Day Multiple Machine First IN Last Out"
                  : item.algorithm[i] == 4
                    ? "Single Day Single Machine Multiple IN OUT"
                    : item.algorithm[i] == 5
                      ? "Single Day Multiple Machine Multiple In Out"
                      : item.algorithm[i] == 6
                        ? "Multiple Day Multiple Machine Multiple In Out"
                        : "Canteen",
          integrationType: item.integrationType[i],
          direction:
            item.direction && item.direction[i]
              ? `For ${item.direction[i]}`
              : `For In & Out Both`,
          serverIp: item.serverIp && item.serverIp[i] ? item.serverIp[i] : "",
        };
        data.push(tempObj);
      }
    }

    return res
      .status(200)
      .json({ status: 200, data: data, totalcount: data.length });
  } catch (err) {
    next(err);
  }
};

exports.getBiometricIntegrationByTable = async (req, res, next) => {
  try {
    let get_all_data = await BiometricIntegration.findAll({
      where: {
        tableName: req.body.tableName,
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
      },
      raw: true,
    });

    let sNo = [];

    for (var i = 0; i < get_all_data.length; i++) {
      for (var j = 0; j < get_all_data[i].biometricSerialNo.length; j++) {
        sNo.push(get_all_data[i].biometricSerialNo[j]);
      }
    }

    if (!get_all_data)
      res
        .status(200)
        .json({ status: 200, message: message.usermessage.deletedrecord });
    res.status(200).json({ status: 200, data: sNo });
  } catch (err) {
    next(err);
  }
};

exports.RemoveSerialNo = async (req, res, next) => {
  try {
    let get_Data = req.body.data;

    let get_all_data = [];
    get_all_data = await empJoining.findAll({
      where: {
        biometricSerialNo: req.body.serialno,
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
      },
      raw: true,
    });

    if (get_all_data.length == 0) {
      for (let i = 0; i < get_Data.biometricSerialNo.length; i++) {
        if (get_Data.biometricSerialNo[i] == req.body.serialno) {
          get_Data.biometricSerialNo.splice(i, 1);
        }
      }

      let biometricSerialNo = get_Data.biometricSerialNo;
      let result = await sequelize.transaction(async (t) => {
        let change_data_status = await BiometricIntegration.update(
          {
            biometricSerialNo,
          },
          {
            where: { biometricIntegrationID: get_Data.biometricIntegrationID },
            transaction: t,
          }
        );
        let msg = "Serial Number Removed successfully";
        res.status(200).json({ status: 200, message: msg, added: 1 });
        return change_data_status;
      });
    } else {
      for (let i = 0; i < get_all_data.length; i++) {
        let get_one_data = await AttendanceTrans.findOne({
          where: {
            userMasterID: get_all_data[i].userMasterID,
            Status: {
              [Sequelize.Op.in]: [0, 1],
            },
          },
          raw: true,
        });
        if (get_one_data) {
          let msg = "Serial number already used";
          res.status(200).json({ status: 200, message: msg, added: 0 });
        }
      }

      for (let i = 0; i < get_Data.biometricSerialNo.length; i++) {
        if (get_Data.biometricSerialNo[i] == req.body.serialno) {
          get_Data.biometricSerialNo.splice(i, 1);
        }
      }
      let biometricSerialNo = get_Data.biometricSerialNo;
      let result = await sequelize.transaction(async (t) => {
        let change_data_status = await BiometricIntegration.update(
          {
            biometricSerialNo,
          },
          {
            where: { biometricIntegrationID: get_Data.biometricIntegrationID },
            transaction: t,
          }
        );
        let msg = "Serial Number Removed successfully";
        res.status(200).json({ status: 200, message: msg, added: 1 });
        return change_data_status;
      });
    }
  } catch (err) {
    next(err);
  }
};

exports.postDeletebiometricIntegrationBycompanyMasterID = async (
  req,
  res,
  next
) => {
  try {
    const { companyMasterID } = await req.body;

    const getBiometricIntegrationData = await BiometricIntegration.findAll({
      where: {
        companyMasterID: {
          [Sequelize.Op.in]: companyMasterID,
        },
        status: 1,
      },
      raw: true,
    });

    if (!getBiometricIntegrationData) {
      return res.status(401).json({
        status: 401,
        message: message.usermessage.notFoundMessage("Biometric"),
      });
    }
    for (let i = 0; i < getBiometricIntegrationData.length; i++) {
      const biomtricData = getBiometricIntegrationData[i];
      for (let j = 0; j < biomtricData.biometricSerialNo.length; j++) {
        const findjoiningSerialNumber = await empJoining.findOne({
          where: {
            biometricSerialNo: biomtricData.biometricSerialNo[j],
            status: 1,
          },
          include: {
            model: UserMaster,
            companyMasterId: biomtricData.companyMasterID,
            status: [0, 1],
          },
          raw: true,
        });
        if (findjoiningSerialNumber) {
          return res.status(200).json({
            status: 201,
            message: `(${biomtricData.biometricSerialNo[j]})  Serial Number already assigned to Employees`,
          });
        }
      }
    }
    await BiometricIntegration.update(
      {
        status: 2,
      },
      {
        where: {
          companyMasterID: {
            [Sequelize.Op.in]: companyMasterID,
          },
        },
      }
    );
    return res.status(200).json({
      status: 200,
      message: message.usermessage.deleteMessage("Biometric Record"),
    });
  } catch (err) {
    next(err);
  }
};

exports.checkBiometricStatus = async (req, res, next) => {
  try {
    const { serverIp, biometricSerialNo } = req.body;

    const urlstatus = `http://${serverIp}:7788/bioMetricStatus`;

    const requestBody = {
      snCodes: [biometricSerialNo],
    };

    let status, response;
    try {
      response = await axios.post(urlstatus, requestBody, { timeout: 5000 });
    } catch (err) {
      return res.status(200).json({
        status: 401,
        message: "Server Connection was not established!",
      });
    }

    const { online, offline } = response.data;

    if (Object.keys(online).length > 0) {
      status = "online";
    } else if (Object.keys(offline).length > 0) {
      status = "offline";
    }

    if (status != "online" && status != "offline") {
      return res.status(200).json({
        status: 401,
        message: "Status not found",
      });
    }

    return res.status(200).json({
      status: 200,
      message: status,
    });
  } catch (err) {
    next(err);
  }
};

exports.checkunassignedEmployeeCodeData = async (req, res, next) => {
  try {
    const { companyMasterID, biometricSerialNo, page, limit, exportData } =
      req.body;
    const findAllCompanyData = await companyMasters.findAll({
      where: {
        status: 1,
        [Sequelize.Op.or]: [
          { companyMasterID: companyMasterID },
          { parentCompanyMasterID: companyMasterID },
        ],
      },
    });
    const allCompanyIDs = findAllCompanyData.map(
      (item) => item.companyMasterID
    );
    const findAllBiomtricIntegration = await BiometricIntegration.findAll({
      where: {
        companyMasterID: allCompanyIDs,
        status: 1,
      },
    });

    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }

    const findEmployeeJoining = await EmployeeJoiningDetails.findAll({
      where: {
        status: 1,
        biometricCode: {
          [Sequelize.Op.and]: [
            { [Sequelize.Op.ne]: "" },
            { [Sequelize.Op.ne]: null },
          ],
        },
        biometricSerialNo: {
          [Sequelize.Op.and]: [
            { [Sequelize.Op.ne]: "" },
            { [Sequelize.Op.ne]: null },
          ],
        },
      },
      attributes: [
        "biometricSerialNo",
        "userMasterID",
        "biometricCode",
        "leavingDate",
      ],
      include: [
        {
          model: UserMaster,
          where: { companyMasterId: allCompanyIDs, status: 1 },
          attributes: ["companyMasterId", "status", "userMasterID"],
        },
      ],
    });

    const resultArray = [];
    let totalcount = 0;
    for (let data of biometricSerialNo) {
      // Find Index Of Serial Number
      const companyIntergation = findAllBiomtricIntegration.find(
        (e) => e.companyMasterID == data.companyMasterID
      );

      const serialNoIndex = companyIntergation.biometricSerialNo
        ? companyIntergation.biometricSerialNo.indexOf(data.biometricSerialNo)
        : -1;
      if (serialNoIndex === -1) {
        continue;
        // return res.status(200).json({
        //   status: 401,
        //   message: `Serial number ${data.biometricSerialNo} did not match`,
        //   data: [],
        // });
      }
      const matchingEmployee = findEmployeeJoining.filter((employee) =>
        employee.biometricSerialNo?.includes(data.biometricSerialNo)
      );
      // if (matchingEmployee.length == 0) continue;

      const allBiometricCode = matchingEmployee.map(
        (item) => item.biometricCode
      );

      if (companyIntergation.table[serialNoIndex] == "AIFaceAttendance") {
        const allLogs = await BiometricLogs.findAll({
          where: {
            Serialnumber: data.biometricSerialNo,
            EmployeeCode: {
              [Sequelize.Op.notIn]: allBiometricCode,
            },
          },
          // ...paginationQuery,
          attributes: [
            "EmployeeCode",
            "Serialnumber",
            [
              Sequelize.fn("MAX", Sequelize.col("biometricLogsID")),
              "biometricLogsID",
            ], // Get the latest log ID
            [Sequelize.fn("MAX", Sequelize.col("logDateTime")), "logDateTime"], // Get the latest log time
            [Sequelize.fn("MAX", Sequelize.col("Image64")), "Image64"], // Get latest Image64
            [Sequelize.fn("MAX", Sequelize.col("createBy")), "createBy"], // Get latest createBy
            [Sequelize.fn("MAX", Sequelize.col("updateBy")), "updateBy"], // Get latest updateBy
            [Sequelize.fn("MAX", Sequelize.col("createByIp")), "createByIp"], // Get latest createByIp
            [Sequelize.fn("MAX", Sequelize.col("updateByIp")), "updateByIp"], // Get latest updateByIp
          ],
          group: ["EmployeeCode", "Serialnumber"], // Group by EmployeeCode & Serialnumber
          raw: true,
        });

        for (let item of allLogs) {
          let tempLog = {
            Biomatriclogid: "",
            EmployeeCode: item.EmployeeCode,
            logdate: "",
            logtime: "",
            logdatetime: item.logDateTime,
            Serialnumber: item.Serialnumber,
            InOut: "0",
            DataUploaded: null,
            Image64: item.Image64,
            Mode: "",
          };
          resultArray.push(tempLog);
        }
        totalcount = totalcount + allLogs.length;
      } else {
        const sqlConfig1 = getbioMetricsConfig(
          true,
          companyIntergation.database[serialNoIndex]
        );

        // const queryString = `
        //   SELECT DISTINCT EmployeeCode,
        //    MAX(logdatetime) AS LatestLogTime,
        //    MAX(Serialnumber) AS Serialnumber,
        //    MAX(datauploaded) AS DataUploaded
        //  FROM ${companyIntergation.table[serialNoIndex]}
        //  WHERE ISNULL(datauploaded, 0) = 0
        //    AND Serialnumber = '${companyIntergation.biometricSerialNo[serialNoIndex]}'
        //    AND EmployeeCode NOT IN (${allBiometricCode.map((code) => `'${code}'`).join(", ")})
        //  GROUP BY EmployeeCode
        //  ORDER BY LatestLogTime DESC
        //   OFFSET ${paginationQuery.offset} ROWS
        //   FETCH NEXT ${limit} ROWS ONLY
        // `;

        // Without Pagination
        const queryString = `
        SELECT DISTINCT EmployeeCode, 
               Serialnumber,
               MAX(logdatetime) AS LatestLogTime,
               MAX(datauploaded) AS DataUploaded
        FROM ${companyIntergation.table[serialNoIndex]}
        WHERE ISNULL(datauploaded, 0) = 0
          AND Serialnumber = '${companyIntergation.biometricSerialNo[serialNoIndex]}'
          AND EmployeeCode NOT IN (${allBiometricCode.map((code) => `'${code}'`).join(", ")})
        GROUP BY EmployeeCode, Serialnumber
        ORDER BY LatestLogTime DESC
    `;

        const queryStringTotalCount = `
    SELECT COUNT(DISTINCT CONCAT(EmployeeCode, '-', Serialnumber)) AS recordCount
    FROM ${companyIntergation.table[serialNoIndex]}
    WHERE ISNULL(datauploaded, 0) = 0
      AND Serialnumber = '${companyIntergation.biometricSerialNo[serialNoIndex]}'
      AND EmployeeCode NOT IN (${allBiometricCode.map((code) => `'${code}'`).join(", ")})
`;

        let pool = await sql.connect(sqlConfig1);
        let result = await pool.request().query(queryString);

        let pool1 = await sql.connect(sqlConfig1);
        const resTotalcount = await pool1
          .request()
          .query(queryStringTotalCount);

        result = result.recordsets[0];
        result.forEach((record) => resultArray.push(record));
        totalcount = totalcount + resTotalcount.recordset[0].recordCount;
      }
    }

    const exportDataFinal = resultArray.map((item) => ({
      Serialnumber: item.Serialnumber,
      EmployeeCode: item.EmployeeCode,
    }));

    if (exportData) {
      await generateExcel(exportDataFinal, "Biometric-Sync-Excel", "xlsx", res);
      return;
    }

    return res.status(200).json({
      status: 200,
      message: "Logs got Successfully.",
      data: exportDataFinal,
      totalcount: totalcount,
    });
  } catch (err) {
    next(err);
  }
};

exports.getbyChildParentCompany = async (req, res, next) => {
  try {
    const { companyMasterID, page, limit } = req.body;

    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }
    const findAllCompanyData = await companyMasters.findAll({
      where: {
        status: 1,
        [Sequelize.Op.or]: [
          { companyMasterID: companyMasterID },
          { parentCompanyMasterID: companyMasterID },
        ],
      },
    });
    const allCompanyIDs = findAllCompanyData.map(
      (item) => item.companyMasterID
    );

    const biometricData = await BiometricIntegration.findAll({
      where: {
        companyMasterID: allCompanyIDs,
        status: 1,
      },
      ...paginationQuery,
      include: [
        {
          model: companyMasters,
          attributes: ["companyName", "companyMasterID"],
        },
      ],
    });

    const finalData = [];
    for (let biometric of biometricData) {
      for (var i = 0; i < biometric.biometricSerialNo.length; i++) {
        let biometric1 = {
          companyName: biometric.companyMaster.companyName,
          companyMasterID: biometric.companyMasterID,
          biometricSerialNo: biometric.biometricSerialNo[i],
          displayText: `${biometric.biometricSerialNo[i]} - ( ${biometric.companyMaster.companyName} )`,
        };
        finalData.push(biometric1);
      }
    }

    return res.status(200).json({ status: 200, data: finalData });
  } catch (err) {
    next(err);
  }
};
