import { Response } from "express";
import httpStatus from "../models/httpStatus";

export class ResponseMessage {
    /**
     * Reply to request with an error
     * @param res Express response object
     * @param status HTTP status code
     */
    static sendError(res: Response, status?: number) {
        res.status(status || httpStatus.BAD_REQUEST);
        res.contentType("text/plain");
        res.send("Error");
    }

    /**
     * Reply to service request with JSON data
     * @param res Express response object
     * @param data JSON compatible data
     */
    static sendJSON(res: Response, data: any) {
        res.status(httpStatus.OK);
        res.contentType("application/json");
        res.send(JSON.stringify(data));
    }

    /**
     * Reply to service request with binary data
     * @param res Express response object
     * @param data Data in binary format
     * @param contentType Type of data
     */
    static sendBinary(res: Response, data: Buffer, contentType: string) {
        res.status(httpStatus.OK);
        res.contentType(contentType);
        res.end(data);
    }
}