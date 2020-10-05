const oracledb = require("oracledb");

const DbQueries = require("./DbQueries");
const StringUtils = require("../common/StringUtils");
const logger = require("../../logger/Logger");

oracledb.fetchAsString = [oracledb.DATE, oracledb.NUMBER];

/**
 * @description Sets connection with oracle database as per given configuration in db-config.js
 * @param {DbConfig} dbConfig
 * @returns Promise<oracledb.Connection>
 */
async function setConn(dbConfig) {
  let conn = null;

  // Setting externalAuth is optional.  It defaults to false.  See:
  // https://oracle.github.io/node-oracledb/doc/api.html#extauth
  // externalAuth  : process.env.NODE_ORACLEDB_EXTERNALAUTH ? true : false
  try {
    const connObj = {
      user: process.env.NODE_ORACLEDB_USER || dbConfig.user,
      // Get the password from the environment variable
      // NODE_ORACLEDB_PASSWORD.  The password could also be a hard coded
      // string (not recommended), or it could be prompted for.
      // Alternatively use External Authentication so that no password is
      // needed.
      password: process.env.NODE_ORACLEDB_PASSWORD || dbConfig.password,
      // For information on connection strings see:
      // https://oracle.github.io/node-oracledb/doc/api.html#connectionstrings
      connectString:
        process.env.NODE_ORACLEDB_CONNECTIONSTRING || dbConfig.connectString,
    };
    conn = await oracledb.getConnection(connObj);
    logger.info(`Connection with ${connObj.connectString} was successful!`);
  } catch (err) {
    logger.error(err);
    throw err;
  }
  return conn;
}

/**
 * @description Releases specified oracle db connection object
 * @param {oracledb.Connection} conn
 */
function releaseConn(conn) {
  if (conn != null) {
    conn.release(function (err) {
      if (err) {
        logger.error(err);
      }
    });
  }
}

class DbUtils {
  /**
   *
   * @param {DbConfig} dbConfig
   */
  static async getConn(dbConfig) {
    return setConn(dbConfig);
  }

  /**
   * @description Executes select query and return results in 2-d array
   * @param {DbConfig} dbConfig
   * @param {String} query Specifies query to be executed
   */
  static async select(dbConfig, query) {
    logger.debug(
      `Executing query: ${query} on db-configuration ${JSON.stringify(
        dbConfig
      )}`
    );
    return new Promise(async function (resolve, reject) {
      let connection;
      try {
        connection = await setConn(dbConfig);
        const result = await connection.execute(query);
        resolve(result.rows);
      } catch (err) {
        logger.error(err);
        // Catches errors in getConnection and the query
        reject(err);
      } finally {
        // the connection assignment worked, must release
        releaseConn(connection);
      }
    });
  }

  /**
   * @description Executes select query and return single value
   * @param {DbConfig} dbConfig
   * @param {String} query Specifies query to be executed
   */
  static async getValue(dbConfig, query) {
    const rs = await this.select(dbConfig, query);
    if (StringUtils.isEmptyObject(rs) || rs.length === 0) {
      return null;
    }
    return rs[0][0];
  }

  /**
   * @description Provides work order number based on given work order internal
   * @param {DbConfig} dbConfig
   * @param {String} customerInternalId Specifies customer internal nc-object-id
   */
  static async getWorkOrderNumbersNotCompleted(dbConfig, customerInternalId) {
    const query = DbQueries.queryWorkOrderNumberFromCustomerInternalId(
      dbConfig,

      customerInternalId
    );
    return await this.select(dbConfig, query);
  }

  /**
   * @description Provides work order number based on given work order internal
   * @param {DbConfig} dbConfig
   * @param {String} shipmentObjectId Specifies shipment order internal nc-object-id
   */
  static async getShipmentOrderNumberAndPurchaseOrderNumber(
    dbConfig,
    shipmentObjectId
  ) {
    const query = DbQueries.queryShipmentOrderNumberAndPurchaseOrderNumberFromShipmentOrderInternalObjectId(
      dbConfig,
      shipmentObjectId
    );
    const res = await this.select(dbConfig, query);
    return { shipmentOrderNumber: res[0][0], purchaseeOrderNumber: res[0][1] };
  }

  static async getErrorsOccuredForCustomer(dbConfig, customerId) {
    const query = DbQueries.queryErrorsForGivenCustomer(dbConfig, customerId);
    return await this.select(dbConfig, query);
  }

  /**
   * @description Provides manual credit task id
   * @param {DbConfig} dbConfig
   * @param {String} customerId Specifies customer internal nc-object-id
   */
  static async getManualCreditTaskId(dbConfig, customerId) {
    const query = DbQueries.queryManualCreditTaskId(dbConfig, customerId);
    return await this.getValue(dbConfig, query);
  }

  /**
   * @description Provides all billing actions object-id(s) and their status
   * @param {DbConfig} dbConfig
   * @param {String} customerId Specifies customer internal nc-object-id
   */
  static async getBillingActionStatus(dbConfig, customerId) {
    const query = DbQueries.queryGetAllBillingActionStatus(
      dbConfig,
      customerId
    );
    return await this.select(dbConfig, query);
  }

  /**
   * @description Provides all billing actions object-id(s) and their status
   * @param {DbConfig} dbConfig
   * @param {String} customerId Specifies customer internal nc-object-id
   */
  static async getBillingFailedActionStatus(dbConfig, customerId) {
    const query = DbQueries.queryGetAllBillingFailedActionStatus(
      dbConfig,
      customerId
    );
    return await this.select(dbConfig, query);
  }

  /**
   * @description Provides customerid of created customer
   * @param {DbConfig} dbConfig
   * @param {String} customerName Specifies customerfirstname
   */
  static async getCustomerIdFromCustomerName(dbConfig, customerName) {
    const query = DbQueries.queryCustomerIdFromCustomerName(
      dbConfig,
      customerName
    );
    const res = await this.select(dbConfig, query);
    logger.info(res);
    logger.info(`customerid is ${res[0][0]}`);
    return res[0][0];
  }

  /**
   * @description Sets Migration flag to migrated for given customerId
   * @param {DbConfig} dbConfig
   * @param {String} customerId Specifies customerId
   */
  static async setMigratedFlagtoCustomer(dbConfig, customerId) {
    const query = DbQueries.queryChangeFlagtoMigrated(dbConfig, customerId);
    return await this.select(dbConfig, query);
  }

  /**
   * @description Get Hold on Completion TaskId for the orderId
   * @param {DbConfig} dbConfig
   * @param {String} customerId Specifies customerId
   */
  static async updateShipmentTask(dbConfig, taskId) {
    const query = DbQueries.queryProcessShipmentTask(dbConfig, taskId);
    return await this.select(dbConfig, query);
  }

  static async getShipmentTask(dbConfig, orderId) {
    const query = DbQueries.queryGetShipmentTask(dbConfig, orderId);
    return await this.getValue(dbConfig, query);
  }

  static async getHoldOrderTaskNumber(dbConfig, purchaseeOrderNumber) {
    const query = DbQueries.queryHoldOrderCompletionTask(
      dbConfig,
      purchaseeOrderNumber
    );
    const res = await this.select(dbConfig, query);
    return res;
  }

  static async getValidateTaskNumber(dbConfig, phoneOrderNumber) {
    const query = DbQueries.queryValidatePhoneServiceTask(
      dbConfig,
      phoneOrderNumber
    );
    const res = await this.select(dbConfig, query);
    return res;
  }

  static async getHomeSecurityTask(dbConfig, homeSecurityOrderNumber) {
    const query = DbQueries.queryValidateHomeSecurityTask(
      dbConfig,
      homeSecurityOrderNumber
    );
    const res = await this.select(dbConfig, query);
    return res;
  }
}

module.exports = { DbUtils, DbQueries };
