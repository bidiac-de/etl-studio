// Jest Setup für ETL Studio
// Mock localStorage
global.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

// Export localStorage mock for individual test files
global.localStorageMock = global.localStorage;

// Mock jQuery
const mockJQuery = jest.fn((selector) => {
  if (typeof selector === 'function') {
    // Handle $(document).ready() calls
    return { ready: jest.fn() };
  }
  
  const mockElement = {
    attr: jest.fn(),
    prop: jest.fn(),
    val: jest.fn(),
    html: jest.fn(),
    append: jest.fn(),
    length: 1,
    find: jest.fn((subSelector) => {
      if (subSelector === 'h2' || subSelector === 'p') {
        return mockElement;
      }
      return {
        each: jest.fn((callback) => {
          // This will be overridden in individual tests
          return mockJQuery();
        }),
        attr: jest.fn(),
        prop: jest.fn(),
        val: jest.fn(),
        html: jest.fn(),
        length: 0
      };
    })
  };
  
  // If selector is an element (from each callback), return a mock element
  if (selector && typeof selector === 'object' && selector.attr) {
    return selector; // Return the element as-is if it's already a mock
  }
  
  return mockElement;
});

// Add methods to jQuery function itself
mockJQuery.ajax = jest.fn();
global.$ = mockJQuery;

// Mock server array
global.server = [
  { host: 'http://localhost:8000' },
  { host: 'http://test-server:8000' }
];

// Mock serverID for componentEdit
global.serverID = 0;

// Mock editor (für drawflow)
global.editor = {
  getNodeFromId: jest.fn()
};

// Mock document.getElementById
const mockGetElementById = jest.fn(() => ({
  attr: jest.fn(),
  html: jest.fn()
}));
global.document = {
  getElementById: mockGetElementById
};

// Mock console.log um Tests sauber zu halten
global.console = {
  ...console,
  log: jest.fn()
};

// Load ETL object before tests and make it globally available
const ETL = require('../index.js');
global.ETL = ETL;
