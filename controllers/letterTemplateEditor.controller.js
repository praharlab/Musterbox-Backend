const letterTemplateEditor = require('../models/letterTemplateEditor');
const logger = require('../config/logger');
const message = require('../response_message/message');
const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const CompanyMasters = require('../models/companyMaster');
const LetterTemplateType = require('../models/letterTemplateType');
const path = require('path');

// exports.postAddLetterEditor = async (req, res, next) => {
//     try {
//         let  {
//             letterTypeID,
//             companyMasterID,
//             letter,
//             path,
//             status,
//             createBy,
//             createByIp
//         } = await req.body;

//         console.log(req.body,"ghghg");
//         let insert_db_status = await letterTemplateEditor.create({
//             letterTypeID,
//             companyMasterID,
//             letter,
//             path,
//             status,
//             createBy,
//             createByIp
//         })
//         res.status(200)
//             .json({ status: 200, message: message.usermessage.lettereditoradd, data: insert_db_status });

//     } catch (err) {
//         if (!err.statusCode) {
//             err.statusCode = 401;
//         }
//         next(err);
//     }
// };

const multer = require('multer');
const { log } = require('handlebars');
const companyMaster = require('../models/companyMaster');

// Define the storage and file filter for multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, `../uploads/lettertemplate`));
  },
  filename: function (req, file, cb) {
    // Rename the file (optional)
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname +
        '-' +
        uniqueSuffix +
        '.' +
        file.originalname.split('.').pop()
    );
  },
});

const fileFilter = function (req, file, cb) {
  // Check if the uploaded file is a document (you can modify this based on your file type requirements)
  if (
    file.mimetype.startsWith('application/') ||
    file.mimetype.startsWith('text/')
  ) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only document files are allowed.'));
  }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

exports.postAddLetterEditor = async (req, res, next) => {
  try {
    let {
      letterTypeID,
      companyMasterID,
      letter,
      letterhead,
      status,
      createBy,
      createByIp,
    } = req.body;

    // Assuming 'path' is now a file field in your form, multer will handle the file validation
    upload.single('path')(req, res, async function (err) {
      if (err instanceof multer.MulterError) {
        // A multer error occurred (e.g., file size exceeded)
        return res
          .status(400)
          .json({ status: 400, message: 'Multer Error: ' + err.message });
      } else if (err) {
        // An unknown error occurred
        return res
          .status(400)
          .json({ status: 400, message: 'Unknown Error: ' + err.message });
      }

      // Validation passed, now you can access the uploaded file details in req.file
      let filePath = '';
      if (req.file) {
        filePath = req.file.filename;
      }

      // Get the file path (assuming you are storing the file path in your database)

      if (letter == 'undefined') {
        letter = '';
      }

      // Perform other operations and save the data to the database
      let insert_db_status = await letterTemplateEditor.create({
        letterTypeID,
        companyMasterID,
        letter,
        letterhead,
        path: filePath, // Save the file path in the database
        status,
        createBy,
        createByIp,
      });

      return res.status(200).json({
        status: 200,
        message: message.usermessage.lettereditoradd,
        data: insert_db_status,
      });
    });
  } catch (err) {
    next(err);
  }
};

exports.getAllLetterEditor = async (req, res, next) => {
  try {
    let { limit, page, searchQuery, companyMasterID } = await req.body;
    let offset = (page - 1) * limit;
    let lettertamplateeditor, totalcount;

    const companyid1 = companyMasterID;

    let data = await CompanyMasters.findOne({
      where: { companyMasterID: companyMasterID, status: 1 },
    });

    if (searchQuery) {
      lettertamplateeditor = await letterTemplateEditor.findAll({
        raw: true,
        where: {
          [Sequelize.Op.or]: [
            {
              letterTypename: { [Sequelize.Op.iLike]: '%' + searchQuery + '%' },
            },
            sequelize.where(
              sequelize.cast(
                sequelize.col('letterTemplateEditor.letterTemplateID'),
                'varchar'
              ),
              { [Sequelize.Op.iLike]: `%${searchQuery}%` }
            ),
          ],
          status: 1,
          companyMasterID: companyMasterID,
        },
        include: [
          {
            model: companyMaster,
            attrbutes: ['companyName'],
          },
          {
            model: LetterTemplateType,
            attrbutes: ['letterTypename'],
          },
        ],
        order: [['createdAt', 'DESC']],
      });
      totalcount = lettertamplateeditor.length;
    } else if (page == '' && limit == '') {
      lettertamplateeditor = await letterTemplateEditor.findAll({
        raw: true,
        where: {
          status: 1,
          companyMasterID: companyMasterID,
        },
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: companyMaster,
            attrbutes: ['companyName'],
          },
          {
            model: LetterTemplateType,
            attrbutes: ['letterTypename'],
          },
        ],
      });
      totalcount = await letterTemplateEditor.count({
        raw: true,
        where: {
          status: 1,
          companyMasterID: companyMasterID,
        },
      });
    } else {
      lettertamplateeditor = await letterTemplateEditor.findAll({
        raw: true,
        where: {
          status: [0, 1],
          companyMasterID: companyMasterID,
        },
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: companyMaster,
            attrbutes: ['companyName'],
          },
          {
            model: LetterTemplateType,
            attrbutes: ['letterTypename'],
          },
        ],
        limit: limit,
        offset: offset,
      });
      totalcount = await letterTemplateEditor.count({
        raw: true,
        where: {
          status: [0, 1],
          companyMasterID: companyMasterID,
        },
      });
    }

    res.status(200).json({
      status: 200,
      message: message.usermessage.lettertemplateeditorget,
      data: lettertamplateeditor,
      totalcount: totalcount,
    });
  } catch (err) {
    next(err);
  }
};

exports.getLetterTemplateEditorId = async (req, res, next) => {
  try {
    let get_one_data = await letterTemplateEditor.findOne({
      where: { letterTemplateID: req.params.id, status: ['0', '1'] },
      raw: true,
    });

    if (!get_one_data)
      res
        .status(200)
        .json({ status: 200, message: message.usermessage.deletedrecord });
    else res.status(200).json({ status: 200, data: get_one_data });
  } catch (err) {
    next(err);
  }
};

exports.postUpdatLetterEditor = async (req, res, next) => {
  try {
    console.log('Request Body:', req.body);
    console.log('Request File:', req.file);
    let {
      letterTemplateID,
      letter,
      letterTypeID,
      letterhead,
      companyMasterID,
      path,
      status,
      updateBy,
      updateByIp,
    } = await req.body;

    if (!letter) {
      if (req.file) {
        let filePath = req.file.filename;

        let change_data_status = await letterTemplateEditor.update(
          {
            letter: '',
            path: filePath,
            letterTypeID,
            letterhead,
            companyMasterID,
            status,
            updateBy,
            updateByIp,
          },
          {
            where: { letterTemplateID: letterTemplateID },
          }
        );
      } else {
        let change_data_status = await letterTemplateEditor.update(
          {
            letter: '',
            status,
            letterTypeID,
            letterhead,
            companyMasterID,
            updateBy,
            updateByIp,
          },
          {
            where: { letterTemplateID: letterTemplateID },
          }
        );
      }
    } else {
      console.log(letterTemplateID);
      let change_data_status = await letterTemplateEditor.update(
        {
          letter,
          path: '',
          status,
          letterTypeID,
          letterhead,
          companyMasterID,
          updateBy,
          updateByIp,
        },
        {
          where: { letterTemplateID: letterTemplateID },
        }
      );
    }

    return res.status(200).json({ status: 200, message: 'lettertypeupdate ' });
  } catch (err) {
    next(err);
  }
};

exports.postDeleteLetterEditorById = async (req, res, next) => {
  try {
    let = { letterTemplateID } = await req.body;
    let delete_status = await letterTemplateEditor.update(
      {
        status: '2',
      },
      {
        where: { letterTemplateID: letterTemplateID },
      }
    );
    console.log(delete_status, 'here');

    res
      .status(200)
      .json({ status: 200, message: message.usermessage.lettereditordelete });
  } catch (err) {
    next(err);
  }
};

exports.poststatuschange = async (req, res, next) => {
  try {
    let = { letterTemplateID, status } = await req.body;
    let delete_status;
    if (status == '1') {
      delete_status = await letterTemplateEditor.update(
        {
          status: '1',
        },
        {
          where: { letterTemplateID: letterTemplateID, status: ['1', '0'] },
        }
      );
    } else {
      delete_status = await letterTemplateEditor.update(
        {
          status: '0',
        },
        {
          where: { letterTemplateID: letterTemplateID, status: ['1', '0'] },
        }
      );
    }

    if (delete_status != 0) {
      res.status(200).json({
        status: 200,
        message: message.usermessage.letterdelete,
        data: {},
      });
    } else {
      res.status(200).json({
        status: 200,
        message: message.usermessage.deletedrecord,
        data: {},
      });
    }
  } catch (err) {
    next(err);
  }
};
