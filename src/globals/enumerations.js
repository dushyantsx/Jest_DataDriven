module.exports.ApiPropertyType = Object.freeze({
  REQUEST: {
    QUERY_PARAMS: ["request.query.param", "query.param", "qp"],
    PATH_PARAMS: ["request.path.param", "path.param", "pp"],
    METHOD: ["request.method", "req.method", "method"],
    HEADER: ["request.header", "req.header", "reqh"],
    BODY: ["request.body", "req.body", "reqb"],
    BODY_AS_FILE: ["request.body.file", "req.body.file", "reqbf"],
    BASE_URI: ["request.base.uri", "base.uri", "buri"],
    ENDPOINT: ["request.endpoint", "endpoint", "endp"],
  },
  RESPONSE: {
    HEADER: ["response.header", "res.header", "resh"],
    STATUS: {
      CODE: [
        "response.status.code",
        "response.code",
        "status.code",
        "expected.status.code",
      ],
      MESSAGE: [
        "response.status.message",
        "response.message",
        "status.message",
        "expected.status.message",
      ],
    },
    BODY: {
      FULL: ["response.body.full", "response.body"],
      RECEIVED: {
        KEY: ["response.body.received.key", "received.key", "rbrk"],
        VALUE: "response.body.received.value",
      },
      EXPECTED: {
        KEY: ["response.body.expected.key", "expected.key", "rbek"],
        VALUE: "response.body.expected.value",
      },
    },
  },
});

module.exports.TestResultStatus = Object.freeze({
  Pass: "PASS",
  Fail: "FAIL",
  InProgress: "IN PROGRESS",
  Unknown: "UNKNOWN",
  Skipped: "SKIPPED",
});

module.exports.ResultLevel = Object.freeze({
  TestCase: 0,
  TestStep: 1,
  TestStepData: 2,
});

module.exports.Timeouts = Object.freeze({
  Page: 0,
  Element: 1,
  Implicit: 2,
  Test: 3,
});

module.exports.LocFindStrategy = {
  Id: "id",
  Name: "name",
  Xpath: "xpath",
  CssSel: "css",
  ClassName: "classname",
  LinkText: "linktext",
};
