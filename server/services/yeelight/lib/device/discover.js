const logger = require('../../../../utils/logger');
const models = require('../models');
const { DEVICE_EXTERNAL_ID_BASE, DEVICES_MODELS, COMMAND_TYPE } = require('../utils/constants');

/**
 * @description Send a broadcast to find the devices
 * @returns {Promise<Array>} Resolve with array of new devices.
 * @example
 * discover();
 */
async function discover() {
  const discovery = new this.yeelightApi.Discover();
  let discoveredDevices = [];
  try {
    discoveredDevices = await discovery.start();
  } catch (error) {
    logger.warn(error);
  }
  await discovery.destroy();

  const unknownDevices = [];

  // If devices are found...
  logger.info(`${discoveredDevices.length} device(s) found while network scanning !`);
  if (discoveredDevices.length) {
    // ...check, for each of them, if it is already in Gladys...
    discoveredDevices.forEach((discoveredDevice) => {
      const deviceId = `${DEVICE_EXTERNAL_ID_BASE}:${discoveredDevice.id}`;
      const deviceInGladys = this.gladys.stateManager.get('deviceByExternalId', deviceId);
      if (deviceInGladys) {
        logger.debug(`Device "${discoveredDevice.id}" is already in Gladys !`);
      } else {
        logger.debug(`Device "${discoveredDevice.id}" found, model: "${discoveredDevice.model}"`);

        let model;
        if (Object.keys(DEVICES_MODELS).includes(discoveredDevice.model)) {
          // ...else, if the model is supported...
          if (
            discoveredDevice.capabilities.includes(COMMAND_TYPE.SET_RGB) &&
            discoveredDevice.capabilities.includes(COMMAND_TYPE.SET_HSV)
          ) {
            // ...and has color ability, create a color light device...
            model = models.color;
          } else {
            // ...else, create a white light device...
            model = models.white;
          }
        } else {
          // ...else the device is not yet handled.
          logger.info(`Device model "${discoveredDevice.model}" not handled yet !`);
          model = models.unhandled;
        }
        unknownDevices.push(model.getDevice(discoveredDevice, this.serviceId));
      }
    });
  }
  return unknownDevices;
}

module.exports = {
  discover,
};
