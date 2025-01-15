import { createPostTemplate } from "../../template/template.ts";
import { createPostAction } from "./create-post-action.ts";
import {extractedContent} from "../../types/types.ts";
import {
    composeContext,
    generateObjectDeprecated,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    ModelClass,
    State
} from "@elizaos/core";

export const createPost =  ({
    name: "LINKEDIN_POST",
    description: "Swaps tokens on cosmos chains",
    handler: async (
        _runtime: IAgentRuntime,
        _message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        _callback?: HandlerCallback
    ) => {
        const postContext = composeContext({
            state: state,
            template: createPostTemplate, // to be aligned with logic
            templatingEngine: "handlebars",
        });

        const createPostContent: extractedContent = await generateObjectDeprecated({
            runtime: _runtime,
            context: postContext,
            modelClass: ModelClass.SMALL,
        });

        try {
            const action = new createPostAction();

            await action.execute(createPostContent.text, createPostContent.imagePath);

            if (_callback) {
                await _callback({
                    text: `Generation completed. Post has been published.`,
                    content: {
                        success:true,
                    },
                });
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
                    text: "Generate post on LinkedIn about cats and dogs. It should contain appropriate image.",
                    action: "GENERATE_IMAGE",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Generated image for your post",
                    action: "GENERATE_IMAGE",
                }
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Generated text for your post and published it.",
                    action: "LINKEDIN_POST",
                }
            }
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Create a post with image on LinkedIn about cats and dogs.",
                    action: "GENERATE_IMAGE",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Generated image for your post",
                    action: "GENERATE_IMAGE",
                }
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Generated text for your post and published it.",
                    action: "LINKEDIN_POST",
                }
            }
        ],
    ],
    similes: ["CREATE_LINKEDIN_POST", "LINKEDIN_POST"],
});
