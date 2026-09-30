import { UniversalMessage } from '@vulps22/bot-interactions';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, MessageFlags, TextDisplayBuilder } from 'discord.js';

/**
 * Shown when a user tries to skip with no skips left. Offers the Top.gg vote link
 * and, when the skip pack is in the catalogue, a Premium button to buy one.
 */
function noSkipsView(skipPackSkuId: string | null): UniversalMessage {
    const container = new ContainerBuilder()
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `❌ You have no skips left! You can earn more by voting at [Top.gg](<${process.env.TOPGG_URL}>)` +
            (skipPackSkuId ? ', or buy a skip pack below.' : '.')
        ));

    if (!skipPackSkuId) {
        return { flags: MessageFlags.IsComponentsV2, components: [container] };
    }

    const buyButton = new ButtonBuilder()
        .setStyle(ButtonStyle.Premium)
        .setSKUId(skipPackSkuId);

    const actionRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(buyButton);

    return { flags: MessageFlags.IsComponentsV2, components: [container, actionRow] };
}

export { noSkipsView };
