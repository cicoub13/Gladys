const { SWITCH_STATUS } = require('./deviceStatus');
const { BUTTON_STATUS } = require('../../../../utils/constants');

/**
 * @description Convert value from Xiaomi switch to standard Gladys button value.
 * @param {number} switchStatus - Xiaomi switch value.
 * @returns {string} - Return the key of Gladys button value.
 * @example
 * const key = convertXiaomiSwitchValueToGladysButtonValue(1);
 */
function convertXiaomiSwitchValueToGladysButtonValue(switchStatus) {
  switch (switchStatus) {
    case SWITCH_STATUS.CLICK:
      return BUTTON_STATUS.CLICK;
    case SWITCH_STATUS.DOUBLE_CLICK:
      return BUTTON_STATUS.DOUBLE_CLICK;
    case SWITCH_STATUS.LONG_CLICK_PRESS:
    case SWITCH_STATUS.LONG_CLICK_RELEASE:
      return BUTTON_STATUS.HOLD_CLICK;
    default:
      return null;
  }
}

module.exports = {
  convertXiaomiSwitchValueToGladysButtonValue,
};
