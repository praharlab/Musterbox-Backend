const { usermessage } = require('../response_message/message');
const { executeQuery } = require('./common.controller');
const procedures = [
  {
    title: 'getUsers',
    definition: `DROP VIEW userlist;
        CREATE OR REPLACE VIEW userlist as SELECT "firstName", "lastName" from public."userMasters";`,
  },
  // {
  //   title: 'getCompanies',
  //   definition: `DROP VIEW companylist;
  //       CREATE OR REPLACE VIEW companylist as SELECT "companyName" from public."companyMasters";`,
  // },
];

exports.createProcedures = async (req, res, next) => {
  try {
    let result;
    for (const p of procedures) {
      result = await executeQuery(p.definition);
      console.log(result);
    }
    res
      .status(200)
      .json({ status: 200, message: usermessage.procedurecreated });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};
