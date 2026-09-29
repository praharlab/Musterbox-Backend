const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const logger = require('../config/logger');
const message = require('../response_message/message');
const reportTo = require('../models/employeeReportTo');
const designation = require('../models/designation');
const UserMaster = require('../models/userMaster');
const moment = require('moment');
const EmployeeDepartment = require('../models/employeeDepartment');
const EmployeeDesignation = require('../models/employeeDesignation');
const attendanceTransaction = require('../models/attendanceTransaction');
const Visit = require('../models/visit');
const AttendanceLogs = require('../models/attendancelogs');
const Designation = require('../models/designation');
const DepartmentModel = require('../models/department');
const {
  accessibleUsers,
  asiaKolkataDateTime,
} = require('../utils/commonUtilFunctions');
const BranchMaster = require('../models/branchMaster');
const EmployeeBranch = require('../models/employeeBranch');
const Department = require('../models/department');
const companyMaster = require('../models/companyMaster');
const EmployeeReportTo = require('../models/employeeReportTo');
const EmployeeJoiningDetails = require('../models/employeeJoiningDetails');

async function employeedepartment(userid) {
  let date = new Date().toISOString().slice(0, 10);
  let getDepartment = await EmployeeDepartment.findOne({
    raw: true,
    where: {
      userMasterID: userid,
      status: 1,
      applicableDate: {
        [Sequelize.Op.lte]: new Date(date),
      },
      [Sequelize.Op.or]: [
        {
          endDate: {
            [Sequelize.Op.gte]: new Date(date),
          },
        },
        {
          endDate: { [Sequelize.Op.eq]: null },
        },
      ],
    },
    include: [
      {
        model: DepartmentModel,
        as: 'department',
      },
    ],
  });

  return getDepartment ? getDepartment['department.departmentName'] : '';
}

async function employeeattendance(userid, date) {
  let attendancetransaction = await attendanceTransaction.findOne({
    where: {
      userMasterID: userid,
      AttendanceDate: new Date(date),
    },
  });
  return attendancetransaction;
}

async function employeedesignation(userid) {
  let date = new Date().toISOString().slice(0, 10);
  let getDesignation = await EmployeeDesignation.findOne({
    raw: true,
    where: {
      userMasterID: userid,
      status: 1,
      applicableDate: {
        [Sequelize.Op.lte]: new Date(date),
      },
      [Sequelize.Op.or]: [
        {
          endDate: {
            [Sequelize.Op.gte]: new Date(date),
          },
        },
        {
          endDate: { [Sequelize.Op.eq]: null },
        },
      ],
    },
    include: [
      {
        model: Designation,
        as: 'designation',
      },
    ],
  });

  return getDesignation ? getDesignation['designation.designationName'] : '';
}

exports.display_report_to = async (req, res, next) => {
  try {
    let data = await reportTo.findOne({
      raw: true,
      where: {
        userMasterID: req.params.id,
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
      },
    });
    if (data != null) {
      let temp_data = await UserMaster.findOne({
        where: {
          userMasterID: data.userMasterID,
        },
      });
      let designation_data = await designation.findOne({
        where: {
          companyMasterID: temp_data.companyMasterId,
        },
      });

      data.name =
        temp_data.firstName +
        ' ' +
        temp_data.middleName +
        ' ' +
        temp_data.lastName;
      data.designation = designation_data.designationName;

      if (data != null && data.reportToID != null) {
        for (var a = 0; a < data.reportToID.length; a++) {
          let temp_data = await UserMaster.findOne({
            where: {
              userMasterID: data.reportToID[a],
            },
          });
          let designation_data = await designation.findOne({
            where: {
              companyMasterID: temp_data.companyMasterId,
            },
          });

          let temp_id = parseInt(data.reportToID[a]);

          data.reportToID[a] = {
            userMasterID: data.reportToID[a],
            name:
              temp_data.firstName +
              ' ' +
              temp_data.middleName +
              ' ' +
              temp_data.lastName,
            designation: designation_data.designationName,
            reportToID: null,
          };
          let data_child_1 = await reportTo.findOne({
            raw: true,
            where: {
              userMasterID: temp_id,
              status: {
                [Sequelize.Op.in]: [0, 1],
              },
            },
          });

          if (data_child_1 != null && data_child_1.reportToID != null) {
            data.reportToID[a].reportToID = [];
            for (var b = 0; b < data_child_1.reportToID.length; b++) {
              let child_1_name = await UserMaster.findOne({
                where: {
                  userMasterID: data_child_1.reportToID[b],
                },
              });
              let child_1_designation = await designation.findOne({
                where: {
                  companyMasterID: child_1_name.companyMasterId,
                },
              });

              let temp_id = parseInt(data_child_1.reportToID[b]);

              data.reportToID[a].reportToID[b] = {
                userMasterID: data_child_1.reportToID[b],
                name:
                  child_1_name.firstName +
                  ' ' +
                  child_1_name.middleName +
                  ' ' +
                  child_1_name.lastName,
                designation: child_1_designation.designationName,
                reportToID: null,
              };

              let data_child_2 = await reportTo.findOne({
                raw: true,
                where: {
                  userMasterID: temp_id,
                  status: {
                    [Sequelize.Op.in]: [0, 1],
                  },
                },
              });

              if (data_child_2 != null && data_child_2.reportToID != null) {
                data.reportToID[a].reportToID[b].reportToID = [];
                for (var c = 0; c < data_child_2.reportToID.length; c++) {
                  let child_2_name = await UserMaster.findOne({
                    where: {
                      userMasterID: data_child_2.reportToID[c],
                    },
                  });
                  let child_2_designation = await designation.findOne({
                    where: {
                      companyMasterID: child_2_name.companyMasterId,
                    },
                  });

                  let temp_id = parseInt(data_child_2.reportToID[c]);

                  data.reportToID[a].reportToID[b].reportToID[c] = {
                    userMasterID: data_child_2.reportToID[c],
                    name:
                      child_2_name.firstName +
                      ' ' +
                      child_2_name.middleName +
                      ' ' +
                      child_2_name.lastName,
                    designation: child_2_designation.designationName,
                    reportToID: null,
                  };

                  let data_child_3 = await reportTo.findOne({
                    raw: true,
                    where: {
                      userMasterID: temp_id,
                      status: {
                        [Sequelize.Op.in]: [0, 1],
                      },
                    },
                  });

                  if (data_child_3 != null && data_child_3.reportToID != null) {
                    data.reportToID[a].reportToID[b].reportToID[c].reportToID =
                      [];
                    for (var d = 0; d < data_child_3.reportToID.length; d++) {
                      let child_3_name = await UserMaster.findOne({
                        where: {
                          userMasterID: data_child_3.reportToID[d],
                        },
                      });
                      let child_3_designation = await designation.findOne({
                        where: {
                          companyMasterID: child_3_name.companyMasterId,
                        },
                      });

                      let temp_id = parseInt(data_child_3.reportToID[d]);

                      data.reportToID[a].reportToID[b].reportToID[c].reportToID[
                        d
                      ] = {
                        userMasterID: data_child_3.reportToID[d],
                        name:
                          child_3_name.firstName +
                          ' ' +
                          child_3_name.middleName +
                          ' ' +
                          child_3_name.lastName,
                        designation: child_3_designation.designationName,
                        reportToID: null,
                      };

                      let data_child_4 = await reportTo.findOne({
                        raw: true,
                        where: {
                          userMasterID: temp_id,
                          status: {
                            [Sequelize.Op.in]: [0, 1],
                          },
                        },
                      });

                      if (
                        data_child_4 != null &&
                        data_child_4.reportToID != null
                      ) {
                        data.reportToID[a].reportToID[b].reportToID[
                          c
                        ].reportToID[d].reportToID = [];
                        for (
                          var e = 0;
                          e < data_child_4.reportToID.length;
                          e++
                        ) {
                          let child_4_name = await UserMaster.findOne({
                            where: {
                              userMasterID: data_child_4.reportToID[e],
                            },
                          });
                          let child_4_designation = await designation.findOne({
                            where: {
                              companyMasterID: child_4_name.companyMasterId,
                            },
                          });

                          let temp_id = parseInt(data_child_4.reportToID[e]);

                          data.reportToID[a].reportToID[b].reportToID[
                            c
                          ].reportToID[d].reportToID[e] = {
                            userMasterID: data_child_4.reportToID[e],
                            name:
                              child_4_name.firstName +
                              ' ' +
                              child_4_name.middleName +
                              ' ' +
                              child_4_name.lastName,
                            designation: child_4_designation.designationName,
                            reportToID: null,
                          };

                          let data_child_5 = await reportTo.findOne({
                            raw: true,
                            where: {
                              userMasterID: temp_id,
                              status: {
                                [Sequelize.Op.in]: [0, 1],
                              },
                            },
                          });

                          if (
                            data_child_5 != null &&
                            data_child_5.reportToID != null
                          ) {
                            data.reportToID[a].reportToID[b].reportToID[
                              c
                            ].reportToID[d].reportToID[e].reportToID = [];
                            for (
                              var f = 0;
                              f < data_child_5.reportToID.length;
                              f++
                            ) {
                              let child_5_name = await UserMaster.findOne({
                                where: {
                                  userMasterID: data_child_5.reportToID[f],
                                },
                              });
                              let child_5_designation =
                                await designation.findOne({
                                  where: {
                                    companyMasterID:
                                      child_5_name.companyMasterId,
                                  },
                                });

                              let temp_id = parseInt(
                                data_child_5.reportToID[f]
                              );

                              data.reportToID[a].reportToID[b].reportToID[
                                c
                              ].reportToID[d].reportToID[e].reportToID[f] = {
                                userMasterID: data_child_5.reportToID[f],
                                name:
                                  child_5_name.firstName +
                                  ' ' +
                                  child_5_name.middleName +
                                  ' ' +
                                  child_5_name.lastName,
                                designation:
                                  child_5_designation.designationName,
                                reportToID: null,
                              };

                              let data_child_6 = await reportTo.findOne({
                                raw: true,
                                where: {
                                  userMasterID: temp_id,
                                  status: {
                                    [Sequelize.Op.in]: [0, 1],
                                  },
                                },
                              });

                              if (
                                data_child_6 != null &&
                                data_child_6.reportToID != null
                              ) {
                                data.reportToID[a].reportToID[b].reportToID[
                                  c
                                ].reportToID[d].reportToID[e].reportToID[
                                  f
                                ].reportToID = [];
                                for (
                                  var g = 0;
                                  g < data_child_6.reportToID.length;
                                  g++
                                ) {
                                  let child_6_name = await UserMaster.findOne({
                                    where: {
                                      userMasterID: data_child_6.reportToID[g],
                                    },
                                  });
                                  let child_6_designation =
                                    await designation.findOne({
                                      where: {
                                        companyMasterID:
                                          child_6_name.companyMasterId,
                                      },
                                    });

                                  let temp_id = parseInt(
                                    data_child_6.reportToID[g]
                                  );

                                  data.reportToID[a].reportToID[b].reportToID[
                                    c
                                  ].reportToID[d].reportToID[e].reportToID[
                                    f
                                  ].reportToID[g] = {
                                    userMasterID: data_child_6.reportToID[g],
                                    name:
                                      child_6_name.firstName +
                                      ' ' +
                                      child_6_name.middleName +
                                      ' ' +
                                      child_6_name.lastName,
                                    designation:
                                      child_6_designation.designationName,
                                    reportToID: null,
                                  };

                                  let data_child_7 = await reportTo.findOne({
                                    raw: true,
                                    where: {
                                      userMasterID: temp_id,
                                      status: {
                                        [Sequelize.Op.in]: [0, 1],
                                      },
                                    },
                                  });

                                  if (
                                    data_child_7 != null &&
                                    data_child_7.reportToID != null
                                  ) {
                                    data.reportToID[a].reportToID[b].reportToID[
                                      c
                                    ].reportToID[d].reportToID[e].reportToID[
                                      f
                                    ].reportToID[g].reportToID = [];
                                    for (
                                      var h = 0;
                                      h < data_child_7.reportToID.length;
                                      h++
                                    ) {
                                      let child_7_name =
                                        await UserMaster.findOne({
                                          where: {
                                            userMasterID:
                                              data_child_7.reportToID[h],
                                          },
                                        });
                                      let child_7_designation =
                                        await designation.findOne({
                                          where: {
                                            companyMasterID:
                                              child_7_name.companyMasterId,
                                          },
                                        });

                                      let temp_id = parseInt(
                                        data_child_7.reportToID[h]
                                      );

                                      data.reportToID[a].reportToID[
                                        b
                                      ].reportToID[c].reportToID[d].reportToID[
                                        e
                                      ].reportToID[f].reportToID[g].reportToID[
                                        h
                                      ] = {
                                        userMasterID:
                                          data_child_7.reportToID[h],
                                        name:
                                          child_7_name.firstName +
                                          ' ' +
                                          child_7_name.middleName +
                                          ' ' +
                                          child_7_name.lastName,
                                        designation:
                                          child_7_designation.designationName,
                                        reportToID: null,
                                      };

                                      let data_child_8 = await reportTo.findOne(
                                        {
                                          raw: true,
                                          where: {
                                            userMasterID: temp_id,
                                            status: {
                                              [Sequelize.Op.in]: [0, 1],
                                            },
                                          },
                                        }
                                      );

                                      if (
                                        data_child_8 != null &&
                                        data_child_8.reportToID != null
                                      ) {
                                        data.reportToID[a].reportToID[
                                          b
                                        ].reportToID[c].reportToID[
                                          d
                                        ].reportToID[e].reportToID[
                                          f
                                        ].reportToID[g].reportToID[
                                          h
                                        ].reportToID = [];
                                        for (
                                          var i = 0;
                                          i < data_child_8.reportToID.length;
                                          i++
                                        ) {
                                          let child_8_name =
                                            await UserMaster.findOne({
                                              where: {
                                                userMasterID:
                                                  data_child_8.reportToID[i],
                                              },
                                            });
                                          let child_8_designation =
                                            await designation.findOne({
                                              where: {
                                                companyMasterID:
                                                  child_8_name.companyMasterId,
                                              },
                                            });

                                          let temp_id = parseInt(
                                            data_child_8.reportToID[i]
                                          );

                                          data.reportToID[a].reportToID[
                                            b
                                          ].reportToID[c].reportToID[
                                            d
                                          ].reportToID[e].reportToID[
                                            f
                                          ].reportToID[g].reportToID[
                                            h
                                          ].reportToID[i] = {
                                            userMasterID:
                                              data_child_8.reportToID[i],
                                            name:
                                              child_8_name.firstName +
                                              ' ' +
                                              child_8_name.middleName +
                                              ' ' +
                                              child_8_name.lastName,
                                            designation:
                                              child_8_designation.designationName,
                                            reportToID: null,
                                          };

                                          let data_child_9 =
                                            await reportTo.findOne({
                                              raw: true,
                                              where: {
                                                userMasterID: temp_id,
                                                status: {
                                                  [Sequelize.Op.in]: [0, 1],
                                                },
                                              },
                                            });

                                          if (
                                            data_child_9 != null &&
                                            data_child_9.reportToID != null
                                          ) {
                                            data.reportToID[a].reportToID[
                                              b
                                            ].reportToID[c].reportToID[
                                              d
                                            ].reportToID[e].reportToID[
                                              f
                                            ].reportToID[g].reportToID[
                                              h
                                            ].reportToID[i].reportToID = [];
                                            for (
                                              var j = 0;
                                              j <
                                              data_child_9.reportToID.length;
                                              j++
                                            ) {
                                              let child_9_name =
                                                await UserMaster.findOne({
                                                  where: {
                                                    userMasterID:
                                                      data_child_9.reportToID[
                                                        j
                                                      ],
                                                  },
                                                });
                                              let child_9_designation =
                                                await designation.findOne({
                                                  where: {
                                                    companyMasterID:
                                                      child_9_name.companyMasterId,
                                                  },
                                                });

                                              let temp_id = parseInt(
                                                data_child_9.reportToID[j]
                                              );

                                              data.reportToID[a].reportToID[
                                                b
                                              ].reportToID[c].reportToID[
                                                d
                                              ].reportToID[e].reportToID[
                                                f
                                              ].reportToID[g].reportToID[
                                                h
                                              ].reportToID[i].reportToID[j] = {
                                                userMasterID:
                                                  data_child_9.reportToID[j],
                                                name:
                                                  child_9_name.firstName +
                                                  ' ' +
                                                  child_9_name.middleName +
                                                  ' ' +
                                                  child_9_name.lastName,
                                                designation:
                                                  child_9_designation.designationName,
                                                reportToID: null,
                                              };
                                            }
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    if (!data) {
      res
        .status(200)
        .json({ status: 200, message: message.usermessage.deletedrecord });
    } else {
      res.status(200).json({ status: 200, data: data });
    }
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

exports.reportsto = async (req, res, next) => {
  try {
    let firstlevel = await reportTo.findAll({
      where: {
        reportToID: req.params.id,
        status: 1,
      },

      attributes: ['userMasterID'],
      //   include: {
      //     model: UserMaster,
      //     as: 'employee',
      //     attributes: ['displayName', 'userNumber', 'photo'],
      //   },
    });
    let maintree = [];

    if (firstlevel.length > 0) {
      for (var i = 0; i < firstlevel.length; i++) {
        let secondlevel = await reportTo.findAll({
          where: {
            reportToID: firstlevel[i].userMasterID,
            status: 1,
          },
          attributes: ['userMasterID'],
        });
        let userdata = await UserMaster.findOne({
          where: {
            userMasterID: firstlevel[i].userMasterID,
            status: 1,
          },
        });
        firstlevel[i].dataValues.name = userdata.displayName;

        firstlevel[i].dataValues.photo = userdata.photo;
        firstlevel[i].dataValues.userNumber = userdata.userNumber;
        firstlevel[i].dataValues.department = await employeedepartment(
          firstlevel[i].userMasterID
        );
        firstlevel[i].dataValues.designation = await employeedesignation(
          firstlevel[i].userMasterID
        );
        if (secondlevel.length > 0) {
          firstlevel[i].dataValues.children = secondlevel;
          for (var j = 0; j < firstlevel[i].dataValues.children.length; j++) {
            let thirdlevel = await reportTo.findAll({
              where: {
                reportToID: firstlevel[i].dataValues.children[j].userMasterID,
                status: 1,
              },
              attributes: ['userMasterID'],
            });

            let userdata = await UserMaster.findOne({
              where: {
                userMasterID: firstlevel[i].dataValues.children[j].userMasterID,
                status: 1,
              },
            });

            firstlevel[i].dataValues.children[j].dataValues.name =
              userdata.displayName;
            firstlevel[i].dataValues.children[j].dataValues.photo =
              userdata.photo;
            firstlevel[i].dataValues.children[j].dataValues.userNumber =
              userdata.userNumber;
            firstlevel[i].dataValues.children[j].dataValues.department =
              await employeedepartment(
                firstlevel[i].dataValues.children[j].userMasterID
              );

            firstlevel[i].dataValues.children[j].dataValues.designation =
              await employeedesignation(
                firstlevel[i].dataValues.children[j].userMasterID
              );
            if (thirdlevel.length > 0) {
              firstlevel[i].dataValues.children[j].dataValues.children =
                thirdlevel;

              for (
                var k = 0;
                k <
                firstlevel[i].dataValues.children[j].dataValues.children.length;
                k++
              ) {
                let fourthlevel = await reportTo.findAll({
                  where: {
                    reportToID:
                      firstlevel[i].dataValues.children[j].dataValues.children[
                        k
                      ].userMasterID,
                    status: 1,
                  },
                  attributes: ['userMasterID'],
                });

                let userdata = await UserMaster.findOne({
                  where: {
                    userMasterID:
                      firstlevel[i].dataValues.children[j].dataValues.children[
                        k
                      ].userMasterID,
                    status: 1,
                  },
                });

                firstlevel[i].dataValues.children[j].dataValues.children[
                  k
                ].dataValues.name = userdata.displayName;
                firstlevel[i].dataValues.children[j].dataValues.children[
                  k
                ].dataValues.photo = userdata.photo;
                firstlevel[i].dataValues.children[j].dataValues.children[
                  k
                ].dataValues.userNumber = userdata.userNumber;

                firstlevel[i].dataValues.children[j].dataValues.children[
                  k
                ].dataValues.department = await employeedepartment(
                  firstlevel[i].dataValues.children[j].dataValues.children[k]
                    .userMasterID
                );

                firstlevel[i].dataValues.children[j].dataValues.children[
                  k
                ].dataValues.designation = await employeedesignation(
                  firstlevel[i].dataValues.children[j].dataValues.children[k]
                    .userMasterID
                );

                if (fourthlevel.length > 0) {
                  firstlevel[i].dataValues.children[j].dataValues.children[
                    k
                  ].dataValues.children = fourthlevel;

                  for (
                    var m = 0;
                    m <
                    firstlevel[i].dataValues.children[j].dataValues.children[k]
                      .dataValues.children.length;
                    m++
                  ) {
                    let fifthlevel = await reportTo.findAll({
                      where: {
                        reportToID:
                          firstlevel[i].dataValues.children[j].dataValues
                            .children[k].dataValues.children[m].dataValues
                            .userMasterID,
                        status: 1,
                      },
                      attributes: ['userMasterID'],
                    });

                    let userdata = await UserMaster.findOne({
                      where: {
                        userMasterID:
                          firstlevel[i].dataValues.children[j].dataValues
                            .children[k].dataValues.children[m].dataValues
                            .userMasterID,
                        status: 1,
                      },
                    });

                    firstlevel[i].dataValues.children[j].dataValues.children[
                      k
                    ].dataValues.children[m].dataValues.name =
                      userdata.displayName;
                    firstlevel[i].dataValues.children[j].dataValues.children[
                      k
                    ].dataValues.children[m].dataValues.photo = userdata.photo;
                    firstlevel[i].dataValues.children[j].dataValues.children[
                      k
                    ].dataValues.children[m].dataValues.userNumber =
                      userdata.userNumber;

                    firstlevel[i].dataValues.children[j].dataValues.children[
                      k
                    ].dataValues.children[m].dataValues.department =
                      await employeedepartment(
                        firstlevel[i].dataValues.children[j].dataValues
                          .children[k].dataValues.children[m].dataValues
                          .userMasterID
                      );

                    firstlevel[i].dataValues.children[j].dataValues.children[
                      k
                    ].dataValues.children[m].dataValues.designation =
                      await employeedesignation(
                        firstlevel[i].dataValues.children[j].dataValues
                          .children[k].dataValues.children[m].dataValues
                          .userMasterID
                      );

                    if (fifthlevel.length > 0) {
                      firstlevel[i].dataValues.children[j].dataValues.children[
                        k
                      ].dataValues.children[m].dataValues.children = fifthlevel;

                      for (
                        var n = 0;
                        n <
                        firstlevel[i].dataValues.children[j].dataValues
                          .children[k].dataValues.children[m].dataValues
                          .children.length;
                        n++
                      ) {
                        let sixthlevel = await reportTo.findAll({
                          where: {
                            reportToID:
                              firstlevel[i].dataValues.children[j].dataValues
                                .children[k].dataValues.children[m].dataValues
                                .children[n].dataValues.userMasterID,
                            status: 1,
                          },
                          attributes: ['userMasterID'],
                        });

                        let userdata = await UserMaster.findOne({
                          where: {
                            userMasterID:
                              firstlevel[i].dataValues.children[j].dataValues
                                .children[k].dataValues.children[m].dataValues
                                .children[n].dataValues.userMasterID,
                            status: 1,
                          },
                        });

                        firstlevel[i].dataValues.children[
                          j
                        ].dataValues.children[k].dataValues.children[
                          m
                        ].dataValues.children[n].dataValues.name =
                          userdata.displayName;
                        firstlevel[i].dataValues.children[
                          j
                        ].dataValues.children[k].dataValues.children[
                          m
                        ].dataValues.children[n].dataValues.photo =
                          userdata.photo;
                        firstlevel[i].dataValues.children[
                          j
                        ].dataValues.children[k].dataValues.children[
                          m
                        ].dataValues.children[n].dataValues.userNumber =
                          userdata.userNumber;
                        firstlevel[i].dataValues.children[
                          j
                        ].dataValues.children[k].dataValues.children[
                          m
                        ].dataValues.children[n].dataValues.department =
                          await employeedepartment(
                            firstlevel[i].dataValues.children[j].dataValues
                              .children[k].dataValues.children[m].dataValues
                              .children[n].dataValues.userMasterID
                          );

                        firstlevel[i].dataValues.children[
                          j
                        ].dataValues.children[k].dataValues.children[
                          m
                        ].dataValues.children[n].dataValues.designation =
                          await employeedesignation(
                            firstlevel[i].dataValues.children[j].dataValues
                              .children[k].dataValues.children[m].dataValues
                              .children[n].dataValues.userMasterID
                          );

                        if (sixthlevel.length > 0) {
                          firstlevel[i].dataValues.children[
                            j
                          ].dataValues.children[k].dataValues.children[
                            m
                          ].dataValues.children[n].dataValues.children =
                            sixthlevel;

                          for (
                            var l = 0;
                            l <
                            firstlevel[i].dataValues.children[j].dataValues
                              .children[k].dataValues.children[m].dataValues
                              .children[n].dataValues.children.length;
                            l++
                          ) {
                            let seventhlevel = await reportTo.findAll({
                              where: {
                                reportToID:
                                  firstlevel[i].dataValues.children[j]
                                    .dataValues.children[k].dataValues.children[
                                    m
                                  ].dataValues.children[n].dataValues.children[
                                    l
                                  ].dataValues.userMasterID,
                                status: 1,
                              },
                              attributes: ['userMasterID'],
                            });

                            let userdata = await UserMaster.findOne({
                              where: {
                                userMasterID:
                                  firstlevel[i].dataValues.children[j]
                                    .dataValues.children[k].dataValues.children[
                                    m
                                  ].dataValues.children[n].dataValues.children[
                                    l
                                  ].dataValues.userMasterID,
                                status: 1,
                              },
                            });
                            firstlevel[i].dataValues.children[
                              j
                            ].dataValues.children[k].dataValues.children[
                              m
                            ].dataValues.children[n].dataValues.children[
                              l
                            ].dataValues.name = userdata.displayName;
                            firstlevel[i].dataValues.children[
                              j
                            ].dataValues.children[k].dataValues.children[
                              m
                            ].dataValues.children[n].dataValues.children[
                              l
                            ].dataValues.photo = userdata.photo;
                            firstlevel[i].dataValues.children[
                              j
                            ].dataValues.children[k].dataValues.children[
                              m
                            ].dataValues.children[n].dataValues.children[
                              l
                            ].dataValues.userNumber = userdata.userNumber;

                            firstlevel[i].dataValues.children[
                              j
                            ].dataValues.children[k].dataValues.children[
                              m
                            ].dataValues.children[n].dataValues.children[
                              l
                            ].dataValues.department = await employeedepartment(
                              firstlevel[i].dataValues.children[j].dataValues
                                .children[k].dataValues.children[m].dataValues
                                .children[n].dataValues.children[l].dataValues
                                .userMasterID
                            );

                            firstlevel[i].dataValues.children[
                              j
                            ].dataValues.children[k].dataValues.children[
                              m
                            ].dataValues.children[n].dataValues.children[
                              l
                            ].dataValues.designation =
                              await employeedesignation(
                                firstlevel[i].dataValues.children[j].dataValues
                                  .children[k].dataValues.children[m].dataValues
                                  .children[n].dataValues.children[l].dataValues
                                  .userMasterID
                              );
                            if (seventhlevel.length > 0) {
                              firstlevel[i].dataValues.children[
                                j
                              ].dataValues.children[k].dataValues.children[
                                m
                              ].dataValues.children[n].dataValues.children[
                                l
                              ].dataValues.children = seventhlevel;
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
        maintree.push(firstlevel[i]);
      }

      let get_one_data = await UserMaster.findOne({
        where: {
          userMasterID: req.params.id,
        },
      });

      let maindata = [
        {
          userMasterID: req.params.id,
          name: get_one_data.displayName,
          photo: get_one_data.photo,
          userNumber: get_one_data.userNumber,
          firstName: get_one_data.firstName,
          lastName: get_one_data.lastName,
          department: await employeedepartment(req.params.id),
          designation: await employeedesignation(req.params.id),
          children: maintree,
        },
      ];
      res.status(200).json({
        status: 200,
        message: 'Data Get SuccessFully.',
        data: maindata,
      });
    } else {
      let maintree = [];

      let get_one_data = await UserMaster.findOne({
        where: {
          userMasterID: req.params.id,
        },
      });

      maintree.push({
        userMasterID: req.params.id,
        name: get_one_data.displayName,
        photo: get_one_data.photo,
        userNumber: get_one_data.userNumber,
        department: await employeedepartment(req.params.id),
        designation: await employeedesignation(req.params.id),
      });
      res.status(200).json({
        status: 200,
        message: 'Data Get SuccessFully.',
        data: maintree,
      });
    }
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

exports.reportstowithoutchild = async (req, res, next) => {
  try {
    let firstlevel = await reportTo.findAll({
      where: {
        reportToID: req.params.id,
        status: 1,
      },

      attributes: ['userMasterID'],
      include: {
        model: UserMaster,
        required: true,
        //...accessibleUsers(req.userDetails),
        as: 'employee',
        attributes: [
          'displayName',
          'userNumber',
          'photo',
          'firstName',
          'lastName',
        ],
      },
    });
    let maintree = [];

    let get_one_data = await UserMaster.findOne({
      where: {
        userMasterID: req.params.id,
      },
    });

    maintree.push({
      userMasterID: Number(req.params.id),
      employee: {
        displayName: get_one_data.displayName,
        userNumber: get_one_data.userNumber,
        photo: get_one_data.photo,
        firstName: get_one_data.firstName,
        lastName: get_one_data.lastName,
      },
    });

    if (firstlevel.length > 0) {
      for (var i = 0; i < firstlevel.length; i++) {
        maintree.push(firstlevel[i]);
        let secondlevel = await reportTo.findAll({
          where: {
            reportToID: firstlevel[i].userMasterID,
            status: 1,
          },
          attributes: ['userMasterID'],
          include: {
            model: UserMaster,
            required: true,
            //...accessibleUsers(req.userDetails),
            as: 'employee',
            attributes: [
              'firstName',
              'lastName',
              'displayName',
              'userNumber',
              'photo',
            ],
            // attributes: ['displayName', 'userNumber', 'photo', 'firstName'],
          },
        });
        if (secondlevel.length > 0) {
          for (var j = 0; j < secondlevel.length; j++) {
            maintree.push(secondlevel[j]);
            let thirdlevel = await reportTo.findAll({
              where: {
                reportToID: secondlevel[j].userMasterID,
                status: 1,
              },
              attributes: ['userMasterID'],
              include: {
                model: UserMaster,
                required: true,
                // ...accessibleUsers(req.userDetails),
                as: 'employee',
                attributes: [
                  'firstName',
                  'lastName',
                  'displayName',
                  'userNumber',
                  'photo',
                ],
                // attributes: ['displayName', 'userNumber', 'photo', 'firstName'],
              },
            });
            if (thirdlevel.length > 0) {
              for (var k = 0; k < thirdlevel.length; k++) {
                maintree.push(thirdlevel[k]);
                let fourthlevel = await reportTo.findAll({
                  where: {
                    reportToID: thirdlevel[k].userMasterID,
                    status: 1,
                  },
                  attributes: ['userMasterID'],
                  include: {
                    model: UserMaster,
                    required: true,
                    //...accessibleUsers(req.userDetails),
                    as: 'employee',
                    attributes: [
                      'firstName',
                      'lastName',
                      'displayName',
                      'userNumber',
                      'photo',
                    ],
                    // attributes: [
                    //   'displayName',
                    //   'userNumber',
                    //   'photo',
                    //   'firstName',
                    // ],
                  },
                });
                if (fourthlevel.length > 0) {
                  for (var m = 0; m < fourthlevel.length; m++) {
                    maintree.push(fourthlevel[m]);
                    let fifthlevel = await reportTo.findAll({
                      where: {
                        reportToID: fourthlevel[m].userMasterID,
                        status: 1,
                      },
                      attributes: ['userMasterID'],
                      include: {
                        model: UserMaster,
                        required: true,
                        //...accessibleUsers(req.userDetails),
                        as: 'employee',
                        attributes: [
                          'firstName',
                          'lastName',
                          'displayName',
                          'userNumber',
                          'photo',
                        ],
                        // attributes: [
                        //   'displayName',
                        //   'userNumber',
                        //   'photo',
                        //   'firstName',
                        // ],
                      },
                    });

                    if (fifthlevel.length > 0) {
                      for (var n = 0; n < fifthlevel.length; n++) {
                        maintree.push(fifthlevel[n]);
                        let sixthlevel = await reportTo.findAll({
                          where: {
                            reportToID: fifthlevel[n].userMasterID,
                            status: 1,
                          },
                          attributes: ['userMasterID'],
                          include: {
                            model: UserMaster,
                            required: true,
                            // ...accessibleUsers(req.userDetails),
                            as: 'employee',
                            attributes: [
                              'firstName',
                              'lastName',
                              'displayName',
                              'userNumber',
                              'photo',
                            ],
                            // attributes: [
                            //   'displayName',
                            //   'userNumber',
                            //   'photo',
                            //   'firstName',
                            // ],
                          },
                        });
                        if (sixthlevel.length > 0) {
                          for (var l = 0; l < sixthlevel.length; l++) {
                            maintree.push(sixthlevel[l]);
                            let seventhlevel = await reportTo.findAll({
                              where: {
                                reportToID: sixthlevel[l].userMasterID,
                                status: 1,
                              },
                              attributes: [
                                'userMasterID',
                                'employee.displayName',
                              ],
                              include: {
                                model: UserMaster,
                                required: true,
                                //...accessibleUsers(req.userDetails),
                                as: 'employee',
                                attributes: [
                                  'firstName',
                                  'lastName',
                                  'displayName',
                                  'userNumber',
                                  'photo',
                                ],
                                // attributes: [
                                //   'displayName',
                                //   'userNumber',
                                //   'photo',
                                //   'firstName',
                                // ],
                              },
                            });
                            if (seventhlevel.length > 0) {
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }

      let temptree = [];
      let tempmaintree = [];
      for (var i = 0; i < maintree.length; i++) {
        if (!temptree.includes(maintree[i].userMasterID)) {
          temptree.push(maintree[i].userMasterID);
          tempmaintree.push(maintree[i]);
        }
      }
      maintree = tempmaintree;

      for (var i = 0; i < maintree.length; i++) {
        if (maintree[i].dataValues) {
          maintree[i].dataValues.department = await employeedepartment(
            maintree[i].userMasterID
          );
          maintree[i].dataValues.designation = await employeedesignation(
            maintree[i].userMasterID
          );

          var today = new Date().toISOString().slice(0, 10);

          maintree[i].dataValues.attendancedate = today;
          maintree[i].dataValues.attendanceData = await employeeattendance(
            maintree[i].dataValues.userMasterID,
            today
          );
          if (!maintree[i].dataValues.attendanceData) {
            maintree[i].dataValues.attendanceData = '';
          }
        } else {
          maintree[i].department = await employeedepartment(
            maintree[i].userMasterID
          );
          maintree[i].designation = await employeedesignation(
            maintree[i].userMasterID
          );

          var today = new Date().toISOString().slice(0, 10);

          maintree[i].attendancedate = today;
          maintree[i].attendanceData = await employeeattendance(
            maintree[i].userMasterID,
            today
          );
          if (!maintree[i].attendanceData) {
            maintree[i].attendanceData = {};
          }
        }
      }

      res.status(200).json({
        status: 200,
        message: 'Data Get SuccessFully.',
        data: maintree,
        len: maintree.length,
      });
    } else {
      let temptree = [];
      let tempmaintree = [];
      for (var i = 0; i < maintree.length; i++) {
        if (!temptree.includes(maintree[i].userMasterID)) {
          temptree.push(maintree[i].userMasterID);
          tempmaintree.push(maintree[i]);
        }
      }
      maintree = tempmaintree;

      for (var i = 0; i < maintree.length; i++) {
        if (maintree[i].dataValues) {
          maintree[i].dataValues.department = await employeedepartment(
            maintree[i].userMasterID
          );
          maintree[i].dataValues.designation = await employeedesignation(
            maintree[i].userMasterID
          );

          var today = new Date().toISOString().slice(0, 10);

          maintree[i].dataValues.attendancedate = today;
          maintree[i].dataValues.attendanceData = await employeeattendance(
            maintree[i].dataValues.userMasterID,
            today
          );
          if (!maintree[i].dataValues.attendanceData) {
            maintree[i].dataValues.attendanceData = '';
          }
        } else {
          maintree[i].department = await employeedepartment(
            maintree[i].userMasterID
          );
          maintree[i].designation = await employeedesignation(
            maintree[i].userMasterID
          );

          var today = new Date().toISOString().slice(0, 10);

          maintree[i].attendancedate = today;
          maintree[i].attendanceData = await employeeattendance(
            maintree[i].userMasterID,
            today
          );
          if (!maintree[i].attendanceData) {
            maintree[i].attendanceData = {};
          }
        }
      }
      res.status(200).json({
        status: 200,
        message: 'Data Get SuccessFully.',
        data: maintree,
      });
    }
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

exports.reportstowithoutchildvisit = async (req, res, next) => {
  try {
    function padTo2Digits(num) {
      return num.toString().padStart(2, '0');
    }
    function formatDate1(date) {
      return [
        padTo2Digits(date.getDate()),
        padTo2Digits(date.getMonth() + 1),
        date.getFullYear(),
      ].join('-');
    }
    function formatDate2(date) {
      var date1 = formatDate1(date);
      var date2 = new Date(date).toISOString().replace('T', ' ').slice(0, -5);
      var date3 = new Date(date2).toLocaleTimeString();
      var date4 = `${date1 + '  ' + date3}`;
      return date4;
    }

    let firstlevel = await reportTo.findAll({
      where: {
        reportToID: req.params.id,
        status: 1,
      },

      attributes: ['userMasterID'],
      include: {
        model: UserMaster,
        required: true,
        ...accessibleUsers(req.userDetails),
        as: 'employee',
        attributes: ['displayName', 'userNumber', 'photo'],
      },
    });
    let maintree = [];

    let get_one_data = await UserMaster.findOne({
      where: {
        userMasterID: req.params.id,
      },
    });

    maintree.push({
      userMasterID: req.params.id,
      employee: {
        displayName: get_one_data.displayName,
        userNumber: get_one_data.userNumber,
        photo: get_one_data.photo,
      },
    });

    if (firstlevel.length > 0) {
      for (var i = 0; i < firstlevel.length; i++) {
        maintree.push(firstlevel[i]);
        let secondlevel = await reportTo.findAll({
          where: {
            reportToID: firstlevel[i].userMasterID,
            status: 1,
          },
          attributes: ['userMasterID'],
          include: {
            model: UserMaster,
            required: true,
            ...accessibleUsers(req.userDetails),
            as: 'employee',
            attributes: ['displayName', 'userNumber', 'photo', 'firstName'],
          },
        });
        if (secondlevel.length > 0) {
          for (var j = 0; j < secondlevel.length; j++) {
            maintree.push(secondlevel[j]);
            let thirdlevel = await reportTo.findAll({
              where: {
                reportToID: secondlevel[j].userMasterID,
                status: 1,
              },
              attributes: ['userMasterID'],
              include: {
                model: UserMaster,
                required: true,
                ...accessibleUsers(req.userDetails),
                as: 'employee',
                attributes: ['displayName', 'userNumber', 'photo', 'firstName'],
              },
            });
            if (thirdlevel.length > 0) {
              for (var k = 0; k < thirdlevel.length; k++) {
                maintree.push(thirdlevel[k]);
                let fourthlevel = await reportTo.findAll({
                  where: {
                    reportToID: thirdlevel[k].userMasterID,
                    status: 1,
                  },
                  attributes: ['userMasterID'],
                  include: {
                    model: UserMaster,
                    required: true,
                    ...accessibleUsers(req.userDetails),
                    as: 'employee',
                    attributes: [
                      'displayName',
                      'userNumber',
                      'photo',
                      'firstName',
                    ],
                  },
                });
                if (fourthlevel.length > 0) {
                  for (var m = 0; m < fourthlevel.length; m++) {
                    maintree.push(fourthlevel[m]);
                    let fifthlevel = await reportTo.findAll({
                      where: {
                        reportToID: fourthlevel[m].userMasterID,
                        status: 1,
                      },
                      attributes: ['userMasterID'],
                      include: {
                        model: UserMaster,
                        as: 'employee',
                        required: true,
                        ...accessibleUsers(req.userDetails),
                        attributes: [
                          'displayName',
                          'userNumber',
                          'photo',
                          'firstName',
                        ],
                      },
                    });

                    if (fifthlevel.length > 0) {
                      for (var n = 0; n < fifthlevel.length; n++) {
                        maintree.push(fifthlevel[n]);
                        let sixthlevel = await reportTo.findAll({
                          where: {
                            reportToID: fifthlevel[n].userMasterID,
                            status: 1,
                          },
                          attributes: ['userMasterID'],
                          include: {
                            model: UserMaster,
                            as: 'employee',
                            required: true,
                            ...accessibleUsers(req.userDetails),
                            attributes: [
                              'displayName',
                              'userNumber',
                              'photo',
                              'firstName',
                            ],
                          },
                        });
                        if (sixthlevel.length > 0) {
                          for (var l = 0; l < sixthlevel.length; l++) {
                            maintree.push(sixthlevel[l]);
                            let seventhlevel = await reportTo.findAll({
                              where: {
                                reportToID: sixthlevel[l].userMasterID,
                                status: 1,
                              },
                              attributes: [
                                'userMasterID',
                                'employee.displayName',
                              ],
                              include: {
                                model: UserMaster,
                                as: 'employee',
                                required: true,
                                ...accessibleUsers(req.userDetails),
                                attributes: [
                                  'displayName',
                                  'userNumber',
                                  'photo',
                                  'firstName',
                                ],
                              },
                            });
                            if (seventhlevel.length > 0) {
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }

      let data1 = [];
      for (var i = 0; i < maintree.length; i++) {
        data1.push(maintree[i].userMasterID);
      }
      var today = new Date(new Date().setHours(new Date().getHours() + 5));
      today = new Date(today.setMinutes(new Date().getMinutes() + 30));
      var year = today.getFullYear();
      var mes = today.getMonth() + 1;
      var dia = today.getDate();
      today = year + '-' + mes + '-' + dia;
      let visit = await Visit.findAll({
        where: {
          [Sequelize.Op.and]: [
            Sequelize.where(
              sequelize.fn('date', sequelize.col('visitDate')),
              '=',
              today
            ),
            {
              assignID: {
                [Sequelize.Op.in]: data1,
              },
            },
            { status: 1 },
          ],
        },
        include: [{ all: true }],
      });

      for (var p = 0; p < visit.length; p++) {
        if (
          visit[p].dataValues.checkInDateTime == '' ||
          visit[p].dataValues.checkInDateTime == null ||
          visit[p].dataValues.checkInDateTime == 'NULL'
        ) {
          visit[p].dataValues.checkInDateTime = '';
        } else {
          visit[p].dataValues.checkInDateTime = formatDate2(
            visit[p].dataValues.checkInDateTime
          );
        }

        if (
          visit[p].dataValues.checkOutDateTime == '' ||
          visit[p].dataValues.checkOutDateTime == null ||
          visit[p].dataValues.checkOutDateTime == 'NULL'
        ) {
          visit[p].dataValues.checkOutDateTime = '';
        } else {
          visit[p].dataValues.checkOutDateTime = formatDate2(
            visit[p].dataValues.checkOutDateTime
          );
        }
      }

      res.status(200).json({
        status: 200,
        message: 'Data Get SuccessFully.',
        data: visit,
        len: visit.length,
      });
    } else {
      let data1 = [];
      for (var i = 0; i < maintree.length; i++) {
        data1.push(maintree[i].userMasterID);
      }
      var today = new Date(new Date().setHours(new Date().getHours() + 5));
      today = new Date(today.setMinutes(new Date().getMinutes() + 30));
      var year = today.getFullYear();
      var mes = today.getMonth() + 1;
      var dia = today.getDate();
      today = year + '-' + mes + '-' + dia;
      let visit = await Visit.findAll({
        where: {
          [Sequelize.Op.and]: [
            Sequelize.where(
              sequelize.fn('date', sequelize.col('visitDate')),
              '=',
              today
            ),
            {
              assignID: {
                [Sequelize.Op.in]: data1,
              },
            },
            { status: 1 },
          ],
        },
        include: [{ all: true }],
      });

      for (var q = 0; q < visit.length; q++) {
        if (
          visit[q].dataValues.checkInDateTime == '' ||
          visit[q].dataValues.checkInDateTime == null ||
          visit[q].dataValues.checkInDateTime == 'NULL'
        ) {
          visit[q].dataValues.checkInDateTime = '';
        } else {
          visit[q].dataValues.checkInDateTime = formatDate2(
            visit[q].dataValues.checkInDateTime
          );
        }

        if (
          visit[q].dataValues.checkOutDateTime == '' ||
          visit[q].dataValues.checkOutDateTime == null ||
          visit[q].dataValues.checkOutDateTime == 'NULL'
        ) {
          visit[q].dataValues.checkOutDateTime = '';
        } else {
          visit[q].dataValues.checkOutDateTime = formatDate2(
            visit[q].dataValues.checkOutDateTime
          );
        }
      }

      res.status(200).json({
        status: 200,
        message: 'Data Get SuccessFully.',
        data: visit,
        len: visit.length,
      });
    }
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

exports.reportstoattendancelog = async (req, res, next) => {
  try {
    let firstlevel = await reportTo.findAll({
      where: {
        reportToID: req.params.id,
        status: 1,
      },

      attributes: ['userMasterID'],
      include: {
        model: UserMaster,
        as: 'employee',
        required: true,
        ...accessibleUsers(req.userDetails),
        attributes: ['displayName', 'userNumber', 'photo'],
      },
    });
    let maintree = [];

    let get_one_data = await UserMaster.findOne({
      where: {
        userMasterID: req.params.id,
      },
    });

    maintree.push({
      userMasterID: req.params.id,
      employee: {
        displayName: get_one_data.displayName,
        userNumber: get_one_data.userNumber,
        photo: get_one_data.photo,
      },
    });
    if (firstlevel.length > 0) {
      for (var i = 0; i < firstlevel.length; i++) {
        maintree.push(firstlevel[i]);
        let secondlevel = await reportTo.findAll({
          where: {
            reportToID: firstlevel[i].userMasterID,
            status: 1,
          },
          attributes: ['userMasterID'],
          include: {
            model: UserMaster,
            as: 'employee',
            required: true,
            ...accessibleUsers(req.userDetails),
            attributes: ['displayName', 'userNumber', 'photo', 'firstName'],
          },
        });
        if (secondlevel.length > 0) {
          for (var j = 0; j < secondlevel.length; j++) {
            maintree.push(secondlevel[j]);
            let thirdlevel = await reportTo.findAll({
              where: {
                reportToID: secondlevel[j].userMasterID,
                status: 1,
              },
              attributes: ['userMasterID'],
              include: {
                model: UserMaster,
                as: 'employee',
                required: true,
                ...accessibleUsers(req.userDetails),
                attributes: ['displayName', 'userNumber', 'photo', 'firstName'],
              },
            });
            if (thirdlevel.length > 0) {
              for (var k = 0; k < thirdlevel.length; k++) {
                maintree.push(thirdlevel[k]);
                let fourthlevel = await reportTo.findAll({
                  where: {
                    reportToID: thirdlevel[k].userMasterID,
                    status: 1,
                  },
                  attributes: ['userMasterID'],
                  include: {
                    model: UserMaster,
                    as: 'employee',
                    required: true,
                    ...accessibleUsers(req.userDetails),
                    attributes: [
                      'displayName',
                      'userNumber',
                      'photo',
                      'firstName',
                    ],
                  },
                });
                if (fourthlevel.length > 0) {
                  for (var m = 0; m < fourthlevel.length; m++) {
                    maintree.push(fourthlevel[m]);
                    let fifthlevel = await reportTo.findAll({
                      where: {
                        reportToID: fourthlevel[m].userMasterID,
                        status: 1,
                      },
                      attributes: ['userMasterID'],
                      include: {
                        model: UserMaster,
                        as: 'employee',
                        required: true,
                        ...accessibleUsers(req.userDetails),
                        attributes: [
                          'displayName',
                          'userNumber',
                          'photo',
                          'firstName',
                        ],
                      },
                    });

                    if (fifthlevel.length > 0) {
                      for (var n = 0; n < fifthlevel.length; n++) {
                        maintree.push(fifthlevel[n]);
                        let sixthlevel = await reportTo.findAll({
                          where: {
                            reportToID: fifthlevel[n].userMasterID,
                            status: 1,
                          },
                          attributes: ['userMasterID'],
                          include: {
                            model: UserMaster,
                            as: 'employee',
                            required: true,
                            ...accessibleUsers(req.userDetails),
                            attributes: [
                              'displayName',
                              'userNumber',
                              'photo',
                              'firstName',
                            ],
                          },
                        });
                        if (sixthlevel.length > 0) {
                          for (var l = 0; l < sixthlevel.length; l++) {
                            maintree.push(sixthlevel[l]);
                            let seventhlevel = await reportTo.findAll({
                              where: {
                                reportToID: sixthlevel[l].userMasterID,
                                status: 1,
                              },
                              attributes: [
                                'userMasterID',
                                'employee.displayName',
                              ],
                              include: {
                                model: UserMaster,
                                as: 'employee',
                                required: true,
                                ...accessibleUsers(req.userDetails),
                                attributes: [
                                  'displayName',
                                  'userNumber',
                                  'photo',
                                  'firstName',
                                ],
                              },
                            });
                            if (seventhlevel.length > 0) {
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }

      let data1 = [];
      for (var i = 0; i < maintree.length; i++) {
        data1.push(maintree[i].userMasterID);
      }

      var today = new Date().toISOString().slice(0, 10);

      let attendancelog = await AttendanceLogs.findAll({
        where: {
          [Sequelize.Op.and]: [
            Sequelize.where(
              sequelize.fn('date', sequelize.col('logDateTime')),
              '=',
              today
            ),
            {
              userMasterID: {
                [Sequelize.Op.in]: data1,
              },
            },
            { status: 1 },
          ],
        },
        order: [['logDateTime', 'DESC']],
        include: [{ all: true }],
      });

      res.status(200).json({
        status: 200,
        message: 'Data Get SuccessFully.',
        data: attendancelog,
        len: attendancelog.length,
      });
    } else {
      res.status(200).json({
        status: 200,
        message: 'Data Get SuccessFully.',
        data: [],
      });
    }
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

exports.reportstoforstructure = async (req, res, next) => {
  try {
    let firstlevel = await reportTo.findAll({
      where: {
        reportToID: req.params.id,
        status: 1,
      },

      attributes: ['userMasterID'],
      include: {
        model: UserMaster,
        required: true,
        as: 'employee',
        attributes: ['displayName', 'userNumber', 'photo'],
      },
    });
    let maintree = [];

    if (firstlevel.length > 0) {
      for (var i = 0; i < firstlevel.length; i++) {
        let secondlevel = await reportTo.findAll({
          where: {
            reportToID: firstlevel[i].userMasterID,
            status: 1,
          },
          attributes: ['userMasterID'],
        });
        let userdata5 = await UserMaster.findOne({
          where: {
            userMasterID: firstlevel[i].userMasterID,
            status: [0, 1],
          },
        });
        firstlevel[i].dataValues.name = userdata5.displayName;
        firstlevel[i].dataValues.photo = userdata5.photo;
        firstlevel[i].dataValues.userNumber = userdata5.userNumber;
        firstlevel[i].dataValues.department = await employeedepartment(
          firstlevel[i].userMasterID
        );
        firstlevel[i].dataValues.title = await employeedesignation(
          firstlevel[i].userMasterID
        );
        if (secondlevel.length > 0) {
          firstlevel[i].dataValues.children = secondlevel;
          for (var j = 0; j < firstlevel[i].dataValues.children.length; j++) {
            let thirdlevel = await reportTo.findAll({
              where: {
                reportToID: firstlevel[i].dataValues.children[j].userMasterID,
                status: 1,
              },
              attributes: ['userMasterID'],
            });

            let userdata6 = await UserMaster.findOne({
              where: {
                userMasterID: firstlevel[i].dataValues.children[j].userMasterID,
                status: [0, 1],
              },
            });

            firstlevel[i].dataValues.children[j].dataValues.name =
              userdata6.displayName;
            firstlevel[i].dataValues.children[j].dataValues.photo =
              userdata6.photo;
            firstlevel[i].dataValues.children[j].dataValues.userNumber =
              userdata6.userNumber;
            firstlevel[i].dataValues.children[j].dataValues.department =
              await employeedepartment(
                firstlevel[i].dataValues.children[j].userMasterID
              );

            firstlevel[i].dataValues.children[j].dataValues.title =
              await employeedesignation(
                firstlevel[i].dataValues.children[j].userMasterID
              );
            if (thirdlevel.length > 0) {
              firstlevel[i].dataValues.children[j].dataValues.children =
                thirdlevel;

              for (
                var k = 0;
                k <
                firstlevel[i].dataValues.children[j].dataValues.children.length;
                k++
              ) {
                let fourthlevel = await reportTo.findAll({
                  where: {
                    reportToID:
                      firstlevel[i].dataValues.children[j].dataValues.children[
                        k
                      ].userMasterID,
                    status: 1,
                  },
                  attributes: ['userMasterID'],
                });

                let userdata1 = await UserMaster.findOne({
                  where: {
                    userMasterID:
                      firstlevel[i].dataValues.children[j].dataValues.children[
                        k
                      ].userMasterID,
                    status: [0, 1],
                  },
                });

                firstlevel[i].dataValues.children[j].dataValues.children[
                  k
                ].dataValues.name = userdata1.displayName;
                firstlevel[i].dataValues.children[j].dataValues.children[
                  k
                ].dataValues.photo = userdata1.photo;
                firstlevel[i].dataValues.children[j].dataValues.children[
                  k
                ].dataValues.userNumber = userdata1.userNumber;

                firstlevel[i].dataValues.children[j].dataValues.children[
                  k
                ].dataValues.department = await employeedepartment(
                  firstlevel[i].dataValues.children[j].dataValues.children[k]
                    .userMasterID
                );

                firstlevel[i].dataValues.children[j].dataValues.children[
                  k
                ].dataValues.title = await employeedesignation(
                  firstlevel[i].dataValues.children[j].dataValues.children[k]
                    .userMasterID
                );

                if (fourthlevel.length > 0) {
                  firstlevel[i].dataValues.children[j].dataValues.children[
                    k
                  ].dataValues.children = fourthlevel;

                  for (
                    var m = 0;
                    m <
                    firstlevel[i].dataValues.children[j].dataValues.children[k]
                      .dataValues.children.length;
                    m++
                  ) {
                    let fifthlevel = await reportTo.findAll({
                      where: {
                        reportToID:
                          firstlevel[i].dataValues.children[j].dataValues
                            .children[k].dataValues.children[m].dataValues
                            .userMasterID,
                        status: 1,
                      },
                      attributes: ['userMasterID'],
                    });

                    let userdata2 = await UserMaster.findOne({
                      where: {
                        userMasterID:
                          firstlevel[i].dataValues.children[j].dataValues
                            .children[k].dataValues.children[m].dataValues
                            .userMasterID,
                        status: [0, 1],
                      },
                    });

                    firstlevel[i].dataValues.children[j].dataValues.children[
                      k
                    ].dataValues.children[m].dataValues.name =
                      userdata2.displayName;
                    firstlevel[i].dataValues.children[j].dataValues.children[
                      k
                    ].dataValues.children[m].dataValues.photo = userdata2.photo;
                    firstlevel[i].dataValues.children[j].dataValues.children[
                      k
                    ].dataValues.children[m].dataValues.userNumber =
                      userdata2.userNumber;

                    firstlevel[i].dataValues.children[j].dataValues.children[
                      k
                    ].dataValues.children[m].dataValues.department =
                      await employeedepartment(
                        firstlevel[i].dataValues.children[j].dataValues
                          .children[k].dataValues.children[m].dataValues
                          .userMasterID
                      );

                    firstlevel[i].dataValues.children[j].dataValues.children[
                      k
                    ].dataValues.children[m].dataValues.title =
                      await employeedesignation(
                        firstlevel[i].dataValues.children[j].dataValues
                          .children[k].dataValues.children[m].dataValues
                          .userMasterID
                      );

                    if (fifthlevel.length > 0) {
                      firstlevel[i].dataValues.children[j].dataValues.children[
                        k
                      ].dataValues.children[m].dataValues.children = fifthlevel;

                      for (
                        var n = 0;
                        n <
                        firstlevel[i].dataValues.children[j].dataValues
                          .children[k].dataValues.children[m].dataValues
                          .children.length;
                        n++
                      ) {
                        let sixthlevel = await reportTo.findAll({
                          where: {
                            reportToID:
                              firstlevel[i].dataValues.children[j].dataValues
                                .children[k].dataValues.children[m].dataValues
                                .children[n].dataValues.userMasterID,
                            status: 1,
                          },
                          attributes: ['userMasterID'],
                        });

                        let userdata3 = await UserMaster.findOne({
                          where: {
                            userMasterID:
                              firstlevel[i].dataValues.children[j].dataValues
                                .children[k].dataValues.children[m].dataValues
                                .children[n].dataValues.userMasterID,
                            status: [0, 1],
                          },
                        });

                        firstlevel[i].dataValues.children[
                          j
                        ].dataValues.children[k].dataValues.children[
                          m
                        ].dataValues.children[n].dataValues.name =
                          userdata3.displayName;
                        firstlevel[i].dataValues.children[
                          j
                        ].dataValues.children[k].dataValues.children[
                          m
                        ].dataValues.children[n].dataValues.photo =
                          userdata3.photo;
                        firstlevel[i].dataValues.children[
                          j
                        ].dataValues.children[k].dataValues.children[
                          m
                        ].dataValues.children[n].dataValues.userNumber =
                          userdata3.userNumber;
                        firstlevel[i].dataValues.children[
                          j
                        ].dataValues.children[k].dataValues.children[
                          m
                        ].dataValues.children[n].dataValues.department =
                          await employeedepartment(
                            firstlevel[i].dataValues.children[j].dataValues
                              .children[k].dataValues.children[m].dataValues
                              .children[n].dataValues.userMasterID
                          );

                        firstlevel[i].dataValues.children[
                          j
                        ].dataValues.children[k].dataValues.children[
                          m
                        ].dataValues.children[n].dataValues.title =
                          await employeedesignation(
                            firstlevel[i].dataValues.children[j].dataValues
                              .children[k].dataValues.children[m].dataValues
                              .children[n].dataValues.userMasterID
                          );

                        if (sixthlevel.length > 0) {
                          firstlevel[i].dataValues.children[
                            j
                          ].dataValues.children[k].dataValues.children[
                            m
                          ].dataValues.children[n].dataValues.children =
                            sixthlevel;

                          for (
                            var l = 0;
                            l <
                            firstlevel[i].dataValues.children[j].dataValues
                              .children[k].dataValues.children[m].dataValues
                              .children[n].dataValues.children.length;
                            l++
                          ) {
                            let seventhlevel = await reportTo.findAll({
                              where: {
                                reportToID:
                                  firstlevel[i].dataValues.children[j]
                                    .dataValues.children[k].dataValues.children[
                                    m
                                  ].dataValues.children[n].dataValues.children[
                                    l
                                  ].dataValues.userMasterID,
                                status: 1,
                              },
                              attributes: ['userMasterID'],
                            });

                            let userdata4 = await UserMaster.findOne({
                              where: {
                                userMasterID:
                                  firstlevel[i].dataValues.children[j]
                                    .dataValues.children[k].dataValues.children[
                                    m
                                  ].dataValues.children[n].dataValues.children[
                                    l
                                  ].dataValues.userMasterID,
                                status: [0, 1],
                              },
                            });
                            firstlevel[i].dataValues.children[
                              j
                            ].dataValues.children[k].dataValues.children[
                              m
                            ].dataValues.children[n].dataValues.children[
                              l
                            ].dataValues.name = userdata4.displayName;
                            firstlevel[i].dataValues.children[
                              j
                            ].dataValues.children[k].dataValues.children[
                              m
                            ].dataValues.children[n].dataValues.children[
                              l
                            ].dataValues.photo = userdata4.photo;
                            firstlevel[i].dataValues.children[
                              j
                            ].dataValues.children[k].dataValues.children[
                              m
                            ].dataValues.children[n].dataValues.children[
                              l
                            ].dataValues.userNumber = userdata4.userNumber;

                            firstlevel[i].dataValues.children[
                              j
                            ].dataValues.children[k].dataValues.children[
                              m
                            ].dataValues.children[n].dataValues.children[
                              l
                            ].dataValues.department = await employeedepartment(
                              firstlevel[i].dataValues.children[j].dataValues
                                .children[k].dataValues.children[m].dataValues
                                .children[n].dataValues.children[l].dataValues
                                .userMasterID
                            );

                            firstlevel[i].dataValues.children[
                              j
                            ].dataValues.children[k].dataValues.children[
                              m
                            ].dataValues.children[n].dataValues.children[
                              l
                            ].dataValues.title = await employeedesignation(
                              firstlevel[i].dataValues.children[j].dataValues
                                .children[k].dataValues.children[m].dataValues
                                .children[n].dataValues.children[l].dataValues
                                .userMasterID
                            );
                            if (seventhlevel.length > 0) {
                              firstlevel[i].dataValues.children[
                                j
                              ].dataValues.children[k].dataValues.children[
                                m
                              ].dataValues.children[n].dataValues.children[
                                l
                              ].dataValues.children = seventhlevel;
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
        maintree.push(firstlevel[i]);
      }

      let get_one_data = await UserMaster.findOne({
        where: {
          userMasterID: req.params.id,
        },
      });

      let maindata = [
        {
          userMasterID: req.params.id,
          name: get_one_data.displayName,
          photo: get_one_data.photo,
          userNumber: get_one_data.userNumber,
          department: await employeedepartment(req.params.id),
          title: await employeedesignation(req.params.id),
          children: maintree,
        },
      ];
      res.status(200).json({
        status: 200,
        message: 'Data Get SuccessFully.',
        data: maindata,
      });
    } else {
      let maintree = [];

      let get_one_data = await UserMaster.findOne({
        where: {
          userMasterID: req.params.id,
        },
      });

      maintree.push({
        userMasterID: req.params.id,
        name: get_one_data.displayName,
        photo: get_one_data.photo,
        userNumber: get_one_data.userNumber,
        department: await employeedepartment(req.params.id),
        title: await employeedesignation(req.params.id),
      });
      res.status(200).json({
        status: 200,
        message: 'Data Get SuccessFully.',
        data: maintree,
      });
    }
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

exports.reportstowithoutchilddatewise = async (req, res, next) => {
  try {
    let { userMasterID, AttendanceDate } = await req.body;

    if (AttendanceDate.length == 0) {
      return res.status(200).send({
        status: 401,
        message: 'please Enter a Valid Date!',
      });
    }

    let firstlevel = await reportTo.findAll({
      where: {
        reportToID: userMasterID,
        status: 1,
      },

      attributes: ['userMasterID'],
      include: {
        model: UserMaster,
        as: 'employee',
        required: true,
        //...accessibleUsers(req.userDetails),
        attributes: [
          'displayName',
          'userNumber',
          'photo',
          'firstName',
          'lastName',
        ],
        include: [
          {
            model: EmployeeJoiningDetails,
            attributes: ['employeeCode'],
          },
        ],
      },
    });

    let maintree = [];

    let get_one_data = await UserMaster.findOne({
      where: {
        userMasterID: userMasterID,
      },
      include: [
        {
          model: EmployeeJoiningDetails,
          attributes: ['employeeCode'],
        },
      ],
    });

    maintree.push({
      userMasterID: Number(userMasterID),
      employee: {
        displayName: get_one_data.displayName,
        userNumber: get_one_data.userNumber,
        photo: get_one_data.photo,
        firstName: get_one_data.firstName,
        lastName: get_one_data.lastName,
        employeeJoiningDetails: [
          {
            employeeCode: get_one_data.employeeJoiningDetails
              ? get_one_data.employeeJoiningDetails[0].employeeCode
              : null,
          },
        ],
      },
    });

    if (firstlevel.length > 0) {
      for (var i = 0; i < firstlevel.length; i++) {
        maintree.push(firstlevel[i]);
        let secondlevel = await reportTo.findAll({
          where: {
            reportToID: firstlevel[i].userMasterID,
            status: 1,
          },
          attributes: ['userMasterID'],
          include: {
            model: UserMaster,
            as: 'employee',
            required: true,
            //...accessibleUsers(req.userDetails),
            attributes: [
              'displayName',
              'userNumber',
              'photo',
              'firstName',
              'lastName',
            ],
            include: [
              {
                model: EmployeeJoiningDetails,
                attributes: ['employeeCode'],
              },
            ],
          },
        });

        if (secondlevel.length > 0) {
          for (var j = 0; j < secondlevel.length; j++) {
            maintree.push(secondlevel[j]);
            let thirdlevel = await reportTo.findAll({
              where: {
                reportToID: secondlevel[j].userMasterID,
                status: 1,
              },
              attributes: ['userMasterID'],
              include: {
                model: UserMaster,
                as: 'employee',
                required: true,
                //...accessibleUsers(req.userDetails),
                attributes: [
                  'displayName',
                  'userNumber',
                  'photo',
                  'firstName',
                  'lastName',
                ],
                include: [
                  {
                    model: EmployeeJoiningDetails,
                    attributes: ['employeeCode'],
                  },
                ],
              },
            });

            if (thirdlevel.length > 0) {
              for (var k = 0; k < thirdlevel.length; k++) {
                maintree.push(thirdlevel[k]);
                let fourthlevel = await reportTo.findAll({
                  where: {
                    reportToID: thirdlevel[k].userMasterID,
                    status: 1,
                  },
                  attributes: ['userMasterID'],
                  include: {
                    model: UserMaster,
                    as: 'employee',
                    required: true,
                    //...accessibleUsers(req.userDetails),
                    attributes: [
                      'displayName',
                      'userNumber',
                      'photo',
                      'firstName',
                      'lastName',
                    ],
                    include: [
                      {
                        model: EmployeeJoiningDetails,
                        attributes: ['employeeCode'],
                      },
                    ],
                  },
                });
                if (fourthlevel.length > 0) {
                  for (var m = 0; m < fourthlevel.length; m++) {
                    maintree.push(fourthlevel[m]);
                    let fifthlevel = await reportTo.findAll({
                      where: {
                        reportToID: fourthlevel[m].userMasterID,
                        status: 1,
                      },
                      attributes: ['userMasterID'],
                      include: {
                        model: UserMaster,
                        as: 'employee',
                        required: true,
                        //...accessibleUsers(req.userDetails),
                        attributes: [
                          'displayName',
                          'userNumber',
                          'photo',
                          'firstName',
                          'lastName',
                        ],
                        include: [
                          {
                            model: EmployeeJoiningDetails,
                            attributes: ['employeeCode'],
                          },
                        ],
                      },
                    });

                    if (fifthlevel.length > 0) {
                      for (var n = 0; n < fifthlevel.length; n++) {
                        maintree.push(fifthlevel[n]);
                        let sixthlevel = await reportTo.findAll({
                          where: {
                            reportToID: fifthlevel[n].userMasterID,
                            status: 1,
                          },
                          attributes: ['userMasterID'],
                          include: {
                            model: UserMaster,
                            as: 'employee',
                            required: true,
                            // ...accessibleUsers(req.userDetails),
                            attributes: [
                              'displayName',
                              'userNumber',
                              'photo',
                              'firstName',
                              'lastName',
                            ],
                            include: [
                              {
                                model: EmployeeJoiningDetails,
                                attributes: ['employeeCode'],
                              },
                            ],
                          },
                        });
                        if (sixthlevel.length > 0) {
                          for (var l = 0; l < sixthlevel.length; l++) {
                            maintree.push(sixthlevel[l]);
                            let seventhlevel = await reportTo.findAll({
                              where: {
                                reportToID: sixthlevel[l].userMasterID,
                                status: 1,
                              },
                              attributes: [
                                'userMasterID',
                                'employee.displayName',
                              ],
                              include: {
                                model: UserMaster,
                                as: 'employee',
                                required: true,
                                // ...accessibleUsers(req.userDetails),
                                attributes: [
                                  'displayName',
                                  'userNumber',
                                  'photo',
                                  'firstName',
                                  'lastName',
                                ],
                                include: [
                                  {
                                    model: EmployeeJoiningDetails,
                                    attributes: ['employeeCode'],
                                  },
                                ],
                              },
                            });
                            if (seventhlevel.length > 0) {
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }

      for (var i = 0; i < maintree.length; i++) {
        if (maintree[i].dataValues) {
          maintree[i].dataValues.department = await employeedepartment(
            maintree[i].userMasterID
          );
          maintree[i].dataValues.designation = await employeedesignation(
            maintree[i].userMasterID
          );

          maintree[i].dataValues.attendancedate = AttendanceDate;
          maintree[i].dataValues.attendanceData = await employeeattendance(
            maintree[i].dataValues.userMasterID,
            AttendanceDate
          );
          if (!maintree[i].dataValues.attendanceData) {
            maintree[i].dataValues.attendanceData = '';
          }
        } else {
          maintree[i].department = await employeedepartment(
            maintree[i].userMasterID
          );
          maintree[i].designation = await employeedesignation(
            maintree[i].userMasterID
          );

          maintree[i].attendancedate = AttendanceDate;
          maintree[i].attendanceData = await employeeattendance(
            maintree[i].userMasterID,
            AttendanceDate
          );
          if (!maintree[i].attendanceData) {
            maintree[i].attendanceData = {};
          }
        }
      }

      const uniqueUserMasterIDs = new Set();
      const filteredData = maintree.filter((item) => {
        if (!uniqueUserMasterIDs.has(item.userMasterID)) {
          uniqueUserMasterIDs.add(item.userMasterID);
          return true;
        }
        return false;
      });

      res.status(200).json({
        status: 200,
        message: 'Data Get SuccessFully.',
        data: filteredData,
        len: filteredData.length,
      });
    } else {
      for (var i = 0; i < maintree.length; i++) {
        if (maintree[i].dataValues) {
          maintree[i].dataValues.department = await employeedepartment(
            maintree[i].userMasterID
          );
          maintree[i].dataValues.designation = await employeedesignation(
            maintree[i].userMasterID
          );

          maintree[i].dataValues.attendancedate = AttendanceDate;
          maintree[i].dataValues.attendanceData = await employeeattendance(
            maintree[i].dataValues.userMasterID,
            AttendanceDate
          );
          if (!maintree[i].dataValues.attendanceData) {
            maintree[i].dataValues.attendanceData = '';
          }
        } else {
          maintree[i].department = await employeedepartment(
            maintree[i].userMasterID
          );
          maintree[i].designation = await employeedesignation(
            maintree[i].userMasterID
          );

          maintree[i].attendancedate = AttendanceDate;
          maintree[i].attendanceData = await employeeattendance(
            maintree[i].userMasterID,
            AttendanceDate
          );
          if (!maintree[i].attendanceData) {
            maintree[i].attendanceData = {};
          }
        }
      }
      const uniqueUserMasterIDs = new Set();
      const filteredData = maintree.filter((item) => {
        if (!uniqueUserMasterIDs.has(item.userMasterID)) {
          uniqueUserMasterIDs.add(item.userMasterID);
          return true;
        }
        return false;
      });

      res.status(200).json({
        status: 200,
        message: 'Data Get SuccessFully.',
        data: filteredData,
      });
    }
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

exports.reportstoImmediateChild = async (req, res, next) => {
  try {
    const { userMasterID, date, search, page, limit } = req.query;

    const datetime = date ? date : asiaKolkataDateTime(new Date()).slice(0, 10);
    // const datetime = date ? date : moment().format('YYYY-MM-DD');

    const condition = {};

    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }

    if (search) {
      condition[Sequelize.Op.or] = [
        { '$employee.displayName$': { [Sequelize.Op.iLike]: `%${search}%` } },
        {
          '$employee.employeeJoiningDetails.employeeCode$': {
            [Sequelize.Op.iLike]: `%${search}%`,
          },
        },
      ];
    }

    const finalData = {};
    const reportstoImmediateChild = await EmployeeReportTo.findAndCountAll({
      where: {
        reportToID: userMasterID,
        status: 1,
        ...condition,
      },
      attributes: ['reportToID', 'userMasterID'],
      include: [
        {
          model: UserMaster,
          required: true,
          as: 'employee',
          include: [
            {
              model: EmployeeJoiningDetails,
              attributes: ['employeeCode'],
              required: true,
            },
            {
              model: companyMaster,
              required: true,
              attributes: ['companyMasterID', 'companyName'],
            },
            {
              model: EmployeeDesignation,
              where: {
                status: 1,
                applicableDate: { [Sequelize.Op.lte]: new Date(datetime) },
                [Sequelize.Op.or]: [
                  { endDate: { [Sequelize.Op.gte]: new Date(datetime) } },
                  { endDate: { [Sequelize.Op.eq]: null } },
                ],
              },
              required: false,
              attributes: ['designationID', 'applicableDate'],
              include: [
                {
                  model: Designation,
                  as: 'designation',
                  attributes: ['designationName'],
                },
              ],
            },
            {
              model: EmployeeDepartment,
              where: {
                status: 1,
                applicableDate: { [Sequelize.Op.lte]: new Date(datetime) },
                [Sequelize.Op.or]: [
                  { endDate: { [Sequelize.Op.gte]: new Date(datetime) } },
                  { endDate: { [Sequelize.Op.eq]: null } },
                ],
              },
              required: false,
              attributes: ['departmentID', 'applicableDate'],
              include: [
                {
                  model: Department,
                  as: 'department',
                  attributes: ['departmentName'],
                },
              ],
            },
            {
              model: EmployeeBranch,
              where: {
                status: 1,
                applicableDate: { [Sequelize.Op.lte]: new Date(datetime) },
                [Sequelize.Op.or]: [
                  { endDate: { [Sequelize.Op.gte]: new Date(datetime) } },
                  { endDate: { [Sequelize.Op.eq]: null } },
                ],
              },
              required: false,
              attributes: ['branchID', 'applicableDate'],
              include: [
                {
                  model: BranchMaster,
                  as: 'branchMaster',
                  attributes: ['branchName'],
                },
              ],
            },
            {
              model: attendanceTransaction,
              where: {
                AttendanceDate: {
                  [Sequelize.Op.eq]: datetime,
                },
              },
              required: false,
              attributes: [
                'AttendanceTransID',
                'InDatetime',
                'OutDateTime',
                'fulldayhalfday',
              ],
            },
          ],
          attributes: [
            'firstName',
            'lastName',
            'displayName',
            'userNumber',
            'photo',
          ],
        },
      ],
      ...paginationQuery,
    });

    const currentUserData = await UserMaster.findOne({
      where: {
        userMasterID,
        status: 1,
      },
      include: [
        {
          model: EmployeeJoiningDetails,
          attributes: ['employeeCode'],
        },
        {
          model: companyMaster,
          required: true,
          attributes: ['companyMasterID', 'companyName'],
        },
        {
          model: EmployeeDesignation,
          where: {
            status: 1,
            applicableDate: { [Sequelize.Op.lte]: new Date(datetime) },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: new Date(datetime) } },
              { endDate: { [Sequelize.Op.eq]: null } },
            ],
          },
          required: false,
          attributes: ['designationID', 'applicableDate'],
          include: [
            {
              model: Designation,
              as: 'designation',
              attributes: ['designationName'],
            },
          ],
        },
        {
          model: EmployeeDepartment,
          where: {
            status: 1,
            applicableDate: { [Sequelize.Op.lte]: new Date(datetime) },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: new Date(datetime) } },
              { endDate: { [Sequelize.Op.eq]: null } },
            ],
          },
          required: false,
          attributes: ['departmentID', 'applicableDate'],
          include: [
            {
              model: Department,
              as: 'department',
              attributes: ['departmentName'],
            },
          ],
        },
        {
          model: EmployeeBranch,
          where: {
            status: 1,
            applicableDate: { [Sequelize.Op.lte]: new Date(datetime) },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: new Date(datetime) } },
              { endDate: { [Sequelize.Op.eq]: null } },
            ],
          },
          required: false,
          attributes: ['branchID', 'applicableDate'],
          include: [
            {
              model: BranchMaster,
              as: 'branchMaster',
              attributes: ['branchName'],
            },
          ],
        },
        {
          model: attendanceTransaction,
          where: {
            AttendanceDate: {
              [Sequelize.Op.eq]: datetime,
            },
          },
          required: false,
          attributes: [
            'AttendanceTransID',
            'InDatetime',
            'OutDateTime',
            'fulldayhalfday',
          ],
        },
      ],
      attributes: [
        'userMasterID',
        'firstName',
        'lastName',
        'displayName',
        'userNumber',
        'photo',
      ],
    });

    finalData.currentUser = currentUserData;
    finalData.child = reportstoImmediateChild.rows;

    res.status(200).json({
      status: 200,
      message: 'Immediate Child ReportsTo Get SuccessFully.',
      data: finalData,
      childCount: reportstoImmediateChild.count,
    });
  } catch (err) {
    next(err);
  }
};

exports.reportstoImmediateParent = async (req, res, next) => {
  try {
    const { userMasterID, date } = req.query;
    const datetime = date ? date : asiaKolkataDateTime(new Date()).slice(0, 10);
    const finalData = {};
    const reportstoImmediateParent = await EmployeeReportTo.findAll({
      where: {
        reportToID: userMasterID,
        status: 1,
      },
      attributes: ['reportToID', 'userMasterID'],
      include: [
        {
          model: UserMaster,
          required: true,
          as: 'employee',
          include: [
            {
              model: EmployeeJoiningDetails,
              attributes: ['employeeCode'],
            },
            {
              model: companyMaster,
              required: true,
              attributes: ['companyMasterID', 'companyName'],
            },
            {
              model: EmployeeDesignation,
              where: {
                status: 1,
                applicableDate: { [Sequelize.Op.lte]: new Date(datetime) },
                [Sequelize.Op.or]: [
                  { endDate: { [Sequelize.Op.gte]: new Date(datetime) } },
                  { endDate: { [Sequelize.Op.eq]: null } },
                ],
              },
              required: false,
              attributes: ['designationID', 'applicableDate'],
              include: [
                {
                  model: Designation,
                  as: 'designation',
                  attributes: ['designationName'],
                },
              ],
            },
            {
              model: EmployeeDepartment,
              where: {
                status: 1,
                applicableDate: { [Sequelize.Op.lte]: new Date(datetime) },
                [Sequelize.Op.or]: [
                  { endDate: { [Sequelize.Op.gte]: new Date(datetime) } },
                  { endDate: { [Sequelize.Op.eq]: null } },
                ],
              },
              required: false,
              attributes: ['departmentID', 'applicableDate'],
              include: [
                {
                  model: Department,
                  as: 'department',
                  attributes: ['departmentName'],
                },
              ],
            },
            {
              model: EmployeeBranch,
              where: {
                status: 1,
                applicableDate: { [Sequelize.Op.lte]: new Date(datetime) },
                [Sequelize.Op.or]: [
                  { endDate: { [Sequelize.Op.gte]: new Date(datetime) } },
                  { endDate: { [Sequelize.Op.eq]: null } },
                ],
              },
              required: false,
              attributes: ['branchID', 'applicableDate'],
              include: [
                {
                  model: BranchMaster,
                  as: 'branchMaster',
                  attributes: ['branchName'],
                },
              ],
            },
            {
              model: attendanceTransaction,
              where: {
                AttendanceDate: {
                  [Sequelize.Op.eq]: datetime,
                },
              },
              required: false,
              attributes: ['InDatetime', 'OutDateTime', 'fulldayhalfday'],
            },
          ],
          attributes: ['displayName', 'userNumber', 'photo'],
        },
      ],
    });

    const currentUserData = await UserMaster.findOne({
      where: {
        userMasterID,
        status: 1,
      },
      include: [
        {
          model: EmployeeJoiningDetails,
          attributes: ['employeeCode'],
        },
        {
          model: companyMaster,
          required: true,
          attributes: ['companyMasterID', 'companyName'],
        },
        {
          model: EmployeeDesignation,
          where: {
            status: 1,
            applicableDate: { [Sequelize.Op.lte]: new Date(datetime) },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: new Date(datetime) } },
              { endDate: { [Sequelize.Op.eq]: null } },
            ],
          },
          required: false,
          attributes: ['designationID', 'applicableDate'],
          include: [
            {
              model: Designation,
              as: 'designation',
              attributes: ['designationName'],
            },
          ],
        },
        {
          model: EmployeeDepartment,
          where: {
            status: 1,
            applicableDate: { [Sequelize.Op.lte]: new Date(datetime) },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: new Date(datetime) } },
              { endDate: { [Sequelize.Op.eq]: null } },
            ],
          },
          required: false,
          attributes: ['departmentID', 'applicableDate'],
          include: [
            {
              model: Department,
              as: 'department',
              attributes: ['departmentName'],
            },
          ],
        },
        {
          model: EmployeeBranch,
          where: {
            status: 1,
            applicableDate: { [Sequelize.Op.lte]: new Date(datetime) },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: new Date(datetime) } },
              { endDate: { [Sequelize.Op.eq]: null } },
            ],
          },
          required: false,
          attributes: ['branchID', 'applicableDate'],
          include: [
            {
              model: BranchMaster,
              as: 'branchMaster',
              attributes: ['branchName'],
            },
          ],
        },
        {
          model: attendanceTransaction,
          where: {
            AttendanceDate: {
              [Sequelize.Op.eq]: datetime,
            },
          },
          required: false,
          attributes: ['InDatetime', 'OutDateTime', 'fulldayhalfday'],
        },
      ],
      attributes: [
        'userMasterID',
        'firstName',
        'lastName',
        'displayName',
        'userNumber',
        'photo',
      ],
    });

    finalData.currentUser = currentUserData;
    finalData.parent = reportstoImmediateParent;

    res.status(200).json({
      status: 200,
      message: 'Immediate Parent ReportsTo Get SuccessFully.',
      data: finalData,
    });
  } catch (err) {
    next(err);
  }
};
