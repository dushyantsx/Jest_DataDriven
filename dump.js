const config = require("./br-config");
const logger = require("./src/logger/Logger");

const TelusApis = require("./src/utils/telus-apis/TelusApis");

const tapis = new TelusApis();

const brw = require("./src/sel-js/Browser");
const sel = require("./src/sel-js/SelUtils");
const DbUtils = require("./src/utils/dbutils/DbUtils");
const StringUtils = require("./src/utils/common/StringUtils");
const { SsoLoginPage } = require("./src/pages/home-security");
const Netcracker = require("./src/pages/common/Netcracker");
const btapi = require("./src/bt-api/btapi");

const du = DbUtils.DbUtils;
const dq = DbUtils.DbQueries;

const envcfg = config.getConfigForGivenEnv();
const apicfg = config.getTelusApisConfig(envcfg);
const dbcfg = config.getDbConfig(envcfg);

async function test() {
  // const purchaseeOrderNumber = JSON.stringify(res.purchaseeOrderNumber);
  // Hit shipment order completion

  const customerId = await du.getValue(
    dbcfg,
    dq.queryNcCustomerIdFromSaleOrderNumber(dbcfg, "0001739766")
  );
  const order = { customerId };
  order.customerId = customerId;
  logger.debug(`Customer's internal id: ${order.customerId}`);

  const allPendingOrders = await du.select(
    dbcfg,
    dq.queryNcCustomerOrdersStatusNeitherCompletedNorProcessed(
      dbcfg,
      customerId
    )
  );
  logger.info(allPendingOrders);
  if (
    allPendingOrders != null &&
    allPendingOrders !== undefined &&
    allPendingOrders.length > 0
  ) {
    for (let orIndex = 0; orIndex < allPendingOrders.length; orIndex++) {
      const orderInternalId = allPendingOrders[orIndex][1];
      const orderName = allPendingOrders[orIndex][0];
      if (
        StringUtils.containsIgnoreCase(
          orderName,
          "New TELUS Home Security Product Order"
        )
      ) {
        // Hit release activation in case order is in entering state
        // Wait for 10 seconds to get completed

        const res = await du.getHomeSecurityTask(dbcfg, orderInternalId);
        logger.info(res);
        // Hit shipment order completion
        await tapis.processHoldOrderTask(apicfg, res);
        // Wait for 10 seconds to get completed
        await sel.getWaitUtils().sleep(10000);
      }
    }
  }
}
test();
