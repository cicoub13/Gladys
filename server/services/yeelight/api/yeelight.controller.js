const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');

module.exports = function YeelightController(yeelightHandler) {
  /**
   * @api {get} /api/v1/service/yeelight/devices Get Yeelight devices
   * @apiName getDevices
   * @apiGroup Yeelight
   */
  async function getDevices(req, res) {
    const devices = await yeelightHandler.getDevices();
    res.json(devices);
  }

  /**
   * @api {get} /api/v1/service/yeelight/scan Start a scan and return result message
   * @apiName scan
   * @apiGroup MagicDevices
   */
  async function scan(req, res) {
    const result = await yeelightHandler.scan();
    res.json(result);
  }

  return {
    'get /api/v1/service/yeelight/devices': {
      authenticated: true,
      controller: asyncMiddleware(getDevices),
    },
    'get /api/v1/service/yeelight/scan': {
      authenticated: true,
      controller: asyncMiddleware(scan),
    },
  };
};
