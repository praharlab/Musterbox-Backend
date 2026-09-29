const jwt = require("jsonwebtoken");
const companyMaster = require("../models/companyMaster");
const UserMaster = require("../models/userMaster");
const { roleType, companyAccessType } = require("../utils/dbUtils");
const RoleMaster = require("../models/roleMaster");
const Sequelize = require("sequelize");
const { fetchChildCompanies } = require("../utils/commonQueries");
const RoleMasterBranchWise = require("../models/roleMasterBranchWise");
const BranchMaster = require("../models/branchMaster");
const EmployeeBranch = require("../models/employeeBranch");
const UserRole = require("../models/userRole");

/**
 * Verifies the token received in the header of each request
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns App to proceed with next step in lifecycle of application
 */
function checkHasAccess(id1, id2) {
  const idArray = Array.isArray(id2) ? id2 : [id2];
  const hasAccess = idArray.every((companyId) => id1.includes(+companyId));
  return hasAccess;
}

async function permissionAccess(req, res, next) {
  try {
    const userMasterId = req.userDetails.userMasterId;
    let userDetails = await UserMaster.findOne({
      where: { userMasterID: userMasterId, status: 1 },
      include: [
        { model: companyMaster },
        {
          model: UserRole,
          attributes: ["roleMasterID"],
          include: {
            model: RoleMaster,
            attributes: [
              "roleMasterID",
              "roleName",
              "roleType",
              "companyAccessType",
            ],
            include: {
              model: RoleMasterBranchWise,
              attributes: ["branchMasterID", "roleMasterBranchWiseID"],
              separate: true,
            },
          },
        },
      ],
    });

    userDetails = userDetails.toJSON();

    if (
      userDetails &&
      (userDetails.admin == 2 ||
        userDetails.admin == 3 ||
        userDetails.admin == 4)
    ) {
      next();
      return;
    }

    const role = {
      roleType: roleType.COMPANY_WISE,
      companyAccessType: companyAccessType.OWN_PLUS_CHILD_COMPANY,
    };

    if (
      userDetails.userRoles.length &&
      userDetails.userRoles[0].roleMaster.roleType == roleType.BRANCH_WISE
    ) {
      role.roleType = roleType.BRANCH_WISE;
      role.companyAccessType = companyAccessType.OWN_COMPANY;
    } else if (
      userDetails.userRoles.length &&
      userDetails.userRoles[0].roleMaster.companyAccessType ==
        companyAccessType.OWN_COMPANY
    ) {
      role.companyAccessType = companyAccessType.OWN_COMPANY;
    }

    let accessibleCompanies = [];
    let accessibleBranches = [];
    let accessibleUsers = [];

    if (role.companyAccessType == companyAccessType.OWN_PLUS_CHILD_COMPANY)
      accessibleCompanies = await fetchChildCompanies(
        req.userDetails.companyMasterId
      );
    accessibleCompanies.push(+req.userDetails.companyMasterId);

    if (role.roleType == roleType.BRANCH_WISE) {
      if (
        userDetails.userRoles &&
        userDetails.userRoles.length &&
        userDetails.userRoles[0].roleMaster.roleMasterBranchWises &&
        userDetails.userRoles[0].roleMaster.roleMasterBranchWises.length
      )
        accessibleBranches.push(
          ...userDetails.userRoles[0].roleMaster.roleMasterBranchWises.map(
            (item) => item.branchMasterID
          )
        );

      const allUsers = await UserMaster.findAll({
        where: { companyMasterId: accessibleCompanies, status: [1, 0] },
        attributes: ["userMasterID"],
        include: [
          {
            model: EmployeeBranch,
            where: {
              status: 1,
              branchID: accessibleBranches,
              applicableDate: { [Sequelize.Op.lte]: new Date() },
              [Sequelize.Op.or]: [
                { endDate: { [Sequelize.Op.gte]: new Date() } },
                { endDate: { [Sequelize.Op.eq]: null } },
              ],
            },
            required: true,
            attributes: ["branchID"],
          },
        ],
      });
      accessibleUsers.push(...allUsers.map((item) => item.userMasterID));
    } else {
      const allBranches = await BranchMaster.findAll({
        where: { companyMasterID: accessibleCompanies, status: [0, 1] },
        attributes: ["branchMasterID"],
      });
      accessibleBranches.push(
        ...allBranches.map((item) => item.branchMasterID)
      );

      const allUsers = await UserMaster.findAll({
        where: { companyMasterId: accessibleCompanies, status: [0, 1] },
        attributes: ["userMasterID"],
        order: [["userMasterID", "DESC"]],
      });
      accessibleUsers.push(...allUsers.map((item) => item.userMasterID));
    }

    req.userDetails.accessibleCompanies = accessibleCompanies;
    if (role.roleType == roleType.BRANCH_WISE)
      req.userDetails.accessibleBranches = accessibleBranches;
    else req.userDetails.accessibleBranches = [];

    //Compare request companyMasterID with accessible IDs
    const companyMasterID =
      req.body.companyMasterID ||
      req.query.companyMasterID ||
      req.params.companyMasterID;
    if (
      companyMasterID &&
      !checkHasAccess(accessibleCompanies, companyMasterID)
    )
      return res.status(403).json({ msg: "Authorization Denied!" });

    //Compare request branchMasterID with accessible IDs
    const branchMasterID =
      req.body.branchMasterID ||
      req.query.branchMasterID ||
      req.params.branchMasterID;
    if (branchMasterID && !checkHasAccess(accessibleBranches, branchMasterID))
      return res.status(403).json({ msg: "Authorization Denied!" });

    //Compare request userMasterID with accessible IDs
    const userMasterID =
      req.body.userMasterID ||
      req.query.userMasterID ||
      req.params.userMasterID;
    if (userMasterID && !checkHasAccess(accessibleUsers, userMasterID)) {
      const checkTokenUser = Array.isArray(userMasterID)
        ? userMasterID
        : [userMasterID];
      if (checkTokenUser.length !== 1 || +checkTokenUser[0] !== +userMasterId) {
        return res.status(403).json({ msg: "Authorization Denied!" });
      }
    }

    next();
  } catch (err) {
    return res.status(403).json({ msg: "Authorization Denied!" });
  }
}
module.exports = { permissionAccess };
