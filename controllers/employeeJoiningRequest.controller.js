const Sequelize = require('sequelize');
const EmployeeJoiningRequest = require('../models/employeeJoiningRequest');
const logger = require('../config/logger');
const ESICFamilyDetails = require('../models/esicFamilyDetails');
const message = require('../response_message/message');
const sequelize = require('../config/database');
const companyMaster = require('../models/companyMaster');
const UserMaster = require('../models/userMaster');
const BranchMaster = require('../models/branchMaster');
const Department = require('../models/department');
const Designation = require('../models/designation');
const BankMaster = require('../models/bankMaster');
const CityMaster = require('../models/citymaster');
const StateMaster = require('../models/statemaster');
const CountryMaster = require('../models/countrymaster');
const { JoiningRequestStatus, roleType } = require('../utils/dbUtils');
const EmployeeJoiningDetails = require('../models/employeeJoiningDetails');
const bcrypt = require('bcrypt');
const EmployeeBranch = require('../models/employeeBranch');
const EmployeeDepartment = require('../models/employeeDepartment');
const EmployeeDesignation = require('../models/employeeDesignation');
const EsicFamilyDetails = require('../models/esicFamilyDetails');
const userFamily = require('../models/userfamily');
const UserRole = require('../models/userRole');
const RoleMaster = require('../models/roleMaster');
const { generateExcel } = require('../utils/exportData');
const UniformDetail = require('../models/uniformDetail');
const UserDocument = require('../models/userDocument');
const EmployeeDigitalSignature = require('../models/employeeDigitalSignature');
const { base64Topng } = require('../utils/base64Topng');
const path = require('path');
const fs = require('fs');
const { generatePDFWithImage } = require('../utils/pdfGenerate');
const { accessibleUsers } = require('../utils/commonUtilFunctions');
const CompanySubscriptionMaster = require('../models/subscriptionPlan');

exports.addemployeeJoiningRequest = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    let {
      userMasterID,
      companyMasterID,
      branchMasterID,
      departmentId,
      designationId,
      bankMasterID,
      presentAddressCityID,
      permenetAddressCityID,
      mobileNumber,
      aadharNumber,
      dateOfJoining,
      photo,
      firstName,
      lastName,
      nameAsAAdhar,
      presentAddress,
      permenetAddress,
      dob,
      maratialStatus,
      gender,
      panCardNo,
      shirtSize,
      pantSize,
      shoesSize,
      salary,
      bankAccountNumber,
      IFSCNumber,
      ESICNumber,
      uanNumber,
      nestedbody,
      declarationFormPhoto,
      drivingLicensePhoto,
      panCardPhoto,
      aadharCardPhoto,
      bankPassbookPhoto,
      candidateSignature,
      createBy,
      createByIp,
      remarks,
      middleName,
    } = req.body;
    if (mobileNumber) {
      const mobile_number = await UserMaster.findOne({
        where: {
          userNumber: mobileNumber,
          status: [0, 1],
        },
      });

      if (mobile_number) {
        await transaction.rollback();
        return res.status(200).json({
          status: 401,
          message: message.usermessage.alreadyExists('Mobile Number'),
        });
      }
    }
    if (aadharNumber) {
      const aadhar_Number = await EmployeeJoiningDetails.findOne({
        where: {
          adharCard: aadharNumber,
          status: [0, 1],
        },
        include: [
          {
            required: true,
            model: UserMaster,
            where: {
              status: [0, 1],
              companyMasterId: companyMasterID,
            },
            attributes: ['displayName'],
          },
        ],
      });

      if (aadhar_Number) {
        await transaction.rollback();
        return res.status(200).json({
          status: 401,
          message: message.usermessage.alreadyExists('Aadhar Number'),
        });
      }
    }
    if (req.files.photo && req.files.photo[0]) {
      photo = req.files.photo[0].filename;
    }
    if (req.files.aadharCardPhoto && req.files.aadharCardPhoto[0]) {
      aadharCardPhoto = req.files.aadharCardPhoto[0].filename;
    }

    if (req.files.panCardPhoto && req.files.panCardPhoto[0]) {
      panCardPhoto = req.files.panCardPhoto[0].filename;
    }

    if (req.files.drivingLicensePhoto && req.files.drivingLicensePhoto[0]) {
      drivingLicensePhoto = req.files.drivingLicensePhoto[0].filename;
    }

    if (req.files.declarationFormPhoto && req.files.declarationFormPhoto[0]) {
      declarationFormPhoto = req.files.declarationFormPhoto[0].filename;
    }

    if (req.files.bankPassbookPhoto && req.files.bankPassbookPhoto[0]) {
      bankPassbookPhoto = req.files.bankPassbookPhoto[0].filename;
    }

    if (candidateSignature) {
      let dataUrl = candidateSignature;
      candidateSignature = `signature_${Date.now()}.png`;

      const filePath = path.join(__dirname, '../uploads/user/signature');

      base64Topng(dataUrl, candidateSignature, filePath);
    }
    if (nestedbody) {
      nestedbody = JSON.parse(nestedbody);
    }

    if (presentAddressCityID) {
      presentAddressCityID = JSON.parse(presentAddressCityID);
    }

    if (permenetAddressCityID) {
      permenetAddressCityID = JSON.parse(permenetAddressCityID);
    }
    const JoiningRequestStatus1 = JoiningRequestStatus.PENDING;
    const addEmployeeJoiningRequest = await EmployeeJoiningRequest.create(
      {
        userMasterID,
        companyMasterID,
        branchMasterID,
        departmentId,
        designationId,
        bankMasterID,
        presentAddressCityID,
        permenetAddressCityID,
        mobileNumber,
        aadharNumber,
        dateOfJoining,
        photo,
        firstName,
        lastName,
        nameAsAAdhar,
        presentAddress,
        permenetAddress,
        dob,
        maratialStatus,
        gender,
        panCardNo,
        shirtSize,
        pantSize,
        shoesSize,
        salary,
        bankAccountNumber,
        ESICNumber,
        IFSCNumber,
        uanNumber,
        JoiningRequestStatus: JoiningRequestStatus1,
        createBy,
        createByIp,
        aadharCardPhoto,
        panCardPhoto,
        drivingLicensePhoto,
        bankPassbookPhoto,
        declarationFormPhoto,
        candidateSignature,
        remarks,
        middleName,
      },
      { transaction }
    );

    await ESICFamilyDetails.bulkCreate(
      nestedbody.map((item) => ({
        employeeJoiningRequestID:
          addEmployeeJoiningRequest.employeeJoiningRequestID,
        familyMemberName: item.familyMemberName,
        dob: item.dob,
        relation: item.relation,
        gender: item.gender,
        createBy,
        createByIp,
      })),
      { transaction }
    );

    await transaction.commit();
    res.status(200).json({
      message: message.usermessage.addemployeeJoiningRequest,
      status: 200,
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

exports.getallEmployeeJoiningRequest = async (req, res, next) => {
  try {
    let {
      page,
      limit,
      searchQuery,
      companyMasterID,
      JoiningRequestStatus,
      branchMasterID,
      startdate,
      enddate,
      exportData,
    } = await req.query;
    const condition = {};
    condition.companyMasterID = companyMasterID;
    if (JoiningRequestStatus) {
      condition.JoiningRequestStatus = JoiningRequestStatus;
    }
    if (branchMasterID) {
      condition.branchMasterID = branchMasterID;
    } else {
      if (req.userDetails && req.userDetails.role) {
        if (req.userDetails.role.roleType == roleType.BRANCH_WISE) {
          condition.branchMasterID = {
            [Sequelize.Op.in]: req.userDetails.accessibleBranches || [],
          };
        }
      }
    }

    if (startdate && enddate) {
      enddate = new Date(enddate);
      enddate.setDate(enddate.getDate() + 1);
      condition.createdAt = {
        [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
      };
    }

    condition.status = 1;
    if (searchQuery)
      condition[Sequelize.Op.or] = [
        { firstName: { [Sequelize.Op.iLike]: `%${searchQuery}%` } },
        { lastName: { [Sequelize.Op.iLike]: `%${searchQuery}%` } },
        { mobileNumber: { [Sequelize.Op.iLike]: `%${searchQuery}%` } },
      ];

    const paginationQuery = {};
    if (!exportData && page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = +limit;
    }

    const { rows: EmployeeJoiningRequestData, count } =
      await EmployeeJoiningRequest.findAndCountAll({
        distinct: true,
        where: condition,
        ...paginationQuery,
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: companyMaster,
            attributes: ['companyMasterID', 'companyName'],
          },
          {
            model: UserMaster,
            where: {
              status: 1,
            },
            attributes: ['userMasterID', 'displayName', 'userNumber'],
          },
          {
            model: BranchMaster,
            attributes: ['branchMasterID', 'branchName'],
          },
          {
            model: Department,
            attributes: ['departmentId', 'departmentName'],
          },
          {
            model: Designation,
            attributes: ['designationId', 'designationName'],
          },
          {
            model: BankMaster,
            attributes: ['bankMasterID', 'bankName'],
          },
          {
            model: CityMaster,
            as: 'presentAddressCity',
            include: [
              {
                model: StateMaster,
                include: [
                  {
                    model: CountryMaster,
                    attributes: ['countryMasterID', 'countryName'],
                  },
                ],
                attributes: ['stateMasterID', 'stateName'],
              },
            ],
            attributes: ['cityMasterID', 'cityName'],
          },
          {
            model: CityMaster,
            as: 'permenentAddressCity',
            include: [
              {
                model: StateMaster,
                include: [
                  {
                    model: CountryMaster,
                    attributes: ['countryMasterID', 'countryName'],
                  },
                ],
                attributes: ['stateMasterID', 'stateName'],
              },
            ],
            attributes: ['cityMasterID', 'cityName'],
          },
          {
            model: ESICFamilyDetails,
            where: {
              status: 1,
            },
            required: false,
            attributes: [
              'esicFamilyDetailsID',
              'familyMemberName',
              'dob',
              'relation',
              'gender',
            ],
          },
        ],
      });
    for (var i = 0; i < EmployeeJoiningRequestData.length; i++) {
      let getCreatedby = await UserMaster.findOne({
        where: {
          userMasterID: EmployeeJoiningRequestData[i].createBy,
        },
        attributes: ['displayName'],
      });
      EmployeeJoiningRequestData[i].createBy = getCreatedby
        ? getCreatedby.displayName
        : '';

      let updateBy = await UserMaster.findOne({
        where: {
          userMasterID: EmployeeJoiningRequestData[i].updateBy,
        },
        attributes: ['displayName'],
      });
      EmployeeJoiningRequestData[i].updateBy = updateBy
        ? updateBy.displayName
        : '';
    }

    if (exportData) {
      const finalData = [];

      for (var item of EmployeeJoiningRequestData) {
        const temp = {
          'Company Name': item.companyMaster.companyName,
          'Branch Name': item.branchMaster.branchName,
          'Department Name': item.department.departmentName,
          'Designation Name': item.designation.designationName,
          'First Name': item.firstName,
          'Middle Name': item.middleName,
          'Last Name': item.lastName,
          'Mobile Number': item.mobileNumber,
          'Aadhar Number': item.aadharNumber,
          'Name As AAdhar': item.nameAsAAdhar,
          'Pan Card Number': item.panCardNo,
          'Joining Date': item.dateOfJoining
            ? item.dateOfJoining.split('-').reverse().join('/')
            : '',
          'Present Address': item.presentAddress,
          'Permenent Address': item.permenetAddress,
          'Date Of Birth': item.dob
            ? item.dob.split('-').reverse().join('/')
            : '',
          'Maritial Status': item.maratialStatus,
          Gender: item.gender,
          'Shoes Size': item.shoesSize,
          'Shirt Size': item.shirtSize,
          'Pant Size': item.pantSize,
          Salary: item.salary,
          'Bank Name': item.bankMaster.bankName,

          'Bank Account Number': item.bankAccountNumber,
          'Bank IFSC Number': item.IFSCNumber,
          'ESIC Number': item.ESICNumber,
          'UAN Number': item.uanNumber,
          Remarks: item.remarks,
        };
        finalData.push(temp);
      }
      await generateExcel(finalData, 'Exployee Joining Request', 'xlsx', res);
      return;
    }

    return res.status(200).json({
      status: 200,
      data: EmployeeJoiningRequestData,
      totalcount: count,
    });
  } catch (err) {
    next(err);
  }
};

exports.getEmployeeJoiningRequestById = async (req, res, next) => {
  try {
    const getEmployeeJoiningRequestById = await EmployeeJoiningRequest.findOne({
      where: {
        employeeJoiningRequestID: req.params.id,
      },
      include: [
        {
          model: companyMaster,
          attributes: ['companyName'],
        },
        {
          model: UserMaster,
          attributes: ['displayName', 'userNumber'],
        },
        {
          model: BranchMaster,
          attributes: ['branchName'],
        },
        {
          model: Department,
          attributes: ['departmentName'],
        },
        {
          model: Designation,
          attributes: ['designationName'],
        },
        {
          model: BankMaster,
          attributes: ['bankName'],
        },
        {
          model: CityMaster,
          as: 'presentAddressCity',
          include: [
            {
              model: StateMaster,
              include: [
                {
                  model: CountryMaster,
                  attributes: ['countryMasterID', 'countryName'],
                },
              ],
              attributes: ['stateMasterID', 'stateName'],
            },
          ],
          attributes: ['cityMasterID', 'cityName'],
        },
        {
          model: CityMaster,
          as: 'permenentAddressCity',
          include: [
            {
              model: StateMaster,
              include: [
                {
                  model: CountryMaster,
                  attributes: ['countryMasterID', 'countryName'],
                },
              ],
              attributes: ['stateMasterID', 'stateName'],
            },
          ],
          attributes: ['cityMasterID', 'cityName'],
        },
        {
          model: ESICFamilyDetails,
          where: {
            status: 1,
          },
          required: false,
          attributes: [
            'esicFamilyDetailsID',
            'familyMemberName',
            'dob',
            'relation',
            'gender',
          ],
        },
      ],
    });
    if (!getEmployeeJoiningRequestById) {
      return res.status(200).json({
        status: 200,
        message: message.usermessage.getemployeeJoiningRequestByID,
      });
    }

    return res
      .status(200)
      .json({ status: 200, data: getEmployeeJoiningRequestById });
  } catch (err) {
    next(err);
  }
};

exports.editAllEmployeeJoiningRequest = async (req, res, next) => {
  try {
    let {
      employeeJoiningRequestID,
      userMasterID,
      companyMasterID,
      branchMasterID,
      departmentId,
      designationId,
      bankMasterID,
      presentAddressCityID,
      permenetAddressCityID,
      mobileNumber,
      aadharNumber,
      dateOfJoining,
      firstName,
      lastName,
      nameAsAAdhar,
      presentAddress,
      permenetAddress,
      dob,
      photo,
      maratialStatus,
      gender,
      panCardNo,
      shirtSize,
      pantSize,
      shoesSize,
      salary,
      bankAccountNumber,
      IFSCNumber,
      ESICNumber,
      uanNumber,
      nestedbody,
      updateBy,
      updateByIp,
      aadharCardPhoto,
      panCardPhoto,
      drivingLicensePhoto,
      bankPassbookPhoto,
      declarationFormPhoto,
      candidateSignature,
      remarks,
      middleName,
    } = await req.body;
    if (mobileNumber) {
      const mobile_number = await UserMaster.findOne({
        where: {
          userNumber: mobileNumber,
          status: [0, 1],
        },
      });

      if (mobile_number) {
        return res.status(200).json({
          status: 401,
          message: message.usermessage.alreadyExists('Mobile Number'),
        });
      }
    }
    if (aadharNumber) {
      const aadhar_Number = await EmployeeJoiningDetails.findOne({
        where: {
          adharCard: aadharNumber,
          status: [0, 1],
        },
        include: [
          {
            required: true,
            model: UserMaster,
            where: {
              status: [0, 1],
              companyMasterId: companyMasterID,
            },
            attributes: ['displayName'],
          },
        ],
      });

      if (aadhar_Number) {
        return res.status(200).json({
          status: 401,
          message: message.usermessage.alreadyExists('Aadhar Number'),
        });
      }
    }
    if (req.files) {
      if (req.files.photo && req.files.photo[0]) {
        photo = req.files.photo[0].filename;
      }
      if (req.files.aadharCardPhoto && req.files.aadharCardPhoto[0]) {
        aadharCardPhoto = req.files.aadharCardPhoto[0].filename;
      }

      if (req.files.panCardPhoto && req.files.panCardPhoto[0]) {
        panCardPhoto = req.files.panCardPhoto[0].filename;
      }

      if (req.files.drivingLicensePhoto && req.files.drivingLicensePhoto[0]) {
        drivingLicensePhoto = req.files.drivingLicensePhoto[0].filename;
      }

      if (req.files.declarationFormPhoto && req.files.declarationFormPhoto[0]) {
        declarationFormPhoto = req.files.declarationFormPhoto[0].filename;
      }

      if (req.files.bankPassbookPhoto && req.files.bankPassbookPhoto[0]) {
        bankPassbookPhoto = req.files.bankPassbookPhoto[0].filename;
      }
      if (
        candidateSignature &&
        (candidateSignature.endsWith('.png') ||
          candidateSignature.endsWith('.jpeg') ||
          candidateSignature.endsWith('.jpg'))
      ) {
        candidateSignature = candidateSignature;
      } else if (candidateSignature) {
        let getCandidateImage = await EmployeeJoiningRequest.findOne({
          where: { employeeJoiningRequestID },
          attributes: ['candidateSignature'],
        });
        if (getCandidateImage.candidateSignature) {
          const path = path.join(
            __dirname,
            `../uploads/user/signature/${getCandidateImage.candidateSignature}`
          );

          fs.unlink(path, function (err) {
            if (err) {
              console.log(err);
            } else {
              console.log('file updated on server successfully');
            }
          });
        }
        let dataUrl = candidateSignature;
        candidateSignature = `signature_${Date.now()}.png`;
        const filePath = path.join(__dirname, '../uploads/user/signature');
        base64Topng(dataUrl, candidateSignature, filePath);
      }
    }
    if (!nestedbody || nestedbody.length == 0) {
      nestedbody = [];
    }

    if (nestedbody) {
      nestedbody = JSON.parse(nestedbody);
    }
    if (presentAddressCityID) {
      presentAddressCityID = JSON.parse(presentAddressCityID);
    }
    if (permenetAddressCityID) {
      permenetAddressCityID = JSON.parse(permenetAddressCityID);
    }
    const JoiningRequestStatus = 'Pending';
    await EmployeeJoiningRequest.update(
      {
        userMasterID,
        companyMasterID,
        branchMasterID,
        departmentId,
        designationId,
        bankMasterID,
        presentAddressCityID,
        permenetAddressCityID,
        mobileNumber,
        aadharNumber,
        dateOfJoining,
        firstName,
        lastName,
        nameAsAAdhar,
        presentAddress,
        permenetAddress,
        dob,
        photo,
        maratialStatus,
        gender,
        panCardNo,
        shirtSize,
        pantSize,
        shoesSize,
        salary,
        bankAccountNumber,
        JoiningRequestStatus,
        IFSCNumber,
        ESICNumber,
        uanNumber,
        updateBy,
        updateByIp,
        aadharCardPhoto,
        panCardPhoto,
        drivingLicensePhoto,
        bankPassbookPhoto,
        declarationFormPhoto,
        candidateSignature,
        remarks,
        middleName,
      },
      {
        where: { employeeJoiningRequestID },
      }
    );

    for (var i = 0; i < nestedbody.length; i++) {
      let condition = {};
      if (nestedbody[i].esicFamilyDetailsID && nestedbody[i].deleted == false) {
        condition.esicFamilyDetailsID = nestedbody[i].esicFamilyDetailsID;
        await ESICFamilyDetails.update(
          {
            employeeJoiningRequestID: employeeJoiningRequestID,
            familyMemberName: nestedbody[i].familyMemberName,
            dob: nestedbody[i].dob,
            relation: nestedbody[i].relation,
            gender: nestedbody[i].gender,
            updateBy,
            updateByIp,
          },
          {
            where: condition,
          }
        );
      } else if (!nestedbody[i].esicFamilyDetailsID) {
        await ESICFamilyDetails.create({
          employeeJoiningRequestID: employeeJoiningRequestID,
          familyMemberName: nestedbody[i].familyMemberName,
          dob: nestedbody[i].dob,
          relation: nestedbody[i].relation,
          gender: nestedbody[i].gender,
          createBy: updateBy,
          createByIp: updateByIp,
        });
      } else if (
        nestedbody[i].esicFamilyDetailsID &&
        nestedbody[i].deleted == true
      ) {
        condition.esicFamilyDetailsID = nestedbody[i].esicFamilyDetailsID;
        await ESICFamilyDetails.update(
          {
            status: 2,
          },
          {
            where: condition,
          }
        );
      }
    }

    return res.status(200).json({
      status: 200,
      message: message.usermessage.editemployeeJoiningRequest,
    });
  } catch (err) {
    next(err);
  }
};

exports.editStatusEmployeeJoiningRequest = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    let {
      employeeJoiningRequestID,
      JoiningRequestStatus,
      rejectionRemarks,
      updateBy,
      updateByIp,
    } = req.body;
    if (JoiningRequestStatus == 'Approved') {
      const EmployeeJoiningRequestData = await EmployeeJoiningRequest.findOne(
        {
          where: {
            employeeJoiningRequestID,
          },
        },
        {
          transaction,
        }
      );
      const companyMasterID = EmployeeJoiningRequestData.companyMasterID;
      const existCompanyData = await companyMaster.findOne({
        where: {
          companyMasterID: companyMasterID,
        },
      });
      if (!existCompanyData) {
        return res.status(200).json({
          status: 404,
          message: message.usermessage.notFoundMessage('Company'),
        });
      }
      const condition = {
        status: 1,
      };
      if (+existCompanyData.parentCompanyMasterID != 0) {
        // For Child Company
        condition[Sequelize.Op.or] = [
          {
            parentCompanyMasterID: existCompanyData.parentCompanyMasterID,
          },
          {
            companyMasterID: existCompanyData.parentCompanyMasterID,
          },
        ];
      } else {
        // For Child Company
        condition[Sequelize.Op.or] = [
          {
            parentCompanyMasterID: +companyMasterID,
          },
          {
            companyMasterID: +companyMasterID,
          },
        ];
      }
      const companyData = await companyMaster.findAll({
        where: condition,
        include: [
          {
            required: false,
            model: CompanySubscriptionMaster,
            where: { status: 1 },
          },
        ],
      });
      const findParentCompany = companyData.find(
        (e) => +e.parentCompanyMasterID == 0
      );
      const companyMasterIDs = companyData.map((e) => +e.companyMasterID);

      const companySubscription =
        findParentCompany?.companySubscriptions?.[0] || null;

      if (companySubscription) {
        const totalCompanyUser = await UserMaster.count({
          raw: true,
          where: {
            companyMasterId: {
              [Sequelize.Op.in]: companyMasterIDs,
            },
            status: 1,
          },
        });

        if (totalCompanyUser >= companySubscription.totalUser) {
          return res.json({
            status: 401,
            message:
              'Your user limit has been reached. Please upgrade your plan.',
          });
        }
      } else {
        return res.json({
          status: 401,
          message: message.usermessage.usersubscribeplan,
        });
      }
      const mobile_number = await UserMaster.findAll({
        where: {
          userNumber: EmployeeJoiningRequestData.mobileNumber,
          status: 1,
        },
      });

      if (mobile_number.length > 0) {
        await transaction.rollback();
        return res.status(200).json({
          status: 401,
          message: message.usermessage.alreadyExists('Mobile Number'),
        });
      } else {
        await EmployeeJoiningRequest.update(
          {
            JoiningRequestStatus: JoiningRequestStatus,
            updateBy,
            updateByIp,
          },
          {
            where: {
              employeeJoiningRequestID,
            },
          },
          {
            transaction,
          }
        );

        let ESICfalimiyData = await EsicFamilyDetails.findAll(
          {
            where: {
              employeeJoiningRequestID,
              status: 1,
            },
          },
          {
            transaction,
          }
        );

        const salt = await bcrypt.genSalt(10);
        const password = bcrypt.hashSync(
          EmployeeJoiningRequestData.firstName.substring(0, 4).toLowerCase() +
            '' +
            String(EmployeeJoiningRequestData.mobileNumber).slice(-4),
          salt
        );
        let userNumber = EmployeeJoiningRequestData.mobileNumber;
        let photo = EmployeeJoiningRequestData.photo;
        let resetpassword = 1;
        let maratialStatus = EmployeeJoiningRequestData.maratialStatus;
        let physicalDisability = null;
        let isonboarding = null;
        let firstName = EmployeeJoiningRequestData.firstName;
        let lastName = EmployeeJoiningRequestData.lastName;
        let middleName = EmployeeJoiningRequestData.middleName
          ? EmployeeJoiningRequestData.middleName
          : '';
        let displayName = firstName + middleName + lastName;
        let gender = EmployeeJoiningRequestData.gender;
        let dob = EmployeeJoiningRequestData.dob;
        let companyMasterId = EmployeeJoiningRequestData.companyMasterID;
        let email = null;
        const addUserMaster = await UserMaster.create(
          {
            firstName,
            lastName,
            displayName,
            userNumber,
            photo,
            gender,
            dob,
            maratialStatus,
            physicalDisability,
            isonboarding,
            companyMasterId,
            password,
            email,
            admin: 0,
            resetpassword,
            createBy: updateBy,
            createByIp: updateByIp,
            middleName,
          },
          { transaction }
        );
        let userMasterID = addUserMaster.userMasterID;
        let applicableDate = EmployeeJoiningRequestData.dateOfJoining;
        await EmployeeJoiningDetails.create(
          {
            userMasterID,
            joiningDate: EmployeeJoiningRequestData.dateOfJoining,
            adharCard: EmployeeJoiningRequestData.aadharNumber,
            esicNumber: EmployeeJoiningRequestData.ESICNumber,
            uanNumber: EmployeeJoiningRequestData.uanNumber,
            pancard: EmployeeJoiningRequestData.panCardNo,
            bankMasterID: EmployeeJoiningRequestData.bankMasterID,
            bankIFSC: EmployeeJoiningRequestData.IFSCNumber,
            bankAccountNo: EmployeeJoiningRequestData.bankAccountNumber,
            adharName: EmployeeJoiningRequestData.nameAsAAdhar,
            adharPhoto: EmployeeJoiningRequestData.aadharCardPhoto,
            panPhoto: EmployeeJoiningRequestData.panCardPhoto,
            createBy: updateBy,
            createByIp: updateByIp,
          },
          { transaction }
        );
        await userFamily.bulkCreate(
          ESICfalimiyData.map((item) => ({
            userMasterID: addUserMaster.userMasterID,
            memberName: item.familyMemberName,
            dob: item.dob,
            gender: item.gender,
            relation: item.relation,
            contact: null,
            createBy: updateBy,
            createByIp: updateByIp,
            verifyStatus: 1,
            nominee: null,
            percentForNominee: null,
            verifyBy: updateBy,
          })),
          { transaction }
        );
        const findEmployeeRole = await RoleMaster.findOne(
          {
            where: {
              companyMasterID: EmployeeJoiningRequestData.companyMasterID,
              roleName: 'Employee',
            },
          },
          { hooks: false, transaction }
        );

        await UserRole.create(
          {
            userMasterID: addUserMaster.userMasterID,
            roleMasterID: findEmployeeRole.roleMasterID,
            createBy: updateBy,
            createByIp: updateByIp,
          },
          { hooks: false, transaction }
        );

        await UniformDetail.create(
          {
            userMasterID,
            shirtSize: EmployeeJoiningRequestData.shirtSize,
            pantSize: EmployeeJoiningRequestData.pantSize,
            shoeSize: EmployeeJoiningRequestData.shoesSize,
            createBy: updateBy,
            createByIp: updateByIp,
          },
          { hooks: false, transaction }
        );
        await EmployeeBranch.create(
          {
            userMasterID,
            branchID: EmployeeJoiningRequestData.branchMasterID,
            applicableDate,
            status: '1',
            createBy: updateBy,
            createByIp: updateByIp,
          },
          { transaction }
        );

        await EmployeeDepartment.create(
          {
            userMasterID,
            departmentID: EmployeeJoiningRequestData.departmentId,
            applicableDate,
            status: '1',
            createBy: updateBy,
            createByIp: updateByIp,
          },
          { transaction }
        );
        await EmployeeDesignation.create(
          {
            userMasterID,
            designationID: EmployeeJoiningRequestData.designationId,
            applicableDate,
            status: '1',
            createBy: updateBy,
            createByIp: updateByIp,
          },
          { transaction }
        );

        if (EmployeeJoiningRequestData.candidateSignature) {
          await EmployeeDigitalSignature.create(
            {
              userMasterID,
              signature: EmployeeJoiningRequestData.candidateSignature,
              createBy: updateBy,
              createByIp: updateByIp,
            },
            { transaction }
          );
        }
        if (EmployeeJoiningRequestData.aadharCardPhoto) {
          await UserDocument.create(
            {
              userMasterID,
              documentListID: 1,
              document: EmployeeJoiningRequestData.aadharCardPhoto
                ? EmployeeJoiningRequestData.aadharCardPhoto
                : null,
              createBy: updateBy,
              createByIp: updateByIp,
              verifyStatus: 1,
              verifyBy: req.userDetails.userMasterId,
              documentNumber: EmployeeJoiningRequestData.aadharNumber
                ? EmployeeJoiningRequestData.aadharNumber
                : null,
              nameOnDocument: EmployeeJoiningRequestData.nameAsAAdhar
                ? EmployeeJoiningRequestData.nameAsAAdhar
                : null,
            },
            { transaction }
          );
        }
        if (EmployeeJoiningRequestData.panCardPhoto) {
          await UserDocument.create(
            {
              userMasterID,
              documentListID: 2,
              document: EmployeeJoiningRequestData.panCardPhoto
                ? EmployeeJoiningRequestData.panCardPhoto
                : null,
              createBy: updateBy,
              createByIp: updateByIp,
              verifyStatus: 1,
              verifyBy: req.userDetails.userMasterId,
              documentNumber: EmployeeJoiningRequestData.panCardNo
                ? EmployeeJoiningRequestData.panCardNo
                : null,
            },
            { transaction }
          );
        }
        if (EmployeeJoiningRequestData.drivingLicensePhoto) {
          await UserDocument.create(
            {
              userMasterID,
              documentListID: 4,
              document: EmployeeJoiningRequestData.drivingLicensePhoto
                ? EmployeeJoiningRequestData.drivingLicensePhoto
                : null,
              createBy: updateBy,
              createByIp: updateByIp,
              verifyStatus: 1,
              verifyBy: req.userDetails.userMasterId,
            },
            { transaction }
          );
        }
        if (EmployeeJoiningRequestData.bankPassbookPhoto) {
          await UserDocument.create(
            {
              userMasterID,
              documentListID: 47,
              document: EmployeeJoiningRequestData.bankPassbookPhoto
                ? EmployeeJoiningRequestData.bankPassbookPhoto
                : null,
              createBy: updateBy,
              createByIp: updateByIp,
              verifyStatus: 1,
              verifyBy: req.userDetails.userMasterId,
            },
            { transaction }
          );
        }
        if (EmployeeJoiningRequestData.declarationFormPhoto) {
          await UserDocument.create(
            {
              userMasterID,
              documentListID: 48,
              document: EmployeeJoiningRequestData.declarationFormPhoto
                ? EmployeeJoiningRequestData.declarationFormPhoto
                : null,
              createBy: updateBy,
              createByIp: updateByIp,
              verifyStatus: 1,
              verifyBy: req.userDetails.userMasterId,
            },
            { transaction }
          );
        }
      }
    } else if (JoiningRequestStatus == 'Reject') {
      await EmployeeJoiningRequest.update(
        {
          JoiningRequestStatus: JoiningRequestStatus,
          rejectionRemarks: rejectionRemarks,
          updateBy,
          updateByIp,
        },
        {
          where: {
            employeeJoiningRequestID,
          },
        },
        {
          transaction,
        }
      );
    }

    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: message.usermessage.editStatusemployeeJoiningRequest,
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

exports.removeImages = async (req, res, next) => {
  try {
    const { employeeJoiningRequestID, imageType } = await req.body;

    const employeeJoiningRequest = await EmployeeJoiningRequest.findOne({
      where: { employeeJoiningRequestID },
      attributes: [
        'photo',
        'aadharCardPhoto',
        'panCardPhoto',
        'drivingLicensePhoto',
        'bankPassbookPhoto',
        'declarationFormPhoto',
        'candidateSignature',
      ],
    });

    if (
      imageType === 'aadharCardPhoto' &&
      employeeJoiningRequest.aadharCardPhoto
    ) {
      const logoPath = path.join(
        __dirname,
        '../uploads/user/document/',
        employeeJoiningRequest.aadharCardPhoto
      );
      if (fs.existsSync(logoPath)) {
        fs.unlinkSync(logoPath);
      }
      await EmployeeJoiningRequest.update(
        {
          aadharCardPhoto: '',
        },
        {
          where: { employeeJoiningRequestID: employeeJoiningRequestID },
        }
      );

      return res.status(200).json({
        status: 200,
        message: message.usermessage.deleteMessage('Aadhar Card Photo'),
      });
    } else if (
      imageType === 'panCardPhoto' &&
      employeeJoiningRequest.panCardPhoto
    ) {
      const logoPath = path.join(
        __dirname,
        '../uploads/user/document/',
        employeeJoiningRequest.panCardPhoto
      );
      if (fs.existsSync(logoPath)) {
        fs.unlinkSync(logoPath);
      }
      await EmployeeJoiningRequest.update(
        {
          panCardPhoto: '',
        },
        {
          where: { employeeJoiningRequestID: employeeJoiningRequestID },
        }
      );

      return res.status(200).json({
        status: 200,
        message: message.usermessage.deleteMessage('PAN Card Photo'),
      });
    } else if (
      imageType === 'drivingLicensePhoto' &&
      employeeJoiningRequest.drivingLicensePhoto
    ) {
      const logoPath = path.join(
        __dirname,
        '../uploads/user/document/',
        employeeJoiningRequest.drivingLicensePhoto
      );
      if (fs.existsSync(logoPath)) {
        fs.unlinkSync(logoPath);
      }
      await EmployeeJoiningRequest.update(
        {
          drivingLicensePhoto: '',
        },
        {
          where: { employeeJoiningRequestID: employeeJoiningRequestID },
        }
      );

      return res.status(200).json({
        status: 200,
        message: message.usermessage.deleteMessage('Driving License Photo'),
      });
    } else if (
      imageType === 'bankPassbookPhoto' &&
      employeeJoiningRequest.bankPassbookPhoto
    ) {
      const logoPath = path.join(
        __dirname,
        '../uploads/user/document/',
        employeeJoiningRequest.bankPassbookPhoto
      );
      if (fs.existsSync(logoPath)) {
        fs.unlinkSync(logoPath);
      }
      await EmployeeJoiningRequest.update(
        {
          bankPassbookPhoto: '',
        },
        {
          where: { employeeJoiningRequestID: employeeJoiningRequestID },
        }
      );

      return res.status(200).json({
        status: 200,
        message: message.usermessage.deleteMessage('Pass-Book Photo'),
      });
    } else if (
      imageType === 'declarationFormPhoto' &&
      employeeJoiningRequest.declarationFormPhoto
    ) {
      const logoPath = path.join(
        __dirname,
        '../uploads/user/document/',
        employeeJoiningRequest.declarationFormPhoto
      );
      if (fs.existsSync(logoPath)) {
        fs.unlinkSync(logoPath);
      }
      await EmployeeJoiningRequest.update(
        {
          declarationFormPhoto: '',
        },
        {
          where: { employeeJoiningRequestID: employeeJoiningRequestID },
        }
      );

      return res.status(200).json({
        status: 200,
        message: message.usermessage.deleteMessage('Declaration-Form Photo'),
      });
    } else if (
      imageType === 'candidateSignature' &&
      employeeJoiningRequest.candidateSignature
    ) {
      const logoPath = path.join(
        __dirname,
        '../uploads/user/signature/',
        employeeJoiningRequest.candidateSignature
      );
      if (fs.existsSync(logoPath)) {
        fs.unlinkSync(logoPath);
      }
      await EmployeeJoiningRequest.update(
        {
          candidateSignature: '',
        },
        {
          where: { employeeJoiningRequestID: employeeJoiningRequestID },
        }
      );

      return res.status(200).json({
        status: 200,
        message: message.usermessage.deleteMessage('Candidate Signature Photo'),
      });
    } else if (imageType === 'photo' && employeeJoiningRequest.photo) {
      const logoPath = path.join(
        __dirname,
        '../uploads/user/photo/',
        employeeJoiningRequest.photo
      );
      if (fs.existsSync(logoPath)) {
        fs.unlinkSync(logoPath);
      }
      await EmployeeJoiningRequest.update(
        {
          photo: '',
        },
        {
          where: { employeeJoiningRequestID: employeeJoiningRequestID },
        }
      );

      return res.status(200).json({
        status: 200,
        message: message.usermessage.deleteMessage('Candidate Photo'),
      });
    }
  } catch (err) {
    next(err);
  }
};

exports.employeejoiningRequestFormDownload = async (req, res, next) => {
  try {
    let { employeeJoiningRequestID } = await req.query;
    const getEmployeeJoiningRequestById = await EmployeeJoiningRequest.findOne({
      // raw: true,
      where: {
        employeeJoiningRequestID: employeeJoiningRequestID,
      },
      include: [
        {
          model: companyMaster,
          attributes: ['companyName', 'companyAddress'],
        },
        {
          model: UserMaster,
          attributes: ['displayName', 'userNumber'],
        },
        {
          model: BranchMaster,
          attributes: ['branchName'],
        },
        {
          model: Department,
          attributes: ['departmentName'],
        },
        {
          model: Designation,
          attributes: ['designationName'],
        },
        {
          model: BankMaster,
          attributes: ['bankName'],
        },
        {
          model: CityMaster,
          as: 'presentAddressCity',
          include: [
            {
              model: StateMaster,
              include: [
                {
                  model: CountryMaster,
                  attributes: ['countryMasterID', 'countryName'],
                },
              ],
              attributes: ['stateMasterID', 'stateName'],
            },
          ],
          attributes: ['cityMasterID', 'cityName'],
        },
        {
          model: CityMaster,
          as: 'permenentAddressCity',
          include: [
            {
              model: StateMaster,
              include: [
                {
                  model: CountryMaster,
                  attributes: ['countryMasterID', 'countryName'],
                },
              ],
              attributes: ['stateMasterID', 'stateName'],
            },
          ],
          attributes: ['cityMasterID', 'cityName'],
        },
        {
          model: ESICFamilyDetails,
          where: {
            status: 1,
          },
          required: false,
          attributes: [
            'esicFamilyDetailsID',
            'familyMemberName',
            'dob',
            'relation',
            'gender',
          ],
        },
      ],
    });

    if (!getEmployeeJoiningRequestById) {
      return res.status(200).json({
        status: 200,
        message: message.usermessage.getemployeeJoiningRequestByID,
      });
    }
    const basicInformation = {
      companyName: getEmployeeJoiningRequestById.companyMaster.companyName,
      companyAddress:
        getEmployeeJoiningRequestById.companyMaster.companyAddress,
      branchName: getEmployeeJoiningRequestById.branchMaster.branchName,
      departmentName: getEmployeeJoiningRequestById.department.departmentName,
      designationName:
        getEmployeeJoiningRequestById.designation.designationName,
      firstName: getEmployeeJoiningRequestById.firstName,
      middleName: getEmployeeJoiningRequestById.middleName,
      lastName: getEmployeeJoiningRequestById.lastName,
      mobileNumber: getEmployeeJoiningRequestById.mobileNumber,
      aadharNumber: getEmployeeJoiningRequestById.aadharNumber,
      nameAsAAdhar: getEmployeeJoiningRequestById.nameAsAAdhar,
      panCardNo: getEmployeeJoiningRequestById.panCardNo,
      dateOfJoining: getEmployeeJoiningRequestById.dateOfJoining
        ? getEmployeeJoiningRequestById.dateOfJoining
            .split('-')
            .reverse()
            .join('/')
        : '',
      presentAddress: getEmployeeJoiningRequestById.presentAddress,
      permenetAddress: getEmployeeJoiningRequestById.permenetAddress,
      dob: getEmployeeJoiningRequestById.dob
        ? getEmployeeJoiningRequestById.dob.split('-').reverse().join('/')
        : '',
      maratialStatus: getEmployeeJoiningRequestById.maratialStatus,
      gender: getEmployeeJoiningRequestById.gender,
      shoesSize: getEmployeeJoiningRequestById.shoesSize,
      shirtSize: getEmployeeJoiningRequestById.shirtSize,
      pantSize: getEmployeeJoiningRequestById.pantSize,
      salary: getEmployeeJoiningRequestById.salary,
      bankName: getEmployeeJoiningRequestById.bankMaster.bankName,
      bankAccountNumber: getEmployeeJoiningRequestById.bankAccountNumber,
      IFSCNumber: getEmployeeJoiningRequestById.IFSCNumber,
      ESICNumber: getEmployeeJoiningRequestById.ESICNumber,
      uanNumber: getEmployeeJoiningRequestById.uanNumber,
      remarks: getEmployeeJoiningRequestById.remarks,
      photo: getEmployeeJoiningRequestById.photo,
      aadharCardPhoto: getEmployeeJoiningRequestById.aadharCardPhoto,
      panCardPhoto: getEmployeeJoiningRequestById.panCardPhoto,
      drivingLicensePhoto: getEmployeeJoiningRequestById.drivingLicensePhoto,
      bankPassbookPhoto: getEmployeeJoiningRequestById.bankPassbookPhoto,
      declarationFormPhoto: getEmployeeJoiningRequestById.declarationFormPhoto,
      candidateSignature: getEmployeeJoiningRequestById.candidateSignature,
    };
    const esicFamilyDetailsArray =
      getEmployeeJoiningRequestById.esicFamilyDetails
        ? getEmployeeJoiningRequestById.esicFamilyDetails.map((detail) => ({
            esicFamilyDetailsID: detail.esicFamilyDetailsID,
            familyMemberName: detail.familyMemberName,
            dob: detail.dob,
            relation: detail.relation,
            gender: detail.gender,
          }))
        : [];
    const apiUrl = process.env.APIURL;

    const personalInformation = `
    <tr>
      <th colspan="2"><h4>Personal Information</h4></th>
    </tr>
    <tr>
      <th>First Name</th>
      <td>${basicInformation.firstName}</td>
    </tr>
    <tr>
      <th>Middle Name</th>
      <td>${basicInformation.middleName}</td>
    </tr>
    <tr>
      <th>Last Name</th>
      <td>${basicInformation.lastName}</td>
    </tr>
    <tr>
      <th>Candidate Photo</th>
      <td>
        ${
          basicInformation.photo &&
          (basicInformation.photo != null || basicInformation.photo != '')
            ? `
        <img
          class="img2"
          style="
            object-fit: cover;
            width: auto;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100px;
          "
          src="${apiUrl}uploads/user/photo/${basicInformation.photo}"
        />
        `
            : '&nbsp;&nbsp;'
        }
      </td>
    </tr>
    <tr>
      <th>Mobile Number</th>
      <td>${basicInformation.mobileNumber}</td>
    </tr>
    <tr>
      <th>Aadhar Number</th>
      <td>${basicInformation.aadharNumber}</td>
    </tr>
    <tr>
      <th>Name as Aadhar</th>
      <td>${basicInformation.nameAsAAdhar}</td>
    </tr>
    <tr>
      <th>Aadhar Photo</th>
      <td>
        ${
          basicInformation.aadharCardPhoto &&
          (basicInformation.aadharCardPhoto != null ||
            basicInformation.aadharCardPhoto != '')
            ? `
        <img
          class="img2"
          style="
            object-fit: cover;
            width: auto;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100px;
          "
          src="${apiUrl}uploads/user/document/${basicInformation.aadharCardPhoto}"
        />
        `
            : '&nbsp;&nbsp;'
        }
      </td>
    </tr>
    <tr>
      <th>Pan Card Number</th>
      <td>${basicInformation.panCardNo}</td>
    </tr>
    <tr>
      <th>PAN Photo</th>
      <td>
        ${
          basicInformation.panCardPhoto &&
          (basicInformation.panCardPhoto != null ||
            basicInformation.panCardPhoto != '')
            ? `
        <img
          class="img2"
          style="
            object-fit: cover;
            width: auto;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100px;
          "
          src="${apiUrl}uploads/user/document/${basicInformation.panCardPhoto}"
        />
        `
            : '&nbsp;&nbsp;'
        }
      </td>
    </tr>
    <tr>
      <th>Driving License Photo</th>
      <td>
        ${
          basicInformation.drivingLicensePhoto &&
          (basicInformation.drivingLicensePhoto != null ||
            basicInformation.drivingLicensePhoto != '')
            ? `
        <img
          class="img2"
          style="
            object-fit: cover;
            width: auto;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100px;
          "
          src="${apiUrl}uploads/user/document/${basicInformation.drivingLicensePhoto}"
        />
        `
            : '&nbsp;&nbsp;'
        }
      </td>
    </tr>
    <tr>
      <th>Date Of Birth</th>
      <td>${basicInformation.dob}</td>
    </tr>
    <tr>
      <th>Marital Status</th>
      <td>${basicInformation.maratialStatus}</td>
    </tr>
    <tr>
      <th>Gender</th>
      <td>${basicInformation.gender}</td>
    </tr>
            <tr>
      <th>Date Of Joining</th>
      <td>${basicInformation.dateOfJoining}</td>
    </tr>
    `;

    const addressinformation = `
        <div class="pageBreak"></div>

    <tr>
      <th colspan="2"><h4>Address Details</h4></th>
    </tr>
    <tr>
      <th>Designation Name</th>
      <td>${basicInformation.designationName}</td>
    </tr>
    <tr>
      <th>Present Address</th>
      <td>${basicInformation.presentAddress}</td>
    </tr>
    <tr>
      <th>Permenet Address</th>
      <td>${basicInformation.permenetAddress}</td>
    </tr>
    `;

    const uniformDetail = `
    <tr>
      <th colspan="2"><h4>Uniform Deatils</h4></th>
    </tr>
    <tr>
      <th>Shoes Size</th>
      <td>${basicInformation.shoesSize}</td>
    </tr>
    <tr>
      <th>Shirt Size</th>
      <td>${basicInformation.shirtSize}</td>
    </tr>
    <tr>
      <th>Pant Size</th>
      <td>${basicInformation.pantSize}</td>
    </tr>
    `;

    const ImporttantInformation = `
      <tr>
      <th colspan="2"><h4>Important Information</h4></th>
    </tr>
    <tr>
      <th>Company Name</th>
      <td>${basicInformation.companyName}</td>
    </tr>
    <tr>
      <th>Branch Name</th>
      <td>${basicInformation.branchName}</td>
    </tr>
    <tr>
      <th>Department Name</th>
      <td>${basicInformation.departmentName}</td>
    </tr>
    <tr>
      <th>Salary</th>
      <td>${basicInformation.salary}</td>
    </tr>
    `;

    const bankDetails = `
        <div class="pageBreak"></div>

    <tr>
      <th colspan="2"><h4>Bank Details</h4></th>
    </tr>
    <tr>
      <th>Bank Name</th>
      <td>${basicInformation.bankName}</td>
    </tr>
    <tr>
      <th>Bank Account Number</th>
      <td>${basicInformation.bankAccountNumber}</td>
    </tr>
    <tr>
      <th>IFSC Number</th>
      <td>${basicInformation.IFSCNumber}</td>
    </tr>
    <tr>
      <th>Bank Passbook Photo</th>
      <td>
        ${
          basicInformation.bankPassbookPhoto &&
          (basicInformation.bankPassbookPhoto != null ||
            basicInformation.bankPassbookPhoto != '')
            ? `
        <img
          class="img2"
          style="
            object-fit: cover;
            width: auto;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100px;
          "
          src="${apiUrl}uploads/user/document/${basicInformation.bankPassbookPhoto}"
        />
        `
            : '&nbsp;&nbsp;'
        }
      </td>
    </tr>
    <tr>
      <th>ESIC Number</th>
      <td>${basicInformation.ESICNumber}</td>
    </tr>
    <tr>
      <th>UAN Number</th>
      <td>${basicInformation.uanNumber}</td>
    </tr>
    <tr>
      <th>Declaration Form Photo</th>
      <td>
        ${
          basicInformation.declarationFormPhoto &&
          (basicInformation.declarationFormPhoto != null ||
            basicInformation.declarationFormPhoto != '')
            ? `
        <img
          class="img2"
          style="
            object-fit: cover;
            width: auto;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100px;
          "
          src="${apiUrl}uploads/user/document/${basicInformation.declarationFormPhoto}"
        />
        `
            : '&nbsp;&nbsp;'
        }
      </td>
    </tr>
    `;

    let esicFamilyMemberDetalisHeader = `
        <tr>
          <th colspan="4">Esic Family Details</th>
        </tr>
        <tr>
          <td>Family Member Name</td>
          <td>Date Of Birth</td>
          <td>Relation</td>
          <td>Gender</td>
        </tr>
        `;

    const singatureDetails = `
    <tr>
      <th>Candidate Signature</th>
      <td>
        ${
          basicInformation.candidateSignature &&
          (basicInformation.candidateSignature != null ||
            basicInformation.candidateSignature != '')
            ? `
        <img
          class="img2"
          style="
            object-fit: cover;
            width: auto;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100px;
          "
          src="${apiUrl}uploads/user/signature/${basicInformation.candidateSignature}"
        />
        `
            : '&nbsp;&nbsp;'
        }
      </td>
    </tr>
    <tr>
      <th>Remarks</th>
      <td>${basicInformation.remarks}</td>
    </tr>
    `;

    console.log(personalInformation);

    let esicFamilyMemberDetalisRows = '';
    esicFamilyDetailsArray.forEach((report) => {
      esicFamilyMemberDetalisRows += `<tr>
        <td>${report.familyMemberName}</td>
        <td>${report.dob}</td>
        <td>${report.relation}</td>
        <td>${report.gender}</td>
        </tr>`;
    });
    const esicFamilyMemberDetalisTable =
      esicFamilyMemberDetalisHeader + esicFamilyMemberDetalisRows;
    let pdfBuffer;
    if (esicFamilyDetailsArray.length > 0) {
      const pdfGenerationObject = {
        personalInformation,
        addressinformation,
        uniformDetail,
        ImporttantInformation,
        bankDetails,
        singatureDetails,
        esicFamilyMemberDetalisTable,
        companyName: basicInformation.companyName,
        companyAddress: basicInformation.companyAddress,
      };

      pdfBuffer = await generatePDFWithImage(
        'employeeJoiningRequestFromWithEsicDetails',
        pdfGenerationObject
      );
    } else {
      const pdfGenerationObject = {
        personalInformation,
        addressinformation,
        uniformDetail,
        ImporttantInformation,
        bankDetails,
        singatureDetails,
        companyName: basicInformation.companyName,
        companyAddress: basicInformation.companyAddress,
      };
      pdfBuffer = await generatePDFWithImage(
        'employeeJoiningRequestFrom',
        pdfGenerationObject
      );
    }
    const base64path = pdfBuffer.toString('base64');
    return res.status(200).json({
      status: 200,
      data: base64path,
    });
  } catch (err) {
    next(err);
  }
};
