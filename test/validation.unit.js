const chai = require('chai');
chai.should();

const { isValidUpdateMatrix, validateOptionalParam, validateOnLoadDelay } = require('../src/validation');

describe('isValidUpdateMatrix', function() {
  it('returns false for non-array', function() {
    isValidUpdateMatrix('asdf').should.equal(false);
  });
  it('returns false for non-string selector in updateConfig', function() {
    const matrix = [
      { selector: '.asdf', updateHTML: true },
      { selector: 1234, updateHTML: false }
    ];
    isValidUpdateMatrix(matrix).should.equal(false);
  });
  it('returns false for non-boolean defined updateHTML or updateAttrs', function() {
    const matrix = [
      { selector: '.asdf', updateHTML: true },
      { selector: 'div', updateAttrs: null }
    ];
    isValidUpdateMatrix(matrix).should.equal(false);
  });
  it('returns true for valid config', function() {
    const matrix = [
      { selector: '.asdf', updateHTML: true },
      { selector: 'div', updateAttrs: true }
    ];
    isValidUpdateMatrix(matrix).should.equal(true);
  });
});

describe('validateOptionalParam', function() {
  it('returns param for valid params', function() {
    validateOptionalParam('myParam', 'string', 'fallbackParam').should.equal('myParam');
    validateOptionalParam(true, 'boolean', false).should.equal(true);
    validateOptionalParam(4, 'number', 1).should.equal(4);
  });
  it('returns fallback for undefined', function() {
    validateOptionalParam(undefined, 'boolean', true).should.equal(true);
  });
  it('returns fallback for incorrect type', function() {
    validateOptionalParam('myParam', 'boolean', false).should.equal(false);
    validateOptionalParam(4, 'string', 'myParam').should.equal('myParam');
  });
});

describe('validateOnLoadDelay', function() {
  it('returns delayTime for valid delayTime param', function() {
    validateOnLoadDelay(200).should.equal(200);
  });
  it('returns 0 for negative integer', function() {
    validateOnLoadDelay(-100).should.equal(0);
  });
  it('returns 0 for any type that is not of type number', function() {
    validateOnLoadDelay("test").should.equal(0);
    validateOnLoadDelay(false).should.equal(0);
    validateOnLoadDelay(undefined).should.equal(0);
    validateOnLoadDelay(null).should.equal(0);
    validateOnLoadDelay({}).should.equal(0);
    validateOnLoadDelay(() => {}).should.equal(0);
    validateOnLoadDelay((typeof Symbol("test")).toString()).should.equal(0);
  });
});
