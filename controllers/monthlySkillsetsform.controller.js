const Sequelize = require('sequelize');
const SkillsetsformModel = require('../models/skillsetsform');
const logger = require('../config/logger');
const message = require('../response_message/message');
const sequelize = require('../config/database');
const CompanyMaster = require('../models/companyMaster');
const EmployeeDesignation = require('../models/employeeDesignation');
const UserMaster = require('../models/userMaster');
const SkillSets = require('../models/skillsets');
const Designation = require('../models/designation');
const SkillsetsForm = require('../models/skillsetsform');
const MonthlySkillsetsform = require('../models/monthlySkillsetsform');
const {
  sendNotification,
  employeeDesignation,
  asiaKolkataDateTime,
  daysInMonth,
} = require('../utils/commonUtilFunctions');
const { accessibleUsers } = require('../utils/commonUtilFunctions');

exports.addmonthlySkillsetsform = async (req, res, next) => {
  try {
    const { yearmonth, userMasterID, createBy, createByIp, companyMasterID } =
      req.body;

    const user = userMasterID;

    let userFormisThereForThatMonth = [];
    let usserFormCreatedSuccessfully = [];
    let userDesignationFormisNotCreated = [];
    let dataToInsert = [];

    for (let userid of user) {
      for (let monthItem of yearmonth) {
        const userFormIsThereOrNot = await MonthlySkillsetsform.findAll({
          where: { userMasterID: userid, YYYYMM: monthItem, status: 1 },
          raw: true,
          attributes: ['userMasterID', 'fillStatus'],
        });

        if (
          userFormIsThereOrNot.length > 0 &&
          userFormIsThereOrNot[0].fillStatus == 1
        ) {
          const userDetails = await UserMaster.findAll({
            where: { userMasterID: userid, status: 1 },
            raw: true,
            attributes: ['displayName'],
          });

          userFormisThereForThatMonth.push(
            userDetails[0].displayName + ' ' + monthItem
          );
        } else {
          const daysinmonth = daysInMonth(
            monthItem.slice(4, 6),
            monthItem.slice(0, 4)
          );
          const enddate =
            monthItem.slice(0, 4) +
            '-' +
            monthItem.slice(4, 6) +
            '-' +
            daysinmonth;

          const userDesignation = await employeeDesignation(userid, enddate);
          if (userDesignation) {
            const userDesignationId = userDesignation.designationID;

            const FormisThereForThisDesignation = await SkillsetsForm.findAll({
              where: { designationID: userDesignationId, status: 1 },
              raw: true,
            });

            const FormisThereForThisMonth = await MonthlySkillsetsform.findOne({
              where: { YYYYMM: monthItem, status: 1, userMasterID: userid },
              raw: true,
            });

            if (FormisThereForThisMonth) {
              await MonthlySkillsetsform.update(
                {
                  status: 2,
                },
                {
                  where: { YYYYMM: monthItem, userMasterID: userid },
                }
              );
            }

            if (FormisThereForThisDesignation.length > 0) {
              dataToInsert.push({
                skillsetsFormID:
                  FormisThereForThisDesignation[0].skillsetsFormID,
                companyMasterID: companyMasterID,
                YYYYMM: monthItem,
                userMasterID: userid,
                questionSkillsets: FormisThereForThisDesignation[0].skillSetsID,
                createBy,
                createByIp,
              });

              const userDetails = await UserMaster.findAll({
                where: { userMasterID: userid, status: 1 },
                raw: true,
                attributes: ['userMasterID', 'displayName'],
              });

              usserFormCreatedSuccessfully.push(userDetails[0]);
            } else {
              const userDetails = await UserMaster.findAll({
                where: { userMasterID: userid, status: 1 },
                raw: true,
                attributes: ['userMasterID', 'displayName'],
              });
              userDesignationFormisNotCreated.push(userDetails[0]);
            }
          } else {
            const userDetails = await UserMaster.findAll({
              where: { userMasterID: userid, status: 1 },
              raw: true,
              attributes: ['userMasterID', 'displayName'],
            });
            userDesignationFormisNotCreated.push(userDetails[0]);
          }
        }
      }
    }

    await MonthlySkillsetsform.bulkCreate(dataToInsert);

    res.status(200).json({
      status: 200,
      message: 'Monthly SkillsetsForm Added Successfully',
      dataToInsert: dataToInsert,
      userDesignationFormisNotCreated: userDesignationFormisNotCreated,
      usserFormCreatedSuccessfully: usserFormCreatedSuccessfully,
      userFormisThereForThatMonth: userFormisThereForThatMonth,
    });
  } catch (err) {
    next(err);
  }
};

exports.getAllData = async (req, res, next) => {
  try {
    const {
      limit,
      page,
      userMasterID,
      yearmonth,
      companyMasterID,
      searchQuery,
    } = await req.body;
    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }

    const condition = { status: 1 };
    if (searchQuery)
      condition[Sequelize.Op.or] = [
        {
          '$userMaster.displayName$': {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
      ];

    if (userMasterID) condition.userMasterID = userMasterID;
    if (companyMasterID) condition.companyMasterID = companyMasterID;
    if (yearmonth) condition.YYYYMM = yearmonth;

    const MonthlySkillsetsformData = await MonthlySkillsetsform.findAndCountAll(
      {
        where: condition,
        ...paginationQuery,
        order: [['YYYYMM', 'DESC']],
        include: [
          {
            model: UserMaster,
            attributes: ['userMasterID', 'displayName'],
            required: true,
            ...accessibleUsers(req.userDetails),
          },
          {
            model: SkillsetsForm,
            attributes: ['designationID'],
          },
        ],
      }
    );

    let UserIds = [];
    for (let j = 0; j < MonthlySkillsetsformData.rows.length; j++) {
      let ids = MonthlySkillsetsformData.rows[j].userMaster.userMasterID;
      UserIds.push(ids);
    }

    for (let j = 0; j < MonthlySkillsetsformData.rows.length; j++) {
      const userDesignation = await Designation.findOne({
        raw: true,
        where: {
          designationId:
            MonthlySkillsetsformData.rows[j].skillsetsform.designationID,
        },
      });

      let get_one_data;
      if (MonthlySkillsetsformData.rows[j].questionSkillsets) {
        const ids = MonthlySkillsetsformData.rows[j].questionSkillsets;
        const skillSetsIdArray = ids.map((id) => parseInt(id));

        get_one_data = await SkillSets.findAll({
          where: {
            skillSetID: skillSetsIdArray,
          },
          include: [
            {
              model: CompanyMaster,
              attributes: ['companyMasterID', 'companyName'],
            },
          ],
        });
      }

      let user1 = await UserMaster.findOne({
        where: {
          userMasterID: MonthlySkillsetsformData.rows[j].createBy,
        },
      });
      let user2 = await UserMaster.findOne({
        where: {
          userMasterID: MonthlySkillsetsformData.rows[j].updateBy,
        },
      });

      let user3 = await CompanyMaster.findOne({
        where: {
          companyMasterID: MonthlySkillsetsformData.rows[j].companyMasterID,
        },
        attributes: ['companyMasterID', 'companyName'],
      });

      if (user3) {
        MonthlySkillsetsformData.rows[j].companyMasterID = user3;
      }

      let fillby1 = await UserMaster.findOne({
        where: {
          userMasterID: MonthlySkillsetsformData.rows[j].fillby,
        },
      });
      let verifiedby1 = await UserMaster.findOne({
        where: {
          userMasterID: MonthlySkillsetsformData.rows[j].verifiedby,
        },
      });

      let reportto1 = await UserMaster.findOne({
        where: {
          userMasterID: MonthlySkillsetsformData.rows[j].reportto,
        },
      });

      if (fillby1) {
        MonthlySkillsetsformData.rows[j].fillby = fillby1.displayName;
      }
      if (verifiedby1) {
        MonthlySkillsetsformData.rows[j].verifiedby = verifiedby1.displayName;
      }

      if (reportto1) {
        MonthlySkillsetsformData.rows[j].reportto = reportto1.displayName;
      }

      if (user1) {
        MonthlySkillsetsformData.rows[j].createBy = user1.displayName;
      }
      if (user2) {
        MonthlySkillsetsformData.rows[j].updateBy = user2.displayName;
      }
      if (get_one_data) {
        MonthlySkillsetsformData.rows[j].questionSkillsets = get_one_data;
      }
      if (userDesignation) {
        MonthlySkillsetsformData.rows[j].userMaster.dataValues.designationName =
          userDesignation.designationName;
        MonthlySkillsetsformData.rows[j].userMaster.dataValues.designationId =
          userDesignation.designationId;
      }
    }

    if (MonthlySkillsetsformData.rows.length) {
      for (let item of MonthlySkillsetsformData.rows) {
        const monthName = [
          'January',
          'February',
          'March',
          'April',
          'May',
          'June',
          'July',
          'August',
          'September',
          'October',
          'November',
          'December',
        ];

        function getMonthNameFromIndex(index) {
          if (index >= 1 && index <= 12) {
            return monthName[index - 1];
          }
        }

        const year = item.YYYYMM;
        const firstFourDigits = year.toString().substring(0, 4);

        const monthIndex = item.YYYYMM % 100;
        let monthYearOfReport = '';
        monthYearOfReport =
          getMonthNameFromIndex(monthIndex) + ' ' + firstFourDigits;

        item.YYYYMM = monthYearOfReport;
      }
    }

    return res.status(200).json({
      status: 200,
      data: MonthlySkillsetsformData.rows,
      totalcount: MonthlySkillsetsformData.count,
    });
  } catch (err) {
    next(err);
  }
};

exports.getbyuserid = async (req, res, next) => {
  try {
    const { limit, page, userMasterID, yearmonth } = req.body;

    let offset = (page - 1) * limit;
    let MonthlySkillsetsformData;
    if (!yearmonth) {
      MonthlySkillsetsformData = await MonthlySkillsetsform.findAll({
        raw: true,
        where: {
          userMasterID: userMasterID,
          status: 1,
        },
        limit: limit,
        offset: offset,
        order: [['YYYYMM', 'DESC']],
        include: [
          {
            model: UserMaster,
            attributes: ['userMasterID', 'displayName'],
            required: true,
            ...accessibleUsers(req.userDetails),
          },
          {
            model: CompanyMaster,
            attributes: ['companyMasterID', 'companyName'],
          },
          {
            model: SkillsetsForm,
            attributes: ['designationID'],
          },
        ],
      });

      totalcount = await MonthlySkillsetsform.count({
        raw: true,
        where: {
          userMasterID: userMasterID,
        },
      });
    } else {
      MonthlySkillsetsformData = await MonthlySkillsetsform.findAll({
        raw: true,
        where: {
          userMasterID: userMasterID,
          YYYYMM: yearmonth,
          status: 1,
        },
        limit: limit,
        offset: offset,
        order: [['YYYYMM', 'DESC']],
        include: [
          {
            model: UserMaster,
            attributes: ['userMasterID', 'displayName'],
            required: true,
            ...accessibleUsers(req.userDetails),
          },
          {
            model: CompanyMaster,
            attributes: ['companyMasterID', 'companyName'],
          },
          {
            model: SkillsetsForm,
            attributes: ['designationID'],
          },
        ],
      });

      totalcount = await MonthlySkillsetsform.count({
        raw: true,
        where: {
          userMasterID: userMasterID,
          YYYYMM: yearmonth,
        },
      });
    }

    if (MonthlySkillsetsformData.length > 0) {
      for (var j = 0; j < MonthlySkillsetsformData.length; j++) {
        const monthName = [
          'January',
          'February',
          'March',
          'April',
          'May',
          'June',
          'July',
          'August',
          'September',
          'October',
          'November',
          'December',
        ];

        function getMonthNameFromIndex(index) {
          if (index >= 1 && index <= 12) {
            return monthName[index - 1];
          }
        }

        const year = MonthlySkillsetsformData[j].YYYYMM;
        const firstFourDigits = year.toString().substring(0, 4);

        const monthIndex = MonthlySkillsetsformData[j].YYYYMM % 100;
        let monthYearOfReport = '';
        monthYearOfReport =
          getMonthNameFromIndex(monthIndex) + ' ' + firstFourDigits;

        MonthlySkillsetsformData[j].YYYYMM = monthYearOfReport;

        let get_one_data = await SkillSets.findAll({
          where: {
            skillSetID: MonthlySkillsetsformData[j].questionSkillsets,
          },
          include: [
            {
              model: CompanyMaster,
              attributes: ['companyMasterID', 'companyName'],
            },
          ],
        });

        const userDesignation = await Designation.findOne({
          raw: true,
          where: {
            designationId:
              MonthlySkillsetsformData[j]['skillsetsform.designationID'],
          },
        });

        let user1 = await UserMaster.findOne({
          where: {
            userMasterID: MonthlySkillsetsformData[j].createBy,
          },
        });
        let user2 = await UserMaster.findOne({
          where: {
            userMasterID: MonthlySkillsetsformData[j].updateBy,
          },
        });

        let fillby1 = await UserMaster.findOne({
          where: {
            userMasterID: MonthlySkillsetsformData[j].fillby,
          },
        });
        let verifiedby1 = await UserMaster.findOne({
          where: {
            userMasterID: MonthlySkillsetsformData[j].verifiedby,
          },
        });

        let reportto1 = await UserMaster.findOne({
          where: {
            userMasterID: MonthlySkillsetsformData[j].reportto,
          },
        });

        if (user1) {
          MonthlySkillsetsformData[j].createBy = user1.displayName;
        }
        if (user2) {
          MonthlySkillsetsformData[j].updateBy = user2.displayName;
        }

        if (fillby1) {
          MonthlySkillsetsformData[j].fillby = fillby1.displayName;
        }
        if (verifiedby1) {
          MonthlySkillsetsformData[j].verifiedby = verifiedby1.displayName;
        }

        if (reportto1) {
          MonthlySkillsetsformData[j].reportto = reportto1.displayName;
        }

        if (get_one_data) {
          MonthlySkillsetsformData[j].skillSetsID = get_one_data;
        }
        if (userDesignation) {
          MonthlySkillsetsformData[j].dataValues =
            userDesignation.designationName;
        }
      }
    } else {
      return res.status(200).json({
        status: 200,
        message: 'No Record Found',
        data: MonthlySkillsetsformData,
      });
    }

    res.status(200).json({
      status: 200,
      data: MonthlySkillsetsformData,
      totalcount: totalcount,
    });
  } catch (err) {
    next(err);
  }
};

exports.getbymonthlySkillsetsid = async (req, res, next) => {
  try {
    let MonthlySkillsetsformData = await MonthlySkillsetsform.findAll({
      raw: true,
      where: {
        status: 1,
        monthlySkillsetsFormID: req.params.id,
      },
      order: [['YYYYMM', 'DESC']],
      include: [
        {
          model: UserMaster,
          attributes: ['userMasterID', 'displayName'],
          required: true,
          ...accessibleUsers(req.userDetails),
        },
        {
          model: CompanyMaster,
          attributes: ['companyMasterID', 'companyName'],
        },
        {
          model: SkillsetsForm,
          attributes: ['designationID'],
        },
      ],
    });

    for (var j = 0; j < MonthlySkillsetsformData.length; j++) {
      let get_one_data = await SkillSets.findAll({
        where: {
          skillSetID: MonthlySkillsetsformData[j].questionSkillsets,
        },
        include: [
          {
            model: CompanyMaster,
            attributes: ['companyMasterID', 'companyName'],
          },
        ],
      });

      const userDesignation = await Designation.findOne({
        raw: true,
        where: {
          designationId:
            MonthlySkillsetsformData[j]['skillsetsform.designationID'],
        },
      });

      let user1 = await UserMaster.findOne({
        where: {
          userMasterID: MonthlySkillsetsformData[j].createBy,
        },
      });
      let user2 = await UserMaster.findOne({
        where: {
          userMasterID: MonthlySkillsetsformData[j].updateBy,
        },
      });

      if (user1) {
        MonthlySkillsetsformData[j].createBy = user1.displayName;
      }
      if (user2) {
        MonthlySkillsetsformData[j].updateBy = user2.displayName;
      }
      if (get_one_data) {
        MonthlySkillsetsformData[j].skillSetsID = get_one_data;
      }
      if (userDesignation) {
        MonthlySkillsetsformData[j].dataValues = userDesignation;
      }
    }

    if (!MonthlySkillsetsformData)
      res.status(200).json({ status: 200, message: 'No Record Found' });

    res.status(200).json({ status: 200, data: MonthlySkillsetsformData });
  } catch (err) {
    next(err);
  }
};

exports.addSkillsetsAnswers = async (req, res, next) => {
  try {
    const {
      answerArray,
      monthlySkillsetsFormID,
      updateBy,
      updateByIp,
      reportsTo,
      filledby,
    } = req.body;

    let result = await sequelize.transaction(async (t) => {
      let user1 = await UserMaster.findOne({
        raw: true,
        where: {
          userMasterID: reportsTo,
        },
        attributes: ['firstName'],
      });

      let skillset = await MonthlySkillsetsform.findOne({
        raw: true,
        where: {
          monthlySkillsetsFormID: monthlySkillsetsFormID,
        },
        attributes: ['userMasterID', 'YYYYMM'],
      });
      if (user1 && skillset && skillset.userMasterID) {
        let user2 = await UserMaster.findOne({
          raw: true,
          where: {
            userMasterID: skillset.userMasterID,
          },
          attributes: ['firstName'],
        });

        // Input date string
        const dateStr = skillset.YYYYMM.toString();
        // Parse the input string
        const month = dateStr.slice(4, 6);
        const day = dateStr.slice(2, 4);
        // Create an array of month names
        const monthNames = [
          'Jan',
          'Feb',
          'Mar',
          'Apr',
          'May',
          'Jun',
          'Jul',
          'Aug',
          'Sep',
          'Oct',
          'Nov',
          'Dec',
        ];
        // Get the abbreviated month name
        const abbreviatedMonth = monthNames[parseInt(month) - 1];
        // Format the date as "Mon dd"
        const formattedDate = abbreviatedMonth + "'" + day;

        let notification = {
          title:
            'Hey ' + user1.firstName + '! Some one filled their Skillset form',
          body:
            user2.firstName + ' has filled skillset form of ' + formattedDate,
        };
        let data = {
          screen: 'skillsetAuth',
          isScheduled: 'true',
          scheduledTime: new Date().toISOString(),
        };

        await sendNotification(reportsTo, notification, data);
      }

      change_data_status = await MonthlySkillsetsform.update(
        {
          answerSkillsets: answerArray,
          reportto: reportsTo,
          fillby: filledby,
          fillStatus: 1,
          fillDateTime: new Date().toISOString(),
          updateBy: updateBy,
          updateByIp: updateByIp,
        },
        {
          where: { monthlySkillsetsFormID: monthlySkillsetsFormID },
        }
      );
    });

    res.status(200).json({
      status: 200,
      message: 'SkillsetsForm Added Successfully',
    });
  } catch (err) {
    next(err);
  }
};

exports.verifySkillsetsAnswers = async (req, res, next) => {
  try {
    const { verified, monthlySkillsetsFormID } = req.body;

    let result = await sequelize.transaction(async (t) => {
      if (verified == '1') {
        let skillset = await MonthlySkillsetsform.findOne({
          raw: true,
          where: {
            monthlySkillsetsFormID: monthlySkillsetsFormID,
          },
          attributes: ['userMasterID', 'YYYYMM', 'reportto'],
        });
        if (skillset && skillset.reportto) {
          let user1 = await UserMaster.findOne({
            raw: true,
            where: {
              userMasterID: skillset.reportto,
            },
            attributes: ['firstName'],
          });

          let user2 = await UserMaster.findOne({
            raw: true,
            where: {
              userMasterID: skillset.userMasterID,
            },
            attributes: ['firstName'],
          });

          // Input date string
          const dateStr = skillset.YYYYMM.toString();
          // Parse the input string
          const month = dateStr.slice(4, 6);
          const day = dateStr.slice(2, 4);
          // Create an array of month names
          const monthNames = [
            'Jan',
            'Feb',
            'Mar',
            'Apr',
            'May',
            'Jun',
            'Jul',
            'Aug',
            'Sep',
            'Oct',
            'Nov',
            'Dec',
          ];
          // Get the abbreviated month name
          const abbreviatedMonth = monthNames[parseInt(month) - 1];
          // Format the date as "Mon dd"
          const formattedDate = abbreviatedMonth + "'" + day;

          let notification = {
            title: 'Hey ' + user2.firstName + '! Skillset form verified',
            body:
              user1.firstName +
              ' has verified your skillset form of ' +
              formattedDate,
          };
          let data = {
            screen: 'myskillset',
            isScheduled: 'true',
            scheduledTime: new Date().toISOString(),
          };

          await sendNotification(skillset.userMasterID, notification, data);
        }

        chnage_status = await MonthlySkillsetsform.update(
          {
            verified: '1',
          },
          {
            where: {
              monthlySkillsetsFormID: monthlySkillsetsFormID,
              verified: ['1', '0'],
            },
            transaction: t,
          }
        );
      } else {
        chnage_status = await MonthlySkillsetsform.update(
          {
            verified: '0',
          },
          {
            where: {
              monthlySkillsetsFormID: monthlySkillsetsFormID,
              verified: ['1', '0'],
            },
            transaction: t,
          }
        );
      }

      if (chnage_status != 0) {
        res.status(200).json({
          status: 200,
          message: 'Monthly SkillsetsForm  Successfully Verified.',
          data: {},
        });
      } else {
        res.status(200).json({
          status: 200,
          message: 'Monthly SkillsetsForm  Successfully Verified.',
          data: {},
        });
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.UpdateaSkillsetsAnswers = async (req, res, next) => {
  try {
    let = {
      answerArray,
      monthlySkillsetsFormID,
      updateBy,
      updateByIp,
      verifiedby,
    } = await req.body;

    let result = await sequelize.transaction(async (t) => {
      change_data_status = await MonthlySkillsetsform.update(
        {
          answerSkillsets: answerArray,
          updateBy: updateBy,
          updateByIp: updateByIp,
          verifiedDateTime: new Date().toISOString(),
          verifiedby: verifiedby,
        },
        {
          where: { monthlySkillsetsFormID: monthlySkillsetsFormID },
        }
      );
    });

    res.status(200).json({
      status: 200,
      message: 'Monthly SkillsetsForm  Successfully Verified.',
    });
  } catch (err) {
    next(err);
  }
};

exports.getbyreporttoid = async (req, res, next) => {
  try {
    const { limit, page, userMasterID, yearmonth, searchQuery } = req.body;

    let offset = (page - 1) * limit;
    let MonthlySkillsetsformData;
    if (!yearmonth && !searchQuery) {
      MonthlySkillsetsformData = await MonthlySkillsetsform.findAll({
        raw: true,
        where: {
          reportto: userMasterID,
          status: 1,
        },
        limit: limit,
        offset: offset,
        order: [['YYYYMM', 'DESC']],
        include: [
          {
            model: UserMaster,
            attributes: ['userMasterID', 'displayName'],
            required: true,
            ...accessibleUsers(req.userDetails),
          },
          {
            model: CompanyMaster,
            attributes: ['companyMasterID', 'companyName'],
          },
          {
            model: SkillsetsForm,
            attributes: ['designationID'],
          },
        ],
      });

      totalcount = await MonthlySkillsetsform.count({
        raw: true,
        where: {
          reportto: userMasterID,
        },
      });
    } else if (!yearmonth && searchQuery) {
      MonthlySkillsetsformData = await MonthlySkillsetsform.findAll({
        raw: true,
        where: {
          status: 1,
          [Sequelize.Op.or]: [
            {
              '$userMaster.displayName$': {
                [Sequelize.Op.iLike]: '%' + searchQuery + '%',
              },
            },
          ],
          reportto: userMasterID,
        },
        limit: limit,
        offset: offset,
        order: [['YYYYMM', 'DESC']],
        include: [
          {
            model: UserMaster,
            attributes: ['userMasterID', 'displayName'],
            required: true,
            ...accessibleUsers(req.userDetails),
          },
          {
            model: CompanyMaster,
            attributes: ['companyMasterID', 'companyName'],
          },
          {
            model: SkillsetsForm,
            attributes: ['designationID'],
          },
        ],
      });

      totalcount = await MonthlySkillsetsform.count({
        raw: true,
        where: {
          reportto: userMasterID,
        },
      });
    } else if (yearmonth && !searchQuery) {
      MonthlySkillsetsformData = await MonthlySkillsetsform.findAll({
        raw: true,
        where: {
          status: 1,
          reportto: userMasterID,
          YYYYMM: yearmonth,
        },
        limit: limit,
        offset: offset,
        order: [['YYYYMM', 'DESC']],
        include: [
          {
            model: UserMaster,
            attributes: ['userMasterID', 'displayName'],
            required: true,
            ...accessibleUsers(req.userDetails),
          },
          {
            model: CompanyMaster,
            attributes: ['companyMasterID', 'companyName'],
          },
          {
            model: SkillsetsForm,
            attributes: ['designationID'],
          },
        ],
      });

      totalcount = await MonthlySkillsetsform.count({
        raw: true,
        where: {
          reportto: userMasterID,
          YYYYMM: yearmonth,
        },
      });
    } else {
      MonthlySkillsetsformData = await MonthlySkillsetsform.findAll({
        raw: true,
        where: {
          status: 1,

          [Sequelize.Op.or]: [
            {
              '$userMaster.displayName$': {
                [Sequelize.Op.iLike]: '%' + searchQuery + '%',
              },
            },
          ],
          reportto: userMasterID,
          YYYYMM: yearmonth,
        },
        limit: limit,
        offset: offset,
        order: [['YYYYMM', 'DESC']],
        include: [
          {
            model: UserMaster,
            attributes: ['userMasterID', 'displayName'],
            required: true,
            ...accessibleUsers(req.userDetails),
          },
          {
            model: CompanyMaster,
            attributes: ['companyMasterID', 'companyName'],
          },
          {
            model: SkillsetsForm,
            attributes: ['designationID'],
          },
        ],
      });

      totalcount = await MonthlySkillsetsform.count({
        raw: true,
        where: {
          reportto: userMasterID,
          YYYYMM: yearmonth,
        },
      });
    }

    if (MonthlySkillsetsformData.length > 0) {
      for (var j = 0; j < MonthlySkillsetsformData.length; j++) {
        const monthName = [
          'January',
          'February',
          'March',
          'April',
          'May',
          'June',
          'July',
          'August',
          'September',
          'October',
          'November',
          'December',
        ];

        function getMonthNameFromIndex(index) {
          if (index >= 1 && index <= 12) {
            return monthName[index - 1];
          }
        }

        const year = MonthlySkillsetsformData[j].YYYYMM;
        const firstFourDigits = year.toString().substring(0, 4);

        const monthIndex = MonthlySkillsetsformData[j].YYYYMM % 100;
        let monthYearOfReport = '';
        monthYearOfReport =
          getMonthNameFromIndex(monthIndex) + ' ' + firstFourDigits;

        MonthlySkillsetsformData[j].YYYYMM = monthYearOfReport;
        let get_one_data = await SkillSets.findAll({
          where: {
            skillSetID: MonthlySkillsetsformData[j].questionSkillsets,
          },
          include: [
            {
              model: CompanyMaster,
              attributes: ['companyMasterID', 'companyName'],
            },
          ],
        });

        const userDesignation = await Designation.findOne({
          raw: true,
          where: {
            designationId:
              MonthlySkillsetsformData[j]['skillsetsform.designationID'],
          },
        });

        let user1 = await UserMaster.findOne({
          where: {
            userMasterID: MonthlySkillsetsformData[j].createBy,
          },
        });
        let user2 = await UserMaster.findOne({
          where: {
            userMasterID: MonthlySkillsetsformData[j].updateBy,
          },
        });

        let fillby1 = await UserMaster.findOne({
          where: {
            userMasterID: MonthlySkillsetsformData[j].fillby,
          },
        });
        let verifiedby1 = await UserMaster.findOne({
          where: {
            userMasterID: MonthlySkillsetsformData[j].verifiedby,
          },
        });

        let reportto1 = await UserMaster.findOne({
          where: {
            userMasterID: MonthlySkillsetsformData[j].reportto,
          },
        });

        if (user1) {
          MonthlySkillsetsformData[j].createBy = user1.displayName;
        }
        if (user2) {
          MonthlySkillsetsformData[j].updateBy = user2.displayName;
        }

        if (fillby1) {
          MonthlySkillsetsformData[j].fillby = fillby1.displayName;
        }
        if (verifiedby1) {
          MonthlySkillsetsformData[j].verifiedby = verifiedby1.displayName;
        }

        if (reportto1) {
          MonthlySkillsetsformData[j].reportto = reportto1.displayName;
        }

        if (get_one_data) {
          MonthlySkillsetsformData[j].skillSetsID = get_one_data;
        }
        if (userDesignation) {
          MonthlySkillsetsformData[j].dataValues =
            userDesignation.designationName;
        }
      }
    } else {
      return res.status(200).json({
        status: 200,
        message: 'No Record Found',
        data: MonthlySkillsetsformData,
      });
    }

    res.status(200).json({
      status: 200,
      data: MonthlySkillsetsformData,
      totalcount: totalcount,
    });
  } catch (err) {
    next(err);
  }
};

exports.SkillsetsReport = async (req, res, next) => {
  try {
    const { companyMasterID, designation, YearMM } = req.body;

    let skillsetsFormData = [];
    let questionArray = [];

    // code for month name from year-month
    const monthName = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    function getMonthNameFromIndex(index) {
      if (index >= 1 && index <= 12) {
        return monthName[index - 1];
      }
    }

    const year = YearMM;
    const firstFourDigits = year.toString().substring(0, 4);

    const monthIndex = YearMM % 100;
    let monthYearOfReport = '';
    monthYearOfReport =
      getMonthNameFromIndex(monthIndex) + ' ' + firstFourDigits;

    //for skillsets
    for (let itemid of designation) {
      let data = await SkillsetsForm.findAll({
        where: {
          companyMasterId: companyMasterID,
          designationID: itemid,
          status: 1,
        },
        raw: true,
        attributes: [
          'skillsetsFormID',
          'companyMasterId',
          'designationID',
          'skillSetsID',
        ],
      });

      if (data.length > 0) {
        let MonthlySkillsetsformData = await MonthlySkillsetsform.findAll({
          where: {
            skillsetsFormID: data[0].skillsetsFormID,
            companyMasterID: companyMasterID,
            YYYYMM: YearMM,
            status: 1,
          },
          include: [
            {
              model: UserMaster,
              attributes: ['userMasterID', 'displayName'],
              required: true,
              ...accessibleUsers(req.userDetails),
            },
          ],
          raw: true,
          attributes: [
            'monthlySkillsetsFormID',
            'userMasterID',
            'YYYYMM',
            'fillStatus',
            'questionSkillsets',
            'answerSkillsets',
            'status',
            'companyMasterID',
            'skillsetsFormID',
            'verified',
          ],
        });

        let roundedAverage;
        if (MonthlySkillsetsformData.length > 0) {
          for (let k = 0; k < MonthlySkillsetsformData.length; k++) {
            let get_one_data = await SkillSets.findAll({
              where: {
                skillSetID: MonthlySkillsetsformData[k].questionSkillsets,
              },
              include: [
                {
                  model: CompanyMaster,
                  attributes: ['companyMasterID', 'companyName'],
                },
              ],
              attributes: ['skillSetID', 'skillSet'],
            });

            let user1 = await UserMaster.findOne({
              raw: true,
              where: {
                userMasterID: MonthlySkillsetsformData[k].userMasterID,
              },
            });

            if (user1) {
              if (
                MonthlySkillsetsformData[k].answerSkillsets &&
                MonthlySkillsetsformData[k].verified == 1
              ) {
                const sum = MonthlySkillsetsformData[k].answerSkillsets.reduce(
                  (acc, value) => acc + Number(value),
                  0
                );
                const average =
                  sum / MonthlySkillsetsformData[k].answerSkillsets.length;
                roundedAverage = Math.round(average);
              } else {
                roundedAverage = 0;
              }

              MonthlySkillsetsformData[k].dataValues = {
                userName: user1.displayName,
                average: roundedAverage + '%',
              };
            }

            if (get_one_data) {
              MonthlySkillsetsformData[k].skillSetsID = get_one_data;
              questionArray.push(get_one_data);
            }
            skillsetsFormData.push(MonthlySkillsetsformData[k]);
          }
        }
      }
    }

    //this code is for merging all skillsets in one array
    let deduplicatedArray;
    let data1;
    if (questionArray) {
      let mergedArray = [].concat(...questionArray);
      deduplicatedArray = Array.from(
        new Set(mergedArray.map(JSON.stringify)),
        JSON.parse
      );
      deduplicatedArray.forEach((question) => delete question.companyMaster);
    }

    // this code is for excel
    if (skillsetsFormData && deduplicatedArray) {
      let headerRow = ['Sr. No.', 'Skill/Work'];
      averageRow = [' ', ' '];
      skillsetsFormData.forEach((item) => {
        headerRow.push(item.dataValues.userName);
        averageRow.push(item.dataValues.average);
      });

      let dataRows = [];
      deduplicatedArray.forEach((question) => {
        let dataRow = [question.skillSetID.toString(), question.skillSet];

        skillsetsFormData.forEach((item) => {
          let responseIndex = item.questionSkillsets.indexOf(
            question.skillSetID.toString()
          );
          if (responseIndex !== -1) {
            if (item.answerSkillsets && item.verified == 1) {
              let responsePercentage = item.answerSkillsets[responseIndex];
              dataRow.push(responsePercentage);
            } else {
              let responsePercentage = '';
              dataRow.push(responsePercentage);
            }
          } else {
            dataRow.push('');
          }
        });

        dataRows.push(dataRow);
      });

      data1 = [headerRow, averageRow, ...dataRows];

      for (let i = 2; i < data1.length; i++) {
        data1[i][0] = (i - 1).toString();
      }
    }
    res.status(200).json({
      status: 200,
      data1: data1 ? data1 : [],
      questionArray: deduplicatedArray ? deduplicatedArray : [],
      data: monthYearOfReport
        ? ['Skill Matrix Level - QC Inspectors - ' + monthYearOfReport]
        : '',
    });
  } catch (err) {
    next(err);
  }
};

exports.UserSkillsetsReport = async (req, res, next) => {
  try {
    const { userMasterID, YearMMArray } = req.body;

    let skillsetsFormData = [];
    let questionArray = [];
    let MonthlySkillsetsformData = [];
    let monthYearOfReport = '';
    let userName = '';
    let notAssignedFormYearMonth = [];

    for (let YearMM of YearMMArray) {
      // code for month name from year-month
      const monthName = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ];

      function getMonthNameFromIndex(index) {
        if (index >= 1 && index <= 12) {
          return monthName[index - 1];
        }
      }

      const year = YearMM;
      const firstFourDigits = year.toString().substring(0, 4);

      const monthIndex = YearMM % 100;

      monthYearOfReport =
        getMonthNameFromIndex(monthIndex) + ' ' + firstFourDigits;

      MonthlySkillsetsformData = await MonthlySkillsetsform.findAll({
        where: {
          userMasterID: userMasterID,
          YYYYMM: YearMM,
          status: 1,
        },
        raw: true,
        include: [
          {
            model: UserMaster,
            required: true,
            ...accessibleUsers(req.userDetails),
            attributes: [],
          },
        ],
        attributes: [
          'monthlySkillsetsFormID',
          'userMasterID',
          'YYYYMM',
          'fillStatus',
          'questionSkillsets',
          'answerSkillsets',
          'status',
          'companyMasterID',
          'skillsetsFormID',
          'verified',
          [sequelize.col('userMaster.displayName'), 'userName'],
        ],
      });

      let roundedAverage;
      if (MonthlySkillsetsformData.length > 0) {
        for (let k = 0; k < MonthlySkillsetsformData.length; k++) {
          let get_one_data = await SkillSets.findAll({
            where: {
              skillSetID: MonthlySkillsetsformData[k].questionSkillsets,
            },
            include: [
              {
                model: CompanyMaster,
                attributes: ['companyMasterID', 'companyName'],
              },
            ],
            attributes: ['skillSetID', 'skillSet'],
          });

          userName = MonthlySkillsetsformData[k].userName;

          if (
            MonthlySkillsetsformData[k].answerSkillsets &&
            MonthlySkillsetsformData[k].verified == 1
          ) {
            const sum = MonthlySkillsetsformData[k].answerSkillsets.reduce(
              (acc, value) => acc + Number(value),
              0
            );
            const average =
              sum / MonthlySkillsetsformData[k].answerSkillsets.length;
            roundedAverage = Math.round(average);
          } else {
            roundedAverage = 0;
          }

          MonthlySkillsetsformData[k].dataValues = {
            monthName: monthYearOfReport,
            average: roundedAverage + '%',
          };

          if (get_one_data) {
            MonthlySkillsetsformData[k].skillSetsID = get_one_data;
            questionArray.push(get_one_data);
          }
          skillsetsFormData.push(MonthlySkillsetsformData[k]);
        }
      } else {
        notAssignedFormYearMonth.push(monthYearOfReport);
      }
    }

    //this code is for merging all skillsets in one array
    let deduplicatedArray;
    let data1;
    if (questionArray) {
      let mergedArray = [].concat(...questionArray);
      deduplicatedArray = Array.from(
        new Set(mergedArray.map(JSON.stringify)),
        JSON.parse
      );
      deduplicatedArray.forEach((question) => delete question.companyMaster);
    }

    // this code is for excel
    if (skillsetsFormData && deduplicatedArray) {
      let headerRow = ['Sr. No.', 'Skill/Work'];
      averageRow = [' ', ' '];
      skillsetsFormData.forEach((item) => {
        headerRow.push(item.dataValues.monthName);
        averageRow.push(item.dataValues.average);
      });

      let dataRows = [];
      deduplicatedArray.forEach((question) => {
        let dataRow = [question.skillSetID.toString(), question.skillSet];

        skillsetsFormData.forEach((item) => {
          let responseIndex = item.questionSkillsets.indexOf(
            question.skillSetID.toString()
          );
          if (responseIndex !== -1) {
            if (item.answerSkillsets && item.verified == 1) {
              let responsePercentage = item.answerSkillsets[responseIndex];
              dataRow.push(responsePercentage);
            } else {
              let responsePercentage = '';
              dataRow.push(responsePercentage);
            }
          } else {
            dataRow.push('');
          }
        });

        dataRows.push(dataRow);
      });

      data1 = [headerRow, averageRow, ...dataRows];

      for (let i = 2; i < data1.length; i++) {
        data1[i][0] = (i - 1).toString();
      }
    }

    res.status(200).json({
      status: 200,
      data1: data1 ? data1 : [],
      questionArray: deduplicatedArray ? deduplicatedArray : [],
      data: ['Skill Matrix Level - QC Inspectors - ' + userName],
      notAssignedFormYearMonth: notAssignedFormYearMonth,
    });
  } catch (err) {
    next(err);
  }
};
