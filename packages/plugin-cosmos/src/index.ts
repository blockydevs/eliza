import { createTransferAction } from "./actions/transfer";
import type { Plugin } from "@elizaos/core";
import { createCosmosWalletProvider } from "./providers/wallet";
import { ICosmosPluginOptions } from "./shared/interfaces";
import { fetchBalancesAction } from "./actions/fetch-balance";

export const createCosmosPlugin = (
    pluginOptions?: ICosmosPluginOptions
): Plugin => ({
    name: "cosmos",
    description: "Cosmos blockchain integration plugin",
    providers: [createCosmosWalletProvider(pluginOptions)],
    evaluators: [],
    services: [],
    actions: [
        createTransferAction(pluginOptions),
        fetchBalancesAction(pluginOptions),
    ],
});

export default createCosmosPlugin;
