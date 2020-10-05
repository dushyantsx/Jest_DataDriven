const StringUtils = require(`../../utils/common/StringUtils`);
const errors = require(`../../errors/CustomErrors`);
const logger = require(`../../logger/Logger`);
const { ApiPropertyType } = require(`../../globals/enumerations`);
require(`../../globals/enumerations`);

const listOfRequestParams = [];
class ApiTemplateParams {
  setApiIndicesFromTemplate(headerRow) {
    logger.enterMethod("setApiIndicesFromTemplate");
    if (
      headerRow == null ||
      headerRow === undefined ||
      headerRow.length === 0
    ) {
      logger.warn("No elements in given header row array");
      return;
    }

    headerRow.map((el, index) => {
      logger.verbose(`Element passed: ${el}`);
      const elParam = el.split(":");
      const paramType = elParam[0];
      const paramName = elParam[1];

      const TemplateHeaderObject = {};
      TemplateHeaderObject.index = index;
      TemplateHeaderObject.type = paramType;

      logger.verbose(`Verifying parameter type: ${paramType}`);
      switch (paramType) {
        case `${ApiPropertyType.REQUEST.BASE_URI[0]}`:
        case `${ApiPropertyType.REQUEST.BASE_URI[1]}`:
        case `${ApiPropertyType.REQUEST.BASE_URI[2]}`:
          TemplateHeaderObject.value = StringUtils.defaultIfEmpty(
            paramName,
            paramType
          );
          break;
        case `${ApiPropertyType.REQUEST.ENDPOINT[0]}`:
        case `${ApiPropertyType.REQUEST.ENDPOINT[1]}`:
        case `${ApiPropertyType.REQUEST.ENDPOINT[2]}`:
          TemplateHeaderObject.value = StringUtils.defaultIfEmpty(
            paramName,
            paramType
          );
          break;
        case `${ApiPropertyType.REQUEST.HEADER[0]}`:
        case `${ApiPropertyType.REQUEST.HEADER[1]}`:
        case `${ApiPropertyType.REQUEST.HEADER[2]}`:
          //TemplateHeaderObject["value"] = paramName;
          TemplateHeaderObject.value = StringUtils.defaultIfEmpty(
            paramName,
            paramType
          );
          break;
        case `${ApiPropertyType.REQUEST.QUERY_PARAMS[0]}`:
        case `${ApiPropertyType.REQUEST.QUERY_PARAMS[1]}`:
        case `${ApiPropertyType.REQUEST.QUERY_PARAMS[2]}`:
          TemplateHeaderObject.value = paramName;
          break;
        case `${ApiPropertyType.REQUEST.PATH_PARAMS[0]}`:
        case `${ApiPropertyType.REQUEST.PATH_PARAMS[1]}`:
        case `${ApiPropertyType.REQUEST.PATH_PARAMS[2]}`:
          TemplateHeaderObject.value = paramName;
          break;
        case `${ApiPropertyType.REQUEST.METHOD[0]}`:
        case `${ApiPropertyType.REQUEST.METHOD[1]}`:
        case `${ApiPropertyType.REQUEST.METHOD[2]}`:
          TemplateHeaderObject.value = StringUtils.defaultIfEmpty(
            paramName,
            paramType
          );
          break;
        case `${ApiPropertyType.REQUEST.BODY[0]}`:
        case `${ApiPropertyType.REQUEST.BODY[1]}`:
        case `${ApiPropertyType.REQUEST.BODY[2]}`:
          TemplateHeaderObject.value = paramName;
          break;
        case `${ApiPropertyType.REQUEST.BODY_AS_FILE[0]}`:
        case `${ApiPropertyType.REQUEST.BODY_AS_FILE[1]}`:
        case `${ApiPropertyType.REQUEST.BODY_AS_FILE[2]}`:
          TemplateHeaderObject.value = paramName;
          break;
        case `${ApiPropertyType.RESPONSE.BODY.EXPECTED.KEY[0]}`:
        case `${ApiPropertyType.RESPONSE.BODY.EXPECTED.KEY[1]}`:
        case `${ApiPropertyType.RESPONSE.BODY.EXPECTED.KEY[2]}`:
          TemplateHeaderObject.value = StringUtils.defaultIfEmpty(
            paramName,
            paramType
          );
          break;
        case `${ApiPropertyType.RESPONSE.STATUS.CODE[0]}`:
        case `${ApiPropertyType.RESPONSE.STATUS.CODE[1]}`:
        case `${ApiPropertyType.RESPONSE.STATUS.CODE[2]}`:
        case `${ApiPropertyType.RESPONSE.STATUS.CODE[3]}`:
          TemplateHeaderObject.value = StringUtils.defaultIfEmpty(
            paramName,
            paramType
          );
          break;
        case `${ApiPropertyType.RESPONSE.STATUS.MESSAGE[0]}`:
        case `${ApiPropertyType.RESPONSE.STATUS.MESSAGE[1]}`:
        case `${ApiPropertyType.RESPONSE.STATUS.MESSAGE[2]}`:
        case `${ApiPropertyType.RESPONSE.STATUS.MESSAGE[3]}`:
          TemplateHeaderObject.value = StringUtils.defaultIfEmpty(
            paramName,
            paramType
          );
          break;
        // case "input":
        // case "expected":
        //   TemplateHeaderObject["value"] = paramName;
        //   break;
        default:
          throw new errors.InvalidApiPropertyInTemplate(
            `Invalid parameter type passed: ${paramType}`
          );
      }

      listOfRequestParams.push(TemplateHeaderObject);
    });

    logger.exitMethod("setApiIndicesFromTemplate");
    return listOfRequestParams;
  }

  printApiTemplateIndices() {
    logger.enterMethod("printApiTemplateIndices");
    listOfRequestParams.forEach((e, index) => {
      logger.verbose(`API Template at index ${index}: ${JSON.stringify(e)}`);
    });
    logger.exitMethod("printApiTemplateIndices");
  }
}

module.exports = ApiTemplateParams;
