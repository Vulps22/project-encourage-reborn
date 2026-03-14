
import { TargetType } from '../types';

const questionBanReasonList = [
        { label: "1 - Dangerous or Illegal Content", value: "dangerous_illegal" },
        { label: "2 - Breaches Discord T&C or Community Guidelines", value: "violates_guidelines" },
        { label: "3 - Not In English", value: "not_english" },
        { label: "4 - Mentions A Specific Person", value: "mentions_person" },
        { label: "5 - Incorrect Category Of Question", value: "wrong_category" },
        { label: "6 - Giver Dare", value: "giver_dare" },
        { label: "7 - Childish Content", value: "childish" },
        { label: "8 - Nonsense Content", value: "nonsense" },
        { label: "9 - Not A Question", value: "not_question" },
        { label: "10 - Likely to be Ignored", value: "likely_ignored" },
        { label: "11 - Requires More Than One Person", value: "multi_person" },
        { label: "12 - Low effort", value: "low_effort" },
        { label: "13 - Poor Spelling or Grammar", value: "poor_grammar" },
        { label: "14 - Other (Custom Reason)", value: "other" },
    ];

const serverBanReasonList = [
        { label: "1 - Breaches Discord T&C or Community Guidelines", value: "violates_guidelines" },
        { label: "2 - Server label suggests members could be under 18", value: "underage_label" },
        { label: "3 - Server Activity suggests members could be under 18", value: "underage_activity" },
        { label: "4 - Server label contains Hate Speech", value: "hate_speech" },
        { label: "5 - Confirmed server members are under 18", value: "confirmed_underage" },
        { label: "6 - Server-wide creation spam", value: "spam" },
        { label: "7 - Other (Custom Reason)", value: "other" },
    ];

const userBanReasonList = [
        { label: "1 - Breached Discord T&C or Community Guidelines", value: "violates_guidelines" },
        { label: "2 - Suspected Under 18 User", value: "suspected_underage" },
        { label: "3 - Activity Suggests User Could Be Under 18", value: "activity_underage" },
        { label: "4 - Label Contains Hate Speech", value: "hate_speech" },
        { label: "5 - Confirmed User is Under 18", value: "confirmed_underage" },
        { label: "6 - Creation Spam", value: "spam" },
        { label: "7 - Other (Custom Reason)", value: "other" },
    ];

// Export as an object with TargetType keys
export const banReasons = {
    [TargetType.Question]: questionBanReasonList,
    [TargetType.Server]: serverBanReasonList,
    [TargetType.User]: userBanReasonList,
} as const;

// Keep individual exports for backward compatibility if needed
export { questionBanReasonList, serverBanReasonList, userBanReasonList };