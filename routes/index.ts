import { Router } from "express";

import emblem from './emblem';
import userconfig from './userconfig';
import charconfig from './charconfig';
import merchantstore from './merchandstore';

const router = Router();

router.use('/emblem', emblem);
router.use('/userconfig', userconfig);
router.use('/charconfig', charconfig);
router.use('/MerchantStore', merchantstore);

export default router;