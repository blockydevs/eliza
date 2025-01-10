import { cosmos } from "interchain";
import type { Coin } from "@cosmjs/proto-signing";

export const balanceFetcher = async (rpcEndpoint: string, address: string) => {
    const client = await cosmos.ClientFactory.createRPCQueryClient({
        rpcEndpoint,
    });

    const allBalances = await client.cosmos.bank.v1beta1.allBalances({
        address,
    });

    return allBalances.balances as Coin[];
};
