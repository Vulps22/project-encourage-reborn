import { AutocompleteInteraction, SlashCommandBuilder } from 'discord.js';
import { BotCommandInteraction } from '../structures';

/**
 * CommandOption - Helper for building command options with a fluent API
 */
class CommandOption {
  private option: any;
  private parent: Command;

  constructor(option: any, parent: Command) {
    this.option = option;
    this.parent = parent;
  }

  addChoice(name: string, value: string | number): CommandOption {
    this.option.addChoices({ name, value });
    return this;
  }

  addChoices(...choices: Array<{ name: string; value: string | number }>): CommandOption {
    this.option.addChoices(...choices);
    return this;
  }

  setAutocomplete(autocomplete: boolean): CommandOption {
    this.option.setAutocomplete(autocomplete);
    return this;
  }

  setMinValue(min: number): CommandOption {
    if (this.option.setMinValue) {
      this.option.setMinValue(min);
    }
    return this;
  }

  setMaxValue(max: number): CommandOption {
    if (this.option.setMaxValue) {
      this.option.setMaxValue(max);
    }
    return this;
  }

  setMinLength(min: number): CommandOption {
    if (this.option.setMinLength) {
      this.option.setMinLength(min);
    }
    return this;
  }

  setMaxLength(max: number): CommandOption {
    if (this.option.setMaxLength) {
      this.option.setMaxLength(max);
    }
    return this;
  }

  done(): Command {
    return this.parent;
  }
}

/**
 * Command - Fluent API wrapper for creating Discord slash commands
 * 
 * @example
 * const create = new Command('create', 'Submit a question')
 *   .addStringOption('type', 'Question type', true)
 *     .addChoice('Truth', 'truth')
 *     .addChoice('Dare', 'dare')
 *     .done()
 *   .addStringOption('question', 'Your question', true)
 *   .setExecute(async (interaction) => {
 *     // command logic
 *   });
 * 
 * // Usage in interactionCreate:
 * await command.execute(botInteraction);
 */
export class Command {
  private builder: SlashCommandBuilder;
  public readonly name: string;
  public readonly isNSFW: boolean = false;
  public readonly isAdministrator: boolean = false;
  private _execute?: (interaction: BotCommandInteraction) => Promise<void>;
  private _autoComplete?: (interaction: AutocompleteInteraction) => Promise<void>;

  constructor(name: string, description: string) {
    this.name = name;
    this.builder = new SlashCommandBuilder()
      .setName(name)
      .setDescription(description);
  }

  addStringOption(name: string, description: string, required: boolean = false): CommandOption {
    this.builder.addStringOption(option =>
      option
        .setName(name)
        .setDescription(description)
        .setRequired(required)
    );
    
    // Get the last added option
    const lastOption = this.builder.options[this.builder.options.length - 1];
    return new CommandOption(lastOption, this);
  }

  addIntegerOption(name: string, description: string, required: boolean = false): CommandOption {
    this.builder.addIntegerOption(option =>
      option
        .setName(name)
        .setDescription(description)
        .setRequired(required)
    );
    
    const lastOption = this.builder.options[this.builder.options.length - 1];
    return new CommandOption(lastOption, this);
  }

  addBooleanOption(name: string, description: string, required: boolean = false): Command {
    this.builder.addBooleanOption(option =>
      option
        .setName(name)
        .setDescription(description)
        .setRequired(required)
    );
    return this;
  }

  setNSFW(isNSFW: boolean): Command {
    (this as any).isNSFW = isNSFW;
    this.builder.setNSFW(isNSFW);
    return this;
  }

  setAdministrator(isAdministrator: boolean): Command {
    (this as any).isAdministrator = isAdministrator;
    return this;
  }

  setExecute(execute: (interaction: BotCommandInteraction) => Promise<void>): Command {
    this._execute = execute;
    return this;
  }

  setAutoComplete(autoComplete: (interaction: AutocompleteInteraction) => Promise<void>): Command {
    this._autoComplete = autoComplete;
    return this;
  }

  async execute(interaction: BotCommandInteraction): Promise<void> {
    if (!this._execute) {
      throw new Error(`Command ${this.name} has no execute function`);
    }
    await this._execute(interaction);
  }

  async autoComplete(interaction: AutocompleteInteraction): Promise<void> {
    if (!this._autoComplete) {
      throw new Error(`Command ${this.name} has no autoComplete function`);
    }
    await this._autoComplete(interaction);
  }

  toJSON(): any {
    return this.builder.toJSON();
  }
}
