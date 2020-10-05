require("../../globals/MyTypeDefs");
const request = require("superagent");
const logger = require("../../logger/Logger");
const FileSystem = require("../common/FileSystem");
const StringUtils = require("../common/StringUtils");

require("superagent-proxy")(request);

const proxy = "http://webproxystatic-bc.tsl.telus.com:8080";

class AdcApiUtils {
  /**
   *
   * @param {AdcApis} cfg
   * @param {String} email
   */
  async isCustomerAvailable(cfg, email) {
    logger.enterMethod(
      `Using ADC web service api to get customer information ${email}`
    );
    // Disable TLS/SSL unauthorized verification; i.e. ignore ssl certificates
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

    const api = cfg.isCustomerAvailable.base + cfg.isCustomerAvailable.endpoint;
    let contentType = null;
    if (!StringUtils.isEmpty(cfg.isCustomerAvailable.contentType)) {
      contentType = {
        "Content-Type": cfg.isCustomerAvailable.contentType,
      };
    }
    logger.debug(`api-url: ${api}
       headers: ${JSON.stringify(contentType)}`);

    let rawBody = FileSystem.readFileSync(
      cfg.isCustomerAvailable.fileForBody
    ).toString();
    let keywordToReplace = "#ALARM_USER#";
    rawBody = StringUtils.replaceString(
      rawBody,
      keywordToReplace,
      cfg.isCustomerAvailable.authUser
    );
    keywordToReplace = "#ALARM_PASS#";
    rawBody = StringUtils.replaceString(
      rawBody,
      keywordToReplace,
      cfg.isCustomerAvailable.authPass
    );
    keywordToReplace = "#EMAIL_ID#";
    logger.debug(`Replacing ${keywordToReplace} in request body with ${email}`);
    rawBody = StringUtils.replaceString(rawBody, keywordToReplace, email);
    logger.debug(`Request body after replacing keywords: ${api}`);
    rawBody = rawBody.replace(/\r?\n|\r/g, " ");
    logger.trace(`raw body after replacing keywords: ${rawBody}`);

    let response = null;
    if (!StringUtils.isEmpty(contentType)) {
      logger.debug(`Hitting as below details:
      api: ${api}
      contentType: ${JSON.stringify(contentType)}`);
      response = await request("post", api)
        .proxy(proxy)
        .set(contentType)
        .send(rawBody);
    } else {
      logger.debug(`Hitting api: ${api}`);
      response = await request("post", api).proxy(proxy).send(rawBody);
    }
    logger.debug(`response received: ${JSON.stringify(response)}`);
    logger.exitMethod(`response status: ${response.status}`);
    return response;
  }

  /**
   *
   * @param {AdcApis} cfg
   * @param {String} email
   */
  async getCustomerInfo(cfg, customerId) {
    logger.enterMethod(
      `Using ADC web service api to get customer information ${customerId}`
    );
    // Disable TLS/SSL unauthorized verification; i.e. ignore ssl certificates
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

    const api = cfg.getCustomerInfo.base + cfg.getCustomerInfo.endpoint;
    let contentType = null;
    if (!StringUtils.isEmpty(cfg.getCustomerInfo.contentType)) {
      contentType = {
        "Content-Type": cfg.getCustomerInfo.contentType,
      };
    }
    logger.debug(`api-url: ${api}
       headers: ${JSON.stringify(contentType)}`);

    let rawBody = FileSystem.readFileSync(
      cfg.getCustomerInfo.fileForBody
    ).toString();
    let keywordToReplace = "#ALARM_USER#";
    rawBody = StringUtils.replaceString(
      rawBody,
      keywordToReplace,
      cfg.getCustomerInfo.authUser
    );
    keywordToReplace = "#ALARM_PASS#";
    rawBody = StringUtils.replaceString(
      rawBody,
      keywordToReplace,
      cfg.getCustomerInfo.authPass
    );
    keywordToReplace = "#CUSTOMER_ID#";
    logger.debug(
      `Replacing ${keywordToReplace} in request body with ${customerId}`
    );
    rawBody = StringUtils.replaceString(rawBody, keywordToReplace, customerId);
    logger.debug(`Request body after replacing keywords: ${api}`);
    rawBody = rawBody.replace(/\r?\n|\r/g, " ");
    logger.trace(`raw body after replacing keywords: ${rawBody}`);

    let response = null;
    if (!StringUtils.isEmpty(contentType)) {
      logger.debug(`Hitting as below details:
      api: ${api}
      contentType: ${JSON.stringify(contentType)}`);
      response = await request("post", api)
        .proxy(proxy)
        .set(contentType)
        .send(rawBody);
    } else {
      logger.debug(`Hitting api: ${api}`);
      response = await request(api).post("").send(rawBody);
    }
    logger.debug(`response received: ${JSON.stringify(response)}`);
    logger.exitMethod(`response status: ${response.status}`);
    return response;
  }

  /*
   *
   * @param {AdcApis} cfg
   * @param {String} email
   * @return {Promise<>}
   */
  async getDSTInfo(cfg, workorderId) {
    logger.enterMethod(
      `Using DST web service api to get customer information ${workorderId}`
    );
    // Disable TLS/SSL unauthorized verification; i.e. ignore ssl certificates
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

    const api = cfg.getDSTInfo.base + cfg.getDSTInfo.endpoint;
    let contentType = null;
    if (!StringUtils.isEmpty(cfg.getDSTInfo.contentType)) {
      contentType = {
        "Content-Type": cfg.getDSTInfo.contentType,
      };
    }
    logger.debug(`api-url: ${api}
       headers: ${JSON.stringify(contentType)}`);

    let rawBody = FileSystem.readFileSync(
      cfg.getDSTInfo.fileForBody
    ).toString();
    const keywordToReplace = "#WORK_ORDER_ID#";
    logger.debug(
      `Replacing ${keywordToReplace} in request body with ${workorderId}`
    );
    rawBody = StringUtils.replaceString(rawBody, keywordToReplace, workorderId);
    logger.debug(`Request body after replacing keywords: ${api}`);
    rawBody = rawBody.replace(/\r?\n|\r/g, " ");
    logger.trace(`raw body after replacing keywords: ${rawBody}`);

    let response = null;
    if (!StringUtils.isEmpty(contentType)) {
      logger.debug(`Hitting as below details:
      api: ${api}
      contentType: ${JSON.stringify(contentType)}`);
      response = await request("post", api)
        .auth("NETCRACKER", "soaorgid", { type: "auto" })
        .set(contentType)
        .send(rawBody);
    } else {
      logger.debug(`Hitting api: ${api}`);
      response = await request("post", api).send(rawBody);
    }
    logger.debug(`response received: ${JSON.stringify(response)}`);
    logger.exitMethod(`response status: ${response.status}`);
    return response;
  }
}

module.exports = AdcApiUtils;
