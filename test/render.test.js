// Tests für ETL.render Funktionen
const ETL = require('../index.js');

describe('ETL.render', () => {
  beforeEach(() => {
    ETL.contract.cache = {
      0: {
        contract_version: 'core-studio-v1',
        environments: [],
        rule_operators: ['equals_only'],
        rule_logical_operators: ['XOR'],
        data_types: ['string'],
        setup_validation: { mode: 'none', required: false, endpoint: '/setup/validate', key_env_var: 'ETL_SETUP_ACCESS_KEY' }
      }
    };
    global.serverID = 0;
  });

  describe('normalizeSchema', () => {
    test('should collapse simple nullable anyOf schema to concrete type', () => {
      const result = ETL.render.normalizeSchema({
        anyOf: [{ type: 'string' }, { type: 'null' }],
        title: 'Sheet Name',
        default: null
      }, 'sheet_name');

      expect(result.type).toBe('string');
      expect(result.nullable).toBe(true);
      expect(result.title).toBe('Sheet Name');
      expect(result.default).toBe(null);
      expect(result.anyOf).toBeUndefined();
    });

    test('should infer title from property name when title is missing', () => {
      const result = ETL.render.normalizeSchema({ type: 'string' }, 'match_filter');
      expect(result.title).toBe('Match Filter');
    });

    test('should fallback title for invalid property name values', () => {
      expect(ETL.render.prettyFieldName({})).toBe('Field');
      expect(ETL.render.prettyFieldName('___')).toBe('Field');
    });

    test('should convert enum string schema to select type', () => {
      const result = ETL.render.normalizeSchema({
        type: 'string',
        enum: ['a', 'b']
      }, 'status');
      expect(result.type).toBe('select');
    });

    test('should keep complex unions unresolved', () => {
      const result = ETL.render.normalizeSchema({
        anyOf: [{ type: 'string' }, { type: 'integer' }]
      }, 'value');
      expect(result.anyOf).toBeDefined();
      expect(result.type).toBeUndefined();
    });
  });

  describe('normalizeProperties', () => {
    test('should keep array properties unchanged', () => {
      const root = {
        properties: [
          { name: 'name', schema: { type: 'string' }, required: true }
        ]
      };
      const out = ETL.render.normalizeProperties(root);
      expect(Array.isArray(out)).toBe(true);
      expect(out[0].name).toBe('name');
    });

    test('should convert object-map properties to array entries', () => {
      const root = {
        properties: {
          name: { type: 'string', title: 'Name' },
          retries: { type: 'integer', title: 'Retries' }
        },
        required: ['name']
      };
      const out = ETL.render.normalizeProperties(root);
      expect(out).toEqual(expect.arrayContaining([
        expect.objectContaining({ name: 'name', required: true }),
        expect.objectContaining({ name: 'retries', required: false })
      ]));
    });

    test('should return empty array for null or non-object rootSchema', () => {
      expect(ETL.render.normalizeProperties(null)).toEqual([]);
      expect(ETL.render.normalizeProperties(undefined)).toEqual([]);
      expect(ETL.render.normalizeProperties('string')).toEqual([]);
    });

    test('should skip properties with null schema values in object-map', () => {
      const root = {
        properties: {
          valid: { type: 'string', title: 'Valid' },
          broken: null,
          also_broken: 'not-an-object'
        }
      };
      const out = ETL.render.normalizeProperties(root);
      expect(out.length).toBe(1);
      expect(out[0].name).toBe('valid');
    });
  });

  describe('_simpleNullableUnionBranch', () => {
    test('should return null when union has two null branches', () => {
      const result = ETL.render._simpleNullableUnionBranch(
        { anyOf: [{ type: 'null' }, { type: 'null' }] },
        'anyOf'
      );
      expect(result).toBeNull();
    });

    test('should return null when union has no null branch', () => {
      const result = ETL.render._simpleNullableUnionBranch(
        { anyOf: [{ type: 'string' }, { type: 'integer' }] },
        'anyOf'
      );
      expect(result).toBeNull();
    });
  });

  describe('propertyToHTML', () => {
    test('should render textarea when widget is textarea', () => {
      const property = {
        name: 'query',
        required: false,
        schema: {
          type: 'string',
          title: 'Query',
          description: 'SQL query for read operations',
          widget: 'textarea',
          default: 'SELECT * FROM users'
        }
      };

      const result = ETL.render.propertyToHTML(property);
      expect(result).toContain('<textarea');
      expect(result).toContain("name='query'");
      expect(result).toContain("rows='6'");
      expect(result).toContain('SELECT * FROM users');
      expect(result).not.toContain("type='text'");
    });

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
        schema: {
          type: 'integer',
          title: 'Count',
          minimum: 0,
          default: 10
        }
      };

      const result = ETL.render.propertyToHTML(property);
      
      expect(result).toContain('Count');
      expect(result).toContain("name='count'");
      expect(result).toContain("type='number'");
      expect(result).toContain("value='10'");
      expect(result).toContain("min='0'");
      expect(result).toContain("step='1'");
      expect(result).toContain("data-number-kind='integer'");
    });

    test('should render number input field with step any', () => {
      const property = {
        name: 'ratio',
        required: false,
        schema: {
          type: 'number',
          title: 'Ratio',
          minimum: 0,
          maximum: 10,
          default: 1.25
        }
      };

      const result = ETL.render.propertyToHTML(property);
      expect(result).toContain("name='ratio'");
      expect(result).toContain("type='number'");
      expect(result).toContain("step='any'");
      expect(result).toContain("data-number-kind='number'");
      expect(result).toContain("max='10'");
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

    test('should render nullable anyOf string as input field', () => {
      const property = {
        name: 'sheet_name',
        required: false,
        schema: {
          anyOf: [{ type: 'string' }, { type: 'null' }],
          title: 'Sheet Name',
          default: null
        }
      };

      const result = ETL.render.propertyToHTML(property);
      expect(result).toContain("name='sheet_name'");
      expect(result).toContain("type='text'");
      expect(result).toContain("data-nullable='true'");
    });

    test('should render nullable number default null as empty number input', () => {
      const property = {
        name: 'limit',
        required: false,
        schema: {
          anyOf: [{ type: 'number' }, { type: 'null' }],
          title: 'Limit',
          default: null
        }
      };

      const result = ETL.render.propertyToHTML(property);
      expect(result).toContain("name='limit'");
      expect(result).toContain("value=''");
      expect(result).toContain("step='any'");
    });

    test('should render nullable select default null as empty select', () => {
      const property = {
        name: 'operation',
        required: false,
        schema: {
          anyOf: [
            { type: 'string', enum: ['insert', 'upsert'] },
            { type: 'null' }
          ],
          title: 'Operation',
          default: null
        }
      };

      const result = ETL.render.propertyToHTML(property);
      expect(result).toContain("name='operation'");
      expect(result).toContain("data-nullable='true'");
      expect(result).toContain("<option  value='insert'>insert</option>");
    });

    test('should render object field as JSON textarea', () => {
      const property = {
        name: 'out_port_schemas',
        required: false,
        schema: {
          type: 'object',
          title: 'Output Port Schemas'
        }
      };

      const result = ETL.render.propertyToHTML(property);
      expect(result).toContain("name='out_port_schemas'");
      expect(result).toContain("data-json='true'");
      expect(result).toContain("data-json-type='object'");
      expect(result).toContain('<textarea');
      expect(result).toContain('{}');
    });

    test('should render array field as JSON textarea', () => {
      const property = {
        name: 'aggregations',
        required: false,
        schema: {
          type: 'array',
          title: 'Aggregations'
        }
      };

      const result = ETL.render.propertyToHTML(property);
      expect(result).toContain("name='aggregations'");
      expect(result).toContain("data-json='true'");
      expect(result).toContain("data-json-type='array'");
      expect(result).toContain('<textarea');
      expect(result).toContain('[]');
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

    test('should render helper text from description', () => {
      const property = {
        name: 'field',
        required: false,
        schema: {
          type: 'string',
          title: 'Field',
          description: 'Field help text'
        }
      };

      const result = ETL.render.propertyToHTML(property);
      expect(result).toContain('fieldDescription');
      expect(result).toContain('Field help text');
    });

    test('should fallback to JSON textarea for unresolved complex unions', () => {
      const property = {
        name: 'mystery',
        required: false,
        schema: {
          anyOf: [{ type: 'string' }, { type: 'integer' }, { type: 'null' }],
          title: 'Mystery'
        }
      };

      const result = ETL.render.propertyToHTML(property);
      expect(result).toContain("name='mystery'");
      expect(result).toContain("data-json='true'");
      expect(result).toContain('<textarea');
    });

    test('should fallback unresolved unions with array default to array json type', () => {
      const property = {
        name: 'mystery',
        required: false,
        schema: {
          anyOf: [{ type: 'string' }, { type: 'integer' }, { type: 'null' }],
          title: 'Mystery',
          default: []
        }
      };

      const result = ETL.render.propertyToHTML(property);
      expect(result).toContain("data-json-type='array'");
    });

    test('should fallback unresolved unions with object default to object json type', () => {
      const property = {
        name: 'mystery',
        required: false,
        schema: {
          anyOf: [{ type: 'string' }, { type: 'integer' }, { type: 'null' }],
          title: 'Mystery',
          default: { mode: 'x' }
        }
      };

      const result = ETL.render.propertyToHTML(property);
      expect(result).toContain("data-json-type='object'");
    });

    test('should fallback unresolved nullable unions with null default to empty textarea', () => {
      const property = {
        name: 'mystery',
        required: false,
        schema: {
          anyOf: [{ type: 'string' }, { type: 'integer' }, { type: 'null' }],
          title: 'Mystery',
          nullable: true,
          default: null
        }
      };

      const result = ETL.render.propertyToHTML(property);
      expect(result).toContain("data-nullable='true'");
      expect(result).toContain("<textarea class='formInput jsonInput'");
    });
  });

  describe('jsonFieldDefault', () => {
    test('should normalize JSON string input', () => {
      const value = ETL.render.jsonFieldDefault('object', '{"a":1}');
      expect(value).toContain('"a": 1');
    });

    test('should keep invalid JSON string as-is', () => {
      const value = ETL.render.jsonFieldDefault('object', '{broken}');
      expect(value).toBe('{broken}');
    });

    test('should default whitespace-only strings', () => {
      const value = ETL.render.jsonFieldDefault('array', '   ');
      expect(value).toBe('[]');
    });

    test('should stringify object input', () => {
      const value = ETL.render.jsonFieldDefault('object', { a: 1 });
      expect(value).toContain('"a": 1');
    });

    test('should fallback for circular values', () => {
      const circular = {};
      circular.self = circular;
      const value = ETL.render.jsonFieldDefault('object', circular);
      expect(value).toBe('{}');
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

    test('should render job edit form when properties come as object-map', async () => {
      const mockConfigData = {
        properties: {
          name: { type: 'string', title: 'Job Name' }
        },
        required: ['name']
      };
      ETL.api.get.mockResolvedValue(mockConfigData);

      const result = await ETL.render.jobEdit(0);
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
      ETL.runtime.editor = null;
      ETL.runtime.serverID = 0;
      
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
        'x-ui': {
          context_selector: { field: null, source_endpoint: '/contexts/', widget: 'context-select' },
          rule_builder: { field: null, widget: 'rule-builder' },
          port_schema_editor: { fields: [], widget: 'port-schema-editor' }
        },
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

    test('should render with explicit runtime options when global editor is unavailable', async () => {
      delete global.editor;
      const optionEditor = {
        getNodeFromId: jest.fn(() => ({
          data: {
            comp_type: 'test_component',
            prop1: 'value_from_node'
          }
        }))
      };
      const mockFormData = {
        'x-ui': {
          context_selector: { field: null, source_endpoint: '/contexts/', widget: 'context-select' },
          rule_builder: { field: null, widget: 'rule-builder' },
          port_schema_editor: { fields: [], widget: 'port-schema-editor' }
        },
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

      const result = await ETL.render.componentEdit('comp123', {
        editor: optionEditor,
        serverID: 7
      });

      expect(optionEditor.getNodeFromId).toHaveBeenCalledWith('comp123');
      expect(ETL.api.get).toHaveBeenCalledWith(7, '/configs/test_component/form');
      expect(result).toContain("name='prop1'");
    });

    test('should return false when no editor instance is available', async () => {
      delete global.editor;
      ETL.runtime.editor = null;

      const result = await ETL.render.componentEdit('comp123');
      expect(result).toBe(false);
      expect(ETL.api.get).not.toHaveBeenCalled();
    });

    test('should render component edit form when properties come as object-map', async () => {
      const mockFormData = {
        'x-ui': {
          context_selector: { field: null, source_endpoint: '/contexts/', widget: 'context-select' },
          rule_builder: { field: null, widget: 'rule-builder' },
          port_schema_editor: { fields: [], widget: 'port-schema-editor' }
        },
        properties: {
          prop1: {
            type: 'string',
            title: 'Property 1'
          }
        },
        required: ['prop1']
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

    test('should return false when x-ui hints are missing', async () => {
      ETL.contract.block = jest.fn();
      ETL.api.get.mockResolvedValue({ properties: [] });

      const result = await ETL.render.componentEdit('comp123');

      expect(result).toBe(false);
      expect(ETL.contract.block).toHaveBeenCalledTimes(1);
    });

    test('should render dynamic context selector options', async () => {
      global.editor.getNodeFromId = jest.fn(() => ({
        data: {
          comp_type: 'test_component',
          context_id: 'ctx-1'
        }
      }));

      ETL.api.get
        .mockResolvedValueOnce({
          'x-ui': {
            context_selector: { field: 'context_id', source_endpoint: '/contexts/' },
            rule_builder: { field: null },
            port_schema_editor: { fields: [] }
          },
          properties: [
            { name: 'context_id', schema: { type: 'string', title: 'Context' } }
          ]
        })
        .mockResolvedValueOnce([
          { id: 'ctx-1', name: 'Primary Context', kind: 'context' },
          { id: 'cred-1', name: 'Credential', kind: 'credentials' }
        ]);

      const result = await ETL.render.componentEdit('comp123');
      expect(result).toContain("value='ctx-1' selected");
      expect(result).toContain('Primary Context');
      expect(result).not.toContain('cred-1');
      expect(result).toContain("data-context-selector='true'");
      expect(result).toContain('Use <code>${ctx.key}</code> for environment-aware context values.');
      expect(result).toContain('contextTemplateAssist');
    });

    test('should display context description in selector when available', async () => {
      global.editor.getNodeFromId = jest.fn(() => ({
        data: {
          comp_type: 'test_component',
          context_id: 'ctx-2'
        }
      }));

      ETL.api.get
        .mockResolvedValueOnce({
          'x-ui': {
            context_selector: { field: 'context_id', source_endpoint: '/contexts/' },
            rule_builder: { field: null },
            port_schema_editor: { fields: [] }
          },
          properties: [
            { name: 'context_id', schema: { type: 'string', title: 'Context' } }
          ]
        })
        .mockResolvedValueOnce([
          { id: 'ctx-2', name: 'Production DB', kind: 'context', description: 'env: production, 3 parameters' }
        ]);

      const result = await ETL.render.componentEdit('comp123');
      expect(result).toContain("value='ctx-2' selected");
      expect(result).toContain('Production DB (env: production, 3 parameters)');
    });

    test('should not crash when context endpoint response is not an array', async () => {
      global.editor.getNodeFromId = jest.fn(() => ({
        data: {
          comp_type: 'test_component',
          context_id: 'ctx-1'
        }
      }));

      ETL.api.get
        .mockResolvedValueOnce({
          'x-ui': {
            context_selector: { field: 'context_id', source_endpoint: '/contexts/' },
            rule_builder: { field: null },
            port_schema_editor: { fields: [] }
          },
          properties: [
            { name: 'context_id', schema: { type: 'string', title: 'Context' } }
          ]
        })
        .mockResolvedValueOnce({ data: [] });

      const result = await ETL.render.componentEdit('comp123');
      expect(result).toContain("name='context_id'");
      expect(result).not.toContain('Primary Context');
    });

    test('should render array and nullable fields used by production component forms', async () => {
      global.editor.getNodeFromId = jest.fn(() => ({
        data: {
          comp_type: 'test_component',
          where_conditions: [{ column: 'id', operator: 'equals', value: 1 }],
          sheet_name: null,
          limit: null
        }
      }));

      ETL.api.get.mockResolvedValue({
        'x-ui': {
          context_selector: { field: null, source_endpoint: '/contexts/' },
          rule_builder: { field: null },
          port_schema_editor: { fields: [] }
        },
        properties: [
          { name: 'where_conditions', schema: { type: 'array', title: 'Where Conditions' } },
          { name: 'sheet_name', schema: { type: 'string', nullable: true, title: 'Sheet Name' } },
          { name: 'limit', schema: { type: 'number', nullable: true, title: 'Limit' } }
        ]
      });

      const result = await ETL.render.componentEdit('comp123');
      expect(result).toContain("name='where_conditions'");
      expect(result).toContain("data-json-type='array'");
      expect(result).toContain("name='sheet_name'");
      expect(result).toContain("name='limit'");
    });

    test('should render recursive rule builder markup', async () => {
      global.editor.getNodeFromId = jest.fn(() => ({
        data: {
          comp_type: 'test_component',
          rule: {
            logical_operator: 'XOR',
            rules: [
              { column: 'amount', operator: 'equals_only', value: '100' },
              {
                logical_operator: 'XOR',
                rules: [{ column: 'city', operator: 'equals_only', value: 'Berlin' }]
              }
            ]
          }
        }
      }));

      ETL.api.get.mockResolvedValue({
        'x-ui': {
          context_selector: { field: null, source_endpoint: '/contexts/' },
          rule_builder: { field: 'rule' },
          port_schema_editor: { fields: [] }
        },
        properties: [
          { name: 'rule', schema: { type: 'object', title: 'Rule' } }
        ]
      });

      const result = await ETL.render.componentEdit('comp123');
      expect(result).toContain("id='ruleTable'");
      expect(result).toContain('btnAddLogicalRule');
      expect(result).toContain('singleItem');
      expect(result).toContain('logicItem');
    });

    test('should include dynamic and schema-derived port names in port schema editor', async () => {
      global.editor.getNodeFromId = jest.fn(() => ({
        data: {
          comp_type: 'test_component',
          out_port_schemas: {
            archived: { fields: [] }
          },
          extra_output_ports: ['vip_lane', { name: 'standard_lane' }]
        }
      }));

      ETL.api.get.mockResolvedValue({
        'x-class': {
          output_port_names: ['out'],
          input_port_names: []
        },
        'x-ui': {
          context_selector: { field: null, source_endpoint: '/contexts/' },
          rule_builder: { field: null },
          port_schema_editor: { fields: ['out_port_schemas'] }
        },
        properties: [
          { name: 'out_port_schemas', schema: { type: 'object', title: 'Output schemas' } }
        ]
      });

      const result = await ETL.render.componentEdit('comp123');
      expect(result).toContain('out');
      expect(result).toContain('vip_lane');
      expect(result).toContain('standard_lane');
      expect(result).toContain('archived');
      expect(result).toContain('btnEditPortSchema');
    });

    test('should include dynamic input ports in input port schema editor', async () => {
      global.editor.getNodeFromId = jest.fn(() => ({
        data: {
          comp_type: 'test_component',
          in_port_schemas: {
            archived_in: { fields: [] }
          },
          extra_input_ports: ['left', { name: 'right' }]
        }
      }));

      ETL.api.get.mockResolvedValue({
        'x-class': {
          output_port_names: [],
          input_port_names: ['in']
        },
        'x-ui': {
          context_selector: { field: null, source_endpoint: '/contexts/' },
          rule_builder: { field: null },
          port_schema_editor: { fields: ['in_port_schemas'] }
        },
        properties: [
          { name: 'in_port_schemas', schema: { type: 'object', title: 'Input schemas' } }
        ]
      });

      const result = await ETL.render.componentEdit('comp123');
      expect(result).toContain('in');
      expect(result).toContain('left');
      expect(result).toContain('right');
      expect(result).toContain('archived_in');
      expect(result).toContain('btnEditPortSchema');
    });

    test('should return explicit fallback text when schema has no renderable properties', async () => {
      ETL.api.get.mockResolvedValue({
        'x-ui': {
          context_selector: { field: null, source_endpoint: '/contexts/' },
          rule_builder: { field: null },
          port_schema_editor: { fields: [] }
        },
        properties: [
          { required: false, schema: { type: 'string', title: 'Broken without name' } }
        ]
      });

      const result = await ETL.render.componentEdit('comp123');
      expect(result).toContain('No configurable fields are available');
    });

    test('should return false when getNodeFromId returns null', async () => {
      global.editor.getNodeFromId = jest.fn(() => null);

      const result = await ETL.render.componentEdit('comp123');
      expect(result).toBe(false);
    });

    test('should return false when component data has empty comp_type', async () => {
      global.editor.getNodeFromId = jest.fn(() => ({
        data: { comp_type: '' }
      }));

      const result = await ETL.render.componentEdit('comp123');
      expect(result).toBe(false);
    });

    test('should return false when form API returns false', async () => {
      ETL.api.get.mockResolvedValue(false);

      const result = await ETL.render.componentEdit('comp123');
      expect(result).toBe(false);
    });

    test('should fallback serverID to 0 when NaN', async () => {
      ETL.runtime.serverID = 'not-a-number';
      global.serverID = undefined;

      const mockFormData = {
        'x-ui': {
          context_selector: { field: null, source_endpoint: '/contexts/' },
          rule_builder: { field: null },
          port_schema_editor: { fields: [] }
        },
        properties: [
          { name: 'prop1', required: false, schema: { type: 'string', title: 'Prop 1' } }
        ]
      };
      ETL.api.get.mockResolvedValue(mockFormData);

      const result = await ETL.render.componentEdit('comp123');
      expect(ETL.api.get).toHaveBeenCalledWith(0, '/configs/test_component/form');
      expect(result).toContain("name='prop1'");
    });

    test('should render x-ui sections as fieldsets', async () => {
      const mockFormData = {
        'x-ui': {
          context_selector: { field: null, source_endpoint: '/contexts/' },
          rule_builder: { field: null },
          port_schema_editor: { fields: [] },
          sections: [
            { label: 'Connection', fields: ['host', 'port'] },
            { label: 'Auth', fields: ['username'] }
          ]
        },
        properties: [
          { name: 'host', required: true, schema: { type: 'string', title: 'Host' } },
          { name: 'port', required: false, schema: { type: 'integer', title: 'Port' } },
          { name: 'username', required: false, schema: { type: 'string', title: 'Username' } },
          { name: 'extra', required: false, schema: { type: 'string', title: 'Extra' } }
        ]
      };
      ETL.api.get.mockResolvedValue(mockFormData);

      const result = await ETL.render.componentEdit('comp123');
      expect(result).toContain('componentSection');
      expect(result).toContain('Connection');
      expect(result).toContain('Auth');
      expect(result).toContain("name='host'");
      expect(result).toContain("name='extra'");
    });
  });

  describe('propertyRuleToHTML', () => {
    test('should use operators from capabilities', () => {
      const html = ETL.render.propertyRuleToHTML({
        column: 'name',
        operator: 'equals_only',
        value: 'x'
      });
      expect(html).toContain('equals_only');
    });

    test('should use logical operators from capabilities', () => {
      const html = ETL.render.propertyRuleToHTML({
        logical_operator: 'XOR',
        rules: []
      });
      expect(html).toContain('XOR');
    });
  });
});
