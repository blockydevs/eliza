import { HandlerCallback, IAgentRuntime, Memory, State } from "@elizaos/core";
import { initWalletChainsData } from "../../providers/wallet/utils";
import { cosmosTransferTemplate } from "../../templates";
import type {
    ICosmosPluginOptions,
    ICosmosWalletChains,
} from "../../shared/interfaces";
import { FetchBalancesActionService } from "./services/fetch-balance";

export const fetchBalancesAction = (pluginOptions: ICosmosPluginOptions) => ({
    name: "FETCH_BALANCES",
    description: "Fetch balances for all connected chains",
    handler: async (
        _runtime: IAgentRuntime,
        _message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        _callback?: HandlerCallback
    ) => {
        try {
            const walletProvider: ICosmosWalletChains =
                await initWalletChainsData(_runtime);

            const action = new FetchBalancesActionService(walletProvider);

            const transferResp = await action.execute(
                pluginOptions?.customChainData
            );

            console.log(transferResp);

            if (_callback) {
                await _callback({
                    text: `Successfully fetched balances`,
                    content: {
                        success: true,
                    },
                });

                const newMemory: Memory = {
                    userId: _message.agentId,
                    agentId: _message.agentId,
                    roomId: _message.roomId,
                    content: {
                        text: `Successfully fetched balances`,
                    },
                };

                await _runtime.messageManager.createMemory(newMemory);
            }
            return true;
        } catch (error) {
            console.error("Error during token transfer:", error);

            if (_callback) {
                await _callback({
                    text: `Error while fetching balance: ${error.message}`,
                    content: { error: error.message },
                });
            }

            const newMemory: Memory = {
                userId: _message.agentId,
                agentId: _message.agentId,
                roomId: _message.roomId,
                content: {
                    text: `Balance fetch failed`,
                },
            };

            await _runtime.messageManager.createMemory(newMemory);

            return false;
        }
    },
    template: cosmosTransferTemplate,
    validate: async (runtime: IAgentRuntime) => {
        const mnemonic = runtime.getSetting("COSMOS_RECOVERY_PHRASE");
        const availableChains = runtime.getSetting("COSMOS_AVAILABLE_CHAINS");
        const availableChainsArray = availableChains?.split(",");

        return !(mnemonic && availableChains && availableChainsArray.length);
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Fetch balances",
                    action: "FETCH_BALANCES",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Do you confirm the transfer action?",
                    action: "FETCH_BALANCES",
                },
            },
            {
                user: "{{user1}}",
                content: {
                    text: "Yes",
                    action: "FETCH_BALANCES",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "",
                    action: "FETCH_BALANCES",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Display my wallet balances",
                    action: "FETCH_BALANCES",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Do you confirm the transfer action?",
                    action: "FETCH_BALANCES",
                },
            },
            {
                user: "{{user1}}",
                content: {
                    text: "Yes",
                    action: "FETCH_BALANCES",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "",
                    action: "FETCH_BALANCES",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Show me my wallet balances",
                    action: "FETCH_BALANCES",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Do you confirm the transfer action?",
                    action: "FETCH_BALANCES",
                },
            },
            {
                user: "{{user1}}",
                content: {
                    text: "Yes",
                    action: "FETCH_BALANCES",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "",
                    action: "FETCH_BALANCES",
                },
            },
        ],
    ],
    similes: [
        "COSMOS_FETCH_ACCOUNT_BALANCE",
        "COSMOS_GET_BALANCE",
        "COSMOS_GET_WALLET_BALANCE",
    ],
});
