const { assert } = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const GladysDevice = require('../../Gladys-color.json');
const YeelightApi = require('../../yeelight.mock.test');

const YeelightService = proxyquire('../../../../../services/yeelight/index', {
  'yeelight-awesome': YeelightApi,
});

const gladys = {
  stateManager: {
    get: (key, externalId) => {
      return externalId === 'yeelight:0x00000000035ac142' ? GladysDevice : undefined;
    },
  },
};

describe('YeelightHandler - setValue', () => {
  const yeelightService = YeelightService(gladys, 'a810b8db-6d04-4697-bed3-c4b72c996279');
  yeelightService.device.devices['0x00000000035ac142'] = GladysDevice;
  yeelightService.device.deviceAddressById.set('0x00000000035ac142', `192.168.0.1:55443`);
  yeelightService.device.deviceAddressById.set('0x0000000000000000', `not-found:55443`);

  it('should set binary value', async () => {
    await yeelightService.device.setValue(
      {
        external_id: 'yeelight:0x00000000035ac142',
        features: [
          { category: 'light', type: 'binary' },
          { category: 'light', type: 'brightness' },
        ],
      },
      { category: 'light', type: 'binary' },
      1,
    );
  });
  it('should set brightness value', async () => {
    await yeelightService.device.setValue(
      {
        external_id: 'yeelight:0x00000000035ac142',
        features: [
          { category: 'light', type: 'binary' },
          { category: 'light', type: 'brightness' },
        ],
      },
      { category: 'light', type: 'brightness' },
      90,
    );
  });
  it('should return Yeelight device not found error', async () => {
    const promise = yeelightService.device.setValue(
      {
        external_id: 'yeelight:0x0000000000000000',
        features: [
          { category: 'light', type: 'binary' },
          { category: 'light', type: 'brightness' },
        ],
      },
      { category: 'light', type: 'binary' },
      1,
    );
    return assert.isRejected(promise, 'YEELIGHT_DEVICE_NOT_FOUND');
  });
});
