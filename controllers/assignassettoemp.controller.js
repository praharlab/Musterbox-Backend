const Sequelize = require('sequelize');
const EmployeeAsset = require('../models/assignAssetToEmployee');
const logger = require('../config/logger');
const sequelize = require('../config/database');
const message = require('../response_message/message');
const UserMasterModel = require('../models/userMaster');
const AssetCategoryModel = require('../models/assetCategory');
const AssetMasterModel = require('../models/assetMaster');
const companyMaster = require('../models/companyMaster');
const AssignAssetToEmployee = require('../models/assignAssetToEmployee');
const {
  generateExcel,
  genrateDemoExcelForAssignAsset,
} = require('../utils/exportData');
const fs = require('fs');
const readXlsxFile = require('read-excel-file/node');
const UserMaster = require('../models/userMaster');
const { count } = require('console');
const { accessibleUsers } = require('../utils/commonUtilFunctions');
const assetMaster = require('../models/assetMaster');
const { FileUploadType } = require('../utils/dbUtils');
const EmployeeJoiningDetails = require('../models/employeeJoiningDetails');
const path = require('path');

async function checkAssetAvaibility(
  assetMasterID,
  assignDate,
  returnDate,
  quantity,
  assignAssetToEmployeeID = null
) {
  const ans = { assignBool: false, message: '' };
  const assetQuantity = await AssetMasterModel.findOne({
    where: { assetMasterID: assetMasterID, status: 1 },
    attributes: ['quantity'],
    raw: true,
  });
  if (!assetQuantity || +assetQuantity.quantity < 1) {
    ans.message = 'Asset Quantity is not defined!';
    return ans;
  }
  const assignedBackDated = await AssignAssetToEmployee.findAll({
    where: {
      assetMasterID: assetMasterID,
      status: 1,
      assignDate: { [Sequelize.Op.lt]: assignDate },
      assignAssetToEmployeeID: { [Sequelize.Op.ne]: assignAssetToEmployeeID },
      [Sequelize.Op.or]: [
        { returnDate: { [Sequelize.Op.eq]: null } },
        { returnDate: { [Sequelize.Op.gt]: assignDate } },
      ],
    },
    raw: true,
  });
  let AssetQuantity = 0;
  for (let item of assignedBackDated) AssetQuantity += +item.quantity;

  if (+assetQuantity.quantity - AssetQuantity < +quantity) {
    ans.message = 'Asset has been assigned with in the date range!';
    return ans;
  }

  const assignedFutureDated = await AssignAssetToEmployee.findAll({
    where: {
      assetMasterID: assetMasterID,
      assignAssetToEmployeeID: { [Sequelize.Op.ne]: assignAssetToEmployeeID },
      status: 1,
      assignDate: { [Sequelize.Op.gte]: assignDate },
    },
    raw: true,
    order: [['assignDate', 'DESC']],
  });

  for (let item of assignedFutureDated) AssetQuantity += +item.quantity;

  if (
    +assetQuantity.quantity - AssetQuantity < +quantity &&
    assignedFutureDated.length > 0
  ) {
    if (!returnDate) {
      ans.message =
        'Asset has been assigned with in the date range! choose date smaller than ' +
        assignedFutureDated[0].assignDate;
      return ans;
    }

    if (new Date(returnDate) <= new Date(assignedFutureDated[0].assignDate)) {
      ans.assignBool = true;
      return ans;
    } else {
      ans.message =
        'Asset has been assigned with in the date range! choose date smaller than ' +
        assignedFutureDated[0].assignDate;
      return ans;
    }
  }

  ans.assignBool = true;
  return ans;
}

exports.postAddEmployeeAsset = async (req, res, next) => {
  try {
    let {
      userMasterID,
      assetCategoryID,
      assetMasterID,
      description,
      assetImages,
      assignDate,
      returnDate,
      quantity,
      createBy,
      createByIp,
    } = await req.body;

    const checkAvaibility = await checkAssetAvaibility(
      assetMasterID,
      assignDate,
      returnDate,
      quantity
    );

    if (!checkAvaibility.assignBool) {
      //unlink
      if (req.files) {
        for (const file of req.files) {
          fs.unlink(
            path.join(__dirname, `../uploads/user/assets/${file}`),
            function (err) {
              if (err) {
                console.log(err);
              } else {
                console.log('delete');
              }
            }
          );
        }
      }

      //response
      return res.status(200).json({
        status: 401,
        message: checkAvaibility.message,
      });
    }
    assignDate = new Date(assignDate);
    if (returnDate) returnDate = new Date(returnDate);
    else returnDate = null;
    if (req.files) {
      assetImages = [];
      for (const file of req.files) assetImages.push(file.filename);
    }
    await EmployeeAsset.create({
      userMasterID,
      assetCategoryID,
      assetMasterID,
      description,
      assetImages,
      assignDate,
      returnDate,
      quantity,
      createBy,
      createByIp,
    });

    res.status(200).json({
      status: 200,
      message: message.usermessage.assignMessage('Asset'),
    });
  } catch (err) {
    next(err);
  }
};

exports.getAllEmployeeAssetData = async (req, res, next) => {
  try {
    const {
      limit,
      page,
      searchQuery,
      userMasterID,
      assetCategoryID,
      assetMasterID,
      companyMasterID,
      exportData,
    } = await req.body;

    const condition = {};
    condition.status = 1;

    if (userMasterID) condition.userMasterID = userMasterID;
    if (assetCategoryID) condition.assetCategoryID = assetCategoryID;
    if (assetMasterID) condition.assetMasterID = assetMasterID;
    if (companyMasterID) {
      condition['$employee.companyMasterId$'] = companyMasterID;
      req.userDetails.accessibleCompanies = companyMasterID;
    }

    if (searchQuery)
      condition[Sequelize.Op.or] = [
        { description: { [Sequelize.Op.iLike]: '%' + searchQuery + '%' } },
        {
          '$employee.firstName$': {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
        {
          '$employee.middleName$': {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
        {
          '$employee.lastName$': {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
        {
          '$employee.displayName$': {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
        {
          '$employee.userNumber$': {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
        {
          '$assetCategory.assetCategory$': {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
        {
          '$assetMaster.assetName$': {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
        sequelize.where(
          sequelize.cast(
            sequelize.col('assignAssetToEmployee.assignDate'),
            'varchar'
          ),
          { [Sequelize.Op.iLike]: `%${searchQuery}%` }
        ),
        sequelize.where(
          sequelize.cast(
            sequelize.col('assignAssetToEmployee.returnDate'),
            'varchar'
          ),
          { [Sequelize.Op.iLike]: `%${searchQuery}%` }
        ),
      ];

    const paginationQuery = {};
    if (page && limit && !exportData) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }

    const order = [['assignDate', 'DESC']];

    const { rows: Asset, count } = await EmployeeAsset.findAndCountAll({
      where: condition,
      ...paginationQuery,
      order,
      include: [
        {
          model: UserMasterModel,
          as: 'employee',
          required: true,
          ...accessibleUsers(req.userDetails, true, false),
          include: [{ model: companyMaster }],
        },
        {
          model: AssetCategoryModel,
          as: 'assetCategory',
        },
        {
          model: AssetMasterModel,
          as: 'assetMaster',
        },
      ],
    });

    if (exportData) {
      const finalData = [];

      for (const item of Asset) {
        const temp = {
          'Company Name': item.employee.companyMaster.companyName,
          'Employee Name': item.employee.displayName,
          'Asset Category': item.assetCategory.assetCategory,
          'Asset Name': item.assetMaster.assetName,
          'Asset Serial No': item.assetMaster.assetSerialNo,
          'Assigned Quantity': item.quantity,
          'Assign Date': item.assignDate
            ? item.assignDate.split('-').reverse().join('/')
            : '',
          'Return Date': item.returnDate
            ? item.returnDate.split('-').reverse().join('/')
            : '',
        };
        finalData.push(temp);
      }

      await generateExcel(finalData, 'Asset Report', 'xlsx', res);
      return;
    }

    return res.status(200).json({
      status: 200,
      data: Asset,
      totalcount: count,
    });
  } catch (err) {
    next(err);
  }
};

exports.getEmployeeAssetById = async (req, res, next) => {
  try {
    const get_one_data = await EmployeeAsset.findOne({
      where: {
        assignAssetToEmployeeID: req.params.id,
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
      },
    });

    return res.status(200).json({ status: 200, data: get_one_data });
  } catch (err) {
    next(err);
  }
};

exports.getEmployeeAssetByUserId = async (req, res, next) => {
  try {
    const get_one_data = await EmployeeAsset.findAll({
      where: {
        userMasterID: req.params.id,
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
      },
    });

    return res.status(200).json({ status: 200, data: get_one_data });
  } catch (err) {
    next(err);
  }
};

exports.postUpdateEmployeeAsset = async (req, res, next) => {
  try {
    let {
      assignAssetToEmployeeID,
      userMasterID,
      assetCategoryID,
      assetMasterID,
      description,
      assetImages,
      assignDate,
      returnDate,
      quantity,
      status,
    } = await req.body;
    const updateBy = req.userDetails.userMasterId;
    const updateByIp = req.userDetails.userIpAddress;
    const checkAvaibility = await checkAssetAvaibility(
      assetMasterID,
      assignDate,
      returnDate,
      quantity,
      assignAssetToEmployeeID
    );

    if (!checkAvaibility.assignBool) {
      //unlink
      if (req.files) {
        for (const file of req.files) {
          fs.unlink(
            path.join(__dirname, `../uploads/user/assets/${file}`),
            function (err) {
              if (err) {
                console.log(err);
              } else {
                console.log('delete');
              }
            }
          );
        }
      }

      //response
      return res.status(200).json({
        status: 401,
        message: checkAvaibility.message,
      });
    }

    assignDate = new Date(assignDate);

    if (returnDate) returnDate = new Date(returnDate);
    else returnDate = null;
    if (req.files) {
      assetImages = [];
      for (const file of req.files) assetImages.push(file.filename);
    }

    await EmployeeAsset.update(
      {
        userMasterID,
        assetCategoryID,
        assetMasterID,
        description,
        assetImages,
        assignDate,
        returnDate,
        quantity,
        status,
        updateBy,
        updateByIp,
      },
      {
        where: { assignAssetToEmployeeID: assignAssetToEmployeeID },
      }
    );
    return res.status(200).json({
      status: 200,
      message: message.usermessage.updateMessage('Asset Assign'),
    });
  } catch (err) {
    next(err);
  }
};

exports.poststatuschange = async (req, res, next) => {
  try {
    let { assignAssetToEmployeeID, status } = await req.body;
    const updateBy = req.userDetails.userMasterId;
    const updateByIp = req.userDetails.userIpAddress;
    await EmployeeAsset.update(
      {
        status: status,
        updateBy,
        updateByIp,
      },
      {
        where: {
          assignAssetToEmployeeID: assignAssetToEmployeeID,
        },
      }
    );
    return res.status(200).json({
      status: 200,
      message:
        status == '1'
          ? message.usermessage.activeMessage('Assign Asset')
          : message.usermessage.deactiveMessage('Assign Asset'),
    });
  } catch (err) {
    next(err);
  }
};

exports.postDeleteEmployeeAssetById = async (req, res, next) => {
  try {
    let { assignAssetToEmployeeID } = await req.body;
    const updateBy = req.userDetails.userMasterId;
    const updateByIp = req.userDetails.userIpAddress;
    await EmployeeAsset.update(
      {
        status: 2,
        updateBy,
        updateByIp,
      },
      {
        where: { assignAssetToEmployeeID: assignAssetToEmployeeID },
      }
    );

    return res.status(200).json({
      status: 200,
      message: message.usermessage.deleteMessage('Assign Asset'),
    });
  } catch (err) {
    next(err);
  }
};

exports.returnAsset = async (req, res, next) => {
  try {
    let { assignAssetToEmployeeID, returnDate } = await req.body;
    const updateBy = req.userDetails.userMasterId;
    const updateByIp = req.userDetails.userIpAddress;
    await EmployeeAsset.update(
      {
        returnDate: returnDate,
        updateBy,
        updateByIp,
      },
      {
        where: { assignAssetToEmployeeID: assignAssetToEmployeeID },
      }
    );

    return res.status(200).json({
      status: 200,
      message: message.usermessage.returnMessage('Employee Asset'),
    });
  } catch (err) {
    next(err);
  }
};

exports.GetbyAssetCategoryID = async (req, res, next) => {
  try {
    let { companyMasterID, assetCategoryID } = await req.body;

    let results;
    results = await sequelize.query(
      `select * from public."assetMasters" where "assetCategoryID" = $assetCategoryID and "companyMasterID" = $companyMasterID and status = 1;`,
      {
        bind: {
          companyMasterID: companyMasterID,
          assetCategoryID: assetCategoryID,
        },
      },
      { type: Sequelize.SELECT }
    );

    return res.status(200).json({ status: 200, data: results[0] });
  } catch (err) {
    next(err);
  }
};

exports.Getalldata = async (req, res, next) => {
  try {
    let results;
    results = await sequelize.query(
      `
            select UM."displayName" as "Employee Name", AC."assetCategory" as "Asset Category", AE."assetImages", 
                        AM."assetName" as "Asset Name", AM."assetName" as "Asset Name", AM."assetSerialNo" as "Asset Serial No", 
                        AE."description" as "Asset Description", AE."assignDate" as "Asset Asign Date", 
                        AE."returnDate" as "Asset Return Date"
                  from public."assignAssetToEmployees" as AE 
                   inner join public."userMasters" as UM 
                  on AE."userMasterID" = UM."userMasterID" 
                  inner join public."assetMasters" as AM
                 on AE."assetMasterID" = AM."assetMasterID"
                 inner join public."assetCategories" as AC 
                  on AM."assetCategoryID" = AC."assetCategoryID"
                  where AE."userMasterID" = ` +
        req.params.id +
        ` and AE."status"=1 order by UM."userMasterID"`,

      { type: Sequelize.SELECT }
    );

    return res.status(200).json({ status: 200, data: results[0] });
  } catch (err) {
    next(err);
  }
};

exports.getEmployeeAssetDatabyUserID = async (req, res, next) => {
  try {
    const { limit, page, searchQuery, startdate, enddate, userMasterID } =
      await req.body;

    const paginationQuery = {};
    const condition = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }
    const order = [['createdAt', 'DESC']];

    if (userMasterID) condition.userMasterID = userMasterID;

    condition.status = ['0', '1'];

    if (startdate && enddate)
      condition.assignDate = {
        [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
      };

    if (searchQuery) {
      condition[Sequelize.Op.or] = [
        { description: { [Sequelize.Op.iLike]: '%' + searchQuery + '%' } },
        {
          '$employee.firstName$': {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
        {
          '$employee.middleName$': {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
        {
          '$employee.lastName$': {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
        {
          '$employee.displayName$': {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
        {
          '$employee.userNumber$': {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
        {
          '$assetCategory.assetCategory$': {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
        sequelize.where(
          sequelize.cast(
            sequelize.col('assignAssetToEmployee.assignDate'),
            'varchar'
          ),
          { [Sequelize.Op.iLike]: `%${searchQuery}%` }
        ),
        sequelize.where(
          sequelize.cast(
            sequelize.col('assignAssetToEmployee.returnDate'),
            'varchar'
          ),
          { [Sequelize.Op.iLike]: `%${searchQuery}%` }
        ),
      ];
    }

    const { rows: employee_asset_assign, count } =
      await EmployeeAsset.findAndCountAll({
        where: condition,
        ...paginationQuery,
        order,
        include: [
          {
            model: UserMasterModel,
            as: 'employee',
            required: true,
            ...accessibleUsers(req.userDetails),
          },
          {
            model: AssetCategoryModel,
            as: 'assetCategory',
          },
          {
            model: AssetMasterModel,
            as: 'assetMaster',
          },
        ],
      });

    return res.status(200).json({
      status: 200,
      data: employee_asset_assign,
      totalcount: count,
    });
  } catch (err) {
    next(err);
  }
};

const isValidDate = (dateString) => {
  if (!dateString) return false;

  let parsedDate = new Date(dateString);
  return !isNaN(parsedDate.getTime());
};

exports.uploadExcel = async (req, res, next) => {
  const filePath = path.join(__dirname, `../uploads/${req.file.filename}`);

  try {
    const { companyMasterID, assetCategoryID, createBy, createByIp } = req.body;

    readXlsxFile(filePath).then(async (rows) => {
      rows.shift();

      if (rows.length == 0)
        return res.status(200).json({
          status: 401,
          message: 'No Data in the file',
        });

      const allUser = await UserMaster.findAll({
        raw: true,
        where: { companyMasterId: companyMasterID, status: 1 },
        include: [
          { model: companyMaster, attributes: ['fileUploadType'] },
          { model: EmployeeJoiningDetails, attributes: ['employeeCode'] },
        ],
      });
      const allAsset = await AssetMasterModel.findAll({
        where: {
          assetCategoryID: assetCategoryID,
          companyMasterID: companyMasterID,
          status: 1,
        },
      });

      let fileUploadType = FileUploadType.MOBILE_NUMBER;
      if (
        allUser.length &&
        allUser[0]['companyMaster.fileUploadType'] ==
          FileUploadType.EMPLOYEE_CODE
      )
        fileUploadType = FileUploadType.EMPLOYEE_CODE;

      const notAssignedUser = [];
      const allAssetData = [];

      for (const row of rows) {
        if (!row) continue;
        row[0] = row[0].toString();

        let findUser;
        if (fileUploadType == FileUploadType.EMPLOYEE_CODE) {
          findUser = allUser.find(
            (user) =>
              user['employeeJoiningDetails.employeeCode'] == row[0] &&
              +user.companyMasterId == companyMasterID
          );

          if (!findUser)
            return res.status(200).json({
              status: 401,
              message: 'User with Employee Code: ' + row[0] + ' not found!',
            });
        } else {
          findUser = allUser.find(
            (user) =>
              +user.userNumber == row[0] &&
              +user.companyMasterId == companyMasterID
          );

          if (!findUser)
            return res.status(200).json({
              status: 401,
              message: 'User with Number: ' + row[0] + ' not found!',
            });
        }

        const findAsset = allAsset.find(
          (asset) =>
            asset.assetCategoryID == assetCategoryID &&
            asset.companyMasterID == companyMasterID &&
            asset.assetName == row[1].trim()
        );

        if (!findAsset)
          return res.status(200).json({
            status: 401,
            message: 'Asset ' + row[1] + ' not found!',
          });

        if (!row[2])
          return res.status(200).json({
            status: 401,
            message: 'Description not found for user ' + row[0],
          });

        if (!row[3]) row[3] = 1;
        if (!row[4])
          return res.status(200).json({
            status: 401,
            message: 'Assign Date not found for user ' + row[0],
          });

        if (!isValidDate(row[4]))
          return res.status(200).json({
            status: 401,
            message:
              'Please enter Assign date in YYYY-MM-DD format for user ' +
              row[0],
          });
        if (row[5] && !isValidDate(row[5])) {
          return res.status(200).json({
            status: 401,
            message:
              'Please enter Return date in YYYY-MM-DD format for user ' +
              row[0],
          });
        }

        const checkAvaibility = await checkAssetAvaibility(
          findAsset.assetMasterID,
          row[4],
          row[5],
          row[3]
        );

        if (!checkAvaibility.assignBool) {
          notAssignedUser.push(
            `Asset ${row[1]} cannot be assigned to ${findUser.displayName}, already assigned within the date`
          );
          continue;
        }

        row[4] = new Date(row[4]);
        if (row[5]) row[5] = new Date(row[5]);
        else row[5] = null;

        allAssetData.push({
          userMasterID: findUser.userMasterID,
          assetCategoryID: findAsset.assetCategoryID,
          assetMasterID: findAsset.assetMasterID,
          description: row[2],
          assignDate: row[4],
          returnDate: row[5],
          quantity: row[3],
          createBy,
          createByIp,
        });
      }

      await EmployeeAsset.bulkCreate(allAssetData);

      fs.unlink(filePath, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log('delete');
        }
      });

      let msg = '';
      if (notAssignedUser.length) msg = notAssignedUser.join(',');
      else msg = 'Asset Assigned successfully!';

      return res.status(200).send({
        status: 200,
        message: msg,
      });
    });
  } catch (error) {
    next(error);
  }
};

exports.generateDemoExcel = async (req, res, next) => {
  try {
    const { assetCategoryID, companyMasterID } = await req.body;
    const condition = {};
    condition.companyMasterID = companyMasterID;
    condition.assetCategoryID = assetCategoryID;
    condition.status = 1;
    const order = [['assetName', 'ASC']];
    const assetMasterData = await assetMaster.findAll({
      where: condition,
      order,
      include: { model: companyMaster, attributes: ['fileUploadType'] },
    });

    let fileUploadType = 'User Number';
    if (
      assetMasterData.length &&
      assetMasterData[0].companyMaster.fileUploadType ==
        FileUploadType.EMPLOYEE_CODE
    )
      fileUploadType = 'Employee Code';

    const categoryNames = assetMasterData.map((row) => row.assetName);
    await genrateDemoExcelForAssignAsset(
      categoryNames,
      fileUploadType,
      'Import Asset',
      'xlsx',
      res
    );
  } catch (err) {
    next(err);
  }
};
