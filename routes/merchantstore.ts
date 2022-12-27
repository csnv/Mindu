import { NextFunction, Request, Response, Router } from "express";
import { escape as esc } from "mysql";

import Config from "../config/webserver";
import Auth from "../utils/auth";
import DBConn from "../utils/conn";
import tables from "../config/tables";
import { ResponseMessage } from "../utils/response-message";
import { hasParams } from "../utils/params";

const router = Router();

/**
 * /MerchantStore/load
 * Loads last vending item list on pressing 'import'
 */
router.use('/load', async (req: Request, res: Response, next: NextFunction) => {
    if (!Config.routes.merchantstore) {
        ResponseMessage.sendError(res);
        return;
    }

    // Check required parameters
    const requiredParams = ['AID', 'GID', 'WorldName', 'Type'];

    if (!hasParams("merchantstore-load", req, requiredParams)) {
        ResponseMessage.sendError(res);
        return;
    }

    const accountId = req.body['AID'];
    const charId = req.body['GID'];
    const worldName = req.body['WorldName'];
    const storeType = req.body['Type'];

    let results;

    try {
        results = await DBConn.query(`
            SELECT \`data\`
            FROM \`${tables.merchant_configs}\`
            WHERE (
                \`account_id\` = ${esc(accountId)} AND
                \`char_id\` = ${esc(charId)} AND
                \`world_name\` = ${esc(worldName)} AND
                \`store_type\` = ${esc(storeType)}
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
 * /MerchantStore/save
 * Saves last vending item list
 */
router.use('/save', async (req: Request, res: Response, next: NextFunction) => {
    if (!Config.routes.merchantstore) {
        ResponseMessage.sendError(res);
        return;
    }

    if (!await Auth.isAuth(req)) {
        ResponseMessage.sendError(res);
        return;
    }

    // Check required parameters
    const requiredParams = ['AID', 'GID', 'WorldName', 'Type', 'data'];

    if (!hasParams("merchantstore-save", req, requiredParams)) {
        ResponseMessage.sendError(res);
        return;
    }

    const accountId = req.body['AID'];
    const charId = req.body['GID'];
    const worldName = req.body['WorldName'];
    const storeType = req.body['Type'];
    const paramData = req.body['data'];
    let data;

    try {
        data = {
            Type: 1,
            ...JSON.parse(paramData)
        };
    } catch(error: any) {
        console.error(`merchantstore-save: Malformed data property for account ${accountId}`);
        ResponseMessage.sendError(res);
        return;
    }

    try {
        const escapedAccountId = esc(accountId),
              escapedCharId = esc(charId),
              escapedWorldName = esc(worldName),
              escapedStoreType = esc(storeType),
              escapedData = esc(JSON.stringify(data));
        const query = `
            INSERT INTO \`${tables.merchant_configs}\` (\`account_id\`, \`char_id\`, \`world_name\`, \`store_type\`, \`data\`)
            VALUES (${escapedAccountId}, ${escapedCharId}, ${escapedWorldName}, ${escapedStoreType}, ${escapedData})
            ON DUPLICATE KEY UPDATE
                \`account_id\` = ${escapedAccountId},
                \`char_id\` = ${escapedCharId},
                \`world_name\` = ${escapedWorldName},
                \`store_type\` = ${escapedStoreType},
                \`data\` = ${escapedData}`;
        await DBConn.query(query);
    } catch(error: any) {
        console.error(`merchantstore-save: Error saving info for char_id ${charId}`, error.message);
        ResponseMessage.sendError(res);
        return;
    }

    ResponseMessage.sendJSON(res, data);
});

export default router;
