const Sequelize = require('sequelize');
const HrLeaveTypes = require('../models/hrLeaveTypes');
const HrLeaveMaster = require('../models/hrLeaveMaster');
const UserMaster = require('../models/userMaster');
const companyMaster = require('../models/companyMaster');
const logger = require('../config/logger');
const sequelize = require('../config/database');
const message = require('../response_message/message');
const { executeQuery } = require('./common.controller');
const jwt = require('jsonwebtoken');

const hrLeaveBalance = require('../models/hrLeaveBalance');
const EmployeeSalaryPolicy = require('../models/employeeSalaryPolicy');
const SalaryPolicy = require('../models/salaryPolicy');
const { daysInMonth } = require('../utils/commonUtilFunctions');
const { generateExcel } = require('../utils/exportData');
const path = require('path');

/**
 * save hr Leave Types fields data.
 *
 * @body {createBy} createBy user id of user who added the hr salary field.
 * @body {number} createBy if any user change data then updateBy id change.
 
 */

exports.postAddHrLeaveTypes = async (req, res, next) => {
  try {
    let {
      LeaveID,
      companyMasterID,
      SortIndex,
      Allow_On_H,
      Leave_Max_Days,
      Leave_Elegibility_Days,
      Leave_per_Days,
      Leave_CF,
      Leave_Allow,
      // Eff_Total,
      // Allow_Field_Entry,
      createBy,
      createByIp,
    } = await req.body;

    let uniquedata = await HrLeaveTypes.findOne({
      where: {
        LeaveID: LeaveID,
        companyMasterID: companyMasterID,
        status: 1,
      },
    });
    if (uniquedata) {
      return res.status(200).json({
        status: 401,
        message: message.usermessage.leavetypealreadyexist,
      });
    }
    await sequelize.transaction(async (t) => {
      await HrLeaveTypes.create(
        {
          LeaveID,
          companyMasterID,
          SortIndex,
          Allow_On_H,
          Leave_Max_Days,
          Leave_Elegibility_Days,
          Leave_per_Days,
          Leave_CF,
          Leave_Allow,
          // Eff_Total,
          // Allow_Field_Entry,
          createBy,
          createByIp,
        },
        { transaction: t }
      );

      const CF_LeaveData = await HrLeaveMaster.findOne({
        where: {
          CF_LeaveID: LeaveID,
          status: 1,
        },
      });

      if (CF_LeaveData) {
        // Create CF Leave Type
        await HrLeaveTypes.create(
          {
            LeaveID: CF_LeaveData.LeaveID,
            companyMasterID,
            SortIndex,
            Allow_On_H,
            Leave_Max_Days,
            Leave_Elegibility_Days,
            Leave_per_Days,
            Leave_CF,
            Leave_Allow: 'N',
            // Eff_Total,
            // Allow_Field_Entry,
            createBy,
            createByIp,
          },
          { transaction: t }
        );
      }
    });

    return res.status(200).json({
      status: 200,
      message: message.usermessage.HrLeaveTypesadd,
      // data: insert_db_status,
    });
  } catch (err) {
    next(err);
  }
};

/**
 return all Hr Leave Typs data
 */

exports.getAllHrLeaveTypes = async (req, res, next) => {
  try {
    let { limit, page } = await req.body;
    let offset = (page - 1) * limit;
    let HR_LeaveType = [];
    if (limit == '' && page == '') {
      HR_LeaveType = await HrLeaveTypes.findAll({
        raw: true,
        where: {
          status: {
            [Sequelize.Op.in]: [0, 1],
          },
        },
        order: [['SortIndex', 'ASC']],
      });
    } else {
      HR_LeaveType = await HrLeaveTypes.findAll({
        raw: true,
        where: {
          status: {
            [Sequelize.Op.in]: [0, 1],
          },
        },
        order: [['SortIndex', 'ASC']],
        limit: limit,
        offset: offset,
      });
    }
    const totalcount = await HrLeaveTypes.count({
      raw: true,
      where: { status: ['0', '1'] },
    });

    res
      .status(200)
      .json({ status: 200, data: HR_LeaveType, totalcount: totalcount });
  } catch (err) {
    next(err);
  }
};

/**
 return all Hr Leave Typs data
 */

exports.getHrLeaveTypesByCompany = async (req, res, next) => {
  try {
    const { companyMasterID, limit, page, searchQuery, exportData } =
      await req.body;

    const condition = {};

    condition.status = [0, 1];

    if (companyMasterID) condition.companyMasterID = companyMasterID;

    if (searchQuery)
      condition[Sequelize.Op.or] = [
        {
          '$LeaveMaster.LeaveName$': {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
        {
          '$companyMaster.companyName$': {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
      ];

    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }

    const order = [['createdAt', 'DESC']];

    const hrLeaveTypes = await HrLeaveTypes.findAndCountAll({
      where: condition,
      ...paginationQuery,
      order,
      include: [
        {
          model: companyMaster,
          attributes: ['companyName'],
        },
        {
          model: HrLeaveMaster,
          as: 'LeaveMaster',
          where: {
            CF_LeaveID: {
              [Sequelize.Op.is]: null,
            },
          },
        },
      ],
    });
    console.log(hrLeaveTypes.rows.length, '---');
    for (var j = 0; j < hrLeaveTypes.rows.length; j++) {
      let user1 = await UserMaster.findOne({
        raw: true,
        where: {
          userMasterID: hrLeaveTypes.rows[j].createBy,
        },
      });
      let user2 = await UserMaster.findOne({
        raw: true,
        where: {
          userMasterID: hrLeaveTypes.rows[j].updateBy,
        },
      });

      if (user1) {
        hrLeaveTypes.rows[j].createBy = user1.displayName;
      }
      if (user2) {
        hrLeaveTypes.rows[j].updateBy = user2.displayName;
      }
    }
    console.log(hrLeaveTypes.rows.length, '---111');
    if (exportData) {
      const finalData = [];
      for (let i = 0; i < hrLeaveTypes.rows.length; i++) {
        const data1 = {
          LeaveName: hrLeaveTypes.rows[i].LeaveMaster.LeaveName,
          CompanyName: hrLeaveTypes.rows[i].companyMaster.companyName,
          Description: hrLeaveTypes.rows[i].LeaveMaster.LeaveDesc,
          Status: hrLeaveTypes.rows[i].status,
        };
        data1.Status == 1
          ? (data1.Status = 'Active')
          : (data1.Status = 'Deactive');
        finalData.push(data1);
      }

      await generateExcel(finalData, 'Leave_Types', 'xlsx', res);
      return;
    }

    return res.status(200).json({
      status: 200,
      data: hrLeaveTypes.rows,
      totalcount: hrLeaveTypes.count,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * find data with LeaveTypes id
 *
 * @param {id} LeaveTranId  to fetch Payhead name
 */

exports.getHrLeaveTypesById = async (req, res, next) => {
  try {
    let get_one_data = await HrLeaveTypes.findOne({
      where: {
        LeaveTranId: req.params.id,
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
      },
      raw: true,
    });

    if (!get_one_data) {
      res
        .status(200)
        .json({ status: 200, message: message.usermessage.deletedrecord });
    } else {
      res.status(200).json({ status: 200, data: get_one_data });
    }
  } catch (err) {
    next(err);
  }
};

/**
 * update data
 *
 * @param {id} LeaveTranId  to update id
 */
exports.postUpdateHrLeaveTypes = async (req, res, next) => {
  try {
    let = {
      LeaveTranId,
      LeaveID,
      SortIndex,
      Allow_On_H,
      Leave_Max_Days,
      Leave_Elegibility_Days,
      Leave_per_Days,
      Leave_CF,
      Leave_Allow,
      // Eff_Total,
      // Allow_Field_Entry,
      companyMasterID,
      updateBy,
      updateByIp,
    } = await req.body;

    let uniquedata = await HrLeaveTypes.findOne({
      where: {
        LeaveID: LeaveID,
        companyMasterID: companyMasterID,
        LeaveTranId: { [Sequelize.Op.notIn]: [LeaveTranId] },
        status: 1,
      },
    });
    if (uniquedata) {
      res.status(200).json({
        status: 401,
        message: message.usermessage.leavetypealreadyexist,
      });
    } else {
      let change_data_status = await HrLeaveTypes.update(
        {
          LeaveID,
          SortIndex,
          Allow_On_H,
          Leave_Max_Days,
          Leave_Elegibility_Days,
          Leave_per_Days,
          Leave_CF,
          Leave_Allow,
          // Eff_Total,
          // Allow_Field_Entry,
          updateBy,
          updateByIp,
        },
        {
          where: { LeaveTranId: LeaveTranId },
        }
      );

      res
        .status(200)
        .json({ status: 200, message: message.usermessage.HrLeaveTypesUpdate });
    }
  } catch (err) {
    next(err);
  }
};

/**
 * update status
 *
 * @param {id} LeaveTranId  to update status of Payhead
 */

exports.poststatuschange = async (req, res, next) => {
  try {
    let = { LeaveTranId, status } = await req.body;
    let delete_status;
    if (status == '1') {
      delete_status = await HrLeaveTypes.update(
        {
          status: '1',
        },
        {
          where: { LeaveTranId: LeaveTranId, status: ['1', '0'] },
        }
      );
    } else {
      let data = await hrLeaveBalance.findOne({
        where: {
          LeaveTranId: LeaveTranId,
        },
      });

      if (data) {
        return res.status(200).json({
          status: 401,
          message:
            'You can not deactive this leaveType. Already assigned to employees.',
        });
      } else {
        delete_status = await HrLeaveTypes.update(
          {
            status: '0',
          },
          {
            where: { LeaveTranId: LeaveTranId, status: ['1', '0'] },
          }
        );
      }
    }

    if (delete_status != 0) {
      res.status(200).json({
        status: 200,
        message: message.usermessage.payheaddelete,
        data: {},
      });
    } else {
      res.status(200).json({
        status: 200,
        message: message.usermessage.deletedrecord,
        data: {},
      });
    }
  } catch (err) {
    next(err);
  }
};

/**
 * delete by i
 *
 * @param {id} LeaveTranId  to delete id
 */
exports.postDeleteHrLeaveTypeById = async (req, res, next) => {
  try {
    let { LeaveTranId } = await req.body;

    let data = await hrLeaveBalance.findOne({
      where: {
        LeaveTranId: LeaveTranId,
      },
    });

    if (data) {
      return res.status(200).json({
        status: 401,
        message:
          'You can not delete this leaveType. Already assigned to employees.',
      });
    }

    const currentLeave = await HrLeaveTypes.findOne({
      where: {
        LeaveTranId: LeaveTranId,
      },
    });

    if (!currentLeave) throw new Error('LeaveType not found!');

    await sequelize.transaction(async (t) => {
      currentLeave.status = 2;

      await currentLeave.save({ transaction: t });

      const findCFData = await HrLeaveTypes.findOne({
        where: {
          status: 1,
        },
        include: [
          {
            required: true,
            model: HrLeaveMaster,
            as: 'LeaveMaster',
            where: { CF_LeaveID: currentLeave.LeaveID, status: 1 },
            attributes: [],
          },
        ],
      });

      if (findCFData) {
        findCFData.status = 2;
        await findCFData.save({ transaction: t });
      }
    });

    return res
      .status(200)
      .json({ status: 200, message: 'Leave Type Deleted Successfully.' });
  } catch (err) {
    next(err);
  }
};

/**
 * import Hr Leave Types  data
 * @param {file}
 */
exports.postImportData = async (req, res, next) => {
  try {
    const file = req.file;
    let { createBy, createByIp } = req.body;

    if (!file) {
      const error = new Error('No File');
      error.httpStatusCode = 400;
      console.log('Getting error :-', error);
      return next(error);
    } else {
      const filePath = path.join(__dirname, `../uploads/${req.file.filename}`);

      fs.readFile(filePath, async (err, data) => {
        if (err) throw err;

        const HrLeaveTypes = JSON.parse(data);

        let insert_db_status = await HrLeaveTypes.bulkCreate(HrLeaveTypes, {
          returning: true,
        });
        // console.log(insert_db_status);

        res.json({ success: 200, message: 'data inserted' });
      });
    }
  } catch (err) {
    next(err);
  }
};

exports.getHrLeaveTypesByCompany1 = async (req, res, next) => {
  try {
    let hrleavetypes,
      totalcount,
      balance = 0;

    let result = await sequelize.transaction(async (t) => {
      hrleavetypes = await HrLeaveTypes.findAll({
        where: {
          companyMasterID: req.body.id,
          LeaveID: {
            [Sequelize.Op.notIn]: [1, 5, 9, 7, 18],
          },
          status: 1,
        },
        include: [
          {
            model: HrLeaveMaster,
          },
          {
            model: companyMaster,
          },
        ],
        transaction: t,
        order: [['LeaveTranId', 'ASC']],
      });

      totalcount = await HrLeaveTypes.count({
        where: {
          companyMasterID: req.body.id,
          status: 1,
          LeaveID: {
            [Sequelize.Op.notIn]: [1, 5, 9, 7, 18],
          },
        },
        transaction: t,
      });

      const date = new Date().toISOString().slice(0, 10);

      const year = date.slice(0, 4);
      const Month = date.slice(5, 7);
      const monday = daysInMonth(Month, year);

      let start_date, end_date;

      const user_salaryPolicy = await EmployeeSalaryPolicy.findOne({
        where: {
          status: 1,
          userMasterID: req.body.userid,
          startDate: {
            [Sequelize.Op.lte]: new Date(),
          },

          [Sequelize.Op.or]: [
            { endDate: { [Sequelize.Op.is]: null } },
            { endDate: { [Sequelize.Op.gte]: new Date() } },
          ],
        },
        include: [
          {
            model: SalaryPolicy,
            as: 'salaryPolicy',
            // attributes: ['salaryCycleDate']
          },
        ],
      });

      if (user_salaryPolicy) {
        let date = user_salaryPolicy.salaryPolicy.salaryCycleDate;

        date = (date < 10 ? '0' : '') + date;

        start_date = year + '-' + Month + '-' + date;

        let date1 = new Date(start_date);
        date1.setDate(date1.getDate() + (monday - 1));

        end_date =
          date1.getFullYear() +
          '-' +
          String(date1.getMonth() + 1).padStart(2, '0') +
          '-' +
          String(date1.getDate()).padStart(2, '0');
      } else {
        const date = '01';
        start_date = year + '-' + Month + '-' + date;
        end_date = year + '-' + Month + '-' + monday;
      }

      if (start_date > date) {
        let date1 = new Date(start_date);
        date1.setMonth(date1.getMonth() - 1);

        start_date =
          date1.getFullYear() +
          '-' +
          String(date1.getMonth() + 1).padStart(2, '0') +
          '-' +
          String(date1.getDate()).padStart(2, '0');

        let date2 = new Date(end_date);
        date2.setMonth(date2.getMonth() - 1);

        end_date =
          date2.getFullYear() +
          '-' +
          String(date2.getMonth() + 1).padStart(2, '0') +
          '-' +
          String(date2.getDate()).padStart(2, '0');
      }

      const yearmonth = start_date.slice(0, 4) + start_date.slice(5, 7);

      for (var i = 0; i < hrleavetypes.length; i++) {
        let fig1 = 0,
          fig2 = 0;

        let user_addleavesum, user_usedleavesum;

        // monthly carry forward is not allowed
        // Lotlekar Jwellers

        if (req.body.id == 201 && hrleavetypes[i].LeaveID == 2) {
          user_addleavesum = await executeQuery(
            `
          select coalesce(sum(cast("LeaveAddNew" as numeric)),0)+coalesce(sum("OPBal"),0) as TotalAdd from public."hrLeaveBalances" where "userMasterID"=` +
              req.body.userid +
              `  and "LeaveTranId"=` +
              hrleavetypes[i].LeaveTranId +
              ` and "YearMM" = ` +
              yearmonth +
              `  group by "LeaveTranId","userMasterID"`
          );

          user_usedleavesum = await executeQuery(
            `
          select coalesce(sum(AuthTran."days"),0) as UsedLeave from  public."userLeaves" as LTran inner join "userLeaveTransactions"  as AuthTran on LTran."UserLeaveApplicationID"=AuthTran."ReferenceID" where AuthTran."status"=1 AND AuthTran."LeaveTranId"=` +
              hrleavetypes[i].LeaveTranId +
              ` and LTran."userMasterID"=` +
              req.body.userid +
              `  and AuthTran."date" BETWEEN '` +
              start_date +
              `' and '` +
              end_date +
              `' group by AuthTran."LeaveTranId",LTran."userMasterID"
          `
          );
        } else {
          user_addleavesum = await executeQuery(
            `select coalesce(sum(cast("LeaveAddNew" as numeric)),0)+coalesce(sum("OPBal"),0) as TotalAdd from public."hrLeaveBalances" where "userMasterID"=` +
              req.body.userid +
              ` and "LeaveTranId"=` +
              hrleavetypes[i].LeaveTranId +
              ` group by "LeaveTranId","userMasterID"`
          );
          user_usedleavesum = await executeQuery(
            `select coalesce(sum(AuthTran."days"),0) as UsedLeave from  public."userLeaves" as LTran inner join "userLeaveTransactions"  as AuthTran on LTran."UserLeaveApplicationID"=AuthTran."ReferenceID" where AuthTran."status"=1 AND AuthTran."LeaveTranId"=` +
              hrleavetypes[i].LeaveTranId +
              ` and LTran."userMasterID"=` +
              req.body.userid +
              ` group by AuthTran."LeaveTranId",LTran."userMasterID"`
          );
        }

        if (user_addleavesum.length != 0) {
          fig1 = Number(user_addleavesum[0].totaladd);
        }

        if (user_usedleavesum.length != 0) {
          fig2 = Number(user_usedleavesum[0].usedleave);
        }

        const balance = fig1 - fig2;

        hrleavetypes[i].status = balance != 0 ? balance.toFixed(2) : 0;
      }
    });
    if (req.body.isSocketRequest) {
      return hrleavetypes;
    }
    return res.status(200).json({
      status: 200,
      data: hrleavetypes,
      balance: balance,
      totalcount: totalcount,
    });
  } catch (err) {
    if (req.body.isSocketRequest) return err;
    next(err);
  }
};

exports.listDataWithoutOutdoorDuty = async (req, res, next) => {
  try {
    const { id } = req.params;

    const data = await HrLeaveTypes.findAll({
      where: {
        LeaveID: {
          [Sequelize.Op.notIn]: [5, 18, 25],
        },
        status: 1,
        companyMasterID: id,
        Leave_Allow: 'Y',
      },
      include: [{ model: HrLeaveMaster, as: 'LeaveMaster' }],
    });

    return res.status(200).json({
      status: 200,
      data,
    });
  } catch (error) {
    next(error);
  }
};

exports.addDataInAllCompany = async (req, res, next) => {
  try {
    const allCompany = await companyMaster.findAll({
      where: {
        status: [0, 1],
      },
      attributes: ['companyMasterID', 'createBy', 'createByIp'],
    });

    const allOutdoorDuty = await HrLeaveTypes.findAll({
      where: {
        companyMasterID: {
          [Sequelize.Op.in]: allCompany.map((e) => e.companyMasterID),
        },
        status: 1,
        LeaveID: 25,
      },
    });

    const finalData = [];

    for (const company of allCompany) {
      const companyMasterID = company.companyMasterID;
      const data = allOutdoorDuty.find(
        (e) => e.companyMasterID == companyMasterID
      );

      if (data) continue;

      finalData.push({
        LeaveID: 25,
        companyMasterID,
        createBy: company.createBy,
        createByIp: company.createByIp,
      });
    }

    // await HrLeaveTypes.bulkCreate(finalData);

    return res.status(200).json({
      status: 200,
      data: finalData,
    });
  } catch (error) {
    next(error);
  }
};

exports.listLeaveTypeForManageLeave = async (req, res, next) => {
  try {
    const { id } = req.params;

    const data = await HrLeaveTypes.findAll({
      where: {
        LeaveID: {
          [Sequelize.Op.notIn]: [5, 18, 24, 25],
        },
        status: 1,
        companyMasterID: id,
        Leave_Allow: 'Y',
      },
      include: [{ model: HrLeaveMaster, as: 'LeaveMaster' }],
    });

    return res.status(200).json({
      status: 200,
      data,
    });
  } catch (error) {
    next(error);
  }
};
