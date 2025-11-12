import { ButtonHandler } from "../../utils";

const approveQuestionButton: ButtonHandler = {
    name: "approve_question",
    async execute(interaction) {
        const questionId = interaction.params.get("Id");
        console.log(`Question with ID ${questionId} has been approved.`);
    }
};

export default approveQuestionButton;