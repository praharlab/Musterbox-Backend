const Sequelize = require('sequelize');
const logger = require('../config/logger');
const message = require('../response_message/message');
const RoleMaster = require('../models/roleMaster');
const sequelize = require('../config/database');
const RolePermission = require('../models/rolePermission');
const companyMaster = require('../models/companyMaster');
const FormMaster = require('../models/formMaster');
const UserMaster = require('../models/userMaster');
const { executeQuery } = require('./common.controller');
const { paginate, userDetails } = require('../utils/commonUtilFunctions');
const RoleMasterBranchWise = require('../models/roleMasterBranchWise');
const BranchMaster = require('../models/branchMaster');
const CityMaster = require('../models/citymaster');
const UserRole = require('../models/userRole');

exports.postAddRoleMaster = async (req, res, next) => {
  try {
    const {
      formarray,
      companyMasterID,
      roleName,
      roleType,
      companyAccessType,
      branchMasterID,
      createBy,
      createByIp,
    } = await req.body;

    const UniqueData = await RoleMaster.findOne({
      raw: true,
      where: Sequelize.and(
        Sequelize.where(
          sequelize.fn(
            'TRIM',
            sequelize.fn('LOWER', sequelize.col('roleName'))
          ),
          String(roleName).trim().toLowerCase()
        ),
        Sequelize.where(sequelize.col('companyMasterID'), companyMasterID)
      ),
    });

    if (UniqueData) {
      return res.status(200).send({
        status: 401,
        message: 'Role with same name already exist',
      });
    }

    const transaction = await sequelize.transaction();
    try {
      const insert_db_status = await RoleMaster.create(
        {
          roleName,
          roleType,
          companyAccessType,
          companyMasterID,
          createBy,
          createByIp,
        },
        { user: req.userDetails, transaction }
      );

      for (let item of formarray) {
        item.roleMasterID = insert_db_status.roleMasterID;
        item.rolePermissionID = null;
      }

      if (branchMasterID && branchMasterID.length) {
        const RoleBranchWise = branchMasterID.map((item) => ({
          roleMasterID: insert_db_status.roleMasterID,
          branchMasterID: item,
          createBy: createBy,
          createByIp: createByIp,
        }));

        await RoleMasterBranchWise.bulkCreate(RoleBranchWise, { transaction });
      }

      await RolePermission.bulkCreate(formarray, {
        user: req.userDetails,
        individualHooks: true,
        transaction,
      });

      await transaction.commit();

      res.status(200).json({
        status: 200,
        message: 'Role added Successfully',
        data: {},
      });
    } catch (error) {
      await transaction.rollback();

      res.status(200).send({
        status: 401,
        message: 'Fail to import data!',
        error: error.message,
        data: formarray,
      });
    }
  } catch (err) {
    next(err);
  }
};

exports.getRoleMasterById = async (req, res, next) => {
  try {
    const getdata = await RoleMaster.findOne({
      where: {
        roleMasterID: req.params.id,
      },
      include: [
        {
          model: companyMaster,
        },
      ],
    });

    let getPermission = [];
    getPermission = await RolePermission.findAll({
      where: {
        roleMasterID: req.params.id,
      },
    });

    const allBranch = await RoleMasterBranchWise.findAll({
      where: {
        roleMasterID: req.params.id,
      },
    });
    const finalBranch = allBranch.map((item) => item.branchMasterID);

    for (var i = 0; i < getPermission.length; i++) {
      let getdata = await FormMaster.findOne({
        where: {
          formMasterID: getPermission[i].formMasterID,
          status: 1,
        },
      });
      getPermission[i].dataValues.parent = getdata?.parentFormMasterID;
    }

    return res.status(200).json({
      status: 200,
      data: getPermission,
      roleMaster: getdata,
      allBranch: finalBranch,
    });
  } catch (err) {
    next(err);
  }
};

exports.postUpdateRoleMaster = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      formarray,
      companyMasterID,
      roleName,
      roleType,
      companyAccessType,
      branchMasterIDs,
      roleMasterID,
    } = await req.body;
    const updateBy = req.userDetails.userMasterId;
    const updateByIp = req.userDetails.userIpAddress;
    const UniqueData = await RoleMaster.findOne({
      raw: true,
      where: Sequelize.and(
        Sequelize.where(
          sequelize.fn(
            'TRIM',
            sequelize.fn('LOWER', sequelize.col('roleName'))
          ),
          String(roleName).trim().toLowerCase()
        ),
        Sequelize.where(sequelize.col('companyMasterID'), companyMasterID),
        Sequelize.where(sequelize.col('roleMasterID'), {
          [Sequelize.Op.ne]: roleMasterID,
        })
      ),
    });

    if (UniqueData) {
      await transaction.rollback();
      return res.status(200).send({
        status: 401,
        message: 'Role with same name already exist',
      });
    }

    await RoleMaster.update(
      {
        companyMasterID,
        roleName,
        roleType,
        companyAccessType,
        updateBy,
        updateByIp,
      },
      {
        where: { roleMasterID: roleMasterID },
        user: req.userDetails,
        transaction,
      }
    );

    //Destroy All BranchWise Role
    await RoleMasterBranchWise.destroy({
      where: {
        roleMasterID: roleMasterID,
      },
      force: true,
      transaction,
    });

    if (branchMasterIDs && branchMasterIDs.length) {
      const RoleBranchWise = branchMasterIDs.map((item) => ({
        roleMasterID: roleMasterID,
        branchMasterID: item,
        createBy: updateBy,
        createByIp: updateByIp,
      }));

      await RoleMasterBranchWise.bulkCreate(RoleBranchWise, { transaction });
    }

    await RolePermission.destroy({
      where: {
        roleMasterID: roleMasterID,
      },
      hooks: true,
      individualHooks: true,
      user: req.userDetails,
      // force: true,
      transaction,
    });

    await RolePermission.bulkCreate(formarray, {
      user: req.userDetails,
      individualHooks: true,
      transaction,
    });

    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: 'Role updated Successfully',
      data: formarray,
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

exports.listRoleMaster = async (req, res, next) => {
  try {
    let { page, limit, fromDate, toDate, searchQuery, companyMasterID } =
      req.body;

    const condition = {};
    // toDate = new Date(toDate).setDate(new Date(toDate).getDate + 1);
    // A super admin (admin=2) lists roles across all companies and sends
    // companyMasterID as 0/null/absent; only scope the query when one is given.
    if (companyMasterID) condition.companyMasterID = companyMasterID;
    if (fromDate && toDate)
      condition.createdAt = {
        [Sequelize.Op.between]: [new Date(fromDate), new Date(toDate)],
      };
    if (searchQuery)
      condition[Sequelize.Op.or] = [
        {
          '$companyMaster.companyName$': {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
        { roleName: { [Sequelize.Op.iLike]: '%' + searchQuery + '%' } },
      ];

    const order = [['createdAt', 'DESC']];

    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }

    const rolemaster = await RoleMaster.findAndCountAll({
      raw: true,
      where: condition,
      ...paginationQuery,
      order,
      include: [{ model: companyMaster }],
    });

    for (let item of rolemaster.rows) {
      const getdata = await UserMaster.findOne({
        where: {
          userMasterID: item.createBy,
        },
      });
      item.createBy = getdata ? getdata.displayName : '';

      const getdata1 = await UserMaster.findOne({
        where: {
          userMasterID: item.updateBy,
        },
      });
      item.updateBy = getdata1 ? getdata1.displayName : '';

      const allBranch = await RoleMasterBranchWise.findAll({
        where: { roleMasterID: item.roleMasterID },
        attributes: ['branchMasterID'],
        include: [
          {
            model: BranchMaster,
            attributes: ['branchName', 'branchCode'],
            include: [
              {
                model: CityMaster,
                attributes: ['cityName'],
              },
            ],
          },
        ],
      });
      item.allBranch = allBranch;

      if (item.roleType == 'companyWise') item.roleType = 'Company Wise';
      else if (item.roleType == 'branchWise') item.roleType = 'Branch Wise';

      if (item.companyAccessType == 'ownPlusChildCompany')
        item.companyAccessType = 'Own + Child Company';
      else if (item.companyAccessType == 'ownCompany')
        item.companyAccessType = 'Own Company';
    }

    res.status(200).json({
      message: 'Roles fetched Successfully',
      status: 200,
      data: rolemaster.rows,
      totalcount: rolemaster.count,
    });
  } catch (err) {
    next(err);
  }
};

exports.AssignRoleMaster = async (req, res, next) => {
  try {
    const { userMasterID, roleMasterID, createBy, createByIp } = await req.body;

    const finalData = [];

    await sequelize.transaction(async (t) => {
      await UserRole.destroy({
        where: {
          userMasterID: {
            [Sequelize.Op.in]: userMasterID,
          },
        },
        hooks: true,
        individualHooks: true,
        user: req.userDetails,
        transaction: t,
      });

      for (const id of userMasterID) {
        finalData.push({
          userMasterID: id,
          roleMasterID,
        });
      }

      await UserRole.bulkCreate(finalData, {
        individualHooks: true,
        user: req.userDetails,
        transaction: t,
      });
    });

    return res.status(200).json({
      status: 200,
      message: 'Role assigned Successfully',
      data: {},
    });
  } catch (err) {
    next(err);
  }
};

exports.listUserPermission = async (req, res, next) => {
  try {
    let { page, limit, userMasterID, companyMasterID } = req.body;

    let finalData = [];

    // Callers may omit userMasterID (spec: { page, limit, searchQuery,
    // companyMasterID }), which means every user in the company.
    if (!userMasterID || userMasterID.length == 0) {
      userMasterID = [];
      const getdata = await UserMaster.findAll({
        where: {
          companyMasterId: companyMasterID,
          status: 1,
        },
        raw: true,
      });

      for (let item of getdata) {
        userMasterID.push(item.userMasterID);
      }
    }
    const totalcount = userMasterID.length;

    if (page && limit) {
      userMasterID = await paginate(userMasterID, limit, page);
    }

    for (let userid of userMasterID) {
      const getdata = await UserMaster.findOne({
        where: {
          userMasterID: userid,
        },
        include: [
          {
            required: false,
            model: UserRole,
            attributes: ['roleMasterID'],
            include: [
              { model: RoleMaster },
              {
                model: UserMaster,
                as: 'createByUser',
                attributes: ['displayName'],
              },
            ],
          },
        ],
        // raw: true,
      });

      const rolesData =
        getdata && getdata.userRoles && getdata.userRoles.length > 0
          ? getdata.userRoles[0]
          : null;

      // if (userRights) {
      getdata.dataValues.roleMasterID = rolesData
        ? rolesData.roleMasterID
        : null;
      getdata.dataValues.roleName = rolesData
        ? rolesData.roleMaster.roleName
        : '';

      // let userDetail = await userDetails(userRights.createBy);

      getdata.dataValues.assignedBy = rolesData
        ? rolesData.createByUser.displayName
        : '';
      // } else {
      //   getdata.roleMasterID = null;
      //   getdata.roleName = '';
      //   getdata.assignedBy = '';
      // }
      finalData.push(getdata);
    }

    res.status(200).json({
      message: 'Roles fetched Successfully',
      status: 200,
      data: finalData,
      totalcount: totalcount,
    });
  } catch (err) {
    next(err);
  }
};
