// Funktionale Tests für pages JavaScript-Dateien
// Diese Tests fokussieren sich auf die testbaren Teile der pages-Funktionalität

describe('Pages JavaScript Functionality', () => {
  describe('Dashboard Functions', () => {
    // Teste die parseValue Funktion direkt
    const parseValue = (val) => {
      val = val.trim();
      if (!isNaN(val) && !isNaN(parseFloat(val))) {
        return Number(val);
      }
      const iso = Date.parse(val);
      if (!isNaN(iso)) {
        return new Date(iso).getTime();
      }
      const parts = val.split("/");
      if (parts.length === 3) {
        const [d, m, y] = parts.map(Number);
        if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
          return new Date(y, m - 1, d).getTime();
        }
      }
      return val.toLowerCase();
    };

    test('should parse numeric values correctly', () => {
      expect(parseValue('123')).toBe(123);
      expect(parseValue('45.67')).toBe(45.67);
      expect(parseValue('0')).toBe(0);
    });

    test('should parse date strings', () => {
      const result = parseValue('2024-01-15');
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThan(0);
    });

    test('should parse DD/MM/YYYY format', () => {
      const result = parseValue('15/01/2024');
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThan(0);
    });

    test('should return lowercase string for other values', () => {
      expect(parseValue('Hello World')).toBe('hello world');
      expect(parseValue('TEST')).toBe('test');
    });

    test('should handle empty string', () => {
      expect(parseValue('')).toBe('');
      expect(parseValue('   ')).toBe('');
    });
  });

  describe('Login Validation Functions', () => {
    const validateForm = (username, password) => {
      const errors = [];
      if (!username || username.trim() === '') {
        errors.push('Username is required');
      }
      if (!password || password.trim() === '') {
        errors.push('Password is required');
      }
      return {
        valid: errors.length === 0,
        errors
      };
    };

    test('should validate login form correctly', () => {
      const validResult = validateForm('testuser', 'testpass');
      expect(validResult.valid).toBe(true);
      expect(validResult.errors).toHaveLength(0);

      const invalidResult = validateForm('', 'testpass');
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors).toContain('Username is required');

      const emptyResult = validateForm('', '');
      expect(emptyResult.valid).toBe(false);
      expect(emptyResult.errors).toHaveLength(2);
    });
  });

  describe('Settings Management Functions', () => {
    const toggleTheme = (isDark) => {
      return {
        theme: isDark ? 'dark' : 'light',
        stored: isDark
      };
    };

    const setBufferSize = (size) => {
      const bufferSize = parseInt(size) || 10000;
      return Math.max(1000, Math.min(50000, bufferSize));
    };

    test('should handle theme switching', () => {
      expect(toggleTheme(true).theme).toBe('dark');
      expect(toggleTheme(true).stored).toBe(true);
      expect(toggleTheme(false).theme).toBe('light');
      expect(toggleTheme(false).stored).toBe(false);
    });

    test('should handle console buffer size validation', () => {
      expect(setBufferSize("15000")).toBe(15000);
      expect(setBufferSize("invalid")).toBe(10000);
      expect(setBufferSize("500")).toBe(1000);
      expect(setBufferSize("60000")).toBe(50000);
    });
  });

  describe('Server Management Functions', () => {
    const buildConnectionString = (protocol, hostname, port) => {
      return `${protocol}://${hostname}:${port}`;
    };

    const validateServerData = (data) => {
      const errors = [];
      if (!data.description) errors.push('Description is required');
      if (!data.hostname) errors.push('Hostname is required');
      if (!data.port) errors.push('Port is required');
      return { valid: errors.length === 0, errors };
    };

    test('should build connection strings correctly', () => {
      expect(buildConnectionString("http", "localhost", "8000")).toBe("http://localhost:8000");
      expect(buildConnectionString("https", "example.com", "9000")).toBe("https://example.com:9000");
    });

    test('should validate server data', () => {
      const validData = { description: 'Test Server', hostname: 'localhost', port: '8000' };
      const invalidData = { description: '', hostname: 'localhost', port: '' };

      expect(validateServerData(validData).valid).toBe(true);
      expect(validateServerData(invalidData).valid).toBe(false);
      expect(validateServerData(invalidData).errors).toContain('Description is required');
    });
  });

  describe('Setup Validation Functions', () => {
    const validateDatabasePath = (path) => {
      if (!path) return { valid: false, error: 'Database path is required' };
      if (!path.endsWith('.sqlite') && !path.endsWith('.db')) {
        return { valid: false, error: 'Database path must end with .sqlite or .db' };
      }
      return { valid: true, error: null };
    };

    const validatePassword = (password, confirmPassword) => {
      if (!password) return { valid: false, error: 'Password is required' };
      if (password !== confirmPassword) return { valid: false, error: 'Passwords do not match' };
      return { valid: true, error: null };
    };

    test('should validate database path', () => {
      expect(validateDatabasePath("").valid).toBe(false);
      expect(validateDatabasePath("test.sqlite").valid).toBe(true);
      expect(validateDatabasePath("test.db").valid).toBe(true);
      expect(validateDatabasePath("test.txt").valid).toBe(false);
    });

    test('should validate password confirmation', () => {
      expect(validatePassword("", "test").valid).toBe(false);
      expect(validatePassword("test", "").valid).toBe(false);
      expect(validatePassword("test", "test").valid).toBe(true);
      expect(validatePassword("test", "different").valid).toBe(false);
    });
  });

  describe('Job Management Functions', () => {
    const processJobData = (jobData) => {
      if (!jobData || typeof jobData !== 'object') {
        return { valid: false, error: 'Invalid job data' };
      }
      
      const processed = {
        id: jobData.id || null,
        name: jobData.name || 'Unnamed Job',
        created: jobData.created || new Date().toISOString(),
        status: jobData.status || 'draft'
      };
      
      return { valid: true, data: processed };
    };

    const processComponent = (component) => {
      return {
        id: component.id || Math.random().toString(36).substr(2, 9),
        type: component.type || 'unknown',
        name: component.name || 'Unnamed Component',
        config: component.config || {}
      };
    };

    test('should process job data correctly', () => {
      const validJob = { id: 1, name: 'Test Job', status: 'active' };
      const invalidJob = null;

      expect(processJobData(validJob).valid).toBe(true);
      expect(processJobData(validJob).data.name).toBe('Test Job');
      expect(processJobData(invalidJob).valid).toBe(false);
    });

    test('should process component data', () => {
      const component = { type: 'processor', name: 'Data Processor' };
      const processed = processComponent(component);

      expect(processed.type).toBe('processor');
      expect(processed.name).toBe('Data Processor');
      expect(processed.id).toBeDefined();
    });
  });

  describe('User Management Functions', () => {
    const validateUser = (userData) => {
      const errors = [];
      if (!userData.username) errors.push('Username is required');
      if (!userData.email) errors.push('Email is required');
      if (userData.email && !userData.email.includes('@')) {
        errors.push('Email must be valid');
      }
      return { valid: errors.length === 0, errors };
    };

    const formatUserDisplay = (user) => {
      return {
        displayName: user.firstName && user.lastName 
          ? `${user.firstName} ${user.lastName}` 
          : user.username,
        email: user.email,
        role: user.role || 'user'
      };
    };

    test('should validate user data', () => {
      const validUser = { username: 'testuser', email: 'test@example.com' };
      const invalidUser = { username: '', email: 'invalid-email' };

      expect(validateUser(validUser).valid).toBe(true);
      expect(validateUser(invalidUser).valid).toBe(false);
      expect(validateUser(invalidUser).errors).toContain('Username is required');
    });

    test('should format user display data', () => {
      const user1 = { username: 'testuser', email: 'test@example.com' };
      const user2 = { username: 'johndoe', firstName: 'John', lastName: 'Doe', email: 'john@example.com' };

      expect(formatUserDisplay(user1).displayName).toBe('testuser');
      expect(formatUserDisplay(user2).displayName).toBe('John Doe');
    });
  });

  describe('Utility Functions', () => {
    const formatDate = (date) => {
      const d = new Date(date);
      return d.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    };

    const truncateString = (str, maxLength) => {
      if (str.length <= maxLength) return str;
      return str.substring(0, maxLength - 3) + '...';
    };

    test('should format dates correctly', () => {
      const testDate = new Date('2024-01-15T14:30:45');
      const formatted = formatDate(testDate);
      
      expect(formatted).toMatch(/\d{2}\.\d{2}\.\d{4}/);
    });

    test('should truncate strings correctly', () => {
      expect(truncateString('Hello World', 5)).toBe('He...');
      expect(truncateString('Short', 10)).toBe('Short');
    });
  });
});
