import { Logger } from '../../utils';

jest.mock('../../utils', () => ({
  Logger: {
    logInteractionReceived: jest.fn(),
  },
}));

const mockCommandInteractionEventExecute = jest.fn();
const mockButtonInteractionEventExecute = jest.fn();

jest.mock('../interactionEvents/CommandInteractionEvent', () => ({
  CommandInteractionEvent: class {
    execute = mockCommandInteractionEventExecute;
  }
}));

jest.mock('../interactionEvents/ButtonInteractionEvent', () => ({
  ButtonInteractionEvent: class {
    execute = mockButtonInteractionEventExecute;
  }
}));

import interactionCreate from '../interactionCreate';

describe('interactionCreate event', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Logger.logInteractionReceived as jest.Mock).mockResolvedValue('execution-id-123');
  });

  it('should call command handler for chat input commands', async () => {
    const mockInteraction = {
      isChatInputCommand: jest.fn().mockReturnValue(true),
      isButton: jest.fn().mockReturnValue(false),
    } as any;

    await interactionCreate.execute(mockInteraction);

    expect(mockCommandInteractionEventExecute).toHaveBeenCalledWith(mockInteraction, 'execution-id-123');
  });

  it('should call button handler for button interactions', async () => {
    const mockInteraction = {
      isChatInputCommand: jest.fn().mockReturnValue(false),
      isButton: jest.fn().mockReturnValue(true),
    } as any;

    await interactionCreate.execute(mockInteraction);

    expect(mockButtonInteractionEventExecute).toHaveBeenCalledWith(mockInteraction, 'execution-id-123');
  });
});