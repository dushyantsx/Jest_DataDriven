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
const DbUtils = require("../../../src/utils/dbutils/DbUtils");

const tapis = new TelusApis();
const StringUtils = require("../../../src/utils/common/StringUtils");

const du = DbUtils.DbUtils;
const dq = DbUtils.DbQueries;

const envcfg = config.getConfigForGivenEnv();
const apicfg = config.getTelusApisConfig(envcfg);
const dbcfg = config.getDbConfig(envcfg);

const testId = TestIdsMap.ApiProvide1HsTechTestId;
const valFile = "shs-and-lw-test-scenarios";
const tval = new Validator();

const eu = new ExcelUtils();
const dr = new DataReader();
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
const testName =
  "Provide-2: Provide SHS; Product: Control Plus Video Home Security 36 Months; Techniocian Install";
describe(testName, () => {
  let steps;
  let shoppingCartId = null;
  let salesOrderId = null;

  let woItemId = null;
  let controlPlusVideoItemId = null;
  const customerAccountECID = null;
  let customerId = null;

  let controlplusvideoitem = null;
  let externalLocationId;
  let isValEnabled = null;

  let controlplusvideooffer =
    btapi.data.homeSecurityOffers.controlPlusVideoOffer;
  const commitmentOffer =
    btapi.data.offers.homeSecurityCommitmentOn36MonthContract;

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
    externalLocationId = dr.getDataSetKeyValue(
      stepData,
      "input",
      "externalLocationId"
    );
    const customerName = dr.getDataSetKeyValue(
      stepData,
      "input",
      "customername"
    );
    const body = bodySamples.createCustomerBody(
      customerName,
      externalLocationId,
      customerEmail
    );

    logger.info(`CreateCustomer API body:${JSON.stringify(body)}`);
    const result = {};
    result.reqBody = body;
    return btapi
      .verifyCreateCustomerAccountTBAPI(body)
      .then(
        (success) => {
          expect(
            success,
            `Customer account should have been created successfully\n${JSON.stringify(
              success,
              null,
              "\t"
            )}`
          ).not.toBe(null);
          const customerAccEcId = success.externalCustomerId;
          customerId = success.customerId;
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
            result.customerId = customerId;
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
        // Overriding step result here with meaningful response info only
        stepResult.result = result;
        steps[stepNum] = stepResult;
        TestResult.storeOutputToDataSetResult(caseResult, datasetIndex, steps);
      });
  };

  const step2CreateShsCommitmentLw = async (datasetIndex, stepNum) => {
    const stepResult = {};
    stepResult.title =
      "[Step 2] Create assigned SC with SHScontrol+Commitment via CSR for RCA";
    stepResult.datasetIndex = datasetIndex;
    stepResult.stepNum = stepNum;

    const offerList = [controlplusvideooffer, commitmentOffer];

    const customerAccEcId =
      caseResult.datasets[datasetIndex].response[0].result.customerExternalId;
    externalLocationId =
      caseResult.datasets[datasetIndex].response[0].result.reqBody
        .externalLocationId;
    //let body = btapi.generateShoppingCartBody.addTopOffers(customerAccountECID, customerCategory, distributionChannel, externalLocationId, offerList)
    const body = btapi.generateShoppingCartBody.addTopOffers(
      customerAccEcId,
      customerCategory,
      distributionChannel,
      externalLocationId,
      offerList
    );

    logger.info(`Step02: CreateSC API body:${JSON.stringify(body)}`);

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
          const body = success.response.body;
          const responseText = JSON.stringify(success, null, "\t");
          expect(
            success.response.statusCode,
            `statusCode should be 201${JSON.stringify(success, null, "\t")}`
          ).toBe(201);
          expect(
            body.status,
            `SC should have OPEN status\n${responseText}`
          ).toBe("OPEN");
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
          expect(
            body.cartItem.length,
            `Expecting some offers to be returned \n${scText}`
          ).toBeGreaterThan(0);
          controlplusvideoitem = btapi.getByParent(
            "id",
            controlplusvideooffer,
            body.cartItem
          );
          expect(
            controlplusvideoitem,
            `Security offer (${controlplusvideooffer}) should be present in response\n${scText}`
          ).not.toBeNull();
          const commitmentItem = btapi.getByParent(
            "id",
            commitmentOffer,
            body.cartItem
          );
          expect(
            commitmentItem,
            `Commitment offer (${commitmentOffer}) should be present in response\n${scText}`
          ).not.toBeNull();
          body.cartItem.forEach(function (cartItem) {
            if (cartItem.productOffering === controlplusvideoitem) {
              controlPlusVideoItemId = cartItem.id;
            } else if (cartItem.productOffering === workOffer) {
              woItemId = cartItem.id;
            }
          });
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
        // Overriding step result here with meaningful response info only
        stepResult.result = result;
        steps[stepNum] = stepResult;
        TestResult.storeOutputToDataSetResult(caseResult, datasetIndex, steps);
      });
  };

  const step3PurchaseEquipment = async (datasetIndex, stepNum) => {
    const stepResult = {};
    stepResult.title = `[Step 3] AAdd 4 Indoor and 3 Outdoor Camera Equipment for Home Secuirty ${shoppingCartId}`;
    stepResult.datasetIndex = datasetIndex;
    stepResult.stepNum = stepNum;

    expect(
      shoppingCartId,
      "SC id should not be null, please look at the previous test\n"
    ).not.toBeNull();
    expect(
      controlPlusVideoItemId,
      "controlitemid should not be null, please look at the previous test\n"
    ).not.toBeNull();

    const childOfferList = [
      btapi.data.homeSecurityEquipments.indoorCameraEasy,
      btapi.data.homeSecurityEquipments.indoorCameraEasy,
      btapi.data.homeSecurityEquipments.indoorCameraEasy,
      btapi.data.homeSecurityEquipments.indoorCameraEasy,
      btapi.data.homeSecurityEquipments.outdoorCameraEasy,
      btapi.data.homeSecurityEquipments.outdoorCameraEasy,
      btapi.data.homeSecurityEquipments.outdoorCameraEasy,
    ];

    const body = btapi.generateShoppingCartBody.addChildOffers(
      customerAccountECID,
      customerCategory,
      distributionChannel,
      externalLocationId,
      childOfferList,
      controlPlusVideoItemId
    );
    const result = {};
    return btapi
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
          const body = success.response.body;
          expect(
            body.status,
            `SC should have OPEN status\n${JSON.stringify(success, null, "\t")}`
          ).toBe("OPEN");
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
          controlplusvideoitem = btapi.getByParent(
            "id",
            controlplusvideooffer,
            body.cartItem
          );
          expect(
            controlPlusVideoItemId,
            `controlPlusVideo offer (${controlplusvideooffer}) should be present in response as 2 equipments were added.\n${scText}`
          ).not.toBeNull();
          body.cartItem.forEach(function (item) {
            const product = item.product;
            expect(
              item.product.place[0].id,
              `Place ID under ${product.displayName} top offer should be the same like Place ID in request\n`
            ).toContain(externalLocationId);
            expect(
              item.action,
              `Action for offer ${product.displayName} should be "Add"\n`
            ).toBe("Add");
            expect(
              product.characteristics.length,
              `Characteristics for offer ${product.displayName} should be present\n`
            ).not.toBe(0);
            item.productOffering.id == controlplusvideooffer
              ? (controlplusvideoitem = item)
              : null;
            if (item.productOffering.id == workOffer) {
              woItemId = item.id;
            }
          });

          const expChildren = [
            btapi.data.homeSecurityEquipments.indoorCameraEasy,
            btapi.data.homeSecurityEquipments.outdoorCameraEasy,
          ];
          const actChildren = [];
          controlplusvideoitem.cartItem.forEach(function (childItem) {
            const childProduct = childItem.productOffering;
            actChildren.push(childProduct.id);
            expect(
              childItem.action,
              `Action for offer ${childProduct.id} should be "Add"\n`
            ).toBe("Add");
          });
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
        // Overriding step result here with meaningful response info only
        stepResult.result = result;
        steps[stepNum] = stepResult;
        TestResult.storeOutputToDataSetResult(caseResult, datasetIndex, steps);
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
    const distributionChannel = btapi.data.distributionChannel.CSR;
    const customerCategory = btapi.data.customerCategory.CONSUMER;

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
    const result = {};
    const body = btapi.generateShoppingCartBody.updateCharsTopItem(
      customerAccountECID,
      customerCategory,
      distributionChannel,
      externalLocationId,
      charList,
      controlPlusVideoItemId,
      charSalesList
    );

    return btapi
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
          let body = success.response.body;
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
            `[FIFA-1759] Shopping cart should have OPEN status\n${JSON.stringify(
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
          controlplusvideoitem = btapi.getByParent(
            "id",
            controlplusvideooffer,
            body.cartItem
          );
          expect(
            controlplusvideoitem,
            `Offer (${controlplusvideooffer}) should be present in response\n${JSON.stringify(
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
            item.productOffering.id == controlplusvideooffer
              ? (controlplusvideoitem = item)
              : null;
          });
          expect(
            controlplusvideoitem.product.characteristics,
            `Offer (${controlplusvideooffer}) should contain characteristics\n${JSON.stringify(
              controlplusvideoitem,
              null,
              "\t"
            )}`
          ).not.toBeNull();
          expect(
            controlplusvideoitem.product.characteristics.length,
            `Offer (${controlplusvideooffer}) should contain characteristics\n${JSON.stringify(
              controlplusvideoitem,
              null,
              "\t"
            )}`
          ).toBeGreaterThan(0);
          expect(
            btapi.getBy(
              "name",
              "9152694600113929802",
              controlplusvideoitem.product.characteristics
            ),
            `Offer (${controlplusvideooffer}) should contain characteristic 9152694600113929802\n${JSON.stringify(
              controlplusvideoitem,
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
        // Overriding step result here with meaningful response info only
        stepResult.result = result;
        steps[stepNum] = stepResult;
        TestResult.storeOutputToDataSetResult(caseResult, datasetIndex, steps);
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
    logger.info(`External_Customer_id:${customerAccountECID}`);
    logger.info(`CUSTOMER_ID:${customerId}`);
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
      })
      .finally(() => {
        // Overriding step result here with meaningful response info only
        stepResult.result = result;
        steps[stepNum] = stepResult;
        TestResult.storeOutputToDataSetResult(caseResult, datasetIndex, steps);
      });
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
    const distributionChannel = btapi.data.distributionChannel.CSR;
    const customerCategory = btapi.data.customerCategory.CONSUMER;

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

    const body = btapi.generateShoppingCartBody.updateCharsTopItem(
      customerAccountECID,
      customerCategory,
      distributionChannel,
      externalLocationId,
      charList,
      woItemId,
      charSalesList
    );
    const result = {};
    return btapi
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
          let body = success.response.body;
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
          expect(
            true,
            `Error response is received\n${JSON.stringify(error, null, "\t")}`
          ).toBe(false);
        }
      )
      .finally(() => {
        // Overriding step result here with meaningful response info only
        stepResult.result = result;
        steps[stepNum] = stepResult;
        TestResult.storeOutputToDataSetResult(caseResult, datasetIndex, steps);
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

    const result = {};

    const body = bodySamples.validateOrSubmitBody(
      customerCategory,
      distributionChannel
    );

    return btapi
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
          const body = success.response.body;
          const responseText = JSON.stringify(success, null, "\t");
          expect(
            body,
            `Response should contain body\n${responseText}`
          ).toBeDefined();
          expect(
            body.status,
            `SC should have OPEN status\n${responseText}`
          ).toBe("OPEN");
          expect(
            body.cartItem,
            `Response should contain cartItem\n${responseText}`
          ).toBeDefined();
          expect(
            body.cartItem.length,
            `cartItem should not be empty - HS, LW and WO\n${JSON.stringify(
              body.cartItem.map((elem) => {
                return {
                  id:
                    elem.productOffering.id +
                    "   " +
                    elem.productOffering.displayName,
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
                    : "" + value
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
      )
      .finally(() => {
        // Overriding step result here with meaningful response info only
        stepResult.result = result;
        steps[stepNum] = stepResult;
        TestResult.storeOutputToDataSetResult(caseResult, datasetIndex, steps);
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

    const result = {};
    const body = bodySamples.validateOrSubmitBody(
      customerCategory,
      distributionChannel
    );

    return btapi
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
          const body = success.response.body;
          const responseText = JSON.stringify(success, null, "\t");

          salesOrderId = body.id;
          expect(
            body.id,
            `SalesOrderId should be defined\n${responseText}`
          ).toBeDefined();
          expect(
            body.id,
            `SalesOrderId should not be null\n${responseText}`
          ).not.toBe(null);
          logger.info(`SALES ORDER UPDATE${salesOrderId}`);
        },
        (error) => {
          expect(
            true,
            `Error response is received\n${JSON.stringify(error, null, "\t")}`
          ).toBe(false);
        }
      )
      .finally(() => {
        // Overriding step result here with meaningful response info only
        stepResult.result = result;
        steps[stepNum] = stepResult;
        TestResult.storeOutputToDataSetResult(caseResult, datasetIndex, steps);
      });
  };

  const stepProcessNCBE = async (datasetIndex, stepNum) => {
    const stepResult = {};
    stepResult.title = "[Step 8] Process order in NCBE";
    stepResult.datasetIndex = datasetIndex;
    stepResult.stepNum = stepNum;

    customerId =
      caseResult.datasets[datasetIndex].response[0].result.customerId;
    logger.info(`CustomerID:${customerId}`);
    btapi.wait(10000);
    const manualTaskId = await du.getManualCreditTaskId(dbcfg, customerId);
    if (!StringUtils.isEmpty(manualTaskId)) {
      const res = await tapis.processManualTask(apicfg, manualTaskId);
      logger.debug(
        `Manual task ${manualTaskId} completion status code: ${res.status}`
      );
    }
    btapi.wait(10000);
    const pendingWorkOrders = await du.getWorkOrderNumbersNotCompleted(
      dbcfg,
      customerId
    );

    logger.info(`Work_Order_Number:${JSON.stringify(pendingWorkOrders)}`);

    for (let orIndex = 0; orIndex < pendingWorkOrders.length; orIndex++) {
      //let orderInternalId = pendingWorkOrders[orIndex][1];
      const workOrderNumber = pendingWorkOrders[orIndex][0];
      logger.info(`Work_Order_Number:${workOrderNumber}`);
      const workOrderName = pendingWorkOrders[orIndex][2];
      if (StringUtils.containsIgnoreCase(workOrderName, "work order")) {
        // Hit release activation in case order is in entering state
        await tapis.processReleaseActivation(apicfg, workOrderNumber);
        // Wait for 10 seconds to get completed
        await btapi.wait(10000);

        // Hit work order completion
        await tapis.processWorkOrder(apicfg, workOrderNumber);
        // Wait for 10 seconds to get completed
        await btapi.wait(10000);
      }
    }

    logger.debug("Fetching customer's all order item's status");
    const allcustomerOrdStatus = {};
    const allOrdersStatus = await du.select(
      dbcfg,
      dq.queryNcCustomerOrdersStatus(dbcfg, customerId)
    );
    logger.debug(`Orders' statuses: ${JSON.stringify(allOrdersStatus)}`);
    allcustomerOrdStatus.allOrdersStatus = allOrdersStatus;
    logger.debug(
      `Order's statuses till now: ${JSON.stringify(allcustomerOrdStatus)}`
    );

    logger.debug("Fetching customer's all pending order item's status");
    const allPendingOrders = await du.select(
      dbcfg,
      dq.queryNcCustomerOrdersStatusNeitherCompletedNorProcessed(
        dbcfg,
        customerId
      )
    );
    logger.debug(
      `Pending Orders' statuses: ${JSON.stringify(allPendingOrders)}`
    );
    allcustomerOrdStatus.allPendingOrders = allPendingOrders;
    logger.debug(
      `Order's statuses till now: ${JSON.stringify(allcustomerOrdStatus)}`
    );
    // storeOutputToDataSetResult(caseResult, datasetindex, allcustomerOrdStatus);

    const custErrors = {};
    custErrors.err = await du.getErrorsOccuredForCustomer(dbcfg, customerId);

    const allnonprocessedOrders = {};
    if (
      allPendingOrders != null &&
      allPendingOrders !== undefined &&
      allPendingOrders.length > 0
    ) {
      for (let orIndex = 0; orIndex < allPendingOrders.length; orIndex++) {
        const orderInternalId = allPendingOrders[orIndex][1];
        const orderName = allPendingOrders[orIndex][0];
        if (StringUtils.containsIgnoreCase(orderName, "shipment")) {
          // Hit release activation in case order is in entering state
          await tapis.processReleaseActivation(apicfg, orderInternalId);
          // Wait for 10 seconds to get completed
          await btapi.wait(10000);

          const res = await du.getShipmentOrderNumberAndPurchaseOrderNumber(
            dbcfg,
            orderInternalId
          );
          // Hit shipment order completion
          await tapis.processShipmentOrder(
            apicfg,
            res.shipmentOrderNumber,
            res.purchaseeOrderNumber
          );
          // Wait for 10 seconds to get completed
          await btapi.wait(10000);
          allnonprocessedOrders.ordersnotprocessed = await du.select(
            dbcfg,
            dq.queryNcCustomerOrdersStatusNeitherCompletedNorProcessed(
              dbcfg,
              customerId
            )
          );
        }
      }
    }
  };

  const InitiateChangeOrder = async (datasetIndex, stepNum) => {
    const stepResult = {};
    stepResult.title = "Initiating change in order";
    const result = {};
    const body = btapi.generateShoppingCartBody.generateEmptyCart(
      customerAccountECID,
      customerCategory,
      distributionChannel,
      externalLocationId
    );
    logger.info(`Generating empty cart body:${JSON.stringify(body)}`);
    return btapi
      .$requestShoppingCart(btapi.TYPES.createShoppingCart(), body)
      .toPromise()
      .then(
        (success) => {
          logger.info(
            `Generating empty cart response:${JSON.stringify(
              success.response.body
            )}`
          );
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
          const body = success.response.body;
          const responseText = JSON.stringify(success, null, "\t");
          expect(
            success.response.statusCode,
            `statusCode should be 201${JSON.stringify(success, null, "\t")}`
          ).toBe(201);
          expect(
            body.status,
            `SC should have OPEN status\n${responseText}`
          ).toBe("OPEN");
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
              logger.info(
                `cartitem elements${JSON.stringify(body.cartItem.map(elem))}`
              );
              return {
                id: `${elem.productOffering.id}   ${elem.productOffering.displayName}`,
              };
            }),
            null,
            "\t"
          );
        },
        (error) => {
          expect(
            true,
            `Error response is received\n${JSON.stringify(error, null, "\t")}`
          ).toBe(false);
        }
      )
      .finally(() => {
        // Overriding step result here with meaningful response info only
        stepResult.result = result;
        steps[stepNum] = stepResult;
        TestResult.storeOutputToDataSetResult(caseResult, datasetIndex, steps);
      });
  };
  const removeequipments = async (datasetIndex, stepNum) => {
    const stepResult = {};
    stepResult.title = "Removing equipments";
    logger.info(`START CHANGE${salesOrderId}`);
    logger.info(`ShoppingCartId:${shoppingCartId}`);
    expect(
      shoppingCartId,
      "SC id should not be null, please look at the previous test\n"
    ).not.toBeNull();
    const result = {};
    const body = btapi.generateShoppingCartBody.removeChildOffers(
      customerAccountECID,
      customerCategory,
      distributionChannel,
      externalLocationId,
      removechildOfferList,
      controlPlusVideoItemId
    );

    logger.info(`updated shopping cart body:${JSON.stringify(body)}`);

    return btapi
      .$requestShoppingCart(
        btapi.TYPES.updateShoppingCart(shoppingCartId),
        body
      )
      .toPromise()
      .then(
        (success) => {
          logger.info(
            `updateshopping cart response:${JSON.stringify(
              success.response.body
            )}`
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
          const body = success.response.body;

          logger.info(`RESPONSE:${JSON.stringify(body)}`);
          expect(
            body.status,
            `SC should have OPEN status\n${JSON.stringify(success, null, "\t")}`
          ).toBe("OPEN");
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
          controlplusvideoitem = btapi.getByParent(
            "id",
            controlplusvideooffer,
            body.cartItem
          );
          expect(
            controlPlusVideoItemId,
            `controlPlusVideo offer (${controlplusvideooffer}) should be present in response as 2 equipments were added.\n${scText}`
          ).not.toBeNull();
          body.cartItem.forEach(function (item) {
            const product = item.product;
            expect(
              item.product.place[0].id,
              `Place ID under ${product.displayName} top offer should be the same like Place ID in request\n`
            ).toBe(externalLocationId);
            expect(
              item.action,
              `Action for offer ${product.displayName} should be "-"\n`
            ).toBe("-");
            expect(
              product.characteristics.length,
              `Characteristics for offer ${product.displayName} should be present\n`
            ).not.toBe(0);
            item.productOffering.id == controlplusvideooffer
              ? (controlplusvideoitem = item)
              : null;
            if (item.productOffering.id == workOffer) {
              woItemId = item.id;
            }
          });

          const actChildren = [];
          controlplusvideoitem.cartItem.forEach(function (childItem) {
            actChildren.push(childItem.id);
            if (removechildOfferList.includes(childItem.id)) {
              expect(
                childItem.action,
                `Action for offer ${childItem.product.displayName} should be "-"\n`
              ).toBe("Delete");
            }
          });
          removechildOfferList.forEach((element) => {
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
      )
      .finally(() => {
        // Overriding step result here with meaningful response info only
        stepResult.result = result;
        steps[stepNum] = stepResult;
        TestResult.storeOutputToDataSetResult(caseResult, datasetIndex, steps);
      });
  };
  const addequipments = async (datasetIndex, stepNum) => {
    const stepResult = {};
    stepResult.title = "Adding equipments to order";
    const result = {};
    logger.info(`START CHANGE${salesOrderId}`);
    expect(
      shoppingCartId,
      "SC id should not be null, please look at the previous test\n"
    ).not.toBeNull();
    expect(
      controlPlusVideoItemId,
      "controlPlusVideoItemId should not be null, please look at the previous test\n"
    ).not.toBeNull();

    const childOfferList = [btapi.data.homeSecurityEquipments.buttonKey];

    logger.info(`ChildOfferList${JSON.stringify(childOfferList)}`);

    const body = btapi.generateShoppingCartBody.addChildOffers(
      customerAccountECID,
      customerCategory,
      distributionChannel,
      externalLocationId,
      childOfferList,
      controlPlusVideoItemId
    );

    logger.info(`BODY:${JSON.stringify(body)}`);

    return btapi
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
          const body = success.response.body;
          expect(
            body.status,
            `SC should have OPEN status\n${JSON.stringify(success, null, "\t")}`
          ).toBe("OPEN");
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
          controlplusvideoitem = btapi.getByParent(
            "id",
            controlplusvideooffer,
            body.cartItem
          );
          expect(
            controlPlusVideoItemId,
            `controlPlusVideo offer (${controlplusvideooffer}) should be present in response as 2 equipments were added.\n${scText}`
          ).not.toBeNull();
          body.cartItem.forEach(function (item) {
            const product = item.product;
            expect(
              item.product.place[0].id,
              `Place ID under ${product.displayName} top offer should be the same like Place ID in request\n`
            ).toBe(externalLocationId);
            expect(
              product.characteristics.length,
              `Characteristics for offer ${product.displayName} should be present\n`
            ).not.toBe(0);
            item.productOffering.id = controlplusvideooffer
              ? (controlplusvideoitem = item)
              : null;
            if (item.productOffering.id === workOffer) {
              woItemId = item.id;
            }
          });

          const expChildren = [btapi.data.homeSecurityEquipments.buttonKey];
          const actChildren = [];
          controlplusvideoitem.cartItem.forEach(function (childItem) {
            const childProduct = childItem.productOffering;
            actChildren.push(childProduct.id);
            if (childProduct === expChildren[0]) {
              expect(
                childItem.action,
                `Action for offer ${childProduct.id} should be "Add"\n`
              ).toBe("Add");
            }
          });
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
      )
      .finally(() => {
        // Overriding step result here with meaningful response info only
        stepResult.result = result;
        steps[stepNum] = stepResult;
        TestResult.storeOutputToDataSetResult(caseResult, datasetIndex, steps);
      });
  };

  const validatecartwithaddedequipments = async (datasetIndex, stepNum) => {
    const stepResult = {};
    stepResult.title = "Validating cart with changed equipments";
    const result = {};
    logger.info(`START CHANGE${salesOrderId}`);
    expect.hasAssertions();

    expect(
      shoppingCartId,
      "SC id should not be null, please look at the previous test\n"
    ).not.toBeNull();

    const body = bodySamples.validateOrSubmitBody(
      customerCategory,
      distributionChannel
    );

    return btapi
      .$requestShoppingCart(
        btapi.TYPES.validateShoppingCart(shoppingCartId),
        body
      )
      .toPromise()
      .then((success) => {
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
          `Response should contain body\n${JSON.stringify(success, null, "\t")}`
        ).toBeDefined();
        expect(
          success.response.body,
          `Response should contain body\n${JSON.stringify(success, null, "\t")}`
        ).not.toBeNull();
        const body = success.response.body;
        const responseText = JSON.stringify(success, null, "\t");
        expect(
          body,
          `Response should contain body\n${responseText}`
        ).toBeDefined();
        expect(body.status, `SC should have OPEN status\n${responseText}`).toBe(
          "OPEN"
        );
        expect(
          body.cartItem,
          `Response should contain cartItem\n${responseText}`
        ).toBeDefined();
        expect(
          body.cartItem.length,
          `cartItem should not be empty - HS, LW and WO\n${JSON.stringify(
            body.cartItem.map((elem) => {
              return {
                id:
                  elem.productOffering.id +
                  "   " +
                  elem.productOffering.displayName,
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
                  : "" + value
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
        console.log(
          `Cart Id : ${cartVersionBeforeSubmit}cart Version Before Submit : ${cartVersionBeforeSubmit}`
        );
        (error) => {
          expect(
            true,
            `Error response is received\n${JSON.stringify(error, null, "\t")}`
          ).toBe(false);
        };
      })
      .finally(() => {
        // Overriding step result here with meaningful response info only
        stepResult.result = result;
        steps[stepNum] = stepResult;
        TestResult.storeOutputToDataSetResult(caseResult, datasetIndex, steps);
      });
  };

  const submitcartwithaddedequipments = async (datasetIndex, stepNum) => {
    expect.hasAssertions();
    expect(
      shoppingCartId,
      "SC id should not be null, please look at the previous test\n"
    ).not.toBeNull();

    const body = bodySamples.validateOrSubmitBody(
      customerCategory,
      distributionChannel
    );

    return btapi
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
          const body = success.response.body;
          const responseText = JSON.stringify(success, null, "\t");
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
          expect(
            true,
            `Error response is received\n${JSON.stringify(error, null, "\t")}`
          ).toBe(false);
        }
      );
  };
  const testCase = async (datasetIndex) => {
    const singleJsonRowObject = sheetDataAsJsonArray[datasetIndex];
    dr.setDataSetObject(singleJsonRowObject, datasetIndex);
    const dsObj = dr.getDataSetObject(datasetIndex);
    caseResult.datasets.push(dsObj);

    steps = new Array(100);
    let stepNum = 0;

    try {
      await step1CreateNewRCA(datasetIndex, stepNum++);
      await step2CreateShsCommitmentLw(datasetIndex, stepNum++);
      await step3PurchaseEquipment(datasetIndex, stepNum++);
      await step4PrevProvider(datasetIndex, stepNum++);
      await step5Appointments(datasetIndex, stepNum++);
      await step6UpdateWoSo(datasetIndex, stepNum++);
      await step6ValidateSc(datasetIndex, stepNum++);
      await stepSubmit(datasetIndex, stepNum++);
      await stepProcessNCBE(datasetIndex, stepNum++);
      await InitiateChangeOrder(datasetIndex, stepNum++);
      await removeequipments(datasetIndex, stepNum++);
      await addequipments(datasetIndex, stepNum++);
      await validatecartwithaddedequipments(datasetIndex, stepNum++);
      await submitcartwithaddedequipments(datasetIndex, stepNum++);
      await stepProcessNCBE(datasetIndex, stepNum++);

      caseResult.datasets[datasetIndex].result = TestResultStatus.Pass;
      return Promise.resolve();
    } catch (error) {
      caseResult.datasets[datasetIndex].result = TestResultStatus.Fail;
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
