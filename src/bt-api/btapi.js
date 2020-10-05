const request = require("request");

const { Observable } = require("rxjs");
const { first, timeout } = require("rxjs/operators");

const xmlParser = require("xml2js");

const config = require("../../br-config");

const envcfg = config.getConfigForGivenEnv();
const btapicfg = config.getBTApisConfig(envcfg);
const environment = btapicfg.JEST_BTAPI_ENDPOINT;
const environmentSC = btapicfg.JEST_BTAPI_ENDPOINT_SHOPPING_CART;
const environmentCreateCustomer = btapicfg.JEST_CREATECUSTOMER_ENDPOINT;
const btapiUserName = btapicfg.BTAPI_USERNAME;
const btapiPass = btapicfg.BTAPI_PASS;
const bodySample = require("./bodySamples");

const logger = require("../logger/Logger");

const configurationLoader = require("./loader");

const stringify = configurationLoader.enhanceStringify;

const REQUEST_TYPES = {
  getProductOffering: function () {
    return {
      uri:
        "/cmo/ordermgmt/tmf-api/productofferingqualificationmanagement/v1/productOfferingQualification",
      method: "POST",
    };
  },
  getProductOfferingFiltration: function (params) {
    if (params === undefined || params === null || params === {}) return;
    return {
      uri: `/cmo/ordermgmt/tmf-api/productofferingqualificationmanagement/v1/productOfferingQualification?${params}`,
      method: "POST",
    };
  },

  createShoppingCart: function () {
    return {
      uri: "/cmo/ordermgmt/tmf-api/shoppingCart/v1/shoppingCart/",
      method: "POST",
    };
  },
  updateShoppingCart: function (id) {
    return {
      uri: `/cmo/ordermgmt/tmf-api/shoppingCart/v1/shoppingCart/${id}`,
      method: "PUT",
    };
  },
  validateShoppingCart: function (shoppingCartId) {
    return {
      uri: `/cmo/ordermgmt/tmf-api/shoppingCart/v1/shoppingCart/${shoppingCartId}/validate`,
      method: "POST",
    };
  },
  submitShoppingCart: function (shoppingCartId) {
    return {
      uri: `/cmo/ordermgmt/tmf-api/shoppingCart/v1/shoppingCart/${shoppingCartId}/checkout`,
      method: "POST",
    };
  },
  retrieveShoppingCart: function (shoppingCartId) {
    shoppingCartId = shoppingCartId == null ? "" : `/${shoppingCartId}`;
    return {
      uri: `/cmo/ordermgmt/tmf-api/shoppingCart/v1/shoppingCart${shoppingCartId}`,
      method: "GET",
    };
  },
  deleteShoppingCart: function (shoppingCartId) {
    return {
      uri: `/cmo/ordermgmt/tmf-api/shoppingCart/v1/shoppingCart/${shoppingCartId}`,
      method: "DELETE",
    };
  },
  revertShoppingСartTo: function (shoppingCartId, version) {
    return {
      uri: `/cmo/ordermgmt/tmf-api/shoppingCart/v1/shoppingCart/${shoppingCartId}/revertto/${version}`,
      method: "POST",
    };
  },
  getProductInstances: {
    uri: "/tmf-api/productinventorymanagement/v1/product",
    method: "GET",
  },

  // NC API
  createCustomer: function () {
    return {
      uri: "/api/v1/customerManagement",
      method: "POST",
    };
  },

  assignToCustomer: function (shoppingCartId) {
    return {
      uri: `/cmo/ordermgmt/tmf-api/shoppingCart/v1/shoppingCart/${shoppingCartId}`,
      method: "PUT",
    };
  },
};

let buildCorrelationId = function () {
  try {
    return getTestName();
  } catch (e) {
    console.log(
      "Error Calculating Correlation-Id based on test name, error will be ignored",
      e
    );
    return "ERROR";
  }
};

let getTestName = function () {
  if (
    global[Symbol.for("$$jest-matchers-object")].state.currentTestName != null
  ) {
    return global[Symbol.for("$$jest-matchers-object")].state.currentTestName
      .replace(/ /g, "-")
      .replace(/\[/g, "")
      .replace(/\]/g, "")
      .replace(/\(/g, "")
      .replace(/\)/g, "")
      .replace(/\,/g, "-")
      .replace(/-(-)+/g, "-");
  } else {
    return "TEST_NAME_UNDEFINED";
  }
};

let buildOptions = function (env, type, body, queryParams) {
  let options = {
    method: type.method,
    url: queryParams == null ? env + type.uri : env + type.uri + queryParams,
    headers: {
      "Content-Type": "application/json",
      "Correlation-Id": buildCorrelationId(),
    },
    body: body == null ? {} : body,
    timeout: configurationLoader.timeout - 4000,
    strictSSL: false,
    json: true,
    gzip: true,
  };
  if (btapiPass !== "None" && btapiUserName !== "None") {
    options.auth = {
      user: btapiUserName,
      pass: btapiPass,
      sendImmediately: false,
    };
  }
  return options;
};

let buildCreateCustomerOptions = function (
  type,
  queryParameters,
  distributionChannelID,
  customerCategoryID,
  body
) {
  let options = {
    method: type.method,
    url: environment + type.uri,
    qs: queryParameters,
    headers: {
      "Content-Type": "application/json",
    },
    body: body == null ? {} : body,
    timeout: configurationLoader.timeout + 25000,
    json: true,
  };
  if (btapiPass !== "None" && btapiUserName !== "None") {
    options.auth = {
      user: btapiUserName,
      pass: btapiPass,
      sendImmediately: false,
    };
  }
  return options;
};
let buildCreateCustomerOptionsTBAPI = function (
  type,
  body,
  queryParameters,
  distributionChannelID,
  customerCategoryID,
  marketId
) {
  marketId = marketId === undefined ? 1 : marketId;

  let options = {
    method: type.method,
    url: environmentCreateCustomer + type.uri,
    qs: queryParameters,
    headers: {
      "Content-Type": "application/json",
      EligibilityParams: `distributionChannelId="${distributionChannelID}",marketId="${marketId}",customerCategoryId="${customerCategoryID}"`,
      Range: "1-10000",
      Tag: process.env.BUILD_NUMBER,
      "Correlation-Id": buildCorrelationId(),
      "Accept-Language": "en_CA",
    },
    body: body == null ? {} : body,
    timeout: configurationLoader.timeout - 4000,
    strictSSL: false,
    gzip: true,
    json: true,
  };
  logger.info(buildCorrelationId());
  logger.info(options.url);
  return options;
};

module.exports = {
  paramsRequestProductInventory: function (type, queryParameters) {
    return new Observable((observer) => {
      let reqOption = buildOptionsProductInventory(type, queryParameters);
      request(reqOption, function (error, response, body) {
        if (error) {
          observer.next({ error: error, response: response, body: body });
        } else {
          observer.next({ error: error, response: response, body: body });
          stringify(body, type, {
            headers: reqOption.headers,
            body: reqOption.body,
          });
        }
      });
    }).pipe(timeout(configurationLoader.timeout - 2000), first());
  },
  paramsRequest: function (type, queryParameters, body, offerLimits) {
    return new Observable((observer) => {
      let reqOption = buildOptionsVariables(
        type,
        queryParameters,
        body,
        offerLimits
      );
      request(reqOption, function (error, response, body) {
        if (error) {
          observer.next({ error: error, response: response, body: body });
        } else {
          observer.next({ error: error, response: response, body: body });
          stringify(body, type, {
            query: reqOption.qs,
            headers: reqOption.headers,
            body: reqOption.body,
          });
        }
      });
    }).pipe(timeout(configurationLoader.timeout - 2000), first());
  },
  $request: function (type, queryParameters) {
    return new Observable((observer) => {
      let reqOption = buildOptions(
        type,
        distributionChannelID,
        customerCategoryID
      );
      request(reqOption, function (error, response, body) {
        if (error) {
          observer.next(`${error}  BODY:${body}`);
        } else {
          observer.next(body);
          stringify(body, type, {
            query: reqOption.qs,
            headers: reqOption.headers,
            body: reqOption.body,
          });
        }
      });
    });
  },
  $requestFull: function (type, body) {
    return new Observable((observer) => {
      let reqOption = buildOptions(environment, type, body);
      request(reqOption, function (error, response, body) {
        if (error) {
          observer.next({ error: error, response: response, body: body });
        } else {
          observer.next({ error: error, response: response, body: body });
          stringify({
            query: reqOption.url,
            headers: reqOption.headers,
            body: reqOption.body,
          });
        }
      });
    }).pipe(timeout(configurationLoader.timeout + 8000), first());
  },
  $requestShoppingCart: function (type, body, queryParams) {
    return new Observable((observer) => {
      let reqOption = buildOptions(environmentSC, type, body, queryParams);
      request(reqOption, function (error, response, body) {
        if (error) {
          observer.next({ error: error, response: response, body: body });
        } else {
          observer.next({ error: error, response: response, body: body });
          stringify(body, type, {
            query: reqOption.url,
            headers: reqOption.headers,
            body: reqOption.body,
          });
        }
      });
    }).pipe(timeout(configurationLoader.timeout - 2000), first());
  },
  $requestShoppingCartOpenShift: function (type, body, queryParams) {
    return new Observable((observer) => {
      let newURL = `https://shoppingcarttmfmicroservice-itn${environmentSC.substring(
        22,
        24
      )}-foma.paas-app-west-np.tsl.telus.com`;
      let newType = {
        uri: String(type.uri).replace("/cmo/ordermgmt", ""),
        method: type.method,
      };
      let reqOption = buildOptions(newURL, newType, body, queryParams);
      request(reqOption, function (error, response, body) {
        if (error) {
          observer.next({ error: error, response: response, body: body });
        } else {
          observer.next({ error: error, response: response, body: body });
          stringify(body, type, {
            query: reqOption.url,
            headers: reqOption.headers,
            body: reqOption.body,
          });
        }
      });
    }).pipe(timeout(configurationLoader.timeout - 2000), first());
  },
  $requestProductOfferingQualificationOpenShift: function (
    type,
    body,
    queryParams
  ) {
    return new Observable((observer) => {
      let newURL = `https://productofferingqualification-itn${environmentSC.substring(
        22,
        24
      )}-foma.paas-app-west-np.tsl.telus.com`;
      let newType = {
        uri: String(type.uri).replace("/cmo/ordermgmt", ""),
        method: type.method,
      };
      let reqOption = buildOptions(newURL, newType, body, queryParams);
      request(reqOption, function (error, response, body) {
        if (error) {
          observer.next({ error: error, response: response, body: body });
        } else {
          observer.next({ error: error, response: response, body: body });
          stringify(body, type, {
            query: reqOption.url,
            headers: reqOption.headers,
            body: reqOption.body,
          });
        }
      });
    }).pipe(timeout(configurationLoader.timeout - 2000), first());
  },
  $requestCreateCustomer: function (
    type,
    queryParameters,
    body,
    distributionChannelID,
    customerCategoryID
  ) {
    return new Observable((observer) => {
      let reqOption = buildCreateCustomerOptions(
        type,
        queryParameters,
        distributionChannelID,
        customerCategoryID,
        body
      );
      request(reqOption, function (error, response, body) {
        if (error) {
          observer.next({ error: error, response: response, body: body });
        } else {
          observer.next({ error: error, response: response, body: body });
          stringify(body, type, {
            query: reqOption.qs,
            headers: reqOption.headers,
            body: reqOption.body,
          });
        }
      });
    }).pipe(timeout(configurationLoader.timeout - 2000), first());
  },
  $requestCreateCustomerTBAPI: function (
    type,
    queryParameters,
    body,
    distributionChannelID,
    customerCategoryID
  ) {
    return new Observable((observer) => {
      let reqOption = buildCreateCustomerOptionsTBAPI(
        type,
        body,
        queryParameters,
        distributionChannelID,
        customerCategoryID
      );
      request(reqOption, function (error, response, body) {
        if (error) {
          logger.info("false");
          observer.next({ error: error, response: response, body: body });
        } else {
          logger.info("true");
          observer.next({ error: error, response: response, body: body });
          logger.info(response);
          logger.info(body);
          stringify(body, type, {
            query: reqOption.qs,
            headers: reqOption.headers,
            body: reqOption.body,
          });
          logger.info(
            stringify(body, type, {
              query: reqOption.qs,
              headers: reqOption.headers,
              body: reqOption.body,
            })
          );
        }
      });
    }).pipe(timeout(configurationLoader.timeout - 2000), first());
  },
  TYPES: REQUEST_TYPES,
  data: require("../../test-data/test.data"),
  timeout: configurationLoader.timeout,
  stringify: configurationLoader.enhanceStringify,
  getBy: function (fieldName, fieldValue, array) {
    let result = [];
    array.forEach((element) => {
      if (element[fieldName] == fieldValue) {
        result.push(element);
      }
    });
    if (result.length == 1) {
      return result[0];
    }
    return null;
  },
  getArrayBy: function (fieldName, fieldValue, array) {
    let result = [];
    expect(
      Array.isArray(array),
      `getArrayBy method requires Array to find the element. Possible Issue within the test. Received ${typeof array}`
    ).toBe(true);
    array.forEach((element) => {
      if (element[fieldName] == fieldValue) {
        result.push(element);
      }
    });
    if (result.length > 0) {
      return result;
    }
    return null;
  },
  getByParent: function (fieldName, fieldValue, array, parent) {
    /**
     * array = item
     * parent = product
     * fieldName = 'id'
     * fieldValue = '123'
     * item{
     *     product{
     *         id: "123"
     *         name: "someName"
     *     }
     *     productOffering{
     *         id: "123"
     *         name: "someName"
     *     }
     * }
     * @type {Array}
     */
    let result = [];
    array.forEach((element) => {
      parent = parent == null ? "productOffering" : parent;
      let subElement = element[parent]; // Product , productOffering
      if (subElement[[fieldName]] == fieldValue) {
        result.push(element[parent]);
      }
    });
    if (result.length == 1) {
      return result[0];
    }
    return null;
  },
  getRandomInt: function (min, max) {
    // min is included and max is excluded
    return Math.floor(Math.random() * (max - min)) + min;
  },
  wait: function (ms) {
    let startPoint = new Date();
    let endPoint = null;
    do {
      endPoint = new Date();
    } while (endPoint - startPoint < ms);
  },

  verifyCreateCustomerAccountTBAPI: function (
    queryBody,
    distributionChannel,
    customerCategory
  ) {
    distributionChannel =
      distributionChannel === undefined || distributionChannel === null
        ? module.exports.data.distributionChannel.SSP
        : distributionChannel;
    customerCategory =
      customerCategory === undefined || customerCategory === null
        ? module.exports.data.customerCategory.CONSUMER
        : customerCategory;
    let isBCA = queryBody.isBusiness ? true : false;
    return module.exports
      .$requestCreateCustomerTBAPI(
        module.exports.TYPES.createCustomer(),
        {},
        queryBody,
        distributionChannel,
        customerCategory
      )
      .toPromise()
      .then(
        (success) => {
          expect(
            success.response,
            `Response should be received${JSON.stringify(success, null, "\t")}`
          ).not.toBeNull();
          expect(
            success.body,
            `Response should contain body${JSON.stringify(success, null, "\t")}`
          ).not.toBeNull();
          let customerAccount = success.body;
          let successText = JSON.stringify(success, null, "\t");
          let customerAccountText = JSON.stringify(customerAccount, null, "\t");
          expect(
            customerAccount,
            `Customer account should have been created successfully\n${successText}`
          ).not.toBeNull();
          if (!isBCA) {
            expect(
              customerAccount.externalCustomerID,
              `Customer external ID should be defined and not empty\n${customerAccountText}`
            ).not.toBeNull();
            expect(
              customerAccount.externalCustomerID.length,
              `Customer external ID should have more than one character\n${customerAccountText}`
            ).toBeGreaterThan(1);
          }
          expect(
            customerAccount.customerID,
            `Customer account ID should be defined and not empty\n${customerAccountText}`
          ).not.toBeNull();
          expect(
            customerAccount.customerID.length,
            `Customer account ID should have more than one character\n${customerAccountText}`
          ).toBeGreaterThan(1);
          console.log(
            `Customer Id: ${customerAccount.customerID}\nECID: ${customerAccount.externalCustomerID}`
          );
          logger.info(customerAccount.externalCustomerID);
          return {
            externalCustomerId: customerAccount.externalCustomerID,
            customerId: customerAccount.customerID,
            customerAccountNumber: customerAccount.customerAccountNumber,
          };
        },
        (error) => {
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
      .catch((err) => {
        console.log(
          `Error: ${err.message.replace("\n", "\n")}\nTimestamp: ${new Date(
            new Date().getTime()
          )}`
        );
        if (err.matcherResult != null) {
          throw err;
        }
      });
  },
  parseXmlResponse: function (xml) {
    var parser = new xmlParser.Parser({ explicitArray: false });
    var parseString = parser.parseString;

    var prefixMatch = new RegExp(/<(\/?)([^:>\s]*:)?([^>]+)>/g);
    xml = xml.replace(prefixMatch, "<$1$3>");

    return new Promise((resolve, reject) => {
      parseString(xml, (err, result) => {
        if (err) {
          reject(err);
        } else {
          logger.info(
            `RESULT${JSON.stringify(
              result.Envelope.Body.searchAvailableAppointmentListResponse
                .availableAppointmentList
            )}`
          );
          resolve(result);
        }
      });
    });
  },

  generateShoppingCartBody: {
    addTopOffers: function (
      customerAccountECID,
      customerCategory,
      distributionChannel,
      externalLocationId,
      offerList
    ) {
      let cartItems = [];
      offerList.forEach((offer) => {
        let cartItem = bodySample.addTopOfferItem(offer);
        cartItems.push(cartItem);
      });

      let body = bodySample.mainBody(
        customerAccountECID,
        customerCategory,
        distributionChannel,
        externalLocationId,
        cartItems
      );

      return body;
    },

    addChildOffers: function (
      customerAccountECID,
      customerCategory,
      distributionChannel,
      externalLocationId,
      childofferList,
      parentItemId
    ) {
      let cartItems = [];
      childofferList.forEach((childOffer) => {
        let cartItem = bodySample.addchildOfferItem(childOffer, parentItemId);
        cartItems.push(cartItem);
      });

      let body = bodySample.mainBody(
        null,
        customerCategory,
        distributionChannel,
        externalLocationId,
        cartItems
      );

      return body;
    },

    removeChildOffers: function (
      customerAccountECID,
      customerCategory,
      distributionChannel,
      externalLocationId,
      childofferList,
      parentItemId
    ) {
      let cartItems = [];
      childofferList.forEach((childOffer) => {
        let cartItem = bodySample.removechildOfferItem(
          childOffer,
          parentItemId
        );
        cartItems.push(cartItem);
      });

      let body = bodySample.mainBody(
        null,
        customerCategory,
        distributionChannel,
        externalLocationId,
        cartItems
      );

      return body;
    },

    updateCharsTopItem: function (
      customerAccountECID,
      customerCategory,
      distributionChannel,
      externalLocationId,
      charList,
      item,
      charSalesItems
    ) {
      let charItems = [];
      charList.forEach((charContainter) => {
        let charItem = bodySample.charItem(charContainter);
        charItems.push(charItem);
      });

      let cartItems = [];

      cartItems.push(bodySample.updateTopOfferItem(item, charItems));

      let body = bodySample.mainBody(
        null,
        customerCategory,
        distributionChannel,
        externalLocationId,
        cartItems,
        charSalesItems
      );

      return body;
    },

    updateCharsChildItem: function (
      customerAccountECID,
      customerCategory,
      distributionChannel,
      externalLocationId,
      charList,
      childItemId,
      parentItemId,
      charSalesItems
    ) {
      let charItems = [];
      charList.forEach((charContainter) => {
        let charItem = bodySample.charItem(charContainter);
        charItems.push(charItem);
      });

      let cartItems = [];

      cartItems.push(
        bodySample.updateChildOfferItem(childItemId, parentItemId, charItems)
      );

      let body = bodySample.mainBody(
        null,
        customerCategory,
        distributionChannel,
        externalLocationId,
        cartItems,
        charSalesItems
      );

      return body;
    },

    generateEmptyCart: function (
      customerAccountECID,
      customerCategory,
      distributionChannel,
      externalLocationId
    ) {
      return (body = bodySample.mainBody(
        customerAccountECID,
        customerCategory,
        distributionChannel,
        externalLocationId
      ));
    },

    removeTopOffers: function (
      customerAccountECID,
      customerCategory,
      distributionChannel,
      externalLocationId,
      offerItemList
    ) {
      let cartItems = [];
      offerItemList.forEach((item) => {
        let cartItem = bodySample.removeTopOfferItem(item);
        cartItems.push(cartItem);
      });

      let body = bodySample.mainBody(
        customerAccountECID,
        customerCategory,
        distributionChannel,
        externalLocationId,
        cartItems
      );

      return body;
    },
  },

  validateMessage: function (errorList, ruleId, message) {
    let flag = false;

    errorList.forEach((error) => {
      if (error.ruleReferenceId == ruleId) {
        error.customRuleParameters.forEach((generatedMessage) => {
          if ((generatedMessage.name = "GENERATED_MESSAGE")) {
            flag = generatedMessage.value == message;
          }
        });
        if (flag == false) {
          falg = error.message == message;
        }
        return flag;
      }
    });
  },

  validateAllMessagePresense: function (errorList, ruleIdList) {
    let absentErrors = [];

    errorList.forEach((error) => {
      if (!ruleIdList.includes(error.ruleReferenceId)) {
        absentErrors.push(error.ruleReferenceId);
      }
    });

    return absentErrors;
  },
};
