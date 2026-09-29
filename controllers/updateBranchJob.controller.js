const UserMaster = require('../models/userMaster');
const message = require('../response_message/message');
const readXlsxFile = require('read-excel-file/node');
const { Sequelize } = require('sequelize');
const EmployeeDepartment = require('../models/employeeDepartment');
const EmployeeDesignation = require('../models/employeeDesignation');
const EmployeeBranch = require('../models/employeeBranch');
const sequelize = require('../config/database');
const Designation = require('../models/designation');
const EmployeeReportTo = require('../models/employeeReportTo');
const Department = require('../models/department');
const EmployeeJoiningDetails = require('../models/employeeJoiningDetails');
const BranchMaster = require('../models/branchMaster');
const CompanyMaster = require('../models/companyMaster');
const fs = require('fs');
const path = require('path');
const {
  updateBranchJobTypes,
  SkillCategoryType,
  FileUploadType,
} = require('../utils/dbUtils');
const {
  isValidDate,
  asiaKolkataDateTime,
  isValidYearMonthCompact,
  findNearestNumbers,
  getPreviousMonth,
  accessibleUsers,
} = require('../utils/commonUtilFunctions');
const { generateDemoExcelBranchJob } = require('../utils/exportData');
const { userAttributes, companyAttributes } = require('../utils/commonVars');
const EmployeeDivision = require('../models/employeeDivision');
const Division = require('../models/division');
const EmployeeWorkingArea = require('../models/employeeWorkingArea');
const WorkingArea = require('../models/workingArea');
const EmployeeWorkingLocation = require('../models/employeeWorkingLocation');
const WorkingLocation = require('../models/workingLocation');
const EmployeeSkillCategory = require('../models/employeeSkillCategory');
const EmployeeProject = require('../models/employeeProject');
const Project = require('../models/project');

exports.ExportDemojobTitle_V2 = async (req, res, next) => {
  try {
    const {
      companyMasterID,
      branchID,
      userMasterID,
      uploadTypes,
      departmentID,
      designationID,
      workingAreaId,
      projectID,
      skillCategory,
      divisionId,
    } = req.body;
    const currentDate = asiaKolkataDateTime(new Date()).slice(0, 10);
    if (!companyMasterID)
      return res.status(200).json({
        status: 401,
        message: message.usermessage.passValidValidParameter('Company'),
      });
    if (!uploadTypes || uploadTypes.length == 0) {
      return res.status(200).json({
        status: 401,
        message: message.usermessage.passValidValidParameter('Upload Type'),
      });
    }

    const currCompany = await CompanyMaster.findOne({
      where: { companyMasterID, status: 1 },
      attributes: [
        'companyMasterID',
        'parentCompanyMasterID',
        'fileUploadType',
        'companyName',
      ],
      raw: true,
    });

    const baseCompanyID =
      +currCompany.parentCompanyMasterID || +companyMasterID;

    const getAllParentChidCompany = await CompanyMaster.findAll({
      raw: true,
      where: {
        [Sequelize.Op.or]: [
          { companyMasterID: baseCompanyID },
          { parentCompanyMasterID: baseCompanyID },
        ],
        status: 1,
      },
      order: [['companyMasterID', 'ASC']],
    });

    const allParentChidCompanyIDs = getAllParentChidCompany.map(
      (e) => e.companyMasterID
    );

    let fileUploadType = FileUploadType.MOBILE_NUMBER;
    if (currCompany.fileUploadType == FileUploadType.EMPLOYEE_CODE)
      fileUploadType = FileUploadType.EMPLOYEE_CODE;

    const uploadObject = getUploadTypeObject(uploadTypes);
    const userMasterIncludeModel = getUserIncludeModel(
      uploadObject,
      branchID,
      departmentID,
      designationID,
      workingAreaId,
      projectID,
      skillCategory,
      divisionId,
      fileUploadType
    );
    const employeeJoiningCondition =
      getEmployeeJoiningCondition(fileUploadType);
    const findAllUserData = await findAllUserDataForBranchJob(
      employeeJoiningCondition,
      companyMasterID,
      userMasterID,
      userMasterIncludeModel,
      req
    );
    const getBranchJobData = await getAllBranchJobData(
      companyMasterID,
      allParentChidCompanyIDs,
      uploadObject,
      employeeJoiningCondition,
      fileUploadType
    );

    const finalData = [];

    for (const user of findAllUserData) {
      const data = {};

      data['Employee Name'] = user.userMaster.displayName;
      data['Employee Number'] = user.userMaster.userNumber;
      data['Employee Code'] = user.employeeCode;
      if (uploadObject.isUploadBranch) {
        data['Branch'] =
          user?.userMaster?.employeeBranches?.[0]?.branchMaster?.branchName ||
          '';

        data['Branch Applicable Date'] =
          user?.userMaster?.employeeBranches?.[0]?.applicableDate || '';
      }
      if (uploadObject.isUploadDepartment) {
        data['Department'] =
          user?.userMaster?.employeeDepartments?.[0]?.department
            ?.departmentName || '';

        data['Department Applicable Date'] =
          user?.userMaster?.employeeDepartments?.[0]?.applicableDate || '';
      }
      if (uploadObject.isUploadDesignation) {
        data['Designation'] =
          user?.userMaster?.employeeDesignations?.[0]?.designation
            ?.designationName || '';
        data['Designation Applicable Date'] =
          user?.userMaster?.employeeDesignations?.[0]?.applicableDate || '';
      }
      if (uploadObject.isUploadDivision) {
        data['Division'] =
          user?.userMaster?.employeeDivisions?.[0]?.division?.divisionName ||
          '';
        data['Division Applicable Date'] =
          user?.userMaster?.employeeDivisions?.[0]?.startDate || '';
      }
      if (uploadObject.isUploadProject) {
        const userProjects = user?.userMaster?.employeeProjects ?? [];

        const projectNameArray = userProjects.map(
          ({ project }) =>
            project?.display_id ?? `Not Found - ${project?.projectName}`
        );
        const projectStartDateArray = userProjects.map(
          ({ startDate }) => startDate ?? ''
        );

        data['Project Code'] = projectNameArray.join(',') || '';
        data['Project Applicable Date'] = projectStartDateArray.join(',') || '';
      }
      if (uploadObject.isUploadReportsTo) {
        const employeeReportsTo = [];
        const employeeReportsToNames = [];

        if (
          user?.userMaster?.employeeReportTos &&
          user.userMaster.employeeReportTos.length > 0
        ) {
          for (const { reportToID } of user.userMaster.employeeReportTos) {
            const findReporttoUser = getBranchJobData.allUsers.find(
              (e) => e.userMasterID === +reportToID
            );

            if (fileUploadType === FileUploadType.MOBILE_NUMBER) {
              employeeReportsTo.push(
                findReporttoUser?.userNumber || 'Not Found'
              );
              employeeReportsToNames.push(
                findReporttoUser?.displayName || 'Not Found'
              );
            } else {
              const code =
                findReporttoUser?.employeeJoiningDetails?.[0]?.employeeCode;
              employeeReportsTo.push(code || 'Not Found');
              employeeReportsToNames.push(
                findReporttoUser?.displayName || 'Not Found'
              );
            }
          }
        }

        data['Reports To'] = employeeReportsTo.length
          ? employeeReportsTo.join(',')
          : '';
        data['Reports To Name'] = employeeReportsToNames.length
          ? employeeReportsToNames.join(',')
          : '';
      }
      if (uploadObject.isUploadSkillCategory) {
        data['Skill Category'] =
          user?.userMaster?.employeeSkillCategories?.[0]?.skillCategory || '';
        data['Skill Category Applicable Month'] =
          user?.userMaster?.employeeSkillCategories?.[0]?.applicableYYYYMM ||
          '';
      }

      if (uploadObject.isUploadWorkingArea) {
        data['Working Area'] =
          user?.userMaster?.employeeWorkingAreas?.[0]?.workingArea
            ?.workingAreaName || '';
        data['Working Area Applicable Date'] =
          user?.userMaster?.employeeWorkingAreas?.[0]?.startDate || '';
      }
      if (uploadObject.isUploadWorkingLocation) {
        const userLocationIDs =
          user?.userMaster?.employeeWorkingLocations?.[0]?.workingLocationIDs ??
          [];

        const workingLocation =
          getBranchJobData.allWorkingLocation
            .filter((location) =>
              userLocationIDs.includes(location.workingLocationID)
            )
            .map((location) => location.workingLocationName)
            .join(',') || '';

        data['Working Location'] = workingLocation || '';
        data['Working Location Applicable Date'] =
          user?.userMaster?.employeeWorkingLocations?.[0]?.startDate || '';
      }
      finalData.push(data);
    }
    const companyWiseUserData = [];
    if (uploadObject.isUploadReportsTo) {
      for (let id of allParentChidCompanyIDs) {
        const companyUsers = [];
        const companyData = getAllParentChidCompany.find(
          (e) => +e.companyMasterID == +id
        );
        getBranchJobData.allUsers.forEach((row) => {
          if (row.companyMasterId == id) {
            companyUsers.push({
              userMasterID: row.userMasterID,
              displayName: row.displayName,
              userNumber: row.userNumber,
              companyMasterId: row.companyMasterId,
              employeeCode:
                row.employeeJoiningDetails &&
                row.employeeJoiningDetails.length > 0
                  ? row.employeeJoiningDetails[0].employeeCode
                  : '',
              branch:
                (row.employeeBranches && row.employeeBranches.length) > 0
                  ? row.employeeBranches[0].branchMaster
                    ? row.employeeBranches[0].branchMaster.branchName
                    : ''
                  : '',
              designation:
                (row.employeeDesignations && row.employeeDesignations.length) >
                0
                  ? row.employeeDesignations[0].designation
                    ? row.employeeDesignations[0].designation.designationName
                    : ''
                  : '',
              department:
                (row.employeeDepartments && row.employeeDepartments.length) > 0
                  ? row.employeeDepartments[0].department
                    ? row.employeeDepartments[0].department.departmentName
                    : ''
                  : '',
              company: row.companyMaster.companyName,
            });
          }
        });
        if (companyUsers.length) {
          companyWiseUserData.push({
            companyName: companyData.companyName,
            employeeData: companyUsers,
          });
        }
      }
    }
    if (finalData.length === 0)
      return res.status(200).json({
        status: 401,
        message: 'No data found to export!',
      });
    const excelData = {
      companyWiseUserData,
      allBranch: getBranchJobData.allBranch,
      allDepartment: getBranchJobData.allDepartment,
      allDesignation: getBranchJobData.allDesignation,
      allDivision: getBranchJobData.allDivision,
      allProjects: getBranchJobData.allProjects,
      allSkillCategory: getBranchJobData.allSkillCategory,
      allWorkingArea: getBranchJobData.allWorkingArea,
      allWorkingLocation: getBranchJobData.allWorkingLocation,
    };
    return await generateDemoExcelBranchJob(
      finalData,
      excelData,
      uploadObject,
      'Demo Excel',
      'xlsx',
      res
    );
  } catch (error) {
    next(error);
  }
};

exports.validatBranchJobTitle = async (req, res, next) => {
  if (!req.file)
    return res
      .status(200)
      .json({ status: 401, message: `Please enter a valid File!` });

  const filePath = path.join(__dirname, `../uploads/${req.file.filename}`);

  try {
    let {
      companyMasterID,
      branchID,
      userMasterID,
      uploadTypes,
      departmentID,
      designationID,
      workingAreaId,
      projectID,
      skillCategory,
      divisionId,
    } = req.body;
    if (userMasterID) {
      userMasterID = JSON.parse(userMasterID);
    }
    if (uploadTypes) {
      uploadTypes = JSON.parse(uploadTypes);
    }
    const currentDate = asiaKolkataDateTime(new Date()).slice(0, 10);
    if (!companyMasterID) {
      deleteUploadedExcelFile(filePath);
      return res.status(200).json({
        status: 401,
        message: message.usermessage.passValidValidParameter('Company'),
      });
    }
    if (!uploadTypes || uploadTypes.length == 0) {
      deleteUploadedExcelFile(filePath);
      return res.status(200).json({
        status: 401,
        message: message.usermessage.passValidValidParameter('Upload Type'),
      });
    }

    const uploadObject = getUploadTypeObject(uploadTypes);

    readXlsxFile(filePath).then(async (excelReadData) => {
      deleteUploadedExcelFile(filePath);
      const headers = excelReadData[0];
      excelReadData.shift();
      const indexObj = {
        employeeNameIndex: headers.indexOf('Employee Name'),
        employeeNumberIndex: headers.indexOf('Employee Number'),
        employeeCodeIndex: headers.indexOf('Employee Code'),
        branchIndex: headers.indexOf('Branch'),
        branchApplicableDateIndex: headers.indexOf('Branch Applicable Date'),
        departmentIndex: headers.indexOf('Department'),
        departmentApplicableDateIndex: headers.indexOf(
          'Department Applicable Date'
        ),
        designationIndex: headers.indexOf('Designation'),
        designationApplicableDateIndex: headers.indexOf(
          'Designation Applicable Date'
        ),
        divisionIndex: headers.indexOf('Division'),
        divisionApplicableDateIndex: headers.indexOf(
          'Division Applicable Date'
        ),
        projectIndex: headers.indexOf('Project Code'),
        projectApplicableDateIndex: headers.indexOf('Project Applicable Date'),
        reportsToIndex: headers.indexOf('Reports To'),
        reportsToNameIndex: headers.indexOf('Reports To Name'),
        skillCategoryIndex: headers.indexOf('Skill Category'),
        skillCategoryApplicableMonthIndex: headers.indexOf(
          'Skill Category Applicable Month'
        ),
        workingAreaIndex: headers.indexOf('Working Area'),
        workingAreaApplicableDateIndex: headers.indexOf(
          'Working Area Applicable Date'
        ),
        workingLocationIndex: headers.indexOf('Working Location'),
        workingLocationApplicableDateIndex: headers.indexOf(
          'Working Location Applicable Date'
        ),
      };

      const validExcel = validateExcelIndex(uploadObject, indexObj);
      if (!validExcel) {
        return res.status(200).json({
          status: 401,
          message: message.usermessage.passValidValidParameter('Excel'),
        });
      }
      const currCompany = await CompanyMaster.findOne({
        where: { companyMasterID, status: 1 },
        attributes: [
          'companyMasterID',
          'parentCompanyMasterID',
          'fileUploadType',
          'companyName',
        ],
        raw: true,
      });

      const baseCompanyID =
        +currCompany.parentCompanyMasterID || +companyMasterID;
      const getAllParentChidCompany = await CompanyMaster.findAll({
        raw: true,
        where: {
          [Sequelize.Op.or]: [
            { companyMasterID: baseCompanyID },
            { parentCompanyMasterID: baseCompanyID },
          ],
          status: 1,
        },
        order: [['companyMasterID', 'ASC']],
      });

      const allParentChidCompanyIDs = getAllParentChidCompany.map(
        (e) => e.companyMasterID
      );
      let fileUploadType = FileUploadType.MOBILE_NUMBER;
      if (currCompany.fileUploadType == FileUploadType.EMPLOYEE_CODE)
        fileUploadType = FileUploadType.EMPLOYEE_CODE;
      const userMasterIncludeModel = getUserIncludeModel(
        uploadObject,
        branchID,
        departmentID,
        designationID,
        workingAreaId,
        projectID,
        skillCategory,
        divisionId,
        fileUploadType
      );
      const employeeJoiningCondition =
        getEmployeeJoiningCondition(fileUploadType);
      const findAllUserData = await findAllUserDataForBranchJob(
        employeeJoiningCondition,
        companyMasterID,
        userMasterID,
        userMasterIncludeModel,
        req
      );
      const getBranchJobData = await getAllBranchJobData(
        companyMasterID,
        allParentChidCompanyIDs,
        uploadObject,
        employeeJoiningCondition,
        fileUploadType
      );

      const responseData = [];
      const hasDuplicates = (array) => new Set(array).size !== array.length;
      const duplicateUser = new Set();
      const duplicateEmplyeecode = new Set();
      for (const row of excelReadData) {
        const responseObj = {
          userName: row[indexObj.employeeNameIndex],
          userNumber: '',
          employeeCode: row[indexObj.employeeCodeIndex]
            ? row[indexObj.employeeCodeIndex].toString().trim()
            : null,
          companyMasterID: companyMasterID,
          remarks: [],
          userMasterID: null,
          branchData: null,
          departmentData: null,
          designationData: null,
          reportsToData: [],
          divisionData: null,
          workingAreaData: null,
          workingLocationData: null,
          projectData: [],
          skillCategoryData: null,
        };
        if (!row[indexObj.employeeNumberIndex]) {
          responseObj.remarks.push(`Please enter a valid Mobile Number!`);
          responseData.push(responseObj);
          continue;
        } else {
          responseObj.userNumber = row[indexObj.employeeNumberIndex]
            .toString()
            .trim();
        }
        if (
          fileUploadType == FileUploadType.EMPLOYEE_CODE &&
          !row[indexObj.employeeCodeIndex]
        ) {
          responseObj.remarks.push(`Please enter a valid Employee Code!`);
          responseData.push(responseObj);
          continue;
        }

        if (duplicateUser.has(responseObj.userNumber)) {
          responseObj.remarks.push(
            `You have entered ${responseObj.userNumber} Mobile Number multiple times!`
          );
          responseData.push(responseObj);
          continue;
        }

        if (
          responseObj.employeeCode &&
          duplicateEmplyeecode.has(responseObj.employeeCode)
        ) {
          responseObj.remarks.push(
            `You have entered ${responseObj.employeeCode} Employee Code multiple times!`
          );
          responseData.push(responseObj);
          continue;
        }
        duplicateUser.add(responseObj.userNumber);
        if (responseObj.employeeCode)
          duplicateEmplyeecode.add(responseObj.employeeCode);
        let findUser = null;
        if (fileUploadType == FileUploadType.EMPLOYEE_CODE) {
          findUser = findAllUserData.find(
            (user) => user.employeeCode == responseObj.employeeCode
          );
        } else {
          findUser = findAllUserData.find(
            (user) => user.userMaster.userNumber == responseObj.userNumber
          );
        }

        if (!findUser) {
          if (fileUploadType == FileUploadType.EMPLOYEE_CODE) {
            responseObj.remarks.push(
              `User with Employee Code ${responseObj.employeeCode} does not exist!`
            );
          } else {
            responseObj.remarks.push(
              `User with Mobile Number ${responseObj.userNumber} does not exist!`
            );
            responseData.push(responseObj);
            continue;
          }
        }
        responseObj.userMasterID = findUser.userMasterID;

        if (uploadObject.isUploadBranch) {
          if (
            row[indexObj.branchIndex] &&
            row[indexObj.branchApplicableDateIndex]
          ) {
            let validDate = true;
            if (!isValidDate(row[indexObj.branchApplicableDateIndex])) {
              validDate = false;
              responseObj.remarks.push(
                message.usermessage.validDateFormat('Branch Applicable')
              );
            }

            const filteredBranch = getBranchJobData.allBranch.find(
              (item) => item.branchName === row[indexObj.branchIndex].trim()
            );
            if (!filteredBranch) {
              responseObj.remarks.push(
                message.usermessage.notFoundBranchJob(
                  'Branch',
                  row[indexObj.branchIndex].trim()
                )
              );
            } else {
              responseObj.branchData = {
                branchID: filteredBranch.branchMasterID,
                branchName: filteredBranch.branchName,
                applicableDate: row[indexObj.branchApplicableDateIndex],
                validDate,
              };
            }
          }
        }

        if (uploadObject.isUploadDepartment) {
          if (
            row[indexObj.departmentIndex] &&
            row[indexObj.departmentApplicableDateIndex]
          ) {
            let validDate = true;
            if (!isValidDate(row[indexObj.departmentApplicableDateIndex])) {
              validDate = false;
              responseObj.remarks.push(
                message.usermessage.validDateFormat('Department Applicable')
              );
            }

            const filteredDepartment = getBranchJobData.allDepartment.find(
              (item) =>
                item.departmentName === row[indexObj.departmentIndex].trim()
            );
            if (!filteredDepartment) {
              responseObj.remarks.push(
                message.usermessage.notFoundBranchJob(
                  'Department',
                  row[indexObj.departmentIndex].trim()
                )
              );
            } else {
              responseObj.departmentData = {
                departmentID: filteredDepartment.departmentId,
                departmentName: filteredDepartment.departmentName,
                applicableDate: row[indexObj.departmentApplicableDateIndex],
                validDate,
              };
            }
          }
        }

        if (uploadObject.isUploadDesignation) {
          if (
            row[indexObj.designationIndex] &&
            row[indexObj.designationApplicableDateIndex]
          ) {
            let validDate = true;
            if (!isValidDate(row[indexObj.designationApplicableDateIndex])) {
              validDate = false;
              responseObj.remarks.push(
                message.usermessage.validDateFormat('Designation Applicable')
              );
            }

            const filteredDesignation = getBranchJobData.allDesignation.find(
              (item) =>
                item.designationName === row[indexObj.designationIndex].trim()
            );
            if (!filteredDesignation) {
              responseObj.remarks.push(
                message.usermessage.notFoundBranchJob(
                  'Designation',
                  row[indexObj.designationIndex].trim()
                )
              );
            } else {
              responseObj.designationData = {
                designationID: filteredDesignation.designationId,
                designationName: filteredDesignation.designationName,
                applicableDate: row[indexObj.designationApplicableDateIndex],
                validDate,
              };
            }
          }
        }

        if (uploadObject.isUploadDivision) {
          if (
            row[indexObj.divisionIndex] &&
            row[indexObj.divisionApplicableDateIndex]
          ) {
            let validDate = true;
            if (!isValidDate(row[indexObj.divisionApplicableDateIndex])) {
              validDate = false;
              responseObj.remarks.push(
                message.usermessage.validDateFormat('Division Applicable')
              );
            }

            const filteredDivision = getBranchJobData.allDivision.find(
              (item) => item.divisionName === row[indexObj.divisionIndex].trim()
            );
            if (!filteredDivision) {
              responseObj.remarks.push(
                message.usermessage.notFoundBranchJob(
                  'Division',
                  row[indexObj.divisionIndex].trim()
                )
              );
            } else {
              responseObj.divisionData = {
                divisionId: filteredDivision.id,
                divisionName: filteredDivision.divisionName,
                startDate: row[indexObj.divisionApplicableDateIndex],
                validDate,
              };
            }
          }
        }

        if (uploadObject.isUploadProject) {
          if (
            row[indexObj.projectIndex] &&
            row[indexObj.projectApplicableDateIndex]
          ) {
            const allProjectNames = row[indexObj.projectIndex]
              .toString()
              .split(',');
            const allProjectApplicableDates =
              row[indexObj.projectApplicableDateIndex].split(',');
            if (allProjectNames.length != allProjectApplicableDates.length) {
              responseObj.remarks.push(
                'Project Name and Applicable Date Does Not Match'
              );
            } else {
              for (let i = 0; i < allProjectNames.length; i++) {
                const project = allProjectNames[i];
                const projectObj = {
                  projectID: null,
                  projectName: null,
                  startDate: '',
                  validDate: true,
                  userMasterID: responseObj.userMasterID,
                };
                const filteredProject = getBranchJobData.allProjects.find(
                  (item) => item.display_id === project.trim()
                );
                if (!isValidDate(allProjectApplicableDates[i])) {
                  projectObj.validDate = false;
                  responseObj.remarks.push(
                    message.usermessage.validDateFormat('Project Applicable')
                  );
                }
                if (!filteredProject) {
                  projectObj.projectID = 'Not Found';
                  projectObj.projectName = 'Not Found';
                  projectObj.startDate = 'Not Found';
                  responseObj.remarks.push(
                    message.usermessage.notFoundBranchJob(
                      'Project',
                      project.trim()
                    )
                  );
                } else {
                  projectObj.projectID = +filteredProject.projectID;
                  projectObj.projectName = filteredProject.projectName;
                  projectObj.startDate = allProjectApplicableDates[i];
                }
                responseObj.projectData.push(projectObj);
              }
            }
          }
        }

        if (uploadObject.isUploadReportsTo) {
          if (row[indexObj.reportsToIndex]) {
            const allReportsTos = row[indexObj.reportsToIndex]
              .toString()
              .split(',');
            const reportsToUserData = [];
            if (hasDuplicates(allReportsTos)) {
              responseObj.remarks.push('Duplicate ReportsTo Found!!');
            } else {
              for (let report of allReportsTos) {
                const reportsToObj = {
                  userMasterID: responseObj.userMasterID,
                  displayName: null,
                  userNumber: null,
                  employeeCode: null,
                };
                let filterData = null;
                if (fileUploadType == FileUploadType.EMPLOYEE_CODE) {
                  filterData = getBranchJobData.allUsers.find(
                    (user) =>
                      user.employeeJoiningDetails?.[0]?.employeeCode == report
                  );
                } else {
                  filterData = getBranchJobData.allUsers.find(
                    (user) => user.userNumber == report
                  );
                }
                if (!filterData) {
                  reportsToObj.reportToID = 'Not Found';
                  reportsToObj.displayName = 'Not Found';
                  reportsToObj.userNumber = 'Not Found';
                  reportsToObj.employeeCode = 'Not Found';
                  responseObj.remarks.push(
                    message.usermessage.notFoundBranchJob(
                      'Reports To ',
                      report.trim()
                    )
                  );
                } else {
                  reportsToObj.reportToID = +filterData.userMasterID;
                  reportsToObj.displayName = filterData.displayName;
                  reportsToObj.userNumber = filterData.userNumber;
                  reportsToObj.employeeCode =
                    filterData.employeeJoiningDetails?.[0]?.employeeCode ||
                    null;
                  if (reportsToObj.reportToID == responseObj.userMasterID) {
                    responseObj.remarks.push(
                      'Employee cannot report him/her self!'
                    );
                  }
                }

                reportsToUserData.push(reportsToObj);
              }
              responseObj.reportsToData = reportsToUserData;
            }
          }
        }

        if (uploadObject.isUploadSkillCategory) {
          if (
            row[indexObj.skillCategoryIndex] &&
            row[indexObj.skillCategoryApplicableMonthIndex]
          ) {
            let validYYYYMM = true;
            if (
              !isValidYearMonthCompact(
                row[indexObj.skillCategoryApplicableMonthIndex]
              )
            ) {
              validYYYYMM = false;
              responseObj.remarks.push(
                message.usermessage.validMonthFormat(
                  'Skill Category Applicable'
                )
              );
            }

            const filteredSkillCategory =
              getBranchJobData.allSkillCategory.find(
                (item) => item === row[indexObj.skillCategoryIndex].trim()
              );
            if (!filteredSkillCategory) {
              responseObj.remarks.push(
                message.usermessage.notFoundBranchJob(
                  'Skill Category',
                  row[indexObj.skillCategoryIndex].trim()
                )
              );
            } else {
              responseObj.skillCategoryData = {
                skillCategory: filteredSkillCategory,
                applicableYYYYMM:
                  row[indexObj.skillCategoryApplicableMonthIndex],
                validYYYYMM,
              };
            }
          }
        }

        if (uploadObject.isUploadWorkingArea) {
          if (
            row[indexObj.workingAreaIndex] &&
            row[indexObj.workingAreaApplicableDateIndex]
          ) {
            let validDate = true;
            if (!isValidDate(row[indexObj.workingAreaApplicableDateIndex])) {
              validDate = false;
              responseObj.remarks.push(
                message.usermessage.validDateFormat('Working Area Applicable')
              );
            }

            const filteredWorkingArea = getBranchJobData.allWorkingArea.find(
              (item) =>
                item.workingAreaName === row[indexObj.workingAreaIndex].trim()
            );
            if (!filteredWorkingArea) {
              responseObj.remarks.push(
                message.usermessage.notFoundBranchJob(
                  'Working Area',
                  row[indexObj.workingAreaIndex].trim()
                )
              );
            } else {
              responseObj.workingAreaData = {
                workingAreaId: filteredWorkingArea.id,
                workingAreaName: filteredWorkingArea.workingAreaName,
                startDate: row[indexObj.workingAreaApplicableDateIndex],
                validDate,
              };
            }
          }
        }

        if (uploadObject.isUploadWorkingLocation) {
          if (
            row[indexObj.workingLocationIndex] &&
            row[indexObj.workingLocationApplicableDateIndex]
          ) {
            const allWorkingLocationNames = row[indexObj.workingLocationIndex]
              .toString()
              .split(',');
            let validDate = true;
            if (
              !isValidDate(row[indexObj.workingLocationApplicableDateIndex])
            ) {
              validDate = false;
              responseObj.remarks.push(
                message.usermessage.validDateFormat(
                  'Working Location Applicable'
                )
              );
            }
            const workingLocationObj = {
              workingLocationIDs: [],
              workingLocationName: [],
              startDate: row[indexObj.workingLocationApplicableDateIndex],
              validDate,
            };

            for (let location of allWorkingLocationNames) {
              const filterdWorkingLocations =
                getBranchJobData.allWorkingLocation.find(
                  (item) => item.workingLocationName === location.trim()
                );
              if (!filterdWorkingLocations) {
                workingLocationObj.workingLocationIDs.push('Not Found');
                workingLocationObj.workingLocationName.push('Not Found');
                responseObj.remarks.push(
                  message.usermessage.notFoundBranchJob(
                    'Working Location',
                    location.trim()
                  )
                );
              } else {
                workingLocationObj.workingLocationIDs.push(
                  +filterdWorkingLocations.workingLocationID
                );
                workingLocationObj.workingLocationName.push(
                  filterdWorkingLocations.workingLocationName
                );
              }
            }
            responseObj.workingLocationData = workingLocationObj;
          }
        }

        responseData.push(responseObj);
      }
      return res.status(200).send({
        status: 200,
        data: responseData,
        uploadObject,
        message: message.usermessage.validateMessage('Branch/Job'),
      });
    });
  } catch (error) {
    next(error);
  }
};

exports.addValidateBranchJob = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      companyMasterID,
      userMasterID,
      uploadTypes,
      validatedBranchJobData,
    } = req.body;

    const createBy = req.userDetails.userMasterId;
    const createByIp = req.userDetails.userIpAddress;
    const updateBy = req.userDetails.userMasterId;
    const updateByIp = req.userDetails.userIpAddress;
    if (!companyMasterID)
      return res.status(200).json({
        status: 401,
        message: message.usermessage.passValidValidParameter('Company'),
      });
    if (!uploadTypes || uploadTypes.length == 0) {
      return res.status(200).json({
        status: 401,
        message: message.usermessage.passValidValidParameter('Upload Type'),
      });
    }
    if (!validatedBranchJobData || validatedBranchJobData.length == 0) {
      return res.status(200).json({
        status: 401,
        message: message.usermessage.passValidValidParameter('Branch/Job'),
      });
    }
    const currCompany = await CompanyMaster.findOne({
      where: { companyMasterID, status: 1 },
      attributes: [
        'companyMasterID',
        'parentCompanyMasterID',
        'fileUploadType',
        'companyName',
      ],
      raw: true,
    });
    let fileUploadType = FileUploadType.MOBILE_NUMBER;
    if (currCompany.fileUploadType == FileUploadType.EMPLOYEE_CODE)
      fileUploadType = FileUploadType.EMPLOYEE_CODE;
    const uploadObject = getUploadTypeObject(uploadTypes);
    const employeeJoiningCondition =
      getEmployeeJoiningCondition(fileUploadType);
    const findAllUserData = await findUserAllDataForAddBranchJob(
      employeeJoiningCondition,
      companyMasterID,
      userMasterID
    );
    let updatePromise = [];
    let deletePromise = [];
    let createBranch = [];
    let createDepartment = [];
    let createDesignation = [];
    let createDivision = [];
    let createProject = [];
    let createReportsTo = [];
    let createSkillCategory = [];
    let createWorkingArea = [];
    let createWorkingLocation = [];

    for (let data of validatedBranchJobData) {
      const findUser = findAllUserData.find(
        (e) => e.userMasterID == data.userMasterID
      );
      if (!findUser) continue;
      if (uploadObject.isUploadBranch) {
        if (data.branchData) {
          const process = branchAssignProcess(
            data,
            findUser,
            createBy,
            createByIp,
            transaction
          );

          createBranch.push(...process.create);
          updatePromise.push(...process.update);
        }
      }

      if (uploadObject.isUploadDepartment) {
        if (data.departmentData) {
          const process = departmentAssignProcess(
            data,
            findUser,
            createBy,
            createByIp,
            transaction
          );
          createDepartment.push(...process.create);
          updatePromise.push(...process.update);
        }
      }

      if (uploadObject.isUploadDesignation) {
        if (data.designationData) {
          const process = designationAssignProcess(
            data,
            findUser,
            createBy,
            createByIp,
            transaction
          );
          createDesignation.push(...process.create);
          updatePromise.push(...process.update);
        }
      }

      if (uploadObject.isUploadDivision) {
        if (data.divisionData) {
          const process = divisionAssignProcess(
            data,
            findUser,
            createBy,
            createByIp,
            transaction
          );
          createDivision.push(...process.create);
          updatePromise.push(...process.update);
        }
      }

      if (uploadObject.isUploadProject) {
        if (data.projectData && data.projectData.length) {
          const process = projectAssignProcess(
            data,
            findUser,
            createBy,
            createByIp,
            transaction
          );
          createProject.push(...process.create);
          updatePromise.push(...process.update);
        }
      }

      if (uploadObject.isUploadReportsTo) {
        if (data.reportsToData && data.reportsToData.length) {
          const process = reportsToAssignProcess(
            data,
            findUser,
            createBy,
            createByIp,
            transaction
          );
          createReportsTo.push(...process.create);
          updatePromise.push(...process.update);
          deletePromise.push(...process.delete);
        }
      }

      if (uploadObject.isUploadSkillCategory) {
        if (data.skillCategoryData) {
          const process = skillCategoryAssignProcess(
            data,
            findUser,
            createBy,
            createByIp,
            transaction
          );
          createSkillCategory.push(...process.create);
          updatePromise.push(...process.update);
        }
      }

      if (uploadObject.isUploadWorkingArea) {
        if (data.workingAreaData) {
          const process = workingAreaAssignProcess(
            data,
            findUser,
            createBy,
            createByIp,
            transaction
          );
          createWorkingArea.push(...process.create);
          updatePromise.push(...process.update);
        }
      }

      if (uploadObject.isUploadWorkingLocation) {
        if (data.workingLocationData) {
          const process = workingLocationAssignProcess(
            data,
            findUser,
            createBy,
            createByIp,
            transaction
          );
          createWorkingLocation.push(...process.create);
          updatePromise.push(...process.update);
        }
      }
    }

    // Update Bulk
    if (updatePromise.length > 0) {
      for (let i = 0; i < updatePromise.length; i += 50) {
        const chunk = updatePromise.slice(i, i + 50);
        await Promise.all(chunk);
      }
      updatePromise = [];
    }

    // Destroy Bulk
    if (deletePromise.length > 0) {
      for (let i = 0; i < deletePromise.length; i += 50) {
        const chunk = deletePromise.slice(i, i + 50);
        await Promise.all(chunk);
      }
      deletePromise = [];
    }
    const createPromise = [];
    if (uploadObject.isUploadBranch && createBranch.length) {
      createPromise.push(
        EmployeeBranch.bulkCreate(createBranch, {
          transaction,
        })
      );
    }

    if (uploadObject.isUploadDepartment && createDepartment.length) {
      createPromise.push(
        EmployeeDepartment.bulkCreate(createDepartment, {
          transaction,
        })
      );
    }

    if (uploadObject.isUploadDesignation && createDesignation.length) {
      createPromise.push(
        EmployeeDesignation.bulkCreate(createDesignation, {
          transaction,
        })
      );
    }

    if (uploadObject.isUploadDivision && createDivision.length) {
      createPromise.push(
        EmployeeDivision.bulkCreate(createDivision, { transaction })
      );
    }

    if (uploadObject.isUploadProject && createProject.length) {
      createPromise.push(
        EmployeeProject.bulkCreate(createProject, {
          hooks: false,
        })
      );
    }

    if (uploadObject.isUploadReportsTo && createReportsTo.length) {
      createPromise.push(
        EmployeeReportTo.bulkCreate(createReportsTo, { transaction })
      );
    }

    if (uploadObject.isUploadSkillCategory && createSkillCategory.length) {
      createPromise.push(
        await EmployeeSkillCategory.bulkCreate(createSkillCategory, {
          hooks: false,
          transaction,
        })
      );
    }

    if (uploadObject.isUploadWorkingArea && createWorkingArea.length) {
      createPromise.push(
        await EmployeeWorkingArea.bulkCreate(createWorkingArea, {
          transaction,
        })
      );
    }

    if (uploadObject.isUploadWorkingLocation && createWorkingLocation.length) {
      createPromise.push(
        await EmployeeWorkingLocation.bulkCreate(createWorkingLocation, {
          transaction,
        })
      );
    }
    await Promise.all(createPromise);

    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: message.usermessage.addMessage('Branch/Job'),
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

function getUploadTypeObject(uploadTypes) {
  const uploadObject = {
    isUploadBranch: uploadTypes.includes(updateBranchJobTypes.BRANCH),
    isUploadDepartment: uploadTypes.includes(updateBranchJobTypes.DEPARTMENT),
    isUploadDesignation: uploadTypes.includes(updateBranchJobTypes.DESIGNATION),
    isUploadReportsTo: uploadTypes.includes(updateBranchJobTypes.REPORTSTO),
    isUploadDivision: uploadTypes.includes(updateBranchJobTypes.DIVISION),
    isUploadWorkingArea: uploadTypes.includes(updateBranchJobTypes.WORKINGAREA),
    isUploadWorkingLocation: uploadTypes.includes(
      updateBranchJobTypes.WORKINGLOCATION
    ),
    isUploadProject: uploadTypes.includes(updateBranchJobTypes.PROJECT),
    isUploadSkillCategory: uploadTypes.includes(
      updateBranchJobTypes.SKILLCATEGORY
    ),
  };
  return uploadObject;
}

async function getAllBranchJobData(
  companyMasterID,
  allParentChidCompanyIDs,
  uploadObject,
  employeeJoiningCondition,
  fileUploadType
) {
  try {
    const currentDate = asiaKolkataDateTime(new Date()).slice(0, 10);
    const YYYYMM = currentDate.slice(0, 7).replace('-', '');
    const condition = {};

    condition.companyMasterID = companyMasterID;
    condition.status = 1;

    const [
      allUsers,
      allBranch,
      allDepartment,
      allDesignation,
      allDivision,
      allWorkingArea,
      allWorkingLocation,
      allProjects,
      allSkillCategory,
    ] = await Promise.all([
      // Always fetch users
      uploadObject.isUploadReportsTo
        ? UserMaster.findAll({
            where: { companyMasterId: allParentChidCompanyIDs, status: 1 },
            attributes: [
              'userMasterID',
              'userNumber',
              'displayName',
              'companyMasterId',
            ],
            include: [
              {
                required:
                  fileUploadType === FileUploadType.MOBILE_NUMBER
                    ? false
                    : true,
                model: EmployeeJoiningDetails,
                // where: employeeJoiningCondition,
                attributes: ['employeeJoiningDetailId', 'employeeCode'],
              },
              {
                model: EmployeeBranch,
                where: {
                  status: 1,
                  applicableDate: { [Sequelize.Op.lte]: new Date(currentDate) },
                  [Sequelize.Op.or]: [
                    { endDate: { [Sequelize.Op.gte]: new Date(currentDate) } },
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
                model: EmployeeDesignation,
                where: {
                  status: 1,
                  applicableDate: { [Sequelize.Op.lte]: new Date(currentDate) },
                  [Sequelize.Op.or]: [
                    { endDate: { [Sequelize.Op.gte]: new Date(currentDate) } },
                    { endDate: { [Sequelize.Op.eq]: null } },
                  ],
                },
                required: false,
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
                model: EmployeeDepartment,
                where: {
                  status: 1,
                  applicableDate: { [Sequelize.Op.lte]: new Date(currentDate) },
                  [Sequelize.Op.or]: [
                    { endDate: { [Sequelize.Op.gte]: new Date(currentDate) } },
                    { endDate: { [Sequelize.Op.eq]: null } },
                  ],
                },
                required: false,
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
                model: CompanyMaster,
                required: true,
                attributes: ['companyMasterID', 'companyName'],
              },
            ],
            order: [['displayName', 'ASC']],
          })
        : [],

      // Conditional data fetching
      uploadObject.isUploadBranch
        ? BranchMaster.findAll({
            raw: true,
            where: condition,
            attributes: ['branchMasterID', 'branchName'],
          })
        : [],

      uploadObject.isUploadDepartment
        ? Department.findAll({
            raw: true,
            where: condition,
            attributes: ['departmentId', 'departmentName'],
          })
        : [],

      uploadObject.isUploadDesignation
        ? Designation.findAll({
            raw: true,
            where: condition,
            attributes: ['designationId', 'designationName'],
          })
        : [],

      uploadObject.isUploadDivision
        ? Division.findAll({
            raw: true,
            where: condition,
            attributes: ['id', 'divisionName'],
          })
        : [],

      uploadObject.isUploadWorkingArea
        ? WorkingArea.findAll({
            raw: true,
            where: condition,
            attributes: ['id', 'workingAreaName'],
          })
        : [],

      uploadObject.isUploadWorkingLocation
        ? WorkingLocation.findAll({
            raw: true,
            where: condition,
            attributes: ['workingLocationID', 'workingLocationName'],
          })
        : [],

      uploadObject.isUploadProject
        ? Project.findAll({
            raw: true,
            where: condition,
            attributes: ['projectID', 'projectName', 'display_id'],
          })
        : [],

      uploadObject.isUploadSkillCategory
        ? [
            SkillCategoryType.SKILLED,
            SkillCategoryType.SEMISKILLED,
            SkillCategoryType.UNSKILLED,
          ]
        : [],
    ]);
    return {
      allUsers,
      allBranch,
      allDepartment,
      allDesignation,
      allDivision,
      allWorkingArea,
      allWorkingLocation,
      allProjects,
      allSkillCategory,
    };
  } catch (error) {
    throw new Error('Error in Get Branch Job Data: ' + error.message);
  }
}

function getUserIncludeModel(
  uploadObject,
  branchID,
  departmentID,
  designationID,
  workingAreaId,
  projectID,
  skillCategory,
  divisionId,
  fileUploadType
) {
  try {
    const currentDate = asiaKolkataDateTime(new Date()).slice(0, 10);
    const YYYYMM = currentDate.slice(0, 7).replace('-', '');
    const userMasterIncludeModel = [];
    if ((branchID && branchID.length) || uploadObject.isUploadBranch) {
      const branchModelObj = {
        required: branchID && branchID.length ? true : false,
        model: EmployeeBranch,
        where: {
          ...(branchID &&
            (!Array.isArray(branchID) || branchID.length) && {
              branchID: branchID,
            }),
          status: 1,
          applicableDate: { [Sequelize.Op.lte]: currentDate },
          [Sequelize.Op.or]: [
            { endDate: { [Sequelize.Op.gte]: currentDate } },
            { endDate: { [Sequelize.Op.eq]: null } },
          ],
        },

        attributes: ['branchID', 'applicableDate'],
        include: [
          {
            model: BranchMaster,
            as: 'branchMaster',
            attributes: ['branchName'],
          },
        ],
      };
      userMasterIncludeModel.push(branchModelObj);
    }
    if (
      (departmentID && departmentID.length) ||
      uploadObject.isUploadDepartment
    ) {
      const departmentModelObj = {
        required: departmentID && departmentID.length ? true : false,
        model: EmployeeDepartment,
        where: {
          status: 1,
          applicableDate: { [Sequelize.Op.lte]: currentDate },
          ...(departmentID &&
            departmentID.length && { departmentID: departmentID }),
          [Sequelize.Op.or]: [
            { endDate: { [Sequelize.Op.gte]: currentDate } },
            { endDate: { [Sequelize.Op.is]: null } },
          ],
        },
        attributes: ['departmentID', 'applicableDate'],
        include: [
          {
            model: Department,
            as: 'department',
            attributes: ['departmentName'],
          },
        ],
      };
      userMasterIncludeModel.push(departmentModelObj);
    }

    if (
      (designationID && designationID.length) ||
      uploadObject.isUploadDesignation
    ) {
      const desginationModelObj = {
        required: designationID && designationID.length ? true : false,
        model: EmployeeDesignation,
        where: {
          status: 1,
          ...(designationID &&
            (!Array.isArray(designationID) || designationID.length) && {
              designationID,
            }),
          applicableDate: {
            [Sequelize.Op.lte]: currentDate,
          },
          [Sequelize.Op.or]: [
            {
              endDate: {
                [Sequelize.Op.gte]: currentDate,
              },
            },
            { endDate: { [Sequelize.Op.eq]: null } },
          ],
        },

        attributes: ['designationID', 'applicableDate'],
        include: [
          {
            model: Designation,
            as: 'designation',
            attributes: ['designationName'],
          },
        ],
      };
      userMasterIncludeModel.push(desginationModelObj);
    }

    if (uploadObject.isUploadReportsTo) {
      const reportsToModelObj = {
        required: false,
        model: EmployeeReportTo,
        where: {
          status: 1,
        },
        include: [
          {
            model: UserMaster,
            as: 'reportTo',
            attributes: ['userMasterID', 'userNumber'],
            include: [
              {
                required:
                  fileUploadType == FileUploadType.MOBILE_NUMBER ? false : true,
                model: EmployeeJoiningDetails,
                attributes: ['employeeJoiningDetailId', 'employeeCode'],
              },
            ],
          },
        ],
      };
      userMasterIncludeModel.push(reportsToModelObj);
    }
    if ((divisionId && divisionId.length) || uploadObject.isUploadDivision) {
      const divisionModelObj = {
        required: divisionId && divisionId.length ? true : false,
        model: EmployeeDivision,
        where: {
          status: 1,
          ...(divisionId && { divisionId }),
          startDate: { [Sequelize.Op.lte]: currentDate },
          [Sequelize.Op.or]: [
            { endDate: { [Sequelize.Op.gte]: currentDate } },
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
      };
      userMasterIncludeModel.push(divisionModelObj);
    }
    if (
      (workingAreaId && workingAreaId.length) ||
      uploadObject.isUploadWorkingArea
    ) {
      const workingAreaModelObj = {
        required: workingAreaId && workingAreaId.length ? true : false,
        model: EmployeeWorkingArea,
        where: {
          status: 1,
          ...(workingAreaId &&
            (!Array.isArray(workingAreaId) || workingAreaId.length) && {
              workingAreaId,
            }),
          startDate: { [Sequelize.Op.lte]: currentDate },
          [Sequelize.Op.or]: [
            { endDate: { [Sequelize.Op.gte]: currentDate } },
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
      };
      userMasterIncludeModel.push(workingAreaModelObj);
    }
    if (uploadObject.isUploadWorkingLocation) {
      const workingLocationModelObj = {
        required: false,
        model: EmployeeWorkingLocation,
        where: {
          status: 1,
          startDate: { [Sequelize.Op.lte]: currentDate },
          [Sequelize.Op.or]: [
            { endDate: { [Sequelize.Op.gte]: currentDate } },
            { endDate: { [Sequelize.Op.eq]: null } },
          ],
        },

        attributes: ['workingLocationIDs', 'startDate'],
      };
      userMasterIncludeModel.push(workingLocationModelObj);
    }

    if ((projectID && projectID.length) || uploadObject.isUploadProject) {
      const projectModelObj = {
        required: projectID && projectID.length ? true : false,
        model: EmployeeProject,
        where: {
          status: 1,
          ...(projectID &&
            (!Array.isArray(projectID) || projectID.length) && {
              projectID,
            }),
          startDate: { [Sequelize.Op.lte]: currentDate },
          [Sequelize.Op.or]: [
            { releaseDate: { [Sequelize.Op.gte]: currentDate } },
            { releaseDate: { [Sequelize.Op.eq]: null } },
          ],
        },
        attributes: ['projectID', 'startDate'],

        include: [
          {
            model: Project,
            attributes: ['projectName', 'display_id'],
          },
        ],
      };
      userMasterIncludeModel.push(projectModelObj);
    }
    if (skillCategory || uploadObject.isUploadSkillCategory) {
      userMasterIncludeModel.push({
        required: skillCategory ? true : false,
        model: EmployeeSkillCategory,
        where: {
          ...(skillCategory && {
            skillCategory: skillCategory,
          }),
          applicableYYYYMM: { [Sequelize.Op.lte]: +YYYYMM },
          [Sequelize.Op.or]: [
            { endYYYYMM: { [Sequelize.Op.gte]: +YYYYMM } },
            { endYYYYMM: { [Sequelize.Op.eq]: null } },
          ],
        },
        attributes: ['skillCategory', 'applicableYYYYMM'],
      });
    }

    return userMasterIncludeModel;
  } catch (error) {
    throw new Error('Error in Get User Include Model: ' + error.message);
  }
}

async function findAllUserDataForBranchJob(
  employeeJoiningCondition,
  companyMasterID,
  userMasterID,
  userMasterIncludeModel,
  req
) {
  try {
    const findAllUserData = await EmployeeJoiningDetails.findAll({
      where: employeeJoiningCondition,
      include: [
        {
          required: true,
          model: UserMaster,
          where: {
            companyMasterId: companyMasterID,
            status: 1,
            ...(userMasterID &&
              (!Array.isArray(userMasterID) || userMasterID.length) && {
                userMasterID,
              }),
          },
          ...accessibleUsers(req.userDetails, false, false),
          include: userMasterIncludeModel,
          attributes: userAttributes,
        },
      ],
      order: [[{ model: UserMaster }, 'displayName', 'ASC']],
    });

    return findAllUserData;
  } catch (error) {
    throw new Error('Error in Get User Data For Branch Job: ' + error.message);
  }
}

function validateExcelIndex(uploadObject, indexObj) {
  try {
    let excelValidity = true;

    const validations = [
      {
        flag: uploadObject.isUploadBranch,
        indexes: [indexObj.branchIndex, indexObj.branchApplicableDateIndex],
      },
      {
        flag: uploadObject.isUploadDepartment,
        indexes: [
          indexObj.departmentIndex,
          indexObj.departmentApplicableDateIndex,
        ],
      },
      {
        flag: uploadObject.isUploadDesignation,
        indexes: [
          indexObj.designationIndex,
          indexObj.designationApplicableDateIndex,
        ],
      },
      {
        flag: uploadObject.isUploadReportsTo,
        indexes: [indexObj.reportsToIndex, indexObj.reportsToNameIndex],
      },
      {
        flag: uploadObject.isUploadDivision,
        indexes: [indexObj.divisionIndex, indexObj.divisionApplicableDateIndex],
      },
      {
        flag: uploadObject.isUploadWorkingArea,
        indexes: [
          indexObj.workingAreaIndex,
          indexObj.workingAreaApplicableDateIndex,
        ],
      },
      {
        flag: uploadObject.isUploadWorkingLocation,
        indexes: [
          indexObj.workingLocationIndex,
          indexObj.workingLocationApplicableDateIndex,
        ],
      },
      {
        flag: uploadObject.isUploadProject,
        indexes: [indexObj.projectIndex, indexObj.projectApplicableDateIndex],
      },
      {
        flag: uploadObject.isUploadSkillCategory,
        indexes: [
          indexObj.skillCategoryIndex,
          indexObj.skillCategoryApplicableMonthIndex,
        ],
      },
    ];

    for (const { flag, indexes } of validations) {
      if (flag && indexes.some((index) => index === -1)) {
        excelValidity = false;
        break;
      }
    }

    return excelValidity;
  } catch (error) {
    throw new Error('Error in Get Excel Validity: ' + error.message);
  }
}

function deleteUploadedExcelFile(filePath) {
  fs.unlink(filePath, function (err) {
    if (err) console.log(err);
  });
}

function deleteUploadedExcelFile(filePath) {
  fs.unlink(filePath, function (err) {
    if (err) console.log(err);
  });
}

function getEmployeeJoiningCondition(fileUploadType) {
  const currentDate = asiaKolkataDateTime(new Date()).slice(0, 10);

  const employeeJoiningCondition = {
    joiningDate: {
      [Sequelize.Op.lte]: new Date(currentDate),
    },
    [Sequelize.Op.or]: [
      {
        leavingDate: { [Sequelize.Op.gte]: new Date(currentDate) },
      },
      {
        leavingDate: { [Sequelize.Op.eq]: null },
        [Sequelize.Op.or]: [
          {
            '$userMaster.deactiveDate$': {
              [Sequelize.Op.gte]: currentDate,
            },
          },
          {
            '$userMaster.deactiveDate$': { [Sequelize.Op.eq]: null },
          },
        ],
      },
    ],
  };
  if (fileUploadType === FileUploadType.EMPLOYEE_CODE) {
    employeeJoiningCondition.employeeCode = {
      [Sequelize.Op.and]: [
        { [Sequelize.Op.ne]: null },
        { [Sequelize.Op.ne]: '' },
      ],
    };
  }

  return employeeJoiningCondition;
}

async function findUserAllDataForAddBranchJob(
  employeeJoiningCondition,
  companyMasterID,
  userMasterID
) {
  try {
    const findAllUserData = await EmployeeJoiningDetails.findAll({
      where: employeeJoiningCondition,
      include: [
        {
          required: true,
          model: UserMaster,
          where: {
            companyMasterId: companyMasterID,
            status: 1,
            ...(userMasterID &&
              (!Array.isArray(userMasterID) || userMasterID.length) && {
                userMasterID,
              }),
          },
          include: [
            {
              required: false,
              model: EmployeeBranch,
              where: {
                status: 1,
              },
              attributes: [
                'employeeBranchID',
                'branchID',
                'applicableDate',
                'endDate',
              ],
            },
            {
              required: false,
              model: EmployeeDepartment,
              where: {
                status: 1,
              },
              attributes: [
                'employeeDepartmentID',
                'departmentID',
                'applicableDate',
                'endDate',
              ],
            },
            {
              required: false,
              model: EmployeeDesignation,
              where: {
                status: 1,
              },
              attributes: [
                'employeeDesignationID',
                'designationID',
                'applicableDate',
                'endDate',
              ],
            },
            {
              required: false,
              model: EmployeeDivision,
              where: {
                status: 1,
              },
              attributes: ['id', 'divisionId', 'startDate', 'endDate'],
            },

            {
              required: false,
              model: EmployeeProject,
              where: {
                status: 1,
              },
              attributes: [
                'employeeProjectID',
                'projectID',
                'startDate',
                'releaseDate',
              ],
            },
            {
              required: false,
              model: EmployeeReportTo,
              where: {
                status: 1,
              },
              attributes: [
                'employeeReportToID',
                'userMasterID',
                'reportToID',
                'status',
              ],
            },
            {
              required: false,
              model: EmployeeSkillCategory,
              where: {
                status: 1,
              },
              attributes: [
                'id',
                'userMasterID',
                'skillCategory',
                'applicableYYYYMM',
                'endYYYYMM',
                'status',
              ],
            },
            {
              required: false,
              model: EmployeeWorkingArea,
              where: {
                status: 1,
              },
              attributes: [
                'id',
                'startDate',
                'endDate',
                'status',
                'workingAreaId',
              ],
            },
            {
              required: false,
              model: EmployeeWorkingLocation,
              where: {
                status: 1,
              },
              attributes: [
                'employeeWorkingLocationID',
                'userMasterID',
                'workingLocationIDs',
                'startDate',
                'endDate',
                'status',
              ],
            },
          ],
          attributes: userAttributes,
        },
      ],
    });
    return findAllUserData || [];
  } catch (error) {
    throw new Error('Error in Find all User Data: ' + error.message);
  }
}

function findNearestDates(startdates, applicableDate) {
  const sortedDateArray = startdates.sort((a, b) => a - b);
  return {
    nearestFutureDate: findNearestFutureDate(
      sortedDateArray,
      new Date(applicableDate)
    ),
    nearestPastDate: findNearestPastDate(
      sortedDateArray,
      new Date(applicableDate)
    ),
  };
}

const findNearestPastDate = (dateArr, date) => {
  const pastArr = dateArr.filter((n) => n <= date);
  return pastArr.length > 0 ? pastArr[pastArr.length - 1] : null;
};

const findNearestFutureDate = (dateArr, date) => {
  const futArr = dateArr.filter((n) => n >= date);
  return futArr.length > 0 ? futArr[0] : null;
};

function branchAssignProcess(
  data,
  findUser,
  createBy,
  createByIp,
  transaction
) {
  try {
    const update = [];
    const create = [];
    const changedData = data.branchData;
    const getEmployeeBranches = findUser.userMaster?.employeeBranches || [];
    const sameDateData = getEmployeeBranches.find(
      (e) =>
        new Date(e.applicableDate).getTime() ==
        new Date(changedData.applicableDate).getTime()
    );
    if (sameDateData) {
      update.push(
        EmployeeBranch.update(
          {
            branchID: changedData.branchID,
            updateBy: createBy,
            updateByIp: createByIp,
          },
          {
            where: {
              employeeBranchID: sameDateData.employeeBranchID,
            },
            transaction,
          }
        )
      );
    } else {
      if (getEmployeeBranches.length) {
        const startdates = [];
        for (let i = 0; i < getEmployeeBranches.length; i++) {
          startdates.push(new Date(getEmployeeBranches[i].applicableDate));
        }
        const getNearestDateData = findNearestDates(
          startdates,
          changedData.applicableDate
        );

        if (getNearestDateData.nearestPastDate != null) {
          update.push(
            EmployeeBranch.update(
              {
                endDate: new Date(
                  new Date(changedData.applicableDate).getTime() - 86400000
                ),
                updateBy: createBy,
                updateByIp: createByIp,
              },
              {
                where: {
                  applicableDate: getNearestDateData.nearestPastDate,
                  userMasterID: data.userMasterID,
                },
                transaction,
              }
            )
          );
        }
        if (getNearestDateData.nearestFutureDate != null) {
          const createObj = {
            userMasterID: data.userMasterID,
            branchID: changedData.branchID,
            applicableDate: changedData.applicableDate,
            endDate: getNearestDateData.nearestFutureDate.getTime() - 86400000,
            createBy,
            createByIp,
          };
          create.push(createObj);
        } else {
          const createObj = {
            userMasterID: data.userMasterID,
            branchID: changedData.branchID,
            applicableDate: changedData.applicableDate,
            createBy,
            createByIp,
          };
          create.push(createObj);
        }
      } else {
        const createObj = {
          userMasterID: data.userMasterID,
          branchID: changedData.branchID,
          applicableDate: changedData.applicableDate,
          createBy,
          createByIp,
        };
        create.push(createObj);
      }
    }
    return {
      update: update || [],
      create: create || [],
    };
  } catch (error) {
    throw new Error('Error in Assign Branch Process ' + error.message);
  }
}

function departmentAssignProcess(
  data,
  findUser,
  createBy,
  createByIp,
  transaction
) {
  try {
    const update = [];
    const create = [];
    const changedData = data.departmentData;
    const getEmployeeDepartments =
      findUser.userMaster?.employeeDepartments || [];
    const sameDateData = getEmployeeDepartments.find(
      (e) =>
        new Date(e.applicableDate).getTime() ==
        new Date(changedData.applicableDate).getTime()
    );
    if (sameDateData) {
      update.push(
        EmployeeDepartment.update(
          {
            departmentID: changedData.departmentID,
            updateBy: createBy,
            updateByIp: createByIp,
          },
          {
            where: {
              employeeDepartmentID: sameDateData.employeeDepartmentID,
            },
            transaction,
          }
        )
      );
    } else {
      if (getEmployeeDepartments.length) {
        const startdates = [];
        for (let i = 0; i < getEmployeeDepartments.length; i++) {
          startdates.push(new Date(getEmployeeDepartments[i].applicableDate));
        }
        const getNearestDateData = findNearestDates(
          startdates,
          changedData.applicableDate
        );

        if (getNearestDateData.nearestPastDate != null) {
          update.push(
            EmployeeDepartment.update(
              {
                endDate: new Date(
                  new Date(changedData.applicableDate).getTime() - 86400000
                ),
                updateBy: createBy,
                updateByIp: createByIp,
              },
              {
                where: {
                  applicableDate: getNearestDateData.nearestPastDate,
                  userMasterID: data.userMasterID,
                },
                transaction,
              }
            )
          );
        }
        if (getNearestDateData.nearestFutureDate != null) {
          const createObj = {
            userMasterID: data.userMasterID,
            departmentID: changedData.departmentID,
            applicableDate: changedData.applicableDate,
            endDate: getNearestDateData.nearestFutureDate.getTime() - 86400000,
            createBy,
            createByIp,
          };
          create.push(createObj);
        } else {
          const createObj = {
            userMasterID: data.userMasterID,
            departmentID: changedData.departmentID,
            applicableDate: changedData.applicableDate,
            createBy,
            createByIp,
          };
          create.push(createObj);
        }
      } else {
        const createObj = {
          userMasterID: data.userMasterID,
          departmentID: changedData.departmentID,
          applicableDate: changedData.applicableDate,
          createBy,
          createByIp,
        };
        create.push(createObj);
      }
    }
    return {
      update: update || [],
      create: create || [],
    };
  } catch (error) {
    throw new Error('Error in Assign Department Process ' + error.message);
  }
}

function designationAssignProcess(
  data,
  findUser,
  createBy,
  createByIp,
  transaction
) {
  try {
    const update = [];
    const create = [];
    const changedData = data.designationData;
    const getEmployeeDesignations =
      findUser.userMaster?.employeeDesignations || [];
    const sameDateData = getEmployeeDesignations.find(
      (e) =>
        new Date(e.applicableDate).getTime() ==
        new Date(changedData.applicableDate).getTime()
    );
    if (sameDateData) {
      update.push(
        EmployeeDesignation.update(
          {
            designationID: changedData.designationID,
            updateBy: createBy,
            updateByIp: createByIp,
          },
          {
            where: {
              employeeDesignationID: sameDateData.employeeDesignationID,
            },
            transaction,
          }
        )
      );
    } else {
      if (getEmployeeDesignations.length) {
        const startdates = [];
        for (let i = 0; i < getEmployeeDesignations.length; i++) {
          startdates.push(new Date(getEmployeeDesignations[i].applicableDate));
        }
        const getNearestDateData = findNearestDates(
          startdates,
          changedData.applicableDate
        );

        if (getNearestDateData.nearestPastDate != null) {
          update.push(
            EmployeeDesignation.update(
              {
                endDate: new Date(
                  new Date(changedData.applicableDate).getTime() - 86400000
                ),
                updateBy: createBy,
                updateByIp: createByIp,
              },
              {
                where: {
                  applicableDate: getNearestDateData.nearestPastDate,
                  userMasterID: data.userMasterID,
                },
                transaction,
              }
            )
          );
        }
        if (getNearestDateData.nearestFutureDate != null) {
          const createObj = {
            userMasterID: data.userMasterID,
            designationID: changedData.designationID,
            applicableDate: changedData.applicableDate,
            endDate: getNearestDateData.nearestFutureDate.getTime() - 86400000,
            createBy,
            createByIp,
          };
          create.push(createObj);
        } else {
          const createObj = {
            userMasterID: data.userMasterID,
            designationID: changedData.designationID,
            applicableDate: changedData.applicableDate,
            createBy,
            createByIp,
          };
          create.push(createObj);
        }
      } else {
        const createObj = {
          userMasterID: data.userMasterID,
          designationID: changedData.designationID,
          applicableDate: changedData.applicableDate,
          createBy,
        };
        create.push(createObj);
      }
    }
    return {
      update: update || [],
      create: create || [],
    };
  } catch (error) {
    throw new Error('Error in Assign Designation  Process ' + error.message);
  }
}

function divisionAssignProcess(
  data,
  findUser,
  createBy,
  createByIp,
  transaction
) {
  try {
    const update = [];
    const create = [];
    const changedData = data.divisionData;
    const getEmployeeDivisions = findUser.userMaster?.employeeDivisions || [];
    const sameDateData = getEmployeeDivisions.find(
      (e) =>
        new Date(e.startDate).getTime() ==
        new Date(changedData.startDate).getTime()
    );
    if (sameDateData) {
      update.push(
        EmployeeDivision.update(
          {
            divisionId: changedData.divisionId,
            updateBy: createBy,
            updateByIp: createByIp,
          },
          {
            where: {
              id: sameDateData.id,
            },
            transaction,
          }
        )
      );
    } else {
      if (getEmployeeDivisions.length) {
        const startdates = [];
        for (let i = 0; i < getEmployeeDivisions.length; i++) {
          startdates.push(new Date(getEmployeeDivisions[i].startDate));
        }
        const getNearestDateData = findNearestDates(
          startdates,
          changedData.startDate
        );

        if (getNearestDateData.nearestPastDate != null) {
          update.push(
            EmployeeDivision.update(
              {
                endDate: new Date(
                  new Date(changedData.startDate).getTime() - 86400000
                ),
                updateBy: createBy,
                updateByIp: createByIp,
              },
              {
                where: {
                  startDate: getNearestDateData.nearestPastDate,
                  userMasterID: data.userMasterID,
                },
                transaction,
              }
            )
          );
        }
        if (getNearestDateData.nearestFutureDate != null) {
          const createObj = {
            userMasterID: data.userMasterID,
            divisionId: changedData.divisionId,
            startDate: changedData.startDate,
            endDate: getNearestDateData.nearestFutureDate.getTime() - 86400000,
            createBy,
            createByIp,
          };
          create.push(createObj);
        } else {
          const createObj = {
            userMasterID: data.userMasterID,
            divisionId: changedData.divisionId,
            startDate: changedData.startDate,
            createBy,
            createByIp,
          };
          create.push(createObj);
        }
      } else {
        const createObj = {
          userMasterID: data.userMasterID,
          divisionId: changedData.divisionId,
          startDate: changedData.startDate,
          createBy,
        };
        create.push(createObj);
      }
    }
    return {
      update: update || [],
      create: create || [],
    };
  } catch (error) {
    throw new Error('Error in Assign Division  Process ' + error.message);
  }
}

function projectAssignProcess(
  data,
  findUser,
  createBy,
  createByIp,
  transaction
) {
  try {
    const update = [];
    const create = [];
    const changedData = data.projectData;
    const getEmployeeProjects = findUser.userMaster?.employeeProjects || [];
    for (let data of changedData) {
      const sameDateData =
        getEmployeeProjects && getEmployeeProjects.length
          ? getEmployeeProjects.find(
              (e) =>
                (e.releaseDate == null || e.releaseDate >= data.startDate) &&
                e.startDate <= data.startDate &&
                e.projectID == data.projectID
            )
          : null;
      if (!sameDateData) {
        const createObj = {
          userMasterID: data.userMasterID,
          projectID: data.projectID,
          startDate: data.startDate,
          createBy,
          createByIp,
        };
        create.push(createObj);
      }
    }

    return {
      update: update || [],
      create: create || [],
    };
  } catch (error) {
    throw new Error('Error in Assign Project  Process ' + error.message);
  }
}

function reportsToAssignProcess(data, findUser, createBy, createByIp) {
  try {
    const update = [];
    const create = [];
    const deleteData = [];
    const changedData = data.reportsToData;
    const getEmployeeReportTos = findUser.userMaster?.employeeReportTos || [];
    const notDeleteEmployeeReportToIDs = [];
    for (let item of changedData) {
      const alreadyReportsTo = getEmployeeReportTos.find(
        (e) => e.reportToID == item.reportToID
      );
      if (alreadyReportsTo) {
        notDeleteEmployeeReportToIDs.push(+alreadyReportsTo.employeeReportToID);
      } else {
        const createObj = {
          userMasterID: data.userMasterID,
          reportToID: item.reportToID,
          createBy,
          createByIp,
        };
        create.push(createObj);
      }
    }

    const toBeDeleteEmployeeReportToIDs = getEmployeeReportTos.filter(
      (e) => !notDeleteEmployeeReportToIDs.includes(e.employeeReportToID)
    );
    for (let data of toBeDeleteEmployeeReportToIDs) {
      const deleteReportsTo = EmployeeReportTo.destroy({
        where: { employeeReportToID: +data.employeeReportToID },
      });
      deleteData.push(deleteReportsTo);
    }
    return {
      update: update || [],
      create: create || [],
      delete: deleteData || [],
    };
  } catch (error) {
    throw new Error('Error in Assign Reports To  Process ' + error.message);
  }
}

function skillCategoryAssignProcess(
  data,
  findUser,
  createBy,
  createByIp,
  transaction
) {
  try {
    const update = [];
    const create = [];
    const changedData = data.skillCategoryData;
    const getEmployeeSkillCategories =
      findUser.userMaster?.employeeSkillCategories || [];
    const sameMonthData = getEmployeeSkillCategories.find(
      (e) => +e.applicableYYYYMM == +changedData.applicableYYYYMM
    );
    if (sameMonthData) {
      update.push(
        EmployeeSkillCategory.update(
          {
            skillCategory: changedData.skillCategory,
            updateBy: createBy,
            updateByIp: createByIp,
          },
          {
            where: {
              id: sameMonthData.id,
            },
            transaction,
          }
        )
      );
    } else {
      if (getEmployeeSkillCategories.length) {
        const applicableYYYYMMArray = getEmployeeSkillCategories.map(
          (e) => e.applicableYYYYMM
        );
        const getNearestDateData = findNearestNumbers(
          applicableYYYYMMArray,
          changedData.applicableYYYYMM
        );

        if (getNearestDateData.past) {
          update.push(
            EmployeeSkillCategory.update(
              {
                endYYYYMM: getPreviousMonth(+changedData.applicableYYYYMM),
                updateBy: createBy,
                updateByIp: createByIp,
              },
              {
                where: {
                  applicableYYYYMM: +getNearestDateData.past,
                  userMasterID: data.userMasterID,
                },
                transaction,
              }
            )
          );
        }
        if (getNearestDateData.future) {
          const createObj = {
            userMasterID: data.userMasterID,
            skillCategory: changedData.skillCategory,
            applicableYYYYMM: changedData.applicableYYYYMM,
            endYYYYMM: getPreviousMonth(+getNearestDateData.future),
            createBy,
            createByIp,
          };
          create.push(createObj);
        } else {
          const createObj = {
            userMasterID: data.userMasterID,
            skillCategory: changedData.skillCategory,
            applicableYYYYMM: changedData.applicableYYYYMM,
            createBy,
            createByIp,
          };
          create.push(createObj);
        }
      } else {
        const createObj = {
          userMasterID: data.userMasterID,
          skillCategory: changedData.skillCategory,
          applicableYYYYMM: changedData.applicableYYYYMM,
          createBy,
          createByIp,
        };
        create.push(createObj);
      }
    }
    return {
      update: update || [],
      create: create || [],
    };
  } catch (error) {
    throw new Error('Error in Assign Skill Category  Process ' + error.message);
  }
}

function workingAreaAssignProcess(
  data,
  findUser,
  createBy,
  createByIp,
  transaction
) {
  try {
    const update = [];
    const create = [];
    const changedData = data.workingAreaData;
    const getEmployeeWokingAreas =
      findUser.userMaster?.employeeWorkingAreas || [];
    const sameDateData = getEmployeeWokingAreas.find(
      (e) =>
        new Date(e.startDate).getTime() ==
        new Date(changedData.startDate).getTime()
    );
    if (sameDateData) {
      update.push(
        EmployeeWorkingArea.update(
          {
            workingAreaId: changedData.workingAreaId,
            updateBy: createBy,
            updateByIp: createByIp,
          },
          {
            where: {
              id: sameDateData.id,
            },
            transaction,
          }
        )
      );
    } else {
      if (getEmployeeWokingAreas.length) {
        const startdates = [];
        for (let i = 0; i < getEmployeeWokingAreas.length; i++) {
          startdates.push(new Date(getEmployeeWokingAreas[i].startDate));
        }
        const getNearestDateData = findNearestDates(
          startdates,
          changedData.startDate
        );

        if (getNearestDateData.nearestPastDate != null) {
          update.push(
            EmployeeWorkingArea.update(
              {
                endDate: new Date(
                  new Date(changedData.startDate).getTime() - 86400000
                ),
                updateBy: createBy,
                updateByIp: createByIp,
              },
              {
                where: {
                  startDate: getNearestDateData.nearestPastDate,
                  userMasterID: data.userMasterID,
                },
                transaction,
              }
            )
          );
        }
        if (getNearestDateData.nearestFutureDate != null) {
          const createObj = {
            userMasterID: data.userMasterID,
            workingAreaId: changedData.workingAreaId,
            startDate: changedData.startDate,
            endDate: getNearestDateData.nearestFutureDate.getTime() - 86400000,
            createBy,
            createByIp,
          };
          create.push(createObj);
        } else {
          const createObj = {
            userMasterID: data.userMasterID,
            workingAreaId: changedData.workingAreaId,
            startDate: changedData.startDate,
            createBy,
            createByIp,
          };
          create.push(createObj);
        }
      } else {
        const createObj = {
          userMasterID: data.userMasterID,
          workingAreaId: changedData.workingAreaId,
          startDate: changedData.startDate,
          createBy,
        };
        create.push(createObj);
      }
    }
    return {
      update: update || [],
      create: create || [],
    };
  } catch (error) {
    throw new Error('Error in Assign Working Area  Process ' + error.message);
  }
}

function workingLocationAssignProcess(
  data,
  findUser,
  createBy,
  createByIp,
  transaction
) {
  try {
    const update = [];
    const create = [];
    const changedData = data.workingLocationData;
    const getEmployeeWokingLocations =
      findUser.userMaster?.employeeWorkingLocations || [];
    const sameDateData = getEmployeeWokingLocations.find(
      (e) =>
        new Date(e.startDate).getTime() ==
        new Date(changedData.startDate).getTime()
    );
    if (sameDateData) {
      update.push(
        EmployeeWorkingLocation.update(
          {
            workingLocationIDs: changedData.workingLocationIDs,
            updateBy: createBy,
            updateByIp: createByIp,
          },
          {
            where: {
              employeeWorkingLocationID: sameDateData.employeeWorkingLocationID,
            },
            transaction,
          }
        )
      );
    } else {
      if (getEmployeeWokingLocations.length) {
        const startdates = [];
        for (let i = 0; i < getEmployeeWokingLocations.length; i++) {
          startdates.push(new Date(getEmployeeWokingLocations[i].startDate));
        }
        const getNearestDateData = findNearestDates(
          startdates,
          changedData.startDate
        );

        if (getNearestDateData.nearestPastDate != null) {
          update.push(
            EmployeeWorkingLocation.update(
              {
                endDate: new Date(
                  new Date(changedData.startDate).getTime() - 86400000
                ),
                updateBy: createBy,
                updateByIp: createByIp,
              },
              {
                where: {
                  startDate: getNearestDateData.nearestPastDate,
                  userMasterID: data.userMasterID,
                },
                transaction,
              }
            )
          );
        }
        if (getNearestDateData.nearestFutureDate != null) {
          const createObj = {
            userMasterID: data.userMasterID,
            workingLocationIDs: changedData.workingLocationIDs,
            startDate: changedData.startDate,
            endDate: getNearestDateData.nearestFutureDate.getTime() - 86400000,
            createBy,
            createByIp,
          };
          create.push(createObj);
        } else {
          const createObj = {
            userMasterID: data.userMasterID,
            workingLocationIDs: changedData.workingLocationIDs,
            startDate: changedData.startDate,
            createBy,
            createByIp,
          };
          create.push(createObj);
        }
      } else {
        const createObj = {
          userMasterID: data.userMasterID,
          workingLocationIDs: changedData.workingLocationIDs,
          startDate: changedData.startDate,
          createBy,
        };
        create.push(createObj);
      }
    }
    return {
      update: update || [],
      create: create || [],
    };
  } catch (error) {
    throw new Error(
      'Error in Assign Working Location  Process ' + error.message
    );
  }
}
