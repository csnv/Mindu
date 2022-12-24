import DBConn from './conn'
import tables from '../config/tables';

/**
 * Automatically create required tables on startup, if required
 */
export class DatabaseMigration {
    /**
     * Startup initialization
     */
    static init() {
        this.createGuildEmblemsTable();
        this.createUserConfigsTable();
        this.createCharConfigsTable();
        this.createMerchantConfigsTable();
    }

    /**
     * Attempts to create emblems table
     */
    static async createGuildEmblemsTable() {
        try {
            await DBConn.query(`
            CREATE TABLE IF NOT EXISTS \`${tables.guild_emblems}\` (
                world_name varchar(32) NOT NULL,
                guild_id int(11) unsigned NOT NULL,
                file_type varchar(255) NOT NULL,
                version int(11) unsigned NOT NULL default '0',
            PRIMARY KEY (world_name, guild_id)
            ) ENGINE=MyISAM;
            `);
        } catch (e: any) {
            console.error("Error creating guild emblem table.", e.message);
            process.exit();
        }
    }

    /**
     * Attempts to create user related config table
     */
    static async createUserConfigsTable() {
        try {
            await DBConn.query(`
            CREATE TABLE IF NOT EXISTS \`${tables.user_configs}\` (
                world_name varchar(32) NOT NULL,
                account_id int(11) unsigned NOT NULL,
                data longtext NOT NULL,
                PRIMARY KEY (world_name, account_id)
            ) ENGINE=MyISAM;
            `);
        } catch (e: any) {
            console.error("Error creating user configs table.", e.message);
            process.exit();
        }
    }

    /**
     * Attempts to create character related config table
     */
    static async createCharConfigsTable() {
        try {
            await DBConn.query(`
            CREATE TABLE IF NOT EXISTS \`${tables.char_configs}\` (
                world_name varchar(32) NOT NULL,
                account_id int(11) unsigned NOT NULL,
                char_id int(11) unsigned NOT NULL,
                data longtext NOT NULL,
                PRIMARY KEY (world_name, account_id, char_id)
            ) ENGINE=MyISAM;
            `);
        } catch (e: any) {
            console.error("Error creating char configs table.", e.message);
            process.exit();
        }
    }

    /**
     * Attempts to create merchant store table
     */
    static async createMerchantConfigsTable() {
        try {
            await DBConn.query(`
            CREATE TABLE IF NOT EXISTS \`${tables.merchant_configs}\` (
                world_name varchar(32) NOT NULL,
                account_id int(11) unsigned NOT NULL,
                char_id INT(11) UNSIGNED NOT NULL,
                store_type tinyint(3) UNSIGNED NOT NULL DEFAULT 0,
                data longtext NOT NULL,
                PRIMARY KEY (world_name, account_id, char_id)
            ) ENGINE=MyISAM;
            `);
        } catch (e: any) {
            console.error("Error creating merchant configs table.", e.message);
            process.exit();
        }
    }
}