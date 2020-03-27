const { assert, fake } = require('sinon');
const YeelightControllers = require('../../../../services/yeelight/api/yeelight.controller');

const yeelightService = {
  discover: fake.resolves([{ name: 'Yeelight' }]),
};

const res = {
  json: fake.returns(null),
};

describe('GET /service/yeelight/discover', () => {
  it('should discover', async () => {
    const yeelightController = YeelightControllers(yeelightService);
    await yeelightController['get /api/v1/service/yeelight/discover'].controller({}, res);
    assert.called(yeelightService.discover);
  });
});
