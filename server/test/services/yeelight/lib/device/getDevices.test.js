const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const GladysColorDevice = require('../../Gladys-color.json');
const GladysWhiteDevice = require('../../Gladys-white.json');
const YeelightApi = require('../../yeelight.mock.test');

const YeelightService = proxyquire('../../../../../services/yeelight/index', {
  'yeelight-awesome': YeelightApi,
});

describe('YeelightHandler - getDevices', () => {
  const yeelightService = YeelightService({}, 'a810b8db-6d04-4697-bed3-c4b72c996279');

  it('should get no devices', async () => {
    const devices = await yeelightService.device.getDevices();

    expect(devices).to.deep.equal([]);
  });
  it('should get all devices', async () => {
    yeelightService.device.devices['0x00000000035ac142'] = GladysColorDevice;
    yeelightService.device.devices['0x00000000035ac140'] = GladysWhiteDevice;
    yeelightService.device.deviceAddressById.set('0x00000000035ac142', `192.168.0.1:55443`);
    yeelightService.device.deviceAddressById.set('0x00000000035ac140', `192.168.0.2:55443`);

    const devices = await yeelightService.device.getDevices();

    expect(devices).to.deep.equal([GladysColorDevice, GladysWhiteDevice]);

    devices.forEach((device) => {
      expect(device).to.have.property('service_id');
      expect(device).to.have.property('name');
      expect(device).to.have.property('model');
      expect(device).to.have.property('external_id');
      expect(device).to.have.property('selector');
      expect(device).to.have.property('should_poll');
      expect(device).to.have.property('poll_frequency');
      expect(device).to.have.property('features');
      device.features.forEach((feature) => {
        expect(feature).to.have.property('name');
        expect(feature).to.have.property('external_id');
        expect(feature).to.have.property('selector');
        expect(feature).to.have.property('category');
        expect(feature).to.have.property('type');
        expect(feature).to.have.property('read_only');
        expect(feature).to.have.property('has_feedback');
        expect(feature).to.have.property('min');
        expect(feature).to.have.property('max');
      });
    });
  });
});
