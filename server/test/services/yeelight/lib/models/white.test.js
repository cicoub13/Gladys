const { expect } = require('chai');
const { getYeelightWhiteLight } = require('../../../../../services/yeelight/lib/models/white');
const yeelightDevice = require('../../yeelight-white.json');
const GladysDevice = require('../../Gladys-white.json');

describe('YeelightService - getYeelightWhiteLight', () => {
  it('get device and features for color model', () => {
    const device = getYeelightWhiteLight(yeelightDevice, 'a810b8db-6d04-4697-bed3-c4b72c996279');
    expect(device).to.deep.eq(GladysDevice);
  });
});
