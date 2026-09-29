const EmployeeDivision = require('../models/employeeDivision');
const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const Division = require('../models/division');
const UserMaster = require('../models/userMaster');
const companyMaster = require('../models/companyMaster');

const readXlsxFile = require('read-excel-file/node');
const fs = require('fs');
const {
  getAllUserByCompanyDateWise,
  employeeDepartment,
  employeeBranch,
  isValidDate,
  accessibleUsers,
} = require('../utils/commonUtilFunctions');

const { generateDemoExcelForDivision } = require('../utils/exportData');
const EmployeeJoiningDetails = require('../models/employeeJoiningDetails');
const message = require('../response_message/message');
const path = require('path');
const { userAttributes } = require('../utils/commonVars');

exports.addData = async (req, res, next) => {
  try {
    const { userMasterID, divisionId, startDate, createBy, createByIp } =
      await req.body;

    const data = await EmployeeDivision.findOne({
      where: {
        userMasterID: userMasterID,
        status: 1,
        startDate: new Date(startDate),
      },
    });
    if (!data) {
      let get_one_data = await EmployeeDivision.findAll({
        where: {
          userMasterID: userMasterID,
          status: 1,
        },
      });

      if (get_one_data.length > 0) {
        let startdates = [];
        for (var i = 0; i < get_one_data.length; i++) {
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

        if (nearestPastDate(dateArr, new Date(startDate)) != null) {
          await EmployeeDivision.update(
            {
              endDate: new Date(new Date(startDate).getTime() - 86400000),
            },
            {
              where: {
                startDate: nearestPastDate(dateArr, new Date(startDate)),
                userMasterID: userMasterID,
              },
            }
          );
        }
        if (nearestFutureDate(dateArr, new Date(startDate)) != null) {
          let insert_db_status = await EmployeeDivision.create(
            {
              userMasterID,
              divisionId,
              startDate,
              endDate:
                nearestFutureDate(dateArr, new Date(startDate)).getTime() -
                86400000,
              createBy,
              createByIp,
            },
            { user: req.userDetails }
          );
          return res.status(200).json({
            status: 200,
            message: 'Division assigned successfully',
          });
        } else {
          await sequelize.transaction(async (t) => {
            await EmployeeDivision.create(
              {
                userMasterID,
                divisionId,
                startDate,
                createBy,
                createByIp,
              },
              { user: req.userDetails, transaction: t }
            );
            return res.status(200).json({
              status: 200,
              message: 'Division assigned successfully.',
            });
          });
        }
      } else {
        await sequelize.transaction(async (t) => {
          await EmployeeDivision.create(
            {
              userMasterID,
              divisionId,
              startDate,
              createBy,
              createByIp,
            },
            { user: req.userDetails, transaction: t }
          );
          return res.status(200).json({
            status: 200,
            message: 'Division assigned successfully',
          });
        });
      }
    } else {
      return res.status(200).json({
        status: 401,
        message: 'Division already assigned on this date',
      });
    }
  } catch (err) {
    next(err);
  }
};

exports.getByUserId = async (req, res, next) => {
  try {
    // let currdate1 = new Date(
    //   new Date().getFullYear() +
    //   '-' +
    //   ('0' + (new Date().getMonth() + 1)).slice(-2) +
    //   '-' +
    //   ('0' + new Date().getDate()).slice(-2)
    // );

    let get_one_data = await EmployeeDivision.findAll({
      raw: true,
      where: {
        userMasterID: req.params.id,
        status: 1,
      },
      include: [
        {
          model: UserMaster,
          as: 'createdByUserDetails',
          attributes: userAttributes,
        },
        {
          model: Division,
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
    if (get_one_data.length == 0) {
      //no logic require to execute
    } else if (get_one_data.length == 1) {
      get_one_data[0].showDelete = true;
      if (
        new Date(get_one_data[0].startDate).toISOString().slice(0, 10) >
        new Date().toISOString().slice(0, 10)
      ) {
        get_one_data[0].divisionStatus = 'deactive';
      } else {
        get_one_data[0].divisionStatus = 'active';
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

      for (let i = 0; i < get_one_data.length; i++) {
        let D1 = new Date(get_one_data[i].startDate).toISOString().slice(0, 10);
        let D2;
        if (get_one_data[i].endDate == null) {
          D2 = null;
        } else {
          D2 = new Date(get_one_data[i].endDate).toISOString().slice(0, 10);
        }

        let D3 = new Date().toISOString().slice(0, 10);
        if (D3 >= D1 && D3 <= D2) {
          get_one_data[i].divisionStatus = 'active';
          get_one_data[i].showDelete = true;
        } else if (D2 == null && D1 <= D3) {
          get_one_data[i].divisionStatus = 'active';
          get_one_data[i].showDelete = true;
        } else if (D3 > D1) {
          if (D1 == past) {
            get_one_data[i].divisionStatus = 'active';
            get_one_data[i].showDelete = true;
          } else {
            get_one_data[i].divisionStatus = 'deactive';
            get_one_data[i].showDelete = false;
          }
        } else if (D3 == D1) {
          get_one_data[i].divisionStatus = 'active';
          get_one_data[i].showDelete = true;
        } else {
          get_one_data[i].divisionStatus = 'deactive';
          get_one_data[i].showDelete = true;
        }
      }
    }

    return res.status(200).json({ status: 200, data: get_one_data });
  } catch (err) {
    next(err);
  }
};

exports.addBulk = async (req, res, next) => {
  try {
    const { userMasterID, divisionId, startDate, createBy, createByIp } =
      await req.body;

    let currdate1 = new Date(
      new Date().getFullYear() +
        '-' +
        ('0' + (new Date().getMonth() + 1)).slice(-2) +
        '-' +
        ('0' + new Date().getDate()).slice(-2)
    );

    let currdate = new Date(currdate1).toISOString().slice(0, 10);
    let inputDate = new Date(startDate).toISOString().slice(0, 10);

    if (currdate > inputDate) {
      return res.status(200).json({
        status: 401,
        message: 'Applicable Date cannot be of past',
      });
    }

    await sequelize.transaction(async (t) => {
      for (const userMasterID1 of userMasterID) {
        const data = await EmployeeDivision.findOne({
          where: {
            userMasterID: userMasterID1,
            status: 1,
            startDate: new Date(startDate),
          },
        });
        if (!data) {
          let get_one_data = await EmployeeDivision.findAll({
            where: {
              userMasterID: userMasterID1,
              status: 1,
            },
          });

          if (get_one_data.length > 0) {
            let startdates = [];
            for (var i = 0; i < get_one_data.length; i++) {
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

            if (nearestPastDate(dateArr, new Date(startDate)) != null) {
              await EmployeeDivision.update(
                {
                  endDate: new Date(new Date(startDate).getTime() - 86400000),
                },
                {
                  where: {
                    startDate: nearestPastDate(dateArr, new Date(startDate)),
                    userMasterID: userMasterID1,
                  },
                }
              );
            }
            if (nearestFutureDate(dateArr, new Date(startDate)) != null) {
              await EmployeeDivision.create(
                {
                  userMasterID: userMasterID1,
                  divisionId,
                  startDate,
                  endDate:
                    nearestFutureDate(dateArr, new Date(startDate)).getTime() -
                    86400000,
                  createBy,
                  createByIp,
                },
                { user: req.userDetails, transaction: t }
              );
            } else {
              await EmployeeDivision.create(
                {
                  userMasterID: userMasterID1,
                  divisionId,
                  startDate,
                  createBy,
                  createByIp,
                },
                { user: req.userDetails, transaction: t }
              );
            }
          } else {
            await EmployeeDivision.create(
              {
                userMasterID: userMasterID1,
                divisionId,
                startDate,
                createBy,
                createByIp,
              },
              { user: req.userDetails, transaction: t }
            );
          }
        }
      }
    });

    return res.status(200).json({
      status: 200,
      message: 'Division assigned successfully.',
    });
  } catch (error) {
    next(error);
  }
};

exports.getDataBycompanyId = async (req, res, next) => {
  try {
    const { id } = req.params;

    const data = await Division.findAll({
      raw: true,
      where: {
        companyMasterID: id,
        status: 1,
      },
    });

    return res.status(200).json({
      status: 200,
      data: data,
    });
  } catch (error) {}
};

exports.getEmployeeDivisionByCompany = async (req, res, next) => {
  try {
    const { page, limit, search, companyMasterID } = req.query;

    const condition = {};

    if (search)
      condition[Sequelize.Op.or] = [
        { displayName: { [Sequelize.Op.iLike]: '%' + search + '%' } },
        { userNumber: { [Sequelize.Op.iLike]: '%' + search + '%' } },
      ];

    if (companyMasterID) {
      req.userDetails.accessibleCompanies = companyMasterID;

      condition.companyMasterId = companyMasterID;
    }

    condition.status = 1;

    const paginatecondition =
      page && limit ? { offset: (page - 1) * limit, limit } : {};

    const userData = await UserMaster.findAndCountAll({
      raw: true,
      where: condition,
      ...paginatecondition,
      ...accessibleUsers(req.userDetails, false),
      order: [['displayName', 'ASC']],
    });

    const user = userData.rows;

    // let currdate1 = new Date(
    //   new Date().getFullYear() +
    //   '-' +
    //   ('0' + (new Date().getMonth() + 1)).slice(-2) +
    //   '-' +
    //   ('0' + new Date().getDate()).slice(-2)
    // );

    for (let i = 0; i < user.length; i++) {
      const userMasterID = user[i].userMasterID;

      const get_one_data = await EmployeeDivision.findAll({
        raw: true,
        where: {
          userMasterID: userMasterID,
          status: 1,
        },
        include: [{ model: Division }],
        order: [['startDate', 'ASC']],
      });
      if (get_one_data.length == 0) {
        //no logic require to execute
      } else if (get_one_data.length == 1) {
        if (
          new Date(get_one_data[0].startDate).toISOString().slice(0, 10) >
          new Date().toISOString().slice(0, 10)
        ) {
          get_one_data[0].divisionStatus = 'deactive';
        } else {
          get_one_data[0].divisionStatus = 'active';
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

        for (let k = 0; k < get_one_data.length; k++) {
          let D1 = new Date(get_one_data[k].startDate)
            .toISOString()
            .slice(0, 10);
          let D2;
          if (get_one_data[k].endDate == null) {
            D2 = null;
          } else {
            D2 = new Date(get_one_data[k].endDate).toISOString().slice(0, 10);
          }

          let D3 = new Date().toISOString().slice(0, 10);
          if (D3 >= D1 && D3 <= D2) {
            get_one_data[k].divisionStatus = 'active';
          } else if (D2 == null && D1 <= D3) {
            get_one_data[k].divisionStatus = 'active';
          } else if (D3 > D1) {
            if (D1 == past) {
              get_one_data[k].divisionStatus = 'active';
            } else {
              get_one_data[k].divisionStatus = 'deactive';
            }
          } else if (D3 == D1) {
            get_one_data[k].divisionStatus = 'active';
          } else {
            get_one_data[k].divisionStatus = 'deactive';
          }
        }
      }

      user[i].divisionData = get_one_data;
    }

    return res.status(200).json({
      status: 200,
      data: user,
      totalcount: userData.count,
    });
  } catch (error) {
    next(error);
  }
};

exports.downloadDemoExcel = async (req, res, next) => {
  try {
    const { companyMasterID } = req.query;

    const date =
      new Date().getFullYear() +
      '-' +
      ('0' + (new Date().getMonth() + 1)).slice(-2) +
      '-' +
      ('0' + new Date().getDate()).slice(-2);

    const users = (
      await EmployeeJoiningDetails.findAndCountAll({
        raw: true,
        where: {
          joiningDate: {
            [Sequelize.Op.lte]: date,
          },
          [Sequelize.Op.or]: [
            {
              leavingDate: { [Sequelize.Op.gte]: date },
            },
            {
              leavingDate: { [Sequelize.Op.eq]: null },
              [Sequelize.Op.or]: [
                {
                  '$userMaster.deactiveDate$': { [Sequelize.Op.gte]: date },
                },
                {
                  '$userMaster.deactiveDate$': { [Sequelize.Op.eq]: null },
                },
              ],
            },
          ],
          '$userMaster.companyMasterId$': companyMasterID,
          '$userMaster.status$': [0, 1],
        },
        include: [
          {
            model: UserMaster,
            required: true,
            ...accessibleUsers(req.userDetails),
          },
        ],
        order: [[{ model: UserMaster }, 'displayName', 'ASC']],
      })
    ).rows // await getAllUserByCompanyDateWise(companyMasterID, '', '', date)
      .filter((e) => e['userMaster.status'] == 1);

    const division = await Division.findAll({
      raw: true,
      where: {
        companyMasterID: companyMasterID,
        status: 1,
      },
    });

    const divisionList = division.map((e) => e.divisionName);

    const final = await Promise.all(
      users.map(async (e) => {
        const department = await employeeDepartment(e.userMasterID, date);
        const branch = await employeeBranch(e.userMasterID, date);

        return {
          'Employee Code': e.employeeCode,
          'Employee Name': e['userMaster.displayName'],
          'Mobile No.': e['userMaster.userNumber'],
          Branch: branch ? branch['branchMaster.branchName'] : '',
          Department: department ? department['department.departmentName'] : '',
          Division: '',
          'Applicable Date': '',
        };
      })
    );

    if (+final.length === 0) {
      return res.status(200).json({
        message: 'No data found to export!',
      });
    }

    return await generateDemoExcelForDivision(
      final,
      divisionList,
      'Division',
      'xlsx',
      res
    );
  } catch (error) {
    next(error);
  }
};

exports.uploadDivision = async (req, res, next) => {
  const filePath = path.join(__dirname, `../uploads/${req.file.filename}`);

  try {
    const { companyMasterID, createBy, createByIp } = await req.body;

    readXlsxFile(filePath).then(async (rows) => {
      rows.shift();

      await sequelize
        .transaction(async (t) => {
          const allDivision = [],
            toCreateData = [];

          for (const row of rows) {
            const userMaster = await UserMaster.findOne({
              raw: true,
              where: {
                userNumber: String(row[2]).trim(),
                companyMasterId: companyMasterID,
                status: 1,
              },
            });

            if (!userMaster)
              return res.status(200).send({
                status: 401,
                message: ' user not found : ' + `${row[2]}`,
              });

            if (!row[5]) continue;

            if (row[5] && !row[6])
              return res.status(200).send({
                status: 401,
                message: ' Applicable Date is require : ' + `${row[2]}`,
              });

            const findDivision = allDivision.find(
              (e) =>
                e.divisionName.trim().toLowerCase() ==
                row[5].trim().toLowerCase()
            );
            let divisionId = findDivision ? findDivision.id : null;
            if (!findDivision) {
              const division = await Division.findOne({
                raw: true,
                where: Sequelize.and(
                  Sequelize.where(
                    sequelize.fn(
                      'TRIM',
                      sequelize.fn('LOWER', sequelize.col('divisionName'))
                    ),
                    String(row[5]).trim().toLowerCase()
                  ),
                  Sequelize.where(
                    sequelize.col('companyMasterID'),
                    companyMasterID
                  ),
                  Sequelize.where(sequelize.col('status'), 1)
                ),
              });

              if (!division)
                return res.status(200).send({
                  status: 401,
                  message: 'Division : ' + `'${row[5]}'` + ` not found!`,
                });

              divisionId = division.id;

              allDivision.push(division);
            }

            let startDate = null;

            if (typeof row[6] == 'number') {
              startDate = new Date(Math.round(row[6] - 25569) * 86400 * 1000)
                .toISOString()
                .slice(0, 10);
            } else {
              if (isValidDate(row[6]) === true) {
                startDate = new Date(`${row[6]}`).toISOString().slice(0, 10);
              } else {
                return res.status(200).send({
                  status: 402,
                  message:
                    " Applicable Date Should be in 'yyyy-mm-dd' Format" +
                    ': ' +
                    row[2],
                });
              }
            }

            const userMasterID = userMaster.userMasterID;

            const data = await EmployeeDivision.findOne({
              where: {
                userMasterID: userMasterID,
                status: 1,
                startDate: new Date(startDate),
              },
            });
            if (!data) {
              let get_one_data = await EmployeeDivision.findAll({
                where: {
                  userMasterID: userMasterID,
                  status: 1,
                },
              });

              if (get_one_data.length > 0) {
                let startdates = [];
                for (let i = 0; i < get_one_data.length; i++) {
                  startdates.push(new Date(get_one_data[i].startDate));
                }
                const dateArr = startdates.sort((a, b) => a - b);
                const nearestPastDate = (dateArr, date) => {
                  const pastArr = dateArr.filter((n) => n <= date);
                  return pastArr.length > 0
                    ? pastArr[pastArr.length - 1]
                    : null;
                };

                const nearestFutureDate = (dateArr, date) => {
                  const futArr = dateArr.filter((n) => n >= date);
                  return futArr.length > 0 ? futArr[0] : null;
                };

                if (nearestPastDate(dateArr, new Date(startDate)) != null) {
                  await EmployeeDivision.update(
                    {
                      endDate: new Date(
                        new Date(startDate).getTime() - 86400000
                      ),
                    },
                    {
                      where: {
                        startDate: nearestPastDate(
                          dateArr,
                          new Date(startDate)
                        ),
                        userMasterID: userMasterID,
                      },
                      transaction: t,
                    }
                  );
                }
                if (nearestFutureDate(dateArr, new Date(startDate)) != null) {
                  toCreateData.push({
                    userMasterID,
                    divisionId,
                    startDate,
                    endDate:
                      nearestFutureDate(
                        dateArr,
                        new Date(startDate)
                      ).getTime() - 86400000,
                    createBy,
                    createByIp,
                  });
                } else {
                  toCreateData.push({
                    userMasterID,
                    divisionId,
                    startDate,
                    createBy,
                    createByIp,
                  });
                }
              } else {
                console.log(userMasterID, divisionId, startDate, 'logggg');

                toCreateData.push({
                  userMasterID,
                  divisionId,
                  startDate,
                  createBy,
                  createByIp,
                });
              }
            }
          }

          await EmployeeDivision.bulkCreate(toCreateData, { transaction: t });

          fs.unlink(filePath, function (err) {
            if (err) {
              console.log(err);
            } else {
              console.log('delete');
            }
          });

          return res.status(200).send({
            status: 200,
            message: ' The File Upload Successfully: ' + req.file.originalname,
          });
        })
        .catch((err) => {
          res.status(200).send({
            status: 401,
            message: 'Fail to import data into database!' + err.message,
            error: err.message,
          });
        });
    });
  } catch (error) {
    next(error);
  }
};

/**
 * delete by i
 *
 * @param {id} divisionId  to delete id
 */
exports.postDeleteEmployeeDivision = async (req, res, next) => {
  try {
    const { id, userMasterID } = await req.body;

    const get_All_Data = await EmployeeDivision.findAll({
      where: {
        userMasterID: userMasterID,
        status: 1,
      },
    });

    const get_one_data = get_All_Data.filter((e) => e.id != id);
    const current_Data = get_All_Data.find((e) => e.id == id);

    await sequelize.transaction(async (t) => {
      if (get_one_data.length > 0) {
        let startdates = [];
        for (let i = 0; i < get_one_data.length; i++) {
          startdates.push(new Date(get_one_data[i].startDate));
        }
        const dateArr = startdates.sort((a, b) => a - b);
        const get_previous_data = current_Data;

        const nearestPastDate = (dateArr, date) => {
          const pastArr = dateArr.filter((n) => n <= date);
          return pastArr.length > 0 ? pastArr[pastArr.length - 1] : null;
        };

        const nearestFutureDate = (dateArr, date) => {
          const futArr = dateArr.filter((n) => n >= date);
          return futArr.length > 0 ? futArr[0] : null;
        };

        if (
          nearestPastDate(dateArr, new Date(get_previous_data.startDate)) !=
          null
        ) {
          if (
            nearestFutureDate(dateArr, new Date(get_previous_data.startDate)) !=
            null
          ) {
            await EmployeeDivision.update(
              {
                endDate:
                  nearestFutureDate(
                    dateArr,
                    new Date(get_previous_data.startDate)
                  ).getTime() - 86400000,
              },
              {
                where: {
                  startDate: nearestPastDate(
                    dateArr,
                    new Date(get_previous_data.startDate)
                  ),
                  userMasterID: userMasterID,
                },
                transaction: t,
              }
            );
          } else {
            await EmployeeDivision.update(
              {
                endDate: null,
              },
              {
                where: {
                  startDate: nearestPastDate(
                    dateArr,
                    new Date(get_previous_data.startDate)
                  ),
                  userMasterID: userMasterID,
                },
                transaction: t,
              }
            );
          }
        }
      }

      await EmployeeDivision.update(
        {
          status: 2,
        },
        {
          where: {
            id: id,
          },
        },
        { transaction: t }
      );
    });
    return res.status(200).json({
      status: 200,
      message: message.usermessage.deleteMessage('Employee Devision'),
    });
  } catch {
    next(err);
  }
};
