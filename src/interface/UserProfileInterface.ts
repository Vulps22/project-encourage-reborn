export interface UserProfile {
    id: string;
    //Do not use 'username' here as that database field is deprecated
    rulesAccepted: boolean;
    isBanned: boolean;
    banReason: string | null;
    globalLevel: number;
    globalXP: number;
    totalQuestions: number;
    approvedQuestions: number;
    bannedQuestions: number;
    totalServers: number;
    serversOwned: number;
    serversBanned: number;
    createdDateTime: Date;
    deleteDate: Date | null;
}