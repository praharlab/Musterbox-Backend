const { attendancePhotobase64Topng } = require("../utils/base64Topng");

exports.tpMirrorConvertImage = async (req, res, next) => {
  try {
    // Extracting data from request body
    const { dataUrl, fileName, filePath } = req.body;

    attendancePhotobase64Topng(dataUrl, fileName, filePath);
    return res.status(200).json({
      status: 200,
    });
  } catch (err) {
    next(err);
  }
};
