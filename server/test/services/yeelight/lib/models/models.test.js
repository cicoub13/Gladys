const { expect } = require('chai');
const models = require('../../../../../services/yeelight/lib/models');
const GladysColorDevice = require('../../Gladys-color.json');
const GladysWhiteDevice = require('../../Gladys-white.json');
const GladysUnhandledDevice = require('../../Gladys-unhandled.json');
const yeelightColorDevice = require('../../yeelight-color.json');
const yeelightWhiteDevice = require('../../yeelight-white.json');
const yeelightUnhandledDevice = require('../../yeelight-unhandled.json');

describe('Yeelight models getDevice', () => {
  it('should return device and features for a color model', () => {
    const model = 'color';
    const device = models[model].getDevice(yeelightColorDevice, 'a810b8db-6d04-4697-bed3-c4b72c996279');
    expect(device).to.deep.eq(GladysColorDevice);
  });
  it('should return device and features for a white model', () => {
    const model = 'white';
    const device = models[model].getDevice(yeelightWhiteDevice, 'a810b8db-6d04-4697-bed3-c4b72c996279');
    expect(device).to.deep.eq(GladysWhiteDevice);
  });
  it('should return device and features for an unhandled model', () => {
    const model = 'unhandled';
    const device = models[model].getDevice(yeelightUnhandledDevice, 'a810b8db-6d04-4697-bed3-c4b72c996279');
    expect(device).to.deep.eq(GladysUnhandledDevice);
  });
});
