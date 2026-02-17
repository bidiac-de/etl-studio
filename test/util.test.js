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

  describe('applyComponentEditDialogResult', () => {
    test('should populate popup and enable save button for valid HTML payload', () => {
      const dialogElement = { html: jest.fn() };
      const saveButton = { attr: jest.fn() };
      const original$ = global.$;

      global.$ = jest.fn((selector) => {
        if (selector === '#componentEditDialogMain') {
          return dialogElement;
        }
        if (selector === '#btnSaveComponent') {
          return saveButton;
        }
        return { html: jest.fn(), attr: jest.fn() };
      });

      const result = ETL.util.applyComponentEditDialogResult("<label class='generatedField'>Field</label>");
      expect(result).toBe(true);
      expect(dialogElement.html).toHaveBeenCalled();
      expect(saveButton.attr).toHaveBeenCalledWith('disabled', false);

      global.$ = original$;
    });

    test('should show fallback text and disable save button for false payload', () => {
      const dialogElement = { html: jest.fn() };
      const saveButton = { attr: jest.fn() };
      const original$ = global.$;

      global.$ = jest.fn((selector) => {
        if (selector === '#componentEditDialogMain') {
          return dialogElement;
        }
        if (selector === '#btnSaveComponent') {
          return saveButton;
        }
        return { html: jest.fn(), attr: jest.fn() };
      });

      const result = ETL.util.applyComponentEditDialogResult(false);
      expect(result).toBe(false);
      expect(dialogElement.html).toHaveBeenCalledWith('No Server connection!');
      expect(saveButton.attr).toHaveBeenCalledWith('disabled', true);

      global.$ = original$;
    });
  });

  describe('insertTextAtCursor', () => {
    test('should return false for invalid target', () => {
      expect(ETL.util.insertTextAtCursor(null, '${ctx.host}')).toBe(false);
      expect(ETL.util.insertTextAtCursor({}, '${ctx.host}')).toBe(false);
    });

    test('should insert text at current selection and dispatch events', () => {
      const input = {
        value: 'prefix-suffix',
        selectionStart: 7,
        selectionEnd: 7,
        dispatchEvent: jest.fn()
      };

      const result = ETL.util.insertTextAtCursor(input, '${ctx.host}');

      expect(result).toBe(true);
      expect(input.value).toBe('prefix-${ctx.host}suffix');
      expect(input.selectionStart).toBe(18);
      expect(input.selectionEnd).toBe(18);
      expect(input.dispatchEvent).toHaveBeenCalledTimes(2);
    });
  });

  describe('initContextTemplateAssist', () => {
    test('should fetch context keys and render helper tokens', async () => {
      const keysContainer = { length: 1, html: jest.fn() };
      const assistBox = {
        find: jest.fn((selector) => {
          if (selector === '.contextTemplateKeys') {
            return keysContainer;
          }
          return { length: 0, html: jest.fn() };
        })
      };

      const selectorHandlers = {};
      const contextSelector = {
        attr: jest.fn((name) => {
          if (name === 'name') return 'context_id';
          if (name === 'data-context-keys-endpoint') return '/contexts/';
          return undefined;
        }),
        off: jest.fn(() => contextSelector),
        on: jest.fn((event, handler) => {
          selectorHandlers[event] = handler;
          return contextSelector;
        }),
        val: jest.fn(() => 'ctx-1')
      };

      const fallbackInput = {
        value: '',
        dispatchEvent: jest.fn(),
        focus: jest.fn()
      };
      const clickTokenButton = {
        attr: jest.fn((name) => (name === 'data-token' ? '${ctx.host}' : undefined))
      };
      const rootHandlers = {};
      const dataStore = {};
      const rootElement = {
        length: 1,
        off: jest.fn(() => rootElement),
        on: jest.fn((event, maybeSelector, maybeHandler) => {
          const handler = typeof maybeSelector === 'function' ? maybeSelector : maybeHandler;
          rootHandlers[event] = handler;
          return rootElement;
        }),
        data: jest.fn((key, value) => {
          if (value === undefined) {
            return dataStore[key];
          }
          dataStore[key] = value;
          return rootElement;
        }),
        find: jest.fn((selector) => {
          if (selector === "select[data-context-selector='true']") {
            return {
              each: jest.fn((callback) => {
                callback.call(contextSelector);
              })
            };
          }
          if (selector === "[data-context-assist-for='context_id']") {
            return assistBox;
          }
          if (selector === "input.formInput[type='text'], textarea.formInput") {
            return {
              first: jest.fn(() => [fallbackInput])
            };
          }
          return { length: 0, find: jest.fn(), each: jest.fn(), first: jest.fn(() => []) };
        })
      };

      const original$ = global.$;
      global.$ = jest.fn((selector) => {
        if (selector === rootElement) return rootElement;
        if (selector === contextSelector) return contextSelector;
        if (selector === clickTokenButton) return clickTokenButton;
        return rootElement;
      });

      ETL.api.get = jest.fn().mockResolvedValue({
        keys: [
          { key: 'host', source: 'credential', value_type: 'string', secret: false },
          { key: 'password', source: 'credential', value_type: 'string', secret: true }
        ]
      });

      ETL.util.initContextTemplateAssist(rootElement, 5);
      await Promise.resolve();
      await Promise.resolve();

      expect(ETL.api.get).toHaveBeenCalledWith(5, '/contexts/ctx-1/keys');
      expect(keysContainer.html).toHaveBeenCalledWith(expect.stringContaining('${ctx.host}'));
      expect(keysContainer.html).toHaveBeenCalledWith(expect.stringContaining('${ctx.password}'));

      rootHandlers['focusin.contextAssist'].call(fallbackInput);
      rootHandlers['click.contextAssist'].call(clickTokenButton);

      expect(fallbackInput.value).toBe('${ctx.host}');
      expect(fallbackInput.focus).toHaveBeenCalled();

      selectorHandlers['change.contextAssist'].call(contextSelector);
      await Promise.resolve();
      expect(ETL.api.get).toHaveBeenCalledTimes(2);

      global.$ = original$;
    });

    test('should show fallback helper text for empty context and endpoint failures', async () => {
      const keysContainer = { length: 1, html: jest.fn() };
      const assistBox = {
        find: jest.fn(() => keysContainer)
      };

      const selectorHandlers = {};
      let currentContextID = '';
      const contextSelector = {
        attr: jest.fn((name) => {
          if (name === 'name') return 'context_id';
          if (name === 'data-context-keys-endpoint') return '/contexts/{id}';
          return undefined;
        }),
        off: jest.fn(() => contextSelector),
        on: jest.fn((event, handler) => {
          selectorHandlers[event] = handler;
          return contextSelector;
        }),
        val: jest.fn(() => currentContextID)
      };

      const rootElement = {
        length: 1,
        off: jest.fn(() => rootElement),
        on: jest.fn(() => rootElement),
        data: jest.fn(),
        find: jest.fn((selector) => {
          if (selector === "select[data-context-selector='true']") {
            return {
              each: jest.fn((callback) => {
                callback.call(contextSelector);
              })
            };
          }
          if (selector === "[data-context-assist-for='context_id']") {
            return assistBox;
          }
          return { length: 0, each: jest.fn(), find: jest.fn() };
        })
      };

      const original$ = global.$;
      global.$ = jest.fn((selector) => {
        if (selector === rootElement) return rootElement;
        if (selector === contextSelector) return contextSelector;
        return rootElement;
      });

      ETL.api.get = jest.fn().mockRejectedValue(new Error('boom'));

      ETL.util.initContextTemplateAssist(rootElement, 3);
      expect(keysContainer.html).toHaveBeenCalledWith(expect.stringContaining('Select a context'));

      currentContextID = 'ctx-2';
      selectorHandlers['change.contextAssist'].call(contextSelector);
      await Promise.resolve();
      await Promise.resolve();

      expect(ETL.api.get).toHaveBeenCalledWith(3, '/contexts/ctx-2/keys');
      expect(keysContainer.html).toHaveBeenCalledWith(expect.stringContaining('Unable to load context keys'));

      global.$ = original$;
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

    test('should parse integer number input when data-number-kind is integer', () => {
      const mockIntegerInput = {
        attr: jest.fn((attr) => {
          if (attr === 'type') return 'number';
          if (attr === 'name') return 'limit';
          if (attr === 'data-number-kind') return 'integer';
          return undefined;
        }),
        val: jest.fn(() => '7')
      };

      const mockFind = jest.fn(() => ({
        each: jest.fn((callback) => {
          callback(0, mockIntegerInput);
        })
      }));

      const original$ = global.$;
      global.$ = jest.fn((selector) => {
        if (selector === '#testForm') {
          return { find: mockFind };
        }
        if (selector === mockIntegerInput) {
          return mockIntegerInput;
        }
        return { find: jest.fn() };
      });

      const result = ETL.util.getFormData('#testForm');
      expect(result).toEqual({ limit: 7 });

      global.$ = original$;
    });

    test('should map empty nullable number input to null', () => {
      const mockNullableNumberInput = {
        attr: jest.fn((attr) => {
          if (attr === 'type') return 'number';
          if (attr === 'name') return 'limit';
          if (attr === 'data-number-kind') return 'integer';
          if (attr === 'data-nullable') return 'true';
          return undefined;
        }),
        val: jest.fn(() => '')
      };

      const mockFind = jest.fn(() => ({
        each: jest.fn((callback) => {
          callback(0, mockNullableNumberInput);
        })
      }));

      const original$ = global.$;
      global.$ = jest.fn((selector) => {
        if (selector === '#testForm') {
          return { find: mockFind };
        }
        if (selector === mockNullableNumberInput) {
          return mockNullableNumberInput;
        }
        return { find: jest.fn() };
      });

      const result = ETL.util.getFormData('#testForm');
      expect(result).toEqual({ limit: null });

      global.$ = original$;
    });

    test('should map invalid nullable number input to null', () => {
      const mockNullableNumberInput = {
        attr: jest.fn((attr) => {
          if (attr === 'type') return 'number';
          if (attr === 'name') return 'limit';
          if (attr === 'data-number-kind') return 'integer';
          if (attr === 'data-nullable') return 'true';
          return undefined;
        }),
        val: jest.fn(() => 'abc')
      };

      const mockFind = jest.fn(() => ({
        each: jest.fn((callback) => {
          callback(0, mockNullableNumberInput);
        })
      }));

      const original$ = global.$;
      global.$ = jest.fn((selector) => {
        if (selector === '#testForm') {
          return { find: mockFind };
        }
        if (selector === mockNullableNumberInput) {
          return mockNullableNumberInput;
        }
        return { find: jest.fn() };
      });

      const result = ETL.util.getFormData('#testForm');
      expect(result).toEqual({ limit: null });

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

    test('should parse JSON field values for array/object inputs', () => {
      const mockJsonInput = {
        attr: jest.fn((attr) => {
          if (attr === 'data-json') return 'true';
          if (attr === 'data-json-type') return 'array';
          if (attr === 'name') return 'aggregations';
          return undefined;
        }),
        val: jest.fn(() => '[{"src":"amount","op":"sum","dest":"total"}]'),
        removeAttr: jest.fn(),
        prop: jest.fn()
      };

      const mockFind = jest.fn(() => ({
        each: jest.fn((callback) => {
          callback(0, mockJsonInput);
        })
      }));

      const original$ = global.$;
      global.$ = jest.fn((selector) => {
        if (selector === '#testForm') {
          return { find: mockFind };
        }
        if (selector === mockJsonInput) {
          return mockJsonInput;
        }
        return { find: jest.fn() };
      });

      const result = ETL.util.getFormData('#testForm');
      expect(result).toEqual({
        aggregations: [{ src: 'amount', op: 'sum', dest: 'total' }]
      });

      global.$ = original$;
    });

    test('should return false on invalid JSON field values', () => {
      const mockJsonInput = {
        attr: jest.fn((attr) => {
          if (attr === 'data-json') return 'true';
          if (attr === 'data-json-type') return 'object';
          if (attr === 'name') return 'group_by';
          return undefined;
        }),
        val: jest.fn(() => '{"broken": }'),
        removeAttr: jest.fn(),
        prop: jest.fn()
      };

      const mockFind = jest.fn(() => ({
        each: jest.fn((callback) => {
          callback(0, mockJsonInput);
        })
      }));

      const original$ = global.$;
      const alertSpy = jest.spyOn(ETL.util, 'alert').mockImplementation(() => {});

      global.$ = jest.fn((selector) => {
        if (selector === '#testForm') {
          return { find: mockFind };
        }
        if (selector === mockJsonInput) {
          return mockJsonInput;
        }
        return { find: jest.fn() };
      });

      const result = ETL.util.getFormData('#testForm');
      expect(result).toBe(false);
      expect(alertSpy).toHaveBeenCalled();

      alertSpy.mockRestore();
      global.$ = original$;
    });

    test('should default empty JSON input by configured json type', () => {
      const mockJsonInput = {
        attr: jest.fn((attr) => {
          if (attr === 'data-json') return 'true';
          if (attr === 'data-json-type') return 'object';
          if (attr === 'name') return 'config';
          return undefined;
        }),
        val: jest.fn(() => ''),
        removeAttr: jest.fn(),
        prop: jest.fn()
      };

      const mockFind = jest.fn(() => ({
        each: jest.fn((callback) => {
          callback(0, mockJsonInput);
        })
      }));

      const original$ = global.$;
      global.$ = jest.fn((selector) => {
        if (selector === '#testForm') {
          return { find: mockFind };
        }
        if (selector === mockJsonInput) {
          return mockJsonInput;
        }
        return { find: jest.fn() };
      });

      const result = ETL.util.getFormData('#testForm');
      expect(result).toEqual({ config: {} });

      global.$ = original$;
    });

    test('should map empty nullable JSON input to null', () => {
      const mockJsonInput = {
        attr: jest.fn((attr) => {
          if (attr === 'data-json') return 'true';
          if (attr === 'data-json-type') return 'object';
          if (attr === 'data-nullable') return 'true';
          if (attr === 'name') return 'config';
          return undefined;
        }),
        val: jest.fn(() => ''),
        removeAttr: jest.fn(),
        prop: jest.fn()
      };

      const mockFind = jest.fn(() => ({
        each: jest.fn((callback) => {
          callback(0, mockJsonInput);
        })
      }));

      const original$ = global.$;
      global.$ = jest.fn((selector) => {
        if (selector === '#testForm') {
          return { find: mockFind };
        }
        if (selector === mockJsonInput) {
          return mockJsonInput;
        }
        return { find: jest.fn() };
      });

      const result = ETL.util.getFormData('#testForm');
      expect(result).toEqual({ config: null });

      global.$ = original$;
    });

    test('should stop processing remaining fields after JSON parse failure', () => {
      const invalidJsonInput = {
        attr: jest.fn((attr) => {
          if (attr === 'data-json') return 'true';
          if (attr === 'data-json-type') return 'object';
          if (attr === 'name') return 'broken';
          return undefined;
        }),
        val: jest.fn(() => '{"broken": }'),
        removeAttr: jest.fn(),
        prop: jest.fn()
      };
      const secondInput = {
        attr: jest.fn((attr) => {
          if (attr === 'type') return 'text';
          if (attr === 'name') return 'should_not_be_processed';
          return undefined;
        }),
        val: jest.fn(() => 'value'),
        removeAttr: jest.fn(),
        prop: jest.fn()
      };

      const mockFind = jest.fn(() => ({
        each: jest.fn((callback) => {
          callback(0, invalidJsonInput);
          callback(1, secondInput);
        })
      }));

      const original$ = global.$;
      const alertSpy = jest.spyOn(ETL.util, 'alert').mockImplementation(() => {});

      global.$ = jest.fn((selector) => {
        if (selector === '#testForm') {
          return { find: mockFind };
        }
        if (selector === invalidJsonInput || selector === secondInput) {
          return selector;
        }
        return { find: jest.fn() };
      });

      const result = ETL.util.getFormData('#testForm');
      expect(result).toBe(false);
      expect(secondInput.val).not.toHaveBeenCalled();

      alertSpy.mockRestore();
      global.$ = original$;
    });

    test('should map empty nullable text input to null', () => {
      const mockTextInput = {
        attr: jest.fn((attr) => {
          if (attr === 'type') return 'text';
          if (attr === 'name') return 'optional_name';
          if (attr === 'data-nullable') return 'true';
          return undefined;
        }),
        val: jest.fn(() => '')
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
        if (selector === mockTextInput) {
          return mockTextInput;
        }
        return { find: jest.fn() };
      });

      const result = ETL.util.getFormData('#testForm');
      expect(result).toEqual({ optional_name: null });

      global.$ = original$;
    });
  });
});
