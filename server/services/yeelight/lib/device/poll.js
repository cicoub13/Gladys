const { EVENTS, DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');
const logger = require('../../../../utils/logger');
const { NotFoundError } = require('../../../../utils/coreErrors');
const { getDeviceFeature } = require('../../../../utils/device');

/**
 * @description Emit new state.
 * @param {Object} gladys - The gladys instance.
 * @param {Object} device - The device to update the state.
 * @param {string} featureType - The feature type.
 * @param {number} currentValue - The new state.
 * @example
 * emitNewState(gladys, device, featureType, currentValue);
 */
function emitNewState(gladys, device, featureType, currentValue) {
  const feature = getDeviceFeature(device, DEVICE_FEATURE_CATEGORIES.LIGHT, featureType);

  if (feature && feature.last_value !== currentValue) {
    const deviceId = device.external_id.split(':')[1];
    logger.debug(`Polling device ${deviceId}, ${featureType} change: ${feature.last_value} => ${currentValue}`);

    const deviceFeatureExternalId = `${device.external_id}:${featureType}`;
    gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: deviceFeatureExternalId,
      state: currentValue,
    });
  }
}

/**
 * @description Poll value of a Yeelight device.
 * @param {Object} device - The device to control.
 * @example
 * poll(device);
 */
async function poll(device) {
  const deviceId = device.external_id.split(':')[1];
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

  const state = await yeelight.getProperty([
    this.yeelightApi.DevicePropery.POWER,
    this.yeelightApi.DevicePropery.BRIGHT,
  ]);
  await yeelight.disconnect();

  // BINARY
  const currentBinaryValue = state.result.result[0] === 'on' ? 1 : 0;
  emitNewState(this.gladys, device, DEVICE_FEATURE_TYPES.LIGHT.BINARY, currentBinaryValue);

  // BRIGHTNESS
  const currentBrightnessValue = parseInt(state.result.result[1], 10);
  emitNewState(this.gladys, device, DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS, currentBrightnessValue);
}

module.exports = {
  poll,
};
