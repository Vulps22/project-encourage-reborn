"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const token = process.env.PE_DISCORD_TOKEN;
if (!token) {
    console.error('PE_DISCORD_TOKEN is not defined in environment variables');
    process.exit(1);
}
const MAINTENANCE_MESSAGE = "We're currently down for maintenance. Check https://status.vulps.co.uk for updates.";
const client = new discord_js_1.Client({ intents: [discord_js_1.GatewayIntentBits.Guilds], shards: 'auto' });
async function handleInteractionCreate(interaction) {
    if (!interaction.isRepliable())
        return;
    try {
        await interaction.reply({
            content: MAINTENANCE_MESSAGE,
            flags: discord_js_1.MessageFlags.Ephemeral,
        });
    }
    catch (error) {
        console.error('Failed to reply with maintenance message:', error);
    }
}
client.on('interactionCreate', (interaction) => void handleInteractionCreate(interaction));
client.once('ready', () => {
    console.log(`Backup bot online as ${client.user?.tag ?? 'unknown user'}`);
});
client.login(token).catch((error) => {
    console.error('Failed to log in:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map