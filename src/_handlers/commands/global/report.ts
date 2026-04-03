import { AutocompleteInteraction } from "discord.js";
import { Question, Server } from "../../../interface";
import { db, reportService } from "../../../services";
import { BotCommandInteraction } from "../../../structures";
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
            
            // Search questions by content
            const result = await db.query<Question>(
                'SELECT * FROM "question"."questions" WHERE question ILIKE $1 LIMIT 25',
                [`%${searchValue}%`]
            );
            
            // Format for Discord
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
        await interaction.deferReply({ ephemeral: true });
        
        const subcommand = interaction.options.getSubcommand();
        let content: Question | Server | false;
        let reportType: TargetType;

        //check the reported content exists
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

        if (!content || content === undefined || content === null) {
            await interaction.ephemeralReply('❌ Content not found. If this is an Error, Please open a ticket on the [Official Server](https://discord.vulps.co.uk).');
            return;
        }

        const offenderId = subcommand === 'server'
            ? interaction.guildId!
            : interaction.options.getString('id')!;

        await reportService.createReport(
            interaction.user.id,
            offenderId,
            getContent(content),
            reportType,
            interaction.guildId!,
            interaction.options.getString('reason') || 'No reason provided'
        );

        await interaction.ephemeralReply('✅ Report submitted successfully.');
        
    });

export default report;

async function getQuestion(id: number): Promise<false | Question> {
    if (id < 1) return false;
    const question = await db.get<Question>('question', 'questions', { id: id });
    if (!question) return false;
    return question;
}

async function getServer(guildId: string): Promise<false | Server> {
    if (!guildId || guildId.length < 17 || guildId.length > 19) return false;
    const server = await db.get<Server>('server', 'servers', { id: BigInt(guildId) });
    if (!server) return false;
    return server;
}

function getContent(content: Question | Server): string | null {
    if(!content) return null;
    if ('question' in content) {
        return content.question;
    } else if ('name' in content) {
        return content.name || null;
    }

    return null;
}