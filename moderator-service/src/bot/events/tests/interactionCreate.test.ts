jest.mock('../../utils', () => ({
  Logger: {
    logInteractionReceived: jest.fn(),
    error: jest.fn(),
    updateExecution: jest.fn(),
  },
}));

const mockCommandInteractionEventExecute = jest.fn();
const mockCommandInteractionEventAutocomplete = jest.fn();
const mockButtonInteractionEventExecute = jest.fn();
const mockModalInteractionEventExecute = jest.fn();
const mockStringSelectInteractionEventExecute = jest.fn();
const mockChannelSelectInteractionEventExecute = jest.fn();

jest.mock('../interactionEvents', () => ({
  CommandInteractionEvent: class {
    execute = mockCommandInteractionEventExecute;
    autocomplete = mockCommandInteractionEventAutocomplete;
  },
  ButtonInteractionEvent: class {
    execute = mockButtonInteractionEventExecute;
  },
  ModalInteractionEvent: class {
    execute = mockModalInteractionEventExecute;
  },
  StringSelectInteractionEvent: class {
    execute = mockStringSelectInteractionEventExecute;
  },
}));

jest.mock('../interactionEvents/ChannelSelectInteractionEvent', () => ({
  ChannelSelectInteractionEvent: class {
    execute = mockChannelSelectInteractionEventExecute;
  },
}));

import interactionCreate from '../interactionCreate';
import { Logger } from '../../utils';

function makeInteraction(overrides: Record<string, any> = {}) {
  return {
    isChatInputCommand: jest.fn().mockReturnValue(false),
    isButton: jest.fn().mockReturnValue(false),
    isModalSubmit: jest.fn().mockReturnValue(false),
    isStringSelectMenu: jest.fn().mockReturnValue(false),
    isChannelSelectMenu: jest.fn().mockReturnValue(false),
    isAutocomplete: jest.fn().mockReturnValue(false),
    guild: { id: '987654321', name: 'Test Guild' },
    user: { id: '111222333', username: 'testuser' },
    customId: undefined,
    commandName: undefined,
    ...overrides,
  } as any;
}

describe('interactionCreate event', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Logger.logInteractionReceived as jest.Mock).mockResolvedValue('execution-id-123');
  });

  it('should dispatch autocomplete interactions to CommandInteractionEvent.autocomplete', async () => {
    const mockInteraction = makeInteraction({ isAutocomplete: jest.fn().mockReturnValue(true) });

    await interactionCreate.execute(mockInteraction);

    expect(mockCommandInteractionEventAutocomplete).toHaveBeenCalledWith(mockInteraction);
  });

  it('should dispatch chat input commands to CommandInteractionEvent.execute', async () => {
    const mockInteraction = makeInteraction({ isChatInputCommand: jest.fn().mockReturnValue(true) });

    await interactionCreate.execute(mockInteraction);

    expect(mockCommandInteractionEventExecute).toHaveBeenCalledWith(mockInteraction, 'execution-id-123');
  });

  it('should dispatch modal submits to ModalInteractionEvent.execute', async () => {
    const mockInteraction = makeInteraction({
      isModalSubmit: jest.fn().mockReturnValue(true),
      customId: 'moderation_banReasonModal_id:123',
    });

    await interactionCreate.execute(mockInteraction);

    expect(mockModalInteractionEventExecute).toHaveBeenCalledWith(mockInteraction, 'execution-id-123');
  });

  it('should dispatch button interactions to ButtonInteractionEvent.execute', async () => {
    const mockInteraction = makeInteraction({
      isButton: jest.fn().mockReturnValue(true),
      customId: 'moderation_approveQuestion_id:123',
    });

    await interactionCreate.execute(mockInteraction);

    expect(mockButtonInteractionEventExecute).toHaveBeenCalledWith(mockInteraction, 'execution-id-123');
  });

  it('should dispatch string select menu interactions to StringSelectInteractionEvent.execute', async () => {
    const mockInteraction = makeInteraction({
      isStringSelectMenu: jest.fn().mockReturnValue(true),
      customId: 'moderation_userBanReasonSelected_id:123',
    });

    await interactionCreate.execute(mockInteraction);

    expect(mockStringSelectInteractionEventExecute).toHaveBeenCalledWith(mockInteraction, 'execution-id-123');
  });

  it('should dispatch channel select menu interactions to ChannelSelectInteractionEvent.execute', async () => {
    const mockInteraction = makeInteraction({
      isChannelSelectMenu: jest.fn().mockReturnValue(true),
      customId: 'moderation_logChannelSelected_id:123',
    });

    await interactionCreate.execute(mockInteraction);

    expect(mockChannelSelectInteractionEventExecute).toHaveBeenCalledWith(mockInteraction, 'execution-id-123');
  });

  it('should log the interaction before dispatching', async () => {
    const mockInteraction = makeInteraction({ isChatInputCommand: jest.fn().mockReturnValue(true), commandName: 'ban' });

    await interactionCreate.execute(mockInteraction);

    expect(Logger.logInteractionReceived).toHaveBeenCalledWith(mockInteraction, 'Command: /ban');
  });

  it('should do nothing for interaction types with no matching branch', async () => {
    const mockInteraction = makeInteraction();

    await interactionCreate.execute(mockInteraction);

    expect(mockCommandInteractionEventExecute).not.toHaveBeenCalled();
    expect(mockButtonInteractionEventExecute).not.toHaveBeenCalled();
    expect(mockModalInteractionEventExecute).not.toHaveBeenCalled();
    expect(mockStringSelectInteractionEventExecute).not.toHaveBeenCalled();
    expect(mockChannelSelectInteractionEventExecute).not.toHaveBeenCalled();
  });
});
