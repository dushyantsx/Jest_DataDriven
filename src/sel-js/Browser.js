require("chromedriver");
require("geckodriver");
const webdriver = require("selenium-webdriver");

const { logging } = webdriver;

const Nuller = require("../utils/common/Nuller");
const logger = require("../logger/Logger");
const config = require("../../br-config");

const envcfg = config.getConfigForGivenEnv();

class Browser {
  /**
   * Initializes driver object for given browser with standard capabilities
   * @param {String} brwName Specifies browser name
   */
  static async initializeDriver(brwName) {
    logger.enterMethod();
    const bn = Nuller.nullToValue(brwName, "chrome");

    logging.installConsoleHandler();
    logging.getLogger("promise.ControlFlow").setLevel(logging.Level.ALL);

    let caps;
    switch (bn) {
      case "chrome":
      default:
        caps = webdriver.Capabilities.chrome();
        caps.setAlertBehavior("accept");
        caps.set("goog:chromeOptions", {
          args: [
            "--start-maximized",
            "--disable-gpu",
            "disable-infobars",
            "--incognito",
          ], //--headless
        });

        break;
      case "firefox":
        caps = webdriver.Capabilities.firefox();
        break;
      case "ie":
        caps = webdriver.Capabilities.ie();
        break;
      case "safari":
        caps = webdriver.Capabilities.safari();
        break;
      case "edge":
        caps = webdriver.Capabilities.edge();
        break;
    }
    caps.setAcceptInsecureCerts(true);

    caps.map_.set("timeouts", {
      script: envcfg.timeouts.scriptasyncload,
      pageLoad: envcfg.timeouts.pageload,
      implicit: envcfg.timeouts.implicit,
    });
    logger.debug(`ccc${JSON.stringify(caps)}`);

    logger.step(`Initializing [${bn}] browser driver instance`);
    const driver = new webdriver.Builder()
      .forBrowser(bn)
      .setLoggingPrefs()
      .withCapabilities(caps)
      .build();

    // Time setting timeouts does not work;
    // so setting caps in map_ object directly before initializing driver
    // driver.manage().setTimeouts({
    //   script: envcfg.timeouts.scriptasyncload,
    //   pageLoad: envcfg.timeouts.pageload,
    //   implicit: envcfg.timeouts.implicit
    // });

    driver
      .manage()
      .getTimeouts()
      .then((v) => {
        logger.debug(`Timeouts set as: ${JSON.stringify(v)}`);
      });

    logger.debug("Maximizing browser");
    driver.manage().window().maximize();
    driver.manage().deleteAllCookies();

    logger.debug("Setting driver object to selenium utils");
    //sel.setDriver(driver);
    logger.exitMethod(`${brwName} initialized successfully`);
    return driver;
  }
}

module.exports = Browser;
