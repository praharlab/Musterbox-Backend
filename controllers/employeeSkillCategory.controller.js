const Sequelize = require("sequelize");
const sequelize = require("../config/database");
const { SkillCategoryType } = require("../utils/dbUtils");
const EmployeeJoiningDetails = require("../models/employeeJoiningDetails");
const EmployeeSkillCategory = require("../models/employeeSkillCategory");
const message = require("../response_message/message");
const {
  asiaKolkataDateTime,
  accessibleUsers,
  month_dict,
  getPreviousMonth,
} = require("../utils/commonUtilFunctions");
const UserMaster = require("../models/userMaster");
const companyMaster = require("../models/companyMaster");
const { userAttributes } = require("../utils/commonVars");

function hasSkillCategory(value, valueObject) {
  return Object.values(valueObject).includes(value);
}

function findNearestNumbers(arr, target) {
  let past = null;
  let future = null;

  // Sort the array to make sure we're checking in ascending order
  arr.sort((a, b) => a - b);

  for (let i = 0; i < arr.length; i++) {
    if (arr[i] < target) {
      past = arr[i]; // Record the past number
    }
    if (arr[i] > target && future === null) {
      future = arr[i]; // Record the first future number
    }
  }

  return { past, future };
}


exports.addData = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { userMasterID, skillCategory, applicableYYYYMM } = req.body;

    if (!hasSkillCategory(skillCategory, SkillCategoryType))
      throw new Error("Invalid skill category");

    const joining = EmployeeJoiningDetails.findAll({
      where: {
        userMasterID: {
          [Sequelize.Op.in]: userMasterID,
        },
      },
    });

    // if (!joining) throw new Error(`Joining details not found for this month (${applicableYYYYMM})`);

    const allData = EmployeeSkillCategory.findAll({
      where: {
        userMasterID: {
          [Sequelize.Op.in]: userMasterID,
        },
      },
    });

    const [allJoining, allCategoryData] = await Promise.all([joining, allData]);

    const ToAddArray = [];

    for (const userId of userMasterID) {
      const userSkillCategoryData = allCategoryData.filter(
        (e) => +e.userMasterID == +userId
      );

      const empjoing = allJoining.find((e) => +e.userMasterID == +userId);

      if (!empjoing) {
        if ([...userMasterID].length == 1)
          throw new Error("Employee joining not found!");
        continue;
      }

      const joiningYYYYMM =
        String(empjoing.joiningDate).slice(0, 4) +
        String(empjoing.joiningDate).slice(5, 7);

      if (+joiningYYYYMM > +applicableYYYYMM) {
        if ([...userMasterID].length == 1)
          throw new Error(
            `Employee Joining not found for ${applicableYYYYMM}!`
          );
        continue;
      }
      // ---------------- if userSkillCategoryData is not available-------

      if (!userSkillCategoryData.length) {
        ToAddArray.push({
          userMasterID: userId,
          applicableYYYYMM,
          skillCategory,
        });
        continue;
      }

      // find data of same applicable month
      const sameMonthData = userSkillCategoryData.find(
        (e) => +e.applicableYYYYMM == +applicableYYYYMM
      );

      if (sameMonthData) {
        await EmployeeSkillCategory.update(
          {
            skillCategory,
          },
          {
            where: { id: sameMonthData.id },
            user: req.userDetails,
            individualHooks: true,
            transaction,
          }
        );

        continue;
      }

      const applicableYYYYMMArray = userSkillCategoryData.map(
        (e) => e.applicableYYYYMM
      );

      const { past, future } = findNearestNumbers(
        applicableYYYYMMArray,
        applicableYYYYMM
      );

      console.log(past, future);

      // update the pass records if available--
      if (past) {
        await EmployeeSkillCategory.update(
          {
            endYYYYMM: getPreviousMonth(+applicableYYYYMM),
          },
          {
            where: {
              applicableYYYYMM: +past,
              userMasterID: userId,
            },
            transaction,
            user: req.userDetails,
            individualHooks: true,
          }
        );
      }

      // if future record is not available
      if (!future) {
        ToAddArray.push({
          userMasterID: userId,
          applicableYYYYMM,
          skillCategory,
        });
        continue;
      }

      // if future record is available
      ToAddArray.push({
        userMasterID: userId,
        skillCategory,
        applicableYYYYMM,
        endYYYYMM: getPreviousMonth(+future),
      });
    }

    await EmployeeSkillCategory.bulkCreate(ToAddArray, {
      user: req.userDetails,
      individualHooks: true,
      transaction,
    });
    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: message.usermessage.addMessage("Employee Skill Category"),
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

exports.getByUserId = async (req, res, next) => {
  try {
    const { id } = req.params;
    const skillCategoryData = await EmployeeSkillCategory.findAll({
      where: {
        userMasterID: id,
      },
      order: [["applicableYYYYMM", "ASC"]],
      include: [
        {
          model: UserMaster,
          as: 'createdByUser',
          attributes: userAttributes,
        },
      ],
    });

    const date = asiaKolkataDateTime(new Date()).slice(0, 10);
    const YYYYMM = String(date).slice(0, 4) + String(date).slice(5, 7);

    for (const skillCategory of skillCategoryData) {
      let showDelete = false;

      if (
        +skillCategory.applicableYYYYMM <= +YYYYMM &&
        (+skillCategory.endYYYYMM >= +YYYYMM || !skillCategory.endYYYYMM)
      )
        showDelete = true;

      if (+skillCategory.applicableYYYYMM >= +YYYYMM) showDelete = true;
      skillCategory.dataValues.showDelete = showDelete;
      skillCategory.dataValues.applicableYYYYMM =
        month_dict[String(skillCategory.applicableYYYYMM).slice(4, 6)] +
        " " +
        String(skillCategory.applicableYYYYMM).slice(0, 4);
      if (skillCategory.endYYYYMM)
        skillCategory.dataValues.endYYYYMM =
          month_dict[String(skillCategory.endYYYYMM).slice(4, 6)] +
          " " +
          String(skillCategory.endYYYYMM).slice(0, 4);
    }

    return res.status(200).json({ status: 200, data: skillCategoryData });
  } catch (error) {
    next(error);
  }
};

exports.delete = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { id, userMasterID } = req.body;

    const allData = await EmployeeSkillCategory.findAll({
      where: {
        userMasterID,
      },
    });

    const currentData = allData.find((e) => e.id == id);

    if (!currentData) throw new Error("Data not found!");

    // filter data with out current data
    const userSkillCategoryData = allData.filter((e) => e.id != id);

    const applicableYYYYMMArray = userSkillCategoryData.map(
      (e) => e.applicableYYYYMM
    );

    const { past, future } = findNearestNumbers(
      applicableYYYYMMArray,
      currentData.applicableYYYYMM
    );

    if (past) {
      let endYYYYMM = null;
      if (future) {
        endYYYYMM = getPreviousMonth(+future);
      }

      await EmployeeSkillCategory.update(
        {
          endYYYYMM,
        },
        {
          where: {
            applicableYYYYMM: +past,
            userMasterID,
          },
          transaction,
          user: req.userDetails,
          individualHooks: true,
        }
      );
    }

    await currentData.destroy({
      user: req.userDetails,
      individualHooks: true,
      transaction,
    });

    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: message.usermessage.deleteMessage("Employee Skill Category"),
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

exports.getAllUsersSkillCategory = async (req, res, next) => {
  try {
    const { page, limit, search, companyMasterID } = req.body;

    const condition = {};

    if (search)
      condition[Sequelize.Op.or] = [
        { displayName: { [Sequelize.Op.iLike]: "%" + search + "%" } },
        { userNumber: { [Sequelize.Op.iLike]: "%" + search + "%" } },
        {
          "$companyMaster.companyName$": {
            [Sequelize.Op.iLike]: "%" + search + "%",
          },
        },
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
      include: [
        {
          model: EmployeeSkillCategory,
          required: false,
        },
        {
          model: companyMaster,
          attributes: ["companyName"],
          required:true
        },
      ],
      order: [["displayName", "ASC"]],
      attributes: [
        "displayName",
        "userNumber",
        "photo",
        "firstName",
        "lastName",
      ],
    });

    return res.status(200).json({
      status: 200,
      data: userData,
      totalcount: count,
    });
  } catch (error) {
    next(error);
  }
};
