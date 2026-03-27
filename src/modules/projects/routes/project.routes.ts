import { Router } from 'express';
import { createProject } from '../controllers/project.controller.js';

const router = Router();

// POST /api/v1/projects - Create a new project
router.post('/', createProject);

export default router;
