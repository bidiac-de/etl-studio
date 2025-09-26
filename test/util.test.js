// Tests für ETL.util Funktionen
const ETL = require('../index.js');

describe('ETL.util', () => {
  describe('resolveLocal', () => {
    test('should resolve simple reference', () => {
      const schema = {
        definitions: {
          user: { type: 'string' }
        }
      };
      
      const result = ETL.util.resolveLocal(schema, '#/definitions/user');
      expect(result).toEqual({ type: 'string' });
    });

    test('should resolve nested reference', () => {
      const schema = {
        definitions: {
          user: {
            properties: {
              name: { type: 'string' }
            }
          }
        }
      };
      
      const result = ETL.util.resolveLocal(schema, '#/definitions/user/properties/name');
      expect(result).toEqual({ type: 'string' });
    });

    test('should return undefined for invalid reference', () => {
      const schema = {};
      const result = ETL.util.resolveLocal(schema, '#/invalid/path');
      expect(result).toBeUndefined();
    });
  });

  describe('deref', () => {
    test('should handle simple object without references', () => {
      const obj = { name: 'test', value: 123 };
      const result = ETL.util.deref(obj);
      expect(result).toEqual(obj);
    });

    test('should resolve $ref references', () => {
      const schema = {
        definitions: {
          user: { type: 'string' }
        },
        properties: {
          name: { $ref: '#/definitions/user' }
        }
      };
      
      const result = ETL.util.deref(schema);
      expect(result.properties.name).toEqual({ type: 'string' });
    });

    test('should handle circular references', () => {
      const obj = { name: 'test' };
      obj.self = obj;
      
      const result = ETL.util.deref(obj);
      expect(result.name).toBe('test');
      expect(result.self).toBe(result); // Same reference
    });

    test('should handle arrays', () => {
      const obj = [
        { name: 'item1' },
        { name: 'item2' }
      ];
      
      const result = ETL.util.deref(obj);
      expect(result).toEqual(obj);
    });

    test('should handle primitive values', () => {
      expect(ETL.util.deref('string')).toBe('string');
      expect(ETL.util.deref(123)).toBe(123);
      expect(ETL.util.deref(true)).toBe(true);
      expect(ETL.util.deref(null)).toBe(null);
    });
  });

  describe('formatDate', () => {
    test('should format current date by default', () => {
      const result = ETL.util.formatDate();
      expect(result).toMatch(/\d{2}\.\d{2}\.\d{4}, \d{2}:\d{2}:\d{2}/);
    });

    test('should format given date', () => {
      const testDate = new Date('2024-01-15T14:30:45');
      const result = ETL.util.formatDate(testDate);
      expect(result).toBe('15.01.2024, 14:30:45');
    });
  });

  describe('alert', () => {
    test('should call alert function without throwing error', () => {
      // Just test that the function doesn't throw an error
      expect(() => {
        ETL.util.alert('Test Header', 'Test Message');
      }).not.toThrow();
    });
  });

  describe('getFormData', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('should extract text input data', () => {
      // Mock the jQuery chain for this specific test
      const mockTextInput = {
        attr: jest.fn((attr) => {
          if (attr === 'type') return 'text';
          if (attr === 'name') return 'username';
        }),
        val: jest.fn(() => 'testuser')
      };

      const mockFind = jest.fn(() => ({
        each: jest.fn((callback) => {
          callback(0, mockTextInput);
        })
      }));

      const original$ = global.$;
      global.$ = jest.fn((selector) => {
        if (selector === '#testForm') {
          return { find: mockFind };
        }
        // Handle $(value) calls inside the callback
        if (selector === mockTextInput) {
          return mockTextInput;
        }
        return { find: jest.fn() };
      });

      const result = ETL.util.getFormData('#testForm');
      
      expect(result).toEqual({ username: 'testuser' });
      
      // Restore original $
      global.$ = original$;
    });

    test('should extract checkbox data', () => {
      const mockCheckboxInput = {
        attr: jest.fn((attr) => {
          if (attr === 'type') return 'checkbox';
          if (attr === 'name') return 'enabled';
        }),
        prop: jest.fn(() => true)
      };

      const mockFind = jest.fn(() => ({
        each: jest.fn((callback) => {
          callback(0, mockCheckboxInput);
        })
      }));

      const original$ = global.$;
      global.$ = jest.fn((selector) => {
        if (selector === '#testForm') {
          return { find: mockFind };
        }
        if (selector === mockCheckboxInput) {
          return mockCheckboxInput;
        }
        return { find: jest.fn() };
      });

      const result = ETL.util.getFormData('#testForm');
      
      expect(result).toEqual({ enabled: true });
      
      global.$ = original$;
    });

    test('should extract number input data', () => {
      const mockNumberInput = {
        attr: jest.fn((attr) => {
          if (attr === 'type') return 'number';
          if (attr === 'name') return 'count';
        }),
        val: jest.fn(() => '42')
      };

      const mockFind = jest.fn(() => ({
        each: jest.fn((callback) => {
          callback(0, mockNumberInput);
        })
      }));

      const original$ = global.$;
      global.$ = jest.fn((selector) => {
        if (selector === '#testForm') {
          return { find: mockFind };
        }
        if (selector === mockNumberInput) {
          return mockNumberInput;
        }
        return { find: jest.fn() };
      });

      const result = ETL.util.getFormData('#testForm');
      
      expect(result).toEqual({ count: 42 });
      
      global.$ = original$;
    });

    test('should handle multiple inputs', () => {
      const inputs = [
        {
          attr: jest.fn((attr) => {
            if (attr === 'type') return 'text';
            if (attr === 'name') return 'name';
          }),
          val: jest.fn(() => 'John')
        },
        {
          attr: jest.fn((attr) => {
            if (attr === 'type') return 'number';
            if (attr === 'name') return 'age';
          }),
          val: jest.fn(() => '25')
        }
      ];

      const mockFind = jest.fn(() => ({
        each: jest.fn((callback) => {
          inputs.forEach((input, index) => callback(index, input));
        })
      }));

      const original$ = global.$;
      global.$ = jest.fn((selector) => {
        if (selector === '#testForm') {
          return { find: mockFind };
        }
        // Handle $(value) calls inside the callback
        if (inputs.includes(selector)) {
          return selector;
        }
        return { find: jest.fn() };
      });

      const result = ETL.util.getFormData('#testForm');
      
      expect(result).toEqual({ name: 'John', age: 25 });
      
      global.$ = original$;
    });
  });
});