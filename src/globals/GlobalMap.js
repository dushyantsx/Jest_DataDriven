var gmp = [];

class GlobalMap {
  /**
   *
   * @param {String} k
   * @param {Object} v
   */
  static set(k, v) {
    let obj = { name: k, value: v };
    let alreadyExists = false;
    for (let i = 0; i < gmp.length; i++) {
      let el = gmp[i];
      if (Nuller.isNotNullObject(el)) {
        if (StringUtils.equalsIgnoreCase(el.name, obj.name)) {
          el.value = obj.value;
          alreadyExists = true;
          break;
        }
      }
    }
    if (alreadyExists == false) gmp.push(obj);
  }

  /**
   *
   * @param {String} k
   */
  static get(k) {
    gmp.forEach((el) => {
      if (Nuller.isNotNullObject(el)) {
        if (StringUtils.equalsIgnoreCase(el.name, k)) {
          return el.value;
        }
      }
    });
  }
}

module.exports = GlobalMap;
