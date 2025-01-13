import {
    composeContext,
    generateObjectDeprecated,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    ModelClass,
    State,
} from "@elizaos/core";

import { initWalletChainsData } from "../../providers/wallet/utils";
import { cosmosIBCSwapTemplate, cosmosTransferTemplate } from "../../templates";
import type {
    ICosmosPluginOptions,
    ICosmosWalletChains,
} from "../../shared/interfaces";
import { IBCSwapActionParams } from "./types.ts";
import { IBCSwapAction } from "./services/ibc-swap-action-service.ts";
import { prepareAmbiguityErrorMessage } from "./services/ibc-swap-utils.ts";

export const createIBCSwapAction = (pluginOptions: ICosmosPluginOptions) => ({
    name: "COSMOS_IBC_SWAP",
    description: "Swaps tokens on cosmos chains",
    handler: async (
        _runtime: IAgentRuntime,
        _message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        _callback?: HandlerCallback
    ) => {
        const cosmosIBCTransferContext = composeContext({
            state: state,
            template: cosmosIBCSwapTemplate,
            templatingEngine: "handlebars",
        });

        const cosmosIBCSwapContent = await generateObjectDeprecated({
            runtime: _runtime,
            context: cosmosIBCTransferContext,
            modelClass: ModelClass.SMALL,
        });

        const paramOptions: IBCSwapActionParams = {
            fromChainName: cosmosIBCSwapContent.fromChainName,
            fromTokenSymbol: cosmosIBCSwapContent.fromTokenSymbol,
            fromTokenAmount: cosmosIBCSwapContent.fromTokenAmount,
            toTokenSymbol: cosmosIBCSwapContent.toTokenSymbol,
            toChainName: cosmosIBCSwapContent.toChainName,
            toTokenDenom: cosmosIBCSwapContent?.toTokenDenom || undefined,
            fromTokenDenom: cosmosIBCSwapContent?.fromTokenDenom || undefined,
        };

        console.log(
            "Parameters extracted from user prompt: ",
            JSON.stringify(paramOptions, null, 2)
        );

        try {
            const walletProvider: ICosmosWalletChains =
                await initWalletChainsData(_runtime);

            const action = new IBCSwapAction(walletProvider);

            const customAssets = (pluginOptions?.customChainData ?? []).map(
                (chainData) => chainData.assets
            );

            const transferResp = await action.execute(
                paramOptions,
                customAssets,
                _callback
            );

            if (_callback) {
                const text =
                    transferResp.status === "STATE_COMPLETED_SUCCESS"
                        ? `Successfully swapped ${transferResp.fromTokenAmount} ${transferResp.fromTokenSymbol} tokens to ${transferResp.toTokenSymbol} on chain ${transferResp.toChainName}.\nTransaction Hash: ${transferResp.txHash}`
                        : `Error occured swapping ${transferResp.fromTokenAmount} ${transferResp.fromTokenSymbol} tokens to ${transferResp.toTokenSymbol} on chain ${transferResp.toChainName}.\nTransaction Hash: ${transferResp.txHash}, try again`;
                await _callback({
                    text: text,
                    content: {
                        success:
                            transferResp.status === "STATE_COMPLETED_SUCCESS",
                        hash: transferResp.txHash,
                        fromTokenAmount: paramOptions.fromTokenAmount,
                        fromToken: paramOptions.fromTokenSymbol,
                        toToken: paramOptions.toTokenSymbol,
                        fromChain: paramOptions.fromChainName,
                        toChain: paramOptions.toChainName,
                    },
                });
            }
            return true;
        } catch (error) {
            console.error("Error during ibc token transfer:", error);

            const regex =
                /Ambiguity Error.*value:([^\s.]+)\s+chainName:([^\s.]+)/;
            const match = error.message.match(regex);

            if (match) {
                const value = match[1];
                const chainName = match[2];

                if (_callback) {
                    await _callback({
                        text: prepareAmbiguityErrorMessage(value, chainName),
                        content: { error: error.message },
                    });
                }
            } else {
                console.error("Unhandled error:", error);

                if (_callback) {
                    await _callback({
                        text: `Error ibc transferring tokens: ${error.message}`,
                        content: { error: error.message },
                    });
                }
            }
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
                    text: "Swap {{0.0001 ATOM}} from {{cosmoshub}} to {{OM}} on {{mantrachain1}}",
                    action: "COSMOS_IBC_SWAP",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Do you confirm the swap?",
                    action: "COSMOS_IBC_SWAP",
                },
            },
            {
                user: "{{user1}}",
                content: {
                    text: "Yes",
                    action: "COSMOS_IBC_SWAP",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Starting swap transaction. Keep in mind that it might take couple of minutes",
                    action: "COSMOS_IBC_SWAP",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Swap {{0.0001 OM}} from {{mantrachain}} to {{OSMO}} on {{osmosis}}",
                    action: "COSMOS_IBC_SWAP",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Do you confirm the swap?",
                    action: "COSMOS_IBC_SWAP",
                },
            },
            {
                user: "{{user1}}",
                content: {
                    text: "Yes",
                    action: "COSMOS_IBC_SWAP",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Starting swap transaction. Keep in mind that it might take couple of minutes",
                    action: "COSMOS_IBC_SWAP",
                },
            },
        ],
    ],
    similes: ["COSMOS_SWAP", "COSMOS_SWAP_IBC"],
});
