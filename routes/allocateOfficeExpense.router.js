const express = require('express');
const allocateOfficeExpenseController = require('../controllers/allocateOfficeExpense.controller');
const router = express.Router();

router.post('/v1/addOfficeExpenseAllocationRights', allocateOfficeExpenseController.addOfficeExpenseAllocationRights);
router.post('/v1/getAllOfficeExpenseAllocationRights', allocateOfficeExpenseController.getAllOfficeExpenseAllocationRights);
router.put('/v1/updateOfficeExpenseAllocationRights', allocateOfficeExpenseController.updateOfficeExpenseAllocationRights);
router.delete('/v1/deleteOfficeExpenseAllocationRights/:id', allocateOfficeExpenseController.deleteOfficeExpenseAllocationRights);
router.get('/v1/getOfficeExpenseAllocationRightsByID/:id', allocateOfficeExpenseController.getOfficeExpenseAllocationRightsByID);
router.post('/v1/getAllAssignedBranchByUser', allocateOfficeExpenseController.getAllAssignedBranchByUser);
router.post('/v1/getAllAssignedSiteByUser', allocateOfficeExpenseController.getAllAssignedSiteByUser);
router.post('/v1/getAssignedUsersByBranchAndSite', allocateOfficeExpenseController.getAssignedUsersByBranchAndSite);

module.exports = router;