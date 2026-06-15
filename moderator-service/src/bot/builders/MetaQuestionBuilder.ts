import { Question, User, Server } from '@vulps22/project-encourage-types';
import { Logger } from '../utils';
import { questionService, userService, serverService } from '../../services';

export interface MetaQuestion {
    question: Question;
    user: User | null;
    server: Server | null;
}

export class MetaQuestionBuilder {
    async getMetaQuestion(questionId: number): Promise<MetaQuestion | null> {
        Logger.debug(`Fetching meta question for ${questionId}`);

        const question = await questionService.getQuestionById(questionId);
        if (!question) return null;

        const [user, server] = await Promise.all([
            userService.getUser(question.user_id),
            serverService.getServerSettings(question.server_id),
        ]);

        Logger.debug(`Meta question ${questionId} retrieved successfully`);
        return { question, user, server };
    }
}
