export interface ChallengeVote {
  challenge_id: number;
  done_count: number;
  failed_count: number;
  final_result: 'done' | 'failed' | 'skipped' | null;
  finalised_datetime: Date | null;
}
