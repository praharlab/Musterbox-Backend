const employeeAccident = require('../models/employeeAccident');
const logger = require('../config/logger');
const message = require('../response_message/message');
const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const { executeQuery } = require('./common.controller');
const UserMaster = require('../models/userMaster');

exports.AddEmpAccident = async (req, res, next) => {
  try {
    let = {
      userMasterID,
      NoticeDate,
      AccidentDate,
      AccidentTime,
      AccidentLocation,
      AccidentCause,
      InjuryNature,
      WitnessOneName,
      WitnessOneAddress,
      WitnessOneOccupation,
      WitnessSecondName,
      WitnessSecondAddress,
      WitnessSecondOccupation,
      ReturnDate,
      TotalDays,
      createBy,
      createByIp,
    } = await req.body;
    let insert_db_status;

    await sequelize.transaction(async (t) => {
      insert_db_status = await employeeAccident.create(
        {
          userMasterID,
          NoticeDate,
          AccidentDate,
          AccidentTime,
          AccidentLocation,
          AccidentCause,
          InjuryNature,
          WitnessOneName,
          WitnessOneAddress,
          WitnessOneOccupation,
          WitnessSecondName,
          WitnessSecondAddress,
          WitnessSecondOccupation,
          ReturnDate,
          TotalDays,
          createBy,
          createByIp,
        },
        { transaction: t }
      );
    });
    res
      .status(200)
      .json({ status: 200, message: message.usermessage.addEmpAccident });
    return insert_db_status;
  } catch (err) {
    next(err);
  }
};

exports.getEmpAccidentData = async (req, res, next) => {
  try {
    let { limit, page, companyMasterID, userMasterID, startdate, enddate } =
      await req.body;
    let offset = (page - 1) * limit;
    let Accident_data;
    let Accident_data_count;
    let totalcount;

    if (page == '' && limit == '') {
      if (userMasterID.length == 0 && startdate == '' && enddate == '') {
        Accident_data = await executeQuery(
          `select um."displayName",um."userNumber",ea.* from "public"."employeeAccidents" as ea inner join "public"."userMasters" as um on ea."userMasterID"=um."userMasterID" where um."companyMasterId"=` +
            companyMasterID +
            ` and ea."status"=1 order by ea."AccidentDate" ASC`
        );
      } else {
        Accident_data = await executeQuery(
          `select um."displayName",um."userNumber",ea.* from "public"."employeeAccidents" as ea inner join "public"."userMasters" as um on ea."userMasterID"=um."userMasterID" where ea."userMasterID" in (` +
            userMasterID +
            `) and ea."AccidentDate" between '` +
            startdate +
            `' and '` +
            enddate +
            `' and ea."status"=1 order by ea."AccidentDate" DESC`
        );
      }
    } else {
      if (userMasterID.length == 0 && startdate == '' && enddate == '') {
        Accident_data = await executeQuery(
          `select um."displayName",um."userNumber",ea.* from "public"."employeeAccidents" as ea inner join "public"."userMasters" as um on ea."userMasterID"=um."userMasterID" where um."companyMasterId"=` +
            companyMasterID +
            ` and ea."status"=1 order by ea."AccidentDate" ASC limit ` +
            limit +
            ` offset ` +
            offset +
            ` `
        );

        Accident_data_count = await executeQuery(
          `select um."displayName",um."userNumber",ea.* from "public"."employeeAccidents" as ea inner join "public"."userMasters" as um on ea."userMasterID"=um."userMasterID" where um."companyMasterId"=` +
            companyMasterID +
            ` and ea."status"=1 order by ea."AccidentDate" ASC`
        );

        totalcount = Accident_data_count.length;
      } else {
        Accident_data = await executeQuery(
          `select um."displayName",um."userNumber",ea.* from "public"."employeeAccidents" as ea inner join "public"."userMasters" as um on ea."userMasterID"=um."userMasterID" where ea."userMasterID" in (` +
            userMasterID +
            `) and ea."AccidentDate" between '` +
            startdate +
            `' and '` +
            enddate +
            `' and ea."status"=1 order by ea."AccidentDate" DESC limit ` +
            limit +
            ` offset ` +
            offset +
            ``
        );

        Accident_data_count = await executeQuery(
          `select um."displayName",um."userNumber",ea.* from "public"."employeeAccidents" as ea inner join "public"."userMasters" as um on ea."userMasterID"=um."userMasterID" where ea."userMasterID" in (` +
            userMasterID +
            `) and ea."AccidentDate" between '` +
            startdate +
            `' and '` +
            enddate +
            `' and ea."status"=1 order by ea."AccidentDate" DESC`
        );

        totalcount = Accident_data_count.length;
      }
    }

    res
      .status(200)
      .json({ status: 200, data: Accident_data, totalcount: totalcount });
  } catch (err) {
    next(err);
  }
};

exports.getEmpAccidentDataById = async (req, res, next) => {
  try {
    let Accident_data;

    Accident_data = await executeQuery(
      `select um."displayName",um."userNumber",ea.* from "public"."employeeAccidents" as ea inner join "public"."userMasters" as um on ea."userMasterID"=um."userMasterID"  where ea."AccidentID"=` +
        req.params.id +
        ``
    );

    res.status(200).json({ status: 200, data: Accident_data });
  } catch (err) {
    next(err);
  }
};

exports.postUpdateEmpAccident = async (req, res, next) => {
  try {
    let = {
      AccidentID,
      NoticeDate,
      AccidentTime,
      AccidentLocation,
      AccidentCause,
      InjuryNature,
      WitnessOneName,
      WitnessOneAddress,
      WitnessOneOccupation,
      WitnessSecondName,
      WitnessSecondAddress,
      WitnessSecondOccupation,
      ReturnDate,
      TotalDays,
      updateBy,
      updateByIp,
    } = await req.body;

    let result = await sequelize.transaction(async (t) => {
      let change_data_status = await employeeAccident.update(
        {
          AccidentID,
          NoticeDate,
          AccidentTime,
          AccidentLocation,
          AccidentCause,
          InjuryNature,
          WitnessOneName,
          WitnessOneAddress,
          WitnessOneOccupation,
          WitnessSecondName,
          WitnessSecondAddress,
          WitnessSecondOccupation,
          ReturnDate,
          TotalDays,
          updateBy,
          updateByIp,
        },
        {
          where: { AccidentID: AccidentID },
          transaction: t,
        }
      );

      res
        .status(200)
        .json({ status: 200, message: message.usermessage.editEmpAccident });

      return change_data_status;
    });
  } catch (err) {
    next(err);
  }
};

exports.postDeleteEmpAccident = async (req, res, next) => {
  try {
    let = { AccidentID, updateBy, updateByIp } = await req.body;

    let result = await sequelize.transaction(async (t) => {
      let change_data_status = await employeeAccident.update(
        {
          AccidentID,
          status: 2,
          updateBy,
          updateByIp,
        },
        {
          where: { AccidentID: AccidentID },
          transaction: t,
        }
      );

      res
        .status(200)
        .json({ status: 200, message: message.usermessage.deleteEmpAccident });

      return change_data_status;
    });
  } catch (err) {
    next(err);
  }
};
