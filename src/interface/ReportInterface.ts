import { TargetType } from "../types";

export enum ReportStatus {
    PENDING = 'pending',
    ACTIONED = 'actioned',
    ACTIONING = 'actioning',
    CLEARED = 'cleared'
}

export interface Report {
    id?: number;
    type: TargetType;
    reason: string | null;
    content: string | null;
    status: ReportStatus;
    moderator_id: string | null;
    ban_reason: string | null;
    sender_id: string;
    offender_id: string;
    server_id: string;
    message_id?: string | null;
    created_at?: Date;
    updated_at?: Date;
    // View fields (populated when queried from report_view)
    question_id?: number | null;
    question_creator_id?: string | null;
    question_text?: string | null;
    question_type?: string | null;
    question_is_approved?: boolean | null;
    question_is_banned?: boolean | null;
    sender_username?: string | null;
    sender_is_banned?: boolean | null;
    sender_level?: number | null;
    offender_user_id?: string | null;
    offender_username?: string | null;
    offender_is_banned?: boolean | null;
    offender_ban_reason?: string | null;
    offender_banned_questions?: number | null;
}