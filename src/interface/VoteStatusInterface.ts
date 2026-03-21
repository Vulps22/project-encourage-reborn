export interface VoteStatus {
  doneCount: number;
  failedCount: number;
  threshold: number;
  isFinalized: boolean;
  finalResult: 'done' | 'failed' | 'skipped' | null;
}
