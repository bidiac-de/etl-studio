module.exports = {
  // Test-Environment
  testEnvironment: 'jsdom',
  
  // Setup-Datei für globale Mocks
  setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
  
  // Test-Dateien Pattern
  testMatch: [
    '**/test/**/*.test.js',
    '**/test/**/*.spec.js'
  ],
  
  // Coverage-Konfiguration
  collectCoverage: true,
  collectCoverageFrom: [
    // Nur Core-Module (sollen getestet werden)
    'index.js',
    
    // Alle anderen JavaScript-Dateien AUSSER pages
    '**/*.js',
    
    // Ausschlüsse
    '!**/node_modules/**',
    '!**/test/**',
    '!**/coverage/**',
    '!**/libs/**',
    '!**/img/**',
    '!**/inc/**',
    '!**/*.config.js',
    '!**/package*.json',
    
    // Pages-Module komplett ausschließen
    '!pages/**/*.js'
  ],
  
  // Coverage-Report-Formate
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov'
  ],
  
  // Coverage-Verzeichnis
  coverageDirectory: 'coverage',
  
  // Coverage-Schwellenwerte (nur für index.js, da pages ausgeschlossen)
  coverageThreshold: {
    // Spezifische Schwellenwerte für index.js
    './index.js': {
      branches: 75,
      functions: 95,
      lines: 95,
      statements: 95
    }
  },
  
  // Test-Ausführung
  verbose: true,
  clearMocks: true,
  restoreMocks: true,
  
  // Module-Name-Mapping für bessere Imports
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@test/(.*)$': '<rootDir>/test/$1',
    '^@pages/(.*)$': '<rootDir>/pages/$1'
  },
  
  // Transform-Konfiguration
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  
  // Transform-Ignore-Patterns
  transformIgnorePatterns: [
    'node_modules/(?!(some-es6-module)/)'
  ],
  
  // Test-Timeout
  testTimeout: 10000,
  
  // Watch-Modus-Konfiguration
  watchPathIgnorePatterns: [
    'node_modules/',
    'coverage/',
    'libs/',
    'img/',
    'inc/'
  ],
  
  // Globale Variablen für Tests
  globals: {
    'process.env.NODE_ENV': 'test'
  },
  
  // Test-Environment-Optionen
  testEnvironmentOptions: {
    url: 'http://localhost:3000'
  },
  
  // Coverage-Anzeige-Optionen
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/test/',
    '/coverage/',
    '/libs/',
    '/img/',
    '/inc/',
    'setup.js'
  ],
  
  // Reporter-Konfiguration
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: '.',
      outputName: 'test-results.xml',
      classNameTemplate: '{classname}',
      titleTemplate: '{title}',
      ancestorSeparator: ' › ',
      usePathForSuiteName: true
    }]
  ],
  
  // Test-Suites-Konfiguration
  testPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/libs/',
    '/img/',
    '/inc/'
  ],
  
  // Module-Datei-Erweiterungen
  moduleFileExtensions: [
    'js',
    'json',
    'jsx',
    'ts',
    'tsx',
    'node'
  ],
  
  // Snapshot-Serializer
  snapshotSerializers: [],
  
  // Test-Ergebnis-Formatierung
  displayName: {
    name: 'ETL Studio Tests',
    color: 'blue'
  }
};
