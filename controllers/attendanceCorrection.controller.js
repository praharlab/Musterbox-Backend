const AttendanceTransaction = require('../models/attendanceTransaction');
const AttendanceCorrection = require('../models/attendanceCorrection');
const Designation = require('../models/designation');
const UserMaster = require('../models/userMaster');
const Department = require('../models/department');
const BranchMaster = require('../models/branchMaster');
const Shift = require('../models/shift');
const { accessibleUsers } = require('../utils/commonUtilFunctions');

exports.getAlldata = async (req, res, next) => {
  try {
    const { userMasterID, date } = req.query;

    const attendaceTransData = await AttendanceTransaction.findOne({
      where: {
        userMasterID: +userMasterID,
        AttendanceDate: date,
      },
    });

    const attendaceCorrData = await AttendanceCorrection.findAll({
      where: {
        userMasterID: +userMasterID,
        AttendanceDate: date,
      },
      include: [
        {
          model: UserMaster,
          required: true,
        },
      ],
    });

    let finalData = [];
    if (attendaceTransData != null && attendaceCorrData != null) {
      finalData = [attendaceTransData, ...attendaceCorrData];
    } else if (attendaceTransData != null && attendaceCorrData == null) {
      finalData = attendaceTransData;
    } else if (attendaceTransData == null && attendaceCorrData != null) {
      finalData = attendaceCorrData;
    }

    if (finalData.length > 0) {
      for (const item of finalData) {
        let userName = await UserMaster.findOne({
          raw: true,
          where: {
            userMasterID: item.userMasterID,
          },
        });

        if (userName) {
          item.dataValues.userName = userName.displayName;
        } else {
          item.dataValues.userName = '';
        }

        let userDesignation = await Designation.findOne({
          raw: true,
          where: {
            designationId: item.designationID,
          },
        });

        if (userDesignation) {
          item.dataValues.designationName = userDesignation.designationName;
        } else {
          item.dataValues.designationName = '';
        }

        let userDepartment = await Department.findOne({
          raw: true,
          where: {
            departmentId: item.departmentID,
          },
        });

        if (userDepartment) {
          item.dataValues.departmentName = userDepartment.departmentName;
        } else {
          item.dataValues.departmentName = '';
        }

        let userBranch = await BranchMaster.findOne({
          raw: true,
          where: {
            branchMasterID: item.branchID,
          },
        });

        if (userBranch) {
          item.dataValues.branchName = userBranch.branchName;
        } else {
          item.dataValues.branchName = '';
        }

        let userShift = await Shift.findOne({
          raw: true,
          where: {
            shiftID: item.Shift,
          },
        });

        if (userShift) {
          item.dataValues.shiftName = userShift.shiftName;
        } else {
          item.dataValues.shiftName = '';
        }

        const userCreatedBy = await UserMaster.findOne({
          raw: true,
          where: {
            userMasterID: item.createBy,
          },
        });

        if (userCreatedBy) {
          item.dataValues.createdByName = userCreatedBy.displayName;
        } else {
          item.dataValues.createdByName = '';
        }

        const userUpdateBy = await UserMaster.findOne({
          raw: true,
          where: {
            userMasterID: item.updateBy,
          },
        });

        if (userUpdateBy) {
          item.dataValues.updateByName = userUpdateBy.displayName;
        } else {
          item.dataValues.updateByName = '';
        }
      }
    }

    if (finalData.length > 0) {
      res.status(200).json({ status: 200, data: finalData });
    } else {
      res
        .status(200)
        .json({ status: 200, message: 'No Data Found !', data: [] });
    }
  } catch (err) {
    next(err);
  }
};
