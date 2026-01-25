import { Question, Report, ReportStatus, Server } from "../../../interface";
import { db } from "../../../services";
import { BotCommandInteraction } from "../../../structures";
import { Command, Logger } from "../../../utils";

const report = new Command('report', 'Report Inappropriate Content')
    .setNSFW(false)
    .setAdministrator(false)
    .addStringOption('type', 'Type of content to report', true)
    .addChoice('truth/dare', 'question')
    .addChoice('server', 'server')
    .done()
    .addStringOption('id', 'ID of the content to report', true)
    .done()
    .addStringOption('reason', 'Reason for reporting', false)
    .done()
    .setExecute(async (interaction: BotCommandInteraction): Promise<void> => {
        console.log(interaction.executionId);
        await interaction.deferReply({ ephemeral: true });
        let content: Question | Server | false;

        //check the reported content exists
        switch (interaction.options.getString('type')) {
            case 'question':
                //fetch question by id
                content = await getQuestion(parseInt(interaction.options.getString('id') || '0'));
                break;
            case 'server':
                content = await getServer(parseInt(interaction.options.getString('id') || '0'));
                break;
            default:
                await interaction.ephemeralReply('❌ Invalid report type specified.');
                return;
        }

        if (!content || content === undefined || content === null) {
            await interaction.ephemeralReply('❌ Question not found. If this is an Error, Please open a ticket on the [Official Server](https://discord.vulps.co.uk).');
            return;
        }

        //build report Object
        const reportData: Partial<Report> = {
            type: interaction.options.getString('type') || 'unknown',
            reason: interaction.options.getString('reason') || 'No reason provided',
            status: ReportStatus.PENDING,
            sender_id: interaction.user.id,
            offender_id: interaction.options.getString('id')!,
            server_id: interaction.guildId!,
            moderator_id: null,
            ban_reason: null
        };

        //store report in database (omit id, created_at, updated_at - database handles these)
        const { id, created_at, updated_at, ...insertData } = reportData as any;
        const res = (await db.insert('moderation', 'reports', insertData)!).rows![0];

        await Logger.logReport(res as Report);
        
    });

export default report;

async function getQuestion(id: number): Promise<false | Question> {
    if (id < 1) return false;
    let question = await db.get<Question>('question', 'questions', { id: id });
    if (!question) return false;
    return question;
}

async function getServer(id: number): Promise<false | Server> {
    const idString = id.toString();
    if (id < 1 || idString.length < 17 || idString.length > 19) return false;
    let server = await db.get<Server>('server', 'servers', { id: BigInt(idString) });
    if (!server) return false;
    return server;
}