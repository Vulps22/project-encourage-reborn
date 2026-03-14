// Barrel file for services
import { DatabaseService } from './DatabaseService';
import { QuestionService } from './QuestionService';
import { ModerationService } from './ModerationService';
import { ReportService } from './ReportService';
import { ServerService } from './ServerService';
import { UserService } from './UserService';
import { UserTrackingService } from './UserTrackingService';

export { DatabaseService } from './DatabaseService';
export { ModerationService } from './ModerationService';
export { QuestionService } from './QuestionService';
export { ReportService } from './ReportService';
export { ServerService } from './ServerService';
export { UserService } from './UserService';
export { UserTrackingService } from './UserTrackingService';
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
export const questionService = new QuestionService(db);
export const moderationService = new ModerationService(db);
export const reportService = new ReportService(db);
export const serverService = new ServerService(db);
export const userService = new UserService(db);
export const userTrackingService = new UserTrackingService(db);
