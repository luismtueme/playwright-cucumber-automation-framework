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

class DbClient {
    constructor(dbConfig) {
        if (!dbConfig) {
            throw new Error('Database is not configured. Set DB_HOST, DB_USER, DB_PASSWORD and DB_NAME.');
        }
        this.pool = mysql.createPool({ ...dbConfig, connectionLimit: 5, waitForConnections: true });
    }

    /** Runs a query and returns all rows. */
    async query(sql, params = []) {
        log.debug(`${sql} ${JSON.stringify(params)}`);
        const [rows] = await this.pool.execute(sql, params);
        return rows;
    }

    /** Returns the first row, or null when there is none. */
    async one(sql, params = []) {
        const rows = await this.query(sql, params);
        return rows[0] ?? null;
    }

    /** Returns the number of rows in `table` matching an optional WHERE clause. */
    async count(table, where = '1 = 1', params = []) {
        if (!/^[A-Za-z0-9_]+$/.test(table)) {
            throw new Error(`Invalid table name: ${table}`);
        }
        const row = await this.one(`SELECT COUNT(*) AS total FROM \`${table}\` WHERE ${where}`, params);
        return Number(row.total);
    }

    async close() {
        await this.pool.end();
    }
}

module.exports = { DbClient };
