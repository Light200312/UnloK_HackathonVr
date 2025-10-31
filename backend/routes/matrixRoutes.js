import express from 'express';
import {
  createMatrices,
  getUserMatrices,
  updateMatrixValue,
  addCustomMetric,AddCustomMatrixToGeneral,getGeneralMatrix,deleteMatrix
} from '../controllers/matrixController.js';

const router = express.Router();

router.post('/create', createMatrices);
router.get('/:userId', getGeneralMatrix);
router.put('/update', updateMatrixValue);
router.post('/add-custom', addCustomMetric);
router.post("/add-to-general",AddCustomMatrixToGeneral)
router.delete("/matrix-delete",deleteMatrix)
export default router;
