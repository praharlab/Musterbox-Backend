const Sequelize = require('sequelize');
// const UserMaster = require('../models/userMaster');
const ExpensePriceRule = require('../models/expencePriceRule');
const logger = require('../config/logger');
const message = require('../response_message/message');
const expenseHead = require('../models/expenseHead');
var nearest = require('nearest-date');
const { asiaKolkataDateTime } = require('../utils/commonUtilFunctions');

/**
 * save employee department data.
 *
 * @body {createBy} createBy user id of user who added the employee department.
 * @body {number} createBy if any user change data then updateBy id change.
 
 */
exports.postAddExpensePriceRule = async (req, res, next) => {
  try {
    let = { expenseHeadId, rule, applicableDate, createBy, createByIp } =
      await req.body;
    let maindate = [];
    let get_one_data = await ExpensePriceRule.findAll({
      where: {
        expenseHeadId: expenseHeadId,
        status: ['0', '1'],
      },
      include: [{ all: true }],
    });

    for (var i = 0; i < get_one_data.length; i++) {
      maindate.push(new Date(get_one_data[i].applicableDate));
    }
    if (get_one_data.length > 0) {
      let get_deactive = await ExpensePriceRule.findAll({
        where: {
          expenseHeadId: expenseHeadId,
          status: 0,
        },
        include: [{ all: true }],
      });

      let date = [];
      for (var i = 0; i < get_deactive.length; i++) {
        date.push(new Date(get_deactive[i].applicableDate));
      }
      date.push(new Date(applicableDate));

      date.sort((val1, val2) => {
        return new Date(val1) - new Date(val2);
      });
      let get_one_data1 = await ExpensePriceRule.findOne({
        where: {
          expenseHeadId: expenseHeadId,
          status: 1,
        },
        include: [{ all: true }],
      });
      if (get_one_data1) {
        var index = nearest(date, new Date(get_one_data1.applicableDate));
        if (new Date(get_one_data1.applicableDate) > new Date(applicableDate)) {
          const result = maindate.filter(checkdate);

          function checkdate(date) {
            return (
              date.toISOString().slice(0, 10) ==
              new Date().toISOString().slice(0, 10)
            );
          }
          if (result.length > 0) {
            let status = 0;
            let date2 = [];
            let get_deactive1 = await ExpensePriceRule.findAll({
              where: {
                expenseHeadId: expenseHeadId,
                status: [0, 1],
              },
              include: [{ all: true }],
            });
            for (var i = 0; i < get_deactive1.length; i++) {
              date2.push(new Date(get_deactive1[i].applicableDate));
            }

            const result = date2.filter(checkdate);

            function checkdate(date) {
              return new Date(date) > new Date(applicableDate);
            }
            var index2 = nearest(result, new Date(applicableDate));
            let insert_db_status = await ExpensePriceRule.create({
              expenseHeadId,
              rule,
              applicableDate,
              endDate: new Date(result[index2].getTime() - 86400000),
              status,
              createBy,
              createByIp,
            });

            const result1 = date2.filter(checkdate1);

            function checkdate1(date) {
              return new Date(date) < new Date(applicableDate);
            }
            if (result1.length > 0) {
              var index3 = nearest(
                result1,
                new Date(insert_db_status.applicableDate)
              );

              let new1 = new Date(insert_db_status.applicableDate);
              let datachange1 = await ExpensePriceRule.update(
                {
                  endDate: new Date(new1 - 3600 * 1000 * 24),
                },
                {
                  where: {
                    applicableDate: new Date(result1[index3]),
                  },
                }
              );
            }
          } else if (
            new Date(get_one_data1.applicableDate) > new Date(applicableDate)
          ) {
            let get_deactive1 = await ExpensePriceRule.findAll({
              where: {
                expenseHeadId: expenseHeadId,
              },
              include: [{ all: true }],
            });
            let status = 0;

            let date1 = [];
            for (var i = 0; i < get_deactive1.length; i++) {
              date1.push(new Date(get_deactive1[i].applicableDate));
            }

            const result = date1.filter(checkdate);

            function checkdate(date) {
              return new Date(date) > new Date(applicableDate);
            }
            var index1 = nearest(result, new Date(applicableDate));

            let insert_db_status = await ExpensePriceRule.create({
              expenseHeadId,
              rule,
              applicableDate,
              endDate: new Date(result[index1].getTime() - 86400000),
              status,
              createBy,
              createByIp,
            });
            const result1 = date1.filter(checkdate1);

            function checkdate1(date) {
              return new Date(date) < new Date(applicableDate);
            }
            if (result1.length > 0) {
              var index3 = nearest(
                result1,
                new Date(insert_db_status.applicableDate)
              );
              let new1 = new Date(insert_db_status.applicableDate);
              let datachange1 = await ExpensePriceRule.update(
                {
                  endDate: new Date(new1 - 3600 * 1000 * 24),
                },
                {
                  where: {
                    applicableDate: new Date(result1[index3]),
                  },
                }
              );
            }
          } else {
            let get_deactive1 = await ExpensePriceRule.findAll({
              where: {
                expenseHeadId: expenseHeadId,
                status: [0, 1],
              },
              include: [{ all: true }],
            });
            let status = 1;

            let date1 = [];
            for (var i = 0; i < get_deactive1.length; i++) {
              date1.push(new Date(get_deactive1[i].applicableDate));
            }

            const result = date1.filter(checkdate);

            function checkdate(date) {
              return new Date(date) > new Date(applicableDate);
            }
            var index1 = nearest(result, new Date(applicableDate));

            let insert_db_status = await ExpensePriceRule.create({
              expenseHeadId,
              rule,
              applicableDate,
              endDate: new Date(result[index1].getTime() - 86400000),
              status,
              createBy,
              createByIp,
            });
          }
        } else if (
          new Date(get_one_data1.applicableDate).toISOString().slice(0, 10) ==
            new Date().toISOString().slice(0, 10) &&
          new Date().getDate() == new Date(applicableDate).getDate()
        ) {
          let new1 = new Date(applicableDate);
          let datachange1 = await ExpensePriceRule.update(
            {
              status: 0,
              endDate: new Date(new1),
            },
            {
              where: {
                expenseHeadId: expenseHeadId,
                status: 1,
              },
            }
          );
          let get_deactive3 = await ExpensePriceRule.findAll({
            where: {
              expenseHeadId: expenseHeadId,
              status: 0,
            },
            include: [{ all: true }],
          });
          let date4 = [];
          for (var i = 0; i < get_deactive3.length; i++) {
            date4.push(new Date(get_deactive3[i].applicableDate));
          }
          const result = date4.filter(checkdate);

          function checkdate(date) {
            return new Date(date) > new Date(applicableDate);
          }
          var index4 = nearest(result, new Date(applicableDate));
          let status = 1;

          if (result.length > 0) {
            let insert_db_status = await ExpensePriceRule.create({
              expenseHeadId,
              rule,
              applicableDate,
              endDate: new Date(result[index4].getTime() - 86400000),
              status,
              createBy,
              createByIp,
            });
          } else {
            let insert_db_status = await ExpensePriceRule.create({
              expenseHeadId,
              rule,
              applicableDate,
              status,
              createBy,
              createByIp,
            });
          }
        } else if (
          new Date(applicableDate).toISOString().slice(0, 10) ==
          new Date().toISOString().slice(0, 10)
        ) {
          let new1 = new Date(applicableDate);
          let datachange1 = await ExpensePriceRule.update(
            {
              status: 0,
              endDate: new Date(new1 - 3600 * 1000 * 24),
            },
            {
              where: {
                expenseHeadId: expenseHeadId,
                status: 1,
              },
            }
          );
          let get_deactive3 = await ExpensePriceRule.findAll({
            where: {
              expenseHeadId: expenseHeadId,
              status: 0,
            },
            include: [{ all: true }],
          });
          let date4 = [];
          for (var i = 0; i < get_deactive3.length; i++) {
            date4.push(new Date(get_deactive3[i].applicableDate));
          }
          const result = date4.filter(checkdate);

          function checkdate(date) {
            return new Date(date) > new Date(applicableDate);
          }
          var index4 = nearest(result, new Date(applicableDate));
          let status = 1;

          if (result.length > 0) {
            let insert_db_status = await ExpensePriceRule.create({
              expenseHeadId,
              rule,
              applicableDate,
              endDate: new Date(result[index4].getTime() - 86400000),
              status,
              createBy,
              createByIp,
            });
          } else {
            let insert_db_status = await ExpensePriceRule.create({
              expenseHeadId,
              rule,
              applicableDate,
              status,
              createBy,
              createByIp,
            });
          }
        } else if (
          new Date(applicableDate).toISOString().slice(0, 10) ==
          new Date(get_one_data1.applicableDate).toISOString().slice(0, 10)
        ) {
          return res.status(200).json({
            status: 401,
            message: message.usermessage.applicabledate,
            data: {},
          });
        } else if (
          new Date(get_one_data1.applicableDate) < new Date(applicableDate) &&
          new Date(applicableDate) < new Date()
        ) {
          let new1 = new Date(applicableDate);
          let datachange1 = await ExpensePriceRule.update(
            {
              status: 0,
              endDate: new Date(new1 - 3600 * 1000 * 24),
            },
            {
              where: {
                expenseHeadId: expenseHeadId,
                status: 1,
              },
            }
          );
          let status = 1;
          let insert_db_status = await ExpensePriceRule.create({
            expenseHeadId,
            rule,
            applicableDate,
            status,
            createBy,
            createByIp,
          });
          let get_deactive1 = await ExpensePriceRule.findAll({
            where: {
              expenseHeadId: expenseHeadId,
              status: 0,
            },
            include: [{ all: true }],
          });
          let date1 = [];
          for (var i = 0; i < get_deactive1.length; i++) {
            date1.push(get_deactive1[i].applicableDate);
          }
          const result = date1.filter(checkdate);

          function checkdate(date) {
            return new Date(date) > new Date(applicableDate);
          }

          var index1 = nearest(result, new Date(applicableDate));

          let datachange = await ExpensePriceRule.update(
            {
              endDate: new Date(result[index1].getTime() - 86400000),
            },
            {
              where: {
                expenseHeadId: expenseHeadId,
                status: 1,
              },
            }
          );
        } else if (
          new Date(get_one_data1.applicableDate) < new Date(applicableDate)
        ) {
          let status = 0;
          let insert_db_status = await ExpensePriceRule.create({
            expenseHeadId,
            rule,
            applicableDate,
            status,
            createBy,
            createByIp,
          });
          let get_deactive1 = await ExpensePriceRule.findAll({
            where: {
              expenseHeadId: expenseHeadId,
              status: 0,
            },
            include: [{ all: true }],
          });
          let date1 = [];
          for (var i = 0; i < get_deactive1.length; i++) {
            date1.push(get_deactive1[i].applicableDate);
          }

          const result = date1.filter(checkdate);

          function checkdate(date) {
            return new Date(date) > new Date(get_one_data1.applicableDate);
          }

          var index1 = nearest(result, new Date(get_one_data1.applicableDate));
          let datachange = await ExpensePriceRule.update(
            {
              endDate: new Date(result[index1].getTime() - 86400000),
            },
            {
              where: {
                expenseHeadId: expenseHeadId,
                status: 1,
              },
            }
          );
        } else {
          let status = 0;
          let insert_db_status = await ExpensePriceRule.create({
            expenseHeadId,
            rule,
            applicableDate,
            status,
            createBy,
            createByIp,
          });
          let get_deactive1 = await ExpensePriceRule.findAll({
            where: {
              expenseHeadId: expenseHeadId,
              status: 0,
            },
            include: [{ all: true }],
          });
          let date1 = [];
          for (var i = 0; i < get_deactive1.length; i++) {
            date1.push(get_deactive1[i].applicableDate);
          }

          const result = date1.filter(checkdate);

          function checkdate(date) {
            return new Date(date) >= new Date(applicableDate);
          }
          var index1 = nearest(result, new Date(get_one_data1.applicableDate));
          let datachange = await ExpensePriceRule.update(
            {
              endDate: new Date(result[index1].getTime() - 86400000),
            },
            {
              where: {
                expenseHeadId: expenseHeadId,
                status: 1,
              },
            }
          );
        }
      } else {
        if (
          new Date(applicableDate).toISOString().slice(0, 10) <
          new Date().toISOString().slice(0, 10)
        ) {
          let status = 1;
          let date1 = [];
          let get_deactive1 = await ExpensePriceRule.findAll({
            where: {
              expenseHeadId: expenseHeadId,
              status: [0, 1],
            },
            include: [{ all: true }],
          });
          for (var i = 0; i < get_deactive1.length; i++) {
            date1.push(new Date(get_deactive1[i].applicableDate));
          }
          const result = date1.filter(checkdate);

          function checkdate(date) {
            return new Date(date) > new Date(applicableDate);
          }
          var index1 = nearest(result, new Date(applicableDate));

          let insert_db_status = await ExpensePriceRule.create({
            expenseHeadId,
            rule,
            endDate: new Date(result[index1].getTime() - 86400000),
            applicableDate,
            status,
            createBy,
            createByIp,
          });
        } else if (
          new Date(applicableDate).toISOString().slice(0, 10) ==
          new Date().toISOString().slice(0, 10)
        ) {
          let status = 1;
          let date1 = [];
          let get_deactive1 = await ExpensePriceRule.findAll({
            where: {
              expenseHeadId: expenseHeadId,
              status: [0, 1],
            },
            include: [{ all: true }],
          });
          for (var i = 0; i < get_deactive1.length; i++) {
            date1.push(new Date(get_deactive1[i].applicableDate));
          }
          const result = date1.filter(checkdate);
          var index1 = nearest(result, new Date(applicableDate));
          function checkdate(date) {
            return new Date(date) > new Date(applicableDate);
          }
          if (result.length > 0) {
            let insert_db_status = await ExpensePriceRule.create({
              expenseHeadId,
              rule,
              applicableDate,
              endDate: new Date(result[index1].getTime() - 86400000),
              status,
              createBy,
              createByIp,
            });
          } else {
            let insert_db_status = await ExpensePriceRule.create({
              expenseHeadId,
              rule,
              applicableDate,
              endDate: null,
              status,
              createBy,
              createByIp,
            });
          }
        } else {
          let status = 0;
          let insert_db_status = await ExpensePriceRule.create({
            expenseHeadId,
            rule,
            applicableDate,
            status,
            createBy,
            createByIp,
          });
        }

        return res.status(200).json({
          status: 200,
          message: message.usermessage.expensepriceruleadd,
          data: {},
        });
      }

      return res.status(200).json({
        status: 200,
        message: message.usermessage.expensepriceruleadd,
        data: {},
      });
    } else {
      if (new Date(applicableDate) < new Date()) {
        let status = 1;
        let insert_db_status = await ExpensePriceRule.create({
          expenseHeadId,
          rule,
          applicableDate,
          status,
          createBy,
          createByIp,
        });
      } else if (
        new Date(applicableDate).toISOString().slice(0, 10) ==
        new Date().toISOString().slice(0, 10)
      ) {
        let status = 1;
        let insert_db_status = await ExpensePriceRule.create({
          expenseHeadId,
          rule,
          applicableDate,
          status,
          createBy,
          createByIp,
        });
      } else {
        let status = 0;
        let insert_db_status = await ExpensePriceRule.create({
          expenseHeadId,
          rule,
          applicableDate,
          status,
          createBy,
          createByIp,
        });
      }

      return res.status(200).json({
        status: 200,
        message: message.usermessage.expensepriceruleadd,
        data: {},
      });
    }
  } catch (err) {
    next(err);
  }
};

/**
 return all employee department data 
 */

exports.getAllExpensePriceRuleData = async (req, res, next) => {
  try {
    let { limit, page } = await req.body;
    let offset = (page - 1) * limit;
    let employee_department = [];
    if (limit == '' && page == '') {
      employee_department = await ExpensePriceRule.findAll({
        include: [{ all: true }],
        where: {
          status: {
            [Sequelize.Op.in]: [0, 1],
          },
        },
        order: [['applicableDate', 'ASC']],
      });
    } else {
      employee_department = await ExpensePriceRule.findAll({
        include: [{ all: true }],
        where: {
          status: {
            [Sequelize.Op.in]: [0, 1],
          },
        },
        limit: limit,
        offset: offset,
        order: [['applicableDate', 'ASC']],
      });
    }

    const totalcount = await ExpensePriceRule.count({
      raw: true,
      where: { status: ['0', '1'] },
    });

    res
      .status(200)
      .json({ status: 200, data: employee_department, totalcount: totalcount });
  } catch (err) {
    next(err);
  }
};

/**
 * find data with epmployeeDepartment id
 *
 * @param {id} expensePriceRuleID  to fetch employee department
 */

exports.getExpensePriceRuleById = async (req, res, next) => {
  try {
    let get_one_data = await ExpensePriceRule.findOne({
      where: {
        expensePriceRuleID: req.params.id,
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
      },
      include: [{ all: true }],
    });

    if (!get_one_data)
      res
        .status(200)
        .json({ status: 200, message: message.usermessage.deletedrecord });
    res.status(200).json({ status: 200, data: get_one_data });
  } catch (err) {
    next(err);
  }
};

/**
 * find data with userMaster id
 *
 * @param {id} userMasterID  to fetch employee department
 */

exports.getExpensePriceRuleByHeadId = async (req, res, next) => {
  try {
    let get_one_data = await ExpensePriceRule.findAll({
      where: {
        expenseHeadId: req.params.id,
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
      },
      order: [['applicableDate', 'ASC']],
      include: [{ all: true }],
    });

    if (!get_one_data)
      res
        .status(200)
        .json({ status: 200, message: message.usermessage.deletedrecord });
    res.status(200).json({ status: 200, data: get_one_data });
  } catch (err) {
    next(err);
  }
};

/**
 * update data
 *
 * @param {id} expensePriceRuleID  to update id
 */
exports.postUpdateExpensePriceRule = async (req, res, next) => {
  try {
    let = {
      expensePriceRuleID,
      expenseHeadId,
      rule,
      applicableDate,
      updateBy,
      updateByIp,
    } = await req.body;
    let updatedata = await ExpensePriceRule.findOne({
      where: {
        expensePriceRuleID: expensePriceRuleID,
      },
      include: [{ all: true }],
    });
    let maindate = [];
    let get_one_data = await ExpensePriceRule.findAll({
      where: {
        expenseHeadId: expenseHeadId,
        status: ['0', '1'],
      },
      include: [{ all: true }],
    });

    for (var i = 0; i < get_one_data.length; i++) {
      maindate.push(new Date(get_one_data[i].applicableDate));
    }
    if (get_one_data.length > 0) {
      let get_deactive = await ExpensePriceRule.findAll({
        where: {
          expenseHeadId: expenseHeadId,
          status: 0,
        },
        include: [{ all: true }],
      });

      let date = [];
      for (var i = 0; i < get_deactive.length; i++) {
        date.push(new Date(get_deactive[i].applicableDate));
      }
      date.push(new Date(applicableDate));

      date.sort((val1, val2) => {
        return new Date(val1) - new Date(val2);
      });
      let get_one_data1 = await ExpensePriceRule.findOne({
        where: {
          expenseHeadId: expenseHeadId,
          status: 1,
        },
        include: [{ all: true }],
      });
      if (get_one_data1) {
        var index = nearest(date, new Date(get_one_data1.applicableDate));
        if (new Date(get_one_data1.applicableDate) > new Date(applicableDate)) {
          const result = maindate.filter(checkdate);

          function checkdate(date) {
            return (
              date.toISOString().slice(0, 10) ==
              new Date().toISOString().slice(0, 10)
            );
          }
          if (result.length > 0) {
            if (updatedata.status == 1) {
              let status = 1;
              let date2 = [];
              let get_deactive1 = await ExpensePriceRule.findAll({
                where: {
                  expenseHeadId: expenseHeadId,
                  status: [0, 1],
                  expensePriceRuleID: {
                    [Sequelize.Op.ne]: updatedata.expensePriceRuleID,
                  },
                },
                include: [{ all: true }],
              });
              for (var i = 0; i < get_deactive1.length; i++) {
                date2.push(new Date(get_deactive1[i].applicableDate));
              }

              const result = date2.filter(checkdate);

              function checkdate(date) {
                return new Date(date) > new Date(applicableDate);
              }
              var index2 = nearest(result, new Date(applicableDate));
              if (result.length > 0) {
                let change_data_status = await ExpensePriceRule.update(
                  {
                    expenseHeadId,
                    rule,
                    applicableDate,
                    endDate: new Date(result[index2].getTime() - 86400000),
                    status,
                    updateBy,
                    updateByIp,
                  },
                  {
                    where: { expensePriceRuleID: expensePriceRuleID },
                  }
                );
              } else {
                let change_data_status = await ExpensePriceRule.update(
                  {
                    expenseHeadId,
                    rule,
                    applicableDate,
                    endDate: null,
                    status,
                    updateBy,
                    updateByIp,
                  },
                  {
                    where: { expensePriceRuleID: expensePriceRuleID },
                  }
                );
              }

              const result1 = date2.filter(checkdate1);

              function checkdate1(date) {
                return new Date(date) < new Date(applicableDate);
              }

              if (result1.length > 0) {
                var index3 = nearest(result1, new Date(applicableDate));

                let new1 = new Date(applicableDate);
                let datachange1 = await ExpensePriceRule.update(
                  {
                    endDate: new Date(new1 - 3600 * 1000 * 24),
                  },
                  {
                    where: {
                      applicableDate: new Date(result1[index3]),
                    },
                  }
                );
              } else {
                let data4 = [];
                let get_deactive2 = await ExpensePriceRule.findAll({
                  where: {
                    expenseHeadId: expenseHeadId,
                    status: [0, 1],
                  },
                  include: [{ all: true }],
                });
                for (var i = 0; i < get_deactive2.length; i++) {
                  data4.push(new Date(get_deactive2[i].applicableDate));
                }

                const result4 = data4.filter(checkdate);

                function checkdate(date) {
                  return new Date(date) > new Date(applicableDate);
                }
                var index5 = nearest(result4, new Date(applicableDate));

                let datachange1 = await ExpensePriceRule.update(
                  {
                    endDate: new Date(result4[index5].getTime() - 86400000),
                  },
                  {
                    where: {
                      applicableDate: new Date(applicableDate),
                    },
                  }
                );
              }
            } else {
              let status = 0;
              let date2 = [];
              let get_deactive1 = await ExpensePriceRule.findAll({
                where: {
                  expenseHeadId: expenseHeadId,
                  status: [0, 1],
                },
                include: [{ all: true }],
              });
              for (var i = 0; i < get_deactive1.length; i++) {
                date2.push(new Date(get_deactive1[i].applicableDate));
              }

              const result = date2.filter(checkdate);

              function checkdate(date) {
                return new Date(date) > new Date(applicableDate);
              }
              var index2 = nearest(result, new Date(applicableDate));
              let change_data_status = await ExpensePriceRule.update(
                {
                  expenseHeadId,
                  rule,
                  applicableDate,
                  endDate: new Date(result[index2].getTime() - 86400000),
                  status,
                  updateBy,
                  updateByIp,
                },
                {
                  where: { expensePriceRuleID: expensePriceRuleID },
                }
              );

              const result1 = date2.filter(checkdate1);

              function checkdate1(date) {
                return new Date(date) < new Date(applicableDate);
              }

              if (result1.length > 0) {
                var index3 = nearest(result1, new Date(applicableDate));
                let new1 = new Date(applicableDate);
                let datachange1 = await ExpensePriceRule.update(
                  {
                    endDate: new Date(new1 - 3600 * 1000 * 24),
                  },
                  {
                    where: {
                      applicableDate: new Date(result1[index3]),
                    },
                  }
                );
              } else {
                let data4 = [];
                let get_deactive2 = await ExpensePriceRule.findAll({
                  where: {
                    expenseHeadId: expenseHeadId,
                    status: [0, 1],
                  },
                  include: [{ all: true }],
                });
                for (var i = 0; i < get_deactive2.length; i++) {
                  data4.push(new Date(get_deactive2[i].applicableDate));
                }
                const result4 = data4.filter(checkdate);

                function checkdate(date) {
                  return new Date(date) > new Date(applicableDate);
                }
                var index5 = nearest(result4, new Date(applicableDate));

                let datachange1 = await ExpensePriceRule.update(
                  {
                    endDate: new Date(result4[index5].getTime() - 86400000),
                  },
                  {
                    where: {
                      applicableDate: new Date(applicableDate),
                    },
                  }
                );
              }
            }
          } else if (
            new Date(get_one_data1.applicableDate) > new Date(applicableDate)
          ) {
            let get_deactive1 = await ExpensePriceRule.findAll({
              where: {
                expenseHeadId: expenseHeadId,
              },
              include: [{ all: true }],
            });
            let status = 0;

            let date1 = [];
            for (var i = 0; i < get_deactive1.length; i++) {
              date1.push(new Date(get_deactive1[i].applicableDate));
            }
            const result = date1.filter(checkdate);

            function checkdate(date) {
              return new Date(date) > new Date(applicableDate);
            }
            var index1 = nearest(result, new Date(applicableDate));

            let change_data_status = await ExpensePriceRule.update(
              {
                expenseHeadId,
                rule,
                applicableDate,
                endDate: new Date(result[index1].getTime() - 86400000),
                status,
                updateBy,
                updateByIp,
              },
              {
                where: { expensePriceRuleID: expensePriceRuleID },
              }
            );
            const result1 = date1.filter(checkdate1);

            function checkdate1(date) {
              return new Date(date) < new Date(applicableDate);
            }
            if (result1.length > 0) {
              var index3 = nearest(result1, new Date(applicableDate));
              let new1 = new Date(applicableDate);
              let datachange1 = await ExpensePriceRule.update(
                {
                  endDate: new Date(new1 - 3600 * 1000 * 24),
                },
                {
                  where: {
                    applicableDate: new Date(result1[index3]),
                  },
                }
              );
            }
          } else {
            let get_deactive1 = await ExpensePriceRule.findAll({
              where: {
                expenseHeadId: expenseHeadId,
                status: [0, 1],
              },
              include: [{ all: true }],
            });
            let status = 1;

            let date1 = [];
            for (var i = 0; i < get_deactive1.length; i++) {
              date1.push(new Date(get_deactive1[i].applicableDate));
            }

            const result = date1.filter(checkdate);

            function checkdate(date) {
              return new Date(date) > new Date(applicableDate);
            }
            var index1 = nearest(result, new Date(applicableDate));

            let change_data_status = await ExpensePriceRule.update(
              {
                expenseHeadId,
                rule,
                applicableDate,
                endDate: new Date(result[index1].getTime() - 86400000),
                status,
                updateBy,
                updateByIp,
              },
              {
                where: { expensePriceRuleID: expensePriceRuleID },
              }
            );
          }
        } else if (
          new Date(get_one_data1.applicableDate) == new Date() &&
          new Date().getDate() == new Date(applicableDate).getDate()
        ) {
          let new1 = new Date(applicableDate);
          let datachange1 = await ExpensePriceRule.update(
            {
              status: 0,
              endDate: new Date(new1),
            },
            {
              where: {
                expenseHeadId: expenseHeadId,
                status: 1,
              },
            }
          );
          let get_deactive3 = await ExpensePriceRule.findAll({
            where: {
              expenseHeadId: expenseHeadId,
              status: 0,
            },
            include: [{ all: true }],
          });
          let date4 = [];
          for (var i = 0; i < get_deactive3.length; i++) {
            date4.push(new Date(get_deactive3[i].applicableDate));
          }
          const result = date4.filter(checkdate);

          function checkdate(date) {
            return new Date(date) > new Date(applicableDate);
          }
          var index4 = nearest(result, new Date(applicableDate));
          let status = 1;

          if (result.length > 0) {
            let change_data_status = await ExpensePriceRule.update(
              {
                expenseHeadId,
                rule,
                applicableDate,
                endDate: new Date(result[index4].getTime() - 86400000),
                status,
                updateBy,
                updateByIp,
              },
              {
                where: { expensePriceRuleID: expensePriceRuleID },
              }
            );
          } else {
            let change_data_status = await ExpensePriceRule.update(
              {
                expenseHeadId,
                rule,
                applicableDate,
                status,
                updateBy,
                updateByIp,
              },
              {
                where: { expensePriceRuleID: expensePriceRuleID },
              }
            );
          }
        } else if (
          new Date(applicableDate).toISOString().slice(0, 10) ==
          new Date().toISOString().slice(0, 10)
        ) {
          let new1 = new Date(applicableDate);
          let datachange1 = await ExpensePriceRule.update(
            {
              status: 0,
              endDate: new Date(new1 - 3600 * 1000 * 24),
            },
            {
              where: {
                expenseHeadId: expenseHeadId,
                status: 1,
              },
            }
          );
          let get_deactive3 = await ExpensePriceRule.findAll({
            where: {
              expenseHeadId: expenseHeadId,
              status: 0,
            },
            include: [{ all: true }],
          });
          let date4 = [];
          for (var i = 0; i < get_deactive3.length; i++) {
            date4.push(new Date(get_deactive3[i].applicableDate));
          }
          const result = date4.filter(checkdate);

          function checkdate(date) {
            return new Date(date) > new Date(applicableDate);
          }
          var index4 = nearest(result, new Date(applicableDate));
          let status = 1;

          if (result.length > 0) {
            let change_data_status = await ExpensePriceRule.update(
              {
                expenseHeadId,
                rule,
                applicableDate,
                endDate: new Date(result[index4].getTime() - 86400000),
                status,
                updateBy,
                updateByIp,
              },
              {
                where: { expensePriceRuleID: expensePriceRuleID },
              }
            );
          } else {
            let change_data_status = await ExpensePriceRule.update(
              {
                expenseHeadId,
                rule,
                applicableDate,
                status,
                updateBy,
                updateByIp,
              },
              {
                where: { expensePriceRuleID: expensePriceRuleID },
              }
            );
          }
        } else if (
          new Date(applicableDate).toISOString().slice(0, 10) ==
          new Date(get_one_data1.applicableDate).toISOString().slice(0, 10)
        ) {
          return res.status(200).json({
            status: 401,
            message: message.usermessage.applicabledate,
            data: {},
          });
        } else if (
          new Date(get_one_data1.applicableDate) < new Date(applicableDate) &&
          new Date(applicableDate) < new Date()
        ) {
          let new1 = new Date(applicableDate);
          let datachange1 = await ExpensePriceRule.update(
            {
              status: 0,
              endDate: new Date(new1 - 3600 * 1000 * 24),
            },
            {
              where: {
                expenseHeadId: expenseHeadId,
                status: 1,
              },
            }
          );
          let status = 1;

          let change_data_status = await ExpensePriceRule.update(
            {
              expenseHeadId,
              rule,
              applicableDate,
              status,
              updateBy,
              updateByIp,
            },
            {
              where: { expensePriceRuleID: expensePriceRuleID },
            }
          );
          let get_deactive1 = await ExpensePriceRule.findAll({
            where: {
              expenseHeadId: expenseHeadId,
              status: 0,
            },
            include: [{ all: true }],
          });
          let date1 = [];
          for (var i = 0; i < get_deactive1.length; i++) {
            date1.push(get_deactive1[i].applicableDate);
          }
          const result = date1.filter(checkdate);

          function checkdate(date) {
            return new Date(date) > new Date(applicableDate);
          }

          var index1 = nearest(result, new Date(applicableDate));

          let datachange = await ExpensePriceRule.update(
            {
              endDate: new Date(result[index1].getTime() - 86400000),
            },
            {
              where: {
                expenseHeadId: expenseHeadId,
                status: 1,
              },
            }
          );
        } else if (
          new Date(get_one_data1.applicableDate) < new Date(applicableDate)
        ) {
          let status = 0;

          let change_data_status = await ExpensePriceRule.update(
            {
              expenseHeadId,
              rule,
              applicableDate,
              endDate: null,
              status,
              updateBy,
              updateByIp,
            },
            {
              where: { expensePriceRuleID: expensePriceRuleID },
            }
          );
          let get_deactive1 = await ExpensePriceRule.findAll({
            where: {
              expenseHeadId: expenseHeadId,
              status: [1, 0],
            },
            include: [{ all: true }],
          });
          let date1 = [];
          for (var i = 0; i < get_deactive1.length; i++) {
            date1.push(get_deactive1[i].applicableDate);
          }

          const result = date1.filter(checkdate);

          function checkdate(date) {
            return new Date(date) <= new Date(get_one_data1.applicableDate);
          }

          const result2 = date1.filter(checkdate1);

          function checkdate1(date) {
            return new Date(date) > new Date(get_one_data1.applicableDate);
          }

          var index1 = nearest(result, new Date(get_one_data1.applicableDate));
          var index2 = nearest(result2, new Date(result[index1]));

          let datachange = await ExpensePriceRule.update(
            {
              endDate: new Date(result2[index2].getTime() - 86400000),
            },
            {
              where: {
                applicableDate: new Date(result[index1]),
                status: 1,
              },
            }
          );
        } else {
          let status = 0;
          let change_data_status = await ExpensePriceRule.update(
            {
              expenseHeadId,
              rule,
              applicableDate,
              status,
              updateBy,
              updateByIp,
            },
            {
              where: { expensePriceRuleID: expensePriceRuleID },
            }
          );
          let get_deactive1 = await ExpensePriceRule.findAll({
            where: {
              expenseHeadId: expenseHeadId,
              status: 0,
            },
            include: [{ all: true }],
          });
          let date1 = [];
          for (var i = 0; i < get_deactive1.length; i++) {
            date1.push(get_deactive1[i].applicableDate);
          }
          const result = date1.filter(checkdate);

          function checkdate(date) {
            return new Date(date) >= new Date(applicableDate);
          }
          var index1 = nearest(result, new Date(get_one_data1.applicableDate));
          let datachange = await ExpensePriceRule.update(
            {
              endDate: new Date(result[index1].getTime() - 86400000),
            },
            {
              where: {
                expenseHeadId: expenseHeadId,
                status: 1,
              },
            }
          );
        }
      } else {
        if (
          new Date(applicableDate).toISOString().slice(0, 10) <
          new Date().toISOString().slice(0, 10)
        ) {
          let status = 1;
          let date1 = [];
          let get_deactive1 = await ExpensePriceRule.findAll({
            where: {
              expenseHeadId: expenseHeadId,
              status: [0, 1],
            },
            include: [{ all: true }],
          });
          for (var i = 0; i < get_deactive1.length; i++) {
            date1.push(new Date(get_deactive1[i].applicableDate));
          }
          const result = date1.filter(checkdate);

          function checkdate(date) {
            return new Date(date) > new Date(applicableDate);
          }
          var index1 = nearest(result, new Date(applicableDate));

          if (result.length > 0) {
            let change_data_status = await ExpensePriceRule.update(
              {
                expenseHeadId,
                rule,
                applicableDate,
                endDate: new Date(result[index1].getTime() - 86400000),
                status,
                updateBy,
                updateByIp,
              },
              {
                where: { expensePriceRuleID: expensePriceRuleID },
              }
            );
          } else {
            let change_data_status = await ExpensePriceRule.update(
              {
                expenseHeadId,
                rule,
                applicableDate,
                endDate: null,
                status,
                updateBy,
                updateByIp,
              },
              {
                where: { expensePriceRuleID: expensePriceRuleID },
              }
            );
          }
        } else if (
          new Date(applicableDate).toISOString().slice(0, 10) ==
          new Date().toISOString().slice(0, 10)
        ) {
          let status = 1;
          let date1 = [];
          let get_deactive1 = await ExpensePriceRule.findAll({
            where: {
              expenseHeadId: expenseHeadId,
              status: [0, 1],
            },
            include: [{ all: true }],
          });
          for (var i = 0; i < get_deactive1.length; i++) {
            date1.push(new Date(get_deactive1[i].applicableDate));
          }
          const result = date1.filter(checkdate);

          function checkdate(date) {
            return new Date(date) > new Date(applicableDate);
          }
          var index1 = nearest(result, new Date(applicableDate));

          let change_data_status = await ExpensePriceRule.update(
            {
              expenseHeadId,
              rule,
              applicableDate,
              endDate: new Date(result[index1].getTime() - 86400000),
              status,
              updateBy,
              updateByIp,
            },
            {
              where: { expensePriceRuleID: expensePriceRuleID },
            }
          );
        } else {
          let status = 0;
          let change_data_status = await ExpensePriceRule.update(
            {
              expenseHeadId,
              rule,
              applicableDate,
              status,
              updateBy,
              updateByIp,
            },
            {
              where: { expensePriceRuleID: expensePriceRuleID },
            }
          );
        }
        return res.status(200).json({
          status: 200,
          message: message.usermessage.expensepriceruleupdate,
          data: {},
        });
      }
    } else {
      if (
        new Date(applicableDate).toISOString().slice(0, 10) <
        new Date().toISOString().slice(0, 10)
      ) {
        let status = 1;
        let insert_db_status = await ExpensePriceRule.create({
          expenseHeadId,
          rule,
          applicableDate,
          status,
          createBy,
          createByIp,
        });
      } else if (
        new Date(applicableDate).toISOString().slice(0, 10) ==
        new Date().toISOString().slice(0, 10)
      ) {
        let status = 1;
        let change_data_status = await ExpensePriceRule.update(
          {
            expenseHeadId,
            rule,
            applicableDate,
            status,
            updateBy,
            updateByIp,
          },
          {
            where: { expensePriceRuleID: expensePriceRuleID },
          }
        );
      } else {
        let status = 0;
        let change_data_status = await ExpensePriceRule.update(
          {
            expenseHeadId,
            rule,
            applicableDate,
            status,
            updateBy,
            updateByIp,
          },
          {
            where: { expensePriceRuleID: expensePriceRuleID },
          }
        );
      }

      return res.status(200).json({
        status: 200,
        message: message.usermessage.expensepriceruleupdate,
        data: {},
      });
    }

    res.status(200).json({
      status: 200,
      message: message.usermessage.expensepriceruleupdate,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * update status
 *
 * @param {id} expensePriceRuleID  to update status of employee department
 */

exports.poststatuschange = async (req, res, next) => {
  try {
    let = { expensePriceRuleID, status } = await req.body;
    let delete_status;
    if (status == '1') {
      delete_status = await ExpensePriceRule.update(
        {
          status: '1',
        },
        {
          where: { expensePriceRuleID: expensePriceRuleID, status: ['1', '0'] },
        }
      );
    } else {
      delete_status = await ExpensePriceRule.update(
        {
          status: '0',
        },
        {
          where: { expensePriceRuleID: expensePriceRuleID, status: ['1', '0'] },
        }
      );
    }

    if (delete_status != 0) {
      res.status(200).json({
        status: 200,
        message: message.usermessage.expensepriceruledelete,
        data: {},
      });
    } else {
      res.status(200).json({
        status: 200,
        message: message.usermessage.deletedrecord,
        data: {},
      });
    }
  } catch (err) {
    next(err);
  }
};

/**
 * delete by i
 *
 * @param {id} expensePriceRuleID  to delete id
 */
exports.postDeleteExpensePriceRuleById = async (req, res, next) => {
  try {
    let = { expensePriceRuleID, expenseHeadId } = await req.body;
    let get_one_data1 = await ExpensePriceRule.findOne({
      where: {
        expensePriceRuleID: expensePriceRuleID,
      },
      include: [{ all: true }],
    });
    let delete_status = await ExpensePriceRule.update(
      {
        status: 2,
      },
      {
        where: { expensePriceRuleID: expensePriceRuleID },
      }
    );

    if (get_one_data1.status == 1) {
      let get_one_data2 = await ExpensePriceRule.findAll({
        where: {
          expenseHeadId: expenseHeadId,
          status: [1, 0],
        },
        include: [{ all: true }],
      });
      if (get_one_data2) {
        let date = [];
        for (var i = 0; i < get_one_data2.length; i++) {
          date.push(new Date(get_one_data2[i].applicableDate));
        }
        const result = date.filter(checkdate);
        var index1 = nearest(result, new Date(get_one_data1.applicableDate));
        function checkdate(date) {
          return new Date(date) > new Date(get_one_data1.applicableDate);
        }
        const result2 = date.filter(checkdate1);
        var index2 = nearest(result2, new Date(get_one_data1.applicableDate));
        function checkdate1(date) {
          return new Date(date) < new Date(get_one_data1.applicableDate);
        }

        if (result.length > 0 && result2.length > 0) {
          let get_one = await ExpensePriceRule.findOne({
            where: {
              applicableDate: new Date(result2[index2]),
            },
            include: [{ all: true }],
          });

          let backrecord = await ExpensePriceRule.update(
            {
              status: 1,
              endDate: new Date(result[index1].getTime() - 86400000),
            },
            {
              where: { expensePriceRuleID: get_one.expensePriceRuleID },
            }
          );
        } else if (result2.length > 0) {
          let backrecord = await ExpensePriceRule.update(
            {
              status: 1,
              endDate: null,
            },
            {
              where: { applicableDate: new Date(result2[index2]) },
            }
          );
        } else {
          console.log('error');
        }
      }
    } else {
      let get_one_data2 = await ExpensePriceRule.findAll({
        where: {
          expenseHeadId: expenseHeadId,
          status: [1, 0],
        },
        include: [{ all: true }],
      });
      let date = [];
      for (var i = 0; i < get_one_data2.length; i++) {
        date.push(new Date(get_one_data2[i].applicableDate));
      }
      const result = date.filter(checkdate);
      var index1 = nearest(result, new Date(get_one_data1.applicableDate));
      function checkdate(date) {
        return new Date(date) > new Date(get_one_data1.applicableDate);
      }
      const result2 = date.filter(checkdate1);
      var index2 = nearest(result2, new Date(get_one_data1.applicableDate));
      function checkdate1(date) {
        return new Date(date) < new Date(get_one_data1.applicableDate);
      }

      if (result.length > 0 && result2.length > 0) {
        let backrecord = await ExpensePriceRule.update(
          {
            endDate: new Date(result[index1].getTime() - 86400000),
          },
          {
            where: { applicableDate: new Date(result2[index2]) },
          }
        );
      } else if (result2.length > 0) {
        let status = 1;

        let backrecord = await ExpensePriceRule.update(
          {
            endDate: null,
          },
          {
            where: { applicableDate: new Date(result2[index2]) },
          }
        );
      } else {
        console.log('error');
      }
    }

    res.status(200).json({
      status: 200,
      message: message.usermessage.expensepriceruledelete,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * change status by applicable date
 *
 * @param {id} expensePriceRuleID  to change status of employee department
 */
exports.changeStatusByDate = async () => {
  try {
    // const today = new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' });

    const today = asiaKolkataDateTime(new Date()).slice(0, 10);

    let get_data = await ExpensePriceRule.findAll({
      attributes: ['expenseHeadId'],
      where: { applicableDate: today },
    });
    let expenseHeads = [];
    get_data.forEach((expenseHead) => {
      expenseHeads.push(expenseHead.expenseHeadId);
    });
    let department_active = await ExpensePriceRule.update(
      {
        status: 1,
      },
      {
        where: { applicableDate: new Date(today) },
      }
    );

    let deactive_prev = await ExpensePriceRule.update(
      {
        status: 0,
        endDate: new Date(today),
      },
      {
        where: {
          expenseHeadId: {
            [Sequelize.Op.in]: expenseHeads,
          },
          applicableDate: {
            [Sequelize.Op.ne]: new Date(today),
          },
        },
      }
    );

    return;
  } catch (err) {
    console.log(err);
  }
};

exports.getExpensePriceRuleByHeadid = async (req, res, next) => {
  try {
    const get_one_data = await ExpensePriceRule.findOne({
      where: {
        expenseHeadId: req.params.id,
        status: 1,
      },
    });

    return res.status(200).json({ status: 200, data: get_one_data });
  } catch (err) {
    next(err);
  }
};
