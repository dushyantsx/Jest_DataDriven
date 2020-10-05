require("../../globals/MyTypeDefs");
const request = require("superagent");
const logger = require("../../logger/Logger");
const FileSystem = require("../common/FileSystem");
const StringUtils = require("../common/StringUtils");
const DateUtils = require("../common/DateUtils");

require("superagent-proxy")(request);

class TelusApiUtils {
  /**
   *
   * @param {TelusApis} cfg
   * @param {String} workOrderNumber
   */
  async processWorkOrder(cfg, workOrderNumber) {
    logger.enterMethod(
      `Using netcracker api to complete work order ${workOrderNumber}`
    );
    // Disable TLS/SSL unauthorized verification; i.e. ignore ssl certificates
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;
    const api = cfg.workOrderCompletion.base + cfg.workOrderCompletion.endpoint;
    const contentType = {
      "Content-Type": cfg.workOrderCompletion.contentType,
    };
    logger.debug(`api-url: ${api}
        headers: ${JSON.stringify(contentType)}`);

    const keywordToReplace = cfg.workOrderCompletion.keywordsToReplace[0];
    logger.debug(
      `keywords to replace in body: ${JSON.stringify(keywordToReplace)}`
    );

    let rawBody = FileSystem.readFileSync(
      cfg.workOrderCompletion.fileForBody
    ).toString();
    rawBody = StringUtils.replaceString(
      rawBody,
      keywordToReplace,
      workOrderNumber
    );
    rawBody = rawBody.replace(/\r?\n|\r/g, " ");
    logger.trace(`raw body after replacing keywords: ${rawBody}`);

    const response = await request("post", api).set(contentType).send(rawBody);
    logger.trace(`response received: ${response}`);
    logger.exitMethod();
    return response;
  }

  /**
   *
   * @param {TelusApis} cfg
   * @param {String} workOrderNumber
   */
  async processReleaseActivation(cfg, workOrderNumber) {
    logger.enterMethod(
      `Using netcracker api to send release activation event for work order ${workOrderNumber}`
    );
    // Disable TLS/SSL unauthorized verification; i.e. ignore ssl certificates
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;
    const api = cfg.releaseActivation.base + cfg.releaseActivation.endpoint;
    const contentType = {
      "Content-Type": cfg.releaseActivation.contentType,
    };
    logger.debug(`api-url: ${api}
        headers: ${JSON.stringify(contentType)}`);

    const keywordToReplace = cfg.releaseActivation.keywordsToReplace[0];
    logger.debug(
      `keywords to replace in body: ${JSON.stringify(keywordToReplace)}`
    );

    let rawBody = FileSystem.readFileSync(
      cfg.releaseActivation.fileForBody
    ).toString();
    rawBody = StringUtils.replaceString(
      rawBody,
      keywordToReplace,
      workOrderNumber
    );
    rawBody = rawBody.replace(/\r?\n|\r/g, " ");
    logger.trace(`Raw body after replacing keywords: ${rawBody}`);

    const response = await request("post", api).set(contentType).send(rawBody);
    logger.trace(`response received: ${JSON.stringify(response)}`);
    logger.exitMethod();
    return response;
  }

  /**
   *
   * @param {TelusApis} cfg
   * @param {String} locationId
   */

  async processSearchAvailableAppointment(cfg, locationId) {
    // Disable TLS/SSL unauthorized verification; i.e. ignore ssl certificates
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;
    const now = new Date();
    const startDate = DateUtils.formatDate(DateUtils.currentDateTime(), "-");
    const endDate = DateUtils.formatDate(now.setDate(now.getDate() + 14), "-");
    logger.enterMethod(
      `Using WFM api to get available appointment slots from ${startDate} till ${endDate} for location - ${locationId}`
    );
    const api =
      cfg.searchAvailableAppointments.base +
      cfg.searchAvailableAppointments.endpoint;
    const contentType = {
      "Content-Type": cfg.searchAvailableAppointments.contentType,
    };
    logger.debug(`api-url: ${api}
       headers: ${JSON.stringify(contentType)}`);

    let rawBody = FileSystem.readFileSync(
      cfg.searchAvailableAppointments.fileForBody
    ).toString();

    let keywordToReplace = "#startDate#";
    logger.debug(`Replacing ${keywordToReplace} in body with ${startDate}`);
    rawBody = StringUtils.replaceString(rawBody, keywordToReplace, startDate);

    keywordToReplace = "#endDate#";
    logger.debug(`Replacing ${keywordToReplace} in body with ${endDate}`);
    rawBody = StringUtils.replaceString(rawBody, keywordToReplace, endDate);
    keywordToReplace = "#locationId#";
    logger.debug(`Replacing ${keywordToReplace} in body with ${locationId}`);
    rawBody = StringUtils.replaceString(rawBody, keywordToReplace, locationId);

    rawBody = rawBody.replace(/\r?\n|\r/g, " ");
    logger.debug(`Hitting as below details:
    api: ${api}
    contentType: ${JSON.stringify(contentType)}
    rawBody: ${rawBody}`);

    const response = await request("post", api)
      .auth("NETCRACKER", "soaorgid")
      .set(contentType)
      .send(rawBody);
    logger.debug(`response received: ${JSON.stringify(response)}`);
    logger.exitMethod(`response status: ${response.status}`);
    return response;
  }

  /**
   *
   * @param {TelusApis} cfg
   * @param {String} orderNumber
   * @param {String} purchaseOrderNumber
   */
  async processShipmentOrder(cfg, orderNumber, purchaseOrderNumber) {
    logger.enterMethod(
      `Using netcracker api to complete shipment order for order ${orderNumber},  purchase-order-number ${purchaseOrderNumber}`
    );
    // Disable TLS/SSL unauthorized verification; i.e. ignore ssl certificates
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

    const trackingNumber = "539459352A";
    const shipper = "CANADA POST";
    const expectedDeliveryDate = DateUtils.dateMMDDYYYY(
      DateUtils.tomorrowDate(),
      "/"
    );

    const api =
      cfg.shipmentOrderCompletion.base + cfg.shipmentOrderCompletion.endpoint;
    const contentType = {
      "Content-Type": cfg.shipmentOrderCompletion.contentType,
    };
    logger.debug(`api-url: ${api}
       headers: ${JSON.stringify(contentType)}`);

    let rawBody = FileSystem.readFileSync(
      cfg.shipmentOrderCompletion.fileForBody
    ).toString();

    let keywordToReplace = "#orderNumber#";
    logger.debug(`Replacing ${keywordToReplace} in body with ${orderNumber}`);
    rawBody = StringUtils.replaceString(rawBody, keywordToReplace, orderNumber);

    keywordToReplace = "#trackingNumber#";
    logger.debug(
      `Replacing ${keywordToReplace} in body with ${trackingNumber}`
    );
    rawBody = StringUtils.replaceString(
      rawBody,
      keywordToReplace,
      trackingNumber
    );
    keywordToReplace = "#expectedDeliveryDate#";
    logger.debug(
      `Replacing ${keywordToReplace} in body with ${expectedDeliveryDate}`
    );
    rawBody = StringUtils.replaceString(
      rawBody,
      keywordToReplace,
      expectedDeliveryDate
    );
    keywordToReplace = "#purchaseOrderNumber#";
    logger.debug(
      `Replacing ${keywordToReplace} in body with ${purchaseOrderNumber}`
    );
    rawBody = StringUtils.replaceString(
      rawBody,
      keywordToReplace,
      purchaseOrderNumber
    );
    keywordToReplace = "#shipper#";
    logger.debug(`Replacing ${keywordToReplace} in body with ${shipper}`);
    rawBody = StringUtils.replaceString(rawBody, keywordToReplace, shipper);
    logger.debug(`raw body after replacing keywords: ${rawBody}`);

    rawBody = rawBody.replace(/\r?\n|\r/g, " ");
    logger.debug(`Hitting as below details:
    api: ${api}
    contentType: ${JSON.stringify(contentType)}
    rawBody: ${rawBody}`);

    const response = await request("post", api).set(contentType).send(rawBody);
    logger.debug(`response received: ${JSON.stringify(response)}`);
    logger.exitMethod(`response status: ${response.status}`);
    return response;
  }

  /**
   *
   * @param {TelusApis} cfg
   * @param {String} taskObjectId
   */
  async processManualTask(cfg, taskObjectId) {
    logger.enterMethod(
      `Using netcracker api to complete manual task ${taskObjectId}`
    );
    // Disable TLS/SSL unauthorized verification; i.e. ignore ssl certificates
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

    let api = cfg.manualTaskCompletion.base + cfg.manualTaskCompletion.endpoint;
    let contentType = null;
    if (!StringUtils.isEmpty(cfg.manualTaskCompletion.contentType)) {
      contentType = {
        "Content-Type": cfg.manualTaskCompletion.contentType,
      };
    }
    logger.debug(`api-url: ${api}
       headers: ${JSON.stringify(contentType)}`);

    const keywordToReplace = "#TASK_OBJECT_ID#";
    logger.debug(`Replacing ${keywordToReplace} in api with ${taskObjectId}`);
    api = StringUtils.replaceString(api, keywordToReplace, taskObjectId);
    logger.debug(`api after replacing keywords: ${api}`);

    let response = null;
    if (!StringUtils.isEmpty(contentType)) {
      logger.debug(`Hitting as below details:
      api: ${api}
      contentType: ${JSON.stringify(contentType)}`);
      response = await request("post", api).set(contentType).send();
    } else {
      logger.debug(`Hitting api: ${api}`);
      response = await request("post", api).send();
    }
    logger.debug(`response received: ${JSON.stringify(response)}`);
    logger.exitMethod(`response status: ${response.status}`);
    return response;
  }

  /**
   *
   * @param {TelusApis} cfg
   * @param {String} customerId
   */
  async setMigrationFlag(cfg, customerId) {
    logger.enterMethod(
      `Using netcracker api to set migrated flag for customer: ${customerId}`
    );
    // Disable TLS/SSL unauthorized verification; i.e. ignore ssl certificates
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

    let api = cfg.setMigrationFlag.base + cfg.setMigrationFlag.endpoint;
    let contentType = null;
    if (!StringUtils.isEmpty(cfg.setMigrationFlag.contentType)) {
      contentType = {
        "Content-Type": cfg.setMigrationFlag.contentType,
      };
    }
    logger.debug(`api-url: ${api}
       headers: ${JSON.stringify(contentType)}`);

    const keywordToReplace = "#CUSTOMER_ID#";
    logger.debug(`Replacing ${keywordToReplace} in api with ${customerId}`);
    api = StringUtils.replaceString(api, keywordToReplace, customerId);
    logger.debug(`api after replacing keywords: ${api}`);

    let response = null;
    if (!StringUtils.isEmpty(contentType)) {
      logger.debug(`Hitting as below details:
      api: ${api}
      contentType: ${JSON.stringify(contentType)}`);
      response = await request("put", api).set(contentType).send();
    } else {
      logger.debug(`Hitting api: ${api}`);
      response = await request("put", api).send();
    }
    logger.debug(`response received: ${JSON.stringify(response)}`);
    logger.exitMethod(`response status: ${response.status}`);
    return response;
  }

  /**
   *
   * @param {TelusApis} cfg
   * @param {String} purchaseOrderNumber
   */
  async processHoldOrderTask(cfg, taskObjectId) {
    logger.enterMethod(
      `Using netcracker api to complete holorder task ${taskObjectId}`
    );
    // Disable TLS/SSL unauthorized verification; i.e. ignore ssl certificates
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

    let api =
      cfg.holdOrderTaskCompletion.base + cfg.holdOrderTaskCompletion.endpoint;
    let contentType = null;
    if (!StringUtils.isEmpty(cfg.holdOrderTaskCompletion.contentType)) {
      contentType = {
        "Content-Type": cfg.holdOrderTaskCompletion.contentType,
      };
    }
    logger.debug(`api-url: ${api}
       headers: ${JSON.stringify(contentType)}`);

    const keywordToReplace = "#TASK_OBJECT_ID#";
    logger.debug(`Replacing ${keywordToReplace} in api with ${taskObjectId}`);
    api = StringUtils.replaceString(api, keywordToReplace, taskObjectId);
    logger.debug(`api after replacing keywords: ${api}`);

    logger.debug(`Hitting as below details:
      api: ${api}
      contentType: ${JSON.stringify(contentType)}`);

    const response = await request("get", api)
      .auth("Administrator", "netcracker", { type: "basic" })
      .set(contentType)
      .send();
    logger.debug(response.status);
    return response;
  }
}

module.exports = TelusApiUtils;
