require(`../globals/MyTypeDefs`);
const TestDataObject = require("./TestDataObject");
const Validator = require("./Validator");
const StringUtils = require("../utils/common/StringUtils");
const logger = require("../logger/Logger");

function CreateRequestObject() {
  const reqObject = {
    method: "",
    baseUri: "",
    endpoint: "",
    headers: [],
    query: {
      params: [
        {
          key: "",
          value: "",
        },
      ],
    },
    path: {
      params: [
        {
          key: "",
          value: "",
        },
      ],
    },
    body: "",
    endpointWithQueryParams: function () {
      let joined = this.endpoint;
      this.query.params.forEach((el) => {
        if (!StringUtils.isEmpty(el.key)) joined += `${el.key}=${el.value}&`;
      });
      // remove last character if it is ampersand (&)
      return joined.replace(/&$/, "");
    },
    endpointWithPathParams: function () {
      let joined = this.endpoint;
      this.path.params.forEach((el) => {
        if (!StringUtils.isEmpty(el.key)) joined += `${el.key}=${el.value}&`;
      });
      // remove last character if it is front-slash (/)
      return joined.replace(/\/$/, "");
    },
  };

  return reqObject;
}

function CreateResponseObject() {
  const respObject = {
    status: { code: -1, message: "" },
    header: [
      {
        key: "",
        value: "",
      },
    ],
    body: {
      full: "",
      part: [
        {
          key: "",
          value: "",
        },
      ],
    },
    getValueForGivenHeaderKey: function (keyToFind) {
      for (let index = 0; index < this.header.length; index++) {
        const el = this.header[index];
        logger.trace(
          `Comparing for equality between [${el.key}] and [${keyToFind}]`
        );
        if (el.key.toUpperCase() === keyToFind.toUpperCase()) {
          logger.trace(`returning value [${el.value}]`);
          return el.value;
        }
      }
    },
    getValueForGivenBodyPartKey: function (keyToFind) {
      for (let index = 0; index < this.body.part.length; index++) {
        const el = this.body.part[index];
        logger.trace(
          `Comparing for equality between [${el.key}] and [${keyToFind}]`
        );
        if (el.key.toUpperCase() === keyToFind.toUpperCase()) {
          logger.trace(`returning value [${el.value}]`);
          return el.value;
        }
      }
    },
  };

  return respObject;
}

/**
 * @deprecated
 */
class ApiObjects {
  RequestObject() {
    const obj = CreateRequestObject();
    return obj;
  }

  ResponseObject() {
    const obj = CreateResponseObject();
    return obj;
  }

  ApiTestObject() {
    const testObj = {
      request: CreateRequestObject(),
      response: Object,
      expected: CreateResponseObject(),
    };

    return testObj;
  }
}

module.exports = { ApiObjects, TestDataObject, Validator };
