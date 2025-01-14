import type { Plugin } from "@elizaos/core";
import { createTransferAction } from "./actions/transfer";
import { createCosmosWalletProvider } from "./providers/wallet";
import { ICosmosPluginOptions } from "./shared/interfaces";
import {createIBCSwapAction} from "./actions/ibc-swap";

export const createCosmosPlugin = (
    pluginOptions?: ICosmosPluginOptions
): Plugin => ({
    name: "cosmos",
    description: "Cosmos blockchain integration plugin",
    providers: [createCosmosWalletProvider(pluginOptions)],
    evaluators: [],
    services: [],
    actions: [createTransferAction(pluginOptions), createIBCSwapAction(pluginOptions)],
});

export default createCosmosPlugin;
