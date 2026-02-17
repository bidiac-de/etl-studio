const fs = require('fs');
const path = require('path');
const vm = require('vm');

describe('Browser bootstrap path', () => {
  test('should auto-bootstrap contract when running in browser context', async () => {
    const source = fs.readFileSync(
      path.join(__dirname, '..', 'index.js'),
      'utf8'
    );

    const ajaxMock = jest.fn((options) => {
      if (options && typeof options.success === 'function') {
        options.success({
          contract_version: 'core-studio-v1',
          environments: [],
          rule_operators: ['eq'],
          rule_logical_operators: ['AND'],
          data_types: ['string'],
          setup_validation: {
            mode: 'none',
            required: false,
            endpoint: '/setup/validate',
            key_env_var: 'ETL_SETUP_ACCESS_KEY'
          }
        });
      }
    });

    const jqueryMock = jest.fn(() => ({
      attr: jest.fn(),
      append: jest.fn(),
      html: jest.fn(),
      find: jest.fn(() => ({ each: jest.fn() })),
      prop: jest.fn(),
      val: jest.fn(),
      removeAttr: jest.fn(),
      length: 0
    }));
    jqueryMock.ajax = ajaxMock;

    const context = {
      window: {},
      localStorage: {
        getItem: jest.fn(() => null),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn()
      },
      $: jqueryMock,
      server: [{ host: 'http://127.0.0.1:8000' }],
      console: {
        log: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
      },
      setTimeout,
      clearTimeout,
      Promise,
      JSON,
      Date
    };

    vm.runInNewContext(source, context);

    await Promise.resolve();
    await Promise.resolve();

    const urls = ajaxMock.mock.calls.map((args) => args[0].url);
    expect(urls).toContain('http://127.0.0.1:8000/setup/capabilities');
  });
});
