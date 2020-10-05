const webdriver = require("selenium-webdriver");

// const { WebElement } = webdriver;
const { By } = webdriver;
// const { Key } = webdriver;

require("../globals/enumerations");
const logger = require("../logger/Logger");
const StringUtils = require("../utils/common/StringUtils");

let jsDriver = new webdriver.WebDriver();
let resetBorderStyle = "";

function _getJavaScriptForGettingElementByXPath() {
  const javascriptToFindElement = `function getElementByXpath(xpath) {
          return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
     }`;
  logger.debug(javascriptToFindElement);
  return javascriptToFindElement;
}

class SelJsUtils {
  /**
   * @param {ThenableWebDriver} d
   */
  constructor(d) {
    jsDriver = d;
  }

  /**
   * @param {ThenableWebDriver} driver
   */
  static setDriver(driver) {
    jsDriver = driver;
  }

  static getJsBorderColor() {
    return "#FF0000";
  }

  /**
   * @param {webdriver.WebElement} ele
   */
  static async clickUsingJavascript(ele) {
    logger.enterMethod("clickUsingJavascript");
    await jsDriver.executeScript("arguments[0].click();", ele);
    logger.exitMethod("clickUsingJavascript");
  }

  /**
   * @param {String} css
   */
  static async clickByCssUsingJavascript(css) {
    logger.enterMethod(`clickByCssUsingJavascript ${css}`);
    const jscmd = `document.querySelector("${css}").click();`;

    const ele = await jsDriver.findElement(By.css(css));
    await this.highlightWebElement(ele);

    logger.debug(`Executing command using javascriptexecutor: ${jscmd}`);
    await jsDriver.executeScript(jscmd);

    await this.highlightResetWebElement(ele);
    logger.exitMethod("clickByCssUsingJavascript");
  }

  /**
   * @param {String} xpath
   */
  static async clickByXpathUsingJavascript(xpath) {
    logger.enterMethod(`clickByXpathUsingJavascript ${xpath}`);
    const jscmd = _getJavaScriptForGettingElementByXPath();
    const jsToClickEle = `${jscmd} getElementByXpath("${xpath}").click();`;

    logger.debug(`Javascript used to click element by xpath: ${jsToClickEle}`);
    jsDriver.executeScript(jsToClickEle);
    logger.exitMethod("clickByXpathUsingJavascript");
  }

  /**
   * @param {String} id
   */
  static async clickByIdUsingJavascript(id) {
    logger.enterMethod(`clickByIdUsingJavascript ${id}`);
    const jscmd = `document.getElementById("${id}").click();`;

    const ele = await jsDriver.findElement(By.id(id));
    await this.highlightWebElement(ele);

    logger.debug(`Executing command using javascriptexecutor: ${jscmd}`);
    await jsDriver.executeScript(jscmd);

    await this.highlightResetWebElement(ele);
    logger.exitMethod("clickByIdUsingJavascript");
  }

  /**
   * @param {webdriver.WebElement} we
   */
  static async highlightResetWebElement(we) {
    logger.enterMethod(`Resetting highlighed color ${resetBorderStyle}`);
    const jscmd = `arguments[0].style.border='${resetBorderStyle}'`;

    if (we != null) {
      try {
        await jsDriver.executeScript(jscmd, we);
      } catch (err) {
        // logger.error(err);
      }
    }
    logger.exitMethod();
  }

  /**
   * @param {webdriver.WebElement} we
   */
  static async highlightWebElement(we) {
    logger.enterMethod(
      `Highlighting webelement with color: ${this.getJsBorderColor()}`
    );
    //Fetch current border style to restore in reset method
    let jscmd = `return arguments[0].style.border`;
    if (we != null) {
      try {
        resetBorderStyle = await jsDriver.executeScript(jscmd, we);
        logger.debug(
          `After highlight; background would be reset to: ${resetBorderStyle}`
        );
      } catch (err) {
        logger.error(err);
      }
    }

    jscmd = `arguments[0].style.border='2px solid ${this.getJsBorderColor()}'`;
    if (we != null) {
      try {
        await jsDriver.executeScript(jscmd, we);
      } catch (err) {
        logger.error(err);
      }
    }
    logger.exitMethod();
  }

  static async isPageLoaded() {
    let pagecomplete;

    const jsQuery =
      "function pageLoaded() { var loadingStatus = (document.readyState); return loadingStatus; }; return pageLoaded();";
    const page = await jsDriver.executeScript(jsQuery);
    logger.info(`documentstate:${page}`);
    if (page !== "complete") {
      logger.info("Going in If block for document");
      this.isPageLoaded();
    }
    try {
      const jsQuery1 =
        "function pageLoaded() { var loadingStatus = (jQuery.active); return loadingStatus; }; return pageLoaded();";
      pagecomplete = await jsDriver.executeScript(jsQuery1);
      logger.info(`jquerystate${pagecomplete}`);
    } catch (err) {
      //eating error if any
    }

    if (pagecomplete !== "undefined") {
      if (pagecomplete !== 0) {
        logger.info("Going in If block for jquery");
        this.isPageLoaded();
      }
    }
    logger.exitMethod(`isPageLoaded`);
    return page && pagecomplete;
  }

  /**
   *
   * @param {String} jscmd
   * @returns {Object|String}
   */
  static async executeJsCommand(jscmd) {
    if (StringUtils.isEmpty(jscmd)) {
      return "";
    }

    const output = await jsDriver.executeScript(jscmd);
    return output;
  }

  /**
   *
   * @param {webdriver.WebElement} element
   * @param {String} text
   *
   */
  static async setTextUsingJavaScript(element, text) {
    await jsDriver.executeScript(
      `arguments[0].setAttribute('value','${text}');`,
      element
    );
  }
}

module.exports = SelJsUtils;
