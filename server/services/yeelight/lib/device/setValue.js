const { DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');
const { NotFoundError } = require('../../../../utils/coreErrors');
const logger = require('../../../../utils/logger');

/**
 * @description Change value of a Yeelight device.
 * @param {Object} device - The device to control.
 * @param {Object} deviceFeature - The binary deviceFeature to control.
 * @param {string|number} value - The new value.
 * @example
 * setValue(device, deviceFeature, value);
 */
async function setValue(device, deviceFeature, value) {
  const deviceId = device.external_id.split(':')[1];
  logger.debug(`Changing state of device "${deviceId}" with value = ${value}`);

  const address = this.deviceAddressById.get(deviceId).split(':');
  const yeelight = new this.yeelightApi.Yeelight({ lightIp: address[0], lightPort: address[1] });

  let response;
  try {
    response = await yeelight.connect();
  } catch (error) {
    logger.warn(error);
  }
  if (!response || !response.connected) {
    throw new NotFoundError(`YEELIGHT_DEVICE_NOT_FOUND`);
  }

  let state;
  switch (deviceFeature.type) {
    case DEVICE_FEATURE_TYPES.LIGHT.BINARY:
      state = value === 1;
      await yeelight.setPower(state);
      break;
    case DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS:
      await yeelight.setBright(state);
      break;
    default:
      logger.debug(`Feature type "${deviceFeature.type}" not handled yet !`);
      break;
  }

  yeelight.disconnect();
}

module.exports = {
  setValue,
};
