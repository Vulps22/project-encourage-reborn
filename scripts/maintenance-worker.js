const { Client, GatewayIntentBits, ActivityType, MessageFlags } = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', () => {
  console.log(`Maintenance mode active as ${client.user.tag} (shard ${client.shard.ids})`);
  client.user.setPresence({
    status: 'dnd',
    activities: [{ name: '🔧 Under Maintenance', type: ActivityType.Custom }],
  });
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isRepliable()) return;
  try {
    await interaction.reply({
      content: '🔧 **Truth or Dare Online 18+ is currently undergoing maintenance.**\nCheck for updates at https://status.vulps.co.uk',
      flags: MessageFlags.Ephemeral,
    });
  } catch (err) {
    console.error('Failed to reply:', err.message);
  }
});

client.login(process.env.PE_DISCORD_TOKEN);
