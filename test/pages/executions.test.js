const executions = require('../../pages/uiExecutions/executions.js');

describe('Executions helpers', () => {
  test('normalizeServerId should parse valid integers', () => {
    expect(executions.normalizeServerId('42')).toBe(42);
    expect(executions.normalizeServerId(7)).toBe(7);
  });

  test('normalizeServerId should return 0 for invalid values', () => {
    expect(executions.normalizeServerId('abc')).toBe(0);
    expect(executions.normalizeServerId(undefined)).toBe(0);
    expect(executions.normalizeServerId(NaN)).toBe(0);
  });

  test('formatDuration should handle milliseconds', () => {
    var start = '2026-01-01T12:00:00.000Z';
    var end = '2026-01-01T12:00:00.500Z';
    expect(executions.formatDuration(start, end)).toBe('500ms');
  });

  test('formatDuration should handle seconds', () => {
    var start = '2026-01-01T12:00:00Z';
    var end = '2026-01-01T12:00:45Z';
    expect(executions.formatDuration(start, end)).toBe('45s');
  });

  test('formatDuration should handle minutes and seconds', () => {
    var start = '2026-01-01T12:00:00Z';
    var end = '2026-01-01T12:05:30Z';
    expect(executions.formatDuration(start, end)).toBe('5m 30s');
  });

  test('formatDuration should handle hours', () => {
    var start = '2026-01-01T12:00:00Z';
    var end = '2026-01-01T14:30:15Z';
    expect(executions.formatDuration(start, end)).toBe('2h 30m 15s');
  });

  test('formatDuration should return dash for missing start', () => {
    expect(executions.formatDuration(null, null)).toBe('-');
    expect(executions.formatDuration('', '')).toBe('-');
  });

  test('formatDuration should use current time for missing end', () => {
    var start = new Date(Date.now() - 5000).toISOString();
    var result = executions.formatDuration(start, null);
    expect(result).toMatch(/\d+s/);
  });

  test('formatDuration should return dash for negative duration', () => {
    var start = '2026-01-01T12:05:00Z';
    var end = '2026-01-01T12:00:00Z';
    expect(executions.formatDuration(start, end)).toBe('-');
  });

  test('statusBadgeHTML should include status text', () => {
    expect(executions.statusBadgeHTML('SUCCESS')).toContain('SUCCESS');
    expect(executions.statusBadgeHTML('FAILED')).toContain('FAILED');
    expect(executions.statusBadgeHTML('RUNNING')).toContain('RUNNING');
    expect(executions.statusBadgeHTML('RETRYING')).toContain('RETRYING');
  });

  test('statusBadgeHTML should include status-specific CSS class', () => {
    expect(executions.statusBadgeHTML('SUCCESS')).toContain('executionStatusSUCCESS');
    expect(executions.statusBadgeHTML('FAILED')).toContain('executionStatusFAILED');
    expect(executions.statusBadgeHTML('RUNNING')).toContain('executionStatusRUNNING');
    expect(executions.statusBadgeHTML('RETRYING')).toContain('executionStatusRETRYING');
  });

  test('statusBadgeHTML should handle unknown statuses gracefully', () => {
    var badge = executions.statusBadgeHTML('UNKNOWN');
    expect(badge).toContain('UNKNOWN');
    expect(badge).toContain('executionStatusPill');
  });

  test('formatDateTime should format valid ISO strings', () => {
    var result = executions.formatDateTime('2026-01-15T10:30:00Z');
    expect(typeof result).toBe('string');
    expect(result).not.toBe('-');
    expect(result.length).toBeGreaterThan(5);
  });

  test('formatDateTime should return dash for empty/null', () => {
    expect(executions.formatDateTime(null)).toBe('-');
    expect(executions.formatDateTime('')).toBe('-');
    expect(executions.formatDateTime(undefined)).toBe('-');
  });

  test('formatDateTime should return original string for invalid date', () => {
    expect(executions.formatDateTime('not-a-date')).toBe('not-a-date');
  });
});
