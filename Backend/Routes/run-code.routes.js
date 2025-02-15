import express from 'express';
import { executeCode } from '../controllers/run-code.controller.js';

const router = express.Router();

router.post('/execute', executeCode);

export default router;