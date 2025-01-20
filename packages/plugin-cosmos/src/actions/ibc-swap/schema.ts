import {z} from "zod";

export const IBCSwapParamsSchema = z.object({
    fromChainName: z.string(),
    fromTokenSymbol: z.string(),
    fromTokenAmount: z.string(),
    toTokenSymbol: z.string(),
    toChainName: z.string(),
    toTokenDenom: z.string(),
    fromTokenDenom: z.string(),
});
