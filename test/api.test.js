// Tests für ETL.api Funktionen
const ETL = require('../index.js');

describe('ETL.api', () => {
  beforeEach(() => {
    // Reset jQuery mock
    jest.clearAllMocks();
  });

  describe('onError', () => {
    test('should handle basic error response', () => {
      const errorData = {
        statusText: 'Not Found',
        responseJSON: {
          detail: [{
            msg: 'Resource not found',
            loc: ['path', 'to', 'error']
          }]
        }
      };

      // Mock ETL.util.alert
      ETL.util.alert = jest.fn();

      ETL.api.onError(errorData);

      expect(ETL.util.alert).toHaveBeenCalledWith(
        'Not Found',
        '<kbd>Resource not found</kbd>'
      );
    });

    test('should handle error without responseJSON', () => {
      const errorData = {
        statusText: 'Server Error'
      };

      ETL.util.alert = jest.fn();

      ETL.api.onError(errorData);

      expect(ETL.util.alert).toHaveBeenCalledWith(
        'Server Error',
        'Unexpected response from server'
      );
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

    test('should handle POST request error with showError=true', async () => {
      const errorData = { statusText: 'Error' };
      $.ajax.mockImplementation((options) => {
        options.error(errorData);
      });

      ETL.api.onError = jest.fn();

      const result = await ETL.api.post(0, '/test', {}, true);

      expect(ETL.api.onError).toHaveBeenCalledWith(errorData);
      expect(result).toBe(false);
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

    test('should handle PUT request error with showError=true', async () => {
      const errorData = { statusText: 'Error' };
      $.ajax.mockImplementation((options) => {
        options.error(errorData);
      });

      ETL.api.onError = jest.fn();

      const result = await ETL.api.put(0, '/test/1', {}, true);

      expect(ETL.api.onError).toHaveBeenCalledWith(errorData);
      expect(result).toBe(false);
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

    test('should handle DELETE request error with showError=true', async () => {
      const errorData = { statusText: 'Error' };
      $.ajax.mockImplementation((options) => {
        options.error(errorData);
      });

      ETL.api.onError = jest.fn();

      const result = await ETL.api.delete(0, '/test/1', true);

      expect(ETL.api.onError).toHaveBeenCalledWith(errorData);
      expect(result).toBe(false);
    });
  });
});
