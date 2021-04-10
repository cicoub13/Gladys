const { assert } = require('sinon');
const {
  convertXiaomiSwitchValueToGladysButtonValue,
} = require('../../../../services/xiaomi/lib/utils/convertXiaomiSwitchValueToGladysButtonValue');

describe('convertXiaomiSwitchValueToGladysButtonValue', () => {
  it('should return single click', async () => {
    const result = convertXiaomiSwitchValueToGladysButtonValue(1);
    assert.match(result, 'single');
  });
  it('should return double click', async () => {
    const result = convertXiaomiSwitchValueToGladysButtonValue(2);
    assert.match(result, 'double');
  });
  it('should return hold (press) click', async () => {
    const result = convertXiaomiSwitchValueToGladysButtonValue(3);
    assert.match(result, 'hold');
  });
  it('should return (hold release) click', async () => {
    const result = convertXiaomiSwitchValueToGladysButtonValue(4);
    assert.match(result, 'hold');
  });
  it('should return default click', async () => {
    const result = convertXiaomiSwitchValueToGladysButtonValue(0);
    assert.match(result, null);
  });
});
