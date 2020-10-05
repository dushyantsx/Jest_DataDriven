const { Promise } = require("bluebird");
const { TestResultStatus } = require("../../../src/globals/enumerations");

const btapi = require("../../../src/bt-api/btapi");
const bodySamples = require("../../../src/bt-api/bodySamples");
const logger = require("../../../src/logger/Logger");
const TelusApis = require("../../../src/utils/telus-apis/TelusApis");
const config = require("../../../br-config");
const DateUtils = require("../../../src/utils/common/DateUtils");
const ExcelUtils = require("../../../src/utils/excel/excelUtils");
const FileSystem = require("../../../src/utils/common/FileSystem");
const FileWriter = require("../../../src/utils/common/FileWriter");
const DataReader = require("../../../src/sel-js/DataReader");
const TestResult = require("../../../src/globals/results/TestResult");
const TestIdsMap = require("../../../src/globals/TestIdsMap");
const { Validator } = require("../../../src/globals/TestObjects");

const tapis = new TelusApis();

const testId = TestIdsMap.ApiProvide1HsTechTestId;
const valFile = "shs-and-lw-test-scenarios";
const tval = new Validator();

const envcfg = config.getConfigForGivenEnv();
const apicfg = config.getTelusApisConfig(envcfg);
const eu = new ExcelUtils();
const dr = new DataReader();
const configDataAsset = config.getTestDataAssetsForGivenTestId(envcfg, testId);
const sheetDataAsJsonArray = eu.sheetOnNameAsJsonArray(
  configDataAsset.dataFile,
  configDataAsset.dataSheet
);
const dsTestCases = new Array(sheetDataAsJsonArray.length);
for (let ind = 0; ind < sheetDataAsJsonArray.length; ind++) {
  dsTestCases[ind] = [];
}

// eslint-disable-next-line no-console
console.table(sheetDataAsJsonArray);

/**
 * @type TestCaseResultObject
 */
let caseResult;
const testName =
  "Provide-2: Provide SHS; Product: Home Security 60 Months; Techniocian Install";
describe(testName, () => {
  let shoppingCartId = null;
  let woItemId = null;
  let secureItemId = null;
  let isValEnabled;

  const secureOffer = btapi.data.offers.smartHomeSecuritySecure;
  const commitmentOffer =
    btapi.data.offers.homeSecurityCommitmentOn36MonthContract;
  const lwOffer = btapi.data.offers.livingWellCompanionHome;

  const { workOffer } = btapi.data.offers;
  const distributionChannel = btapi.data.distributionChannel.CSR;
  const customerCategory = btapi.data.customerCategory.CONSUMER;

  let cartVersionBeforeSubmit = null;

  let startDate = null;
  let endDate = null;

  beforeAll(() => {
    logger.enterMethod("beforeAll Provide-1");
    caseResult = TestResult.TestCaseResult(testId, testName);

    logger.exitMethod("beforeAll Provide-1");
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

    logger.exitMethod("afterAll");
  });

  const step1CreateNewRCA = async (datasetIndex, stepNum) => {
    const stepResult = {};
    stepResult.title = "[Step1] Create new RCA via SSP";
    stepResult.datasetIndex = datasetIndex;
    stepResult.stepNum = stepNum;

    const stepData = dr.getDataSetObject(datasetIndex);

    const customerEmail = dr.getDataSetKeyValue(stepData, "input", "email");
    const externalLocationId = dr.getDataSetKeyValue(
      stepData,
      "input",
      "externalLocationId"
    );
    const body = bodySamples.createCustomerBody(
      externalLocationId,
      customerEmail
    );

    const result = {};
    result.reqBody = body;
    return btapi
      .verifyCreateCustomerAccountTBAPI(body)
      .then(
        (success) => {
          stepResult.result = success;
          expect(
            success,
            `Customer account should have been created successfully\n${JSON.stringify(
              success,
              null,
              "\t"
            )}`
          ).not.toBe(null);

          const customerAccEcId = success.externalCustomerId;
          isValEnabled = tval.isValidationEnabled(
            valFile,
            testId,
            "validate-customer-registered"
          );
          if (isValEnabled) {
            logger.debug(`Validating customer-regristration`);
            expect(customerAccEcId).not.toBeNull();
            expect(customerAccEcId).not.toBeUndefined();
            result.customerExternalId = customerAccEcId;
          }
        },
        (error) => {
          stepResult.error = error;
          expect(
            true,
            `Error in creating Customer Account${JSON.stringify(
              error,
              null,
              "\t"
            )}`
          ).toBe(false);
        }
      )
      .finally(() => {
        stepResult.result = result;
        dsTestCases[datasetIndex].push(stepResult);
      });
  };

  const step2CreateShsCommitmentLw = async (datasetIndex, stepNum) => {
    const stepResult = {};
    stepResult.title =
      "[Step 2] Create assigned SC with SHS+Commitment+LW via CSR for RCA";
    stepResult.datasetIndex = datasetIndex;
    stepResult.stepNum = stepNum;

    const offerList = [secureOffer, commitmentOffer, lwOffer];

    const customerAccEcId =
      caseResult.datasets[datasetIndex].response[0].result.customerExternalId;
    const { externalLocationId } = caseResult.datasets[
      datasetIndex
    ].response[0].result.reqBody;
    //let body = btapi.generateShoppingCartBody.addTopOffers(customerAccountECID, customerCategory, distributionChannel, externalLocationId, offerList)
    const body = btapi.generateShoppingCartBody.addTopOffers(
      customerAccEcId,
      customerCategory,
      distributionChannel,
      externalLocationId,
      offerList
    );

    const result = {};
    result.reqBody = body;
    return btapi
      .$requestShoppingCart(btapi.TYPES.createShoppingCart(), body)
      .toPromise()
      .then(
        (success) => {
          stepResult.result = success;
          expect(success, "Response should not be empty\n").not.toBeNull();
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
          const { body } = success.response;
          const responseText = JSON.stringify(success, null, "\t");
          result.statusCode = success.response.statusCode;
          expect(
            success.response.statusCode,
            `statusCode should be 201${JSON.stringify(success, null, "\t")}`
          ).toBe(201);
          result.status = body.status;
          expect(
            body.status,
            `SC should have OPEN status\n${responseText}`
          ).toBe("OPEN");
          result.cartItem = body.cartItem;
          expect(
            body.cartItem,
            `Response should contain cartItem\n${responseText}`
          ).toBeDefined();
          expect(
            body.cartItem,
            `cartItem should not be null\n${responseText}`
          ).not.toBeNull();
          const scText = JSON.stringify(
            body.cartItem.map((elem) => {
              return {
                id: `${elem.productOffering.id}   ${elem.productOffering.displayName}`,
              };
            }),
            null,
            "\t"
          );
          result.offersReturned = scText;
          expect(
            body.cartItem.length,
            `Expecting some offers to be returned \n${scText}`
          ).toBeGreaterThan(0);
          const secureItem = btapi.getByParent(
            "id",
            secureOffer,
            body.cartItem
          );
          result.secureItem = secureItem;
          expect(
            secureItem,
            `Security offer (${secureOffer}) should be present in response\n${scText}`
          ).not.toBeNull();
          const commitmentItem = btapi.getByParent(
            "id",
            commitmentOffer,
            body.cartItem
          );
          result.commitmentItem = commitmentItem;
          expect(
            commitmentItem,
            `Commitment offer (${commitmentOffer}) should be present in response\n${scText}`
          ).not.toBeNull();
          const livingWellItem = btapi.getByParent(
            "id",
            lwOffer,
            body.cartItem
          );
          result.livingWellItem = livingWellItem;
          expect(
            livingWellItem,
            `Living Well offer (${lwOffer}) should be present in response\n${scText}`
          ).not.toBeNull();
          body.cartItem.forEach(function (cartItem) {
            if (cartItem.productOffering === secureItem) {
              secureItemId = cartItem.id;
            } else if (cartItem.productOffering === workOffer) {
              woItemId = cartItem.id;
            }
          });
          result.shoppingCartId = body.id;
          shoppingCartId = body.id;
        },
        (error) => {
          stepResult.error = error;
          expect(
            true,
            `Error response is received\n${JSON.stringify(error, null, "\t")}`
          ).toBe(false);
        }
      )
      .finally(() => {
        stepResult.result = result;
        dsTestCases[datasetIndex].push(stepResult);
      });
  };

  const step3PurchaseEquipment = async (datasetIndex, stepNum) => {
    const stepResult = {};
    stepResult.title = `[Step 3] Add Purchase Flood Sensor Equipment for Home Security in cart ${shoppingCartId}`;
    stepResult.datasetIndex = datasetIndex;
    stepResult.stepNum = stepNum;

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

    const customerAccEcId =
      caseResult.datasets[datasetIndex].response[0].result.customerExternalId;
    const { externalLocationId } = caseResult.datasets[
      datasetIndex
    ].response[0].result.reqBody;
    //let body = btapi.generateShoppingCartBody.addChildOffers(customerAccountECID, customerCategory, distributionChannel, externalLocationId, childOfferList, secureItemId);
    const body = btapi.generateShoppingCartBody.addChildOffers(
      customerAccEcId,
      customerCategory,
      distributionChannel,
      externalLocationId,
      childOfferList,
      secureItemId
    );

    const result = {};
    result.reqBody = body;
    return btapi
      .$requestShoppingCart(
        btapi.TYPES.updateShoppingCart(shoppingCartId),
        body
      )
      .toPromise()
      .then(
        (success) => {
          stepResult.result = success;
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
          const { body } = success.response;
          result.status = body.status;
          expect(
            body.status,
            `SC should have OPEN status\n${JSON.stringify(success, null, "\t")}`
          ).toBe("OPEN");
          result.cartItem = body.cartItem;
          expect(
            body.cartItem,
            "Response should contain cartItem\n"
          ).toBeDefined();
          expect(body.cartItem, "cartItem should not be null\n").not.toBeNull();
          const scText = JSON.stringify(
            body.cartItem.map(
              (elem) => {
                return {
                  id: `${elem.productOffering.id}   ${elem.productOffering.displayName}`,
                };
              },
              null,
              "\t"
            )
          );
          result.cartItemsInShoppingCart = scText;
          expect(
            body.cartItem.length,
            `cartItem should contain 4 items:  HS, Commetment, LW and WO\n${scText}`
          ).toBe(4);
          expect(
            body.validationErrors,
            "Validation Errors should be defined\n"
          ).toBeDefined();
          expect(
            body.validationErrors,
            `Validation Errors should be null\n${JSON.stringify(
              body.validationErrors,
              null,
              "\t"
            )}`
          ).not.toBeNull();
          let secureItem = btapi.getByParent("id", secureOffer, body.cartItem);
          expect(
            secureItemId,
            `Secure offer (${secureOffer}) should be present in response as 2 equipments were added.\n${scText}`
          ).not.toBeNull();
          body.cartItem.forEach(function (item) {
            const { product } = item;
            // expect(
            //   item.product.place[0].id,
            //   `Place ID under ${product.displayName} top offer should be the same like Place ID in request\n`
            // ).toBe(externalLocationId);
            expect(
              item.action,
              `Action for offer ${product.displayName} should be "Add"\n`
            ).toBe("Add");
            expect(
              product.characteristics.length,
              `Characteristics for offer ${product.displayName} should be present\n`
            ).not.toBe(0);
            item.productOffering.id == secureOffer ? (secureItem = item) : null;
            if (item.productOffering.id === workOffer) {
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
          stepResult.error = error;
          expect(
            true,
            `Error response is received\n${JSON.stringify(error, null, "\t")}`
          ).toBe(false);
        }
      )
      .finally(() => {
        stepResult.result = result;
        dsTestCases[datasetIndex].push(stepResult);
      });
  };

  const step4PrevProvider = async (datasetIndex, stepNum) => {
    const stepResult = {};
    stepResult.title =
      "[Step 4] Set Previous Provider for Home Securtiy (Mandatory Parameter)";
    stepResult.datasetIndex = datasetIndex;
    stepResult.stepNum = stepNum;

    expect.hasAssertions();
    expect(
      shoppingCartId,
      "SC id should be received from previous test"
    ).not.toBeNull();
    let distributionChannel = btapi.data.distributionChannel.CSR;
    let customerCategory = btapi.data.customerCategory.CONSUMER;

    const charSalesList = [
      { name: "9151790559313390133", value: null },
      { name: "9151790559313390189", value: null },
    ];

    const charList = [
      {
        name: "9152694600113929802",
        value: btapi.data.homeSecurityProviders.PalandinProvider,
      },
    ];

    const customerAccEcId =
      caseResult.datasets[datasetIndex].response[0].result.customerExternalId;
    const { externalLocationId } = caseResult.datasets[
      datasetIndex
    ].response[0].result.reqBody;
    //let body = btapi.generateShoppingCartBody.updateCharsTopItem(customerAccountECID, customerCategory, distributionChannel, externalLocationId, charList, secureItemId, charSalesList)
    const body = btapi.generateShoppingCartBody.updateCharsTopItem(
      customerAccEcId,
      customerCategory,
      distributionChannel,
      externalLocationId,
      charList,
      secureItemId,
      charSalesList
    );

    const result = {};
    result.reqBody = body;
    return btapi
      .$requestShoppingCart(
        btapi.TYPES.updateShoppingCart(shoppingCartId),
        body
      )
      .toPromise()
      .then(
        (success) => {
          stepResult.result = success;
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
          result.status = body.status;
          expect(
            body.status,
            `[FIFA-1759] Shopping cart should have OPEN status\n${JSON.stringify(
              body,
              null,
              "\t"
            )}`
          ).toBe("OPEN");
          result.createdDateTime = body.createdDateTime;
          expect(
            body.createdDateTime,
            "Response should contain createdDatetime\n"
          ).toBeDefined();
          result.cartId = body.id;
          expect(
            body.id,
            `Response should contain cart ID\n${JSON.stringify(
              body,
              null,
              "\t"
            )}`
          ).toBeDefined();
          result.characteristic = body.characteristic;
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
          result.cartItem = body.cartItem;
          let secureItem = btapi.getByParent("id", secureOffer, body.cartItem);
          expect(
            secureItem,
            `Offer (${secureOffer}) should be present in response\n${JSON.stringify(
              body.cartItem.map((elem) => {
                return {
                  id: `${elem.productOffering.id}   ${elem.productOffering.displayName}`,
                };
              })
            )}`
          ).not.toBeNull();
          body.cartItem.forEach((item) => {
            item.productOffering.id === secureOffer
              ? (secureItem = item)
              : null;
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
          stepResult.error = error;
          expect(
            true,
            `Error response is received\n${JSON.stringify(error, null, "\t")}`
          ).toBe(false);
        }
      )
      .finally(() => {
        stepResult.result = result;
        dsTestCases[datasetIndex].push(stepResult);
      });
  };

  const step5Appointments = async (datasetIndex, stepNum) => {
    const stepResult = {};
    stepResult.title = "[Step 5] Get Search Available Appointments";
    stepResult.datasetIndex = datasetIndex;
    stepResult.stepNum = stepNum;

    const { externalLocationId } = caseResult.datasets[
      datasetIndex
    ].response[0].result.reqBody;

    const result = {};
    result.reqBody = { apicfg: apicfg, externalLocationId: externalLocationId };
    const response = await tapis.processSearchAvailableAppointment(
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
    await btapi
      .parseXmlResponse(response.text)
      .then(function (success) {
        stepResult.result = success;
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
        result.appointmentList = appointmentList;
      })
      .finally(() => {
        stepResult.result = result;
        dsTestCases[datasetIndex].push(stepResult);
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
  };

  const step6UpdateWoSo = async (datasetIndex, stepNum) => {
    const stepResult = {};
    stepResult.title =
      "[Step 6] Update WO + SO characteristics via CSR for RCA";
    stepResult.datasetIndex = datasetIndex;
    stepResult.stepNum = stepNum;

    expect.hasAssertions();
    expect(
      shoppingCartId,
      "SC id should be received from previous test"
    ).not.toBeNull();
    let distributionChannel = btapi.data.distributionChannel.CSR;
    let customerCategory = btapi.data.customerCategory.CONSUMER;

    const charSalesList = [
      { name: "9151790559313390133", value: null },
      { name: "9151790559313390189", value: null },
    ];

    const charList = [
      {
        name: "9146582494313682120",
        value: "Test Additional Information for Technician!!!",
      },
      { name: "9146583488613682622", value: "Test Contact Name" },
      { name: "9146583560513682624", value: "6042202121" },
      { name: "9146584385713682940", value: startDate },
      { name: "9146584120013682838", value: endDate },
    ];

    const customerAccEcId =
      caseResult.datasets[datasetIndex].response[0].result.customerExternalId;
    const { externalLocationId } = caseResult.datasets[
      datasetIndex
    ].response[0].result.reqBody;
    const body = btapi.generateShoppingCartBody.updateCharsTopItem(
      customerAccEcId,
      customerCategory,
      distributionChannel,
      externalLocationId,
      charList,
      woItemId,
      charSalesList
    );
    //let body = btapi.generateShoppingCartBody.updateCharsTopItem(customerAccountECID, customerCategory, distributionChannel, externalLocationId, charList, woItemId, charSalesList)

    const result = {};
    result.reqBody = body;
    return btapi
      .$requestShoppingCart(
        btapi.TYPES.updateShoppingCart(shoppingCartId),
        body
      )
      .toPromise()
      .then(
        (success) => {
          stepResult.result = success;
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
          result.status = body.status;
          expect(
            body.status,
            `Shopping cart should have OPEN status\n${JSON.stringify(
              body,
              null,
              "\t"
            )}`
          ).toBe("OPEN");
          result.createdDateTime = body.createdDateTime;
          expect(
            body.createdDateTime,
            "Response should contain createdDatetime\n"
          ).toBeDefined();
          result.cartId = body.id;
          expect(
            body.id,
            `Response should contain cart ID\n${JSON.stringify(
              body,
              null,
              "\t"
            )}`
          ).toBeDefined();
          result.characteristic = body.characteristic;
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
          result.cartItem = body.cartItem;
          let workOfferItem = btapi.getByParent("id", workOffer, body.cartItem);
          result.workOfferItem = workOfferItem;
          expect(
            workOfferItem,
            `Offer (${workOfferItem}) should be present in response\n${JSON.stringify(
              body.cartItem.map((elem) => {
                return {
                  id: `${elem.productOffering.id}   ${elem.productOffering.displayName}`,
                };
              })
            )}`
          ).not.toBeNull();
          body.cartItem.forEach((item) => {
            item.productOffering.id === workOffer
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
          stepResult.error = error;
          expect(
            true,
            `Error response is received\n${JSON.stringify(error, null, "\t")}`
          ).toBe(false);
        }
      )
      .finally(() => {
        stepResult.result = result;
        dsTestCases[datasetIndex].push(stepResult);
      });
  };

  const step6ValidateSc = async (datasetIndex, stepNum) => {
    const stepResult = {};
    stepResult.title = "[Step 6] Validate SC via SSP for RCA";
    stepResult.datasetIndex = datasetIndex;
    stepResult.stepNum = stepNum;

    expect.hasAssertions();
    expect(
      shoppingCartId,
      "SC id should not be null, please look at the previous test\n"
    ).not.toBeNull();

    const body = bodySamples.validateOrSubmitBody(
      customerCategory,
      distributionChannel
    );

    const result = {};
    result.reqBody = body;
    return btapi
      .$requestShoppingCart(
        btapi.TYPES.validateShoppingCart(shoppingCartId),
        body
      )
      .toPromise()
      .then(
        (success) => {
          stepResult.result = success;
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
          const { body } = success.response;
          const responseText = JSON.stringify(success, null, "\t");
          expect(
            body,
            `Response should contain body\n${responseText}`
          ).toBeDefined();
          result.status = body.status;
          expect(
            body.status,
            `SC should have OPEN status\n${responseText}`
          ).toBe("OPEN");
          result.cartItem = body.cartItem;
          expect(
            body.cartItem,
            `Response should contain cartItem\n${responseText}`
          ).toBeDefined();
          expect(
            body.cartItem.length,
            `cartItem should not be empty - HS, LW and WO\n${JSON.stringify(
              body.cartItem.map((elem) => {
                return {
                  id: `${elem.productOffering.id}   ${elem.productOffering.displayName}`,
                };
              })
            )}`
          ).toBeGreaterThan(0);

          expect(
            body.version,
            `Cart version should be defined \n${JSON.stringify(
              body,
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
            parseFloat(body.version),
            "Cart version should be greater than 0 as we are on \n"
          ).toBeGreaterThan(0);
          cartVersionBeforeSubmit = body.version;
          logger.debug(
            `Cart Id : ${cartVersionBeforeSubmit} cart Version Before Submit : ${cartVersionBeforeSubmit}`
          );
        },
        (error) => {
          stepResult.error = error;
          expect(
            true,
            `Error response is received\n${JSON.stringify(error, null, "\t")}`
          ).toBe(false);
        }
      )
      .finally(() => {
        stepResult.result = result;
        dsTestCases[datasetIndex].push(stepResult);
      });
  };

  const stepSubmit = async (datasetIndex, stepNum) => {
    const customerAccEcId =
      caseResult.datasets[datasetIndex].response[0].result.customerExternalId;
    const stepResult = {};
    stepResult.title = `Submit SC  ${shoppingCartId} via SSP for RCA ${customerAccEcId}`;
    stepResult.datasetIndex = datasetIndex;
    stepResult.stepNum = stepNum;

    expect.hasAssertions();
    expect(
      shoppingCartId,
      "SC id should not be null, please look at the previous test\n"
    ).not.toBeNull();

    const body = bodySamples.validateOrSubmitBody(
      customerCategory,
      distributionChannel
    );

    const result = {};
    result.reqBody = body;
    return btapi
      .$requestShoppingCart(
        btapi.TYPES.submitShoppingCart(shoppingCartId),
        body
      )
      .toPromise()
      .then(
        (success) => {
          stepResult.result = success;
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
          const { body } = success.response;
          const responseText = JSON.stringify(success, null, "\t");
          result.SaleOrderId = body.id;
          expect(
            body.id,
            `SalesOrderId should be defined\n${responseText}`
          ).toBeDefined();
          expect(
            body.id,
            `SalesOrderId should not be null\n${responseText}`
          ).not.toBe(null);
        },
        (error) => {
          stepResult.error = error;
          expect(
            true,
            `Error response is received\n${JSON.stringify(error, null, "\t")}`
          ).toBe(false);
        }
      )
      .finally(() => {
        stepResult.result = result;
        dsTestCases[datasetIndex].push(stepResult);
      });
  };

  const testCase = async (datasetIndex) => {
    const singleJsonRowObject = sheetDataAsJsonArray[datasetIndex];
    dr.setDataSetObject(singleJsonRowObject, datasetIndex);
    const dsObj = dr.getDataSetObject(datasetIndex);
    caseResult.datasets.push(dsObj);

    let stepNum = 0;

    try {
      await step1CreateNewRCA(datasetIndex, stepNum++);
      TestResult.storeOutputToDataSetResult(
        caseResult,
        datasetIndex,
        dsTestCases[datasetIndex]
      );

      await step2CreateShsCommitmentLw(datasetIndex, stepNum++);
      TestResult.storeOutputToDataSetResult(
        caseResult,
        datasetIndex,
        dsTestCases[datasetIndex]
      );

      await step3PurchaseEquipment(datasetIndex, stepNum++);
      TestResult.storeOutputToDataSetResult(
        caseResult,
        datasetIndex,
        dsTestCases[datasetIndex]
      );

      await step4PrevProvider(datasetIndex, stepNum++);
      TestResult.storeOutputToDataSetResult(
        caseResult,
        datasetIndex,
        dsTestCases[datasetIndex]
      );

      await step5Appointments(datasetIndex, stepNum++);
      TestResult.storeOutputToDataSetResult(
        caseResult,
        datasetIndex,
        dsTestCases[datasetIndex]
      );

      await step6UpdateWoSo(datasetIndex, stepNum++);
      TestResult.storeOutputToDataSetResult(
        caseResult,
        datasetIndex,
        dsTestCases[datasetIndex]
      );

      await step6ValidateSc(datasetIndex, stepNum++);
      TestResult.storeOutputToDataSetResult(
        caseResult,
        datasetIndex,
        dsTestCases[datasetIndex]
      );

      await stepSubmit(datasetIndex, stepNum++);
      TestResult.storeOutputToDataSetResult(
        caseResult,
        datasetIndex,
        dsTestCases[datasetIndex]
      );
      caseResult.datasets[datasetIndex].result = TestResultStatus.Pass;
      return Promise.resolve();
    } catch (error) {
      caseResult.datasets[datasetIndex].result = TestResultStatus.Fail;
      TestResult.storeOutputToDataSetResult(
        caseResult,
        datasetIndex,
        dsTestCases[datasetIndex]
      );
      return Promise.reject(error);
    }
  };

  test(
    testName,
    async () => {
      const testRuns = [];

      for (let i = 0; i < sheetDataAsJsonArray.length; i++) {
        testRuns.push(await testCase(i));
      }
      return Promise.allSettled(testRuns);

      //const np = await Promise.all(promises);
      // return np;
    },
    btapi.timeout + 100000
  );
});
