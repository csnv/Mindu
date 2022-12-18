import { NextFunction, Request, Response, Router } from "express";
import httpStatus from "../models/httpStatus";

const router = Router();

router.post('/load', (req: Request, res: Response, next: NextFunction) => {
});

router.use('/save', (req: Request, res: Response, next: NextFunction) => {

});

export default router;