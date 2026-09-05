import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import { TargetType } from "@vulps22/project-encourage-types";

/** Field id the modal handler reads the typed reason back out of. */
export const CUSTOM_REASON_FIELD = 'reason';

/**
 * Modal shown when a moderator picks "Other (Custom Reason)" from a ban reason
 * select menu. One modal serves questions, servers and users — the target type
 * and id ride along in the custom id so the submit handler knows what to ban.
 *
 * Custom id format is `<prefix>_<action>_<key:value>`, parsed by
 * BotModalInteraction, so neither the type nor the id may contain `_` or `:`.
 * TargetType values are plain lowercase words, and ids are snowflakes or
 * integers, so both are safe.
 */
export function customBanReasonModal(type: TargetType, targetId: string): ModalBuilder {
    const modal = new ModalBuilder()
        .setCustomId(`moderation_customBanReason_type:${type}_id:${targetId}`)
        .setTitle(`Custom ban reason`);

    const reasonInput = new TextInputBuilder()
        .setCustomId(CUSTOM_REASON_FIELD)
        .setLabel('Why is this being banned?')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setMaxLength(500)
        .setPlaceholder('This is recorded against the ban and shown when the ban is queried.');

    modal.addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(reasonInput)
    );

    return modal;
}
