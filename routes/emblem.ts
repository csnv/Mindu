import { NextFunction, Request, Response, Router } from "express";
import Jimp from "jimp";
import { GifFrame, GifUtil } from "gifwrap";
import { existsSync, mkdirSync } from "fs";
import { writeFile, readFile } from 'fs/promises';
import { escape as esc } from "mysql";

import Auth from "../utils/auth";
import Config from '../config/webserver';
import { ResponseMessage } from "../utils/response-message";
import DBConn from '../utils/conn';
import tables from "../config/tables";
import httpStatus from "../models/httpStatus";

const MAX_EMBLEM_SIZE = 50_000; // Max size, in bytes
const HEIGHT = 24; // Image max height
const WIDTH = 24; // Image max width

const router = Router();

/**
 * /emblem/download
 * Downloads an emblem given a guild ID
 */
router.post('/download', async (req: Request, res: Response, next: NextFunction) => {
    if (!await Auth.isAuth(req)) {
        ResponseMessage.sendError(res);
        return;
    }

    let valid = true;
    const requiredParams = ['GDID', 'WorldName'];

    for (let param of requiredParams) {
        if (!req.body?.[param]) {
            console.warn(`emblem-upload: No property '${param}' found in request.`);
            valid = false;
        }
    }

    if (!valid) {
        ResponseMessage.sendError(res);
        return;
    }

    const guildId = req.body['GDID'];
    const worldName = req.body['WorldName'];

    let results;

    try {
        results = await DBConn.query(`
            SELECT version, file_type
            FROM \`${tables.guild_emblems}\`
            WHERE (guild_id = ${esc(guildId)} AND world_name = ${esc(worldName)})
        `);
    } catch (error: any) {
        console.error(`emblem-download: Error retrieving emblem info for guild_id ${guildId}`, error.message);
        ResponseMessage.sendError(res);
        return;
    }

    if (!results || results.length === 0) {
        ResponseMessage.sendError(res);
        return;
    }
    
    const fileType = results[0].file_type;
    const contentByFileType: {[key: string]: string} = {
        'BMP': 'image/bmp',
        'GIF': 'image/gif'
    };
    const mimeType = contentByFileType[fileType];

    if (!Config.server.worlds.includes(worldName)) {
        console.error(`emblem-download: Wrong worldname request from token ${req.body['AuthToken']}`);
        ResponseMessage.sendError(res);
        return;
    }
    
    if (!mimeType) {
        console.error("emblem-download: Invalid image type stored in DB.");
        ResponseMessage.sendError(res);
        return;
    }
    
    const filePath = `./emblems/${worldName}${guildId}.emblem`;
    let buffer; 
    try {
        buffer = await readFile(filePath);
    } catch(error) {
        console.error(`emblem-download: No image found for ${guildId} in emblems folder.`);
        ResponseMessage.sendError(res, httpStatus.NOT_FOUND);
        return;
    }

    ResponseMessage.sendBinary(res, buffer, mimeType);

});

/**
 * /emblem/upload
 * User uploads a image, given a guild ID and image blob
 * Image must be GIF or BMP
 */
router.post('/upload', async (req: Request, res: Response, next: NextFunction) => {
    if (!await Auth.isAuth(req)) {
        ResponseMessage.sendError(res);
        return;
    }

    if (!await Auth.isGuildMaster(req)) {
        ResponseMessage.sendError(res);
        return;
    }

    // Check required parameters
    let valid = true;
    const requiredParams = ['GDID', 'WorldName', 'ImgType'];

    for (let param of requiredParams) {
        if (!req.body?.[param]) {
            console.warn(`emblem-upload: No property '${param}' found in request.`);
            valid = false;
        }
    }

    const image = (req.files as Express.Multer.File[])?.[0];
    

    if (!image || image.fieldname !== 'Img') {
        console.warn("emblem-upload: No property 'Img' found in request.");
        valid = false;
    }

    if (!valid) {
        ResponseMessage.sendError(res);
        return;
    }
    
    const guildId = req.body['GDID'];
    const worldName = req.body['WorldName'];
    const imageType = req.body['ImgType'];

    if (!Config.server.worlds.includes(worldName)) {
        console.error(`emblem-upload: Wrong worldname request from token ${req.body['AuthToken']}`);
        ResponseMessage.sendError(res);
        return;
    }

    if (['GIF', 'BMP'].indexOf(imageType) === -1) {
        console.error("emblem-upload: Invalid image type.");
        ResponseMessage.sendError(res);
        return;
    }

    if (!await isValidImage(image, imageType)) {
        ResponseMessage.sendError(res);
        return;
    }

    let results;

    try {
        // Retrieve version from DB
        results = await DBConn.query(`
            SELECT version
            FROM \`${tables.guild_emblems}\`
            WHERE (guild_id = ${esc(guildId)} AND world_name = '${esc(worldName)}')
        `);

    } catch (error: any) {
        console.error(`emblem-upload: Error retrieving emblem info for guild_id ${guildId}`, error.message);
        ResponseMessage.sendError(res);
        return;
    }

    const version = results.length > 0 ? ++results[0].version : 1;

    try {
        // Insert or update emblem info
        await DBConn.query(`
            REPLACE INTO \`${tables.guild_emblems}\` (version, file_type, guild_id, world_name)
            VALUES (${esc(version)}, '${esc(imageType)}', ${esc(guildId)}, '${esc(worldName)}')
        `);
    } catch (error: any) {
        console.error(`emblem-upload: Error saving emblem info for guild_id ${guildId}`, error.message);
        ResponseMessage.sendError(res);
        return;
    }

    try {
        if (!existsSync(`./emblems/${worldName}`))
            mkdirSync(`./emblems/${worldName}`, { recursive: true });
        // Finally, save file to storage. Guild id is used as file name because I'm lazy and versions don't matter
        await writeFile(`./emblems/${worldName}${guildId}.emblem`, image.buffer);

    } catch (error: any) {
        console.error(`emblem-upload: Error saving emblem file for guild_id ${guildId}`, error.message);
        ResponseMessage.sendError(res);
        return;
    }
        
    ResponseMessage.sendJSON(res, {
        Type: 1,
        version: version
    });
});

/**
 * Check wether the image type and format is correct
 * @param image Image file
 * @param imageType Image extension as provided by service
 * @returns boolean
 */
const isValidImage = async (image: Express.Multer.File, imageType: string) => {
    const info = await Jimp.create(image.buffer);

    if (['image/bmp', 'image/x-windows-bmp', 'image/gif'].indexOf(info.getMIME()) === -1) {
        console.error("emblem-upload: Invalid image type.");
        return false;
    }

    if (image.size > MAX_EMBLEM_SIZE) {
        console.error('emblem-upload: Emblem size too large.');
        return false;
    }

    if (info.getWidth() !== WIDTH || info.getHeight() !== HEIGHT) {
        console.error('emblem-upload: Invalid BMP image dimensions.');
        return false;
    }

    /* Image format related checks */
    if (imageType === 'GIF') { 
        if (!image.buffer.toString().startsWith("GIF")) {
            console.error('emblem-upload: Invalid image upload with GIF extension.');
            return false;
        }

        if (await isGifTransparent(image.buffer)) {
            console.error('emblem-upload: Image transparency over allowed limit.');
            return false;
        }

    } else if (imageType === 'BMP') {
        if (!image.buffer.toString().startsWith("BM")) {
            console.error('emblem-upload: Invalid image upload with BMP extension.');
            return false;
        }

        // Check compression
        if (image.buffer.readUInt32LE(30) !== 0) {
            console.error('emblem-upload: BMP compression is not supported.');
            return false;
        }
        // Check max colors per pixel supported by client
        if (image.buffer.readUInt16LE(28) === 8 && image.buffer.readUInt32LE(46) > 256) {
            console.error('emblem-upload: BMP colors not supported.');
            return false;
        } 

        if (isBmpTransparent(image.buffer)) {
            console.error('emblem-upload: Image transparency over allowed limit.');
            return false;
        }
    }
    return true;
};

/**
 * Implementation of transparency check for gif images. Based on Hercules
 * @param buffer Image buffer
 * @returns boolean
 */
const isGifTransparent = async (buffer: Buffer): Promise<boolean> => {
    if (Config.server.gif_emblem_transparency_limit === 100) {
        return false;
    }

    const gifData = await GifUtil.read(buffer);
    let frames = gifData.frames.length;

    const total = gifData.frames.reduce((acc: number, frame: GifFrame) => {
        let transparentPixels = 0;
        // Things we gotta do to initialize empty arrays in TS/JS...
        let cache: number[][] = new Array(WIDTH).fill(() => new Array(HEIGHT));
        let pixel: number;

        for (let x = 0; x < WIDTH; x++) {
            for (let y = 0; y < HEIGHT; y++) {
                // Consider previous pixel color when encountering partial frames
                if (x < frame.xOffset || x >= (frame.xOffset + frame.bitmap.width)
                    || y < frame.yOffset || y >= (frame.yOffset + frame.bitmap.height)) {
                        pixel = cache[x][y];
                } else {
                    pixel = frame.getRGBA(x - frame.xOffset, y - frame.yOffset);
                    cache[x][y] = pixel;
                }
                // Gif uses RGBA, FF in alpha for opacity
                if ((pixel & 0xF8F8F800) === -0x7FF0800) {
                    transparentPixels++;
                }
            }
        }

        return acc + transparentPixels;
    }, 0);

    const perc = (total * 100) / (frames * WIDTH * HEIGHT);
    return Config.server.gif_emblem_transparency_limit < perc;
}


/**
 * Implementation of transparency for bmp images. Based on Hercules
 * @param buffer Image buffer
 * @returns boolean
 */
const isBmpTransparent = (buffer: Buffer): boolean => {
    if (Config.server.bmp_emblem_transparency_limit === 100) {
        return false;
    }
    const transparencyThreshold = WIDTH * HEIGHT * Config.server.bmp_emblem_transparency_limit / 100;
    const start = buffer.readInt32LE(10);
    const bitCount = buffer.readUInt16LE(28);
    let pixel: number;
    let foundPixels = 0;

    if (bitCount === 8) { // 8 bits, uses palette
        const paletteCount = buffer.readUint32LE(46) || 256;
        const paletteStart = 54;
        const palettes = buffer.subarray(paletteStart, paletteStart + paletteCount * 4) as Buffer;

        // Check each pixel indexed color in palettes table
        for (let i = start; i < HEIGHT * WIDTH; i++) {
            pixel = buffer.readUint8(i); // Index is 1 byte
            if (pixel >= paletteCount)
                return true;

            const palettePos = pixel * 4; // Palette uses 4 bytes for color representation (ABGR)
            const color = palettes.readUInt32LE(palettePos);
            if ((color & 0x00F8F8F8) === 0x00F800F8) {
                if (++foundPixels >= transparencyThreshold) {
                    return true;
                }
            }
        }
    } else if (bitCount === 24) { // 24 bits
        for (let i = start; i < HEIGHT * WIDTH * 3; i += 3) { // Each pixel info is a 3 byte describing BGR
            pixel = buffer.readUintLE(i, 3);
            if ((pixel & 0xF8F8F8) === 0xF800F8) {
                if (++foundPixels >= transparencyThreshold) {
                    return true;
                }
            }
                
        }
    }
    return false;
}


export default router;