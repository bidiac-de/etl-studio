const schedules = require('../../pages/uiSchedules/schedules.js');

describe('Schedules helpers', () => {
  test('should parse empty advanced JSON as empty object', () => {
    expect(schedules.parseJsonObject('')).toEqual({});
  });

  test('should reject non-object advanced JSON payloads', () => {
    expect(() => schedules.parseJsonObject('[]')).toThrow('Advanced trigger JSON must be an object.');
  });

  test('should merge typed and advanced args with advanced override precedence', () => {
    const typed = { minutes: 5, timezone: 'UTC' };
    const advanced = { timezone: 'Europe/Berlin', jitter: 10 };
    expect(schedules.mergeTriggerArgs(typed, advanced)).toEqual({
      minutes: 5,
      timezone: 'Europe/Berlin',
      jitter: 10
    });
  });

  test('should split trigger args and preserve unknown keys as advanced args', () => {
    const split = schedules.splitAdvancedArgs('interval', {
      minutes: 15,
      timezone: 'UTC',
      custom_key: 'value'
    });
    expect(split.typed).toEqual({ minutes: 15, timezone: 'UTC' });
    expect(split.advanced).toEqual({ custom_key: 'value' });
  });

  test('should build valid cron trigger args from typed form values', () => {
    const args = schedules.buildTypedTriggerArgs('cron', {
      cronMinute: '0',
      cronHour: '9',
      cronDayOfWeek: 'mon-fri',
      cronTimezone: 'UTC'
    });
    expect(args).toEqual({
      minute: '0',
      hour: '9',
      day_of_week: 'mon-fri',
      timezone: 'UTC'
    });
  });

  test('should fail cron trigger creation when no scheduling fields are provided', () => {
    expect(() => schedules.buildTypedTriggerArgs('cron', {
      cronTimezone: 'UTC'
    })).toThrow('Cron trigger requires at least one scheduling field.');
  });

  test('should build date trigger args and require run date', () => {
    expect(() => schedules.buildTypedTriggerArgs('date', {
      dateRunDate: ''
    })).toThrow('Date trigger requires a run date.');

    expect(schedules.buildTypedTriggerArgs('date', {
      dateRunDate: '2026-02-15T12:30',
      dateTimezone: 'UTC'
    })).toEqual({
      run_date: '2026-02-15T12:30',
      timezone: 'UTC'
    });
  });
});
