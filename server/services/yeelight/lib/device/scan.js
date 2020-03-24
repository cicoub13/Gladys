const Promise = require('bluebird');
const { EVENTS } = require('../../../../utils/constants');
const logger = require('../../../../utils/logger');
const { getYeelightColorLight } = require('../models/color');
const { getYeelightWhiteLight } = require('../models/white');
const { DEVICE_EXTERNAL_ID_BASE, DEVICES_MODELS } = require('../utils/constants');

/**
 * @description Send a broadcast to find the devices
 * @returns {Promise<string>} Resolve with result scan message.
 * @example
 * scan();
 */
async function scan() {
  let response = 'NO DEVICES FOUND WHILE SCANNING';

  const discovery = new this.yeelightApi.Discover();
  let discoveredDevices = [];
  try {
    discoveredDevices = await discovery.start();
  } catch (error) {
    logger.warn(error);
  }
  await discovery.destroy();

  // If devices are found...
  logger.info(`${discoveredDevices.length} device(s) found while scanning !`);
  if (discoveredDevices.length) {
    const unknownDevices = [];

    // ...check, for each of them, if it is already in Gladys...
    discoveredDevices.forEach(async (discoveredDevice) => {
      const deviceId = `${DEVICE_EXTERNAL_ID_BASE}:${discoveredDevice.id}`;
      const alreadyInGladys = this.gladys.stateManager.get('deviceByExternalId', deviceId);
      if (alreadyInGladys) {
        logger.debug(`Device "${discoveredDevice.id}" is already in Gladys !`);

        // ...and if it is already mapped...
        const notMappedYet = this.deviceAddressById.get(discoveredDevice.id) === undefined;
        if (notMappedYet) {
          // ...map it otherwise.
          this.devices[discoveredDevice.id] = alreadyInGladys;
          this.deviceAddressById.set(discoveredDevice.id, `${discoveredDevice.host}:${discoveredDevice.port}`);
          logger.debug(`Device "${discoveredDevice.id}" is now mapped with the service !`);
        }
      } else {
        unknownDevices.push(discoveredDevice);
        logger.debug(`Device "${discoveredDevice.id}" found, model: "${discoveredDevice.model}"`);

        if (Object.keys(DEVICES_MODELS).includes(discoveredDevice.model)) {
          // ...else, if the model is supported...
          let newDevice;
          if (discoveredDevice.capabilities.includes('set_rgb') && discoveredDevice.capabilities.includes('set_hsv')) {
            // ...and has color ability, create a color light device...
            newDevice = getYeelightColorLight(discoveredDevice, this.serviceId);
          } else {
            // ...else, create a white light device...
            newDevice = getYeelightWhiteLight(discoveredDevice, this.serviceId);
          }
          // ...map it...
          this.devices[discoveredDevice.id] = newDevice;
          this.deviceAddressById.set(discoveredDevice.id, `${discoveredDevice.host}:${discoveredDevice.port}`);
          logger.debug(`Device "${discoveredDevice.id}" is now mapped with the service !`);

          // ...and add it to Gladys.
          this.gladys.device.create(newDevice);
          logger.debug(`Device "${discoveredDevice.id}" is now in Gladys !`);

          this.gladys.event.emit(EVENTS.DEVICE.NEW, newDevice);
        } else {
          // ...else alert.
          logger.warn(`Device model "${discoveredDevice.model}" not handled yet !`);
        }
      }
    });

    // If unknown devices are found...
    logger.info(`DEBUG ${unknownDevices.length} unknown devices`);
    if (unknownDevices.length) {
      response = 'FOUND DEVICES WHILE SCANNING';
    } else {
      response = 'FOUND DEVICES WHILE SCANNING, GLADYS ALREADY KNOWS THEM';
    }
  }

  return response;
}

module.exports = {
  scan,
};
