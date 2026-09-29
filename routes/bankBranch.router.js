const express = require("express");
const BankBranchController = require("../controllers/bankBranch.controller");
const router = express.Router();

router.post("/v1/addbankBranch", BankBranchController.addbankBranch); // save data

router.post("/v1/listBankBranch", BankBranchController.listBankBranch);

router.get("/v1/getBankBranchByID", BankBranchController.getBankBranchByID);

router.post("/v1/editBankBranch", BankBranchController.editBankBranch);

router.post("/v1/deleteBankBranch", BankBranchController.deleteBankBranch);

router.post("/v1/statusChangeBankBranch", BankBranchController.statusChangeBankBranch);

module.exports = router;
