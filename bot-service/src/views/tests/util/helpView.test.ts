import { ContainerBuilder, MessageFlags } from 'discord.js';
import helpView from '../../util/helpView';

describe('helpView', () => {
  it('should return a message with ComponentsV2 flag', () => {
    const message = helpView();

    expect(message.flags).toBe(MessageFlags.IsComponentsV2);
  });

  it('should return a message with components array', () => {
    const message = helpView();

    expect(message.components).toBeDefined();
    expect(Array.isArray(message.components)).toBe(true);
    expect(message.components?.length).toBeGreaterThan(0);
  });

  it('should include a ContainerBuilder component', () => {
    const message = helpView();

    expect(message.components).toBeDefined();
    expect(message.components![0]).toBeInstanceOf(ContainerBuilder);
  });

  it('should build a valid ContainerBuilder', () => {
    const message = helpView();
    expect(message.components).toBeDefined();
    const container = message.components![0] as ContainerBuilder;

    // Verify it can be converted to JSON without errors
    expect(() => container.toJSON()).not.toThrow();
  });

  it('should include title in the container', () => {
    const message = helpView();
    expect(message.components).toBeDefined();
    const container = message.components![0] as ContainerBuilder;
    const json = container.toJSON();

    // Find the title text in the JSON structure
    const hasTitle = JSON.stringify(json).includes('Truth or Dare Bot Help');
    expect(hasTitle).toBe(true);
  });

  it('should include intro text', () => {
    const message = helpView();
    expect(message.components).toBeDefined();
    const container = message.components![0] as ContainerBuilder;
    const json = container.toJSON();

    const hasIntro = JSON.stringify(json).includes('Here are the commands you can use with the bot');
    expect(hasIntro).toBe(true);
  });

  it('should include Basic Commands section', () => {
    const message = helpView();
    expect(message.components).toBeDefined();
    const container = message.components![0] as ContainerBuilder;
    const json = container.toJSON();

    const content = JSON.stringify(json);
    expect(content).toContain('Basic Commands');
    expect(content).toContain('/truth');
    expect(content).toContain('/dare');
    expect(content).toContain('/random');
  });

  it('should include Create Commands section', () => {
    const message = helpView();
    expect(message.components).toBeDefined();
    const container = message.components![0] as ContainerBuilder;
    const json = container.toJSON();

    const content = JSON.stringify(json);
    expect(content).toContain('Create Commands');
    expect(content).toContain('/create dare');
    expect(content).toContain('/create truth');
  });

  it('should include Challenge Commands section', () => {
    const message = helpView();
    expect(message.components).toBeDefined();
    const container = message.components![0] as ContainerBuilder;
    const json = container.toJSON();

    const content = JSON.stringify(json);
    expect(content).toContain('Challenge Commands');
    expect(content).toContain('/give dare');
    expect(content).toContain('/give truth');
  });

  it('should include Report Commands section', () => {
    const message = helpView();
    expect(message.components).toBeDefined();
    const container = message.components![0] as ContainerBuilder;
    const json = container.toJSON();

    const content = JSON.stringify(json);
    expect(content).toContain('Report Commands');
    expect(content).toContain('/report dare');
    expect(content).toContain('/report truth');
    expect(content).toContain('/report server');
  });

  it('should include Utility Commands section', () => {
    const message = helpView();
    expect(message.components).toBeDefined();
    const container = message.components![0] as ContainerBuilder;
    const json = container.toJSON();

    const content = JSON.stringify(json);
    expect(content).toContain('Utility Commands');
    expect(content).toContain('/vote');
    expect(content).toContain('/terms');
    expect(content).toContain('/help');
  });

  it('should include Creating Truths or Dares section', () => {
    const message = helpView();
    expect(message.components).toBeDefined();
    const container = message.components![0] as ContainerBuilder;
    const json = container.toJSON();

    const content = JSON.stringify(json);
    expect(content).toContain('Creating Truths or Dares');
    expect(content).toContain('Everybody worldwide is welcome');
  });

  it('should include Links section with placeholders', () => {
    const message = helpView();
    expect(message.components).toBeDefined();
    const container = message.components![0] as ContainerBuilder;
    const json = container.toJSON();

    const content = JSON.stringify(json);
    expect(content).toContain('Links');
    expect(content).toContain('Join Our Support Server');
    expect(content).toContain('Add The Bot');
  });
});
