const webdriver = require("selenium-webdriver");

const { until } = webdriver;
const { By } = webdriver;

require("../globals/enumerations");
const { LocFindStrategy } = require("../globals/enumerations");
const logger = require("../logger/Logger");
const GlobalConsts = require("../globals/GlobalConsts");
const Nuller = require("../utils/common/Nuller");
const StringUtils = require("../utils/common/StringUtils");
const DateUtils = require("../utils/common/DateUtils");
const config = require("../../br-config").getConfigForGivenEnv();

let waitDriver = new webdriver.WebDriver();

const sleeping = (milliseconds) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};

class WaitUtils {
  /**
   *
   * @param {ThenableWebDriver} d
   */
  constructor(d) {
    waitDriver = d;
  }

  /**
   * @param {ThenableWebDriver} driver
   */
  static setDriver(driver) {
    waitDriver = driver;
  }

  static async sleep(ms) {
    logger.debug(`sleeping for ${ms} milliseconds`);
    if (config.timeouts.sleep) {
      return await sleeping(ms);
    }
  }

  /**
   * @param {webdriver.WebElement} ele
   */
  static async scrollIntoView(ele) {
    try {
      logger.enterMethod("scrollIntoView");
      await waitDriver.executeScript("arguments[0].scrollIntoView();", ele);
      logger.exitMethod("scrollIntoView");
    } catch (err) {
      logger.error(err);
    }
  }

  /**
   * @description Waits until element is located. It considers timeout from element timeout configuration.
   *
   * @param {LocFindStrategy} strategy
   * @param {String} strategyVal
   */
  static async waitForElementLocated(strategy, strategyVal, timeout) {
    try {
      logger.enterMethod(`waitForElementLocated ${strategy}=${strategyVal}`);

      if (timeout == null || timeout === undefined) {
        timeout = GlobalConsts.getTimeOutElement();
      }
      logger.debug("Waiting for element to be located");
      await this.waitElementUntilFound(strategy, strategyVal);
      const bl = this.byLoc(strategy, strategyVal);
      await waitDriver
        .wait(until.elementLocated(bl), timeout)
        .then(
          () => logger.debug(`Element found from ${bl}`),
          (err) => logger.error(err)
        )
        .catch((err) => logger.error(err));
      logger.exitMethod(`waitForElementLocated ${strategy}=${strategyVal}`);
      return waitDriver.findElement(bl);
    } catch (err) {
      logger.error(err);
      if (err instanceof webdriver.error.StaleElementReferenceError) {
        return await this.waitForElementLocated(strategy, strategyVal, timeout);
      }
      throw err;
    }
  }

  /**
   * @description Waits until elements are located in DOM. It considers timeout from element timeout configuration.
   *
   * @param {LocFindStrategy} strategy
   * @param {String} strategyVal
   */
  static async waitForElementsLocated(strategy, strategyVal) {
    logger.enterMethod("waitForElementsLocated");
    await this.waitElementUntilFound(strategy, strategyVal);
    const bl = this.byLoc(strategy, strategyVal);
    logger.debug(
      `Waiting for elements to be present in DOM on strategy ${strategy} for value ${strategyVal}`
    );
    await waitDriver
      .wait(until.elementsLocated(bl), GlobalConsts.getTimeOutElement())
      .then(
        (eles) => {
          logger.debug(`Elements found: ${eles.length}`);
          return eles;
        },
        (err) => logger.error(err)
      )
      .catch((err) => logger.error(err));

    logger.exitMethod("waitForElementsLocated");
    return await waitDriver.findElements(bl);
  }

  /**
   * @description Waits until element is visible. It considers timeout from element timeout configuration.
   *
   * @param {LocFindStrategy} strategy
   * @param {String} strategyVal
   */
  static async waitForElementVisible(strategy, strategyVal, timeout) {
    logger.enterMethod(`waitForElementVisible ${strategy} = ${strategyVal}`);
    if (timeout == null || timeout === undefined)
      timeout = GlobalConsts.getTimeOutElement();

    const bl = this.byLoc(strategy, strategyVal);
    try {
      let ele = await this.waitForElementLocated(strategy, strategyVal);
      await this.scrollIntoView(ele);

      ele = await waitDriver.wait(until.elementIsVisible(ele), timeout);
      await this.scrollIntoView(ele);
    } catch (err) {
      logger.error(err);
      logger.debug(
        `Error occured during waiting for visibility of element ${strategy}=${strategyVal}`
      );
      throw err;
    }
    logger.exitMethod(`waitForElementVisible ${strategy} = ${strategyVal}`);
    return await waitDriver.findElement(bl);
    // return await waitDriver.wait(
    //   until.elementIsVisible(ele),
    //   GlobalConsts.getTimeOutElement()
    // );
  }

  /**
   * @description Waits until elements are visible. It considers timeout from element timeout configuration.
   *
   * @param {LocFindStrategy} strategy
   * @param {String} strategyVal
   */
  static async waitForElementsVisible(strategy, strategyVal) {
    const eleColl = await this.waitForElementsLocated(strategy, strategyVal);
    if (Nuller.isNotNullObject(eleColl)) {
      for (let index = 0; index < eleColl.length; index++) {
        logger.debug(`Waiting for element ${index} for its visibility`);
        if (eleColl[index].isDisplayed()) {
          break;
        }
        await waitDriver
          .wait(
            until.elementIsVisible(eleColl[index]),
            GlobalConsts.getTimeOutElement()
          )
          .then(
            logger.debug(`Element at index ${index} is in visible state now`),
            (er) => logger.error(er)
          )
          .catch((err) => logger.error(err));
      }

      return await this.waitForElementsLocated(strategy, strategyVal);
    }
    throw new Error(
      `Element(s) provided NOT visible for given strategy ${strategy} having value ${strategyVal}`
    );
  }

  /**
   * @description Waits until element is invisible but present in DOM. It considers timeout from element timeout configuration.
   *
   * @param {LocFindStrategy} strategy
   * @param {String} strategyVal
   */
  static async waitForElementNotVisible(strategy, strategyVal) {
    const ele = await this.waitForElementLocated(strategy, strategyVal);
    return await waitDriver.wait(
      until.elementIsNotVisible(ele),
      GlobalConsts.getTimeOutElement()
    );
  }

  /**
   * @description Waits until element is enabled. It considers timeout from element timeout configuration.
   * @param {LocFindStrategy} strategy
   * @param {String} strategyVal
   */
  static async waitForElementEnabled(strategy, strategyVal) {
    const ele = await this.waitForElementLocated(strategy, strategyVal);
    return await waitDriver.wait(
      until.elementIsEnabled(ele),
      GlobalConsts.getTimeOutElement()
    );
  }

  /**
   * @description Waits until element is disabled. It considers timeout from element timeout configuration.
   * @param {LocFindStrategy} strategy
   * @param {String} strategyVal
   */
  static async waitForElementDisabled(strategy, strategyVal) {
    const ele = await this.waitForElementLocated(strategy, strategyVal);
    return await waitDriver.wait(
      until.elementIsDisabled(ele),
      GlobalConsts.getTimeOutElement()
    );
  }

  /**
   * @description Waits until element is found in DOM irrespective of displayed or enabled state.
   * It considers timeout from element timeout configuration to limit the check time.
   *
   * @param {LocFindStrategy} strategy
   * @param {String} strategyVal
   */
  static async waitElementUntilFound(strategy, strategyVal, timeout) {
    logger.enterMethod(
      `waitElementUntilFound with strategy ${strategy}=${strategyVal}`
    );
    if (timeout == null || timeout === undefined)
      timeout = GlobalConsts.getTimeOutElement();

    const bl = this.byLoc(strategy, strategyVal);

    return await waitDriver
      .wait(async function waitEleRect() {
        logger.debug("Waiting for element rectangle");
        const eles = await waitDriver.findElements(bl);
        logger.debug(`Validating elements ${JSON.stringify(eles)}`);
        if (eles === undefined || eles == null || eles.length === 0) {
          logger.debug(
            `NO element found till now for given ${strategy}=${strategyVal}`
          );
          return false;
        }
        logger.trace(`${eles.length} number of elements found`);
        const ele = eles[0];
        try {
          const r = await ele.getRect();
          logger.debug(`element[0] rectangle is as: ${JSON.stringify(r)}`);

          // below for loop is just for more debugging logs; to check rectangle for each element found
          for (let index = 1; index < eles.length; index++) {
            const ir = await eles[index].getRect();
            logger.debug(
              `element[${index}] rectangle is as: ${JSON.stringify(ir)}`
            );
          }
          if (r === undefined || r == null) {
            logger.debug(
              "rectangle object appeared as undefined; checking for other elements if any"
            );
            return false;
          }
          return (r.x > 0 || r.y > 0) && r.height > 0 && r.width > 0;
        } catch (err) {
          logger.error(err);
          return false;
        }
      }, timeout)
      .catch(function printError(err) {
        logger.error(err);
      });
  }

  /**
   * @name waitForUrlToChangeTo
   * @description Wait until the URL changes to match a provided regex
   * @param {RegExp} urlRegex wait until the URL changes to match this regex
   * @returns {!webdriver.promise.Promise} Promise
   */
  static async waitForUrlToChangeTo(urlRegex) {
    logger.debug(`waitForUrlToChangeTo-1 -> ${urlRegex}`);
    const initialTime = DateUtils.yyyymmddhhmmssms();
    const rx = new RegExp(urlRegex, "i");
    let currentUrl;

    return waitDriver
      .getCurrentUrl()
      .then(function storeCurrentUrl(url) {
        logger.debug(`Storing current url as ${url}`);
        // eslint-disable-next-line no-unused-vars
        currentUrl = url;
        if (StringUtils.containsIgnoreCase(url, "not-found")) {
          logger.warn(
            "Returned as we have got not-found page; so there is no point to wait or continue test"
          );
          throw new Error("Page Not Found error occured");
        }
      })
      .then(function waitForUrlToChangeTo() {
        logger.debug("waitForUrlToChangeTo-2");
        // eslint-disable-next-line no-shadow
        return waitDriver.wait(async function waitForUrlToChangeTo() {
          logger.debug("waitForUrlToChangeTo-3");
          const url = await waitDriver.getCurrentUrl();
          logger.debug(
            `Regular expression match result [${urlRegex}] in ${url} ->> ${rx.test(
              url
            )}`
          );
          if (StringUtils.containsIgnoreCase(url, "not-found")) {
            logger.warn(
              "Returned as we have got not-found page; so there is no point to wait or continue test"
            );
            throw new Error("Page Not Found error occured");
          }
          if (
            !rx.test(url) &&
            DateUtils.timePassed(initialTime, config.timeouts.urlchange)
          ) {
            // This block is to control time for the loop to run and check
            logger.error(
              `Time of ${config.timeouts.urlchange} milliseconds expired while still waiting for url; so breaking out of the loop`
            );
            return true;
          }
          logger.debug(
            `waitForUrlToChangeTo-3 -> returning url-change result as: ${rx.test(
              url
            )}`
          );
          return rx.test(url);
        });
      });
  }

  static async waitForElementTextToAppearInContainedIgnoreCaseState(
    strategy,
    strategyVal,
    textToWaitFor
  ) {
    logger.step(
      `Wait for element having strategy [${strategy}] with strategy value [${strategyVal}] and text containing [${textToWaitFor}]`
    );
    await this.waitElementUntilFound(strategy, strategyVal);
    const bl = this.byLoc(strategy, strategyVal);

    return waitDriver.wait(function () {
      return waitDriver
        .findElement(bl)
        .getText()
        .then(
          function (text) {
            logger.debug(
              `External attempt: Found text as [${text}] and waiting for [${textToWaitFor}]`
            );
            return StringUtils.containsIgnoreCase(text, textToWaitFor);
          },
          async function () {
            const text = await waitDriver.findElement(bl).getText();
            logger.debug(
              `Internal attempt: Found text as [${text}] and waiting for [${textToWaitFor}]`
            );
            return StringUtils.containsIgnoreCase(text, textToWaitFor);
          }
        );
    });
  }

  /**
   * @typedef {Object} ElementWithState
   * @property {webdriver.WebElement} ele - The WebElement
   * @property {Boolean} eleState
   */

  /**
   * @description Validates if given element {ele}'s state is matcing {state} specified
   *
   * @param {LocFindStrategy} strategy Specifies strategy to find element
   * @param {String} strategyVal Specifies strategy value to use while finding element
   * @param {String} state Specifies element state to validate. If no state is specified, it would validate default VISIBLE state.
   * Supported states are {VISIBLE, ENABLED, DISABLED, INVISIBLE}
   */
  //@returns {ElementWithState} Element with its state met status or not {WebElement, Boolean}
  static async waitUntilElementStateOnStrategy(strategy, strategyVal, state) {
    logger.debug(`Waiting for element until its [${state}] state`);
    if (Nuller.isNullObject(strategy) || Nuller.isNullObject(strategyVal))
      throw new Error(
        `No strategy provided to find element until given state [${state}] found`
      );
    if (Nuller.isNullObject(state)) {
      logger.warn(
        "No state provided to ensure; only ensuring if element is displayed or not on default"
      );
      state = "visible";
    }
    state = state.toUpperCase().trim();

    logger.verbose(`Entered loop to wait for element for state ${state}`);
    return await search(strategy, strategyVal, state);
  }

  static byLoc(strategy, strategyVal) {
    let bl;
    switch (strategy) {
      case LocFindStrategy.Id:
        bl = By.id(strategyVal);
        break;
      case LocFindStrategy.Name:
        bl = By.name(strategyVal);
        break;
      case LocFindStrategy.Xpath:
        bl = By.xpath(strategyVal);
        break;
      case LocFindStrategy.CssSel:
        bl = By.css(strategyVal);
        break;
      case LocFindStrategy.ClassName:
        bl = By.className(strategyVal);
        break;
      case LocFindStrategy.LinkText:
        bl = By.linkText(strategyVal);
        break;
      default:
        throw new Error(`Invalid locator find strategy provided ${strategy}`);
    }
    return bl;
  }

  static async waitForElementRemoved(strategy, strategyVal) {
    const ele = await this.waitForElementLocated(strategy, strategyVal);
    return await waitDriver.wait(
      until.stalenessOf(ele),
      GlobalConsts.getTimeOutElement()
    );
  }

  static async waitlongForElementRemoved(strategy, strategyVal) {
    const ele = await this.waitForElementLocated(strategy, strategyVal);
    return await waitDriver.wait(
      until.stalenessOf(ele),
      GlobalConsts.getTimeOutElementlong()
    );
  }
}

const search = async function (strategy, strategyVal, state) {
  let el;
  let els;
  switch (state) {
    case "ENABLED":
      el = await WaitUtils.waitForElementEnabled(strategy, strategyVal);
      els = await el.isEnabled();
      logger.debug(`element enabled? ${els}`);
      break;
    case "DISABLED":
      el = await WaitUtils.waitForElementDisabled(strategy, strategyVal);
      els = !(await el.isEnabled());
      break;
    case "INVISIBLE":
      el = await WaitUtils.waitForElementNotVisible(strategy, strategyVal);
      els = !(await el.isDisplayed());
      break;
    case "VISIBLE":
    default:
      el = await WaitUtils.waitForElementVisible(strategy, strategyVal);
      els = await el.isDisplayed();
      break;
  }
  return new Promise((resolve) => el != null && els);
};

module.exports = WaitUtils;
