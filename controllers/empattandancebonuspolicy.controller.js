const Sequelize = require('sequelize');
const UserMaster = require('../models/userMaster');
const attendanceBonusPolicy = require('../models/attendanceBonusPolicy');
const sequelize = require('../config/database');
const message = require('../response_message/message');
const companyMaster = require('../models/companyMaster');
const EmployeeAttendanceBonusPolicy = require('../models/empattandancebonuspolicy');
const SalaryPolicy = require('../models/employeeSalaryPolicy');
const Salary_policy = require('../models/salaryPolicy');
const HrLeaveMonthlyTrans = require('../models/hrLeavesMonthlyTrans');
const AttendanceBonusPolicy = require('../models/attendanceBonusPolicy');
const { accessibleUsers } = require('../utils/commonUtilFunctions');
const { userAttributes } = require('../utils/commonVars');

exports.getEmployeeAttendanceBonuByUserId = async (req, res, next) => {
  try {
    let get_one_data = await EmployeeAttendanceBonusPolicy.findAll({
      where: {
        userMasterID: req.params.id,
        status: [0, 1],
      },
      include: [
        {
          model: UserMaster,
          as: 'createdByUserDetails',
          attributes: userAttributes,
        },
        {
          model: attendanceBonusPolicy,
          include: [
            {
              model: UserMaster,
              as: 'createdByUserDetails',
              attributes: userAttributes,
            },
            {
              model: UserMaster,
              as: 'updatedByUserDetails',
              attributes: userAttributes,
            },
          ],
        },
      ],
      order: [['startDate', 'ASC']],
    });

    if (get_one_data.length === 0) {
    } else if (get_one_data.length === 1) {
      let startDate = get_one_data[0].startDate
        ? new Date(get_one_data[0].startDate)
        : null;
      if (
        startDate &&
        startDate.toISOString().slice(0, 10) >
          new Date().toISOString().slice(0, 10)
      ) {
        get_one_data[0].dataValues.attendancebonuspolicystatus = 'deactive';
      } else {
        get_one_data[0].dataValues.attendancebonuspolicystatus = 'active';
      }
    } else {
      let startdates = [];
      for (let j = 0; j < get_one_data.length; j++) {
        if (get_one_data[j].startDate) {
          startdates.push(new Date(get_one_data[j].startDate));
        }
      }

      const dateArr = startdates.sort((a, b) => a - b);
      const nearestPastDate = (dateArr, date) => {
        const pastArr = dateArr.filter((n) => n <= date);
        return pastArr.length > 0 ? pastArr[pastArr.length - 1] : null;
      };
      const past = nearestPastDate(dateArr, new Date())
        ? nearestPastDate(dateArr, new Date()).toISOString().slice(0, 10)
        : null;

      for (let i = 0; i < get_one_data.length; i++) {
        let D1 = get_one_data[i].startDate
          ? new Date(get_one_data[i].startDate).toISOString().slice(0, 10)
          : null;
        let D2 = get_one_data[i].endDate
          ? new Date(get_one_data[i].endDate).toISOString().slice(0, 10)
          : null;
        let D3 = new Date().toISOString().slice(0, 10);

        if (D1 && D3 === D1) {
          get_one_data[i].dataValues.attendancebonuspolicystatus = 'active';
        } else if (D1 && D3 >= D1 && (!D2 || D3 <= D2)) {
          get_one_data[i].dataValues.attendancebonuspolicystatus = 'active';
        } else if (!D2 && D1 && D1 <= D3) {
          get_one_data[i].dataValues.attendancebonuspolicystatus = 'active';
        } else if (D1 && D3 > D1) {
          if (D1 === past) {
            get_one_data[i].dataValues.attendancebonuspolicystatus = 'active';
          } else {
            get_one_data[i].dataValues.attendancebonuspolicystatus = 'deactive';
          }
        } else {
          get_one_data[i].dataValues.attendancebonuspolicystatus = 'deactive';
        }
      }
    }

    return res.status(200).json({ status: 200, data: get_one_data });
  } catch (err) {
    next(err);
  }
};

exports.getAttendanceBonusPolicyoff = async (req, res, next) => {
  try {
    const { limit, page, searchQuery, companyMasterID } = req.body;
    const condition = {};

    if (searchQuery)
      condition[Sequelize.Op.or] = [
        { displayName: { [Sequelize.Op.iLike]: '%' + searchQuery + '%' } },
        { userNumber: { [Sequelize.Op.iLike]: '%' + searchQuery + '%' } },
      ];

    if (companyMasterID) condition.companyMasterId = companyMasterID;

    condition.status = 1;

    const paginatecondition =
      page && limit ? { offset: (page - 1) * limit, limit } : {};

    const { rows: company_contact, count: totalcount } =
      await UserMaster.findAndCountAll({
        raw: true,
        where: condition,
        ...paginatecondition,
        order: [['displayName', 'ASC']],
        ...accessibleUsers(req.userDetails, false),
      });

    for (let i = 0; i < company_contact.length; i++) {
      // Fetch employee attendance bonus policies
      let get_one_data = await EmployeeAttendanceBonusPolicy.findAll({
        where: {
          userMasterID: company_contact[i].userMasterID,
          status: {
            [Sequelize.Op.in]: [1],
          },
        },
        order: [['startDate', 'ASC']],
        include: [{ model: AttendanceBonusPolicy }],
      });

      company_contact[i]['department'] = get_one_data;

      if (get_one_data.length === 0) {
        // Handle case where there are no policies
      } else if (get_one_data.length === 1) {
        if (
          new Date(get_one_data[0].startDate).toISOString().slice(0, 10) >
          new Date().toISOString().slice(0, 10)
        ) {
          get_one_data[0].status = 0;
        } else {
          get_one_data[0].status = 1;
        }
      } else {
        let startdates = [];
        for (let j = 0; j < get_one_data.length; j++) {
          startdates.push(new Date(get_one_data[j].startDate));
        }
        const dateArr = startdates.sort((a, b) => a - b);
        const nearestPastDate = (dateArr, date) => {
          const pastArr = dateArr.filter((n) => n <= date);
          return pastArr.length > 0 ? pastArr[pastArr.length - 1] : null;
        };
        const past = nearestPastDate(dateArr, new Date())
          ? nearestPastDate(dateArr, new Date()).toISOString().slice(0, 10)
          : null;

        for (let j = 0; j < get_one_data.length; j++) {
          let D1 = get_one_data[j].startDate
            ? new Date(get_one_data[j].startDate).toISOString().slice(0, 10)
            : null;
          let D2 = get_one_data[j].endDate
            ? new Date(get_one_data[j].endDate).toISOString().slice(0, 10)
            : null;
          let D3 = new Date().toISOString().slice(0, 10);

          if (D3 === D1) {
            get_one_data[j].status = 1;
          } else if (D1 && D3 >= D1 && (!D2 || D3 <= D2) && D3 === D1) {
            get_one_data[j].status = 1;
          } else if (D2 === null && D1 && D1 <= D3) {
            get_one_data[j].status = 1;
          } else if (D1 && D3 > D1) {
            if (D1 === past) {
              get_one_data[j].status = 1;
            } else {
              get_one_data[j].status = 0;
            }
          } else {
            get_one_data[j].status = 0;
          }
        }
      }
    }

    return res
      .status(200)
      .json({ status: 200, data: company_contact, totalcount: totalcount });
  } catch (err) {
    next(err);
  }
};

exports.postAddattendanceBonusBULK = async (req, res, next) => {
  try {
    let { userMasterID, attendanceBonusPolicyId, startDate, createByIp } =
      req.body;
    let assignedUser = [];
    let notassignedUser = [];
    let applicableDate1;

    const [allSalaryPolicy, allEmployeeAttendanceBonusPolicy] =
      await Promise.all([
        SalaryPolicy.findAll({
          raw: true,
          where: {
            userMasterID: {
              [Sequelize.Op.in]: userMasterID,
            },
            status: 1,
            startDate: {
              [Sequelize.Op.lte]: new Date(),
            },
            [Sequelize.Op.or]: [
              {
                endDate: { [Sequelize.Op.gte]: new Date() },
              },
              {
                endDate: { [Sequelize.Op.eq]: null },
              },
            ],
          },
          include: [
            {
              model: Salary_policy,
              as: 'salaryPolicy', // Alias
            },
          ],
        }),
        EmployeeAttendanceBonusPolicy.findAll({
          where: {
            userMasterID: {
              [Sequelize.Op.in]: userMasterID,
            },
            status: 1,
          },
        }),
      ]);

    for (let n = 0; n < userMasterID.length; n++) {
      const active_salary_policy = allSalaryPolicy.find(
        (e) => e.userMasterID == userMasterID[n]
      );

      let tempDate = '01';
      let finalDate = '';

      if (
        active_salary_policy &&
        active_salary_policy['salaryPolicy.salaryCycleDate']
      ) {
        tempDate = active_salary_policy['salaryPolicy.salaryCycleDate']
          .toString()
          .padStart(2, '0');
      }

      if (Number(startDate) == 0) {
        let YYYYMM = Number(
          new Date().getFullYear() +
            new Date().getMonth().toString().padStart(2, '0')
        );
        let checkAttendanceVerification = await HrLeaveMonthlyTrans.findOne({
          raw: true,
          where: {
            userMasterID: userMasterID[n],
            AttnYearMon: YYYYMM,
            verified: 1,
          },
        });

        if (checkAttendanceVerification) {
          notassignedUser.push(userMasterID[n]);
          continue;
        } else {
          assignedUser.push(userMasterID[n]);
        }
        finalDate = new Date();
        finalDate.setMonth(finalDate.getMonth() - 1, Number(tempDate));
        finalDate = new Date(finalDate).toISOString().slice(0, 10);
      } else if (Number(startDate) == 1) {
        let YYYYMM = Number(
          new Date().getFullYear() +
            (new Date().getMonth() + 1).toString().padStart(2, '0')
        );
        let checkAttendanceVerification = await HrLeaveMonthlyTrans.findOne({
          raw: true,
          where: {
            userMasterID: userMasterID[n],
            AttnYearMon: YYYYMM,
            verified: 1,
          },
        });

        if (checkAttendanceVerification) {
          notassignedUser.push(userMasterID[n]);
          continue;
        } else {
          assignedUser.push(userMasterID[n]);
        }

        finalDate =
          new Date().getFullYear() +
          '-' +
          (new Date().getMonth() + 1).toString().padStart(2, '0') +
          '-' +
          tempDate;
      } else {
        assignedUser.push(userMasterID[n]);
        finalDate =
          new Date().getFullYear() +
          '-' +
          (new Date().getMonth() + 2).toString().padStart(2, '0') +
          '-' +
          tempDate;
      }

      applicableDate1 = new Date(finalDate);

      const data = allEmployeeAttendanceBonusPolicy.find(
        (e) =>
          e.userMasterID == userMasterID[n] &&
          new Date(e.startDate).toISOString().slice(0, 10) ==
            new Date(applicableDate1).toISOString().slice(0, 10)
      );

      // const data = await EmployeeAttendanceBonusPolicy.findOne({
      //     where: {
      //         userMasterID: userMasterID[n],
      //         status: 1,
      //         startDate: new Date(applicableDate1),
      //     },
      // });

      if (!data) {
        const get_one_data = allEmployeeAttendanceBonusPolicy.filter(
          (e) => e.userMasterID == userMasterID[n]
        );

        // const get_one_data = await EmployeeAttendanceBonusPolicy.findAll({
        //     where: {
        //         userMasterID: {
        //             [Sequelize.Op.in]: userMasterID[n]
        //         },
        //         status: 1,
        //     },
        // })

        if (get_one_data.length > 0) {
          let startdates = []; // Fixed typo: `startDates` to `startdates`
          for (let i = 0; i < get_one_data.length; i++) {
            startdates.push(new Date(get_one_data[i].startDate));
          }

          const dateArr = startdates.sort((a, b) => a - b);
          const nearestPastDate = (dateArr, date) => {
            const pastArr = dateArr.filter((n) => n <= date);
            return pastArr.length > 0 ? pastArr[pastArr.length - 1] : null;
          };

          const nearestFutureDate = (dateArr, date) => {
            const futArr = dateArr.filter((n) => n >= date);
            return futArr.length > 0 ? futArr[0] : null;
          };

          if (nearestPastDate(dateArr, new Date(applicableDate1)) != null) {
            await EmployeeAttendanceBonusPolicy.update(
              {
                endDate: new Date(
                  new Date(applicableDate1).getTime() - 86400000
                ),
              },
              {
                where: {
                  startDate: nearestPastDate(
                    dateArr,
                    new Date(applicableDate1)
                  ),
                  userMasterID: userMasterID[n],
                },
              }
            );
          }
          if (nearestFutureDate(dateArr, new Date(applicableDate1)) != null) {
            await EmployeeAttendanceBonusPolicy.create(
              {
                userMasterID: userMasterID[n],
                attendanceBonusPolicyId,
                startDate: applicableDate1,
                endDate:
                  nearestFutureDate(
                    dateArr,
                    new Date(applicableDate1)
                  ).getTime() - 86400000,
                createBy: req.userDetails.userMasterId,
                createByIp,
              },
              {
                user: req.userDetails,
              }
            );
          } else {
            await EmployeeAttendanceBonusPolicy.create(
              {
                userMasterID: userMasterID[n],
                attendanceBonusPolicyId,
                startDate: applicableDate1,
                createBy: req.userDetails.userMasterId,
                createByIp,
              },
              { user: req.userDetails }
            );
          }
        } else {
          await EmployeeAttendanceBonusPolicy.create(
            {
              userMasterID: userMasterID[n],
              attendanceBonusPolicyId,
              startDate: applicableDate1,
              createBy: req.userDetails.userMasterId,
              createByIp,
            },
            { user: req.userDetails }
          );
        }
      } else {
        await EmployeeAttendanceBonusPolicy.update(
          {
            attendanceBonusPolicyId,
            updateBy: req.userDetails.userMasterId,
            updateByIp: createByIp,
          },
          {
            where: {
              employeeAttendanceBonusID: data.employeeAttendanceBonusID,
            },
          }
        );
      }
    }

    let Notassigned = await UserMaster.findAll({
      raw: true,
      where: {
        userMasterID: notassignedUser,
        status: 1,
      },
      attributes: ['displayName'],
    });

    let message = '';

    message =
      'Attendance Bonus Policy has been assigned to (' +
      assignedUser.length +
      ') users. <br><br>';

    let notassignname = '';

    for (let i = 0; i < Notassigned.length; i++) {
      notassignname += Notassigned[i].displayName + ',';
    }
    if (Notassigned.length > 0) {
      message =
        message +
        'Attendance Bonus Policy has not been assigned to ' +
        notassignname +
        ' because attendance already verified.';
    }

    return res.status(200).json({ status: 200, message: message });
  } catch (err) {
    next(err);
  }
};
