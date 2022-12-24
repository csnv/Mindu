import { NextFunction, Request, Response, Router } from "express";
import { escape as esc } from "mysql";

import Auth from "../utils/auth";
import { ResponseMessage } from "../utils/response-message";
import DBConn from "../utils/conn";
import tables from "../config/tables";
import { hasParams } from "../utils/params";

const router = Router();

/**
 * /userconfig/load
 * Downloads user account's settings
 */
router.post('/load', async (req: Request, res: Response, next: NextFunction) => {
    const requiredParams = ['AID', 'WorldName'];

    if (!hasParams(req, requiredParams)) {
        ResponseMessage.sendError(res);
        return;
    }

    const accountId = req.body['AID'];
    const worldName = req.body['WorldName'];

    let results;

    try {
        results = await DBConn.query(`
            SELECT \`data\`
            FROM \`${tables.user_configs}\`
            WHERE (\`account_id\` = ${esc(accountId)} AND \`world_name\` = ${esc(worldName)})
            LIMIT 1
        `);
    } catch (error: any) {
        console.error(`userconfig-load: Error retrieving data for account id ${accountId}`, error.message);
        ResponseMessage.sendError(res);
        return;
    }

    const data = results.length > 0 ? results[0].data : "";
    const parsedData = JSON.parse(data);

    const response = {
        Type: 1,
        ...parsedData // Will be empty if there's no registry
    };

    ResponseMessage.sendJSON(res, response);
});


/**
 * /userconfig/save
 * Saves user account's settings in JSON format
 */
router.use('/save', async (req: Request, res: Response, next: NextFunction) => {
    if (!await Auth.isAuth(req)) {
        ResponseMessage.sendError(res);
        return;
    }

    // Check required parameters
    const requiredParams = ['AID', 'WorldName', 'data'];

    if (!hasParams(req, requiredParams)) {
        ResponseMessage.sendError(res);
        return;
    }

    const accountId = req.body['AID'];
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
        return;
    }

    try {
        const escapedAccountId = esc(accountId);
        const escapedWorldName = esc(worldName);
        const escapedData = esc(JSON.stringify(data));
        const query = `
            INSERT INTO \`${tables.user_configs}\` (\`account_id\`, \`world_name\`, \`data\`)
            VALUES (${escapedAccountId}, ${escapedWorldName}, ${escapedData})
            ON DUPLICATE KEY UPDATE \`account_id\` = ${escapedAccountId}, \`world_name\` = ${escapedWorldName}, \`data\` = ${escapedData}`;
        await DBConn.query(query);
    } catch(error: any) {
        console.error(`charconfig-save: Error saving info for account_id ${accountId}`, error.message);
        ResponseMessage.sendError(res);
        return;
    }

    ResponseMessage.sendJSON(res, data);
});

export default router;