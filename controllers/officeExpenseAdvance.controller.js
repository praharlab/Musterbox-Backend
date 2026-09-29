const { Sequelize, Op } = require("sequelize");
const OfficeExpenseAdvance = require("../models/officeExpenseAdvance");
const { statusCodes, userAttributes } = require("../utils/commonVars");
const message = require('../response_message/message');
const { officeExpenseAdvanceTransactionType } = require("../utils/dbUtils");
const BranchMaster = require("../models/branchMaster");
const Site = require("../models/site");
const UserMaster = require("../models/userMaster");
const { generateExcel } = require("../utils/exportData");
const moment = require('moment');
const EmployeeDesignation = require("../models/employeeDesignation");
const EmployeeDepartment = require("../models/employeeDepartment");
const Designation = require("../models/designation");
const Department = require("../models/department");
const EmployeeBranch = require("../models/employeeBranch");
const EmployeeJoiningDetails = require("../models/employeeJoiningDetails");
const Division = require("../models/division");
const EmployeeWorkingArea = require("../models/employeeWorkingArea");
const WorkingArea = require("../models/workingArea");
const EmployeeDivision = require("../models/employeeDivision");
const { asiaKolkataDateTime } = require("../utils/commonUtilFunctions");

exports.creditDebitAdvance = async (req, res, next) => {
    try {
        const {
            branchMasterID,
            siteID,
            userMasterID,
            amount,
            date,
            transactionType,
            paymentMode,
            referenceNo,
            referenceDate,
            remarks
        } = req.body;

        const condition = {
            userMasterID,
            branchMasterID
        };

        if(siteID){
            condition.siteID = siteID;
        }else{
            condition.siteID = {
                [Op.eq]: null
            }
        }

        if(transactionType == officeExpenseAdvanceTransactionType.DEBIT){
            const data = await OfficeExpenseAdvance.findAll({
                raw: true,
                where: condition,
                attributes: [
                    [
                        Sequelize.fn("SUM", Sequelize.literal('COALESCE("amount", 0)')),
                        "creditedAmount"
                    ]
                ]
            })
            
            if (+data[0].creditedAmount - +amount < 0) {
                return res.status(200).json({
                    status: 401,
                    message: "Insufficient Balance to Debit!"
                })
            }
        }

        await OfficeExpenseAdvance.create(
            {
                branchMasterID,
                siteID,
                userMasterID,
                amount,
                date,
                transactionType,
                paymentMode,
                referenceNo,
                referenceDate,
                remarks
            },{
                user: req.userDetails
            }
        )

        const returnMessage = 'Advance ' + transactionType.toLowerCase() + 'ed successfully';

        return res.status(statusCodes.OK).json({
            status: statusCodes.OK,
            message: returnMessage
        })


    } catch (error) {
        next(error);
    }
}

exports.getAllOfficeExpenseAdvance = async (req, res, next) => {
    try {
        const { companyMasterID, branchMasterID, siteID, userMasterID, fromDate, toDate, page, limit, transactionType, exportData } = req.body;

        const companyCondition = {};
        if (companyMasterID) companyCondition.companyMasterID = companyMasterID;

        const condition = {};
        if (branchMasterID) condition.branchMasterID = branchMasterID;
        if (siteID) condition.siteID = siteID;
        if (userMasterID) condition.userMasterID = userMasterID;
        if (transactionType) condition.transactionType = transactionType;

        if(fromDate && toDate){
            condition.date = {
                [Op.between]: [fromDate, toDate]
            }
        }

        const paginationQuery = page && limit ? {
            limit: limit,
            offset: (page - 1) * limit
        } : {};

        const filterDate = asiaKolkataDateTime(new Date()).slice(0, 10);

        const { rows, count } = await OfficeExpenseAdvance.findAndCountAll({
            where: condition,
            ...paginationQuery,
            include: [
                {
                    model: BranchMaster,
                    attributes: ['branchName'],
                    where: companyCondition
                },
                {
                    model: Site,
                    attributes: ['siteName']
                },
                {
                    model: UserMaster,
                    attributes: userAttributes,
                    include: [
                        {
                            required: false,
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
                            required: false,
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
                            required: false,
                            model: EmployeeBranch,
                            separate: true,

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
                            required: false,
                            model: EmployeeJoiningDetails,
                            attributes: ['employeeCode'],
                        },
                        {
                            required: false,
                            separate: true,
                            model: EmployeeDivision,
                            where: {
                                status: 1,
                                startDate: { [Sequelize.Op.lte]: filterDate },
                                [Sequelize.Op.or]: [
                                    { endDate: { [Sequelize.Op.gte]: filterDate } },
                                    { endDate: { [Sequelize.Op.eq]: null } },
                                ],
                            },

                            attributes: ['divisionId', 'startDate'],
                            include: [
                                {
                                    model: Division,
                                    attributes: ['divisionName'],
                                },
                            ],
                        },

                        {
                            required: false,
                            separate: true,

                            model: EmployeeWorkingArea,
                            where: {
                                status: 1,
                                startDate: { [Sequelize.Op.lte]: filterDate },
                                [Sequelize.Op.or]: [
                                    { endDate: { [Sequelize.Op.gte]: filterDate } },
                                    { endDate: { [Sequelize.Op.eq]: null } },
                                ],
                            },

                            attributes: ['workingAreaId', 'startDate'],
                            include: [
                                {
                                    model: WorkingArea,
                                    attributes: ['workingAreaName'],
                                },
                            ],
                        },
                    ]
                },
            ]
        })

        if (exportData) {

            const officeExpenseAdvanceData = rows.map((row) => ({
                'Date': moment(new Date(row?.date)).format('DD-MM-YYYY'),
                'Employee Name': row?.userMaster?.displayName,
                'Employee Code': row?.userMaster?.employeeJoiningDetails[0]?.employeeCode,
                'Branch': row?.userMaster?.employeeBranches[0]?.branchMaster?.branchName,
                'Department': row?.userMaster?.employeeDepartments[0].department?.departmentName,
                'Designation': row?.userMaster?.employeeDesignations[0].designation?.designationName,
                'Division': row?.userMaster?.employeeDivisions[0].division?.divisionName,
                'Working Area': row?.userMaster?.employeeWorkingAreas[0].workingArea?.workingAreaName,
                'Allocated Branch': row?.branchMaster?.branchName,
                'Allocated Site': row?.site?.siteName,
                'Transaction Type': row?.transactionType,
                'Amount': row?.amount,
                'Payment Mode': row?.paymentMode,
                'Reference Number': row?.referenceNo,
                'Reference Date': row?.referenceDate ? moment(row?.referenceDate).format('DD-MM-YYYY') : '',
                'Remarks': row?.remarks,
            }))

            return await generateExcel(officeExpenseAdvanceData, 'Office Expense Advance', 'xlsx', res);
        }

        return res.status(statusCodes.OK).json({
            status: statusCodes.OK,
            data: rows,
            totalcount: count
        })

    } catch (error) {
        next(error)
    }
}