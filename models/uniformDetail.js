const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const UserMaster = require('./userMaster');
const table_name = 'uniformDetail';

const UniformDetail = sequelize.define(
  table_name,
  {
    uniformDetailID: {
      type: Sequelize.BIGINT,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    shirtSize: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    pantSize: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    shoeSize: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    status: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    createBy: {
      type: Sequelize.INTEGER,
    },
    updateBy: {
      type: Sequelize.INTEGER,
    },
    deleteBy: {
      type: Sequelize.INTEGER,
    },
    createByIp: {
      type: Sequelize.STRING,
    },
    updateByIp: {
      type: Sequelize.STRING,
    },
    deleteByIp: {
      type: Sequelize.STRING,
    },
  },
  { paranoid: true }
);

UniformDetail.addHook('beforeCreate', (uniformDetail, options) => {
  // Set createBy, updateBy, and ipAddress based on the authenticated user
  uniformDetail.createBy = options.user.userMasterId;
  uniformDetail.updateBy = options.user.userMasterId;
  uniformDetail.createByIp = options.user.userIpAddress;
  uniformDetail.updateByIp = options.user.userIpAddress;
});

UniformDetail.addHook('beforeUpdate', (uniformDetail, options) => {
  // Set updateBy and ipAddress based on the authenticated user
  uniformDetail.updateBy = options.user.userMasterId;
  uniformDetail.ipAddress = options.user.userIpAddress;
  uniformDetail.updateByIp = options.user.userIpAddress;
});

UniformDetail.addHook('beforeDestroy', (uniformDetail, options) => {
  // Set deleteBy and ipAddress based on the authenticated user
  uniformDetail.deleteBy = options.user.userMasterId;
  uniformDetail.deleteByIp = options.user.userIpAddress;
});
UniformDetail.belongsTo(UserMaster, { foreignKey: { name: 'userMasterID' } });

UniformDetail.belongsTo(UserMaster,{
  as: 'createdByUserDetails',
  foreignKey: {name: 'createBy'}
});


UniformDetail.belongsTo(UserMaster,{
  as: 'updatedByUserDetails',
  foreignKey: {name: 'updateBy'}
});


UniformDetail.belongsTo(UserMaster,{
  as: 'deletedByUserDetails',
  foreignKey: {name: 'deleteBy'}
});

module.exports = UniformDetail;
