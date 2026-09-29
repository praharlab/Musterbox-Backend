const fs = require("fs");
const path = require("path");

function base64Topng(dataUrl, fileNameWithExtension, filePath) {
  const base64String = dataUrl.split(",")[1];
  const base64Data = Buffer.from(base64String, "base64");
  const saveFile = path.join(filePath, fileNameWithExtension);

  fs.writeFile(saveFile, base64Data, (err) => {
    if (err) {
      console.error("Error writing file:", err);
    } else {
    }
  });
}

function attendancePhotobase64Topng(dataUrl, fileNameWithExtension, filePath) {
  const base64String = dataUrl.split(",")[1];
  const base64Data = Buffer.from(base64String, "base64");
  const saveFile = path.join(__dirname, "../", filePath, fileNameWithExtension);

  const filepath = path.join(__dirname, "../", filePath);

  // Create folder if it doesn't exist
  if (!fs.existsSync(filepath)) {
    fs.mkdirSync(filepath, { recursive: true });
  }

  fs.writeFile(saveFile, base64Data, (err) => {
    if (err) {
      console.error("Error writing file:", err);
      throw err;
    }
  });
}

function fileToBase64(filePathWithFileName) {
  const saveFile = path.join(__dirname, "../", filePathWithFileName);

  if (fs.existsSync(saveFile)) {
    try {
      // Read the image file synchronously
      const image = fs.readFileSync(saveFile);
      // Convert image buffer to base64
      return `${image.toString("base64")}`;
    } catch (err) {
      console.error("Error reading image file:", err);
      return null;
    }
  } else {
    console.error(`File not found: ${saveFile}`);
    return null;
  }
}

module.exports = { base64Topng, attendancePhotobase64Topng, fileToBase64 };
