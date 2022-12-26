import { Request } from "express";

/**
 * Check if request contains parameters
 * @param origin Controller/function of origin
 * @param req NodeJS Request
 * @param params Array of parameters to check
 * @returns Request contains parameters
 */
export function hasParams(origin: string, req: Request, params: string[]): boolean {
    let valid = true;
    for (let param of params) {
        if (!req.body?.[param]) {
            console.warn(`${origin}: No property '${param}' found in request.`);
            valid = false;
        }
    }
    return valid;
}