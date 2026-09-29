const sequelize = require('../config/database');
const DesignationWiseDocument = require('../models/designationWiseDocument');
const message = require('../response_message/message');
const Designation = require('../models/designation');
const JoiningDocumentType = require('../models/joiningDocumentType');
const {
  genrateDemoExcelForDesinationWiseDocument,
} = require('../utils/exportData');
const { requiredUserTypeEnum } = require('../utils/dbUtils');
const readXlsxFile = require('read-excel-file/node');
const fs = require('fs');
const path = require('path');

// add api
exports.addDesignationWiseDocument = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const { designationId, designationWiseDocumentArray } = await req.body;

    const designationWiseDocumentData = await DesignationWiseDocument.findOne(
      {
        where: {
          designationId,
          status: 1,
        },
      },
      { transaction }
    );

    if (designationWiseDocumentData) {
      await transaction.rollback();
      return res.status(200).json({
        status: 401,
        message: message.usermessage.alreadyExists(
          'Document For this Designation'
        ),
      });
    }
    const createData = [];
    for (let data of designationWiseDocumentArray) {
      if (data.add == true) {
        const create = {
          designationId: designationId,
          joiningDocumentMasterID: data.joiningDocumentMasterID,
          isRequired: data.isRequired,
          requiredUserType: data.requiredUserType,
          createBy: req.userDetails.userMasterId,
          createByIp: req.userDetails.createByIp,
        };
        createData.push(create);
      }
    }
    if (createData.length > 0) {
      await DesignationWiseDocument.bulkCreate(createData, {
        transaction,
        user: req.userDetails,
      });
    }

    await transaction.commit();

    return res.status(200).json({
      status: 200,
      message: message.usermessage.addMessage('Designation Wise Document'),
    });
  } catch (err) {
    await transaction.rollback();

    next(err);
  }
};

// get all data api
exports.listDesignationWiseDocument = async (req, res, next) => {
  try {
    let { page, limit, exportData, designationId, companyMasterID } = req.query;

    const condition = {};

    const paginationQuery = {};
    if (!exportData && page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }
    if (designationId) {
      condition.designationId = designationId;
    }
    const distinctDesignationIds = await DesignationWiseDocument.findAll({
      attributes: [
        [
          sequelize.fn('DISTINCT', sequelize.col('designationId')),
          'designationId',
        ],
      ],
      raw: true,
    });
    const designationIds = distinctDesignationIds.map(
      (item) => item.designationId
    );
    const uniqueTables = await Designation.findAll({
      raw: true,
      where: {
        designationId: designationIds,
        companyMasterID: companyMasterID,
      },
      ...paginationQuery,
      attributes: ['designationId', 'designationName', 'jobdescription'],
    });

    return res.status(200).json({
      status: 200,
      data: uniqueTables,
      totalcount: uniqueTables.length,
    });
  } catch (error) {
    next(error);
  }
};

exports.getjoiningDocumentTypeByCompanyMasterID = async (req, res, next) => {
  try {
    const { companyMasterID } = req.query;
    let get_form_data = await JoiningDocumentType.findAll({
      where: {
        companyMasterID: companyMasterID,
        status: 1,
      },
      order: [['joiningDocumentMasterID', 'ASC']],
    });
    if (!get_form_data) {
      return res
        .status(200)
        .json({ status: 200, message: message.usermessage.deletedrecord });
    }
    const finalExportData = get_form_data.map((e) => {
      return {
        // 'Company Name': e.userDetails.company,
        joiningDocumentMasterID: e.joiningDocumentMasterID,
        documentName: e.documentName,
        add: false,
        isRequired: false,
        requiredUserType: '1',
      };
    });

    return res.status(200).json({ status: 200, data: finalExportData });
  } catch (err) {
    next(err);
  }
};

exports.getdesignationWiseDocumentByDesignationID = async (req, res, next) => {
  try {
    const { designationId } = req.query;
    let getDesignationWiseDocumentData = await DesignationWiseDocument.findAll({
      raw: true,
      where: {
        designationId: designationId,
        status: 1,
      },
      order: [['designationWiseDocumentID', 'ASC']],
      include: [
        {
          model: Designation,
          attributes: ['designationId', 'designationName', 'companyMasterID'],
        },
      ],
    });
    if (getDesignationWiseDocumentData.length == 0) {
      return res
        .status(200)
        .json({ status: 200, message: message.usermessage.deletedrecord });
    }
    const designationData = await Designation.findOne({
      raw: true,
      where: {
        designationId: designationId,
        status: 1,
      },
      attributes: ['designationId', 'designationName', 'companyMasterID'],
    });
    const get_form_data = await JoiningDocumentType.findAll({
      raw: true,
      where: {
        companyMasterID: designationData.companyMasterID,
        status: 1,
      },
      order: [['joiningDocumentMasterID', 'ASC']],
    });

    if (get_form_data.length == 0) {
      return res
        .status(200)
        .json({ status: 200, message: message.usermessage.deletedrecord });
    }

    const finalExportData = get_form_data.map((e) => {
      const data = getDesignationWiseDocumentData.find(
        (document) =>
          e.joiningDocumentMasterID == document.joiningDocumentMasterID
      );

      if (data) {
        return {
          designationWiseDocumentID: data.designationWiseDocumentID,
          joiningDocumentMasterID: e.joiningDocumentMasterID,
          documentName: e.documentName,
          add: true,
          isRequired: data.isRequired,
          requiredUserType: data.requiredUserType,
        };
      } else {
        return {
          designationWiseDocumentID: null,
          joiningDocumentMasterID: e.joiningDocumentMasterID,
          documentName: e.documentName,
          add: false,
          isRequired: false,
          requiredUserType: '1',
        };
      }
    });

    return res.status(200).json({
      status: 200,
      data: {
        documentType: finalExportData,
        designationId: designationId,
        designationName: designationData.designationName,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.editDesignationWiseDocument = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const { designationId, designationWiseDocumentArray } = await req.body;

    const createData = [];
    const updateData = [];
    const destroyData = [];
    for (let data of designationWiseDocumentArray) {
      if (data.add == true && data.designationWiseDocumentID == null) {
        const create = {
          designationId: designationId,
          joiningDocumentMasterID: data.joiningDocumentMasterID,
          isRequired: data.isRequired,
          requiredUserType: data.requiredUserType,
          createBy: req.userDetails.userMasterId,
          createByIp: req.userDetails.createByIp,
        };
        createData.push(create);
      } else if (data.add == true && data.designationWiseDocumentID != null) {
        const update = {
          designationWiseDocumentID: data.designationWiseDocumentID,
          designationId: designationId,
          joiningDocumentMasterID: data.joiningDocumentMasterID,
          isRequired: data.isRequired,
          requiredUserType: data.requiredUserType,
          updateBy: req.userDetails.userMasterId,
          updateByIp: req.userDetails.createByIp,
        };
        updateData.push(update);
      } else if (data.add == false && data.designationWiseDocumentID != null) {
        const destroy = {
          designationWiseDocumentID: data.designationWiseDocumentID,
        };
        destroyData.push(destroy);
      }
    }

    const promiseArray = [];
    if (createData.length > 0) {
      promiseArray.push(
        DesignationWiseDocument.bulkCreate(createData, {
          user: req.userDetails,
          transaction,
        })
      );
    }
    if (updateData.length > 0) {
      updateData.map((data) => {
        promiseArray.push(
          DesignationWiseDocument.update(
            {
              designationId: designationId,
              joiningDocumentMasterID: data.joiningDocumentMasterID,
              isRequired: data.isRequired,
              requiredUserType: data.requiredUserType,
              updateBy: req.userDetails.userMasterId,
              updateByIp: req.userDetails.createByIp,
            },
            {
              where: {
                designationWiseDocumentID: data.designationWiseDocumentID,
              },
            },
            { transaction }
          )
        );
      });
    }

    if (destroyData.length > 0) {
      const destroyIDs = destroyData.map(
        (data) => data.designationWiseDocumentID
      );
      promiseArray.push(
        DesignationWiseDocument.destroy(
          {
            where: {
              designationWiseDocumentID: destroyIDs,
            },
          },
          { transaction }
        )
      );
    }

    if (promiseArray.length > 0) {
      await Promise.all(promiseArray);
    }

    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: message.usermessage.updateMessage('Designation Wise Document'),
    });
  } catch (err) {
    await transaction.rollback();

    next(err);
  }
};

exports.deleteDesignationWiseDocument = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const { designationId } = await req.body;
    const designationWiseDocumentData = await DesignationWiseDocument.findAll(
      {
        where: {
          designationId,
          status: 1,
        },
      },
      { transaction }
    );
    const destroyIDs = designationWiseDocumentData.map(
      (item) => item.designationWiseDocumentID
    );
    await DesignationWiseDocument.destroy(
      {
        where: {
          designationWiseDocumentID: destroyIDs,
        },
      },
      { transaction }
    );
    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: message.usermessage.deleteMessage('Designation Wise Document'),
    });
  } catch (err) {
    await transaction.rollback();

    next(err);
  }
};

exports.getDocumentByDesignationIDAndRequiredUserType = async (
  req,
  res,
  next
) => {
  try {
    const { designationId, requiredUserType } = req.query;
    const condition = {};
    condition.designationId = designationId;
    condition.requiredUserType = [requiredUserType, '3'];
    condition.status = 1;
    condition.isRequired = true;
    const getDesignationWiseDocumentData =
      await DesignationWiseDocument.findAll({
        raw: true,
        where: condition,
        order: [['designationWiseDocumentID', 'ASC']],
        attributes: [
          'designationWiseDocumentID',
          'isRequired',
          'requiredUserType',
          'status',
          'joiningDocumentMasterID',
          'designationId',
        ],
        include: [
          {
            model: Designation,
            where: {
              status: 1,
            },
            attributes: ['designationId', 'companyMasterID'],
          },
          {
            model: JoiningDocumentType,
            where: {
              status: 1,
            },
            attributes: [
              'joiningDocumentMasterID',
              'documentName',
              'documentFileType',
              'hasFromDate',
              'hasIssueDate',
              'hasExpiryDate',
              'hasIdentificationNumber',
              'status',
              'companyMasterID',
            ],
          },
        ],
      });
    if (getDesignationWiseDocumentData.length == 0) {
      return res.status(200).json({ status: 200, data: [] });
    }

    return res.status(200).json({
      status: 200,
      data: getDesignationWiseDocumentData,
    });
  } catch (err) {
    next(err);
  }
};

exports.generateDemoExcel = async (req, res, next) => {
  try {
    const { companyMasterID } = await req.body;
    const designationOrder = [['designationName', 'ASC']];

    const designationData = await Designation.findAll({
      where: {
        companyMasterID,
        status: 1,
      },
      designationOrder,
    });
    const getallDesignationIDs = designationData.map((e) => +e.designationId);
    const joiningDoucmentTypeOrder = [['designationName', 'ASC']];

    const findallJoiningDocumentType = await JoiningDocumentType.findAll({
      where: {
        companyMasterID,
      },
      joiningDoucmentTypeOrder,
    });

    const getDesignationWiseDocumentData =
      await DesignationWiseDocument.findAll({
        raw: true,
        where: {
          designationId: getallDesignationIDs,
        },
        order: [['designationWiseDocumentID', 'ASC']],
      });

    const designationDocData = [];
    for (const designation of designationData) {
      for (const document of findallJoiningDocumentType) {
        const designationDocument = getDesignationWiseDocumentData.find(
          (e) =>
            e.designationId == designation.designationId &&
            e.joiningDocumentMasterID == document.joiningDocumentMasterID
        );
        const data = {
          designationName: designation.designationName,
          documentName: document.documentName,
          isNeeded: designationDocument ? 'Y' : '',
          isRequired: designationDocument
            ? designationDocument.isRequired
              ? 'Y'
              : 'N'
            : '',
          requiredUserType: designationDocument
            ? designationDocument.requiredUserType &&
              designationDocument.requiredUserType ==
                requiredUserTypeEnum.National
              ? 'National'
              : designationDocument.requiredUserType &&
                  designationDocument.requiredUserType ==
                    requiredUserTypeEnum.Expart
                ? 'Expat'
                : 'Both'
            : '',
        };
        designationDocData.push(data);
      }
    }
    await genrateDemoExcelForDesinationWiseDocument(
      designationDocData,
      'Demo Designationwise Document',
      'xlsx',
      res
    );
    return;
  } catch (err) {
    next(err);
  }
};

exports.validateUploadExcel = async (req, res, next) => {
  if (!req.file) {
    return res
      .status(200)
      .send({ status: 400, message: 'Please upload an excel file!' });
  }

  const filePath = path.join(__dirname, `../uploads/${req.file.filename}`);

  try {
    const { companyMasterID } = await req.body;
    const designationOrder = [['designationName', 'ASC']];

    const designationData = await Designation.findAll({
      where: {
        companyMasterID,
        status: 1,
      },
      designationOrder,
    });

    const joiningDoucmentTypeOrder = [['designationName', 'ASC']];

    const findallJoiningDocumentType = await JoiningDocumentType.findAll({
      where: {
        companyMasterID,
      },
      joiningDoucmentTypeOrder,
    });
    const rows = await readXlsxFile(filePath);

    // Skip header
    rows.shift();

    const data = [];
    for (const row of rows) {
      if (
        row[0] != null &&
        row[0].trim() != '' &&
        row[1] != null &&
        row[1].trim() != '' &&
        row[2] != null &&
        row[2].trim() != '' &&
        (row[2].trim() == 'Y' || row[2].trim() == 'N')
      ) {
        const findDesignation = designationData.find(
          (e) => e.designationName == row[0]
        );
        const findJoiningDocument = findallJoiningDocumentType.find(
          (e) => e.documentName == row[1]
        );

        if (!findDesignation || !findJoiningDocument) {
          continue;
        }

        let designationWiseData = {
          isNeeded: row[2].trim() == 'Y' ? true : false,
          isRequired: row[3] == 'Y' ? true : false,
          requiredUserType:
            row[4] == 'National'
              ? requiredUserTypeEnum.National
              : row[4] == 'Expat'
                ? requiredUserTypeEnum.Expart
                : requiredUserTypeEnum.Both,
          designationId: findDesignation.designationId,
          designationName: findDesignation.designationName,
          joiningDocumentMasterID: findJoiningDocument.joiningDocumentMasterID,
          documentName: findJoiningDocument.documentName,
          remarks: '',
        };

        data.push(designationWiseData);
      }
    }
    fs.unlink(filePath, function (err) {
      if (err) console.log(err);
    });
    return res.status(200).json({
      status: 200,
      message: message.usermessage.validateMessage('Designation Wise Document'),
      data: data,
    });
  } catch (error) {
    next(error);
  }
};

exports.revalidateDesignationWiseDocument = async (req, res, next) => {
  try {
    const { designationWiseDocData } = req.body;

    const data = [];

    for (const row of designationWiseDocData) {
      const designationwiseData = {
        isNeeded: row.isNeeded,
        isRequired: row.isRequired,
        requiredUserType: row.requiredUserType,
        designationId: row.designationId,
        designationName: row.designationName,
        joiningDocumentMasterID: row.joiningDocumentMasterID,
        documentName: row.documentName,
        remarks: '',
      };

      data.push(designationwiseData);
    }

    return res.status(200).json({
      status: 200,
      message: message.usermessage.reValidateMessage(
        'Designation Wise Document'
      ),
      data: data,
    });
  } catch (error) {
    next(error);
  }
};

exports.addValidateDesignationWiseDocument = async (req, res, next) => {
  try {
    const { designationWiseDocData, companyMasterID } = req.body;
    const designationData = await Designation.findAll({
      where: {
        companyMasterID,
        status: 1,
      },
    });
    const getallDesignationIDs = designationData.map((e) => +e.designationId);

    const getDesignationWiseDocumentData =
      await DesignationWiseDocument.findAll({
        raw: true,
        where: {
          designationId: getallDesignationIDs,
        },
        order: [['designationWiseDocumentID', 'ASC']],
      });
    const createData = [];
    const updateData = [];
    const destroyIDs = [];
    for (const row of designationWiseDocData) {
      const findExistingDoc = getDesignationWiseDocumentData.find(
        (e) =>
          e.designationId == row.designationId &&
          e.joiningDocumentMasterID == row.joiningDocumentMasterID
      );

      if (findExistingDoc && !row.isNeeded) {
        destroyIDs.push(findExistingDoc.designationWiseDocumentID);
        continue;
      }

      if (findExistingDoc && row.isNeeded) {
        const update = {
          designationWiseDocumentID: findExistingDoc.designationWiseDocumentID,
          isRequired: row.isRequired,
          requiredUserType: row.requiredUserType,
          designationId: row.designationId,
          joiningDocumentMasterID: row.joiningDocumentMasterID,
        };
        updateData.push(update);
        continue;
      }

      if (!findExistingDoc && row.isNeeded) {
        const create = {
          isRequired: row.isRequired,
          requiredUserType: row.requiredUserType,
          designationId: row.designationId,
          joiningDocumentMasterID: row.joiningDocumentMasterID,
        };
        createData.push(create);
      }
    }

    if (createData.length) {
      await DesignationWiseDocument.bulkCreate(createData, {
        user: req.userDetails,
      });
    }

    if (updateData.length) {
      await Promise.all(
        updateData.map((row) =>
          DesignationWiseDocument.update(
            {
              isRequired: row.isRequired,
              requiredUserType: row.requiredUserType,
              designationId: row.designationId,
              joiningDocumentMasterID: row.joiningDocumentMasterID,
              updateBy: req.userDetails.userMasterId,
              updateByIp: req.userDetails.userIpAddress,
            },
            {
              where: {
                designationWiseDocumentID: row.designationWiseDocumentID,
              },
            },
            {
              individualHooks: false,
            }
          )
        )
      );
    }

    if (destroyIDs.length) {
      await DesignationWiseDocument.destroy({
        where: {
          designationWiseDocumentID: destroyIDs,
        },
        user: req.userDetails,
      });
    }
    return res.status(200).json({
      status: 200,
      message: message.usermessage.addMessage('Designation Wise Document'),
    });
  } catch (err) {
    next(err);
  }
};
