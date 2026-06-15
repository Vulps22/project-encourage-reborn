import { Command } from '../Command';
import { BotCommandInteraction } from '../../structures';
import { AutocompleteInteraction } from 'discord.js';

describe('Command', () => {
  describe('constructor', () => {
    it('should create command with name and description', () => {
      const command = new Command('test', 'Test command');

      expect(command.name).toBe('test');
      expect(command.toJSON()).toMatchObject({
        name: 'test',
        description: 'Test command',
      });
    });
  });

  describe('addStringOption', () => {
    it('should add string option and return CommandOption', () => {
      const command = new Command('test', 'Test');
      const option = command.addStringOption('input', 'Input field', true);

      expect(option).toBeDefined();
      expect(typeof option.done).toBe('function');
    });

    it('should support chaining with done()', () => {
      const command = new Command('test', 'Test')
        .addStringOption('input', 'Input field', true)
        .done();

      expect(command).toBeInstanceOf(Command);
    });

    it('should add choices to string option', () => {
      const command = new Command('test', 'Test')
        .addStringOption('type', 'Type selection', true)
        .addChoice('Option 1', 'opt1')
        .addChoice('Option 2', 'opt2')
        .done();

      const json = command.toJSON();
      expect(json.options[0].choices).toHaveLength(2);
      expect(json.options[0].choices[0]).toMatchObject({ name: 'Option 1', value: 'opt1' });
    });

    it('should set min and max length', () => {
      const command = new Command('test', 'Test')
        .addStringOption('input', 'Input', true)
        .setMinLength(5)
        .setMaxLength(100)
        .done();

      const json = command.toJSON();
      expect(json.options[0].min_length).toBe(5);
      expect(json.options[0].max_length).toBe(100);
    });
  });

  describe('addIntegerOption', () => {
    it('should add integer option', () => {
      const command = new Command('test', 'Test')
        .addIntegerOption('count', 'Count', true)
        .done();

      const json = command.toJSON();
      expect(json.options[0].type).toBe(4); // INTEGER type
    });

    it('should set min and max value', () => {
      const command = new Command('test', 'Test')
        .addIntegerOption('count', 'Count', true)
        .setMinValue(1)
        .setMaxValue(10)
        .done();

      const json = command.toJSON();
      expect(json.options[0].min_value).toBe(1);
      expect(json.options[0].max_value).toBe(10);
    });
  });

  describe('addBooleanOption', () => {
    it('should add boolean option', () => {
      const command = new Command('test', 'Test')
        .addBooleanOption('confirm', 'Confirm action', true);

      const json = command.toJSON();
      expect(json.options[0].type).toBe(5); // BOOLEAN type
    });
  });

  describe('setNSFW', () => {
    it('should set NSFW flag to true', () => {
      const command = new Command('test', 'Test').setNSFW(true);

      expect(command.isNSFW).toBe(true);
      expect(command.toJSON().nsfw).toBe(true);
    });

    it('should set NSFW flag to false', () => {
      const command = new Command('test', 'Test').setNSFW(false);

      expect(command.isNSFW).toBe(false);
      expect(command.toJSON().nsfw).toBe(false);
    });
  });

  describe('setAdministrator', () => {
    it('should set administrator flag to true', () => {
      const command = new Command('test', 'Test').setAdministrator(true);

      expect(command.isAdministrator).toBe(true);
    });

    it('should set administrator flag to false', () => {
      const command = new Command('test', 'Test').setAdministrator(false);

      expect(command.isAdministrator).toBe(false);
    });
  });

  describe('setExecute', () => {
    it('should set execute handler', () => {
      const executeHandler = jest.fn().mockResolvedValue(undefined);
      const command = new Command('test', 'Test').setExecute(executeHandler);

      expect(command).toBeDefined();
    });

    it('should execute handler when called', async () => {
      const executeHandler = jest.fn().mockResolvedValue(undefined);
      const command = new Command('test', 'Test').setExecute(executeHandler);

      const mockInteraction = {} as BotCommandInteraction;
      await command.execute(mockInteraction);

      expect(executeHandler).toHaveBeenCalledWith(mockInteraction);
    });

    it('should throw error if execute not set', async () => {
      const command = new Command('test', 'Test');
      const mockInteraction = {} as BotCommandInteraction;

      await expect(command.execute(mockInteraction)).rejects.toThrow(
        'Command test has no execute function'
      );
    });
  });

  describe('setAutoComplete', () => {
    it('should set autocomplete handler', () => {
      const autoCompleteHandler = jest.fn().mockResolvedValue(undefined);
      const command = new Command('test', 'Test').setAutoComplete(autoCompleteHandler);

      expect(command).toBeDefined();
    });

    it('should execute autocomplete handler when called', async () => {
      const autoCompleteHandler = jest.fn().mockResolvedValue(undefined);
      const command = new Command('test', 'Test').setAutoComplete(autoCompleteHandler);

      const mockInteraction = {} as AutocompleteInteraction;
      await command.autoComplete(mockInteraction);

      expect(autoCompleteHandler).toHaveBeenCalledWith(mockInteraction);
    });

    it('should throw error if autocomplete not set', async () => {
      const command = new Command('test', 'Test');
      const mockInteraction = {} as AutocompleteInteraction;

      await expect(command.autoComplete(mockInteraction)).rejects.toThrow(
        'Command test has no autoComplete function'
      );
    });
  });

  describe('fluent API chaining', () => {
    it('should support full command building chain', () => {
      const executeHandler = jest.fn();

      const command = new Command('create', 'Create something')
        .addStringOption('type', 'Type of thing', true)
        .addChoice('Type A', 'a')
        .addChoice('Type B', 'b')
        .done()
        .addStringOption('name', 'Name', true)
        .setMinLength(3)
        .setMaxLength(50)
        .done()
        .addBooleanOption('public', 'Make public', false)
        .setNSFW(true)
        .setAdministrator(false)
        .setExecute(executeHandler);

      expect(command.name).toBe('create');
      expect(command.isNSFW).toBe(true);
      expect(command.isAdministrator).toBe(false);

      const json = command.toJSON();
      expect(json.options).toHaveLength(3);
    });
  });

  describe('toJSON', () => {
    it('should return valid Discord command JSON', () => {
      const command = new Command('test', 'Test command')
        .addStringOption('input', 'Input field', true)
        .done();

      const json = command.toJSON();

      expect(json).toHaveProperty('name');
      expect(json).toHaveProperty('description');
      expect(json).toHaveProperty('options');
      expect(Array.isArray(json.options)).toBe(true);
    });
  });
});
