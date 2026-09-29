const multer = require('multer');
const path = require('path');
var mkdirp = require('mkdirp');
const mime = require('mime-types');
const fs = require('fs');

const Companystore = multer.diskStorage({
  destination: function (req, file, cb) {
    upload_path =
      file.fieldname == 'companyLogo'
        ? path.join(__dirname, '../uploads/company/logo')
        : file.fieldname == 'authorizedSignature' ? path.join(__dirname, '../uploads/company/signature') 
        : path.join(__dirname, '../uploads/company/letterHead');

        if (!fs.existsSync(upload_path)) {
          fs.mkdirSync(upload_path, { recursive: true });
        }

    cb(null, upload_path);
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + '_' + Date.now() + '.' + mime.extension(file.mimetype)
    );
  },
});

const uploadcompanylogo = multer({
  storage: Companystore,
}).fields([
  { name: 'companyLogo', maxCount: 1 },
  { name: 'authorizedSignature', maxCount: 1 },
  { name: 'letterHead', maxCount: 1 },
  // Add more objects for each unique parameter name
]);

const excelFilter = (req, file, cb) => {
  if (
    file.mimetype.includes('excel') ||
    file.mimetype.includes('spreadsheetml')
  ) {
    cb(null, true);
  } else {
    cb('Please upload only excel file.', false);
  }
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    upload_path = path.join(__dirname, '../uploads');
    // mkdirp(upload_path, function (err) {
    // 	if (err) console.error(err)
    // 	else {
    //setting destination.
    cb(null, upload_path);
    // }
    // });
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-bezkoder-${file.originalname}`);
  },
});

const uploadfile = multer({
  storage: storage,
  fileFilter: excelFilter,
}).single('file');

// const imageFilter = (req, file, cb) => {
//   if (
//     file.mimetype.includes('JPEG') ||
//     file.mimetype.includes('PNG') ||
//     file.mimetype.includes('JPG') ||
//     file.mimetype.includes('jpeg') ||
//     file.mimetype.includes('png') ||
//     file.mimetype.includes('jpg')
//   ) {
//     cb(null, true)
//   } else {
//     cb('Please upload image in jpeg or png or jpg format.', false)
//   }
// }

const userPhoto = multer.diskStorage({
  destination: function (req, file, cb) {
    upload_path = path.join(__dirname, '../uploads/user/photo');
    // mkdirp(upload_path, function (err) {
    // 	if (err) console.error(err)
    // 	else {
    //setting destination.
    cb(null, upload_path);
    // }
    // });
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + '_' + Date.now() + '.' + mime.extension(file.mimetype)
    );
  },
});

const uploaduserphoto = multer({
  storage: userPhoto,
  // fileFilter: imageFilter,
}).single('photo');

const joiningDocumentPhoto = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === 'photo') {
      upload_path = path.join(__dirname, '../uploads/user/photo');
    } else {
      upload_path = path.join(__dirname, '../uploads/user/document');
    }
    cb(null, upload_path);
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + '_' + Date.now() + '.' + mime.extension(file.mimetype)
    );
  },
});

const uploadUserDocument = multer({ storage: joiningDocumentPhoto, }).fields([
  { name: 'photo', maxCount: 1 },
  { name: 'attachment', maxCount: 100 },
]);


const userdocument = multer.diskStorage({
  destination: function (req, file, cb) {
    upload_path = path.join(__dirname, '../uploads/user/document');

    // mkdirp(upload_path, function (err) {
    // 	if (err) console.error(err)
    // 	else {
    //setting destination.
    cb(null, upload_path);
    // 			}
    // });
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + '_' + Date.now() + '.' + mime.extension(file.mimetype)
    );
  },
});

const uploaduserdocument = multer({
  storage: userdocument,
}).fields([
  { name: 'adharPhoto', maxCount: 1 },
  { name: 'panPhoto', maxCount: 1 },
  // Add more objects for each unique parameter name
]);

const usersignature = multer.diskStorage({
  destination: function (req, file, cb) {
    upload_path = path.join(__dirname, '../uploads/user/signature');
    // mkdirp(upload_path, function (err) {
    // 	if (err) console.error(err)
    // 	else {
    //setting destination.
    cb(null, upload_path);
    // 	}
    // });
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + '_' + Date.now() + '.' + mime.extension(file.mimetype)
    );
  },
});

const uploadempsignature = multer({
  storage: usersignature,
}).single('signature');

const companyLetterhead = multer.diskStorage({
  destination: function (req, file, cb) {
    upload_path = path.join(__dirname, '../uploads/company/letterhead');
    // mkdirp(upload_path, function (err) {
    // 	if (err) console.error(err)
    // 	else {
    //setting destination.
    cb(null, upload_path);
    // 	}
    // });
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + '_' + Date.now() + '.' + mime.extension(file.mimetype)
    );
  },
});

const uploadletterhead = multer({
  storage: companyLetterhead,
}).single('letterhead');

const companydocument = multer.diskStorage({
  destination: function (req, file, cb) {
    upload_path = path.join(__dirname, '../uploads/company/document');
    // mkdirp(upload_path, function (err) {
    // 	if (err) console.error(err)
    // 	else {
    //setting destination.
    cb(null, upload_path);
    // 	}
    // });
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + '_' + Date.now() + '.' + mime.extension(file.mimetype)
    );
  },
});

const uploadcompanydocument = multer({
  storage: companydocument,
}).single('document');

const productPhotoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    upload_path = path.join(__dirname, '../uploads/product/photo');
    // mkdirp(upload_path, function (err) {
    // 	if (err) console.error(err)
    // 	else {
    //setting destination.
    cb(null, upload_path);
    // 			}
    // });
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + '_' + Date.now() + '.' + mime.extension(file.mimetype)
    );
  },
});

const uploadProductPhoto = multer({
  storage: productPhotoStorage,
}).single('productPhoto');

const employeeAssetStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    upload_path = path.join(__dirname, '../uploads/user/assets');
    // mkdirp(upload_path, function (err) {
    // 	if (err) console.error(err)
    // 	else {
    //setting destination.
    cb(null, upload_path);
    // 	}
    // });
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + '_' + Date.now() + '.' + mime.extension(file.mimetype)
    );
  },
});

const uploademployeeassets = multer({
  storage: employeeAssetStorage,
}).array('assetImages', 10);

const LeaveMaster = multer.diskStorage({
  destination: function (req, file, cb) {
    upload_path = path.join(__dirname, '../uploads/leaveMaster');
    // mkdirp(upload_path, function (err) {
    // 	if (err) console.error(err)
    // 	else {
    //setting destination.
    cb(null, upload_path);
    // 	}
    // });
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + '_' + Date.now() + '.' + mime.extension(file.mimetype)
    );
  },
});

const uploadLeaveMaster = multer({
  storage: LeaveMaster,
}).single('file');

const companyNda = multer.diskStorage({
  destination: function (req, file, cb) {
    upload_path = path.join(__dirname, '../uploads/company/Nda');
    // mkdirp(upload_path, function (err) {
    // 	if (err) console.error(err)
    // else {
    //setting destination.
    cb(null, upload_path);
    // 	}
    // });
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + '_' + Date.now() + '.' + mime.extension(file.mimetype)
    );
  },
});

const uploadcompanyNda = multer({
  storage: companyNda,
}).single('pdf');

const UploadAssetMaster = multer.diskStorage({
  destination: function (req, file, cb) {
    upload_path = path.join(__dirname, '../uploads/user/assets/');
    // mkdirp(upload_path, function (err) {
    //   if (err) console.error(err)
    //   else {
    //     //setting destination.
    cb(null, upload_path);
    // }
    // })
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + '_' + Date.now() + '.' + mime.extension(file.mimetype)
    );
  },
});

const uploadAssetMaster = multer({
  storage: UploadAssetMaster,
}).single('assetDocument');

const hrToolKit = multer.diskStorage({
  destination: function (req, file, cb) {
    upload_path = path.join(__dirname, '../uploads/hrtoolkit/');
    // mkdirp(upload_path, function (err) {
    // 	if (err) console.error(err)
    // 	else {
    // 		//setting destination.
    // 		cb(null, upload_path);
    // 	}
    // });
    cb(null, upload_path);
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + '_' + Date.now() + '.' + mime.extension(file.mimetype)
    );
  },
});

const uploadhrtoolkit = multer({
  storage: hrToolKit,
  limits: { fileSize: 3048576 },
}).single('DocumentZip');

const resignation = multer.diskStorage({
  destination: function (req, file, cb) {
    upload_path = path.join(__dirname, '../uploads/resignation/');
    // mkdirp(upload_path, function (err) {
    // 	if (err) console.error(err)
    // 	else {
    // 		//setting destination.
    // 		cb(null, upload_path);
    // 	}
    // });
    cb(null, upload_path);
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + '_' + Date.now() + '.' + mime.extension(file.mimetype)
    );
  },
});

const uploadresignation = multer({
  storage: resignation,
}).single('attachment');

const resignation_Task = multer.diskStorage({
  destination: function (req, file, cb) {
    upload_path = path.join(
      __dirname,
      '../uploads/resignation/resignationtask/'
    );

    cb(null, upload_path);
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + '_' + Date.now() + '.' + mime.extension(file.mimetype)
    );
  },
});

const uploadresignationTask = multer({
  storage: resignation,
}).single('attachment');

const dailyTask = multer.diskStorage({
  destination: function (req, file, cb) {
    upload_path = path.join(__dirname, '../uploads/dailyTask/');

    cb(null, upload_path);
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + '_' + Date.now() + '.' + mime.extension(file.mimetype)
    );
  },
});

// const uploaddailyTask = multer({
//   storage: dailyTask,
// }).single('attachment');

const uploaddailyTask = multer({
  storage: dailyTask,
}).array('attachment', 10);

const userdegree = multer.diskStorage({
  destination: function (req, file, cb) {
    upload_path = path.join(__dirname, '../uploads/user/degree');
    // mkdirp(upload_path, function (err) {
    // 	if (err) console.error(err)
    // 	else {
    //setting destination.
    cb(null, upload_path);
    // 			}
    // });
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + '_' + Date.now() + '.' + mime.extension(file.mimetype)
    );
  },
});

const uploaduserdegree = multer({
  storage: userdegree,
}).single('degree');

const Face_Storage = multer.diskStorage({
  destination: function (req, file, cb) {
    upload_path = path.join(__dirname, '../uploads/face/');

    cb(null, upload_path);
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + '_' + Date.now() + '.' + mime.extension(file.mimetype)
    );
  },
});

const faceUpload = multer({
  storage: Face_Storage,
}).single('facePhoto');

const task = multer.diskStorage({
  destination: function (req, file, cb) {
    upload_path = path.join(__dirname, '../uploads/task/');
    cb(null, upload_path);
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + '_' + Date.now() + '.' + mime.extension(file.mimetype)
    );
  },
});

const uploadtask = multer({
  storage: task,
}).single('attachment');

const announcement_attachment = multer.diskStorage({
  destination: function (req, file, cb) {
    upload_path = path.join(__dirname, '../uploads/announcement');
    cb(null, upload_path);
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + '_' + Date.now() + '.' + mime.extension(file.mimetype)
    );
  },
});

const upload_announcement_attachment = multer({
  storage: announcement_attachment,
}).single('file');

const chatfile = multer.diskStorage({
  destination: function (req, file, cb) {
    upload_path = path.join(__dirname, '../uploads/chatfile/');
    cb(null, upload_path);
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + '_' + Date.now() + '.' + mime.extension(file.mimetype)
    );
  },
});

const uploadchatfile = multer({
  storage: chatfile,
}).single('path');

const docfile = multer.diskStorage({
  destination: function (req, file, cb) {
    upload_path = path.join(__dirname, '../uploads/lettertemplate');
    cb(null, upload_path);
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + '_' + Date.now() + '.' + mime.extension(file.mimetype)
    );
  },
});

const uploaddocfile = multer({
  storage: docfile,
}).single('path');

const employeeDeclaration = multer.diskStorage({
  destination: function (req, file, cb) {
    upload_path = path.join(
      __dirname,
      '../uploads/employee-declaration-attachments'
    );

    cb(null, upload_path);
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + '_' + Date.now() + '.' + mime.extension(file.mimetype)
    );
  },
});

const uploadEmployeeDeclaration = multer({
  storage: employeeDeclaration,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB (adjust as needed)
  },
}).array('attachments', 10);

const employeeRentedResidence = multer.diskStorage({
  destination: function (req, file, cb) {
    upload_path = path.join(__dirname, '../uploads/hra-proof');

    cb(null, upload_path);
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + '_' + Date.now() + '.' + mime.extension(file.mimetype)
    );
  },
});

const uploadEmployeeRentedResidence = multer({
  storage: employeeRentedResidence,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB (adjust as needed)
  },
}).fields([{ name: 'attachment' }, { name: 'ownerAttachment' }]);

const employeeJoiningRequestPhoto = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === 'photo') {
      upload_path = path.join(__dirname, '../uploads/user/photo');
    } else {
      upload_path = path.join(__dirname, '../uploads/user/document');
    }
    cb(null, upload_path);
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + '_' + Date.now() + '.' + mime.extension(file.mimetype)
    );
  },
});

const uploadEmployeeJoiningRequestPhoto = multer({
  storage: employeeJoiningRequestPhoto,
}).fields([
  { name: 'photo', maxCount: 1 },
  { name: 'aadharCardPhoto', maxCount: 1 },
  { name: 'panCardPhoto', maxCount: 1 },
  { name: 'drivingLicensePhoto', maxCount: 1 },
  { name: 'declarationFormPhoto', maxCount: 1 },
  { name: 'bankPassbookPhoto', maxCount: 1 },
  // Add more objects for each unique parameter name
]);
module.exports = {
  uploadEmployeeRentedResidence,
  uploadAssetMaster,
  uploadcompanylogo,
  uploadcompanyNda,
  uploadfile,
  uploaduserphoto,
  uploaduserdocument,
  uploadProductPhoto,
  uploadcompanydocument,
  uploadempsignature,
  uploadletterhead,
  uploademployeeassets,
  uploadLeaveMaster,
  uploadhrtoolkit,
  uploadresignation,
  uploadresignationTask,
  uploaddailyTask,
  uploaduserdegree,
  faceUpload,
  uploadtask,
  upload_announcement_attachment,
  uploadchatfile,
  uploaddocfile,
  uploadEmployeeDeclaration,
  uploadEmployeeJoiningRequestPhoto,
  uploadUserDocument
};
