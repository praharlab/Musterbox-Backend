const Sequelize = require('sequelize');
const UserDocument = require('../models/userDocument');
const logger = require('../config/logger');
const message = require('../response_message/message');
const sequelize = require('../config/database');
const UserMaster = require('../models/userMaster');
const EmployeeJoining = require('../models/employeeJoiningDetails');
const { userDocument } = require('../utils/commonUtilFunctions');
const fs = require('fs');
const DocumentList = require('../models/documentList');
const {
  accessibleUsers,
  asiaKolkataDateTime,
} = require('../utils/commonUtilFunctions');
const UserInbox = require('../models/UserInbox');
const EmployeeDesignation = require('../models/employeeDesignation');
const Designation = require('../models/designation');
const EmployeeDepartment = require('../models/employeeDepartment');
const Department = require('../models/department');
const EmployeeBranch = require('../models/employeeBranch');
const BranchMaster = require('../models/branchMaster');
const EmployeeJoiningDetails = require('../models/employeeJoiningDetails');
const companyMaster = require('../models/companyMaster');
const { generateExcel } = require('../utils/exportData');
const path = require('path');

/**
 * save userDocument data.
 *
 * @body {createBy} createBy user id of user who added the userDocument.
 * @body {number} createBy if any user change data then updateBy id change.
 
 */
exports.postAddUserDocument = async (req, res, next) => {
  try {
    let {
      userMasterID,
      documentListID,
      createBy,
      createByIp,
      verifyStatus,
      verifyBy,
      documentNumber,
      nameOnDocument,
      expiryDate,
    } = await req.body;

    const duplicateDocument = await UserDocument.findOne({
      where: {
        userMasterID: userMasterID,
        status: 1,
        documentListID: documentListID,
      },
      raw: true,
    });
    if (duplicateDocument)
      return res
        .status(200)
        .json({ status: 401, message: 'Document already Added!' });

    let document = '';
    expiryDate =
      expiryDate == 'null' || expiryDate == 'undefined' || !expiryDate
        ? null
        : expiryDate;
    if (req.files.adharPhoto) {
      document = req.files.adharPhoto[0].filename;
    }
    let insert_db_status;
    await sequelize.transaction(async (t) => {
      insert_db_status = await UserDocument.create({
        userMasterID,
        documentListID,
        document,
        createBy,
        createByIp,
        verifyStatus,
        verifyBy,
        documentNumber,
        nameOnDocument,
        expiryDate,
      });

      if (
        +verifyStatus == 1 &&
        (+documentListID == 1 || +documentListID == 2)
      ) {
        const empJoining = await EmployeeJoining.findOne({
          where: { userMasterID: userMasterID, status: 1 },
          raw: true,
        });
        if (empJoining) {
          if (+documentListID == 1) {
            await EmployeeJoining.update(
              {
                adharName: nameOnDocument,
                adharCard: documentNumber,
                adharPhoto: document,
              },
              {
                where: {
                  employeeJoiningDetailId: empJoining.employeeJoiningDetailId,
                },
                transaction: t,
              }
            );
          } else {
            await EmployeeJoining.update(
              {
                pancard: documentNumber,
                panPhoto: document,
              },
              {
                where: {
                  employeeJoiningDetailId: empJoining.employeeJoiningDetailId,
                },
                transaction: t,
              }
            );
          }
        } else {
          if (+documentListID == 1) {
            await EmployeeJoining.create(
              {
                userMasterID,
                createBy,
                createByIp,
                adharName: nameOnDocument,
                adharCard: documentNumber,
                adharPhoto: document,
              },
              { transaction: t }
            );
          } else {
            await EmployeeJoining.create(
              {
                userMasterID,
                createBy,
                createByIp,
                pancard: documentNumber,
                panPhoto: document,
              },
              { transaction: t }
            );
          }
        }
      }

      if (verifyStatus == 0) {
        const name = await UserMaster.findOne({
          raw: true,
          where: {
            userMasterID: userMasterID,
          },
        });
        await UserInbox.create(
          {
            activityTable: UserDocument.getTableName(),
            activityTablePK: insert_db_status.toJSON().userDocumentID,
            message: `${name.displayName} has added Document.`,
            assignedBy: userMasterID,
          },
          { transaction: t }
        );
      }
    });

    return res.status(200).json({
      status: 200,
      message: message.usermessage.userdocumentadd,
      data: insert_db_status,
    });
  } catch (err) {
    next(err);
  }
};

/**
 return all userDocument data
 */

exports.getAllUserDocumentData = async (req, res, next) => {
  try {
    let { limit, page } = await req.body;
    let offset = (page - 1) * limit;
    let user_document = [];
    if (limit == '' && page == '') {
      user_document = await UserDocument.findAll({
        where: {
          status: {
            [Sequelize.Op.in]: [0, 1],
          },
        },
        include: [{ nested: true, all: true }],
      });
    } else {
      user_document = await UserDocument.findAll({
        where: {
          status: {
            [Sequelize.Op.in]: [0, 1],
          },
        },
        limit: limit,
        offset: offset,
        include: [{ nested: true, all: true }],
      });
    }

    const totalcount = await UserDocument.count({
      raw: true,
      where: { status: ['0', '1'] },
    });

    res
      .status(200)
      .json({ status: 200, data: user_document, totalcount: totalcount });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

/**
 * find data with userDocument id
 *
 * @param {id} userDocumentID  to fetch userDocument
 */

exports.getUserDocumentById = async (req, res, next) => {
  try {
    let get_one_data = await UserDocument.findOne({
      where: {
        userDocumentID: req.params.id,
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
      },
      include: [{ model: UserMaster }, { model: DocumentList }],
    });
    if (!get_one_data) {
      return res
        .status(200)
        .json({ status: 200, message: message.usermessage.deletedrecord });
    } else {
      return res.status(200).json({ status: 200, data: get_one_data });
    }
  } catch (err) {
    next(err);
  }
};

/**
 * find data with userMaster id
 *
 * @param {id} userMasterID  to fetch userDocument
 */

exports.getUserDocumentByUserMasterId = async (req, res, next) => {
  try {
    let get_one_data = await UserDocument.findAll({
      where: {
        userMasterID: req.params.id,
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
      },
      include: [
        {
          model: UserMaster,
          required: true,
          ...accessibleUsers(req.userDetails),
        },
        { model: DocumentList },
      ],
    });

    for (var i = 0; i < get_one_data.length; i++) {
      let getCreatedby = await UserMaster.findOne({
        where: {
          userMasterID: get_one_data[i].createBy,
        },
        attributes: ['displayName'],
      });
      get_one_data[i].createBy = getCreatedby ? getCreatedby.displayName : '';

      let verifyBy = await UserMaster.findOne({
        where: {
          userMasterID: get_one_data[i].verifyBy,
        },
        attributes: ['displayName'],
      });
      get_one_data[i].verifyBy = verifyBy ? verifyBy.displayName : '';
    }

    return res.status(200).json({ status: 200, data: get_one_data });
  } catch (err) {
    next(err);
  }
};

/**
 * update data
 *
 * @param {id} userDocumentID  to update id
 */
exports.postUpdateUserDocument = async (req, res, next) => {
  try {
    let {
      userDocumentID,
      documentListID,
      updateBy,
      updateByIp,
      verifyStatus,
      documentNumber,
      nameOnDocument,
      expiryDate,
    } = await req.body;

    expiryDate =
      expiryDate == 'null' || expiryDate == 'undefined' || !expiryDate
        ? null
        : expiryDate;

    const userDoc = await UserDocument.findOne({
      raw: true,
      where: { userDocumentID: userDocumentID },
    });
    const duplicateDocument = await UserDocument.findOne({
      where: {
        userMasterID: userDoc.userMasterID,
        status: 1,
        documentListID: documentListID,
        userDocumentID: { [Sequelize.Op.ne]: userDocumentID },
      },
      raw: true,
    });
    if (duplicateDocument)
      return res
        .status(200)
        .json({ status: 401, message: 'Document already Added!' });

    if (+userDoc.documentListID == 1 && +documentListID != 1) {
      if (userDoc.document) {
        const filePath = path.join(
          __dirname,
          `../uploads/user/document/${userDoc.document}`
        );
        fs.unlink(filePath, function (err) {
          if (err) {
            console.log(err);
          } else {
            console.log('file updated on server successfully');
          }
        });
      }

      await EmployeeJoining.update(
        {
          adharName: null,
          adharCard: null,
          adharPhoto: null,
        },
        { where: { userMasterID: userDoc.userMasterID } }
      );
    }

    if (+userDoc.documentListID == 2 && +documentListID != 2) {
      if (userDoc.document) {
        const filePath = path.join(
          __dirname,
          `../uploads/user/document/${userDoc.document}`
        );

        fs.unlink(filePath, function (err) {
          if (err) {
            console.log(err);
          } else {
            console.log('file updated on server successfully');
          }
        });
      }

      await EmployeeJoining.update(
        {
          pancard: null,
          panPhoto: null,
        },
        { where: { userMasterID: userDoc.userMasterID } }
      );
    }

    if (req.files.adharPhoto) {
      let document = req.files.adharPhoto[0].filename;
      await sequelize.transaction(async (t) => {
        let change_data_status = await UserDocument.update(
          {
            document,
            updateBy,
            updateByIp,
            verifyStatus,
            documentNumber,
            nameOnDocument,
            expiryDate,
          },
          {
            where: { userDocumentID: userDocumentID },
            transaction: t,
          }
        );

        if (userDoc.document) {
          const filePath = path.join(
            __dirname,
            `../uploads/user/document/${userDoc.document}`
          );

          fs.unlink(filePath, function (err) {
            if (err) {
              console.log(err);
            } else {
              console.log('file updated on server successfully');
            }
          });
        }

        if (
          +verifyStatus == 1 &&
          (+documentListID == 1 || +documentListID == 2)
        ) {
          const empJoining = await EmployeeJoining.findOne({
            where: { userMasterID: userDoc.userMasterID, status: 1 },
            raw: true,
          });

          if (empJoining) {
            if (+documentListID == 1) {
              await EmployeeJoining.update(
                {
                  adharName: nameOnDocument,
                  adharCard: documentNumber,
                  adharPhoto: document,
                },
                {
                  where: {
                    employeeJoiningDetailId: empJoining.employeeJoiningDetailId,
                  },
                  transaction: t,
                }
              );
            } else {
              await EmployeeJoining.update(
                {
                  pancard: documentNumber,
                  panPhoto: document,
                },
                {
                  where: {
                    employeeJoiningDetailId: empJoining.employeeJoiningDetailId,
                  },
                  transaction: t,
                }
              );
            }
          } else {
            if (+documentListID == 1) {
              await EmployeeJoining.create(
                {
                  userMasterID: userDoc.userMasterID,
                  createBy: updateBy,
                  createByIp: updateByIp,
                  adharName: nameOnDocument,
                  adharCard: documentNumber,
                  adharPhoto: document,
                },
                { transaction: t }
              );
            } else {
              await EmployeeJoining.create(
                {
                  userMasterID: userDoc.userMasterID,
                  createBy: updateBy,
                  createByIp: updateByIp,
                  pancard: documentNumber,
                  panPhoto: document,
                },
                { transaction: t }
              );
            }
          }
        }

        if (verifyStatus != 0) {
          await UserInbox.destroy({
            where: {
              activityTable: UserDocument.getTableName(),
              activityTablePK: userDocumentID,
            },
            transaction: t,
          });
        }
      });

      return res.status(200).json({
        status: 200,
        message: message.usermessage.userdocumentupdate,
      });
    } else {
      let document = '';
      let result = await sequelize.transaction(async (t) => {
        let change_data_status = await UserDocument.update(
          {
            updateBy,
            updateByIp,
            verifyStatus,
            documentNumber,
            nameOnDocument,
            expiryDate,
          },
          {
            where: { userDocumentID: userDocumentID },
            transaction: t,
          }
        );
        if (
          +verifyStatus == 1 &&
          (+documentListID == 1 || +documentListID == 2)
        ) {
          const userDoc = await UserDocument.findOne({
            raw: true,
            where: { userDocumentID: userDocumentID },
          });
          document = userDoc.document;

          const empJoining = await EmployeeJoining.findOne({
            where: { userMasterID: userDoc.userMasterID, status: 1 },
            raw: true,
          });

          if (empJoining) {
            if (+documentListID == 1) {
              await EmployeeJoining.update(
                {
                  adharName: nameOnDocument,
                  adharCard: documentNumber,
                  adharPhoto: document,
                },
                {
                  where: {
                    employeeJoiningDetailId: empJoining.employeeJoiningDetailId,
                  },
                  transaction: t,
                }
              );
            } else {
              await EmployeeJoining.update(
                {
                  pancard: documentNumber,
                  panPhoto: document,
                },
                {
                  where: {
                    employeeJoiningDetailId: empJoining.employeeJoiningDetailId,
                  },
                  transaction: t,
                }
              );
            }
          } else {
            if (+documentListID == 1) {
              await EmployeeJoining.create(
                {
                  userMasterID: userDoc.userMasterID,
                  createBy: updateBy,
                  createByIp: updateByIp,
                  adharName: nameOnDocument,
                  adharCard: documentNumber,
                  adharPhoto: document,
                },
                { transaction: t }
              );
            } else {
              await EmployeeJoining.create(
                {
                  userMasterID: userDoc.userMasterID,
                  createBy: updateBy,
                  createByIp: updateByIp,
                  pancard: documentNumber,
                  panPhoto: document,
                },
                { transaction: t }
              );
            }
          }
        }

        if (verifyStatus != 0) {
          await UserInbox.destroy({
            where: {
              activityTable: UserDocument.getTableName(),
              activityTablePK: userDocumentID,
            },
            transaction: t,
          });
        }
      });

      return res.status(200).json({
        status: 200,
        message: message.usermessage.userdocumentupdate,
      });
    }
  } catch (err) {
    next(err);
  }
};

/**
 * update status
 *
 * @param {id} userDocumentID  to update status of userDocument
 */

exports.poststatuschange = async (req, res, next) => {
  try {
    let = { userDocumentID, status } = await req.body;
    let delete_status;
    let result = await sequelize.transaction(async (t) => {
      if (status == '1') {
        delete_status = await UserDocument.update(
          {
            status: '1',
          },
          {
            where: { userDocumentID: userDocumentID, status: ['1', '0'] },
            transaction: t,
          }
        );
      } else {
        delete_status = await UserDocument.update(
          {
            status: '0',
          },
          {
            where: { userDocumentID: userDocumentID, status: ['1', '0'] },
            transaction: t,
          }
        );
      }

      if (delete_status != 0) {
        res.status(200).json({
          status: 200,
          message: message.usermessage.userdocumentdelete,
          data: {},
        });
      } else {
        res.status(200).json({
          status: 200,
          message: message.usermessage.deletedrecord,
          data: {},
        });
      }

      await UserInbox.destroy({
        where: {
          activityTable: UserDocument.getTableName(),
          activityTablePK: userDocumentID,
        },
      });
      return delete_status;
    });
  } catch (err) {
    next(err);
  }
};

/**
 * delete by i
 *
 * @param {id} userDocumentID  to delete id
 */
exports.postDeleteUserDocumentById = async (req, res, next) => {
  try {
    const { userDocumentID } = await req.body;
    await sequelize.transaction(async (t) => {
      await UserDocument.update(
        {
          status: 2,
        },
        {
          where: { userDocumentID: userDocumentID },
          transaction: t,
        }
      );

      const userDoc = await UserDocument.findOne({
        raw: true,
        where: { userDocumentID: userDocumentID },
      });
      if (
        +userDoc.verifyStatus == 1 &&
        (+userDoc.documentListID == 1 || +userDoc.documentListID == 2)
      ) {
        const empJoining = await EmployeeJoining.findOne({
          where: { userMasterID: userDoc.userMasterID, status: 1 },
          raw: true,
        });

        if (empJoining) {
          if (+userDoc.documentListID == 1) {
            await EmployeeJoining.update(
              {
                adharName: null,
                adharCard: null,
                adharPhoto: null,
              },
              {
                where: {
                  employeeJoiningDetailId: empJoining.employeeJoiningDetailId,
                },
                transaction: t,
              }
            );
          } else {
            await EmployeeJoining.update(
              {
                pancard: null,
                panPhoto: null,
              },
              {
                where: {
                  employeeJoiningDetailId: empJoining.employeeJoiningDetailId,
                },
                transaction: t,
              }
            );
          }
        }
      }

      await UserInbox.destroy({
        where: {
          activityTable: UserDocument.getTableName(),
          activityTablePK: userDocumentID,
        },
        transaction: t,
      });
    });

    return res
      .status(200)
      .json({ status: 200, message: message.usermessage.userdocumentdelete });
  } catch (err) {
    next(err);
  }
};

/**
 * Update verification status of user Document details.
 *
 * @param {id} userDocumentID - User Document ID to update verification status.
 * @param {number} verifyStatus - New verification status (2 for Rejected, 1 for Verified).
 * @param {number} verifyBy - User ID of the verifier.
 */

exports.postDocVerifyRequest = async (req, res, next) => {
  try {
    const { userDocumentID, verifyStatus, verifyBy, rejectionRemarks } =
      req.body;

    let result = await sequelize.transaction(async (t) => {
      const updateStatus = await UserDocument.update(
        { verifyStatus, verifyBy, rejectionRemarks },
        {
          where: { userDocumentID },
          transaction: t,
        }
      );

      const userDoc = await UserDocument.findOne({
        raw: true,
        where: { userDocumentID: userDocumentID },
      });
      if (
        +verifyStatus == 1 &&
        (+userDoc.documentListID == 1 || +userDoc.documentListID == 2)
      ) {
        const empJoining = await EmployeeJoining.findOne({
          where: { userMasterID: userDoc.userMasterID, status: 1 },
          raw: true,
        });

        if (empJoining) {
          if (+userDoc.documentListID == 1) {
            await EmployeeJoining.update(
              {
                adharName: userDoc.nameOnDocument,
                adharCard: userDoc.documentNumber,
                adharPhoto: userDoc.document,
              },
              {
                where: {
                  employeeJoiningDetailId: empJoining.employeeJoiningDetailId,
                },
                transaction: t,
              }
            );
          } else {
            await EmployeeJoining.update(
              {
                pancard: userDoc.documentNumber,
                panPhoto: userDoc.document,
              },
              {
                where: {
                  employeeJoiningDetailId: empJoining.employeeJoiningDetailId,
                },
                transaction: t,
              }
            );
          }
        } else {
          if (+userDoc.documentListID == 1) {
            await EmployeeJoining.create(
              {
                userMasterID: userDoc.userMasterID,
                createBy: verifyBy,
                adharName: userDoc.nameOnDocument,
                adharCard: userDoc.documentNumber,
                adharPhoto: userDoc.document,
              },
              { transaction: t }
            );
          } else {
            await EmployeeJoining.create(
              {
                userMasterID: userDoc.userMasterID,
                createBy: verifyBy,
                pancard: userDoc.documentNumber,
                panPhoto: userDoc.document,
              },
              { transaction: t }
            );
          }
        }
      }

      await UserInbox.destroy({
        where: {
          activityTable: UserDocument.getTableName(),
          activityTablePK: userDocumentID,
        },
        transaction: t,
      });
    });

    return res.status(200).json({
      status: 200,
      message: 'Verification status updated successfully.',
      data: {},
    });
  } catch (err) {
    next(err);
  }
};

exports.UserExpiryDocument = async (req, res, next) => {
  try {
    const { users, companyMasterID, exportData, page, limit } = await req.body;

    const filterDate = asiaKolkataDateTime(new Date()).slice(0, 10);
    const rawCurrentDate = new Date();
    const oneMonthLaterDate = new Date(rawCurrentDate);
    oneMonthLaterDate.setMonth(oneMonthLaterDate.getMonth() + 1);
    const formattedCurrentDate = asiaKolkataDateTime(new Date(rawCurrentDate));
    const formattedOneMonthLater = asiaKolkataDateTime(
      new Date(oneMonthLaterDate)
    );

    const paginationQuery = {};
    if (!exportData) {
      paginationQuery.offset = (+page - 1) * +limit;
      paginationQuery.limit = +limit;
    }

    let condition = {
      expiryDate: {
        [Sequelize.Op.not]: null,
        [Sequelize.Op.lte]: new Date(formattedOneMonthLater),
      },
    };

    if (users && users.length > 0) condition.userMasterID = users;

    if (companyMasterID)
      condition['$userMaster.companyMasterId$'] = companyMasterID;

    condition['$userMaster.status$'] = 1;
    condition.status = 1;
    condition.verifyStatus = 1;

    const order = [['expiryDate', 'ASC']];
    const { rows: user, count } = await UserDocument.findAndCountAll({
      where: condition,
      ...paginationQuery,
      order,
      attributes: ['documentListID', 'expiryDate', 'userMasterID'],
      include: [
        {
          required: true,
          model: DocumentList,
          attributes: ['documentName'],
        },
        {
          required: true,
          model: UserMaster,
          attributes: ['displayName', 'userNumber', 'companyMasterId'],
          include: [
            {
              required: false,
              model: EmployeeDesignation,
              where: {
                status: 1,
                applicableDate: { [Sequelize.Op.lte]: new Date(filterDate) },
                [Sequelize.Op.or]: [
                  { endDate: { [Sequelize.Op.gte]: new Date(filterDate) } },
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
              model: EmployeeDepartment,
              where: {
                status: 1,
                applicableDate: { [Sequelize.Op.lte]: new Date(filterDate) },
                [Sequelize.Op.or]: [
                  { endDate: { [Sequelize.Op.gte]: new Date(filterDate) } },
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
              where: {
                // ...(branchMasterID && { branchID: branchMasterID }),
                status: 1,
                applicableDate: { [Sequelize.Op.lte]: new Date(filterDate) },
                [Sequelize.Op.or]: [
                  { endDate: { [Sequelize.Op.gte]: new Date(filterDate) } },
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
              model: companyMaster,
              attributes: ['companyMasterID', 'companyName'],
            },
          ],
        },
      ],
    });

    const finaldata = user.map((e) => {
      const formattedExpiryDate = asiaKolkataDateTime(
        new Date(e.expiryDate)
      ).slice(0, 10);
      const date = new Date(formattedExpiryDate);
      const formattedDate =
        ('0' + date.getDate()).slice(-2) +
        '-' +
        ('0' + (date.getMonth() + 1)).slice(-2) +
        '-' +
        date.getFullYear();

      const currentDate = new Date(formattedCurrentDate.slice(0, 10));
      const timeDifference = Math.abs(currentDate.getTime() - date.getTime());
      const dayDifference = Math.ceil(timeDifference / (1000 * 3600 * 24));

      return {
        displayName: e.userMaster.displayName,
        userMasterID: e.userMasterID,
        // userMasterID: e.userMasterID.toString(),
        employeeCode:
          e.userMaster.employeeJoiningDetails.length > 0
            ? e.userMaster.employeeJoiningDetails[0].employeeCode
            : '',
        companyName: e.userMaster.companyMaster.companyName,
        branchName:
          e.userMaster.employeeBranches.length > 0
            ? e.userMaster.employeeBranches[0].branchMaster.branchName
            : '',
        departmentName:
          e.userMaster.employeeDepartments.length > 0
            ? e.userMaster.employeeDepartments[0].department.departmentName
            : '',
        designationName:
          e.userMaster.employeeDesignations.length > 0
            ? e.userMaster.employeeDesignations[0].designation.designationName
            : '',
        userNumber: e.userMaster.userNumber,
        documentName: e.documentList.documentName,
        expiryDate: formattedDate,
        expiringstatus:
          date.getTime() < currentDate.getTime()
            ? '2'
            : date.getTime() === currentDate.getTime()
              ? '0'
              : '1',
        status:
          date.getTime() < currentDate.getTime()
            ? 'Expired'
            : date.getTime() === currentDate.getTime()
              ? 'Expiring Today'
              : `Expiring In ${dayDifference} Days`,
      };
    });

    if (exportData) {
      const finalExportData = finaldata.map((e) => {
        return {
          'Expiry Status': e.status,
          'Employee Code': e.employeeCode,
          'Employee Name': e.displayName,
          'User Number': e.userNumber,
          'Company Name': e.companyName,
          'Branch Name': e.branchName,
          'Department Name': e.departmentName,
          'Designation Name': e.designationName,
          'Document Name': e.documentName,
          'Expiry Date': e.expiryDate,
        };
      });

      return await generateExcel(
        finalExportData,
        'Expiry-Document',
        'xlsx',
        res
      );
    }
    return res.status(200).json({
      status: 200,
      data: finaldata,
      totalcount: count,
    });
  } catch (err) {
    next(err);
  }
};
