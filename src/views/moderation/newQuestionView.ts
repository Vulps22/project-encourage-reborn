import { ContainerBuilder, MessageFlags, SeparatorBuilder, TextDisplayBuilder } from "discord.js";
import { Question } from "../../interface";
import { UniversalMessage } from "../../types";

async function newQuestionView(question: Question): Promise<UniversalMessage> {

    const title = new TextDisplayBuilder()
    .setContent(`🆕 New ${question.type.charAt(0).toUpperCase() + question.type.slice(1)}!`);

    const questionText = new TextDisplayBuilder()
    .setContent(`**Question:** \n ${question.question}`);

    const client = global.client;
    
    //get the user's username. do not use cache
    const user = await client.users.fetch(question.user_id);
    const username = user ? user.username : "Unknown User";

    //get the server's name. do not use cache
    const guild = await client.guilds.fetch(question.server_id);

    const authorInfo = new TextDisplayBuilder()
    //.setContent(`**Submitted by:**\n<@${question.user_id}> | ${question.user_id})`);
    .setContent(`**Submitted by:** ${username} (User ID: ${question.user_id})`);

    const serverInfo = new TextDisplayBuilder()
    .setContent(`**Server Name:**\n${guild.name} | ${question.server_id}`);

    const id: TextDisplayBuilder = new TextDisplayBuilder()
    .setContent(`**Question ID:**\n${question.id}`);

    const container = new ContainerBuilder()
    .addTextDisplayComponents(title)
    .addSeparatorComponents(new SeparatorBuilder())
    .addTextDisplayComponents(questionText, authorInfo, serverInfo, id);

    const message: UniversalMessage = {
        components: [container],
        flags: MessageFlags.IsComponentsV2
    };

    return message;
}

export { newQuestionView };