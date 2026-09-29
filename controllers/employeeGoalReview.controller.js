const EmployeeGoal = require('../models/employeeGoal');
const UserMaster = require('../models/userMaster');
const { generateExcel, getGradeForTarget } = require('../utils/exportData');
const { usermessage, errorMessage } = require('../response_message/message');
const {
  userAttributes,
  statusCodes,
  companyAttributes,
} = require('../utils/commonVars');
const GoalMaster = require('../models/goalMaster');
const companyMaster = require('../models/companyMaster');
const KRAMaster = require('../models/kramaster');
const KPIMaster = require('../models/kpimaster');
const { CustomError } = require('../utils/customError');
const EmployeeGoalReview = require('../models/employeeGoalReview');
const EmployeeGoalReviewFeedback = require('../models/employeeGoalReviewFeedback');
const { EmployeeGoalStatusEnum } = require('../utils/dbUtils');
const {
  employeeDesignation,
  asiaKolkataDateTime,
} = require('../utils/commonUtilFunctions');
const { generatePDF } = require('../utils/pdfGenerate');
const EmployeeDesignation = require('../models/employeeDesignation');
const { Sequelize } = require('sequelize');
const Designation = require('../models/designation');
const { cond } = require('lodash');
const Op = Sequelize.Op;
const { accessibleUsers } = require('../utils/commonUtilFunctions');
const GoalSetting = require('../models/goalSetting');
const EmployeeDepartment = require('../models/employeeDepartment');
const Department = require('../models/department');
const EmployeeBranch = require('../models/employeeBranch');
const BranchMaster = require('../models/branchMaster');
const EmployeeJoiningDetails = require('../models/employeeJoiningDetails');
const moment = require('moment');

exports.bulkCreateEmployeeGoalReview = async (req, res, next) => {
  try {
    const { employeeGoalId, userMasterID } = req.body;
    const companyFilter = {
      companyMasterID:
        req.userDetails.childCompanies.length > 0
          ? [...req.userDetails.childCompanies, req.userDetails.companyMasterId]
          : req.userDetails.companyMasterId,
    };
    const validEmployeeGoal = await EmployeeGoal.findByPk(employeeGoalId, {
      include: [
        {
          model: GoalMaster,
          attributes: ['id'],
          include: [
            {
              model: companyMaster,
              where: companyFilter,
            },
          ],
        },
      ],
      nest: true,
    });
    if (!validEmployeeGoal) {
      throw new CustomError(
        usermessage.invalidField('Employee Goal'),
        statusCodes.BAD_REQUEST
      );
    }

    const validUsers = await UserMaster.findAll({
      where: { userMasterID: userMasterID, status: 1 },
      include: {
        model: companyMaster,
        where: companyFilter,
      },
    });
    const validUserIds = validUsers.map((user) => user.userMasterID);
    const invalidUserIds = userMasterID.filter(
      (userId) => !validUserIds.includes(userId)
    );
    if (invalidUserIds.length > 0) {
      throw new CustomError(
        {
          message: usermessage.invalidField('user'),
          invalidUserIds: invalidUserIds.join(', '),
        },
        statusCodes.BAD_REQUEST
      );
    }

    const dataToInsert = userMasterID.flatMap((reviewerId) => ({
      employeeGoalId,
      reviewerId,
    }));

    await EmployeeGoalReview.bulkCreate(dataToInsert, {
      user: req.userDetails,
      individualHooks: true,
    });

    return res.status(statusCodes.OK).json({
      message: usermessage.addMessage('Employee Goal Reviews'),
    });
  } catch (error) {
    next(error);
  }
};

exports.updateEmployeeGoalReview = async (req, res, next) => {
  try {
    const { employeeGoalId, userMasterID, status, isCompleted } = req.body;
    const companyFilter = {
      companyMasterID:
        req.userDetails.childCompanies.length > 0
          ? [...req.userDetails.childCompanies, req.userDetails.companyMasterId]
          : req.userDetails.companyMasterId,
    };
    const employeeGoalReview = await EmployeeGoalReview.findByPk(
      req.params.id,
      {
        include: [
          {
            model: EmployeeGoal,
            include: [
              {
                model: GoalMaster,
                include: [{ model: companyMaster, where: companyFilter }],
              },
            ],
          },
        ],
      }
    );
    if (status) employeeGoalReview.status = status;
    if (isCompleted) employeeGoalReview.isCompleted = isCompleted;
    if (employeeGoalId) {
      const validEmployeeGoal = await EmployeeGoal.findByPk(employeeGoalId, {
        include: [
          {
            model: GoalMaster,
            attributes: ['id'],
            include: [
              {
                model: companyMaster,
                where: companyFilter,
              },
            ],
          },
        ],
        nest: true,
      });
      if (!validEmployeeGoal)
        throw new CustomError(
          usermessage.notFoundMessage('Employee Goal'),
          statusCodes.NOT_FOUND
        );
      employeeGoalReview.employeeGoalId = employeeGoalId;
    }
    if (userMasterID) {
      const validUsers = await UserMaster.findAll({
        where: { userMasterID: userMasterID, status: 1 },
        include: {
          model: companyMaster,
          where: companyFilter,
        },
      });
      if (!validUsers)
        throw new CustomError(
          usermessage.notFoundMessage('reviewer'),
          statusCodes.NOT_FOUND
        );

      employeeGoalReview.reviewerId = userMasterID;
    }

    await employeeGoalReview.save({ user: req.userDetails });
    return res.status(statusCodes.OK).json({
      message: usermessage.updateMessage('Employee Goal Review'),
    });
  } catch (err) {
    next(err);
  }
};

exports.getEmployeeGoalReviewDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyFilter = {
      companyMasterID:
        req.userDetails.childCompanies.length > 0
          ? [...req.userDetails.childCompanies, req.userDetails.companyMasterId]
          : req.userDetails.companyMasterId,
    };
    const employeeGoalReview = await EmployeeGoalReview.findByPk(id, {
      include: [
        {
          model: EmployeeGoal,
          include: [
            {
              model: GoalMaster,
              include: [
                {
                  model: companyMaster,
                  where: companyFilter,
                  attributes: companyAttributes,
                },
                { model: KRAMaster, include: [{ model: KPIMaster }] },
              ],
            },
            {
              model: UserMaster,
              as: 'goalAssignedTo',
              attributes: userAttributes,
            },
          ],
        },
        {
          model: UserMaster,
          as: 'reviewer',
          attributes: userAttributes,
        },
        { model: EmployeeGoalReviewFeedback },
      ],
    });
    if (!employeeGoalReview)
      throw new CustomError(
        usermessage.notFoundMessage('Employee Goal Review'),
        statusCodes.NOT_FOUND
      );

    return res.status(statusCodes.OK).json({
      data: employeeGoalReview,
      message: usermessage.fetchMessage('Employee Goal Review'),
    });
  } catch (err) {
    next(err);
  }
};

exports.listEmployeeGoals = async (req, res, next) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      withDeleted,
      goalMasterId,
      userMasterID,
      revieweeId,
      companyMasterID,
      sortByField,
      sortByValue,
      exportData,
      exportFileType,
    } = req.query;

    const condition = {};
    if (userMasterID) condition.reviewerId = userMasterID;
    const companyFilter = {
      companyMasterID:
        req.userDetails.childCompanies.length > 0
          ? [...req.userDetails.childCompanies, req.userDetails.companyMasterId]
          : req.userDetails.companyMasterId,
    };
    if (companyMasterID) {
      req.userDetails.accessibleCompanies = companyMasterID;
      companyFilter.companyMasterID = +companyMasterID;
    }

    const order =
      sortByField && sortByValue
        ? [[sortByField, sortByValue]]
        : [['createdAt', 'DESC']];

    const paginationQuery = {};
    if (!exportData) {
      paginationQuery.offset = (page - 1) * pageSize;
      paginationQuery.limit = +pageSize;
    }
    const filterDate = asiaKolkataDateTime(new Date()).slice(0, 10);

    const { rows: employeeGoalReviews, count } =
      await EmployeeGoalReview.findAndCountAll({
        where: condition,
        ...paginationQuery,
        order,
        paranoid: withDeleted !== 'true',
        include: [
          {
            model: EmployeeGoal,
            where: revieweeId ? { userMasterId: revieweeId } : {},
            include: [
              {
                model: GoalMaster,
                where: goalMasterId ? { id: goalMasterId } : {},
                include: [
                  {
                    model: companyMaster,
                    where: companyFilter,
                    attributes: companyAttributes,
                  },
                  { model: KRAMaster, include: [{ model: KPIMaster }] },
                ],
              },
              {
                model: UserMaster,
                as: 'goalAssignedTo',
                attributes: userAttributes,
                required: true,
                ...accessibleUsers(req.userDetails),
                include: [
                  {
                    separate: true,
                    model: EmployeeDesignation,
                    where: {
                      status: 1,
                      applicableDate: {
                        [Sequelize.Op.lte]: new Date(filterDate),
                      },
                      [Sequelize.Op.or]: [
                        {
                          endDate: { [Sequelize.Op.gte]: new Date(filterDate) },
                        },
                        { endDate: { [Sequelize.Op.eq]: null } },
                      ],
                    },

                    attributes: ['designationID'],
                    include: [
                      {
                        model: Designation,
                        as: 'designation',
                        attributes: ['designationName'],
                      },
                    ],
                  },
                  {
                    separate: true,
                    model: EmployeeDepartment,
                    where: {
                      status: 1,
                      applicableDate: {
                        [Sequelize.Op.lte]: new Date(filterDate),
                      },
                      [Sequelize.Op.or]: [
                        {
                          endDate: { [Sequelize.Op.gte]: new Date(filterDate) },
                        },
                        { endDate: { [Sequelize.Op.eq]: null } },
                      ],
                    },

                    attributes: ['departmentID'],
                    include: [
                      {
                        model: Department,
                        as: 'department',
                        attributes: ['departmentName'],
                      },
                    ],
                  },
                  {
                    separate: true,
                    model: EmployeeBranch,
                    where: {
                      // ...(branchMasterID && { branchID: branchMasterID }),
                      status: 1,
                      applicableDate: {
                        [Sequelize.Op.lte]: new Date(filterDate),
                      },
                      [Sequelize.Op.or]: [
                        {
                          endDate: { [Sequelize.Op.gte]: new Date(filterDate) },
                        },
                        { endDate: { [Sequelize.Op.eq]: null } },
                      ],
                    },
                    required: false,
                    attributes: ['branchID'],
                    include: [
                      {
                        model: BranchMaster,
                        as: 'branchMaster',
                        attributes: ['branchName'],
                      },
                    ],
                  },
                  {
                    model: EmployeeJoiningDetails,
                    attributes: ['employeeCode'],
                  },
                ],
              },
            ],
          },
          {
            model: UserMaster,
            as: 'reviewer',
            attributes: userAttributes,
          },
          { model: EmployeeGoalReviewFeedback },
        ],
        nest: true,
        distinct: true,
      });

    if (exportData) {
      const finaldata = employeeGoalReviews.map((e) => {
        // Extract KRA, KPI, Weightage, Target Given, and Target Achieved
        const kraTitle =
          e.employeeGoal.goalMaster.kraMasters.length > 0
            ? e.employeeGoal.goalMaster.kraMasters[0].title // Get the first KRA title
            : '';

        const kpiTitle =
          e.employeeGoal.goalMaster.kraMasters.length > 0 &&
          e.employeeGoal.goalMaster.kraMasters[0].kpiMasters.length > 0
            ? e.employeeGoal.goalMaster.kraMasters[0].kpiMasters[0].title // Get the first KPI title
            : '';

        const weightage =
          e.employeeGoal.goalMaster.kraMasters.length > 0 &&
          e.employeeGoal.goalMaster.kraMasters[0].kpiMasters.length > 0
            ? e.employeeGoal.goalMaster.kraMasters[0].kpiMasters[0].weightage // Get the first KPI weightage
            : '';

        const targetGiven = e.employeeGoal.targetGiven; // Extract Target Given from employeeGoal

        const targetAchieved =
          e.employeeGoalReviewFeedbacks.length > 0
            ? e.employeeGoalReviewFeedbacks[0].targetAchieved // Extract first targetAchieved
            : '';

        return {
          'Employee Code':
            e.employeeGoal.goalAssignedTo.employeeJoiningDetails.length > 0
              ? e.employeeGoal.goalAssignedTo.employeeJoiningDetails[0]
                  .employeeCode
              : '',
          'Employee Name': e.employeeGoal.goalAssignedTo.displayName,
          Number: e.employeeGoal.goalAssignedTo.userNumber,
          'Company Name': e.employeeGoal.goalMaster.companyMaster.companyName,
          Branch:
            e.employeeGoal.goalAssignedTo.employeeBranches.length > 0
              ? e.employeeGoal.goalAssignedTo.employeeBranches[0].branchMaster
                  .branchName
              : '',
          Department:
            e.employeeGoal.goalAssignedTo.employeeDepartments.length > 0
              ? e.employeeGoal.goalAssignedTo.employeeDepartments[0].department
                  .departmentName
              : '',
          Designation:
            e.employeeGoal.goalAssignedTo.employeeDesignations.length > 0
              ? e.employeeGoal.goalAssignedTo.employeeDesignations[0]
                  .designation.designationName
              : '',
          'Goal Name': e.employeeGoal.goalMaster.title,
          'Goal Description': e.employeeGoal.goalMaster.description,
          'Created Date': e.employeeGoal.createdAt,
          KRA: kraTitle, // KRA Title
          KPI: kpiTitle, // KPI Title
          Weightage: weightage, // Weightage
          'Target Given': targetGiven, // Target Given
          'Target Achieved': targetAchieved, // Target Achieved from feedback
        };
      });

      await generateExcel(finaldata, 'Employee Goals', 'xlsx', res);
      return;
    }

    return res.status(statusCodes.OK).json({
      message: usermessage.fetchMessage('Employee Goal Reviews'),
      data: employeeGoalReviews,
      totalcount: count,
      page: +page,
      pageSize: paginationQuery.limit,
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteEmployeeGoalReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyFilter = {
      companyMasterID:
        req.userDetails.childCompanies.length > 0
          ? [...req.userDetails.childCompanies, req.userDetails.companyMasterId]
          : req.userDetails.companyMasterId,
    };
    const employeeGoalReview = await EmployeeGoalReview.findByPk(id, {
      include: [
        {
          model: EmployeeGoal,
          include: [
            {
              model: GoalMaster,
              include: [
                {
                  model: companyMaster,
                  where: companyFilter,
                },
              ],
            },
          ],
        },
      ],
      nest: true,
    });
    if (!employeeGoalReview)
      throw new CustomError(
        usermessage.notFoundMessage('Employee Goal Review'),
        statusCodes.NOT_FOUND
      );
    await employeeGoalReview.destroy({
      user: req.userDetails,
    });
    return res.status(statusCodes.OK).json({
      message: usermessage.deleteMessage('Employee Goal Review'),
    });
  } catch (err) {
    next(err);
  }
};

// FIX

exports.employeeGoalReviewReport = async (req, res, next) => {
  try {
    const { employeeGoalId, reportType } = req.query;
    const companyFilter = {
      companyMasterID:
        req.userDetails.childCompanies.length > 0
          ? [...req.userDetails.childCompanies, req.userDetails.companyMasterId]
          : req.userDetails.companyMasterId,
    };

    const employeeGoalExists = await EmployeeGoal.findOne({
      where: { id: employeeGoalId },
      include: [
        {
          model: EmployeeGoalReview,
          include: [
            { model: UserMaster, as: 'reviewer', attributes: userAttributes },
            { model: EmployeeGoalReviewFeedback, separate: true },
          ],
        },
        {
          model: GoalMaster,
          include: [
            { model: GoalSetting, attributes: ['grade'] },
            {
              model: KRAMaster,
              include: [
                {
                  model: KPIMaster,
                },
              ],
            },
            { model: companyMaster, where: companyFilter, attributes: [] },
          ],
        },
        { model: UserMaster, attributes: userAttributes, as: 'goalAssignedTo' },
      ],
    });

    if (!employeeGoalExists)
      throw new CustomError(
        errorMessage.EMPLOYEE_GOAL_REPORT_NOT_READY,
        statusCodes.BAD_REQUEST
      );

    const employeeGoalData = employeeGoalExists.toJSON();
    const revieweeDesignation = await employeeDesignation(
      employeeGoalData.userMasterId,
      new Date().toISOString().slice(0, 10)
    );
    const revieweeData = {
      name: employeeGoalData.goalAssignedTo.displayName,
      phone: employeeGoalData.goalAssignedTo.userNumber,
      email: employeeGoalData.goalAssignedTo.email,
      designation: revieweeDesignation['designation.designationName'],
      date: moment(employeeGoalData?.goalMaster?.fromDate, 'YYYY-MM-DD').format('DD-MM-YYYY') + '<br>' + moment(employeeGoalData?.goalMaster?.toDate, 'YYYY-MM-DD').format('DD-MM-YYYY'),
    };

    const revieweeTable = `<tr>
    <td>Employee Name</td>
    <td>Email</td>
    <td>Phone</td>
    <td>Designation</td>
    <td>Date</td></tr>
    <tr>
    <td>${revieweeData.name}</td>
    <td>${revieweeData.email}</td>
    <td>${revieweeData.phone}</td>
    <td>${revieweeData.designation}</td>
    <td>${revieweeData.date}</td>
    </tr>`;

    const reportData = [];

    employeeGoalData.goalMaster.kraMasters.forEach((kra) => {
      kra.kpiMasters.forEach((kpi, index) => {
        let gradeForTarget = 'NA';

        if (
          employeeGoalData.employeeGoalReviews.length > 0 &&
          employeeGoalData.employeeGoalReviews[0].employeeGoalReviewFeedbacks
            .length > 0
        ) {
          const gradeObject = employeeGoalData.goalMaster.goalSetting.grade;

          const achievedGrade =
            employeeGoalData.employeeGoalReviews[0].employeeGoalReviewFeedbacks[
              index
            ].targetAchieved;

          gradeForTarget = getGradeForTarget(gradeObject, achievedGrade);
        }

        reportData.push({
          goalName: employeeGoalData.goalMaster.title,
          goalDescription: employeeGoalData.goalMaster.description,
          kraTitle: kra.title,
          kraDescription: kra.description,
          kraWeightage: kra.weightage,
          kpiId: kpi.id,
          kpiTitle: kpi.title,
          kpiDescription: kpi.description,
          kpiWeightage: kpi.weightage,
          targetGiven: employeeGoalData.targetGiven,
          gradeForTarget,
          kpiReviewerData: [],
        });
      });
    });

    const reviewers = [];
    employeeGoalData.employeeGoalReviews.forEach((egr) => {
      if (egr.employeeGoalReviewFeedbacks.length)
        reviewers.push({ name: egr.reviewer.displayName, id: egr.reviewerId });
    });

    reportData.forEach((data) => {
      employeeGoalData.employeeGoalReviews.forEach((reviews) => {
        reviews.employeeGoalReviewFeedbacks.forEach((feedbacks) => {
          if (+data.kpiId === +feedbacks.kpiMasterId)
            data.kpiReviewerData.push({
              reviewerId: reviews.reviewer.userMasterID,
              reviewerName: reviews.reviewer.displayName,
              targetAchieved: feedbacks.targetAchieved,
              targetGiven: data.targetGiven,
              remarks: feedbacks.remarks || 'NA',
            });
        });
      });
    });

    let reviewTableHeader = `<tr>
    <td>Goal</td>
    <td>KRA</td>
    <td>KPI</td>`;

    // Ensure that you add a header for each reviewer
    reviewers.forEach((reviewer) => {
      reviewTableHeader += `<td>${reviewer.name}</td>`;
    });

    reviewTableHeader += `</tr>`;

    let reviewTableRows = '';
    reportData.forEach((report) => {
      reviewTableRows += `<tr>
        <td>${report.goalName}</td>
        <td>${report.kraTitle}</td>
        <td>${report.kpiTitle}</td>`;

      // Add data for each reviewer
      reviewers.forEach((reviewer) => {
        const reviewerData = report.kpiReviewerData.find(
          (r) => r.reviewerId === reviewer.id
        );

        reviewTableRows += `<td>
          Target Given: ${reviewerData ? reviewerData.targetGiven : 'NA'} <br>
          Target Achieved:  ${
            reviewerData ? reviewerData.targetAchieved : 'NA'
          } <br>
          Grade: ${report.gradeForTarget} <br>
          Remarks: ${reviewerData ? reviewerData.remarks : 'NA'}
        </td>`;
      });

      reviewTableRows += `</tr>`;
    });

    const reviewTable = reviewTableHeader + reviewTableRows;

    const pdfGenerationObject = { revieweeTable, reviewTable };
    const pdfBuffer = await generatePDF(
      'goalReviewReport',
      pdfGenerationObject
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Goal-Review-Report-${revieweeData.displayName}.pdf`
    );
    res.setHeader('Content-Type', 'application/pdf');
    return res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

// exports.employeeGoalReviewReport = async (req, res, next) => {
//   try {
//     const { employeeGoalId, reportType } = req.query;
//     const companyFilter = {
//       companyMasterID:
//         req.userDetails.childCompanies.length > 0
//           ? [...req.userDetails.childCompanies, req.userDetails.companyMasterId]
//           : req.userDetails.companyMasterId,
//     };
//     const employeeGoalExists = await EmployeeGoal.findOne({
//       where: { id: employeeGoalId },
//       include: [
//         {
//           model: EmployeeGoalReview,
//           include: [
//             { model: UserMaster, as: 'reviewer', attributes: userAttributes },
//             { model: EmployeeGoalReviewFeedback, separate: true },
//           ],
//         },
//         {
//           model: GoalMaster,
//           include: [
//             {
//               model: KRAMaster,
//               include: [
//                 {
//                   model: KPIMaster,
//                 },
//               ],
//             },
//             { model: companyMaster, where: companyFilter, attributes: [] },
//           ],
//         },
//         { model: UserMaster, attributes: userAttributes, as: 'goalAssignedTo' },
//       ],
//     });

//     if (!employeeGoalExists)
//       throw new CustomError(
//         errorMessage.EMPLOYEE_GOAL_REPORT_NOT_READY,
//         statusCodes.BAD_REQUEST
//       );
//     const employeeGoalData = employeeGoalExists.toJSON();
//     const revieweeDesignation = await employeeDesignation(
//       employeeGoalData.userMasterId,
//       new Date().toISOString().slice(0, 10)
//     );
//     const revieweeData = {
//       name: employeeGoalData.goalAssignedTo.displayName,
//       phone: employeeGoalData.goalAssignedTo.userNumber,
//       email: employeeGoalData.goalAssignedTo.email,
//       designation: revieweeDesignation['designation.designationName'],
//     };

//     const revieweeTable = `<tr>
//     <td>Employee Name</td>
//     <td>Email</td>
//     <td>Phone</td>
//     <td>Designation</td></tr>
//     <tr>
//     <td>${revieweeData.name}</td>
//     <td>${revieweeData.email}</td>
//     <td>${revieweeData.phone}</td>
//     <td>${revieweeData.designation}</td></tr>`;

//     const reportData = [];
//     employeeGoalData.goalMaster.kraMasters.forEach((kra) => {
//       kra.kpiMasters.forEach((kpi) => {
//         reportData.push({
//           goalName: employeeGoalData.goalMaster.title,
//           goalDescription: employeeGoalData.goalMaster.description,
//           kraTitle: kra.title,
//           kraDescription: kra.description,
//           kraWeightage: kra.weightage,
//           kpiId: kpi.id,
//           kpiTitle: kpi.title,
//           kpiDescription: kpi.description,
//           kpiWeightage: kpi.weightage,
//           targetGiven: kpi.targetGiven,
//           kpiReviewerData: [],
//         });
//       });
//     });
//     const reviewers = [];
//     employeeGoalData.employeeGoalReviews.forEach((egr) => {
//       if (egr.employeeGoalReviewFeedbacks.length)
//         reviewers.push({ name: egr.reviewer.displayName, id: egr.reviewerId });
//     });
//     reportData.forEach((data) => {
//       employeeGoalData.employeeGoalReviews.forEach((reviews) => {
//         reviews.employeeGoalReviewFeedbacks.forEach((feedbacks) => {
//           console.log(+data.kpiId, +feedbacks.kpiMasterId);
//           if (+data.kpiId === +feedbacks.kpiMasterId)
//             data.kpiReviewerData.push({
//               reviewerId: reviews.reviewer.userMasterID,
//               reviewerName: reviews.reviewer.displayName,
//               targetAchieved: feedbacks.targetAchieved,
//               targetGiven: data.targetGiven,
//               remarks: feedbacks.remarks || 'NA',
//             });
//         });
//       });
//     });
//     let reviewTableHeader = `<tr>
//     <td>Goal</td>
//     <td>KRA</td>
//     <td>KPI</td>`;

//     for (let i = 0; i < reviewers.length; i++) {
//       reviewTableHeader += `<td>Anonymous reviewer ${i + 1}</td>`;
//     }
//     reviewTableHeader += `</tr>`;

//     let reviewTableRows = '';
//     reportData.forEach((report) => {
//       reviewTableRows += `<tr>
//         <td>${report.goalName}</td>
//         <td>${report.kraTitle}</td>
//         <td>${report.kpiTitle}</td>`;
//       report.kpiReviewerData.forEach((reviewerData) => {
//         reviewTableRows += `<td>Target Given: ${reviewerData.targetGiven} <br>
//           Target Achieved: ${reviewerData.targetAchieved} <br>
//          Remarks: ${reviewerData.remarks}</td>`;
//       });
//       reviewTableRows += `</tr>`;
//     });
//     const reviewTable = reviewTableHeader + reviewTableRows;

//     const pdfGenerationObject = { revieweeTable, reviewTable };
//     const pdfBuffer = await generatePDF(
//       'goalReviewReport',
//       pdfGenerationObject
//     );
//     res.setHeader(
//       'Content-Disposition',
//       `attachment; filename=Goal-Review-Report-${revieweeData.displayName}.pdf`
//     );
//     res.setHeader('Content-Type', 'application/pdf');
//     return res.send(pdfBuffer);
//   } catch (error) {
//     next(error);
//   }
// };

exports.addReview = async (req, res, next) => {
  try {
    const { employeeGoalReviewId, kpiData } = req.body;

    const companyFilter = {
      companyMasterID:
        req.userDetails.childCompanies.length > 0
          ? [...req.userDetails.childCompanies, req.userDetails.companyMasterId]
          : req.userDetails.companyMasterId,
    };

    const findTargetGiven = await EmployeeGoalReview.findByPk(
      employeeGoalReviewId,
      {
        include: [
          {
            model: EmployeeGoal,
            attributes: ['targetGiven'],
          },
        ],
      }
    );

    if (
      +kpiData[0].targetAchieved > +findTargetGiven.employeeGoal.targetGiven
    ) {
      return res.status(statusCodes.NOT_FOUND).json({
        message: usermessage.addMessage(
          'Target Given cannot be greater than or equal to Target Achieved.'
        ),
      });
    }

    const validEmployeeGoalReview = await EmployeeGoalReview.findByPk(
      employeeGoalReviewId,
      {
        include: [
          {
            model: EmployeeGoal,
            include: [
              {
                model: GoalMaster,
                attributes: ['id'],
                include: [
                  {
                    model: companyMaster,
                    where: companyFilter,
                  },
                ],
              },
            ],
          },
        ],

        nest: true,
      }
    );
    if (!validEmployeeGoalReview) {
      throw new CustomError(
        usermessage.invalidField('Employee Goal Review'),
        statusCodes.BAD_REQUEST
      );
    }

    const dataToInsert = kpiData.map((kpi) => ({
      employeeGoalReviewId,
      kpiMasterId: kpi.kpiMasterId,
      remarks: kpi.remarks,
      targetAchieved: kpi.targetAchieved,
    }));

    await EmployeeGoalReviewFeedback.bulkCreate(dataToInsert, {
      user: req.userDetails,
      individualHooks: true,
    });

    return res.status(statusCodes.OK).json({
      message: usermessage.addMessage('Employee Goal Review Feedback'),
    });
  } catch (error) {
    next(error);
  }
};

exports.employeeGoalReviewReportDesignationWise = async (req, res, next) => {
  try {
    const { designationID, goalMasterId } = req.query;

    const companyFilter = {
      companyMasterID:
        req.userDetails.childCompanies.length > 0
          ? [...req.userDetails.childCompanies, req.userDetails.companyMasterId]
          : req.userDetails.companyMasterId,
    };

    const designaitonWiseUserData = await EmployeeDesignation.findAll({
      raw: true,
      where: {
        designationID: designationID,
        endDate: { [Sequelize.Op.eq]: null },
        status: 1,
      },
      attributes: ['userMasterID'],
      include: [
        {
          model: Designation,
          as: 'designation',
          attributes: ['designationName'],
        },
      ],
    });

    if (!designaitonWiseUserData) {
      throw new CustomError(
        errorMessage.EMPLOYEE_NOT_FOUND_IN_DESIGNATION,
        statusCodes.BAD_REQUEST
      );
    }

    const designaitonWiseUserMasterId = designaitonWiseUserData.map(
      (e) => e.userMasterID
    );
    const revieweeDesignation =
      designaitonWiseUserData[0]['designation.designationName'];

    const employeeGoalExists = await EmployeeGoal.findAll({
      where: { goalMasterId, userMasterId: designaitonWiseUserMasterId },
      include: [
        {
          model: EmployeeGoalReview,
          include: [
            { model: UserMaster, as: 'reviewer', attributes: userAttributes },
            { model: EmployeeGoalReviewFeedback, separate: true },
          ],
        },
        {
          model: GoalMaster,
          include: [
            {
              model: KRAMaster,
              include: [
                {
                  model: KPIMaster,
                },
              ],
            },
            { model: companyMaster, where: companyFilter, attributes: [] },
          ],
        },
        { model: UserMaster, attributes: userAttributes, as: 'goalAssignedTo' },
      ],
    });

    let reviewTable = '';
    if (employeeGoalExists.length == 0)
      throw new CustomError(
        errorMessage.EMPLOYEE_GOAL_REPORT_NOT_READY,
        statusCodes.BAD_REQUEST
      );

    let pdfGenerationObject = '';

    for (let [index, element] of employeeGoalExists.entries()) {
      const employeeGoalData = element.toJSON();

      const revieweeData = {
        name: employeeGoalData.goalAssignedTo.displayName,
        phone: employeeGoalData.goalAssignedTo.userNumber,
        email: employeeGoalData.goalAssignedTo.email,
        designation: revieweeDesignation,
      };

      const revieweeTable = `<tr>
    <th>Employee Name</th>
    <th>Email</th>
    <th>Phone</th>
    <th>Designation</th></tr>
    <tr>
    <td>${revieweeData.name}</td>
    <td>${revieweeData.email}</td>
    <td>${revieweeData.phone}</td>
    <td>${revieweeData.designation}</td></tr>`;

      const reportData = [];
      employeeGoalData.goalMaster.kraMasters.forEach((kra) => {
        kra.kpiMasters.forEach((kpi) => {
          reportData.push({
            goalName: employeeGoalData.goalMaster.title,
            goalDescription: employeeGoalData.goalMaster.description,
            kraTitle: kra.title,
            kraDescription: kra.description,
            kraWeightage: kra.weightage,
            kpiId: kpi.id,
            kpiTitle: kpi.title,
            kpiDescription: kpi.description,
            kpiWeightage: kpi.weightage,
            targetGiven: kpi.targetGiven,
            kpiReviewerData: [],
          });
        });
      });
      const reviewers = [];
      employeeGoalData.employeeGoalReviews.forEach((egr) => {
        if (egr.employeeGoalReviewFeedbacks.length)
          reviewers.push({
            name: egr.reviewer.displayName,
            id: egr.reviewerId,
          });
      });
      reportData.forEach((data) => {
        employeeGoalData.employeeGoalReviews.forEach((reviews) => {
          reviews.employeeGoalReviewFeedbacks.forEach((feedbacks) => {
            if (+data.kpiId === +feedbacks.kpiMasterId)
              data.kpiReviewerData.push({
                reviewerId: reviews.reviewer.userMasterID,
                reviewerName: reviews.reviewer.displayName,
                targetAchieved: feedbacks.targetAchieved,
                targetGiven: data.targetGiven,
                remarks: feedbacks.remarks || 'NA',
              });
          });
        });
      });
      let reviewTableHeader = `<tr>
    <th>Goal</th>
    <th>KRA</th>
    <th>KPI</th>`;

      for (let i = 0; i < reviewers.length; i++) {
        reviewTableHeader += `<th>Anonymous reviewer ${i + 1}</th>`;
      }
      reviewTableHeader += `</tr>`;

      let reviewTableRows = '';
      reportData.forEach((report) => {
        reviewTableRows += `<tr>
        <td>${report.goalName}</td>
        <td>${report.kraTitle}</td>
        <td>${report.kpiTitle}</td>`;
        report.kpiReviewerData.forEach((reviewerData) => {
          reviewTableRows += `<td>Target Given: ${reviewerData.targetGiven} <br>
          Target Achieved: ${reviewerData.targetAchieved} <br>
         Remarks: ${reviewerData.remarks}</td>`;
        });
        reviewTableRows += `</tr>`;
      });

      reviewTable = reviewTableHeader + reviewTableRows;

      let final = ` <table>${revieweeTable}</table><h3>Review Form</h3> <table>${reviewTable}</table>`;

      if (index != employeeGoalExists.length - 1)
        final += `<div class='pageBreak'></div>`;

      pdfGenerationObject += final;
    }

    const pdfBuffer = await generatePDF('goalReviewReportDesignationWise', {
      pdfGenerationObject,
    });
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Goal-Review-Report-${revieweeDesignation}.pdf`
    );
    res.setHeader('Content-Type', 'application/pdf');
    return res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};
