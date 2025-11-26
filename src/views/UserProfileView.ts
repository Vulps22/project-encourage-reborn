import { ButtonBuilder, ButtonStyle, ContainerBuilder, MessageFlags, SectionBuilder, SeparatorBuilder, TextDisplayBuilder } from "discord.js";
import { UserProfile } from "../interface";
import { UniversalMessage } from "../types";

async function userProfileView(profile: UserProfile): Promise<UniversalMessage> {
    const client = global.client;

    // Fetch user to get current username
    const user = await client.users.fetch(profile.id);
    const username = user ? user.username : "Unknown User";

    // Title
    const title = new TextDisplayBuilder()
        .setContent(`👤 **User Profile: ${username}**`);

    // User ID
    const userId = new TextDisplayBuilder()
        .setContent(`**User ID:** ${profile.id}`);

    // Account Status
    const statusEmoji = profile.isBanned ? "🚫" : "✅";
    const statusText = profile.isBanned ? "BANNED" : "Active";
    const accountStatus = new TextDisplayBuilder()
        .setContent(`**Account Status:** ${statusEmoji} ${statusText}`);

    // Ban Reason (only if banned)
    const banReasonDisplay = profile.isBanned && profile.banReason
        ? new TextDisplayBuilder().setContent(`**Ban Reason:** ${profile.banReason}`)
        : null;

    // Rules Accepted
    const rulesEmoji = profile.rulesAccepted ? "✅" : "❌";
    const rulesStatus = new TextDisplayBuilder()
        .setContent(`**Rules Accepted:** ${rulesEmoji}`);

    // Global Level & XP
    const levelXP = new TextDisplayBuilder()
        .setContent(`**Global Level:** ${profile.globalLevel} | **XP:** ${profile.globalXP}`);

    // Questions Statistics
    const questionsStats = new TextDisplayBuilder()
        .setContent(
            `**Questions Submitted:** ${profile.totalQuestions}\n` +
            `✅ Approved: ${profile.approvedQuestions} | 🚫 Banned: ${profile.bannedQuestions}`
        );

    // Server Statistics
    const serverStats = new TextDisplayBuilder()
        .setContent(
            `**Servers:** ${profile.totalServers} total | ${profile.serversOwned} owned | ${profile.serversBanned} banned`
        );

    // Account Dates
    const createdDate = profile.createdDateTime.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const accountDates = new TextDisplayBuilder()
        .setContent(`**Account Created:** ${createdDate}`);

    // Delete Date (only if scheduled for deletion)
    const deleteDateDisplay = profile.deleteDate
        ? new TextDisplayBuilder().setContent(
            `**Scheduled for Deletion:** ${profile.deleteDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })}`
        )
        : null;

    // Action Buttons
    const banButton = new ButtonBuilder()
        .setCustomId(`moderation_banUser_id:${profile.id}`)
        .setLabel('Ban User')
        .setStyle(ButtonStyle.Danger);

    const unbanButton = new ButtonBuilder()
        .setCustomId(`moderation_unbanUser_id:${profile.id}`)
        .setLabel('Unban User')
        .setStyle(ButtonStyle.Success);

    const userSection = new SectionBuilder()
        .addTextDisplayComponents(userId, accountStatus);
    if (banReasonDisplay) {
        userSection.addTextDisplayComponents(banReasonDisplay);
    }
    userSection
        .setButtonAccessory(profile.isBanned ? unbanButton : banButton);

    // Build Container
    const container = new ContainerBuilder()
        .addTextDisplayComponents(title)
        .addSeparatorComponents(new SeparatorBuilder())
        .addSectionComponents(userSection)
        .addTextDisplayComponents(rulesStatus, levelXP)
        .addSeparatorComponents(new SeparatorBuilder())
        .addTextDisplayComponents(questionsStats, serverStats)
        .addSeparatorComponents(new SeparatorBuilder())
        .addTextDisplayComponents(accountDates);

    if (deleteDateDisplay) {
        container.addTextDisplayComponents(deleteDateDisplay);
    }

    const message: UniversalMessage = {
        components: [container],
        flags: MessageFlags.IsComponentsV2
    };

    return message;
}

export { userProfileView };
