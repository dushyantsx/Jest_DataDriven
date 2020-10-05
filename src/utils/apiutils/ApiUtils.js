const request = require("superagent");

const { ApiPropertyType } = require("../../globals/enumerations");
const { TestResultStatus } = require("../../globals/enumerations");
require("../../globals/enumerations");
//const objects = require("globals/objects");
const errors = require("../../errors/CustomErrors");
const logger = require("../../logger/Logger");
const { ApiObjects } = require("../../globals/TestObjects");
const FileSystem = require("../common/FileSystem");

const obj = new ApiObjects();

require("superagent-proxy")(request);

class ApiUtils {
  async hitSingleDynamicRequestObject(listOfReqParams, dataRow, index) {
    logger.enterMethod("hitSingleDynamicRequestObject");
    try {
      logger.step(
        `Hitting and Executing for data-set ${index} -> ${dataRow} and for given request template object: ${JSON.stringify(
          listOfReqParams
        )}`
      );
      const testResObjExpected = obj.ResponseObject();
      const testReqObj = obj.RequestObject();

      listOfReqParams.forEach((e, indexVal) => {
        logger.debug(`Api Template at index ${indexVal}: ${JSON.stringify(e)}`);
        const header = {};
        const param = {};
        const expectedParam = {};

        switch (e.type) {
          case `${ApiPropertyType.REQUEST.BASE_URI[0]}`:
          case `${ApiPropertyType.REQUEST.BASE_URI[1]}`:
          case `${ApiPropertyType.REQUEST.BASE_URI[2]}`:
            testReqObj.baseUri = dataRow[e.index];
            break;
          case `${ApiPropertyType.REQUEST.ENDPOINT[0]}`:
          case `${ApiPropertyType.REQUEST.ENDPOINT[1]}`:
          case `${ApiPropertyType.REQUEST.ENDPOINT[2]}`:
            testReqObj.endpoint = dataRow[e.index];
            break;
          case `${ApiPropertyType.REQUEST.HEADER[0]}`:
          case `${ApiPropertyType.REQUEST.HEADER[1]}`:
          case `${ApiPropertyType.REQUEST.HEADER[2]}`:
            header.key = e.value;
            header.value = dataRow[e.index];
            testReqObj.headers.push(header);
            break;
          case `${ApiPropertyType.REQUEST.QUERY_PARAMS[0]}`:
          case `${ApiPropertyType.REQUEST.QUERY_PARAMS[1]}`:
          case `${ApiPropertyType.REQUEST.QUERY_PARAMS[2]}`:
            param.key = e.value;
            param.value = dataRow[e.index];
            testReqObj.query.params.push(param);
            break;
          case `${ApiPropertyType.REQUEST.PATH_PARAMS[0]}`:
          case `${ApiPropertyType.REQUEST.PATH_PARAMS[1]}`:
          case `${ApiPropertyType.REQUEST.PATH_PARAMS[2]}`:
            break;
          case `${ApiPropertyType.REQUEST.METHOD[0]}`:
          case `${ApiPropertyType.REQUEST.METHOD[1]}`:
          case `${ApiPropertyType.REQUEST.METHOD[2]}`:
            testReqObj.method = dataRow[e.index];
            break;
          case `${ApiPropertyType.REQUEST.BODY[0]}`:
          case `${ApiPropertyType.REQUEST.BODY[1]}`:
          case `${ApiPropertyType.REQUEST.BODY[2]}`:
            testReqObj.body = dataRow[e.index];
            break;
          case `${ApiPropertyType.REQUEST.BODY_AS_FILE[0]}`:
          case `${ApiPropertyType.REQUEST.BODY_AS_FILE[1]}`:
          case `${ApiPropertyType.REQUEST.BODY_AS_FILE[2]}`:
            testReqObj.body = FileSystem.readFileSync(dataRow[e.index]);
            break;
          case `${ApiPropertyType.RESPONSE.BODY.EXPECTED.KEY[0]}`:
          case `${ApiPropertyType.RESPONSE.BODY.EXPECTED.KEY[1]}`:
          case `${ApiPropertyType.RESPONSE.BODY.EXPECTED.KEY[2]}`:
            expectedParam.key = e.value;
            expectedParam.value = dataRow[e.index];
            testResObjExpected.body.part.push(expectedParam);
            break;
          case `${ApiPropertyType.RESPONSE.STATUS.CODE[0]}`:
          case `${ApiPropertyType.RESPONSE.STATUS.CODE[1]}`:
          case `${ApiPropertyType.RESPONSE.STATUS.CODE[2]}`:
          case `${ApiPropertyType.RESPONSE.STATUS.CODE[3]}`:
            testResObjExpected.status.code = dataRow[e.index];
            break;
          case `${ApiPropertyType.RESPONSE.STATUS.MESSAGE[0]}`:
          case `${ApiPropertyType.RESPONSE.STATUS.MESSAGE[1]}`:
          case `${ApiPropertyType.RESPONSE.STATUS.MESSAGE[2]}`:
          case `${ApiPropertyType.RESPONSE.STATUS.MESSAGE[3]}`:
            testResObjExpected.status.message = dataRow[e.index];
            break;
          default:
            throw new errors.InvalidApiPropertyInTemplate(
              `Invalid parameter type passed: ${e.type}`
            );
        }
      });

      logger.verbose(
        `request object: ${
          testReqObj.baseUri
        } endpoint with query-params: ${testReqObj.endpointWithQueryParams()}`
      );
      const headerAsObj = {};
      testReqObj.headers.forEach((el) => {
        headerAsObj[el.key] = el.value;
      });
      logger.verbose(
        `request headers while hitting: ${JSON.stringify(headerAsObj)}`
      );

      const reqResp = obj.ApiTestObject();
      reqResp.request = testReqObj;
      reqResp.expected = testResObjExpected;
      reqResp.result = TestResultStatus.Unknown;
      reqResp.indexId = index;

      const api = testReqObj.baseUri + testReqObj.endpointWithQueryParams();
      switch (testReqObj.method) {
        case "GET":
          reqResp.response = await request("get", api).set(headerAsObj);
          break;
        case "POST":
          reqResp.response = await request("post", api)
            .set(headerAsObj)
            .send(testReqObj.body);
          break;
        case "PUT":
          reqResp.response = await request("put", api)
            .set(headerAsObj)
            .send(testReqObj.body);
          break;
        case "DELETE":
          reqResp.response = await request("delete", api)
            .set(headerAsObj)
            .send(testReqObj.body);
          break;
        case "PATCH":
          reqResp.response = await request("patch", api)
            .set(headerAsObj)
            .send(testReqObj.body);
          break;
        default:
          throw new Error(`Unsupported HTTP Method${testReqObj.method}`);
      }

      logger.exitMethod("hitSingleDynamicRequestObject");
      return reqResp;
    } catch (err) {
      logger.error(err);
      logger.exitMethod("hitSingleDynamicRequestObject");
      throw err;
    }
  }
}

module.exports = ApiUtils;
