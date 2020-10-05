class Enums {
  static getEnumKeys(enumType) {
    return Object.keys(enumType);
  }

  static getEnumValues(enumType) {
    return Enums.getEnumKeys(enumType).map(function (key) {
      return enumType[key];
    });
  }

  static getEnumValue(enumType, key) {
    return enumType[
      Enums.getEnumKeys(enumType)
        .filter(function (k) {
          return key === k;
        })
        .pop() || ""
    ];
  }
}

module.exports = Enums;
