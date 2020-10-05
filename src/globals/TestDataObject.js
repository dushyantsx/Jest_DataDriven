class TestDataObject {
  InputObject() {
    return {};
  }

  ExpectedObject() {
    return {};
  }

  OutputObject() {
    return {};
  }

  UiTestDataObject() {
    const testObj = {
      request: this.InputObject(),
      response: this.OutputObject(),
      expected: this.ExpectedObject(),
      result: "INCOMPLETE",
      screenshotLocation: "",
      error: {},
      indexId: -1,
    };
    return testObj;
  }
}

module.exports = TestDataObject;
