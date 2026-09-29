const Checklist = require('../models/checklist');
const UserChecklist = require('../models/userCheckList');
const CheckListQuestion = require('../models/checkListQuestion');
const UserMaster = require('../models/userMaster');
const Sequelize = require('sequelize');
const logger = require('../config/logger');
const message = require('../response_message/message');
const sequelize = require('../config/database');
const jwt = require('jsonwebtoken');
const {
  employeeDesignation,
  getDatesFromDateRange,
  userDetails,
} = require('../utils/commonUtilFunctions');
const { generateChecklistExcel } = require('../utils/exportData');
const { accessibleUsers } = require('../utils/commonUtilFunctions');

exports.AddUserChecklist = async (req, res, next) => {
  try {
    let {
      checkListID,
      userMasterID,
      date,
      filledChecklistQID,
      filledChecklistQDate,
      createBy,
      createByIp,
    } = await req.body;

    let findById_db_1 = await UserChecklist.findOne({
      where: {
        userMasterID: userMasterID,
        checkListID: checkListID,
        date: date,
      },
    });

    if (findById_db_1) {
      return res.status(200).json({
        status: 401,
        message: 'CheckList already added for these date',
      });
    }
    const dates = [];
    dates.push(new Date());

    let insert_db_1;
    let result = await sequelize.transaction(async (t) => {
      insert_db_1 = await UserChecklist.create(
        {
          checkListID,
          userMasterID,
          date,
          filledChecklistQID,
          filledChecklistQDate: dates,
          createBy,
          createByIp,
        },
        { transaction: t }
      );
    });

    return res.status(200).json({
      status: 200,
      id: insert_db_1.userChecklistID,
      message: 'CheckList Added Successfully',
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 401;
    }
    next(err.message);
  }
};

exports.getByIdUserChecklist = async (req, res, next) => {
  try {
    let findById_db_1;
    let result = await sequelize.transaction(async (t) => {
      findById_db_1 = await UserChecklist.findOne(
        {
          where: {
            userChecklistID: req.params.id,
          },
          include: [
            {
              model: Checklist,
            },
            {
              model: UserMaster,
            },
          ],
        },
        { transaction: t }
      );

      if (findById_db_1) {
        let find_Question = await CheckListQuestion.findAll(
          {
            where: {
              checkListID: findById_db_1.checkListID,
            },
          },
          { transaction: t }
        );
        findById_db_1.CheckListQuestion = find_Question;
      }
    });

    res.status(200).json({
      status: 200,
      message: 'UserChecklist got Successfully',
      data: findById_db_1,
    });

    return findById_db_1;
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 401;
    }
    next(err.message);
  }
};

exports.updateByIdUserChecklist = async (req, res, next) => {
  try {
    let {
      userChecklistID,
      checkListID,
      userMasterID,
      date,
      filledChecklistQID,
      currPosition,
      updateBy,
      updateByIp,
    } = await req.body;

    const findById_db_1 = await UserChecklist.findOne({
      where: {
        userChecklistID: userChecklistID,
      },
      raw: true,
    });

    if (currPosition != null) {
      findById_db_1.filledChecklistQDate.splice(currPosition, 1);
    } else {
      findById_db_1.filledChecklistQDate.push(new Date());
    }

    let result = await sequelize.transaction(async (t) => {
      let updateById_db_1 = await UserChecklist.update(
        {
          checkListID,
          userMasterID,
          date,
          filledChecklistQID,
          filledChecklistQDate: findById_db_1.filledChecklistQDate,
          updateBy,
          updateByIp,
        },
        {
          where: { userChecklistID: userChecklistID },
        },
        { transaction: t }
      );
    });
    res.status(200).json({
      status: 200,
      message: 'CheckList updated Successfully',
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 401;
    }
    next(err.message);
  }
};

exports.getByUserChecklist = async (req, res, next) => {
  try {
    const { limit, page, userMasterID, searchQuery, fromDate, toDate } = await req.body;
    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }
    const condition = {};
    condition.status = 1;
    condition.userMasterID = userMasterID;

    if (fromDate && toDate)
      condition.date = {
        [Sequelize.Op.between]: [new Date(fromDate), new Date(toDate)],
      };

    if (searchQuery) condition[Sequelize.Op.or] = [
      {
        '$checklist.checkListName$': {
          [Sequelize.Op.iLike]: '%' + searchQuery + '%',
        },
      },
      {
        '$userMaster.displayName$': {
          [Sequelize.Op.iLike]: '%' + searchQuery + '%',
        },
      },
    ]

    const checkListData = await UserChecklist.findAndCountAll({
      raw: true,
      where: condition,
      ...paginationQuery,
      order: [['date', 'DESC']],
      include: [{ model: Checklist }, {
        model: UserMaster, required: true,
        ...accessibleUsers(req.userDetails)
      }],
    });

    return res.status(200).json({
      status: 200,
      message: 'User Checklist got successfully',
      data: checkListData.rows,
      totalcount: checkListData.count,
      date: new Date().toISOString().slice(0, 10),
    });
  } catch (err) {
    next(err.message);
  }
};

exports.getCheckListbyUserID = async (req, res, next) => {
  try {
    let get_all_checklist = [];

    let designation = await employeeDesignation(req.params.id, new Date());
    if (designation) {
      get_all_checklist = await Checklist.findAll({
        where: {
          designationId: designation.designationID,
          status: 1,
        },
      });
    }

    res.status(200).json({
      status: 200,
      message: 'Checklist got Successfully',
      data: get_all_checklist,
    });

    return get_all_checklist;
  } catch (err) {
    next(err.message);
  }
};

exports.listAdminCheckList = async (req, res, next) => {
  try {
    const {
      page,
      limit,
      userMasterID,
      fromDate,
      toDate,
      checkListID,
      searchQuery,
      companyMasterID,
      excelData,
      withDate,
    } = req.body;
    const userID = userMasterID;

    if (excelData) {
      const FinalObject = [];
      const CheckListNames = [];
      for (const checklist_id of checkListID) {
        const checkListName = await Checklist.findOne({
          where: { checkListID: checklist_id, status: [0, 1] },
          raw: true,
        });
        CheckListNames.push(checkListName.checkListName);

        const objectForExcel = [];

        const datesArray = await getDatesFromDateRange(
          new Date(fromDate),
          new Date(toDate)
        );

        const checkListQuestions = await CheckListQuestion.findAll({
          where: {
            checkListID: checklist_id ? checklist_id : 1,
            status: [0, 1],
          },
          raw: true,
        });

        for (let userMasterID of userID) {
          let i = 0;
          const data = {
            ['User Name']: '',
            ['User Number']: '',
            ['Checklist question']: '',
          };
          objectForExcel.push(data);

          const user_details = await userDetails(userMasterID);

          if (checkListQuestions.length > 0) {
            for (let checkListQuestionID of checkListQuestions) {
              let data;
              if (i == 0) {
                data = {
                  ['User Name']: user_details.displayName,
                  ['User Number']: user_details.userNumber,
                  ['Checklist question']: checkListQuestionID.checkListQuestion,
                };
              } else {
                data = {
                  ['User Name']: '',
                  ['User Number']: '',
                  ['Checklist question']: checkListQuestionID.checkListQuestion,
                };
              }
              i++;

              for (let dates of datesArray) {
                const UsercheckList = await UserChecklist.findOne({
                  raw: true,
                  where: {
                    userMasterID: userMasterID,
                    date: dates,
                    filledChecklistQID: {
                      [Sequelize.Op.contains]: [
                        checkListQuestionID.checkListQuestionID,
                      ],
                    },
                  },
                });

                if (UsercheckList) {
                  if (withDate) {
                    let index = UsercheckList.filledChecklistQID.indexOf(
                      checkListQuestionID.checkListQuestionID
                    );
                    data[`${new Date(dates).toISOString().slice(0, 10)}`] =
                      new Date(
                        UsercheckList.filledChecklistQDate[index]
                      ).toLocaleString();
                  } else {
                    data[`${new Date(dates).toISOString().slice(0, 10)}`] =
                      '\u2713';
                  }
                } else {
                  data[`${new Date(dates).toISOString().slice(0, 10)}`] = '';
                }
              }

              objectForExcel.push(data);
            }
          } else {
            for (let dates of datesArray) {
              data[`${new Date(dates).toISOString().slice(0, 10)}`] = '';
            }
          }
        }

        FinalObject.push(objectForExcel);
      }

      await generateChecklistExcel(
        FinalObject,
        `CheckList-Report`,
        `xlsx`,
        res,
        CheckListNames
      );
    } else {
      const condition = {};

      if (userID.length == 0)
        condition['$userMaster.companyMasterId$'] = companyMasterID;
      else condition.userMasterID = userID;

      if (checkListID) condition.checkListID = checkListID;

      if (fromDate && toDate)
        condition.date = {
          [Sequelize.Op.between]: [new Date(fromDate), new Date(toDate)],
        };
      if (searchQuery)
        condition[Sequelize.Op.or] = [
          {
            '$checklist.checkListName$': {
              [Sequelize.Op.iLike]: '%' + searchQuery + '%',
            },
          },
          {
            '$userMaster.displayName$': {
              [Sequelize.Op.iLike]: '%' + searchQuery + '%',
            },
          },
        ];

      const order = [['date', 'DESC']];

      const paginationQuery = {};
      if (page && limit) {
        paginationQuery.offset = (page - 1) * limit;
        paginationQuery.limit = limit;
      }
      const checkList = await UserChecklist.findAndCountAll({
        raw: true,
        where: condition,
        ...paginationQuery,
        order,
        include: [{ model: Checklist }, {
          model: UserMaster, required: true,
          ...accessibleUsers(req.userDetails)
        }],
      });

      return res.status(200).json({
        message: 'Ticket fetched Successfully',
        status: 200,
        data: checkList.rows,
        totalcount: checkList.count,
      });
    }
  } catch (err) {
    next(err);
  }
};

exports.getByDateandUserIDUserChecklist = async (req, res, next) => {
  try {
    const { checkListID, userMasterID, date } = req.body;

    let findById_db_1;
    let result = await sequelize.transaction(async (t) => {
      findById_db_1 = await UserChecklist.findOne(
        {
          where: {
            checkListID: checkListID,
            userMasterID: userMasterID,
            date: date,
            status: 1,
          },
          include: [
            {
              model: Checklist,
            },
            {
              model: UserMaster,
            },
          ],
        },
        { transaction: t }
      );

      if (findById_db_1) {
        let find_Question = await CheckListQuestion.findAll(
          {
            where: {
              checkListID: findById_db_1.checkListID,
            },
          },
          { transaction: t }
        );
        findById_db_1.CheckListQuestion = find_Question;
      }
    });

    res.status(200).json({
      status: 200,
      message: 'UserChecklist got Successfully',
      data: findById_db_1,
    });

    return findById_db_1;
  } catch (err) {
    next(err.message);
  }
};
