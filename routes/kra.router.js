const express = require('express');
const KRAController = require('../controllers/kra.controller');
const { verifyChildParent } = require('../middleware/verifyChildParent');
const { reqObjectType } = require('../utils/commonVars');
const { validateSchema } = require('../middleware/validateSchema');
const {
  createKraSchema,
  listKraSchema,
  updateKraSchema,
} = require('../validators/kra');

const router = express.Router();
router.post(
  '/v1',
  validateSchema(createKraSchema, reqObjectType.BODY),
  verifyChildParent,
  KRAController.createKRA
);
router.put(
  '/v1/:id',
  validateSchema(updateKraSchema),
  verifyChildParent,
  KRAController.updateKRA
);
router.get('/v1/:id', verifyChildParent, KRAController.getKRADetails);
router.get(
  '/v1',
  validateSchema(listKraSchema, reqObjectType.QUERY),
  verifyChildParent,
  KRAController.listKRA
);
router.delete('/v1/:id', verifyChildParent, KRAController.deleteKRA);

module.exports = router;
