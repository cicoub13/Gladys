const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const GladysColorDevice = require('../../mocks/Gladys-color.json');
const GladysWhiteDevice = require('../../mocks/Gladys-white.json');
const GladysUnhandledDevice = require('../../mocks/Gladys-unhandled.json');
const YeelightApi = require('../../mocks/yeelight.mock.test');
const YeelightEmptyApi = require('../../mocks/yeelight-empty.mock.test');

const YeelightService = proxyquire('../../../../../services/yeelight/index', {
  'yeelight-awesome': YeelightApi,
});
const YeelightEmptyService = proxyquire('../../../../../services/yeelight/index', {
  'yeelight-awesome': YeelightEmptyApi,
});

const gladysWithoutDevices = {
  stateManager: {
    get: (key, externalId) => {
      return undefined;
    },
  },
};
const gladysWithColorAndUnhandledDevice = {
  stateManager: {
    get: (key, externalId) => {
      if (externalId === 'yeelight:0x00000000035ac142') {
        return GladysColorDevice;
      }
      if (externalId === 'yeelight:0x00000000035ac100') {
        return GladysUnhandledDevice;
      }
      return undefined;
    },
  },
};
const gladysWithColorAndWhiteDevice = {
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
const gladysWithThreeDevices = {
  stateManager: {
    get: (key, externalId) => {
      if (externalId === 'yeelight:0x00000000035ac142') {
        return GladysColorDevice;
      }
      if (externalId === 'yeelight:0x00000000035ac140') {
        return GladysWhiteDevice;
      }
      if (externalId === 'yeelight:0x00000000035ac100') {
        return GladysUnhandledDevice;
      }
      return undefined;
    },
  },
};

describe('YeelightHandler discover', () => {
  it('should found 3 devices, 3 of wich are new unknown devices', async () => {
    const yeelightService = YeelightService(gladysWithoutDevices, 'a810b8db-6d04-4697-bed3-c4b72c996279');
    const newDevices = await yeelightService.device.discover();
    expect(newDevices).to.deep.equal([GladysColorDevice, GladysWhiteDevice, GladysUnhandledDevice]);
  });
  it('should found 3 devices, 2 of wich is already in Gladys and 1 is a new unhandled unknown device', async () => {
    const yeelightService = YeelightService(gladysWithColorAndWhiteDevice, 'a810b8db-6d04-4697-bed3-c4b72c996279');
    const newDevices = await yeelightService.device.discover();
    expect(newDevices).to.deep.equal([GladysUnhandledDevice]);
  });
  it('should found 3 devices, 2 of wich is already in Gladys and 1 is a new unknown device', async () => {
    const yeelightService = YeelightService(gladysWithColorAndUnhandledDevice, 'a810b8db-6d04-4697-bed3-c4b72c996279');
    const newDevices = await yeelightService.device.discover();
    expect(newDevices).to.deep.equal([GladysWhiteDevice]);
  });
  it('should found 3 devices, 3 of wich are already in Gladys', async () => {
    const yeelightService = YeelightService(gladysWithThreeDevices, 'a810b8db-6d04-4697-bed3-c4b72c996279');
    const newDevices = await yeelightService.device.discover();
    expect(newDevices).to.deep.equal([]);
  });
  it('should found 0 devices', async () => {
    const yeelightService = YeelightEmptyService(gladysWithoutDevices, 'a810b8db-6d04-4697-bed3-c4b72c996279');
    const newDevices = await yeelightService.device.discover();
    expect(newDevices).to.deep.equal([]);
  });
});
