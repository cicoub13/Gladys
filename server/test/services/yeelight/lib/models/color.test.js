const { expect } = require('chai');
const { getYeelightColorLight } = require('../../../../../services/yeelight/lib/models/color');
const yeelightDevice = require('../../yeelight-color.json');
const GladysDevice = require('../../Gladys-color.json');

describe('YeelightService - getYeelightColorLight', () => {
  it('get device and features for color model', () => {
    const device = getYeelightColorLight(yeelightDevice, 'a810b8db-6d04-4697-bed3-c4b72c996279');
    expect(device).to.deep.eq(GladysDevice);
  });
});
