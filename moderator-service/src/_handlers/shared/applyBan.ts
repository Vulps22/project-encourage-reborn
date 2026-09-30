import { QuestionType, TargetType } from "@vulps22/project-encourage-types";
import { moderationService, questionService, reportService, serverService, userService } from "../../services";
import { Logger, ModerationLogger } from "../../bot/utils";
import { ServerProfileBuilder } from "../../bot/builders/ServerProfileBuilder";

/**
 * The ban itself succeeded but the target could not be read back to refresh its
 * mod log entry. Thrown rather than swallowed so the caller can tell the
 * moderator, which matters — the ban has landed but the log now shows stale
 * state.
 */
export class BanTargetNotFoundError extends Error {
    constructor(public readonly type: TargetType, public readonly targetId: string) {
        super(`${type} ${targetId} not found after banning`);
        this.name = 'BanTargetNotFoundError';
    }
}

/**
 * Applies a ban and everything that must follow it — mod log refresh and
 * resolution of any reports that were awaiting action.
 *
 * Shared so the two routes into a ban cannot drift apart: picking a preset
 * reason from the select menu, and typing a custom one into the modal that
 * "Other" opens.
 *
 * Deliberately does no replying or component updating — the caller owns its own
 * interaction, and that differs between the select and modal paths.
 */
export async function applyBan(
    type: TargetType,
    targetId: string,
    reason: string,
    moderatorId: string,
): Promise<void> {
    switch (type) {
        case TargetType.Question:
            await applyQuestionBan(targetId, reason, moderatorId);
            break;
        case TargetType.Server:
            await applyServerBan(targetId, reason, moderatorId);
            break;
        case TargetType.User:
            await applyUserBan(targetId, reason, moderatorId);
            break;
    }

    await resolveActioningReports(targetId, moderatorId);
}

async function applyQuestionBan(questionId: string, reason: string, moderatorId: string): Promise<void> {
    await moderationService.banQuestion(questionId, moderatorId, reason);

    const question = await questionService.getQuestionById(Number(questionId));
    if (!question) {
        throw new BanTargetNotFoundError(TargetType.Question, questionId);
    }

    const logChannelId = question.type === QuestionType.Truth
        ? global.config.TRUTHS_LOG_CHANNEL_ID
        : global.config.DARES_LOG_CHANNEL_ID;
    await ModerationLogger.updateQuestionLog(question, logChannelId);
}

async function applyServerBan(serverId: string, reason: string, moderatorId: string): Promise<void> {
    await moderationService.banServer(serverId, moderatorId, reason);

    const profile = await new ServerProfileBuilder().getServerProfile(serverId);
    if (!profile) {
        throw new BanTargetNotFoundError(TargetType.Server, serverId);
    }

    await ModerationLogger.updateServerLog(profile);
}

async function applyUserBan(userId: string, reason: string, moderatorId: string): Promise<void> {
    await userService.banUser(userId, reason);
    Logger.debug(`User ${userId} banned with reason: ${reason}`);

    const bannedQuestionsCount = await questionService.banAllUserQuestions(userId, moderatorId);
    Logger.debug(`Banned ${bannedQuestionsCount} questions from user ${userId}`);

    const bannedServersCount = await serverService.banUserServers(userId, reason);
    Logger.debug(`Banned ${bannedServersCount} servers owned by user ${userId}`);
}

/**
 * Marks any reports waiting on this target as actioned and tells the reporters.
 * Common to all three ban types.
 */
async function resolveActioningReports(targetId: string, moderatorId: string): Promise<void> {
    const reports = await moderationService.findActioningReports(targetId);
    for (const report of reports) {
        await moderationService.actionedReport(report.id!, moderatorId);
        await reportService.notifyReporter(
            report,
            `Your report (#${report.id}) has been reviewed. Action has been taken against the reported content.`
        );
    }
}
