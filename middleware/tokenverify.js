const jwt = require('jsonwebtoken');
const companyMaster = require('../models/companyMaster');
const UserMaster = require('../models/userMaster');
const { roles } = require('../utils/commonVars');
const { roleType, companyAccessType } = require('../utils/dbUtils');
const RoleMaster = require('../models/roleMaster');
const Sequelize = require('sequelize');
const UserRole = require('../models/userRole');

/**
 * Verifies the token received in the header of each request
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns App to proceed with next step in lifecycle of application
 */
async function verifyToken(req, res, next) {
  const bearerHeader = req.headers.authorization;
  if (!bearerHeader)
    return res.status(403).json({ msg: 'Authorization Denied!' });

  const token = bearerHeader.replace('Bearer ', '');
  if (!token && !token.trim())
    return res.status(403).json({ msg: 'Authorization Denied!' });

  try {
    const tokenData = jwt.verify(token, process.env.SECRETKEY);
    const userMasterId = tokenData.token.usermasterid;
    const userDetails = await UserMaster.findOne({
      where: { userMasterID: userMasterId, status: 1 },
      include: [
        { model: companyMaster },
        {
          model: UserRole,
          required: false,
          limit: 1,
          attributes: ['roleMasterID'],
          include: {
            model: RoleMaster,
            attributes: ['roleName', 'roleType', 'companyAccessType'],
          },
        },
      ],
      nest: true,
    });

    if (!userDetails || +userDetails.companyMaster.status !== 1)
      return res.status(403).json({ msg: 'Authorization Denied!' });

    let role = {
      roleType: roleType.COMPANY_WISE,
      companyAccessType: companyAccessType.OWN_PLUS_CHILD_COMPANY,
    };

    if (
      userDetails.toJSON().userRoles.length &&
      userDetails.toJSON().userRoles[0].roleMaster.roleType ==
        roleType.BRANCH_WISE
    ) {
      role.roleType = roleType.BRANCH_WISE;
      role.companyAccessType = companyAccessType.OWN_COMPANY;
    } else if (
      userDetails.toJSON().userRoles.length &&
      userDetails.toJSON().userRoles[0].roleMaster.companyAccessType ==
        companyAccessType.OWN_COMPANY
    ) {
      role.companyAccessType = companyAccessType.OWN_COMPANY;
    }

    req.userDetails = {
      userMasterId,
      userIpAddress: req.headers['x-forwarded-for'],
      companyMasterId: userDetails.companyMaster.companyMasterID,
      accessibleCompanies: [+userDetails.companyMaster.companyMasterID],
      accessibleBranches: [],
      parentCompanyMasterId: userDetails.companyMaster.parentCompanyMasterID,
      role,
    };
    next();
  } catch (err) {
    return res.status(403).json({ msg: 'Authorization Denied!' });
  }
}
module.exports = { verifyToken };
