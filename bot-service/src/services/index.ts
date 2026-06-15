// Barrel file for services
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
export { QuestionService } from './QuestionService';
export { ServerService } from './ServerService';
export { UserService } from './UserService';
export { UserTrackingService } from './UserTrackingService';
export { VotingService } from './VotingService';
export { StorableService } from './StorableService';
export { InventoryService } from './InventoryService';

export const challengeService = new ChallengeService();
export const configurationService = new ConfigurationService();
export const questionService = new QuestionService();
export const serverService = new ServerService();
export const userService = new UserService();
export const userTrackingService = new UserTrackingService();
export const votingService = new VotingService();
export const storableService = new StorableService();
export const inventoryService = new InventoryService();
