import {
    Action,
    composeContext,
    generateImage,
    generateObjectDeprecated,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    ModelClass,
    State,
} from "@elizaos/core";
import { linkedinPostTemplate } from "../templates";
import { LinkedInApi } from "../../shared/services/linkedin-api";
import axios from "axios";
import { dataURLtoBlob } from "../../shared/helpers/data-url-to-blob";
import { Runtime } from "tslog";



export const publishPostOnLinkedInAction: Action = ({
    name: "LINKEDIN_PUBLISH_POST",
    description: "Publish a post on LinkedIn",
    handler: async (
        _runtime: IAgentRuntime,
        _message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        _callback?: HandlerCallback
    ) => {
        try {
            const postContext = composeContext({
                state: state,
                template: linkedinPostTemplate,
                templatingEngine: "handlebars",
            });
            const postContent = await generateObjectDeprecated({
                runtime: _runtime,
                context: postContext,
                modelClass: ModelClass.SMALL,
            });
            const testImage = await generateImage({ prompt:postContent.imageDescription, width: 100, height: 100,  }, _runtime);


            // TODO before publishing post, give user a chance to review the post and make changes if needed
            // that can be done by adding a new action to the post, like "REVIEW_POST"
            // and then the user can review the post and approve it
            // if the user approves the post, then we can publish it
            // if the user doesn't approve the post, then we can ask them to make changes
            // and then we can try again


            const accessToken = 'AQWxTriX3nwZ'; /// hardcoded for now
            const userId = 'VPh'; /// hardcoded for now
            const axiosInstance = axios.create({
                baseURL: "https://api.linkedin.com/v2",
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                },
            });
            const blob = dataURLtoBlob(testImage?.data?.[0])
            const linkedinApi = new LinkedInApi(axiosInstance, userId);
            const mediaId = await linkedinApi.uploadAsset(blob);
            await linkedinApi.publishPostWithMediaAsset({
                postText: postContent.text,
                media: {
                    title: "Media content",
                    id: mediaId
                }
            });

            if (_callback) {
                await _callback({
                    text: 'Successfully published post on LinkedIn',
                });

                const newMemory: Memory = {
                    userId: _message.userId,
                    agentId: _message.agentId,
                    roomId: _message.roomId,
                    content: {
                        text: 'Successfully published post on LinkedIn',
                    },
                };

                await _runtime.messageManager.createMemory(newMemory);
            }

            return true;

        } catch (error) {
            console.error('Error publishing post on LinkedIn:', error);

            if (_callback) {
                await _callback({
                    text: `Error publishing post on LinkedIn: ${error.message}`,
                    content: { error: error.message },
                });
            }

            const newMemory: Memory = {
                userId: _message.agentId,
                agentId: _message.agentId,
                roomId: _message.roomId,
                content: {
                    text: `Error publishing post on LinkedIn: ${error.message}`,
                },
            };

            await _runtime.messageManager.createMemory(newMemory);

            return false;
        }


    },
    validate: async (runtime: IAgentRuntime) => {
        const clientId = runtime.getSetting("LINKEDIN_CLIENT_ID");
        const clientSecret = runtime.getSetting("LINKEDIN_CLIENT_SECRET");
        const authServerPort = runtime.getSetting("LINKEDIN_AUTH_SERVER_PORT_ID");

        return !(clientId && clientSecret && authServerPort);
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Publish linkedin post about artificial intelligence trends and generate image that shows futuristic robot",
                    action: "LINKEDIN_PUBLISH_POST",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Your post has been published on LinkedIn successfully!",
                    action: "LINKEDIN_PUBLISH_POST",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Create a linkedin post about our company's job openings and generate image showing modern office space",
                    action: "LINKEDIN_PUBLISH_POST",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Your job announcement has been posted to LinkedIn!",
                    action: "LINKEDIN_PUBLISH_POST",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Write a linkedin post about our recent partnership success and generate image showing business handshake",
                    action: "LINKEDIN_PUBLISH_POST",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Your post has been shared on LinkedIn!",
                    action: "LINKEDIN_PUBLISH_POST",
                },
            },
        ],
    ],
    similes: [
        "PUBLISH_POST_ON_LINKEDIN",
        "PUBLISH_ARTICLE_ON_LINKEDIN",
    ],
});
