const { assert } = require('chai');
const { fake } = require('sinon');
const EventEmitter = require('events');
const proxyquire = require('proxyquire').noCallThru();
const GladysColorDevice = require('../../Gladys-color.json');
const YeelightApi = require('../../yeelight.mock.test');

const YeelightService = proxyquire('../../../../../services/yeelight/index', {
  'yeelight-awesome': YeelightApi,
});

const StateManager = require('../../../../../lib/state');

const event = new EventEmitter();
const stateManager = new StateManager(event);
const deviceManager = {
  get: fake.resolves([GladysColorDevice]),
};

const gladys = {
  device: deviceManager,
  event,
  stateManager,
};

describe('YeelightHandler - poll', () => {
  const yeelightService = YeelightService(gladys, 'a810b8db-6d04-4697-bed3-c4b72c996279');
  yeelightService.device.devices['0x00000000035ac142'] = GladysColorDevice;
  yeelightService.device.deviceAddressById.set('0x00000000035ac142', `192.168.0.1:55443`);
  yeelightService.device.deviceAddressById.set('0x0000000000000000', `not-found:55443`);

  it('should poll device states', async () => {
    await yeelightService.device.poll({
      external_id: 'yeelight:0x00000000035ac142',
      features: [{ category: 'light', type: 'binary' }, { category: 'light', type: 'brightness' }],
    });
  });
  it('should return Yeelight devices not found error', async () => {
    const promise = yeelightService.device.poll({
      external_id: 'yeelight:0x0000000000000000',
      features: [{ category: 'light', type: 'binary' }, { category: 'light', type: 'brightness' }],
    });
    return assert.isRejected(promise, 'YEELIGHT_DEVICE_NOT_FOUND');
  });
});
