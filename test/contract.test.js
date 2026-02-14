const ETL = require('../index.js');

const validCapabilities = {
  contract_version: 'core-studio-v1',
  environments: [{ value: 'DEV', label: 'Development', icon: 'fa-solid fa-bug' }],
  rule_operators: ['==', '!='],
  rule_logical_operators: ['AND', 'OR'],
  data_types: ['string', 'integer'],
  setup_validation: {
    mode: 'none',
    required: false,
    endpoint: '/setup/validate',
    key_env_var: 'ETL_SETUP_ACCESS_KEY'
  }
};

describe('ETL.contract', () => {
  const originalRequireFn = ETL.contract.require;
  const originalGetCapabilities = ETL.api.getCapabilities;
  const originalBlock = ETL.contract.block;
  const original$ = global.$;
  const originalServer = global.server;

  afterEach(() => {
    ETL.contract.require = originalRequireFn;
    ETL.api.getCapabilities = originalGetCapabilities;
    ETL.contract.block = originalBlock;
    global.$ = original$;
    global.server = originalServer;
    ETL.contract.blocked = false;
    ETL.contract.cache = {};
    jest.clearAllMocks();
  });

  test('block should append blocker only once and set blocked flag', () => {
    const append = jest.fn();
    global.$ = jest.fn((selector) => {
      if (selector === 'body') {
        return { append };
      }
      return { append: jest.fn(), attr: jest.fn(), html: jest.fn(), find: jest.fn() };
    });

    ETL.contract.blocked = false;
    ETL.contract.block('first message');
    ETL.contract.block('second message');

    expect(ETL.contract.blocked).toBe(true);
    expect(append).toHaveBeenCalledTimes(1);
    expect(append.mock.calls[0][0]).toContain('first message');
  });

  test('capabilities validator should reject non-object payload', () => {
    expect(ETL.contract._isCapabilitiesPayloadValid(null)).toBe(false);
    expect(ETL.contract._isCapabilitiesPayloadValid('invalid')).toBe(false);
  });

  test('capabilities validator should reject payload missing environments', () => {
    const payload = { ...validCapabilities };
    delete payload.environments;
    expect(ETL.contract._isCapabilitiesPayloadValid(payload)).toBe(false);
  });

  test('capabilities validator should reject payload missing rule operators', () => {
    const payload = { ...validCapabilities };
    delete payload.rule_operators;
    expect(ETL.contract._isCapabilitiesPayloadValid(payload)).toBe(false);
  });

  test('capabilities validator should reject payload missing logical operators', () => {
    const payload = { ...validCapabilities };
    delete payload.rule_logical_operators;
    expect(ETL.contract._isCapabilitiesPayloadValid(payload)).toBe(false);
  });

  test('capabilities validator should reject payload missing data types', () => {
    const payload = { ...validCapabilities };
    delete payload.data_types;
    expect(ETL.contract._isCapabilitiesPayloadValid(payload)).toBe(false);
  });

  test('capabilities validator should reject payload with invalid setup_validation', () => {
    const payload = { ...validCapabilities, setup_validation: null };
    expect(ETL.contract._isCapabilitiesPayloadValid(payload)).toBe(false);
  });

  test('require should block on false capabilities response', async () => {
    ETL.contract.cache = {};
    ETL.contract.block = jest.fn();
    ETL.api.getCapabilities = jest.fn().mockResolvedValue(false);

    const result = await ETL.contract.require(0);

    expect(result).toBe(false);
    expect(ETL.contract.block).toHaveBeenCalledTimes(1);
  });

  test('require should block on non-object capabilities response', async () => {
    ETL.contract.cache = {};
    ETL.contract.block = jest.fn();
    ETL.api.getCapabilities = jest.fn().mockResolvedValue('invalid');

    const result = await ETL.contract.require(0);

    expect(result).toBe(false);
    expect(ETL.contract.block).toHaveBeenCalledTimes(1);
  });

  test('require should block on invalid capabilities shape', async () => {
    ETL.contract.cache = {};
    ETL.contract.block = jest.fn();
    ETL.api.getCapabilities = jest.fn().mockResolvedValue({
      ...validCapabilities,
      data_types: undefined
    });

    const result = await ETL.contract.require(0);

    expect(result).toBe(false);
    expect(ETL.contract.block).toHaveBeenCalledTimes(1);
  });

  test('require should cache valid capabilities and return true', async () => {
    ETL.contract.cache = {};
    ETL.api.getCapabilities = jest.fn().mockResolvedValue(validCapabilities);

    const result = await ETL.contract.require(0);

    expect(result).toBe(true);
    expect(ETL.contract.cache[0]).toEqual(validCapabilities);
  });

  test('getEnvironments and getDataTypes should return empty arrays when cache missing', () => {
    ETL.contract.cache = {};

    expect(ETL.contract.getEnvironments(0)).toEqual([]);
    expect(ETL.contract.getDataTypes(0)).toEqual([]);
  });

  test('getEnvironments and getDataTypes should return configured arrays when cache exists', () => {
    ETL.contract.cache = {
      0: {
        environments: [{ value: 'PROD', label: 'Production' }],
        data_types: ['string', 'float']
      }
    };

    expect(ETL.contract.getEnvironments(0)).toEqual([
      { value: 'PROD', label: 'Production' }
    ]);
    expect(ETL.contract.getDataTypes(0)).toEqual(['string', 'float']);
  });

  test('bootstrap should return true when server is undefined', async () => {
    delete global.server;

    await expect(ETL.contract.bootstrap()).resolves.toBe(true);
  });

  test('bootstrap should return true when server is null', async () => {
    global.server = null;

    await expect(ETL.contract.bootstrap()).resolves.toBe(true);
  });

  test('bootstrap should return true when no server ids exist', async () => {
    global.server = {};

    await expect(ETL.contract.bootstrap()).resolves.toBe(true);
  });

  test('bootstrap should return false when one server contract fails', async () => {
    global.server = {
      0: { host: 'http://localhost:8000' },
      1: { host: 'http://test-server:8000' }
    };
    ETL.contract.require = jest
      .fn()
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);

    await expect(ETL.contract.bootstrap()).resolves.toBe(false);
    expect(ETL.contract.require).toHaveBeenCalledTimes(2);
  });

  test('bootstrap should return true when all server contracts succeed', async () => {
    global.server = {
      0: { host: 'http://localhost:8000' },
      1: { host: 'http://test-server:8000' }
    };
    ETL.contract.require = jest
      .fn()
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true);

    await expect(ETL.contract.bootstrap()).resolves.toBe(true);
    expect(ETL.contract.require).toHaveBeenCalledTimes(2);
  });
});
