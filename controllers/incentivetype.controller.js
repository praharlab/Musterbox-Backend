const Sequelize = require('sequelize');
const logger = require('../config/logger');
const message = require('../response_message/message');
const sequelize = require('../config/database');
const companyMaster = require('../models/companyMaster');
const Incentivetype = require('../models/incentivetype');
const employeeIncentive = require('../models/employeeincentive');
const { generateExcel } = require('../utils/exportData');
const UserMaster = require('../models/userMaster');
const { nonEditableList_INC } = require('../utils/dbUtils')

/**
 * save asset incentivetype data.
 *
 * @body {createBy} createBy user id of user who added the incentivetype.
 * @body {number} createBy if any user change data then updateBy id change.
 
 */


exports.postAddincentivetype = async (req, res, next) => {
  try {
    const {
      incentivetypename,
      showinsalaryslip,
      consider,
      status,
      companyMasterID,
      createBy,
      createByIp,
      pfApplicable,
      esicApplicable,
      employeeESICPer,
      employerESICPer,
    } = await req.body;

    let insert_db_status = {};

    const find_SameData = await Incentivetype.findOne({
      where: Sequelize.and(
        Sequelize.or(
          Sequelize.where(
            sequelize.fn(
              'TRIM',
              sequelize.fn('LOWER', sequelize.col('incentivetypename'))
            ),
            String(incentivetypename).trim().toLowerCase()
          ),
          Sequelize.where(
            sequelize.fn(
              'TRIM',
              sequelize.fn('LOWER', sequelize.col('inc_type_displayName'))
            ),
            String(incentivetypename).trim().toLowerCase()
          )
        ),

        Sequelize.where(sequelize.col('companyMasterID'), companyMasterID),
        Sequelize.or(
          Sequelize.where(sequelize.col('status'), 0),
          Sequelize.where(sequelize.col('status'), 1)
        )
      ),
    });

    if (find_SameData)
      return res.status(200).json({
        status: 401,
        message: ` Incentive Type name '${incentivetypename}' already exists. Please choose another.`,
      });


    insert_db_status = await Incentivetype.create(
      {
        incentivetypename,
        showinsalaryslip,
        consider,
        status,
        companyMasterID,
        createBy,
        createByIp,
        pfApplicable,
        esicApplicable,
        employeeESICPer: esicApplicable ? employeeESICPer : null,
        employerESICPer: esicApplicable ? employerESICPer : null,
      },
    );


    return res.status(200).json({
      status: 200,
      message: message.usermessage.incentivetypeadd,
      data: insert_db_status,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Update Data
 */

exports.postUpdateincentivetype = async (req, res, next) => {
  try {
    const {
      IncentivetypeID,
      showinsalaryslip,
      incentivetypename,
      consider,
      status,
      companyMasterID,
      updateBy,
      updateByIp,
      pfApplicable,
      esicApplicable,
      employeeESICPer,
      employerESICPer,
      inc_type_displayName,
    } = await req.body;


    const find_SameData = await Incentivetype.findOne({
      where: Sequelize.and(
        Sequelize.or(
          Sequelize.where(
            sequelize.fn(
              'TRIM',
              sequelize.fn('LOWER', sequelize.col('incentivetypename'))
            ),
            String(incentivetypename).trim().toLowerCase()
          ),
          Sequelize.where(
            sequelize.fn(
              'TRIM',
              sequelize.fn('LOWER', sequelize.col('inc_type_displayName'))
            ),
            String(incentivetypename).trim().toLowerCase()
          )
        ),
        Sequelize.where(sequelize.col('companyMasterID'), companyMasterID),
        Sequelize.or(
          Sequelize.where(sequelize.col('status'), 0),
          Sequelize.where(sequelize.col('status'), 1)
        ),
        Sequelize.where(sequelize.col('IncentivetypeID'), {
          [Sequelize.Op.ne]: IncentivetypeID,
        })
      ),
    });

    if (find_SameData)
      return res.status(200).json({
        status: 401,
        message: ` Incentive Type name '${incentivetypename}' already exists. Please choose another.`,
      });

    const findData = await Incentivetype.findByPk(IncentivetypeID);

    // for not edit name of Attendance Bonus and Food Allowance
    if (
      findData &&
      nonEditableList_INC.includes(String(findData.incentivetypename).trim().toLowerCase()) &&
      String(findData.incentivetypename).toLowerCase().trim() !=
      String(incentivetypename).toLowerCase().trim()
    )
      return res.status(200).json({
        status: 401,
        message: `Modification of the incentive Type name '${findData.incentivetypename}' is not allowed.`,
      });


    await Incentivetype.update(
      {
        showinsalaryslip,
        incentivetypename,
        consider,
        status,
        companyMasterID,
        updateBy,
        updateByIp,
        pfApplicable,
        esicApplicable,
        employeeESICPer: esicApplicable ? employeeESICPer : null,
        employerESICPer: esicApplicable ? employerESICPer : null,
        inc_type_displayName:
          nonEditableList_INC.includes(String(findData.incentivetypename).trim().toLowerCase())
            ? inc_type_displayName
            : null,
      },
      {
        where: { IncentivetypeID: IncentivetypeID },
      }
    );

    return res.status(200).json({
      status: 200,
      message: message.usermessage.incentivetypeupdate,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * update status
 *
 * @param {id}  IncentivetypeID to update status of user experience
 */

exports.poststatuschange = async (req, res, next) => {
  try {
    let { IncentivetypeID, status } = await req.body;
    let delete_status;

    const incentive = await Incentivetype.findOne({
      raw: true,
      where: {
        IncentivetypeID,
      },
    });

    if (
      incentive &&
      nonEditableList_INC.includes(String(findData.incentivetypename).trim().toLowerCase())
    ) {
      return res.status(200).json({
        status: 200,
        message: `You can not chage status  of an incentive type '${incentive.incentivetypename}'.`,
      });
    }

    let result = await sequelize.transaction(async (t) => {
      if (status == '1') {
        delete_status = await Incentivetype.update(
          {
            status: '1',
          },
          {
            where: { IncentivetypeID: IncentivetypeID, status: ['1', '0'] },
            transaction: t,
          }
        );
      } else {
        let data = await employeeIncentive.findOne({
          where: {
            IncentivetypeID: IncentivetypeID,
            status: ['1', '0'],
          },
        });
        if (data) {
          return res.status(200).json({
            status: 401,
            message:
              'You can not deactivate this Incentive Type.Already assigned to employees.',
          });
        } else {
          delete_status = await Incentivetype.update(
            {
              status: '0',
            },
            {
              where: { IncentivetypeID: IncentivetypeID, status: ['1', '0'] },
              transaction: t,
            }
          );
        }
      }
      if (delete_status != 0) {
        res.status(200).json({
          status: 200,
          message: message.usermessage.incentivetypeupdate,
          data: {},
        });
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

exports.deleteincentivetypeData = async (req, res, next) => {
  try {
    let IncentivetypeID = await req.params.id;

    let data = await employeeIncentive.findOne({
      where: {
        IncentivetypeID: IncentivetypeID,
        status: ['1', '0'],
      },
    });
    if (data) {
      return res.status(200).json({
        status: 401,
        message:
          'You can not delete this Incentive Type.Already assigned to employees.',
      });
    } else {
      let result = await sequelize.transaction(async (t) => {
        let delete_status = await Incentivetype.update(
          {
            status: 2,
          },
          {
            where: { IncentivetypeID: IncentivetypeID },
            transaction: t,
          }
        );

        res.status(200).json({
          status: 200,
          message: message.usermessage.incentivetypedelete,
        });
        return delete_status;
      });
    }
  } catch (err) {
    next(err);
  }
};

/**
 * find data with IncentivetypeID id
 *
 * @param {id} IncentivetypeID  to fetch branch name
 */

exports.getbyIncentivetypeId = async (req, res, next) => {
  try {
    const get_one_data = await Incentivetype.findOne({
      where: {
        IncentivetypeID: req.params.id,
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
      },
      include: [{ model: companyMaster, attributes: ['companyName'] }],
      raw: true,
    });

    return res.status(200).json({ status: 200, data: get_one_data });
  } catch (err) {
    next(err);
  }
};

/**
 * delete by id
 *
 * @param {id} employeeReportToID  to delete id
 */
exports.postDeletebyIncentivetypeID = async (req, res, next) => {
  try {
    const { IncentivetypeID } = await req.body;

    const incentive = await Incentivetype.findOne({
      raw: true,
      where: {
        IncentivetypeID,
      },
    });

    if (
      incentive &&
      nonEditableList_INC.includes(String(findData.incentivetypename).trim().toLowerCase())
    ) {
      return res.status(200).json({
        status: 200,
        message: `You can not delete an incentive type 'Attendance Bonus'.`,
      });
    }

    await Incentivetype.destroy({
      where: {
        IncentivetypeID,
      },
    });

    return res.status(200).json({
      status: 200,
      message: message.usermessage.incentivetypedelete,
    });
  } catch (err) {
    next(err);
  }
};

exports.getAllincentivedatabycompanyid = async (req, res, next) => {
  try {
    const { companyMasterID, limit, page, searchQuery, exportData } =
      await req.body;

    const condition = {};

    condition.status = [0, 1];

    if (companyMasterID) condition.companyMasterID = companyMasterID;

    if (searchQuery)
      condition[Sequelize.Op.or] = [
        {
          incentivetypename: {
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

    const incentiveType = await Incentivetype.findAndCountAll({
      raw: true,
      where: condition,
      ...paginationQuery,
      order,
      include: [
        {
          model: companyMaster,
          as: 'companyMaster',
          attributes: ['companyName'],
        },
      ],
    });

    if (exportData) {
      const finalData = [];

      for (let i = 0; i < incentiveType.rows.length; i++) {
        const data1 = {
          IncentiveTypeName: incentiveType.rows[i].incentivetypename,
          inc_type_displayName: incentiveType.rows[i].inc_type_displayName,
          CompanyName: incentiveType.rows[i]['companyMaster.companyName'],

          ConsiderInGrossSalary: incentiveType.rows[i].consider,
          ShowInSalarySlip: incentiveType.rows[i].showinsalaryslip,
          Status: incentiveType.rows[i].status,
        };
        data1.Status == 1
          ? (data1.Status = 'Active')
          : (data1.Status = 'Deactive');
        data1.ShowInSalarySlip == 'true'
          ? (data1.ShowInSalarySlip = 'Yes')
          : (data1.ShowInSalarySlip = 'No');

        if (data1.ConsiderInGrossSalary == 'net')
          data1.ConsiderInGrossSalary = 'Not Consider in gross salary';
        if (data1.ConsiderInGrossSalary == 'gross')
          data1.ConsiderInGrossSalary = 'Consider in gross salary';
        finalData.push(data1);
      }

      await generateExcel(finalData, 'IncentiveType', 'xlsx', res);
      return;
    }

    return res.status(200).json({
      status: 200,
      data: incentiveType.rows,
      totalcount: incentiveType.count,
    });
  } catch (err) {
    next(err);
  }
};
