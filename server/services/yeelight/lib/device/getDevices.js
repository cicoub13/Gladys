/**
 * @description Return list of Yeelight devices.
 * @returns {Array<Object>} Return array of Yeelight devices.
 * @example
 * getDevices();
 */
function getDevices() {
  return Object.keys(this.devices).map((deviceId) => this.devices[deviceId]);
}

module.exports = {
  getDevices,
};
