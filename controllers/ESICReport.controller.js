const Sequelize = require('sequelize');
const logger = require('../config/logger');
const sequelize = require('../config/database');
const message = require('../response_message/message');

exports.getESICReportData = async (req, res, next) => {
  try {
    let { companyId, yearMonth } = await req.body;

    let ESICReportData;
    ESICReportData = await sequelize.query(
      `select PH."payheadName",ST."EmployeeSalaryAmount",ST."EmployeeSalaryPer",ST."salaryYYYYMM" from  public."hrSalaryTrasactions" as ST 
            inner join public."hrSalaryMasters" as SM on ST."salaryMasterID"=SM."salaryMasterID"
            inner join public."gradeSalaryStructures" as GSS on SM."gradeSalaryStructureID"=GSS."gradeSalaryStructureID"
            inner join public."hrSalaryFields" as SF on GSS."salaryFieldID"=SF."salaryFieldID"
            inner join public."Payheadmasters" as PH on SF."payheadMasterId"=PH."payheadMasterId"
            where SF."companyMasterID"= $companyId and PH."payheadMasterId"=13 and ST."salaryYYYYMM"=$yearMonth`,
      {
        bind: {
          companyId: companyId,
          yearMonth: yearMonth,
        },
        type: Sequelize.SELECT,
      }
    );
    if (!ESICReportData) {
      res
        .status(200)
        .json({ status: 200, message: message.usermessage.deletedrecord });
    } else {
      res.status(200).json({ status: 200, data: ESICReportData });
    }
  } catch (err) {
    next(err);
  }
};
