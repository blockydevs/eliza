import { getChainByChainName } from "@chain-registry/utils";
import type {
    ICosmosActionService,
    ICosmosPluginCustomChainData,
    ICosmosWalletChains,
} from "../../../shared/interfaces.ts";
import { assets, chains } from "chain-registry";
import { balanceFetcher } from "../../../shared/services/balance-fetcher.ts";
import { Coin } from "@cosmjs/proto-signing";

export class FetchBalancesActionService implements ICosmosActionService {
    constructor(private cosmosWalletChains: ICosmosWalletChains) {
        this.cosmosWalletChains = cosmosWalletChains;
    }

    async execute(
        customChains?: ICosmosPluginCustomChainData[]
    ): Promise<{ chainName: string; balances: Coin[] }[]> {
        const chainRegisteryChainsWithCustomChains = [...chains];
        const chainRegisteryAssetsWithCustomAssets = [...assets];

        if (customChains) {
            chainRegisteryChainsWithCustomChains.push(
                ...customChains.map(({ chainData }) => chainData)
            );
            chainRegisteryAssetsWithCustomAssets.push(
                ...customChains.map(({ assets }) => assets)
            );
        }

        const chainsDetails = Object.keys(
            this.cosmosWalletChains.walletChainsData
        )
            .map((chainName) => getChainByChainName(chains, chainName))
            .filter(Boolean);

        return Promise.all(
            chainsDetails.map(async (chainDetails) => {
                const addressForGivenChain =
                    await this.cosmosWalletChains.getWalletAddress(
                        chainDetails.chain_name
                    );

                const balanceForGivenChain = await balanceFetcher(
                    chainDetails.apis.rpc[0].address,
                    addressForGivenChain
                );

                return {
                    chainName: chainDetails.chain_name,
                    balances: balanceForGivenChain,
                };
            })
        );
    }
}
