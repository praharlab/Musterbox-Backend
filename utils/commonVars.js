const userAttributes = [
  "userMasterID",
  "firstName",
  "middleName",
  "lastName",
  "displayName",
  "companyMasterId",
  "email",
  "userNumber",
  "photo",
  "firebaseToken",
  "deviceType",
];

const companyAttributes = [
  "companyMasterID",
  "companyName",
  "companyLogo",
  "companyWebsite",
  "fileUploadType",
];

const statusCodes = {
  OK: 200,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  INTERNAL_SERVER: 500,
};

const roles = {
  ADMIN: "admin",
  USER: "user",
};

const emailTemplates = {
  EMAIL_VERIFICATION: "Activate-account.html",
  FORGOT_PASSWORD: "Forgot-password.html",
};

const reqObjectType = {
  BODY: "body",
  PARAMS: "params",
  QUERY: "query",
};

const reviewFormAssignTo = {
  REVIEWER: "reviewer",
  REVIEWEE: "reviewee",
};

module.exports = {
  userAttributes,
  companyAttributes,
  statusCodes,
  roles,
  emailTemplates,
  reqObjectType,
  reviewFormAssignTo,
};
