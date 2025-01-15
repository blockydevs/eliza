import {
    MemoryManager,
    CacheManager,
    DbCacheAdapter,
    Plugin,
    Provider,
    IAgentRuntime,
    Memory,
    State,
    elizaLogger,
    stringToUuid,
    composeContext,
    generateObjectDeprecated,
} from "@elizaos/core";
import express from "express";
import axios from "axios";
import { Action } from "@elizaos/core";
import { ModelClass } from "@elizaos/core";

interface LinkedInAccessToken {
    access_token: string;
    expires_in: number;
}

let sessionTokens: Record<Memory["roomId"], LinkedInAccessToken> = {};

const PLUGIN_LINKEDIN_TABLE_NAME = "plugin-linkedin2";

class MemoryManagerUtils {
    static getPageMemories = async ({
        currentPage,
        memoryMenager,
        pageLenght,
        roomId,
        unique,
    }: {
        unique?: boolean;
        currentPage: number;
        pageLenght: number;
        memoryMenager: MemoryManager;
        roomId: `${string}-${string}-${string}-${string}-${string}`;
    }) => {
        return memoryMenager.getMemories({
            unique,
            roomId,
            count: pageLenght + 1,
            start: currentPage > 1 ? currentPage * pageLenght : 0,
        });
    };

    static getAllMemories = async (
        memoryMenager: MemoryManager,
        roomId: `${string}-${string}-${string}-${string}-${string}`,
        config: {
            pageLenght?: number;
            unique?: boolean;
        } = {
            pageLenght: 100,
            unique: false,
        }
    ) => {
        const getPageMemoriesHandler = async (page: number) =>
            await this.getPageMemories({
                currentPage: page,
                memoryMenager,
                pageLenght: config.pageLenght + 1,
                roomId,
                unique: config.unique,
            });

        let currentPage = 1;

        let currentPageMemories = await getPageMemoriesHandler(currentPage);

        if (currentPageMemories.length <= config.pageLenght) {
            return currentPageMemories;
        }

        const memories = {
            currentPage: currentPageMemories,
        };

        let runPagination = true;

        while (runPagination) {
            currentPage += 1;

            const newPageMemories = await getPageMemoriesHandler(currentPage);

            if (newPageMemories.length <= config.pageLenght) {
                runPagination = false;
            }

            memories[currentPage] = newPageMemories;
        }

        return Object.values(memories).flat();
    };

    static findMemoryWithPrefix = async (
        memoryMenager: MemoryManager,
        prefix: string,
        roomId: `${string}-${string}-${string}-${string}-${string}`
    ) => {
        const memories = await MemoryManagerUtils.getAllMemories(
            memoryMenager,
            roomId
        );

        return memories.find((memory) =>
            memory?.content?.text.startsWith(prefix)
        );
    };
}

const linkedInAccessTokenToMemoryMessage = (
    linkedInAccessToken: LinkedInAccessToken
) => {
    return `LinkedIn Access Token Data:\n -Access token: "${linkedInAccessToken.access_token}"\n -Expires in: "${linkedInAccessToken.expires_in}"`;
};

const startServerToRetrieveNewAccessToken = async (
    runtime: IAgentRuntime,
    message: Memory
) => {
    const app = express();
    const port = runtime.getSetting("LINKEDIN_AUTH_SERVER_PORT_ID") || 3420;

    async function sendMessage(
        runtime: IAgentRuntime,
        message: Memory,
        content: string
    ) {
        const chatMessage: Memory = {
            roomId: message.roomId, // Specify the chat room ID
            userId: message.userId, // Specify the user ID
            agentId: runtime.agentId, // Specify the agent ID
            content: {
                text: content,
                action: "SEND_URL",
            }, // Specify the message content
            createdAt: Date.now(), // Specify the message creation time
        };

        await runtime.processActions(chatMessage, [chatMessage]);
    }

    await sendMessage(runtime, message, "url: http://localhost:3420/auth");

    return new Promise<LinkedInAccessToken>((resolve, reject) => {
        let newLinkedInAccessToken: LinkedInAccessToken | null = null;

        app.get("/auth", async (req, res) => {
            // GET https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id={your_client_id}&redirect_uri={your_callback_url}&state=foobar&scope=liteprofile%20emailaddress%20w_member_social

            const clientId = runtime.getSetting("LINKEDIN_CLIENT_ID");
            const redirectUri = `http://localhost:${port}/auth/update-access-token`;

            const uuid = stringToUuid(PLUGIN_LINKEDIN_TABLE_NAME);

            res.redirect(
                `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${uuid}&scope=profile`
            );
        });

        app.get("/auth/update-access-token", async (req, res) => {
            const tokenUrl = "https://www.linkedin.com/oauth/v2/accessToken";

            try {
                const { code } = req.query; // Ensure the `code` is passed as a query parameter
                if (!code) {
                    return res
                        .status(400)
                        .send({ error: "Missing authorization code" });
                }

                const clientId = runtime.getSetting("LINKEDIN_CLIENT_ID");
                const clientSecret = runtime.getSetting(
                    "LINKEDIN_CLIENT_SECRET"
                );

                const response = await axios.post(tokenUrl, null, {
                    params: {
                        grant_type: "authorization_code",
                        code: code,
                        redirect_uri: `http://localhost:${port}/auth/update-access-token`,
                        client_id: clientId,
                        client_secret: clientSecret,
                    },
                });

                const data = response.data;

                res.send(data);

                elizaLogger.log(
                    `Access token updated: ${JSON.stringify(data)}`
                );

                newLinkedInAccessToken = data;

                app.emit("linkedin-plugin_access_close-on-token-updated");
            } catch (error) {
                elizaLogger.error(
                    "Error updating access token:",
                    error.message
                );
                res.status(500).send({
                    error: "Failed to update access token",
                });
            }
        });

        const server = app.listen(port, () => {
            elizaLogger.log(
                `LinkedIn token updater server is running at http://localhost:${port}`
            );
        });

        app.on("linkedin-plugin_access_close-on-token-updated", async (app) => {
            elizaLogger.log("app: ", app);
            elizaLogger.log(`LinkedIn token updater server is shutting down`);
            server.close(() => {
                resolve(newLinkedInAccessToken);
            });
        });

        server.on("error", (err) => {
            reject(err);
        });
    });
};

const prepareLinkedInAccessTokenFromSession = async (
    runtime: IAgentRuntime,
    message: Memory
) => {
    elizaLogger.log("Current session token: ", sessionTokens);
    const roomId = message.roomId;

    if (
        !sessionTokens[roomId] ||
        (sessionTokens[roomId]?.expires_in &&
            Date.now() + sessionTokens[roomId].expires_in <= Date.now())
    ) {
        elizaLogger.log("________");
        elizaLogger.log("Create new access token");
        elizaLogger.log("________");
        const newToken = await startServerToRetrieveNewAccessToken(
            runtime,
            message
        );
        elizaLogger.log("New token: ", newToken);

        sessionTokens[roomId] = newToken;
    }

    elizaLogger.log("sessionTokens:", sessionTokens);
    elizaLogger.log("sessionTokens[roomId]:", sessionTokens[roomId]);

    return sessionTokens[roomId];
};

export const linkedInAccountProvider: Provider = {
    async get(
        runtime: IAgentRuntime,
        message: Memory,
        _state?: State
    ): Promise<string | null> {
        try {
            const sessionAccessToken =
                await prepareLinkedInAccessTokenFromSession(runtime, message);

            if (sessionAccessToken) {
                return linkedInAccessTokenToMemoryMessage(sessionAccessToken);
            }

            return "Could not get LinkedIn access token";
        } catch (error) {
            console.error("Error in LinkedIn provider:", error);
            return null;
        }
    },
};

const sendUrlAction: Action = {
    name: "SEND_URL",
    description: "Sends a predefined URL to the chat.",
    similes: ["send url", "send link"],
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        // This action can be triggered based on specific conditions.
        // For simplicity, we'll allow it to be triggered always.
        return true;
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state,
        options,
        callback
    ) => {
        const showUrlContext = composeContext({
            state,
            template: `Given the recent messages and url to display below:
{{recentMessages}}
{{urlInfo}}

Extract the following information about the url to display:
1. **URL**:
   - Extract only url to display. Mostly common starting with "https://" or "http://".

Respond with a JSON markdown block containing only the extracted values.
\`\`\`json
{
    "url": string // The symbol of token.
}
\`\`\`

Example reponse for the input: "Show url https://test.com", the response should be:
\`\`\`json
{
    "url": "https://test.com"
}
\`\`\`
Example response for the input "Please visit the following URL: http://localhost:5173/auth (DISPLAY THIS IN CHAT FOR USER)", the response should be:
\`\`\`json
{
    "url": "http://localhost:5173/auth"
}
\`\`\`

Now respond with a JSON markdown block containing only the extracted values.`,
            templatingEngine: "handlebars",
        });

        elizaLogger.log("message:", message);
        elizaLogger.log("state:", state);
        elizaLogger.log("options:", options ?? "No options");
        elizaLogger.log("callback:", callback ?? "No callback");
        elizaLogger.log("showUrlContext: ", showUrlContext);

        const showUrlContent = (await generateObjectDeprecated({
            runtime,
            context: showUrlContext,
            modelClass: ModelClass.SMALL,
        })) as { url: string };

        elizaLogger.log("showUrlContent: ", showUrlContent);

        const newMemory: Memory = {
            userId: message.agentId,
            agentId: message.agentId,
            roomId: message.roomId,
            content: {
                text: `Please visit the following URL: ${showUrlContent.url} (DISPLAY THIS IN CHAT FOR USER)`,
            },
        };

        await runtime.messageManager.createMemory(newMemory);

        return true;
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: { text: "Show this url {url}" },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Please visit the following URL: [LinkedIn]({url})",
                    action: "SEND_URL",
                },
            },
        ],
    ],
};

export const linkedInPlugin: Plugin = {
    name: "linkedin",
    description: "LinkedIn Plugin",
    providers: [linkedInAccountProvider],
    evaluators: [],
    services: [],
    actions: [sendUrlAction],
};

export default linkedInPlugin;
