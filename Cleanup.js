const config = require("./br-config");

const brw = require("./src/sel-js/Browser");
const sel = require("./src/sel-js/SelUtils");
const Netcracker = require("./src/pages/common/Netcracker");

const envcfg = config.getConfigForGivenEnv();

async function test() {
  const drv = await brw.initializeDriver(envcfg.browser);
  await sel.setDriver(drv);

  await sel.navigateTo(
    "https://flcncapp-itn02.tsl.telus.com/common/search.jsp?explorer_mode=disable&object=9134179303313237582&o=1000",
    "common/search"
  );

  await Netcracker.login("x228550", "Passw0rd");

  await Netcracker.enterSearchUsers();

  await Netcracker.selectAndDeleteUsers();

  await sel.getJsUtils().isPageLoaded();

  await sel.quit();
}

test();
