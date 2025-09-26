// Tests für ETL.render Funktionen
const ETL = require('../index.js');

describe('ETL.render', () => {
  describe('propertyToHTML', () => {
    test('should render string input field', () => {
      const property = {
        name: 'username',
        required: true,
        schema: {
          type: 'string',
          title: 'Username',
          description: 'Enter your username',
          default: 'admin'
        }
      };

      const result = ETL.render.propertyToHTML(property);
      
      expect(result).toContain('Username');
      expect(result).toContain("name='username'");
      expect(result).toContain("type='text'");
      expect(result).toContain("value='admin'");
      expect(result).toContain('required');
    });

    test('should render integer input field', () => {
      const property = {
        name: 'count',
        required: false,
        minimum: 0,
        schema: {
          type: 'integer',
          title: 'Count',
          default: 10
        }
      };

      const result = ETL.render.propertyToHTML(property);
      
      expect(result).toContain('Count');
      expect(result).toContain("name='count'");
      expect(result).toContain("type='number'");
      expect(result).toContain("value='10'");
      expect(result).toContain("min='0'");
      expect(result).toContain("steps='1'");
    });

    test('should render boolean checkbox field', () => {
      const property = {
        name: 'enabled',
        required: false,
        schema: {
          type: 'boolean',
          title: 'Enabled',
          default: true
        }
      };

      const result = ETL.render.propertyToHTML(property);
      
      expect(result).toContain('Enabled');
      expect(result).toContain("name='enabled'");
      expect(result).toContain("type='checkbox'");
      expect(result).toContain('checked');
    });

    test('should render unchecked boolean checkbox when default is false', () => {
      const property = {
        name: 'enabled',
        required: false,
        schema: {
          type: 'boolean',
          title: 'Enabled',
          default: false
        }
      };

      const result = ETL.render.propertyToHTML(property);
      
      expect(result).toContain('Enabled');
      expect(result).toContain("name='enabled'");
      expect(result).toContain("type='checkbox'");
      expect(result).not.toContain('checked');
    });

    test('should render select dropdown field', () => {
      const property = {
        name: 'status',
        required: true,
        schema: {
          type: 'select',
          title: 'Status',
          enum: ['active', 'inactive', 'pending'],
          default: 'active'
        }
      };

      const result = ETL.render.propertyToHTML(property);
      
      expect(result).toContain('Status');
      expect(result).toContain("name='status'");
      expect(result).toContain('<select');
      expect(result).toContain("aria-label='Status'");
      expect(result).toContain('required');
      
      // Check options
      expect(result).toContain("<option selected value='active'>active</option>");
      expect(result).toContain("<option  value='inactive'>inactive</option>");
      expect(result).toContain("<option  value='pending'>pending</option>");
    });

    test('should handle object type with out_port_schemas', () => {
      const property = {
        name: 'out_port_schemas',
        required: false,
        schema: {
          type: 'object',
          title: 'Output Port Schemas',
          additionalProperties: {
            properties: [{
              schema: {
                items: {
                  properties: {
                    name: { schema: { title: 'Name', type: 'string' } },
                    type: { schema: { title: 'Type', type: 'select', enum: ['string', 'number'] } }
                  }
                }
              }
            }]
          }
        }
      };

      const result = ETL.render.propertyToHTML(property);
      
      expect(result).toContain('Output Port Schemas');
      expect(result).toContain("<table id='tableOutPortSchema'>");
      expect(result).toContain("<button class='btnAddOutPortSchema secondary'>");
    });

    test('should use provided default value instead of schema default', () => {
      const property = {
        name: 'username',
        required: false,
        schema: {
          type: 'string',
          title: 'Username',
          default: 'schema_default'
        }
      };

      const result = ETL.render.propertyToHTML(property, 'custom_default');
      
      expect(result).toContain("value='custom_default'");
      expect(result).not.toContain("value='schema_default'");
    });

    test('should handle missing title and description', () => {
      const property = {
        name: 'field',
        required: false,
        schema: {
          type: 'string'
        }
      };

      const result = ETL.render.propertyToHTML(property);
      
      expect(result).toContain("name='field'");
      expect(result).toContain("type='text'");
    });

    test('should handle empty default value', () => {
      const property = {
        name: 'field',
        required: false,
        schema: {
          type: 'string',
          title: 'Field',
          default: undefined
        }
      };

      const result = ETL.render.propertyToHTML(property);
      
      expect(result).toContain("value=''");
    });
  });

  describe('jobEdit', () => {
    beforeEach(() => {
      // Mock ETL.api.get
      ETL.api.get = jest.fn();
      ETL.util.deref = jest.fn((data) => data);
    });

    test('should render job edit form for new job', async () => {
      const mockConfigData = {
        properties: [
          {
            name: 'name',
            required: true,
            schema: {
              type: 'string',
              title: 'Job Name'
            }
          }
        ]
      };

      ETL.api.get.mockResolvedValue(mockConfigData);

      const result = await ETL.render.jobEdit(0);

      expect(ETL.api.get).toHaveBeenCalledWith(0, '/configs/job');
      expect(result).toContain('Job Name');
      expect(result).toContain("name='name'");
    });

    test('should render job edit form for existing job', async () => {
      const mockConfigData = {
        properties: [
          {
            name: 'name',
            required: true,
            schema: {
              type: 'string',
              title: 'Job Name'
            }
          }
        ]
      };

      const mockJobData = {
        name: 'Existing Job'
      };

      ETL.api.get
        .mockResolvedValueOnce(mockConfigData)
        .mockResolvedValueOnce(mockJobData);

      const result = await ETL.render.jobEdit(0, 'job123');

      expect(ETL.api.get).toHaveBeenCalledWith(0, '/configs/job');
      expect(ETL.api.get).toHaveBeenCalledWith(0, '/jobs/job123');
      expect(result).toContain("value='Existing Job'");
    });

    test('should return false when config data is invalid', async () => {
      ETL.api.get.mockResolvedValue({});

      const result = await ETL.render.jobEdit(0);

      expect(result).toBe(false);
    });

    test('should return false when job data is false', async () => {
      const mockConfigData = {
        properties: [
          {
            name: 'name',
            required: true,
            schema: {
              type: 'string',
              title: 'Job Name'
            }
          }
        ]
      };

      ETL.api.get
        .mockResolvedValueOnce(mockConfigData)
        .mockResolvedValueOnce(false); // jobData is false

      const result = await ETL.render.jobEdit(0, 'job123');

      expect(ETL.api.get).toHaveBeenCalledWith(0, '/configs/job');
      expect(ETL.api.get).toHaveBeenCalledWith(0, '/jobs/job123');
      expect(result).toBe(false);
    });
  });

  describe('componentEdit', () => {
    beforeEach(() => {
      ETL.api.get = jest.fn();
      ETL.util.deref = jest.fn((data) => data);
      
      // Mock editor
      global.editor = {
        getNodeFromId: jest.fn(() => ({
          data: {
            comp_type: 'test_component',
            existing_prop: 'existing_value'
          }
        }))
      };
    });

    test('should render component edit form', async () => {
      const mockFormData = {
        properties: [
          {
            name: 'prop1',
            required: true,
            schema: {
              type: 'string',
              title: 'Property 1'
            }
          }
        ]
      };

      ETL.api.get.mockResolvedValue(mockFormData);

      const result = await ETL.render.componentEdit('comp123');

      expect(ETL.api.get).toHaveBeenCalledWith(0, '/configs/test_component/form');
      expect(result).toContain('Property 1');
      expect(result).toContain("name='prop1'");
    });

    test('should return false when form data is invalid', async () => {
      ETL.api.get.mockResolvedValue({});

      const result = await ETL.render.componentEdit('comp123');

      expect(result).toBe(false);
    });
  });
});
