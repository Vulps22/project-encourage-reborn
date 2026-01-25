export enum ReportStatus {
    PENDING = 'pending',
    ACTIONED = 'actioned',
    RESOLVED = 'resolved',
    CLEARED = 'cleared'
}

export interface Report {
    id?: number;
    type: string;
    reason: string | null;
    status: ReportStatus;
    moderator_id: string | null;
    ban_reason: string | null;
    sender_id: string;
    offender_id: string;
    server_id: string;
    created_at?: Date;
    updated_at?: Date;
}