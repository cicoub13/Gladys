const { assert, fake } = require('sinon');
const YeelightControllers = require('../../../../services/yeelight/api/yeelight.controller');

const devices = [{ name: 'Yeelight 1' }];
const result = 'FOUND DEVICES WHILE SCANNING';

const yeelightService = {
  getDevices: fake.resolves(devices),
  scan: fake.resolves(result),
};

const res = {
  json: fake.returns(null),
};

describe('GET /service/yeelight/devices', () => {
  it('should get devices', async () => {
    const yeelightController = YeelightControllers(yeelightService);
    await yeelightController['get /api/v1/service/yeelight/devices'].controller({}, res);
    assert.called(yeelightService.getDevices);
  });
});

describe('GET /service/yeelight/scan', () => {
  it('should scan', async () => {
    const yeelightController = YeelightControllers(yeelightService);
    await yeelightController['get /api/v1/service/yeelight/scan'].controller({}, res);
    assert.called(yeelightService.scan);
  });
});
