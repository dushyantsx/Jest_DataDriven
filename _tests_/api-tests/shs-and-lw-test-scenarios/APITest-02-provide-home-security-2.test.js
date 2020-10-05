/**
 * @group allTests
 * @group shs-lw-tests
 *
 */

const btapi = require("../../../src/bt-api/btapi");
const bodySamples = require("../../../src/bt-api/bodySamples");
const logger = require("../../../src/logger/Logger");
const TelusApis = require("../../../src/utils/telus-apis/TelusApis");
const config = require("../../../br-config");
const DateUtils = require("../../../src/utils/common/DateUtils");

const tapis = new TelusApis();

require("../../../src/globals/MyTypeDefs");
require("../../../src/globals/enumerations");
const { TestResultStatus } = require("../../../src/globals/enumerations");

const StringUtils = require("../../../src/utils/common/StringUtils");
const ExcelUtils = require("../../../src/utils/excel/excelUtils");
const DataReader = require("../../../src/sel-js/DataReader");
const FileSystem = require("../../../src/utils/common/FileSystem");
const FileWriter = require("../../../src/utils/common/FileWriter");
const TestResult = require("../../../src/globals/results/TestResult");
const { Validator } = require("../../../src/globals/TestObjects");
const DbUtils = require("../../../src/utils/dbutils/DbUtils");

const du = DbUtils.DbUtils;
const dq = DbUtils.DbQueries;

const TestIdsMap = require("../../../src/globals/TestIdsMap");

const eu = new ExcelUtils();
const dr = new DataReader();
const tval = new Validator();
const testId = TestIdsMap.api2test;
const valFile = "shs-and-lw-test-scenarios";

const envcfg = config.getConfigForGivenEnv();
const dbcfg = config.getDbConfig(envcfg);
const apicfg = config.getTelusApisConfig(envcfg);

const configDataAsset = config.getTestDataAssetsForGivenTestId(envcfg, testId);
const sheetDataAsJsonArray = eu.sheetOnNameAsJsonArray(
  configDataAsset.dataFile,
  configDataAsset.dataSheet
);
// eslint-disable-next-line no-console
console.table(sheetDataAsJsonArray);

/**
 * @type TestCaseResultObject
 */
let caseResult;
describe("Provide1: API", () => {
  beforeAll(() => {
    logger.enterMethod("beforeAll");
    jest.setTimeout(envcfg.timeouts.uitest);
    logger.exitMethod("beforeAll");
  });

  afterAll(() => {
    logger.enterMethod("afterAll");
    const dsRepDir = config.getLocationDataSetReportsDirForGivenEnv();
    logger.info(dsRepDir);
    if (FileSystem.fileExistsSync(dsRepDir) === false) {
      logger.error(
        `Can not write case-results to non-existent location ${dsRepDir}`
      );
    }
    FileWriter.sync(
      `${dsRepDir}/${testId}.json`,
      JSON.stringify(caseResult),
      false
    );

    //sel.deleteAllCookies();
    logger.exitMethod("afterAll");
  });

  afterEach(async () => {
    logger.enterMethod("afterEach");
    //await sel.captureScreenshot(testId);
    logger.exitMethod("afterEach");
  });

  const testName =
    "Provide-1: Provide in ON; Product: SmarthomeSecurity; Self-Install";
  describe(testName, () => {
    beforeAll(() => {
      logger.enterMethod("beforeAll stepsProvide1api");
      caseResult = TestResult.TestCaseResult(testId, testName);

      logger.exitMethod("beforeAll stepsProvide1api");
    });

    logger.debug(`Starting for all data-sets for test-id ${testId}`);
    sheetDataAsJsonArray.forEach((singleJsonRowObject, index) => {
      test(`${testName} for data-set-${index + 1}`, async (done) => {
        logger.enterMethod(`Test started for data-set-${index + 1}`);
        dr.setDataSetObject(singleJsonRowObject, index);
        const dsObj = dr.getDataSetObject(index);
        const executeOrNot = dr.getDataSetKeyValue(
          dsObj,
          "input",
          "data-set-enabled"
        );
        logger.debug(
          `Dataset ${index} at is having execution flag set to ${executeOrNot}`
        );
        caseResult.datasets.push(dr.getDataSetObject(index));
        if (executeOrNot === "Y") {
          return await stepsProvide1LWself(dsObj, index)
            .then((v) => {
              logger.result(`Test result for data-set-${index + 1}: ${v}`);
              logger.exitMethod(`Test finished for data-set-${index + 1}`);
              done();
            })
            .catch((ex) => {
              logger.error(`Test error for data-set-${index + 1}: ${ex}`);
              throw ex;
              //fail(ex);
            });
        }
        return (async () => {
          caseResult.datasets[index].result = TestResultStatus.Skipped;
          logger.exitMethod(
            `Test finished as skipped for data-set-${index + 1}`
          );
          //return "success";
          pending();
        })(); //.then(done());
      }); // test block ending
    }); // for loop ending
  }); // inner describe block ending
}); // describe block ending

async function stepsProvide1LWself(dsObj, datasetindex) {
  let workOrderNumber;
  expect.hasAssertions(); // At least one assertion is called during a test
  expect(dsObj).toBeDefined();
  const isValEnabled = true;
  try {
    let shoppingCartId = null;
    let woItemId = null;
    let secureItemId = null;
    let customerAccountECID = null;

    const externalLocationId = "2990852";

    const secureOffer = btapi.data.offers.smartHomeSecuritySecure;
    const commitmentOffer =
      btapi.data.offers.homeSecurityCommitmentOn36MonthContract;
    const lwOffer = btapi.data.offers.livingWellCompanionHome;

    const { workOffer } = btapi.data.offers;
    let distributionChannel = btapi.data.distributionChannel.CSR;
    let customerCategory = btapi.data.customerCategory.CONSUMER;

    let cartVersionBeforeSubmit = null;

    let startDate = null;
    let endDate = null;
    const customerEmail = dr.getDataSetKeyValue(dsObj, "input", "email");
    const customerName = dr.getDataSetKeyValue(dsObj, "input", "firstname");

    let body = bodySamples.createCustomerBody(
      customerName,
      externalLocationId,
      customerEmail
    );
    logger.info(`Create Customer API body:${body}`);

    let response = await btapi.verifyCreateCustomerAccountTBAPI(body);

    logger.info(`Response Create Customer:${JSON.stringify(response)}`);

    TestResult.storeOutputToDataSetResult(
      caseResult,
      datasetindex,
      response.externalCustomerId
    );
    const offerList = [secureOffer, commitmentOffer, lwOffer];

    const customerID = response.customerId;
    customerAccountECID = response.externalCustomerId;
    logger.info(customerAccountECID);
    logger.info(customerID);

    body = btapi.generateShoppingCartBody.addTopOffers(
      customerAccountECID,
      customerCategory,
      distributionChannel,
      externalLocationId,
      offerList
    );
    logger.info(`Shopping cart body:${JSON.stringify(body)}`);

    response = await btapi
      .$requestShoppingCart(btapi.TYPES.createShoppingCart(), body)
      .toPromise()
      .then(
        (success) => {
          expect(
            success,
            "Create Shopping cart Response should not be empty\n"
          ).not.toBeNull();
          expect(
            success.response,
            `Create Shopping cart Response field should be present\n${JSON.stringify(
              success,
              null,
              "\t"
            )}`
          ).toBeDefined();
          expect(
            success.response,
            `Create Shopping cart Response field should be present\n${JSON.stringify(
              success,
              null,
              "\t"
            )}`
          ).not.toBeNull();
          expect(
            success.response.body,
            `Create Shopping cart Response should contain body\n${JSON.stringify(
              success,
              null,
              "\t"
            )}`
          ).toBeDefined();
          expect(
            success.response.body,
            `Create Shopping cart Response should contain body\n${JSON.stringify(
              success,
              null,
              "\t"
            )}`
          ).not.toBeNull();
          body = success.response.body;
          logger.info(JSON.stringify(body));
          logger.info(JSON.stringify(response));

          const responseText = JSON.stringify(success, null, "\t");
          logger.info(`storing responsetext${responseText}`);
          expect(
            success.response.statusCode,
            `Create Shopping cart statusCode should be 201${JSON.stringify(
              success,
              null,
              "\t"
            )}`
          ).toBe(201);
          expect(
            success.response.body.status,
            `Create Shopping cart SC should have OPEN status\n${responseText}`
          ).toBe("OPEN");
          expect(
            success.response.body.cartItem,
            `Create Shopping cart Response should contain cartItem\n${responseText}`
          ).toBeDefined();
          expect(
            success.response.body.cartItem,
            `Create Shopping cart Item should not be null\n${responseText}`
          ).not.toBeNull();
          const scText = JSON.stringify(
            success.response.body.cartItem.map((elem) => {
              return {
                id: `${elem.productOffering.id}   ${elem.productOffering.displayName}`,
              };
            }),
            null,
            "\t"
          );
          expect(
            success.response.body.cartItem.length,
            `Expecting some offers to be returned \n${scText}`
          ).toBeGreaterThan(0);
          const secureItem = btapi.getByParent(
            "id",
            secureOffer,
            success.response.body.cartItem
          );
          expect(
            secureItem,
            `Security offer (${secureOffer}) should be present in response\n${scText}`
          ).not.toBeNull();
          const commitmentItem = btapi.getByParent(
            "id",
            commitmentOffer,
            success.response.body.cartItem
          );
          expect(
            commitmentItem,
            `Commitment offer (${commitmentOffer}) should be present in response\n${scText}`
          ).not.toBeNull();
          const livingWellItem = btapi.getByParent(
            "id",
            lwOffer,
            success.response.body.cartItem
          );
          expect(
            livingWellItem,
            `Living Well offer (${lwOffer}) should be present in response\n${scText}`
          ).not.toBeNull();
          success.response.body.cartItem.forEach(function (cartItem) {
            if (cartItem.productOffering === secureItem) {
              secureItemId = cartItem.id;
            } else if (cartItem.productOffering === workOffer) {
              woItemId = cartItem.id;
            }
          });
          shoppingCartId = success.response.body.id;
        },
        (error) => {
          expect(
            true,
            `Error response is received\n${JSON.stringify(error, null, "\t")}`
          ).toBe(false);
        }
      );
    TestResult.storeOutputToDataSetResult(caseResult, datasetindex, response);

    const step3PurchaseEquipmentTitle =
      "[Step 3] Add Purchase Flood Sensor Equipment for Home Secuirty";

    expect(
      shoppingCartId,
      "SC id should not be null, please look at the previous test\n"
    ).not.toBeNull();
    expect(
      secureItemId,
      "secureItemId should not be null, please look at the previous test\n"
    ).not.toBeNull();

    const childOfferList = [
      btapi.data.homeSecurityEquipments.floodSensorPurchase,
      btapi.data.homeSecurityEquipments.glassBreakSensonPurchase,
    ];

    body = btapi.generateShoppingCartBody.addChildOffers(
      customerId,
      customerCategory,
      distributionChannel,
      externalLocationId,
      childOfferList,
      secureItemId
    );
    logger.info(`Body for generateshoppinCart ${JSON.stringify(body)}`);

    response = await btapi
      .$requestShoppingCart(
        btapi.TYPES.updateShoppingCart(shoppingCartId),
        body
      )
      .toPromise()
      .then(
        (success) => {
          expect(
            success.response,
            `Response field should be present\n${JSON.stringify(
              success,
              null,
              "\t"
            )}`
          ).toBeDefined();
          expect(
            success.response,
            `Response field should be present\n${JSON.stringify(
              success,
              null,
              "\t"
            )}`
          ).not.toBeNull();
          expect(
            success.response.body,
            `Response field should contain body\n${JSON.stringify(
              success,
              null,
              "\t"
            )}`
          ).toBeDefined();
          expect(
            success.response.body,
            `Response field should contain body\n${JSON.stringify(
              success,
              null,
              "\t"
            )}`
          ).not.toBeNull();
          // body = success.response;
          expect(
            success.response.body.status,
            `SC should have OPEN status\n${JSON.stringify(success, null, "\t")}`
          ).toBe("OPEN");
          expect(
            success.response.body.cartItem,
            "Response should contain cartItem\n"
          ).toBeDefined();
          expect(
            success.response.body.cartItem,
            "cartItem should not be null\n"
          ).not.toBeNull();
          const scText = JSON.stringify(
            success.response.body.cartItem.map(
              (elem) => {
                return {
                  id: `${elem.productOffering.id}   ${elem.productOffering.displayName}`,
                };
              },
              null,
              "\t"
            )
          );
          expect(
            success.response.body.cartItem.length,
            `cartItem should contain 4 items:  HS, Commetment, LW and WO\n${scText}`
          ).toBe(4);
          expect(
            success.response.body.validationErrors,
            "Validation Errors should be defined\n"
          ).toBeDefined();
          expect(
            success.response.body.validationErrors,
            `Validation Errors should be null\n${JSON.stringify(
              success.response.body.validationErrors,
              null,
              "\t"
            )}`
          ).not.toBeNull();
          let secureItem = btapi.getByParent(
            "id",
            secureOffer,
            success.response.body.cartItem
          );
          expect(
            secureItemId,
            `Secure offer (${secureOffer}) should be present in response as 2 equipments were added.\n${scText}`
          ).not.toBeNull();
          success.response.body.cartItem.forEach(function (item) {
            const { product } = item;
            expect(
              item.product.place[0].id,
              `Place ID under ${product.displayName} top offer should be the same like Place ID in request\n`
            ).toBe(externalLocationId);
            expect(
              item.action,
              `Action for offer ${product.displayName} should be "Add"\n`
            ).toBe("Add");
            expect(
              product.characteristics.length,
              `Characteristics for offer ${product.displayName} should be present\n`
            ).not.toBe(0);
            item.productOffering.id == secureOffer ? (secureItem = item) : null;
            if (item.productOffering.id == workOffer) {
              woItemId = item.id;
            }
          });

          const expChildren = [
            btapi.data.homeSecurityEquipments.floodSensorPurchase,
            btapi.data.homeSecurityEquipments.glassBreakSensonPurchase,
          ];
          const actChildren = [];
          secureItem.cartItem.forEach(function (childItem) {
            const childProduct = childItem.productOffering;
            actChildren.push(childProduct.id);
            expect(
              childItem.action,
              `Action for offer ${childProduct.id} should be "Add"\n`
            ).toBe("Add");
          });
          expect(
            actChildren.length,
            `\nAmount of child Items for HS(${secureOffer}) should be 2:\n ${expChildren}`
          ).toBe(7);
          expChildren.forEach((element) => {
            expect(
              actChildren.includes(element),
              `Child "${element}" for HS offer is missed in response.\n Actual children offers:\n${actChildren}`
            ).toBeTruthy();
          });
        },
        (error) => {
          expect(
            true,
            `Error response is received\n${JSON.stringify(error, null, "\t")}`
          ).toBe(false);
        }
      );

    const step4PrevProviderTitle =
      "[Step 4] Set Previous Provider for Home Securtiy (Mandatory Parameter)";
    expect.hasAssertions();
    expect(
      shoppingCartId,
      "SC id should be received from previous test"
    ).not.toBeNull();
    distributionChannel = btapi.data.distributionChannel.CSR;
    let distributionChannelName = "CSR";
    customerCategory = btapi.data.customerCategory.CONSUMER;

    let charSalesList = [
      { name: "9151790559313390133", value: null },
      { name: "9151790559313390189", value: null },
    ];

    let charList = [
      {
        name: "9152694600113929802",
        value: btapi.data.homeSecurityProviders.PalandinProvider,
      },
    ];

    body = btapi.generateShoppingCartBody.updateCharsTopItem(
      customerId,
      customerCategory,
      distributionChannel,
      externalLocationId,
      charList,
      secureItemId,
      charSalesList
    );

    await btapi
      .$requestShoppingCart(
        btapi.TYPES.updateShoppingCart(shoppingCartId),
        body
      )
      .toPromise()
      .then(
        (success) => {
          expect(
            success.response,
            `Response field should be present\n${JSON.stringify(
              success,
              null,
              "\t"
            )}`
          ).toBeDefined();
          expect(
            success.response,
            `Response field should be present\n${JSON.stringify(
              success,
              null,
              "\t"
            )}`
          ).not.toBeNull();
          expect(
            success.response.body,
            `Response should contain body\n${JSON.stringify(
              success,
              null,
              "\t"
            )}`
          ).toBeDefined();
          expect(
            success.response.body,
            `Response should contain body\n${JSON.stringify(
              success,
              null,
              "\t"
            )}`
          ).not.toBeNull();
          // body = success.response;
          expect(
            success.response.body,
            `Response should contain body\n${JSON.stringify(
              success,
              null,
              "\t"
            )}`
          ).toBeDefined();
          expect(
            success.response.body.status,
            `[FIFA-1759] Shopping cart should have OPEN status\n${JSON.stringify(
              body,
              null,
              "\t"
            )}`
          ).toBe("OPEN");
          expect(
            success.response.body.createdDateTime,
            "Response should contain createdDatetime\n"
          ).toBeDefined();
          expect(
            success.response.body.id,
            `Response should contain cart ID\n${JSON.stringify(
              body,
              null,
              "\t"
            )}`
          ).toBeDefined();
          expect(
            success.response.body.characteristic,
            `SC should contain characteristics${JSON.stringify(
              body,
              null,
              "\t"
            )}`
          ).not.toBeNull();
          expect(
            success.response.body.characteristic.length,
            `SC should contain characteristics${JSON.stringify(
              body,
              null,
              "\t"
            )}`
          ).toBeGreaterThan(0);
          expect(
            btapi.getBy(
              "name",
              "9151790559313390133",
              success.response.body.characteristic
            ),
            `SC should contain characteristic "9151790559313390133"\n${JSON.stringify(
              success.response.body.characteristic.map((char) => {
                return {
                  name: char.name,
                  value: char.value,
                };
              }),
              null,
              "\t"
            )}`
          ).not.toBeNull();
          expect(
            btapi.getBy(
              "name",
              "9151790559313390133",
              success.response.body.characteristic
            ).value,
            `SC should contain null value for characteristic "9151790559313390133"\n${JSON.stringify(
              success.response.body.characteristic.map((char) => {
                return {
                  name: char.name,
                  value: char.value,
                };
              }),
              null,
              "\t"
            )}`
          ).toBeNull();

          expect(
            btapi.getBy(
              "name",
              "9151790559313390189",
              success.response.body.characteristic
            ),
            `SC should contain characteristic "9151790559313390189"\n${JSON.stringify(
              success.response.body.characteristic.map((char) => {
                return {
                  name: char.name,
                  value: char.value,
                };
              }),
              null,
              "\t"
            )}`
          ).not.toBeNull();
          expect(
            btapi.getBy(
              "name",
              "9151790559313390189",
              success.response.body.characteristic
            ).value,
            `SC should contain null value for characteristic "9151790559313390189"\n${JSON.stringify(
              success.response.body.characteristic.map((char) => {
                return {
                  name: char.name,
                  value: char.value,
                };
              }),
              null,
              "\t"
            )}`
          ).toBeNull();
          let secureItem = btapi.getByParent(
            "id",
            secureOffer,
            success.response.body.cartItem
          );
          expect(
            secureItem,
            `Offer (${secureOffer}) should be present in response\n${JSON.stringify(
              success.response.body.cartItem.map((elem) => {
                return {
                  id: `${elem.productOffering.id}   ${elem.productOffering.displayName}`,
                };
              })
            )}`
          ).not.toBeNull();
          success.response.body.cartItem.forEach((item) => {
            item.productOffering.id == secureOffer ? (secureItem = item) : null;
          });
          expect(
            secureItem.product.characteristics,
            `Offer (${secureOffer}) should contain characteristics\n${JSON.stringify(
              secureItem,
              null,
              "\t"
            )}`
          ).not.toBeNull();
          expect(
            secureItem.product.characteristics.length,
            `Offer (${secureOffer}) should contain characteristics\n${JSON.stringify(
              secureItem,
              null,
              "\t"
            )}`
          ).toBeGreaterThan(0);
          expect(
            btapi.getBy(
              "name",
              "9152694600113929802",
              secureItem.product.characteristics
            ),
            `Offer (${secureOffer}) should contain characteristic 9152694600113929802\n${JSON.stringify(
              secureItem,
              null,
              "\t"
            )}`
          ).not.toBeNull();
        },
        (error) => {
          expect(
            true,
            `Error response is received\n${JSON.stringify(error, null, "\t")}`
          ).toBe(false);
        }
      );

    const step5AppointmentsTitle = "[Step 5] Get Search Available Appointments";
    response = await tapis.processSearchAvailableAppointment(
      apicfg,
      externalLocationId
    );
    let appointmentList = [];
    expect(
      response.text,
      `Response  should be present\n${JSON.stringify(
        response.text,
        null,
        "\t"
      )}`
    ).toBeDefined();
    await btapi.parseXmlResponse(response.text).then(function (success) {
      expect(
        success.Envelope.Body,
        `Response should contain body\n${JSON.stringify(success, null, "\t")}`
      ).not.toBeNull();
      expect(
        success.Envelope.Body.searchAvailableAppointmentListResponse,
        `Response should contain searchAvailableAppointmentListResponse\n${JSON.stringify(
          success,
          null,
          "\t"
        )}`
      ).not.toBeNull();
      expect(
        success.Envelope.Body.searchAvailableAppointmentListResponse
          .availableAppointmentList,
        `Response should contain availableAppointmentList\n${JSON.stringify(
          success,
          null,
          "\t"
        )}`
      ).not.toBeNull();

      appointmentList =
        success.Envelope.Body.searchAvailableAppointmentListResponse
          .availableAppointmentList;
    });

    startDate = DateUtils.convertISOstringToYYYYMMDDhhmmss(
      appointmentList[0].startDate.toString()
    );
    expect(
      new Date(startDate).getTime(),
      `startDate should be greater than current time${startDate.toString()}`
    ).toBeGreaterThan(new Date().getTime());

    endDate = DateUtils.convertISOstringToYYYYMMDDhhmmss(
      appointmentList[0].endDate.toString()
    );
    expect(
      new Date(endDate).getTime(),
      `endDate should be greater than current time${endDate.toString()}`
    ).toBeGreaterThan(new Date().getTime());

    const step6UpdateWoSoTitle =
      "[Step 6] Update WO + SO characteristics via CSR for RCA";

    expect.hasAssertions();
    expect(
      shoppingCartId,
      "SC id should be received from previous test"
    ).not.toBeNull();
    distributionChannel = btapi.data.distributionChannel.CSR;
    distributionChannelName = "CSR";
    customerCategory = btapi.data.customerCategory.CONSUMER;

    charSalesList = [
      { name: "9151790559313390133", value: null },
      { name: "9151790559313390189", value: null },
    ];

    charList = [
      {
        name: "9146582494313682120",
        value: "Test Additional Information for Technician!!!",
      },
      { name: "9146583488613682622", value: "Test Contact Name" },
      { name: "9146583560513682624", value: "6042202121" },
      { name: "9146584385713682940", value: startDate },
      { name: "9146584120013682838", value: endDate },
    ];

    body = btapi.generateShoppingCartBody.updateCharsTopItem(
      customerAccountECID,
      customerCategory,
      distributionChannel,
      externalLocationId,
      charList,
      woItemId,
      charSalesList
    );

    response = await btapi
      .$requestShoppingCart(
        btapi.TYPES.updateShoppingCart(shoppingCartId),
        body
      )
      .toPromise()
      .then(
        (success) => {
          TestResult.storeOutputToDataSetResult(
            caseResult,
            datasetindex,
            success
          );
          expect(
            success.response,
            `Response field should be present\n${JSON.stringify(
              success,
              null,
              "\t"
            )}`
          ).toBeDefined();
          expect(
            success.response,
            `Response field should be present\n${JSON.stringify(
              success,
              null,
              "\t"
            )}`
          ).not.toBeNull();
          expect(
            success.response.body,
            `Response should contain body\n${JSON.stringify(
              success,
              null,
              "\t"
            )}`
          ).toBeDefined();
          expect(
            success.response.body,
            `Response should contain body\n${JSON.stringify(
              success,
              null,
              "\t"
            )}`
          ).not.toBeNull();
          let { body } = success.response;
          expect(
            body,
            `Response should contain body\n${JSON.stringify(
              success,
              null,
              "\t"
            )}`
          ).toBeDefined();
          expect(
            body.status,
            `Shopping cart should have OPEN status\n${JSON.stringify(
              body,
              null,
              "\t"
            )}`
          ).toBe("OPEN");
          expect(
            body.createdDateTime,
            "Response should contain createdDatetime\n"
          ).toBeDefined();
          expect(
            body.id,
            `Response should contain cart ID\n${JSON.stringify(
              body,
              null,
              "\t"
            )}`
          ).toBeDefined();
          expect(
            body.characteristic,
            `SC should contain characteristics${JSON.stringify(
              body,
              null,
              "\t"
            )}`
          ).not.toBeNull();
          expect(
            body.characteristic.length,
            `SC should contain characteristics${JSON.stringify(
              body,
              null,
              "\t"
            )}`
          ).toBeGreaterThan(0);
          expect(
            btapi.getBy("name", "9151790559313390133", body.characteristic),
            `SC should contain characteristic "9151790559313390133"\n${JSON.stringify(
              body.characteristic.map((char) => {
                return {
                  name: char.name,
                  value: char.value,
                };
              }),
              null,
              "\t"
            )}`
          ).not.toBeNull();
          expect(
            btapi.getBy("name", "9151790559313390133", body.characteristic)
              .value,
            `SC should contain null value for characteristic "9151790559313390133"\n${JSON.stringify(
              body.characteristic.map((char) => {
                return {
                  name: char.name,
                  value: char.value,
                };
              }),
              null,
              "\t"
            )}`
          ).toBeNull();

          expect(
            btapi.getBy("name", "9151790559313390189", body.characteristic),
            `SC should contain characteristic "9151790559313390189"\n${JSON.stringify(
              body.characteristic.map((char) => {
                return {
                  name: char.name,
                  value: char.value,
                };
              }),
              null,
              "\t"
            )}`
          ).not.toBeNull();
          expect(
            btapi.getBy("name", "9151790559313390189", body.characteristic)
              .value,
            `SC should contain null value for characteristic "9151790559313390189"\n${JSON.stringify(
              body.characteristic.map((char) => {
                return {
                  name: char.name,
                  value: char.value,
                };
              }),
              null,
              "\t"
            )}`
          ).toBeNull();
          let workOfferItem = btapi.getByParent("id", workOffer, body.cartItem);
          expect(
            workOfferItem,
            `Offer (${workOfferItem}) should be present in response\n${JSON.stringify(
              body.cartItem.map((elem) => {
                return {
                  id:
                    elem.productOffering.id +
                    "   " +
                    elem.productOffering.displayName,
                };
              })
            )}`
          ).not.toBeNull();
          body.cartItem.forEach((item) => {
            item.productOffering.id == workOffer
              ? (workOfferItem = item)
              : null;
          });
          expect(
            workOfferItem.product.characteristics,
            `Offer (${workOfferItem}) should contain characteristics\n${JSON.stringify(
              workOfferItem,
              null,
              "\t"
            )}`
          ).not.toBeNull();
          expect(
            workOfferItem.product.characteristics.length,
            `Offer (${workOfferItem}) should contain characteristics\n${JSON.stringify(
              workOfferItem,
              null,
              "\t"
            )}`
          ).toBeGreaterThan(0);
          expect(
            btapi.getBy(
              "name",
              "9146582494313682120",
              workOfferItem.product.characteristics
            ),
            `Offer (${
              workOfferItem.productOffering.idItem
            }) should contain characteristic 9146582494313682120\n${JSON.stringify(
              workOfferItem,
              null,
              "\t"
            )}`
          ).not.toBeNull();
          expect(
            btapi.getBy(
              "name",
              "9146582494313682120",
              workOfferItem.product.characteristics
            ).value,
            `Offer (${
              workOfferItem.productOffering.id
            }) should contain characteristic 9146582494313682120\n${JSON.stringify(
              workOfferItem,
              null,
              "\t"
            )}`
          ).not.toBeNull();

          expect(
            btapi.getBy(
              "name",
              "9146583488613682622",
              workOfferItem.product.characteristics
            ),
            `Offer (${
              workOfferItem.productOffering.id
            }) should contain characteristic 9146583488613682622\n${JSON.stringify(
              workOfferItem,
              null,
              "\t"
            )}`
          ).not.toBeNull();
          expect(
            btapi.getBy(
              "name",
              "9146583488613682622",
              workOfferItem.product.characteristics
            ).value,
            `Offer (${
              workOfferItem.productOffering.id
            }) should contain characteristic 9146583488613682622\n${JSON.stringify(
              workOfferItem,
              null,
              "\t"
            )}`
          ).not.toBeNull();

          expect(
            btapi.getBy(
              "name",
              "9146583560513682624",
              workOfferItem.product.characteristics
            ),
            `Offer (${
              workOfferItem.productOffering.id
            }) should contain characteristic 9146583560513682624\n${JSON.stringify(
              workOfferItem,
              null,
              "\t"
            )}`
          ).not.toBeNull();
          expect(
            btapi.getBy(
              "name",
              "9146583560513682624",
              workOfferItem.product.characteristics
            ).value,
            `Offer (${
              workOfferItem.productOffering.id
            }) should contain characteristic 9146583560513682624\n${JSON.stringify(
              workOfferItem,
              null,
              "\t"
            )}`
          ).not.toBeNull();

          expect(
            btapi.getBy(
              "name",
              "9146584385713682940",
              workOfferItem.product.characteristics
            ),
            `Offer (${
              workOfferItem.productOffering.id
            }) should contain characteristic 9146584385713682940\n${JSON.stringify(
              workOfferItem,
              null,
              "\t"
            )}`
          ).not.toBeNull();
          expect(
            btapi.getBy(
              "name",
              "9146584385713682940",
              workOfferItem.product.characteristics
            ).value,
            `Offer (${
              workOfferItem.productOffering.id
            }) should contain characteristic 9146584385713682940\n${JSON.stringify(
              workOfferItem,
              null,
              "\t"
            )}`
          ).not.toBeNull();

          expect(
            btapi.getBy(
              "name",
              "9146584120013682838",
              workOfferItem.product.characteristics
            ),
            `Offer (${
              workOfferItem.productOffering.id
            }) should contain characteristic 9146584120013682838\n${JSON.stringify(
              workOfferItem,
              null,
              "\t"
            )}`
          ).not.toBeNull();
          expect(
            btapi.getBy(
              "name",
              "9146584120013682838",
              workOfferItem.product.characteristics
            ).value,
            `Offer (${
              workOfferItem.productOffering.id
            }) should contain characteristic 9146584120013682838\n${JSON.stringify(
              workOfferItem,
              null,
              "\t"
            )}`
          ).not.toBeNull();
        },
        (error) => {
          TestResult.storeOutputToDataSetResult(
            caseResult,
            datasetindex,
            error
          );
          expect(
            true,
            `Error response is received\n${JSON.stringify(error, null, "\t")}`
          ).toBe(false);
        }
      );

    const step6ValidateScTitle = "[Step 6] Validate SC via SSP for RCA";
    expect.hasAssertions();

    expect(
      shoppingCartId,
      "SC id should not be null, please look at the previous test\n"
    ).not.toBeNull();

    body = bodySamples.validateOrSubmitBody(
      customerCategory,
      distributionChannel
    );

    await btapi
      .$requestShoppingCart(
        btapi.TYPES.validateShoppingCart(shoppingCartId),
        body
      )
      .toPromise()
      .then(
        (success) => {
          expect(
            success.response,
            `Response field should be present\n${JSON.stringify(
              success,
              null,
              "\t"
            )}`
          ).toBeDefined();
          expect(
            success.response,
            `Response field should be present\n${JSON.stringify(
              success,
              null,
              "\t"
            )}`
          ).not.toBeNull();
          expect(
            success.response.body,
            `Response should contain body\n${JSON.stringify(
              success,
              null,
              "\t"
            )}`
          ).toBeDefined();
          expect(
            success.response.body,
            `Response should contain body\n${JSON.stringify(
              success,
              null,
              "\t"
            )}`
          ).not.toBeNull();
          body = success.response.body;
          const responseText = JSON.stringify(success, null, "\t");
          expect(
            success.response.body,
            `Response should contain body\n${responseText}`
          ).toBeDefined();
          expect(
            success.response.body.status,
            `SC should have OPEN status\n${responseText}`
          ).toBe("OPEN");
          expect(
            success.response.body.cartItem,
            `Response should contain cartItem\n${responseText}`
          ).toBeDefined();
          expect(
            success.response.body.cartItem.length,
            `cartItem should not be empty - HS, LW and WO\n${JSON.stringify(
              success.response.body.cartItem.map((elem) => {
                return {
                  id: `${elem.productOffering.id}   ${elem.productOffering.displayName}`,
                };
              })
            )}`
          ).toBeGreaterThan(0);

          expect(
            success.response.body.version,
            `Cart version should be defined \n${JSON.stringify(
              success.response.body,
              function (key, value) {
                return key && value && typeof value !== "number"
                  ? Array.isArray(value)
                    ? "[object Array]"
                    : `${value}`
                  : value;
              },
              "\t"
            )}`
          ).toBeDefined();
          expect(
            parseFloat(success.response.body.version),
            "Cart version should be greater than 0 as we are on \n"
          ).toBeGreaterThan(0);
          cartVersionBeforeSubmit = success.response.body.version;
          console.log(
            `Cart Id : ${cartVersionBeforeSubmit}cart Version Before Submit : ${cartVersionBeforeSubmit}`
          );
        },
        (error) => {
          expect(
            true,
            `Error response is received\n${JSON.stringify(error, null, "\t")}`
          ).toBe(false);
        }
      );

    const stepSubmitTitle = "Submit SC via SSP for RCA";
    expect.hasAssertions();
    expect(
      shoppingCartId,
      "SC id should not be null, please look at the previous test\n"
    ).not.toBeNull();

    body = bodySamples.validateOrSubmitBody(
      customerCategory,
      distributionChannel
    );

    await btapi
      .$requestShoppingCart(
        btapi.TYPES.submitShoppingCart(shoppingCartId),
        body
      )
      .toPromise()
      .then(
        (success) => {
          expect(
            success.response,
            `Response field should be present\n${JSON.stringify(
              success,
              null,
              "\t"
            )}`
          ).toBeDefined();
          expect(
            success.response,
            `Response field should be present\n${JSON.stringify(
              success,
              null,
              "\t"
            )}`
          ).not.toBeNull();
          expect(
            success.response.body,
            `Response should contain body\n${JSON.stringify(
              success,
              null,
              "\t"
            )}`
          ).toBeDefined();
          expect(
            success.response.body,
            `Response should contain body\n${JSON.stringify(
              success,
              null,
              "\t"
            )}`
          ).not.toBeNull();
          body = success.response.body;
          const responseText = JSON.stringify(success, null, "\t");
          expect(
            success.response.body.id,
            `SalesOrderId should be defined\n${responseText}`
          ).toBeDefined();
          expect(
            success.response.body.id,
            `SalesOrderId should not be null\n${responseText}`
          ).not.toBe(null);
        },
        (error) => {
          expect(
            true,
            `Error response is received\n${JSON.stringify(error, null, "\t")}`
          ).toBe(false);
        }
      );

    let imgPath;
    caseResult.datasets[datasetindex].result = TestResultStatus.Pass;
    caseResult.datasets[datasetindex].screenshotLocation = imgPath;

    //await sel.quit();
    return "success";
  } catch (err) {
    logger.error(err);
    let imgPath;
    caseResult.datasets[datasetindex].error = err;
    caseResult.datasets[datasetindex].screenshotLocation = imgPath;
    throw err;
  }
}
