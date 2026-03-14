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
    status: ReportStatus;
    moderator_id: string | null;
    ban_reason: string | null;
    sender_id: string;
    offender_id: string;
    server_id: string;
    message_id?: string | null;
    created_at?: Date;
    updated_at?: Date;
}