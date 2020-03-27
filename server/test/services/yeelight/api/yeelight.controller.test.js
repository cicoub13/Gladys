const { assert, fake } = require('sinon');
const YeelightController = require('../../../../services/yeelight/api/yeelight.controller');

const yeelightService = {
  discover: fake.resolves([{ name: 'Yeelight' }]),
};

const res = {
  json: fake.returns(null),
};

describe('YeelightController GET /service/yeelight/discover', () => {
  it('should call discover', async () => {
    const yeelightController = YeelightController(yeelightService);
    await yeelightController['get /api/v1/service/yeelight/discover'].controller({}, res);
    assert.called(yeelightService.discover);
  });
});
