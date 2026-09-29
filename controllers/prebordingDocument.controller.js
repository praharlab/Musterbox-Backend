const Preboarding = require('../models/preboarding');
//const PrebordingDocument = require('../models/prebordingDocument');
const sequelize = require('../config/database');
const JoiningDocumentType = require('../models/joiningDocumentType');
const Designation = require('../models/designation');
const DesignationWiseDocument = require('../models/designationWiseDocument');
const PrebordingDocument = require('../models/prebordingDocument');

exports.addDocs = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const formData = req.body;
    const preboardingID = +formData[`preboardingID`];
    const files = req.files;
    const preboardingDocumnetData = [];
    const record = await Preboarding.findOne({
      where: { preboardingID, docUploadStatus: 2 },
    });

    if (record?.docUploadStatus == 2) {
      return res.status(200).json({
        status: 200,
        message: 'Looks like you Already uploaded the documents.',
      });
    }

    const entryCount = Object.keys(formData).filter((key) =>
      key.startsWith('designationWiseDocumentID')
    ).length;

    for (let i = 0; i < entryCount; i++) {
      preboardingDocumnetData.push({
        fromDate: formData[`fromDate${i}`] || null,
        issueDate: formData[`issueDate${i}`] || null,
        expiryDate: formData[`expiryDate${i}`] || null,
        identificationNumber: formData[`identificationNumber${i}`] || null,
        preboardingID: preboardingID,
        joiningDocumentMasterID: +formData[`joiningDocumentMasterID${i}`],
        designationWiseDocumentID: +formData[`designationWiseDocumentID${i}`],
        attachment: ['uploads/user/document/' + files.attachment[i].filename],
      });
    }

    await PrebordingDocument.bulkCreate(preboardingDocumnetData, {
      hooks: false,
      transaction,
    });

    await Preboarding.update(
      { docUploadStatus: 2 },
      { where: { preboardingID } }
    );
    await transaction.commit();

    return res
      .status(200)
      .json({ status: 200, message: 'Docs Uploaded Successfully' });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

exports.getByPreBordingId = async (req, res, next) => {
  try {
    const preboardingID = +req.params.id;
    const { rows: getDocumentByPrebordingId, count } =
      await PrebordingDocument.findAndCountAll({
        // raw: true,
        where: { preboardingID, status: 1 },
        order: [['prebordingDocID', 'ASC']],
        include: [
          {
            model: DesignationWiseDocument,
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
            ],
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
    return res.status(200).json({
      status: 200,
      data: getDocumentByPrebordingId,
      totalcount: count,
    });
  } catch (err) {
    next(err);
  }
};
