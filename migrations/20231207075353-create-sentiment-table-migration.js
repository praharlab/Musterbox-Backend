'use strict';

const { SentimentMoodEnum } = require('../utils/dbUtils');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('sentimentPunchIns', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      mood: {
        type: Sequelize.ENUM(...Object.values(SentimentMoodEnum)),
        allowNull: false,
      },
      userMasterId: {
        type: Sequelize.INTEGER,
      },
      createByIp: {
        type: Sequelize.STRING,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      deletedAt: {
        type: Sequelize.DATE,
      },
    });

    // Add foreign key constraints if needed
    await queryInterface.addConstraint('sentimentPunchIns', {
      fields: ['userMasterId'],
      type: 'foreign key',
      name: 'fk_sentimentPunchIns_userMasterId',
      references: {
        table: 'userMasters',
        field: 'userMasterID',
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('sentimentPunchIns');
  },
};
