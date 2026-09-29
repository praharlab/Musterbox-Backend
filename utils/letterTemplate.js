const companyMaster = require('../models/companyMaster');
const Handlebars = require('handlebars');
const path = require('path');
const fs = require('fs');
const base64Img = require("base64-img");
const getTemplate = (type) => {
  const file = path.join(__dirname, `../html/${type}.html`);
  return file;
};

const readFile = (name) => {
  return new Promise((resolve, reject) => {
    fs.readFile(name, 'utf-8', (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};
const getLetterHeadHTML = async (companyMasterID) => {
  try {
    const companyDetails = await companyMaster.findOne({
      raw: true,
      where: {
        companyMasterID,
      },
    });

    companyDetails.companyName = companyDetails.companyName
      ? companyDetails.companyName
      : '';
    companyDetails.companyAddress = companyDetails.companyAddress
      ? companyDetails.companyAddress
      : '';
    companyDetails.companyEmail = companyDetails.companyEmail
      ? companyDetails.companyEmail
      : '';
    companyDetails.companyLogo = companyDetails.companyLogo
      ? companyDetails.companyLogo
      : '';
    companyDetails.cpMobileNo = companyDetails.cpMobileNo
      ? companyDetails.cpMobileNo
      : '';
    companyDetails.companyWebsite = companyDetails.companyWebsite
      ? companyDetails.companyWebsite
      : '';

    if (companyDetails.companyWebsite) {
      companyDetails.companyWebsite = companyDetails.companyWebsite;
    } else {
      companyDetails.companyWebsite = '';
    }
    const imagePath = path.join(
      __dirname,
      `../uploads/company/logo/${companyDetails.companyLogo}`
    );
    let base64 = '';
    base64Img.base64(imagePath, async (err, data) => {
      if (err) {
        console.error('Error:', err);
      } else {
        base64 = data;
      }

      const filePath = await getTemplate('preboardingLetterHead');
      companyDetails.base64 = base64;
      const file = await readFile(filePath);
      const template = Handlebars.compile(file);
      return template(companyDetails);
    });
  } catch (error) {
    throw new Error('Error in Get Letter HTML Data ' + error.message);
  }
};

module.exports = {
  getTemplate,
  readFile,
  getLetterHeadHTML,
};
