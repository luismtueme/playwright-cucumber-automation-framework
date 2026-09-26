/**
 * MySQL client for database assertions, backed by a connection pool.
 *
 * Connection settings come from config.db (DB_HOST, DB_PORT, DB_USER, DB_PASSWORD,
 * DB_NAME). Always use parameterized queries: pass values in `params`, never
 * interpolate them into the SQL string.
 *
 * @example
 * const db = new DbClient(config.db);
 * const item = await db.one('SELECT * FROM items WHERE id = ?', [id]);
 * await db.close();
 */
const mysql = require('mysql2/promise');
const { createLogger } = require('./logger');

const log = createLogger('db');

/** @typedef {Record<string, any>} Row */
/** @typedef {import('mysql2').ResultSetHeader} WriteResult insertId, affectedRows, ... */
/** @typedef {string | number | boolean | Date | null} Param */

class DbClient {
    /** @param {import('../config').DbConfig | null | undefined} dbConfig */
    constructor(dbConfig) {
        if (!dbConfig) {
            throw new Error('Database is not configured. Set DB_HOST, DB_USER, DB_PASSWORD and DB_NAME.');
        }
        this.pool = mysql.createPool({ ...dbConfig, connectionLimit: 5, waitForConnections: true });
    }

    /**
     * Runs a SELECT and returns all rows.
     * @param {string} sql
     * @param {Param[]} [params]
     * @returns {Promise<Row[]>}
     */
    async query(sql, params = []) {
        log.debug(`${sql} ${JSON.stringify(params)}`);
        const [rows] = await this.pool.execute(sql, params);
        return /** @type {Row[]} */ (rows);
    }

    /**
     * Runs INSERT, UPDATE, DELETE or DDL and returns the result header.
     * @param {string} sql
     * @param {Param[]} [params]
     * @returns {Promise<WriteResult>}
     */
    async execute(sql, params = []) {
        log.debug(`${sql} ${JSON.stringify(params)}`);
        const [result] = await this.pool.execute(sql, params);
        return /** @type {WriteResult} */ (result);
    }

    /**
     * Returns the first row, or null when there is none.
     * @param {string} sql
     * @param {Param[]} [params]
     * @returns {Promise<Row | null>}
     */
    async one(sql, params = []) {
        const rows = await this.query(sql, params);
        return rows[0] ?? null;
    }

    /**
     * Returns the number of rows in `table` matching an optional WHERE clause.
     * @param {string} table
     * @param {string} [where] SQL condition with ? placeholders
     * @param {Param[]} [params]
     */
    async count(table, where = '1 = 1', params = []) {
        if (!/^[A-Za-z0-9_]+$/.test(table)) {
            throw new Error(`Invalid table name: ${table}`);
        }
        const row = await this.one(`SELECT COUNT(*) AS total FROM \`${table}\` WHERE ${where}`, params);
        return Number(row?.total ?? 0);
    }

    async close() {
        await this.pool.end();
    }
}

module.exports = { DbClient };
