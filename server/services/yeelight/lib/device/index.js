const { getDevices } = require('./getDevices');
const { poll } = require('./poll');
const { scan } = require('./scan');
const { setValue } = require('./setValue');

/**
 * @description Add ability to control a Yeelight device
 * @param {Object} gladys - Gladys instance.
 * @param {Object} yeelightApi - Yeelight Client.
 * @param {string} serviceId - UUID of the service in DB.
 * @example
 * const yeelightHandler = new YeelightHandler(gladys, client, serviceId);
 */
const YeelightHandler = function YeelightHandler(gladys, yeelightApi, serviceId) {
  this.gladys = gladys;
  this.yeelightApi = yeelightApi;
  this.serviceId = serviceId;

  this.devices = {};
  this.deviceAddressById = new Map();
};

YeelightHandler.prototype.getDevices = getDevices;
YeelightHandler.prototype.poll = poll;
YeelightHandler.prototype.scan = scan;
YeelightHandler.prototype.setValue = setValue;

module.exports = YeelightHandler;
