const webdriver = require("selenium-webdriver");
const fs = require("fs");

const { until } = webdriver;
const { By } = webdriver;
const { Key } = webdriver;

require("../globals/enumerations");
const { LocFindStrategy } = require("../globals/enumerations");
const logger = require("../logger/Logger");
const GlobalConsts = require("../globals/GlobalConsts");
const Nuller = require("../utils/common/Nuller");
const StringUtils = require("../utils/common/StringUtils");
const DateUtils = require("../utils/common/DateUtils");
const WaitUtils = require("./WaitUtils");
const SelJsUtils = require("./SelJsUtils");

let selDriver = new webdriver.WebDriver();

class SelUtils {
  /**
   *
   * @param {ThenableWebDriver} d
   */
  constructor(d) {
    selDriver = d;
  }

  /**
   *
   * @param {ThenableWebDriver} driver
   */
  static async setDriver(driver) {
    logger.enterMethod(`setDriver`);
    //selDriver = new webdriver.WebDriver();
    selDriver = driver;
    WaitUtils.setDriver(driver);
    SelJsUtils.setDriver(driver);
    logger.exitMethod(`setDriver`);
    return (async () => await selDriver)();
  }

  /**
   *
   * @param {ThenableWebDriver} driver
   */
  static forDriver(driver) {
    if (driver == null || driver === undefined) {
      logger.error("No driver object provided");
    }

    selDriver = driver;
    WaitUtils.setDriver(driver);
    SelJsUtils.setDriver(driver);
    return this;
  }

  static getWaitUtils() {
    return WaitUtils;
  }

  static getJsUtils() {
    return SelJsUtils;
  }

  static deleteAllCookies() {
    selDriver
      .manage()
      .deleteAllCookies()
      .then(() => {
        logger.debug("All cookies deleted");
      });
  }

  /**
   * @param {webdriver.WebElement} ele
   */
  static async clear(ele) {
    return await ele.clear();
  }

  /**
   *
   * @param {webdriver.WebElement} ele
   */
  static click(ele) {
    logger.debug("Clicking element using native click");
    return (async () => {
      try {
        await this.getWaitUtils().scrollIntoView(ele);
        await this.getJsUtils().highlightWebElement(ele);
        await ele.click();
        await this.getJsUtils().highlightResetWebElement(ele);
      } catch (err) {
        logger.error(err);
        throw err;
        //}
      }
    })();
  }

  /**
   *
   * @param {webdriver.WebElement} ele
   * @param {String} attrName
   */
  static async getAttribute(ele, attrName) {
    if (ele == null || ele === undefined) {
      throw new Error(
        `getAttribute received an ${ele} kind of element; which is obviously not an element`
      );
    }
    return await ele.getAttribute(attrName);
  }

  /**
   *
   * @param {String} css
   * @param {String} attrName
   *
   */
  static async getAttributeByCss(css, attrName) {
    const ele = await this.getElementByCssSelector(css);
    return await this.getAttribute(ele, attrName);
  }

  /**
   *
   * @param {String} xpath
   * @param {String} attrName
   *
   */
  static async getAttributeByXpath(xpath, attrName) {
    const ele = await this.getElementByXpath(xpath);
    return await this.getAttribute(ele, attrName);
  }

  /**
   *
   * @param {String} xpath
   * @param {String} containsText
   * @param {String} attrName
   */
  static async getAttributeByXpathContainingText(
    xpath,
    containsText,
    attrName
  ) {
    const eleColl = await this.getElementsByXpathContainingText(
      xpath,
      containsText
    );
    return await this.getAttribute(eleColl[0], attrName);
  }

  /**
   *
   * @param {webdriver.WebElement} ele
   * @returns {Promise<string>} Text of found element
   */
  static async getText(ele) {
    return ele.getText();
  }

  /**
   *
   * @param {String} id
   * @returns {String} Text of found element
   */
  static async getTextById(id) {
    const ele = await this.getElementById(id);
    return await this.getText(ele);
  }

  /**
   *
   * @param {String} name
   * @returns {String} Text of found element
   */
  static async getTextByName(name) {
    const ele = await this.getElementByName(name);
    return await this.getText(ele);
  }

  /**
   *
   * @param {String} css
   *
   */
  static async getTextByCss(css) {
    const ele = await this.getElementByCssSelector(css);
    return this.getText(ele);
  }

  /**
   *
   * @param {String} css
   * @description Text of all found elements
   */
  static async getTextAllByCss(css) {
    const elesText = [];
    try {
      const eles = await selDriver.findElements(By.css(css));
      for (let index = 0; index < eles.length; index++) {
        const ele = eles[index];
        this.isVisible(ele).then(() => {
          this.getText(ele).then((t) => {
            elesText.push(t);
          });
        });
      }
    } catch (err) {
      if (err instanceof webdriver.error.StaleElementReferenceError) {
        logger.error(err);
        return this.getTextAllByCss(css);
      }
      throw err;
    }
    return elesText;
  }

  /**
   *
   * @param {String} xpath
   * @returns {Promise<String[]>} Text of all found elements
   */
  static async getTextAllByXpath(xpath) {
    const elesText = [];
    try {
      const eles = await selDriver.findElements(By.xpath(xpath));
      for (const ele of eles) {
        if (this.isVisible(ele)) {
          const eleText = await this.getText(ele);
          elesText.push(eleText);
        }
      }
    } catch (err) {
      if (err instanceof webdriver.error.StaleElementReferenceError) {
        logger.error(err);
        return this.getTextAllByXpath(xpath);
      }
      throw err;
    }
    logger.exitMethod(
      `Text retrieved by given ${xpath} from all elements ${JSON.stringify(
        elesText
      )}`
    );
    return elesText;
  }

  /**
   *
   * @param {String} xpath
   * @returns {Promise<*>} Text of found element
   */
  static async getTextByXpath(xpath) {
    const ele = await this.getElementByXpath(xpath);
    return await this.getText(ele);
  }

  /**
   * @description Searches for text in equalsIgnoreCase fashion and clicks the element from given collection
   * @param {webdriver.WebElement[]} eleCollection Specifies element collection
   * @param {String} text Specifies text to be searched
   */
  static async clickElementText(eleCollection, text) {
    if (Nuller.isNullObject(eleCollection)) {
      throw new Error("No elements provided to search text for and click");
    }
    for (const ele of eleCollection) {
      const eleText = await ele.getText();
      logger.debug(
        `Comparing element text [${eleText}] with provided text ${text}`
      );
      if (StringUtils.equalsIgnoreCase(eleText, text)) {
        return await this.click(ele);
      }
    }
    throw new Error(`No element found with given text ${text} click`);
  }

  /**
   * @description Searches for text in containsIgnoreCase fashion and clicks the element from given collection
   *
   * @param {webdriver.WebElement[]} eleCollection Specifies element collection
   * @param {String} text Specifies text to be searched
   */
  static async clickElementContainingText(eleCollection, text) {
    logger.step(`Clicking element having text [${text}]`);
    if (Nuller.isNullObject(eleCollection)) {
      throw new Error("No elements provided to search text for and click");
    }

    for (const ele of eleCollection) {
      await selDriver.wait(
        until.elementIsVisible(ele),
        GlobalConsts.getTimeOutElement()
      );

      const eleText = await ele.getText();
      logger.debug(`Comparing element text [${eleText}] with text [${text}]`);
      if (StringUtils.containsIgnoreCase(eleText, text)) {
        return await this.click(ele);
      }
    }
    throw new Error(`No element found with given text ${text} click`);
  }

  /**
   * @description Searches for text in containsIgnoreCase fashion and clicks the element from found collection of elements using css-selector strategy
   *
   * @param {String} css Specifies css selector get element collection
   * @param {String} text Specifies text to be search in found element's collection
   */
  static async clickElementByCssContainingTextUsingJavaScript(css, text) {
    logger.step(
      `Click on element after finding based on css-selector [${css}] strategy containing text [${text}]`
    );
    try {
      const eleColl = await this.getElementsByCssContainingText(css, text);
      return await this.getJsUtils().clickUsingJavascript(eleColl[0]);
    } catch (err) {
      logger.error(err);
      if (err instanceof webdriver.error.StaleElementReferenceError) {
        return this.clickElementByCssContainingTextUsingJavaScript(css, text);
      }
      throw err;
    }
  }

  /**
   * @description Searches for text in containsIgnoreCase fashion and clicks the element from found collection of elements using xpath strategy
   *
   * @param {String} xpath Specifies css selector get element collection
   * @param {String} text Specifies text to be search in found element's collection
   */
  static async clickElementByXpathContainingText(xpath, text) {
    logger.step(
      `Click on element after finding based on xpath ${xpath} strategy containing text [${text}]`
    );
    try {
      const eleColl = await this.getElementsByXpath(xpath);
      logger.debug(`${eleColl.length} Elements found`);
      return await this.clickElementContainingText(eleColl, text);
    } catch (err) {
      logger.error(err);
      if (err instanceof webdriver.error.StaleElementReferenceError) {
        return this.clickElementByXpathContainingText(xpath, text);
      }
      throw err;
    }
  }

  /**
   * @description Searches for text in containsIgnoreCase fashion and clicks the element from found collection of elements using css-selector strategy
   *
   * @param {String} css Specifies css selector get element collection
   * @param {String} text Specifies text to be search in found element's collection
   */
  static async clickElementByCssContainingText(css, text) {
    logger.step(
      `Click on element after finding based on css-selector [${css}] strategy containing text [${text}]`
    );
    try {
      const eleColl = await this.getElementsByCssSelector(css);
      return await this.clickElementContainingText(eleColl, text);
    } catch (err) {
      logger.error(err);
      if (err instanceof webdriver.error.StaleElementReferenceError) {
        return this.clickElementByCssContainingText(css, text);
      }
      throw err;
    }
  }

  /**
   *
   * @param {LocFindStrategy} strategy
   * @param {String} strategyVal
   */
  static async findAndClick(strategy, strategyVal, timeout) {
    logger.step(
      `Click on element after finding based on strategy [${strategy}] having value [${strategyVal}] for timeout ${timeout}`
    );
    try {
      const el = await WaitUtils.waitForElementVisible(strategy, strategyVal);
      return await this.click(el);
    } catch (err) {
      logger.error(err);
      if (err instanceof webdriver.error.StaleElementReferenceError) {
        return await this.findAndClick(strategy, strategyVal);
      }
      throw err;
    }
  }

  /**
   *
   * @param {String} loc
   */
  static async clickById(loc) {
    logger.step(`Clicking on element having id: : ${loc}`);
    try {
      return await this.findAndClick(
        LocFindStrategy.Id,
        loc,
        GlobalConsts.getTimeOutElement()
      );
    } catch (err) {
      logger.error(err);
      if (err instanceof webdriver.error.ElementClickInterceptedError) {
        return await this.pressEnterById(loc);
      }
      throw err;
    }
  }

  /**
   *
   * @param {String} loc
   */
  static clickByLinkText(loc) {
    logger.step(`Clicking on element having link-text: : ${loc}`);
    return (async () =>
      await this.findAndClick(
        LocFindStrategy.LinkText,
        loc,
        GlobalConsts.getTimeOutElement()
      ))();
  }

  /**
   *
   * @param {String} loc
   */
  static clickByName(loc) {
    logger.step(`Clicking on element having name: ${loc}`);
    return (async () => {
      await this.findAndClick(
        LocFindStrategy.Name,
        loc,
        GlobalConsts.getTimeOutElement()
      );
    })();
  }

  /**
   * @param {String} loc
   */
  static async clickByCss(loc) {
    return await this.clickByCssWithTimeout(
      loc,
      GlobalConsts.getTimeOutElement()
    );
  }

  /**
   * @param {String} loc
   * @param {Number} timeout
   */
  static async clickByCssWithTimeout(loc, timeout) {
    logger.step(`Clicking on element having css-selector: ${loc}`);
    try {
      return await this.findAndClick(LocFindStrategy.CssSel, loc, timeout);
    } catch (err) {
      logger.error(err);
      if (err instanceof webdriver.error.ElementClickInterceptedError) {
        return await this.pressEnterByCss(loc);
      }
      throw err;
    }
  }

  /**
   *
   * @param {String} loc
   */
  static async clickByXpath(loc) {
    logger.step(`Clicking on element having xpath: ${loc}`);
    return await this.findAndClick(
      LocFindStrategy.Xpath,
      loc,
      GlobalConsts.getTimeOutElement()
    );
  }

  /**
   *
   * @param {String} loc
   */
  static pressEnterByCss(loc) {
    logger.step(`Pressing enter on element having css: ${loc}`);
    return (async () =>
      await this.findElementAndSetText(
        LocFindStrategy.CssSel,
        loc,
        Key.ENTER
      ))();
  }

  /**
   *
   * @param {String} loc
   */
  static pressEnterById(loc) {
    logger.step(`Pressing enter on element having id: ${loc}`);
    return (async () =>
      await this.findElementAndSendKeysOnly(
        LocFindStrategy.Id,
        loc,
        Key.ENTER
      ))();
  }

  /**
   *
   * @param {LocFindStrategy} strategy
   * @param {String} strategyVal
   * @param {Number} timeout
   */
  static async getElement(strategy, strategyVal) {
    try {
      return await WaitUtils.waitForElementVisible(strategy, strategyVal);
    } catch (err) {
      if (err instanceof webdriver.error.StaleElementReferenceError) {
        return await this.getElement(strategy, strategyVal);
      }
      throw err;
    }
  }

  /**
   *
   * @param {String} id
   * @param {Number} timeout
   */
  static async getElementsById(id, timeout = GlobalConsts.getTimeOutElement()) {
    const el = await selDriver.wait(until.elementLocated(By.id(id)), timeout);
    await selDriver.wait(until.elementIsVisible(el), timeout);
    // Get all the elements available with id
    return await selDriver.findElements(By.id(id));
  }

  /**
   *
   * @param {String} name
   * @param {Number} timeout
   */
  static async getElementsByName(
    name,
    timeout = GlobalConsts.getTimeOutElement()
  ) {
    const el = await selDriver.wait(
      until.elementLocated(By.name(name)),
      timeout
    );
    await selDriver.wait(until.elementIsVisible(el), timeout);
    // Get all the elements available with name
    return await selDriver.findElements(By.name(name));
  }

  /**
   *
   * @param {String} xpath
   */
  static async getElementsByXpath(xpath) {
    await WaitUtils.waitForElementsLocated(LocFindStrategy.Xpath, xpath)
      .then(
        (eles) => logger.debug(`${eles.length} Elements located`),
        (err) => logger.error(err)
      )
      .catch((err) => logger.error(err));
    // Get all the elements available with xpath
    logger.debug(`Returning elements found on xpath=${xpath}`);
    return await selDriver.findElements(By.xpath(xpath));
  }

  /**
   *
   * @param {String} xpath
   * @param {String|String[]} text
   */
  static async getElementsByXpathContainingText(xpath, text) {
    const eles = await this.getElementsByXpath(xpath);
    return await this.getElementsContainingText(eles, text);
  }

  /**
   *
   * @param {String} css
   * @param {String|String[]} text
   */
  static async getElementsByCssContainingText(css, text) {
    const eles = await this.getElementsByCssSelector(css);
    return await this.getElementsContainingText(eles, text);
  }

  /**
   *
   * @param {webdriver.WebElement[]} eles
   * @param {String|String[]} text
   */
  static async getElementsContainingText(eles, text) {
    const elesFound = [];
    let textList = text;
    if (!StringUtils.isEmpty(text) && !Array.isArray(text)) {
      textList = text.split(",");
    }

    for (const ele of eles) {
      if (ele !== null && ele !== undefined) {
        const eleText = await ele.getText();
        if (StringUtils.containsIgnoreCaseAny(eleText, textList)) {
          elesFound.push(ele);
        }
      }
    }
    return elesFound;
  }

  /**
   *
   * @param {String} css
   * @param {Number} timeout
   */
  static async getElementsByCssSelector(
    css,
    timeout = GlobalConsts.getTimeOutElement()
  ) {
    logger.enterMethod("getElementsByCssSelector");
    const el = await this.getElementByCssSelector(css, timeout);
    logger.trace(`Individual element: ${JSON.stringify(el)}`);
    // Get all the elements available with css
    const elements = await selDriver.findElements(By.css(css));
    logger.trace(`All elements: ${JSON.stringify(elements)}`);
    logger.exitMethod(`getElementsByCssSelector: ${elements}`);
    return await elements;
  }

  /**
   *
   * @param {String} classname
   * @param {Number} timeout
   */
  static async getElementsByClassName(
    classname,
    timeout = GlobalConsts.getTimeOutElement()
  ) {
    const el = await selDriver.wait(
      until.elementLocated(By.className(classname)),
      timeout
    );
    await selDriver.wait(until.elementIsVisible(el), timeout);
    // Get all the elements available with className
    return await selDriver.findElements(By.className(classname));
  }

  /**
   *
   * @param {String} linktext
   * @param {Number} timeout
   */
  static async getElementsByLinkText(
    linktext,
    timeout = GlobalConsts.getTimeOutElement()
  ) {
    const el = await selDriver.wait(
      until.elementLocated(By.linkText(linktext)),
      timeout
    );
    await selDriver.wait(until.elementIsVisible(el), timeout);
    // Get all the elements available with linkText
    return await selDriver.findElements(By.linkText(linktext));
  }

  /**
   *
   * @param {String} id
   * @param {Number} timeout
   */
  static async getElementById(id, timeout = GlobalConsts.getTimeOutElement()) {
    return await this.getElement(LocFindStrategy.Id, id, timeout);
  }

  /**
   *
   * @param {String} name
   * @param {Number} timeout
   */
  static async getElementByName(
    name,
    timeout = GlobalConsts.getTimeOutElement()
  ) {
    return await this.getElement(LocFindStrategy.Name, name, timeout);
  }

  /**
   *
   * @param {String} xpath
   * @param {Number} timeout
   */
  static async getElementByXpath(
    xpath,
    timeout = GlobalConsts.getTimeOutElement()
  ) {
    return await this.getElement(LocFindStrategy.Xpath, xpath, timeout);
  }

  /**
   *
   * @param {String} css
   * @param {Number} timeout
   */
  static async getElementByCssSelector(
    css,
    timeout = GlobalConsts.getTimeOutElement()
  ) {
    logger.debug(`getElementByCssSelector css: ${css}`);
    return await this.getElement(LocFindStrategy.CssSel, css, timeout);
  }

  /**
   *
   * @param {String} className
   * @param {Number} timeout
   */
  static async getElementByClassName(
    className,
    timeout = GlobalConsts.getTimeOutElement()
  ) {
    return await this.getElement(LocFindStrategy.ClassName, className, timeout);
  }

  /**
   *
   * @param {String} linktext
   * @param {Number} timeout
   */
  static async getElementByLinkText(
    linktext,
    timeout = GlobalConsts.getTimeOutElement()
  ) {
    return await this.getElement(LocFindStrategy.LinkText, linktext, timeout);
  }

  /**
   *
   * @param {String} url
   * @param {String|String[]} urltextToWaitFor
   */
  static async navigateTo(url, urltextToWaitFor) {
    logger.step(`Navigating to url: ${url}`);
    if (!StringUtils.isEmpty(urltextToWaitFor)) {
      await selDriver.get(url);
      //   return WaitUtils.waitForUrlToChangeTo(urltextToWaitFor);
    }
    return await selDriver.get(url);
  }

  /**
   * @description Sets given text {text} on provided element {ele}
   * @param {webdriver.WebElement} ele Specifies element where to set text
   * @param {String} text Specifies text to set on given element
   */
  static async setText(ele, text) {
    await this.getJsUtils().highlightWebElement(ele);
    await this.clear(ele);
    await ele.sendKeys(text);
    await this.getJsUtils().highlightResetWebElement(ele);
  }

  /**
   * @description Sends given keys only
   * @param {webdriver.WebElement} ele Specifies element where to set text
   * @param {Key} keyToSend Specifies keys to send given element
   */
  static async sendKeysOnly(ele, keyToSend) {
    await this.getJsUtils().highlightWebElement(ele);
    await ele.sendKeys(keyToSend);
    await this.getJsUtils().highlightResetWebElement(ele);
  }

  /**
   *
   * @param {LocFindStrategy} strategy
   * @param {String} strategyVal
   * @param {Key} keys
   */
  static async findElementAndSendKeysOnly(strategy, strategyVal, keys) {
    logger.step(
      `Finding element on strategy [${strategy}] with its value [${strategyVal}] and setting text as: [${keys}]`
    );
    const ele = await this.getElement(strategy, strategyVal);
    return await this.sendKeysOnly(ele, keys);
  }

  /**
   *
   * @param {LocFindStrategy} strategy
   * @param {String} strategyVal
   * @param {String} text
   */
  static async findElementAndSetText(strategy, strategyVal, text) {
    logger.step(
      `Finding element on strategy [${strategy}] with its value [${strategyVal}] and setting text as: [${text}]`
    );
    const ele = await this.getElement(strategy, strategyVal);
    return await this.setText(ele, text);
  }

  /**
   *
   * @param {String} loc
   * @param {String} text
   */
  static async findElementByXpathAndSetText(loc, text) {
    return await this.findElementAndSetText(LocFindStrategy.Xpath, loc, text);
  }

  /**
   *
   * @param {String} loc
   * @param {String} text
   */
  static async findElementByCssAndSetText(loc, text) {
    return await this.findElementAndSetText(LocFindStrategy.CssSel, loc, text);
  }

  /**
   *
   * @param {webdriver.WebElement} ele
   */
  static async isVisible(ele) {
    logger.debug("verifying visibility of given element");
    return await ele.isDisplayed();
  }

  /**
   *
   * @param {String} loc
   * @returns {Promise<Boolean>}
   */
  static async isVisibleByCss(loc) {
    try {
      const ele = await this.getElementByCssSelector(loc);
      return await ele.isDisplayed();
    } catch (err) {
      if (err instanceof webdriver.error.StaleElementReferenceError) {
        return await this.isVisibleByCss(loc);
      }
      throw err;
    }
  }

  /**
   *
   * @param {webdriver.WebElement} ele
   * @returns {Boolean}
   */
  static isEnabled(ele) {
    return (async () => await ele.isEnabled())();
  }

  /**
   * @description Validates if given element {ele}'s state is matcing {state} specified
   *
   * @param {LocFindStrategy} strategy
   * @param {String} strategyVal
   * @param {String} state Specifies element state to validate. If no state is specified, it would validate default VISIBLE state. Supported states are {VISIBLE, ENABLED, DISABLED, INVISIBLE}
   * @returns {Boolean}
   */
  static async validateElementStateOnStrategy(strategy, strategyVal, state) {
    return await WaitUtils.waitUntilElementStateOnStrategy(
      strategy,
      strategyVal,
      state
    ).eleState;
  }

  static async getCurrentUrl() {
    return await selDriver.getCurrentUrl();
  }

  static async browserExists() {
    return await selDriver
      .getCurrentUrl()
      .then(
        function (link) {
          logger.debug(`Browser is open with link ${link}`);
          //Browser is open
          return true;
        },
        function (err) {
          logger.error(err);
          return false;
        }
      )
      .catch(function () {
        //Browser was closed
        return false;
      });
  }

  /**
   * @description Quits the browser driver
   */
  static async quit() {
    logger.enterMethod("quitBrowser");
    if (selDriver != null) {
      await this.browserExists().then(await selDriver.quit());
    }
    // if (selDriver != null) await selDriver.close();
    logger.exitMethod("quitBrowser");
  }

  /**
   * @description Captures screenshot and saves at {basedir}/reports/screenshots/{fileNameWithoutExtension}.png
   * @param {String} fileNameWithoutExtension Specifies file name without path or extension
   * @returns {String} FilePath
   */
  static async captureScreenshot(fileNameWithoutExtension) {
    const imageName = `${fileNameWithoutExtension}-${DateUtils.yyyymmddhhmmssms()}.png`;
    // eslint-disable-next-line no-undef
    const screenshotFolder = `${__base}/reports/screenshots`;
    logger.debug(`Capturing screenshot at ${imageName}`);
    const image = await selDriver.takeScreenshot();
    if (!fs.existsSync(screenshotFolder)) {
      fs.mkdirSync(screenshotFolder, { recursive: true });
    }

    fs.writeFileSync(`${screenshotFolder}/${imageName}`, image, "base64");
    return `${screenshotFolder}/${imageName}`;
  }

  static async acceptAlerts() {
    selDriver
      .switchTo()
      .alert()
      .then(
        function (alert) {
          alert.accept();
        },
        function (err) {
          throw err;
        }
      );
  }
}

module.exports = SelUtils;

// var EC = webdriver.ExpectedConditions;
// browser.wait(EC.urlContains("Expected URL"), timeout); // Checks that the current URL contains the expected text
// browser.wait(EC.urlIs("Expected URL"), timeout); // Checks that the current URL matches the expected text
