const Sequelize = require("sequelize");
const { asiaKolkataDateTime, month_dict } = require("../utils/commonUtilFunctions");
const { usermessage } = require("../response_message/message");
const UserMaster = require("../models/userMaster");
const EmployeeDesignation = require("../models/employeeDesignation");
const Designation = require("../models/designation");
const EmployeeDepartment = require("../models/employeeDepartment");
const Department = require("../models/department");
const EmployeeBranch = require("../models/employeeBranch");
const BranchMaster = require("../models/branchMaster");
const EmployeeJoiningDetails = require("../models/employeeJoiningDetails");
const EmployeeBonus = require("../models/employeeBonus");
const { userAttributes } = require("../utils/commonVars");
const { generateExcel } = require("../utils/exportData");
const EmployeePayment = require("../models/employeePayment");
const sequelize = require("../config/database");
const EmployeeBonusPolicy = require("../models/employeeBonusPolicy");
const BonusPolicy = require("../models/bonusPolicy");
const {
  bonusCreditTypeEnum,
  bonusCreditCycleEnum,
  yearCycleEnum,
} = require("../utils/dbUtils");

function getBonusEndMonth(bonusPolicy, YYYYMM) {
  const MM = String(YYYYMM).slice(4, 6);
  const YYYY = String(YYYYMM).slice(0, 4);

  const bonusCycle = bonusPolicy.bonusCycle;

  let endMonth = YYYYMM;

  // if bonus Pay type is Previous
  if (bonusPolicy.bonusCreditType == bonusCreditTypeEnum.PREVIOUS) {
    // if cycle january to december
    if (bonusCycle == yearCycleEnum.JAN_DEC) {
      if (+MM < 12) {
        endMonth = +YYYY - 1 + "12";
      }
    }

    // if cycle April to March
    if (bonusCycle == yearCycleEnum.APRIL_MARCH) {
      if (+MM < 3) {
        endMonth = +YYYY - 1 + "03";
      }

      if (+MM >= 3) {
        endMonth = +YYYY + "03";
      }
    }
  }

  // if bonus Pay type is current
  if (bonusPolicy.bonusCreditType == bonusCreditTypeEnum.CURRENT) {
    if (bonusPolicy.bonusCreditCycle == bonusCreditCycleEnum.QUARTERLY) {
      if (+MM >= 3 && +MM < 6) {
        endMonth = YYYY + "03";
      }

      if (+MM >= 6 && +MM < 9) {
        endMonth = YYYY + "06";
      }

      if (+MM >= 9 && +MM < 12) {
        endMonth = YYYY + "09";
      }

      if (+MM < 3) {
        endMonth = +YYYY - 1 + "12";
      }
    }

    if (bonusCycle == yearCycleEnum.JAN_DEC) {
      if (bonusPolicy.bonusCreditCycle == bonusCreditCycleEnum.HALFYEARLY) {
        if (+MM < 6) {
          endMonth = +YYYY - 1 + "01";
        }

        if (+MM >= 6 && +MM < 12) {
          endMonth = YYYY + "06";
        }
      }

      if (bonusPolicy.bonusCreditCycle == bonusCreditCycleEnum.YEARLY) {
        if (+MM < 12) {
          endMonth = +YYYY - 1 + "12";
        }
      }
    }

    if (bonusCycle == yearCycleEnum.APRIL_MARCH) {
      if (bonusPolicy.bonusCreditCycle == bonusCreditCycleEnum.HALFYEARLY) {
        if (+MM < 3) {
          endMonth = +YYYY - 1 + "09";
        }

        if (+MM >= 3 && +MM < 9) {
          endMonth = +YYYY + "03";
        }

        if (+MM >= 9) {
          endMonth = +YYYY + "09";
        }
      }

      if (bonusPolicy.bonusCreditCycle == bonusCreditCycleEnum.YEARLY) {
        if (+MM < 3) {
          endMonth = +YYYY - 1 + "03";
        }

        if (+MM >= 3) {
          endMonth = +YYYY + "03";
        }
      }
    }
  }

  return endMonth;
}

exports.listEmployeeBonusPayment = async (req, res, next) => {
  try {
    const { page, limit, companyMasterID, userMasterID, month, Export } =
      req.body;

    if (!companyMasterID || !month) {
      return res.status(200).json({
        status: 401,
        message: usermessage.ValidParameters,
      });
    }

    const currentDate = asiaKolkataDateTime(new Date()).slice(0, 10);

    const paginatecondition =
      !Export && page && limit ? { offset: (page - 1) * limit, limit } : {};

    const condition = { companyMasterId: companyMasterID, status: 1 };

    if (userMasterID && userMasterID.length)
      condition.userMasterID = userMasterID;

    const { rows, count } = await UserMaster.findAndCountAll({
      distinct: true,
      where: condition,
      ...paginatecondition,
      include: [
        {
          model: EmployeeDesignation,
          as: "emp_desig",
          where: {
            status: 1,
            applicableDate: { [Sequelize.Op.lte]: currentDate },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: currentDate } },
              { endDate: { [Sequelize.Op.eq]: null } },
            ],
          },
          required: false,
          attributes: ["designationID"],
          include: [
            {
              model: Designation,
              as: "designation",
              attributes: ["designationName"],
            },
          ],
        },
        {
          model: EmployeeDepartment,
          as: "emp_dept",
          where: {
            status: 1,
            applicableDate: { [Sequelize.Op.lte]: currentDate },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: currentDate } },
              { endDate: { [Sequelize.Op.eq]: null } },
            ],
          },
          required: false,
          attributes: ["departmentID"],
          include: [
            {
              model: Department,
              as: "department",
              attributes: ["departmentName"],
            },
          ],
        },
        {
          model: EmployeeBranch,
          as: "emp_branch",
          where: {
            status: 1,
            applicableDate: { [Sequelize.Op.lte]: currentDate },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: currentDate } },
              { endDate: { [Sequelize.Op.eq]: null } },
            ],
          },
          required: false,
          attributes: ["branchID"],
          include: [
            {
              model: BranchMaster,
              as: "branchMaster",
              attributes: ["branchName"],
            },
          ],
        },
        {
          model: EmployeeJoiningDetails,
          attributes: ["employeeCode"],
        },
        {
          model: EmployeeBonusPolicy,
          where: {
            status: 1,
            applicableYYYYMM: { [Sequelize.Op.lte]: month },
            [Sequelize.Op.or]: [
              { endYYYYMM: { [Sequelize.Op.gte]: month } },
              { endYYYYMM: { [Sequelize.Op.eq]: null } },
            ],
          },
          required: false,
          attributes: ["bonusPolicyId"],
          include: [
            {
              model: BonusPolicy,
            },
          ],
        },
        {
          model: EmployeeBonus,
          where: {
            status: 1,
            payReferenceId: { [Sequelize.Op.is]: null },
            employeePaymentId: { [Sequelize.Op.is]: null },
          },
          required: false,
        },
      ],
      attributes: userAttributes,
      order: [["displayName", "ASC"]],
    });

    const finalData = [];

    for (const row of rows) {
      const obj = {
        "Employee Code": row.employeeJoiningDetails?.[0]?.employeeCode || "",
        "Employee Name": row.displayName,
        "Employee Number": row.userNumber,
        Branch: row.emp_branch?.[0]?.branchMaster?.branchName || "",
        Department: row.emp_dept?.[0]?.department?.departmentName || "",
        Designation: row.emp_desig?.[0]?.designation?.designationName || "",
        duration: "",
        "Pending Bonus": 0,
      };

      if (!Export) {
        obj['userMasterID'] = row.userMasterID;
        obj['month'] = month;

      }

      const bonusPolicy = row.employeeBonusPolicies?.[0]?.bonusPolicy || null;

      const bonusData = row.employeeBonus || [];

      if (!bonusPolicy) {
        finalData.push(obj);
        continue;

      }
      const endMonth = getBonusEndMonth(bonusPolicy, month);

      const pendingBonus = bonusData.filter((e) => +e.bonusYYYYMM <= +endMonth).reduce((acc, obj) => acc + +obj.amount, 0);

      obj.duration = month_dict[String(endMonth).slice(4, 6)] + '-' + String(endMonth).slice(0, 4);
      obj['Pending Bonus'] = +pendingBonus;

      finalData.push(obj);

    }

    if (Export) return await generateExcel(finalData, "Employee Bonus", "xlsx", res);

    return res.status(200).json({
      status: 200,
      data: finalData,
      totalcount: count,
    });
  } catch (error) {
    next(error);
  }
};

exports.getEmployeeBonusByUserId = async (req, res, next) => {
  try {
    const { page, limit, userMasterID, fromMonth, toMonth, type } = req.body;

    if (!userMasterID) {
      return res.status(200).json({
        status: 401,
        message: usermessage.ValidParameters,
      });
    }

    const paginatecondition =
      page && limit ? { offset: (page - 1) * limit, limit } : {};

    const condition = {
      userMasterID,
      status: 1,
    };

    let orderby = []

    if (type == "Paid") {
      condition[Sequelize.Op.or] = [
        {
          payReferenceId: {
            [Sequelize.Op.ne]: null,
          },
        },
        {
          employeePaymentId: {
            [Sequelize.Op.ne]: null,
          },
        },
      ];
      orderby = [['payYYYYMM', 'DESC']]
    }

    if (type == "Pending") {
      condition.payReferenceId = {
        [Sequelize.Op.is]: null,
      };

      condition.employeePaymentId = {
        [Sequelize.Op.is]: null,
      };

      orderby = [['bonusYYYYMM', 'DESC']]
    }

    if (fromMonth && toMonth) {
      condition.payYYYYMM = {
        [Sequelize.Op.between]: [fromMonth, toMonth],
      };
    }

    const includeModels = [];

    if (type == "Paid") {
      includeModels.push({
        model: EmployeePayment,
      });
    }

    const { rows, count } = await EmployeeBonus.findAndCountAll({
      where: condition,
      ...paginatecondition,
      include: includeModels,
      order: orderby
    });

    return res.status(200).json({
      status: 200,
      data: rows,
      totalcount: count,
    });
  } catch (error) {
    next(error);
  }
};

exports.payEmployeeBonus = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { userMasterID, month, payYYYYMM, paymentMode, referenceNO } = req.body;

    const date = asiaKolkataDateTime(new Date()).slice(0, 10);

    const currentMonth = (date.slice(0, 4) + date.slice(5, 7));

    if (+month > +currentMonth || +payYYYYMM > +currentMonth) {
      await transaction.rollback();
      return res.status(200).json({
        status: 401,
        message: "Future month is not allowed. Please select the current or a previous month.",
      });
    }

    const data = await UserMaster.findOne({
      where: {
        userMasterID
      },
      include: [
        {
          model: EmployeeBonusPolicy,
          where: {
            status: 1,
            applicableYYYYMM: { [Sequelize.Op.lte]: month },
            [Sequelize.Op.or]: [
              { endYYYYMM: { [Sequelize.Op.gte]: month } },
              { endYYYYMM: { [Sequelize.Op.eq]: null } },
            ],
          },
          required: false,
          attributes: ["bonusPolicyId"],
          include: [
            {
              model: BonusPolicy,
            },
          ],
        },
        {
          model: EmployeeBonus,
          where: {
            status: 1,
            payReferenceId: { [Sequelize.Op.is]: null },
            employeePaymentId: { [Sequelize.Op.is]: null },
          },
          required: false,
        },
      ],
      attributes: userAttributes,
      order: [["displayName", "ASC"]],
    });

    const bonusPolicy = data.employeeBonusPolicies?.[0]?.bonusPolicy || null;

    if (!bonusPolicy) {
      await transaction.rollback();
      return res.status(200).json({
        status: 401,
        message: "Assign Bonus Policy to Employee.",
      });
    }
    const endMonth = getBonusEndMonth(bonusPolicy, month);

    const bonusData = data.employeeBonus || [];

    const pendingBonusdata = bonusData.filter((e) => +e.bonusYYYYMM <= +endMonth);

    const totalAmount = pendingBonusdata.reduce((acc, obj) => acc + +obj.amount, 0);
    const ids = pendingBonusdata.map((e) => e.id);

    if (+totalAmount > 0) {
      const addData = await EmployeePayment.create(
        {
          amount: totalAmount,
          paymentDate: date,
          paymentMode,
          referenceNO,
        },
        {
          user: req.userDetails,
          transaction,
        }
      );

      await EmployeeBonus.update(
        {
          employeePaymentId: addData.employeePaymentId,
          payYYYYMM,
        },
        {
          where: {
            id: {
              [Sequelize.Op.in]: ids,
            },
          },
          individualHooks: true,
          user: req.userDetails,
          transaction,
        }
      );
    }

    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: "Employee Bonus Paid Successfully.",
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};
