// Barrel file for services
import { DatabaseService } from './DatabaseService';
import { ChallengeService } from './ChallengeService';
import { ConfigurationService } from './ConfigurationService';
import { QuestionService } from './QuestionService';
import { ServerService } from './ServerService';
import { UserService } from './UserService';
import { UserTrackingService } from './UserTrackingService';
import { VotingService } from './VotingService';
import { StorableService } from './StorableService';
import { InventoryService } from './InventoryService';

export { ChallengeService } from './ChallengeService';
export { ConfigurationService } from './ConfigurationService';
export { DatabaseService } from './DatabaseService';
export { QuestionService } from './QuestionService';
export { ServerService } from './ServerService';
export { UserService } from './UserService';
export { UserTrackingService } from './UserTrackingService';
export { VotingService } from './VotingService';
export { StorableService } from './StorableService';
export { InventoryService } from './InventoryService';
export type {
  QueryResult,
  MutationResult,
  DatabaseConfig,
  QueryOptions,
  TransactionCallback
} from './DatabaseService';

// Create DatabaseService instance for dependency injection
export const db = new DatabaseService({
  host: process.env.DB_HOST!,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : undefined,
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  database: process.env.DB_NAME!,
});

// Create service instances with dependency injection
export const challengeService = new ChallengeService();
export const configurationService = new ConfigurationService();
export const questionService = new QuestionService(db);
export const serverService = new ServerService(db);
export const userService = new UserService(db);
export const userTrackingService = new UserTrackingService();
export const votingService = new VotingService();
export const storableService = new StorableService();
export const inventoryService = new InventoryService();
