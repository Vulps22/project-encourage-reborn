import { AutocompleteInteraction, MessageFlags } from "discord.js";
import { Question, Server } from "../../../interface";
import { dsClient, msClient } from "../../../client";
import { BotCommandInteraction } from "@vulps22/bot-interactions";
import { Command } from "../../../utils";
import { TargetType } from "../../../types";

const report = new Command('report', 'Report Inappropriate Content')
    .setNSFW(false)
    .setAdministrator(false)
    .addSubcommand('question', 'Report a truth or dare question')
        .addStringOption('id', 'Search for the question to report', true)
        .setAutocomplete(true)
        .done()
        .addStringOption('reason', 'Reason for reporting', false)
        .done()
    .done()
    .addSubcommand('server', 'Report a server')
        .addStringOption('reason', 'Reason for reporting', false)
        .done()
    .done()
    .setAutoComplete(async (interaction: AutocompleteInteraction): Promise<void> => {
        const subcommand = interaction.options.getSubcommand();
        const focusedOption = interaction.options.getFocused(true);

        if (focusedOption.name === 'id' && subcommand === 'question') {
            const searchValue = focusedOption.value || '';

            const result = await dsClient.searchQuestions(searchValue);

            const choices = result.map(q => ({
                name: `${q.id} - ${q.question.substring(0, 80)}${q.question.length > 80 ? '...' : ''}`,
                value: q.id.toString()
            }));

            await interaction.respond(choices);
        } else {
            await interaction.respond([]);
        }
    })
    .setExecute(async (interaction: BotCommandInteraction): Promise<void> => {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const subcommand = interaction.options.getSubcommand();
        let content: Question | Server | false;
        let reportType: TargetType;

        switch (subcommand) {
            case 'question':
                reportType = TargetType.Question;
                content = await getQuestion(parseInt(interaction.options.getString('id') || '0'));
                break;
            case 'server':
                reportType = TargetType.Server;
                content = await getServer(interaction.guildId!);
                break;
            default:
                await interaction.ephemeralReply('❌ Invalid report type specified.');
                return;
        }

        if (!content) {
            await interaction.ephemeralReply('❌ Content not found. If this is an Error, Please open a ticket on the [Official Server](https://discord.vulps.co.uk).');
            return;
        }

        const offenderId = subcommand === 'server'
            ? interaction.guildId!
            : interaction.options.getString('id')!;

        await msClient.submitReport(
            interaction.user.id,
            offenderId,
            reportType,
            interaction.guildId!,
            getContent(content),
            interaction.options.getString('reason') ?? 'No reason provided'
        );

        await interaction.ephemeralReply('✅ Report submitted successfully.');
    });

export default report;

async function getQuestion(id: number): Promise<false | Question> {
    if (id < 1) return false;
    return await dsClient.getQuestion(id) ?? false;
}

async function getServer(guildId: string): Promise<false | Server> {
    if (!guildId || guildId.length < 17 || guildId.length > 19) return false;
    return await dsClient.getServer(guildId) ?? false;
}

function getContent(content: Question | Server): string | null {
    if ('question' in content) return content.question;
    if ('name' in content) return content.name || null;
    return null;
}
