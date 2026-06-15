import { DatabaseClient } from '../bot/services/DatabaseClient';
import { ChallengeService } from './ChallengeService';
import { ConfigurationService } from './ConfigurationService';
import { ModerationService } from './ModerationService';
import { QuestionService } from './QuestionService';
import { ReportService } from './ReportService';
import { ServerService } from './ServerService';
import { UserService } from './UserService';
import { UserTrackingService } from './UserTrackingService';
import { VotingService } from './VotingService';
import { StorableService } from './StorableService';
import { InventoryService } from './InventoryService';

export { ChallengeService } from './ChallengeService';
export { ConfigurationService } from './ConfigurationService';
export { ModerationService } from './ModerationService';
export { QuestionService } from './QuestionService';
export { ReportService } from './ReportService';
export { ServerService } from './ServerService';
export { UserService } from './UserService';
export { UserTrackingService } from './UserTrackingService';
export { VotingService } from './VotingService';
export { StorableService } from './StorableService';
export { InventoryService } from './InventoryService';
export { LoggerService } from './LoggerService';

export const db = new DatabaseClient(process.env.DS_URL!, process.env.DS_MS_API_SECRET ?? '');

export const challengeService = new ChallengeService(db);
export const configurationService = new ConfigurationService(db);
export const moderationService = new ModerationService(db);
export const questionService = new QuestionService(db);
export const reportService = new ReportService(db);
export const serverService = new ServerService(db);
export const userService = new UserService(db);
export const userTrackingService = new UserTrackingService(db);
export const votingService = new VotingService(db);
export const storableService = new StorableService(db);
export const inventoryService = new InventoryService(db);
