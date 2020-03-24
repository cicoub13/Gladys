const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const GladysColorDevice = require('../../Gladys-color.json');
const GladysWhiteDevice = require('../../Gladys-white.json');
const YeelightApi = require('../../yeelight.mock.test');

const { assert, fake } = sinon;
const YeelightService = proxyquire('../../../../../services/yeelight/index', {
  'yeelight-awesome': YeelightApi,
});

const device = { create: fake.resolves(null) };
const event = { emit: fake.resolves(null) };

const gladysWithoutDevices = {
  device,
  event,
  stateManager: {
    get: (key, externalId) => {
      return undefined;
    },
  },
};
const gladysWithOneDevice = {
  device,
  event,
  stateManager: {
    get: (key, externalId) => {
      return externalId === 'yeelight:0x00000000035ac142' ? GladysColorDevice : undefined;
    },
  },
};
const gladysWithTwoDevices = {
  device,
  event,
  stateManager: {
    get: (key, externalId) => {
      if (externalId === 'yeelight:0x00000000035ac142') {
        return GladysColorDevice;
      }
      if (externalId === 'yeelight:0x00000000035ac140') {
        return GladysWhiteDevice;
      }
      return undefined;
    },
  },
};

describe('YeelightHandler - scan', () => {
  beforeEach(() => {
    sinon.reset();
  });

  it('should found 3 devices, 2 of wich are new unknown devices and 1 is an unhandled model', async () => {
    const yeelightService = YeelightService(gladysWithoutDevices, 'a810b8db-6d04-4697-bed3-c4b72c996279');

    const result = await yeelightService.device.scan();
    expect(result).to.equal('FOUND DEVICES WHILE SCANNING');

    assert.callCount(gladysWithoutDevices.device.create, 2);
    expect(Object.keys(yeelightService.device.devices).length).to.eq(2);
  });
  it('should found 3 devices, 1 of wich is a new unknown device, 1 is already in Gladys and 1 is an unhandled model', async () => {
    const yeelightService = YeelightService(gladysWithOneDevice, 'a810b8db-6d04-4697-bed3-c4b72c996279');

    const result = await yeelightService.device.scan();
    expect(result).to.equal('FOUND DEVICES WHILE SCANNING');

    assert.callCount(gladysWithoutDevices.device.create, 1);
    expect(Object.keys(yeelightService.device.devices).length).to.eq(2);
  });
  it('should found 3 devices, 2 of wich are already in Gladys and 1 is an unhandled model', async () => {
    const yeelightService = YeelightService(gladysWithTwoDevices, 'a810b8db-6d04-4697-bed3-c4b72c996279');

    const result = await yeelightService.device.scan();
    expect(result).to.equal('FOUND DEVICES WHILE SCANNING, GLADYS ALREADY KNOWS THEM');

    assert.callCount(gladysWithoutDevices.device.create, 0);
    expect(Object.keys(yeelightService.device.devices).length).to.eq(2);
  });
});
