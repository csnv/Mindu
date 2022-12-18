import { Response } from "express";
import httpStatus from "../models/httpStatus";

export class ResponseMessage {
    static sendError(res: Response, status?: number) {
        res.status(status || httpStatus.BAD_REQUEST);
        res.contentType("text/plain");
        res.send("Error");
    }

    static sendJSON(res: Response, data: any) {
        res.status(httpStatus.OK);
        res.contentType("application/json");
        res.send(JSON.stringify(data));
    }

    static sendBinary(res: Response, data: Buffer, contentType: string) {
        res.status(httpStatus.OK);
        res.contentType(contentType);
        res.end(data);
    }
}