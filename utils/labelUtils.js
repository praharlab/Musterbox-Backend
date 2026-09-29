// -----------------------  Common --------------------------
// Tenant, branding and endpoint values are read from the environment; see
// .env.example. The previous per-tenant blocks were switched by commenting
// code in and out and have been removed.
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

/**
 * Parses an environment value into a boolean.
 * Environment values are always strings, so a bare "false" would be truthy.
 * @param {string|undefined} value raw environment value
 * @param {boolean} fallback used when the variable is unset or empty
 * @returns {boolean}
 */
const toBool = (value, fallback = false) => {
  if (value === undefined || value === '') return fallback;
  return String(value).trim().toLowerCase() === 'true';
};

const faceApiUrl = process.env.FACE_API_URL;
const mainApiUrl = process.env.APIURL;
const secretTokenForEnc = process.env.SECRETKEYFORENCODING;
const cryptokey = process.env.PASSWORD;

// -----------------------Tenant / branding--------------------------

const ProjectName = process.env.PROJECT_NAME;
const appURL = process.env.APP_URL;
const preboardingAppURL =
  process.env.PREBOARDING_APP_URL || `${appURL}#/user/preboarding/`;
const convertNameToLocalName = toBool(process.env.CONVERT_NAME_TO_LOCAL_NAME);
const pihMobileNo = toBool(process.env.PIH_MOBILE_VALIDATION); // PIH MOBILE VALIDATION
const othernumberLabel = process.env.OTHER_NUMBER_LABEL;
const showPayrollFrequency = toBool(process.env.SHOW_PAYROLL_FREQUENCY);

module.exports = {
  ProjectName,
  faceApiUrl,
  mainApiUrl,
  appURL,
  preboardingAppURL,
  convertNameToLocalName,
  pihMobileNo,
  othernumberLabel,
  showPayrollFrequency,
  secretTokenForEnc,
  cryptokey
};
