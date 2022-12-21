import mysql, { escape } from 'mysql';

import Config from '../config/webserver';

/**
 * Database Connection Singleton
 */
class DBConnection {
    pool!: mysql.Pool;

    /**
     * Create pool with config settings
     */
    constructor() {
        this.pool = mysql.createPool({
            host: Config.db.ip,
            user: Config.db.user,
            port: Config.db.port,
            password: Config.db.password,
            database: Config.db.database
        });

        this.pool.getConnection((err: Error, connection: mysql.Connection) => {
            if (err) {
                console.error(err.message);
                process.exit();
            }
        });
    }

    /**
     * Query database with the given string. Async version.
     * @param query Database query string
     * @returns Promise. Query results
     */
    query(query: string): Promise<any> {
        return new Promise((resolve: Function, reject: Function) => {
            this.pool.query(query, (error, results, fields) => {
                if (error) {
                    reject(error);
                    return;
                }
                
                resolve(results);
            });
        });
    }
}

export default new DBConnection();