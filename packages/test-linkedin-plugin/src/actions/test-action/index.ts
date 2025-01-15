
import {
    HandlerCallback,
    IAgentRuntime,
    Memory,
    State
} from "@elizaos/core";

export const testAction =  ({
    name: "TEST_ACTION",
    description: "Runs test action",
    handler: async (
        _runtime: IAgentRuntime,
        _message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        _callback?: HandlerCallback
    ) => {
        try {
            if (_callback) {
                const filepath = `../agent/generatedImages/generated_1736938600821_0.png`;
                const filename = `generated_1736938600821_0`;
                await _callback(
                    {
                        text: `${filepath}`, //caption.description,
                        attachments: [
                            {
                                id: crypto.randomUUID(),
                                url: filepath,
                                title: "Generated image",
                                source: "imageGeneration",
                                description: "...", //caption.title,
                                text: "...", //caption.description,
                                contentType: "image/png",
                            },
                        ],
                    },
                    [
                        {
                            attachment: filepath,
                            name: `${filename}.png`,
                        },
                    ]
                );
            }
            return true;
        } catch (error) {
            console.error("Unhandled error:", error);

            if (_callback) {
                await _callback({
                    text: `Error generating image: ${error.message}`,
                    content: { error: error.message },
                });
            }
            return false;
        }
    },
    validate: async (runtime: IAgentRuntime) => {
        return true;
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Show me test action.",
                    action: "TEST_ACTION",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Here it is.",
                    action: "TEST_ACTION",
                }
            },

        ],
    ],
    similes: ["TEST-ACTION"],
});
