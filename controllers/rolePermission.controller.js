const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const { statusCodes } = require('../utils/commonVars');
const message = require('../response_message/message');
const RolePermission = require('../models/rolePermission');
const _ = require('lodash');

exports.changePermissionData = async (req, res, next) => {
  try {
    const { formMasterID, operationID, wantToAdd_FormMasterID } = req.body;
    const condition = {
      formMasterID,
    };
    if (operationID) condition.operationID = operationID;
    const findAllRolePermissionFormAndOperationWise =
      await RolePermission.findAll({
        where: condition,
      });
    const createData = [];

    for (let permission of findAllRolePermissionFormAndOperationWise) {
      let createObj = {
        roleMasterID: permission.roleMasterID,
        formMasterID: wantToAdd_FormMasterID,
        operationID: permission.operationID,
        createBy: permission.createBy,
        createByIp: permission.createByIp,
      };
      createData.push(createObj);
    }

    if (createData.length > 0) {
      await bulkInsertInChunks(RolePermission, createData, 100);
    }
    return res.status(statusCodes.OK).json({
      status: statusCodes.OK,
      message: message.usermessage.addMessage('Role Permission'),
      totalcouunt: findAllRolePermissionFormAndOperationWise.length,
      findAllRolePermissionFormAndOperationWise,
    });
  } catch (error) {
    next(error);
  }
};

async function bulkInsertInChunks(model, data, chunkSize = 1000) {
  const chunks = _.chunk(data, chunkSize);
  for (const chunk of chunks) {
    await model.bulkCreate(chunk);
  }
}
