const Sequelize = require('sequelize');
const UserMaster = require('../models/userMaster');
const EmployeeWorkingLocation = require('../models/employeeWorkingLocation');
const companyMasters = require('../models/companyMaster');
const logger = require('../config/logger');
const sequelize = require('../config/database');
const message = require('../response_message/message');
const workingLocation = require('../models/workingLocation');
const { accessibleUsers } = require('../utils/commonUtilFunctions');
const { userAttributes } = require('../utils/commonVars');

exports.postAddEmployeeWorkingLocation = async (req, res, next) => {
  try {
    const {
      userMasterID,
      workingLocationIDs,
      startDate,
      createBy,
      createByIp,
    } = await req.body;

    let currdate = new Date(
      new Date().getFullYear() +
        '-' +
        ('0' + (new Date().getMonth() + 1)).slice(-2) +
        '-' +
        ('0' + new Date().getDate()).slice(-2)
    );
    let inputDate = new Date(startDate).toISOString().slice(0, 10);

    if (currdate > inputDate) {
      return res.status(200).json({
        status: 401,
        message: 'Applicable Date cannot be of past',
        data: {},
      });
    }

    const data = await EmployeeWorkingLocation.findOne({
      where: {
        userMasterID: userMasterID,
        status: 1,
        startDate: new Date(startDate),
      },
    });
    if (!data) {
      let get_one_data = await EmployeeWorkingLocation.findAll({
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
          let date_change = await EmployeeWorkingLocation.update(
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
          let insert_db_status = await EmployeeWorkingLocation.create({
            userMasterID,
            workingLocationIDs,
            startDate,
            endDate:
              nearestFutureDate(dateArr, new Date(startDate)).getTime() -
              86400000,
            createBy,
            createByIp,
          });
          res.status(200).json({
            status: 200,
            message: 'Working Location assigned successfully',
            data: insert_db_status,
          });
          return insert_db_status;
        } else {
          let result = await sequelize.transaction(async (t) => {
            let insert_db_status = await EmployeeWorkingLocation.create(
              {
                userMasterID,
                workingLocationIDs,
                startDate,
                createBy,
                createByIp,
              },
              { transaction: t }
            );
            res.status(200).json({
              status: 200,
              message: 'Working Location assigned successfully',
              data: insert_db_status,
            });
            return insert_db_status;
          });
        }
      } else {
        let result = await sequelize.transaction(async (t) => {
          let insert_db_status = await EmployeeWorkingLocation.create(
            {
              userMasterID,
              workingLocationIDs,
              startDate,
              createBy,
              createByIp,
            },
            { transaction: t }
          );
          res.status(200).json({
            status: 200,
            message: 'Working Location assigned successfully',
            data: insert_db_status,
          });
          return insert_db_status;
        });
      }
    } else {
      res.status(200).json({
        status: 401,
        message: 'Date already added',
        data: {},
      });
    }
  } catch (err) {
    next(err);
  }
};

exports.getEmployeeWorkingLocationByUserId = async (req, res, next) => {
  try {
    let get_one_data = await EmployeeWorkingLocation.findAll({
      where: {
        userMasterID: req.params.id,
        status: 1,
      },
      order: [['startDate', 'ASC']],
      include: [
        {
          model: UserMaster,
          as: 'employee',
        },
        {
          model: UserMaster,
          as: 'createdByUserDetails',
          attributes: userAttributes,
        },
      ],
    });
    if (get_one_data.length == 0) {
      //no logic require to execute
    } else if (get_one_data.length == 1) {
      get_one_data[0].dataValues.showDelete = true;
      if (
        new Date(get_one_data[0].startDate).toISOString().slice(0, 10) >
        new Date().toISOString().slice(0, 10)
      ) {
        get_one_data[0].dataValues.workinglocationstatus = 'deactive';
      } else {
        get_one_data[0].dataValues.workinglocationstatus = 'active';
      }
    } else {
      let startdates = [];
      for (var j = 0; j < get_one_data.length; j++) {
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

      for (var i = 0; i < get_one_data.length; i++) {
        let D1 = new Date(get_one_data[i].startDate).toISOString().slice(0, 10);
        let D2;
        if (get_one_data[i].endDate == null) {
          D2 = null;
        } else {
          D2 = new Date(get_one_data[i].endDate).toISOString().slice(0, 10);
        }

        let D3 = new Date().toISOString().slice(0, 10);
        if (D3 == D1) {
          get_one_data[i].dataValues.workinglocationstatus = 'active';
          get_one_data[i].dataValues.showDelete = true;
        } else if (D3 >= D1 && D3 <= D2 && D3 == D1) {
          get_one_data[i].dataValues.workinglocationstatus = 'active';
          get_one_data[i].dataValues.showDelete = true;
        } else if (D2 == null && D1 <= D3) {
          get_one_data[i].dataValues.workinglocationstatus = 'active';
          get_one_data[i].dataValues.showDelete = true;
        } else if (D3 > D1) {
          if (D1 == past) {
            get_one_data[i].dataValues.workinglocationstatus = 'active';
            get_one_data[i].dataValues.showDelete = true;
          } else {
            get_one_data[i].dataValues.workinglocationstatus = 'deactive';
            get_one_data[i].dataValues.showDelete = false;
          }
        } else {
          get_one_data[i].dataValues.workinglocationstatus = 'deactive';
          get_one_data[i].dataValues.showDelete = true;
        }
      }
    }

    for (let item of get_one_data) {
      if (item.workingLocationIDs) {
        let ii = 0;
        item.dataValues.workinglocation = {
          workingLocationName: [],
        };
        for (let workingLocationID of item.workingLocationIDs) {
          let workingLocationData = await workingLocation.findOne({
            raw: true,
            where: {
              workingLocationID: workingLocationID,
              status: {
                [Sequelize.Op.in]: [0, 1],
              },
            },
          });

          if (ii < item.workingLocationIDs.length - 1) {
            workingLocationData.workingLocationName =
              workingLocationData.workingLocationName + ',';
          }
          item.dataValues.workinglocation.workingLocationName.push(
            workingLocationData.workingLocationName
          );
          console.log(item.dataValues.workinglocation, '12121212');

          ii++;
        }
      }
    }

    if (!get_one_data)
      res
        .status(200)
        .json({ status: 200, message: message.usermessage.deletedrecord });
    res.status(200).json({ status: 200, data: get_one_data });
  } catch (err) {
    next(err);
  }
};

exports.postDeleteEmployeeWorkingLocationById = async (req, res, next) => {
  try {
    const { employeeWorkingLocationID, userMasterID } = await req.body;
    let get_one_data = await EmployeeWorkingLocation.findAll({
      where: {
        userMasterID: userMasterID,
        employeeWorkingLocationID: {
          [Sequelize.Op.notIn]: [employeeWorkingLocationID],
        },
        status: 1,
      },
    });
    if (get_one_data.length > 0) {
      let startdates = [];
      for (var i = 0; i < get_one_data.length; i++) {
        startdates.push(new Date(get_one_data[i].startDate));
      }
      const dateArr = startdates.sort((a, b) => a - b);
      let get_previous_data = await EmployeeWorkingLocation.findOne({
        where: {
          employeeWorkingLocationID: employeeWorkingLocationID,
        },
      });

      const nearestPastDate = (dateArr, date) => {
        const pastArr = dateArr.filter((n) => n <= date);
        return pastArr.length > 0 ? pastArr[pastArr.length - 1] : null;
      };

      const nearestFutureDate = (dateArr, date) => {
        const futArr = dateArr.filter((n) => n >= date);
        return futArr.length > 0 ? futArr[0] : null;
      };

      if (
        nearestPastDate(dateArr, new Date(get_previous_data.startDate)) != null
      ) {
        if (
          nearestFutureDate(dateArr, new Date(get_previous_data.startDate)) !=
          null
        ) {
          let date_change = await EmployeeWorkingLocation.update(
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
            }
          );
        } else {
          let date_change = await EmployeeWorkingLocation.update(
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
            }
          );
        }
      }
    }
    let result = await sequelize.transaction(async (t) => {
      let insert_db_status = await EmployeeWorkingLocation.update(
        {
          status: 2,
        },
        {
          where: {
            employeeWorkingLocationID: employeeWorkingLocationID,
          },
        },
        { transaction: t }
      );
      res.status(200).json({
        status: 200,
        message: 'Employee Working Location deleted successfully',
        data: insert_db_status,
      });
      return insert_db_status;
    });
  } catch (err) {
    next(err);
  }
};

exports.getEmployeeWorkingLocation = async (req, res, next) => {
  try {
    // let currdate1 = new Date(
    //   new Date().getFullYear() +
    //   '-' +
    //   ('0' + (new Date().getMonth() + 1)).slice(-2) +
    //   '-' +
    //   ('0' + new Date().getDate()).slice(-2)
    // );

    let { limit, page, searchQuery, companyMasterID } = await req.body;
    let offset = (page - 1) * limit;
    let allUser = [],
      totalcount;

    if (searchQuery && page && limit) {
      allUser = await UserMaster.findAll({
        raw: true,
        limit: limit,
        offset: offset,
        ...accessibleUsers(req.userDetails, false),
        where: {
          companyMasterId: companyMasterID,
          [Sequelize.Op.or]: [
            { displayName: { [Sequelize.Op.iLike]: '%' + searchQuery + '%' } },
            { userNumber: { [Sequelize.Op.iLike]: '%' + searchQuery + '%' } },
            sequelize.where(
              sequelize.cast(
                sequelize.col('userMaster.userMasterID'),
                'varchar'
              ),
              { [Sequelize.Op.iLike]: `%${searchQuery}%` }
            ),
          ],
          status: 1,
        },
      });
      for (var i = 0; i < allUser.length; i++) {
        let get_one_data = await EmployeeWorkingLocation.findAll({
          where: {
            userMasterID: allUser[i].userMasterID,
            status: {
              [Sequelize.Op.in]: [0, 1],
            },
          },
        });

        if (get_one_data.length == 1) {
          if (
            new Date(get_one_data[0].startDate).toISOString().slice(0, 10) >
            new Date().toISOString().slice(0, 10)
          ) {
            get_one_data[0].dataValues.workinglocationstatus = 'deactive';
          } else {
            get_one_data[0].dataValues.workinglocationstatus = 'active';
          }
        } else {
          let startdates = [];
          for (var j = 0; j < get_one_data.length; j++) {
            startdates.push(new Date(get_one_data[j].startDate));
          }
          const dateArr = startdates.sort((a, b) => a - b);
          const nearestPastDate = (dateArr, date) => {
            const pastArr = dateArr.filter((n) => n <= date);
            return pastArr.length > 0 ? pastArr[pastArr.length - 1] : null;
          };
          const past = nearestPastDate(dateArr, new Date());

          for (var k = 0; k < get_one_data.length; k++) {
            let D1 = new Date(get_one_data[k].startDate);
            let D2;
            if (get_one_data[k].endDate == null) {
              D2 = null;
            } else {
              D2 = new Date(get_one_data[k].endDate);
            }

            let D3 = new Date();

            if (D3 >= D1 && D3 <= D2) {
              get_one_data[k].dataValues.workinglocationstatus = 'active';
            } else if (D2 == null && D1 <= D3) {
              get_one_data[k].dataValues.workinglocationstatus = 'active';
            } else if (D3 > D1) {
              if (D1 == past) {
                get_one_data[k].dataValues.workinglocationstatus = 'active';
              } else {
                get_one_data[k].dataValues.workinglocationstatus = 'deactive';
              }
            } else if (D3 == D1) {
              get_one_data[k].dataValues.workinglocationstatus = 'active';
            } else {
              get_one_data[k].dataValues.workinglocationstatus = 'deactive';
            }
          }
        }
        allUser[i].WorkingLocation = get_one_data;
      }
      totalcount = await UserMaster.count({
        raw: true,
        where: {
          companyMasterId: companyMasterID,
          [Sequelize.Op.or]: [
            { displayName: { [Sequelize.Op.iLike]: '%' + searchQuery + '%' } },
            { userNumber: { [Sequelize.Op.iLike]: '%' + searchQuery + '%' } },
            sequelize.where(
              sequelize.cast(
                sequelize.col('userMaster.userMasterID'),
                'varchar'
              ),
              { [Sequelize.Op.iLike]: `%${searchQuery}%` }
            ),
          ],
          status: 1,
        },
        ...accessibleUsers(req.userDetails, false),
      });
    } else {
      allUser = await UserMaster.findAll({
        raw: true,
        limit: limit,
        offset: offset,
        ...accessibleUsers(req.userDetails, false),
        where: {
          status: 1,
          companyMasterId: companyMasterID,
        },
      });
      for (var i = 0; i < allUser.length; i++) {
        let get_one_data = await EmployeeWorkingLocation.findAll({
          where: {
            userMasterID: allUser[i].userMasterID,
            status: {
              [Sequelize.Op.in]: [0, 1],
            },
          },
          order: [['startDate', 'ASC']],
        });
        if (get_one_data.length == 1) {
          if (
            new Date(get_one_data[0].startDate).toISOString().slice(0, 10) >
            new Date().toISOString().slice(0, 10)
          ) {
            get_one_data[0].dataValues.workinglocationstatus = 'deactive';
          } else {
            get_one_data[0].dataValues.workinglocationstatus = 'active';
          }
        } else {
          let startdates = [];
          for (var j = 0; j < get_one_data.length; j++) {
            startdates.push(new Date(get_one_data[j].startDate));
          }
          const dateArr = startdates.sort((a, b) => a - b);
          const nearestPastDate = (dateArr, date) => {
            const pastArr = dateArr.filter((n) => n <= date);
            return pastArr.length > 0 ? pastArr[pastArr.length - 1] : null;
          };
          const past = nearestPastDate(dateArr, new Date());

          for (var k = 0; k < get_one_data.length; k++) {
            let D1 = new Date(get_one_data[k].startDate);
            let D2;
            if (get_one_data[k].endDate == null) {
              D2 = null;
            } else {
              D2 = new Date(get_one_data[k].endDate);
            }

            let D3 = new Date();

            if (D3 >= D1 && D3 <= D2) {
              get_one_data[k].dataValues.workinglocationstatus = 'active';
            } else if (D2 == null && D1 <= D3) {
              get_one_data[k].dataValues.workinglocationstatus = 'active';
            } else if (D3 > D1) {
              if (D1 == past) {
                get_one_data[k].dataValues.workinglocationstatus = 'active';
              } else {
                get_one_data[k].dataValues.workinglocationstatus = 'deactive';
              }
            } else if (D3 == D1) {
              get_one_data[k].dataValues.workinglocationstatus = 'active';
            } else {
              get_one_data[k].dataValues.workinglocationstatus = 'deactive';
            }
          }
        }
        allUser[i].WorkingLocation = get_one_data;
      }
      totalcount = await UserMaster.count({
        raw: true,
        where: {
          status: 1,
          companyMasterId: companyMasterID,
        },
        ...accessibleUsers(req.userDetails, false),
      });
    }

    for (let get_one_data of allUser) {
      for (let item of get_one_data.WorkingLocation) {
        if (item.workingLocationIDs) {
          let ii = 0;
          item.dataValues.workingLocation = {
            workingLocationName: [],
          };
          for (let workingLocationID of item.workingLocationIDs) {
            let workingLocationData = await workingLocation.findOne({
              raw: true,
              where: {
                workingLocationID: workingLocationID,
                status: {
                  [Sequelize.Op.in]: [0, 1],
                },
              },
            });

            if (ii < item.workingLocationIDs.length - 1) {
              workingLocationData.workingLocationName =
                workingLocationData.workingLocationName + ',';
            }
            item.dataValues.workingLocation.workingLocationName.push(
              workingLocationData.workingLocationName
            );

            ii++;
          }
        }
      }
    }

    return res
      .status(200)
      .json({ status: 200, data: allUser, totalcount: totalcount });
  } catch (err) {
    next(err.message);
  }
};

exports.postAddEmployeeWorkingLocationBULK = async (req, res, next) => {
  try {
    let { userMasterID, workingLocationIDs, startDate, createBy, createByIp } =
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
        data: {},
      });
    }

    for (var n = 0; n < userMasterID.length; n++) {
      let data = await EmployeeWorkingLocation.findOne({
        where: {
          userMasterID: userMasterID[n],
          startDate: new Date(startDate),
          status: 1,
        },
      });

      if (!data) {
        if (currdate == inputDate) {
          let get_one_data = await EmployeeWorkingLocation.findAll({
            where: {
              userMasterID: userMasterID[n],
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
              let date_change = await EmployeeWorkingLocation.update(
                {
                  endDate: new Date(new Date(startDate).getTime() - 86400000),
                },
                {
                  where: {
                    startDate: nearestPastDate(dateArr, new Date(startDate)),
                    userMasterID: userMasterID[n],
                  },
                }
              );
            }
            if (nearestFutureDate(dateArr, new Date(startDate)) != null) {
              let insert_db_status = await EmployeeWorkingLocation.create({
                userMasterID: userMasterID[n],
                workingLocationIDs,
                startDate,
                endDate:
                  nearestFutureDate(dateArr, new Date(startDate)).getTime() -
                  86400000,
                createBy,
                createByIp,
              });
            } else {
              let insert_db_status = await EmployeeWorkingLocation.create({
                userMasterID: userMasterID[n],
                workingLocationIDs,
                startDate,
                createBy,
                createByIp,
              });
            }
          } else {
            let insert_db_status = await EmployeeWorkingLocation.create({
              userMasterID: userMasterID[n],
              workingLocationIDs,
              startDate,
              createBy,
              createByIp,
            });
          }
        } else {
          let get_one_data = await EmployeeWorkingLocation.findAll({
            where: {
              userMasterID: userMasterID[n],
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
              let date_change = await EmployeeWorkingLocation.update(
                {
                  endDate: new Date(new Date(startDate).getTime() - 86400000),
                },
                {
                  where: {
                    startDate: nearestPastDate(dateArr, new Date(startDate)),
                    userMasterID: userMasterID[n],
                  },
                }
              );
            }
            if (nearestFutureDate(dateArr, new Date(startDate)) != null) {
              let insert_db_status = await EmployeeWorkingLocation.create({
                userMasterID: userMasterID[n],
                workingLocationIDs,
                startDate,
                endDate:
                  nearestFutureDate(dateArr, new Date(startDate)).getTime() -
                  86400000,
                createBy,
                createByIp,
              });
            } else {
              let insert_db_status = await EmployeeWorkingLocation.create({
                userMasterID: userMasterID[n],
                workingLocationIDs,
                startDate,
                createBy,
                createByIp,
              });
            }
          } else {
            let insert_db_status = await EmployeeWorkingLocation.create({
              userMasterID: userMasterID[n],
              workingLocationIDs,
              startDate,
              createBy,
              createByIp,
            });
          }
        }
      }
    }

    return res.status(200).json({
      status: 200,
      message: 'Working Location assigned successfully',
      data: {},
    });
  } catch (err) {
    next(err);
  }
};
