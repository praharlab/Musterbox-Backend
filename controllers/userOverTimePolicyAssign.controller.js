const userOverTimePolicyAssign = require('../models/userOverTimePolicyAssign');
const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const logger = require('../config/logger');
const message = require('../response_message/message');

exports.postAddUserOverTimePolicyAssign = async (req, res, next) => {
  try {
    let = { userMasterID, overTimePolicyID, startDate, createBy, createByIp } =
      await req.body;

    let data = await userOverTimePolicyAssign.findOne({
      where: {
        userMasterID: userMasterID,
        startDate: new Date(startDate),
      },
      include: [{ all: true, nested: true }],
    });
    if (!data) {
      let get_one_data = await userOverTimePolicyAssign.findAll({
        where: {
          userMasterID: userMasterID,
          status: 1,
        },
        include: [{ all: true, nested: true }],
      });

      if (get_one_data.length > 0) {
        startdates = [];
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
          let date_change = await userOverTimePolicyAssign.update(
            {
              endDate: new Date(new Date(startDate).getTime() - 86400000),
            },
            {
              where: {
                startDate: nearestPastDate(dateArr, new Date(startDate)),
              },
            }
          );
        }
        if (nearestFutureDate(dateArr, new Date(startDate)) != null) {
          let insert_db_status = await userOverTimePolicyAssign.create({
            userMasterID,
            overTimePolicyID,
            startDate,
            endDate:
              nearestFutureDate(dateArr, new Date(startDate)).getTime() -
              86400000,
            createBy,
            createByIp,
          });

          res.status(200).json({
            status: 200,
            message: message.usermessage.userOverTimePolicyAssignAdd,
            data: insert_db_status,
          });
          return insert_db_status;
        } else {
          let result = await sequelize.transaction(async (t) => {
            let insert_db_status = await userOverTimePolicyAssign.create(
              {
                userMasterID,
                overTimePolicyID,
                startDate,
                createBy,
                createByIp,
              },
              { transaction: t }
            );

            res.status(200).json({
              status: 200,
              message: message.usermessage.userOverTimePolicyAssignAdd,
              data: insert_db_status,
            });
            return insert_db_status;
          });
        }
      } else {
        let result = await sequelize.transaction(async (t) => {
          let insert_db_status = await userOverTimePolicyAssign.create(
            {
              userMasterID,
              overTimePolicyID,
              startDate,
              createBy,
              createByIp,
            },
            { transaction: t }
          );

          res.status(200).json({
            status: 200,
            message: message.usermessage.userOverTimePolicyAssignAdd,
            data: insert_db_status,
          });
          return insert_db_status;
        });
      }
    } else {
      res.status(200).json({
        status: 401,
        message: message.usermessage.employeeattendancepolicydate,
        data: {},
      });
    }
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

exports.postViewUserOverTimePolicyAssign = async (req, res, next) => {
  try {
    let { limit, page } = await req.body;
    let offset = (page - 1) * limit;
    if (limit == '' && page == '') {
      userOverTimePolicyAssign_data = await userOverTimePolicyAssign.findAll({
        raw: true,
        where: {
          status: {
            [Sequelize.Op.in]: [0, 1],
          },
        },
      });
    } else {
      userOverTimePolicyAssign_data = await userOverTimePolicyAssign.findAll({
        raw: true,
        where: {
          status: {
            [Sequelize.Op.in]: [0, 1],
          },
        },

        limit: limit,
        offset: offset,
      });
    }
    const totalcount = await userOverTimePolicyAssign.count({
      raw: true,
      where: { status: ['0', '1'] },
    });

    res.status(200).json({
      status: 200,
      data: userOverTimePolicyAssign_data,
      totalcount: totalcount,
    });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

exports.postUpdateUserOverTimePolicyAssign = async (req, res, next) => {
  try {
    let = {
      userOverTimePolicyAssignID,
      userMasterID,
      overTimePolicyID,
      startDate,
      updateBy,
      updateByIp,
    } = await req.body;

    let data = await userOverTimePolicyAssign.findOne({
      where: {
        userMasterID: userMasterID,
        userOverTimePolicyAssignID: {
          [Sequelize.Op.notIn]: [userOverTimePolicyAssignID],
        },
        startDate: new Date(startDate),
      },
      include: [{ all: true, nested: true }],
    });
    if (!data) {
      let get_one_data = await userOverTimePolicyAssign.findAll({
        where: {
          userMasterID: userMasterID,
          userOverTimePolicyAssignID: {
            [Sequelize.Op.notIn]: [userOverTimePolicyAssignID],
          },
          status: 1,
        },
        include: [{ all: true, nested: true }],
      });

      if (get_one_data.length > 0) {
        startdates = [];
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
          let date_change = await userOverTimePolicyAssign.update(
            {
              endDate: new Date(new Date(startDate).getTime() - 86400000),
            },
            {
              where: {
                startDate: nearestPastDate(dateArr, new Date(startDate)),
              },
            }
          );
        }
        if (nearestFutureDate(dateArr, new Date(startDate)) != null) {
          let insert_db_status = await userOverTimePolicyAssign.update(
            {
              userMasterID,
              overTimePolicyID,
              startDate,
              endDate:
                nearestFutureDate(dateArr, new Date(startDate)).getTime() -
                86400000,
              updateBy,
              updateByIp,
            },
            {
              where: {
                userOverTimePolicyAssignID: userOverTimePolicyAssignID,
              },
            }
          );

          res.status(200).json({
            status: 200,
            message: message.usermessage.userOverTimePolicyAssignUpdate,
            data: insert_db_status,
          });
          return insert_db_status;
        } else {
          let result = await sequelize.transaction(async (t) => {
            let insert_db_status = await userOverTimePolicyAssign.update(
              {
                userMasterID,
                overTimePolicyID,
                startDate,
                updateBy,
                updateByIp,
              },
              {
                where: {
                  userOverTimePolicyAssignID: userOverTimePolicyAssignID,
                },
              },
              { transaction: t }
            );

            res.status(200).json({
              status: 200,
              message: message.usermessage.userOverTimePolicyAssignUpdate,
              data: insert_db_status,
            });
            return insert_db_status;
          });
        }
      } else {
        let result = await sequelize.transaction(async (t) => {
          let insert_db_status = await userOverTimePolicyAssign.update(
            {
              userMasterID,
              overTimePolicyID,
              startDate,
              updateBy,
              updateByIp,
            },
            {
              where: {
                userOverTimePolicyAssignID: userOverTimePolicyAssignID,
              },
            },
            { transaction: t }
          );

          res.status(200).json({
            status: 200,
            message: message.usermessage.userOverTimePolicyAssignUpdate,
            data: insert_db_status,
          });
          return insert_db_status;
        });
      }
    } else {
      res.status(200).json({
        status: 401,
        message: message.usermessage.employeeattendancepolicydate,
        data: {},
      });
    }
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

exports.getUserOverTimePolicyAssignById = async (req, res, next) => {
  try {
    var data = await userOverTimePolicyAssign.findOne({
      raw: true,
      where: {
        userOverTimePolicyAssignID: req.params.id,
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
      },
      // include: [{ all: true, nested: true }]
    });

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

exports.postDeleteUserOverTimePolicyAssignById = async (req, res, next) => {
  try {
    let = { userOverTimePolicyAssignID, userMasterID } = await req.body;
    let get_one_data = await userOverTimePolicyAssign.findAll({
      where: {
        userMasterID: userMasterID,
        userOverTimePolicyAssignID: {
          [Sequelize.Op.notIn]: [userOverTimePolicyAssignID],
        },
        status: 1,
      },
      include: [{ all: true, nested: true }],
    });
    if (get_one_data.length > 0) {
      let startdates = [];
      for (var i = 0; i < get_one_data.length; i++) {
        startdates.push(new Date(get_one_data[i].startDate));
      }
      const dateArr = startdates.sort((a, b) => a - b);
      let get_previous_data = await userOverTimePolicyAssign.findOne({
        where: {
          userOverTimePolicyAssignID: userOverTimePolicyAssignID,
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
          let date_change = await userOverTimePolicyAssign.update(
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
              },
            }
          );
        } else {
          let date_change = await userOverTimePolicyAssign.update(
            {
              endDate: null,
            },
            {
              where: {
                startDate: nearestPastDate(
                  dateArr,
                  new Date(get_previous_data.startDate)
                ),
              },
            }
          );
        }
      }
    }
    let result = await sequelize.transaction(async (t) => {
      let insert_db_status = await userOverTimePolicyAssign.update(
        {
          status: 2,
        },
        {
          where: {
            userOverTimePolicyAssignID: userOverTimePolicyAssignID,
          },
        },
        { transaction: t }
      );

      res.status(200).json({
        status: 200,
        message: message.usermessage.userOverTimePolicyAssignDelete,
        data: insert_db_status,
      });
      return insert_db_status;
    });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

exports.postChangeStatus = async (req, res, next) => {
  try {
    let = { userOverTimePolicyAssignID, status } = await req.body;
    let delete_status;
    let result = await sequelize.transaction(async (t) => {
      if (status == '1') {
        delete_status = await userOverTimePolicyAssign.update(
          {
            status: '1',
          },
          {
            where: {
              userOverTimePolicyAssignID: userOverTimePolicyAssignID,
              status: ['1', '0'],
            },
            transaction: t,
          }
        );
      } else {
        delete_status = await userOverTimePolicyAssign.update(
          {
            status: '0',
          },
          {
            where: {
              userOverTimePolicyAssignID: userOverTimePolicyAssignID,
              status: ['1', '0'],
            },
            transaction: t,
          }
        );
      }
      if (delete_status != 0) {
        res.status(200).json({
          status: 200,
          message: message.usermessage.userOverTimePolicyAssignStatus,
        });
      } else {
        res
          .status(200)
          .json({ status: 200, message: message.usermessage.deletedrecord });
      }
      return delete_status;
    });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

exports.getOvertimePolicyByUserId = async (req, res, next) => {
  try {
    let get_one_data = await userOverTimePolicyAssign.findAll({
      where: {
        userMasterID: req.params.id,
        status: 1,
      },
      order: [['startDate', 'ASC']],
      include: [{ all: true }],
    });
    if (get_one_data.length == 1) {
      if (
        new Date(get_one_data[0].startDate).toISOString().slice(0, 10) >
        new Date().toISOString().slice(0, 10)
      ) {
        get_one_data[0].dataValues.overtimepolicystatus = 'deactive';
      } else {
        get_one_data[0].dataValues.overtimepolicystatus = 'active';
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
      for (var i = 0; i < get_one_data.length; i++) {
        let D1 = new Date(get_one_data[i].startDate);
        let D2;
        if (get_one_data[i].endDate == null) {
          D2 = null;
        } else {
          D2 = new Date(get_one_data[i].endDate);
        }

        let D3 = new Date();
        if (D3 == D1) {
          get_one_data[i].dataValues.overtimepolicystatus = 'active';
        } else if (D3 >= D1 && D3 <= D2 && D3 == D1) {
          get_one_data[i].dataValues.overtimepolicystatus = 'active';
        } else if (D2 == null && D1 <= D3) {
          get_one_data[i].dataValues.overtimepolicystatus = 'active';
        } else if (D3 > D1) {
          if (D1 == past) {
            get_one_data[i].dataValues.overtimepolicystatus = 'active';
          } else {
            get_one_data[i].dataValues.overtimepolicystatus = 'deactive';
          }
        } else {
          get_one_data[i].dataValues.overtimepolicystatus = 'deactive';
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
