const express = require("express");
const UserExpenseTransaction = require("../controllers/userExpenseTransaction.controller");
const router = express.Router();

router.post(
  "/v1/getExpenseDataByTransactionByID",
  UserExpenseTransaction.getExpenseDataByTransactionByID
); // save data

module.exports = router;
