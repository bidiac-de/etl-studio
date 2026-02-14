const ETL = require('../index.js');

const validCapabilities = {
  contract_version: 'core-studio-v1',
  environments: [{ value: 'DEV', label: 'Development', icon: 'fa-solid fa-bug' }],
  rule_operators: ['==', '!='],
  rule_logical_operators: ['AND', 'OR'],
  data_types: ['string', 'integer'],
  setup_validation: { mode: 'none', required: false, endpoint: '/setup/validate', key_env_var: 'ETL_SETUP_ACCESS_KEY' }
};

describe('ETL.api', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ETL.contract.blocked = false;
    ETL.contract.cache = { 0: validCapabilities };
  });

  describe('onError', () => {
    test('should handle canonical error response', () => {
      const errorData = {
        responseJSON: {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed.',
            details: [{ msg: 'Invalid field value' }]
          }
        }
      };

      ETL.util.alert = jest.fn();
      ETL.api.onError(errorData);

      expect(ETL.util.alert).toHaveBeenCalledWith(
        "<i class='fa-solid fa-triangle-exclamation pico-color-red-550'></i> Error: VALIDATION_ERROR",
        expect.stringContaining('Request validation failed.')
      );
    });

    test('should handle unknown response shape', () => {
      ETL.util.alert = jest.fn();
      ETL.api.onError({ statusText: 'Server Error' });
      expect(ETL.util.alert).toHaveBeenCalledWith(
        "<i class='fa-solid fa-triangle-exclamation pico-color-red-550'></i> Error: Server Error",
        'Unexpected response from server.'
      );
    });
  });

  describe('contract bootstrap', () => {
    test('should fetch capabilities before non-setup request when cache is empty', async () => {
      ETL.contract.cache = {};
      const calls = [];

      $.ajax.mockImplementation((options) => {
        calls.push(options.url);
        if (options.url.endsWith('/setup/capabilities')) {
          options.success(validCapabilities);
          return;
        }
        options.success({ ok: true });
      });

      const result = await ETL.api.get(0, '/test', { param: 'value' });
      expect(result).toEqual({ ok: true });
      expect(calls[0]).toBe('http://localhost:8000/setup/capabilities');
      expect(calls[1]).toBe('http://localhost:8000/test');
    });

    test('should hard-block and stop request flow on contract mismatch', async () => {
      ETL.contract.cache = {};
      ETL.contract.block = jest.fn();

      $.ajax.mockImplementation((options) => {
        if (options.url.endsWith('/setup/capabilities')) {
          options.success({ ...validCapabilities, contract_version: 'legacy-v0' });
          return;
        }
        options.success({ ok: true });
      });

      const result = await ETL.api.get(0, '/test');
      expect(result).toBe(false);
      expect(ETL.contract.block).toHaveBeenCalledTimes(1);
      expect($.ajax).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET requests', () => {
    test('should make successful GET request', async () => {
      const mockData = { test: 'data' };
      $.ajax.mockImplementation((options) => {
        options.success(mockData);
      });

      const result = await ETL.api.get(0, '/test', { param: 'value' });

      expect($.ajax).toHaveBeenCalledWith({
        url: 'http://localhost:8000/test',
        data: { param: 'value' },
        method: 'GET',
        timeout: 2000,
        success: expect.any(Function),
        error: expect.any(Function)
      });
      expect(result).toEqual(mockData);
    });

    test('should handle GET request error', async () => {
      const errorData = { statusText: 'Error' };
      $.ajax.mockImplementation((options) => {
        options.error(errorData);
      });

      ETL.api.onError = jest.fn();
      const result = await ETL.api.get(0, '/test', {}, true);
      expect(result).toBe(false);
    });

    test('should return false for invalid server ID', async () => {
      const result = await ETL.api.get(999, '/test');
      expect(result).toBe(false);
    });
  });

  describe('POST requests', () => {
    test('should make successful POST request', async () => {
      const mockData = { success: true };
      const postData = { name: 'test' };

      $.ajax.mockImplementation((options) => {
        options.success(mockData);
      });

      const result = await ETL.api.post(0, '/test', postData);

      expect($.ajax).toHaveBeenCalledWith({
        url: 'http://localhost:8000/test',
        data: JSON.stringify(postData),
        method: 'POST',
        timeout: 2000,
        contentType: 'application/json; charset=utf-8',
        success: expect.any(Function),
        error: expect.any(Function)
      });
      expect(result).toEqual(mockData);
    });
  });

  describe('PUT requests', () => {
    test('should make successful PUT request', async () => {
      const mockData = { updated: true };
      const putData = { id: 1, name: 'updated' };

      $.ajax.mockImplementation((options) => {
        options.success(mockData);
      });

      const result = await ETL.api.put(0, '/test/1', putData);

      expect($.ajax).toHaveBeenCalledWith({
        url: 'http://localhost:8000/test/1',
        data: JSON.stringify(putData),
        method: 'PUT',
        timeout: 2000,
        contentType: 'application/json; charset=utf-8',
        success: expect.any(Function),
        error: expect.any(Function)
      });
      expect(result).toEqual(mockData);
    });
  });

  describe('DELETE requests', () => {
    test('should make successful DELETE request', async () => {
      $.ajax.mockImplementation((options) => {
        options.success({});
      });

      const result = await ETL.api.delete(0, '/test/1');

      expect($.ajax).toHaveBeenCalledWith({
        url: 'http://localhost:8000/test/1',
        method: 'DELETE',
        timeout: 2000,
        success: expect.any(Function),
        error: expect.any(Function)
      });
      expect(result).toBe(true);
    });
  });
});
