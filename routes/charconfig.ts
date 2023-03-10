import { NextFunction, Request, Response, Router } from "express";
import { escape as esc } from "mysql";

import Auth from "../utils/auth";
import { ResponseMessage } from "../utils/response-message";
import DBConn from "../utils/conn";
import tables from "../config/tables";
import { hasParams } from "../utils/params";
import Config from "../config/webserver";

const router = Router();

/**
 * /charconfig/load
 * Downloads character's settings
 */
router.post('/load', async (req: Request, res: Response, next: NextFunction) => {
    if (!Config.routes.charconfig) {
        ResponseMessage.sendError(res);
        return;
    }

    const requiredParams = ['AID', 'GID', 'WorldName'];

    if (!hasParams("charconfig-load", req, requiredParams)) {
        ResponseMessage.sendError(res);
        return;
    }

    const accountId = req.body['AID'];
    const charId = req.body['GID'];
    const worldName = req.body['WorldName'];

    let results;

    try {
        results = await DBConn.query(`
            SELECT \`data\`
            FROM \`${tables.char_configs}\`
            WHERE (
                \`account_id\` = ${esc(accountId)} AND
                \`char_id\` = ${esc(charId)} AND
                \`world_name\` = ${esc(worldName)}
            )
            LIMIT 1
        `);
    } catch (error: any) {
        console.error(`userconfig-load: Error retrieving data for account id ${accountId}`, error.message);
        ResponseMessage.sendError(res);
        return;
    }

    const data = results.length > 0 ? JSON.parse(results[0].data) : {};

    const response = {
        Type: 1,
        ...data // Will be empty if there's no registry
    };

    ResponseMessage.sendJSON(res, response);
});

/**
 * /charconfig/save
 * Saves character settings in JSON format
 */
router.post('/save', async (req: Request, res: Response, next: NextFunction) => {
    if (!Config.routes.charconfig) {
        ResponseMessage.sendError(res);
        return;
    }

    if (!await Auth.isAuth(req)) {
        ResponseMessage.sendError(res);
        return;
    }

    // Check required parameters
    const requiredParams = ['AID', 'GID', 'WorldName', 'data'];

    if (!hasParams("charconfig-save", req, requiredParams)) {
        ResponseMessage.sendError(res);
        return;
    }

    const accountId = req.body['AID'];
    const charId = req.body['GID'];
    const worldName = req.body['WorldName'];
    const paramData = req.body['data'];
    let data;

    try {
        data = {
            Type: 1,
            ...JSON.parse(paramData)
        };
    } catch(error: any) {
        console.error(`charconfig-save: Malformed data property for account ${accountId}`);
        ResponseMessage.sendError(res);
        return;
    }

    try {
        const escapedAccountId = esc(accountId),
              escapedCharId = esc(charId),
              escapedWorldName = esc(worldName),
              escapedData = esc(JSON.stringify(data));
        const query = `
            INSERT INTO \`${tables.char_configs}\` (\`account_id\`, \`char_id\`, \`world_name\`, \`data\`)
            VALUES (${escapedAccountId}, ${escapedCharId}, ${escapedWorldName}, ${escapedData})
            ON DUPLICATE KEY UPDATE \`account_id\` = ${escapedAccountId},  \`char_id\` = ${escapedCharId}, \`world_name\` = ${escapedWorldName}, \`data\` = ${escapedData}`;
        await DBConn.query(query);
    } catch(error: any) {
        console.error(`charconfig-save: Error saving info for char_id ${charId}`, error.message);
        ResponseMessage.sendError(res);
        return;
    }

    ResponseMessage.sendJSON(res, data);
});

export default router;