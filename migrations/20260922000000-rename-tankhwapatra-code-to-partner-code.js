'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.renameColumn(
      'sn_codes',
      'tankhwaPatra_code',
      'partner_code'
    );
  },

  async down(queryInterface) {
    await queryInterface.renameColumn(
      'sn_codes',
      'partner_code',
      'tankhwaPatra_code'
    );
  },
};
