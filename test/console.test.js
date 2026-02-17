// Tests für ETL.console Funktionen
const ETL = require('../index.js');

describe('ETL.console', () => {
  beforeEach(() => {
    // Reset localStorage vor jedem Test
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('getLocaleDatetime', () => {
    test('should return formatted datetime string', () => {
      const result = ETL.console.getLocaleDatetime();
      expect(result).toMatch(/\d{1,2}:\d{2}:\d{2}/);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(10);
    });
  });

  describe('log', () => {
    test('should call log function without throwing error', () => {
      expect(() => {
        ETL.console.log('Test message');
      }).not.toThrow();
    });

    test('should call log function without timestamp without throwing error', () => {
      expect(() => {
        ETL.console.log('Test message', false);
      }).not.toThrow();
    });

    test('should call log function with existing log without throwing error', () => {
      // Mock localStorage.getItem to return existing log
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = jest.fn((key) => {
        if (key === 'etlConsoleLog') return 'Previous log\r\n';
        return null;
      });
      
      expect(() => {
        ETL.console.log('New message');
      }).not.toThrow();
      
      // Restore original function
      localStorage.getItem = originalGetItem;
    });

    test('should call log function with large buffer without throwing error', () => {
      // Mock localStorage.getItem to return large log
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = jest.fn((key) => {
        if (key === 'etlConsoleLog') return 'x'.repeat(15000); // 15k chars
        return null;
      });
      
      expect(() => {
        ETL.console.log('Test message');
      }).not.toThrow();
      
      // Restore original function
      localStorage.getItem = originalGetItem;
    });
  });

  describe('get', () => {
    test('should call get function without throwing error', () => {
      expect(() => {
        ETL.console.get();
      }).not.toThrow();
    });

    test('should return string from get function', () => {
      const result = ETL.console.get();
      expect(typeof result).toBe('string');
    });
  });

  describe('clear', () => {
    test('should call clear function without throwing error', () => {
      expect(() => {
        ETL.console.clear();
      }).not.toThrow();
    });
  });

  describe('fireChangeHandler', () => {
    test('should call fireChangeHandler function without throwing error', () => {
      const mockHandler = jest.fn();
      ETL.console.onChangeHandler = mockHandler;
      
      expect(() => {
        ETL.console.fireChangeHandler();
      }).not.toThrow();
    });
  });
});
