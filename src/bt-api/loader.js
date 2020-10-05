module.exports = {
  extendedLogging: function () {
    return process.env.JEST_EXTENDED_LOGGING != null
      ? process.env.JEST_EXTENDED_LOGGING
      : "";
  },

  extendedRequestLogging: function () {
    return module.exports.extendedLogging().indexOf("Request") > -1;
  },

  extendedResponseLogging: function () {
    return module.exports.extendedLogging().indexOf("Response") > -1;
  },

  enhanceStringify: function (response, ...params) {
    let responseString;
    if (module.exports.extendedRequestLogging()) {
      if (params[0] != null && params[0] instanceof String) {
        console.log(
          `Request.url: ${params[0]
            .replace(/\\n\\t\\t/g, "\n")
            .replace(/\\n/g, "\n")}`
        );
      }
      if (params[1] != null) {
        console.log(`headers: ${JSON.stringify(params[1], null, "\t")}`);
      }
    }
    if (response != null) {
      responseString = JSON.stringify(response, null, "\t");
      if (module.exports.extendedResponseLogging()) {
        console.log(`Response: ${responseString.replace(/\\n/g, "\n")}`);
      }
    }
    return responseString;
  },

  timeout: process.env.JEST_TIMEOUT != null ? process.env.JEST_TIMEOUT : 50000,
};
