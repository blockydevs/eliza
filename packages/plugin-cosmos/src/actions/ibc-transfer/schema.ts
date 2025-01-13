import { z } from "zod";

export const IBCTransferParamsSchema = z.object({
    chainName: z.string(),
    symbol: z.string(),
    amount: z.string(),
    toAddress: z.string(),
    targetChainName: z.string(),
});
