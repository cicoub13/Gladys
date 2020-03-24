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
};

module.exports = YeelightHandler;
