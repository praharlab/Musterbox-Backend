const jwt = require('jsonwebtoken');
const companyMaster = require('../models/companyMaster');
const UserMaster = require('../models/userMaster');

/**
 * Verifies the token received in the socket query
 * @returns App to proceed with next step in lifecycle of application
 */
async function verifyAuthForSocket(socket, next) {
  if (socket.handshake.query && socket.handshake.query.Authorization) {
    const token = socket.handshake.query.Authorization.replace('Bearer ', '');
    if (!token && !token.trim()) return next(new Error('Authentication error'));
    try {
      const tokenData = jwt.verify(token, process.env.SECRETKEY);
      const userMasterId = tokenData.token.usermasterid;
      const userDetails = await UserMaster.findOne({
        where: { userMasterID: userMasterId, status: 1 },
        include: companyMaster,
        nest: true,
      });
      if (!userDetails || +userDetails.companyMaster.status !== 1)
        return next(new Error('Authentication error'));
      socket.userDetails = {
        userMasterId,
        userName: userDetails.displayName,
        companyMasterId: userDetails.companyMaster.companyMasterID,
        parentCompanyMasterId: userDetails.companyMaster.parentCompanyMasterID,
      };
      return next();
    } catch (error) {
      return next(error);
    }
  } else {
    next(new Error('Authentication error'));
  }
}

module.exports = { verifyAuthForSocket };
