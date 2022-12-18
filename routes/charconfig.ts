import { NextFunction, Request, Response, Router } from "express";
import httpStatus from "../models/httpStatus";

const router = Router();

router.post('/load', (req: Request, res: Response, next: NextFunction) => {
    res.status(httpStatus.BAD_REQUEST);
    res.contentType("text/plain");
    res.send("Error");
});

router.post('/save', (req: Request, res: Response, next: NextFunction) => {

});

export default router;