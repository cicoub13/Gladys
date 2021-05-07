const { assert } = require('chai');
const { BUTTON_STATUS } = require('../../../../utils/constants');
const { convertValue } = require('../../../../services/zigbee2mqtt/utils/convertValue');

describe('zigbee2mqtt convertValue', () => {
  it('should return binary 1', () => {
    const result = convertValue('binary', 'ON');
    return assert.deepEqual(result, 1);
  });
  it('should return binary 0', () => {
    const result = convertValue('binary', 'OFF');
    return assert.deepEqual(result, 0);
  });
  it('should return simple click state', () => {
    const result = convertValue('click', 'single');
    return assert.deepEqual(result, BUTTON_STATUS.CLICK);
  });
  it('should return double click state', () => {
    const result = convertValue('click', 'double');
    return assert.deepEqual(result, BUTTON_STATUS.DOUBLE_CLICK);
  });
  it('should return tripe click state', () => {
    const result = convertValue('click', 'triple');
    return assert.deepEqual(result, BUTTON_STATUS.TRIPLE_CLICK);
  });
  it('should return hold click state', () => {
    const result = convertValue('click', 'hold');
    return assert.deepEqual(result, BUTTON_STATUS.LONG_CLICK);
  });
  it('should return left click state', () => {
    const result = convertValue('click', 'left');
    return assert.deepEqual(result, BUTTON_STATUS.LEFT_CLICK);
  });
  it('should return left double click state', () => {
    const result = convertValue('click', 'left_double');
    return assert.deepEqual(result, BUTTON_STATUS.LEFT_DOUBLE_CLICK);
  });
  it('should return right click state', () => {
    const result = convertValue('click', 'right');
    return assert.deepEqual(result, BUTTON_STATUS.RIGHT_CLICK);
  });
  it('should return right double click state', () => {
    const result = convertValue('click', 'right_double');
    return assert.deepEqual(result, BUTTON_STATUS.RIGHT_DOUBLE_CLICK);
  });
  it('should return left hold click state', () => {
    const result = convertValue('click', 'left_long');
    return assert.deepEqual(result, BUTTON_STATUS.LEFT_HOLD_CLICK);
  });
  it('should return right hold click state', () => {
    const result = convertValue('click', 'right_long');
    return assert.deepEqual(result, BUTTON_STATUS.RIGHT_HOLD_CLICK);
  });
  it('should return default click state', () => {
    const result = convertValue('click', 'unknown');
    return assert.deepEqual(result, 'unknown');
  });
  it('should return unknown feature boolean true', () => {
    const result = convertValue('unknown feature', true);
    return assert.deepEqual(result, 1);
  });
  it('should return unknown feature boolean false', () => {
    const result = convertValue('unknown feature', false);
    return assert.deepEqual(result, 0);
  });
  it('should return unknown feature number', () => {
    const result = convertValue('unknown feature', 4);
    return assert.deepEqual(result, 4);
  });
  it('should return unknown feature string', () => {
    const result = convertValue('unknown feature', 'closed');
    return assert.equal(result, 'closed');
  });
  it('should throw Exception', () => {
    assert.throw(
      () => {
        convertValue('unknown feature', null);
      },
      Error,
      `Zigbee2mqqt don't handle value "null" for feature "unknown feature".`,
    );
  });
});
