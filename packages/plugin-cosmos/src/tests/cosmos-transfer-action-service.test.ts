import { describe, it, expect, vi, beforeEach } from "vitest";
import { CosmosTransferActionService } from "../actions/transfer/services/cosmos-transfer-action-service.ts";
import { AssetList } from "@chain-registry/types";
import { getAssetBySymbol } from "@chain-registry/utils";

vi.mock("@cosmjs/cosmwasm-stargate", () => ({
    SigningCosmWasmClient: {
        connectWithSigner: vi.fn(),
    },
}));

vi.mock("@chain-registry/utils", () => ({
    getAssetBySymbol: vi.fn().mockImplementation(() => ({
        base: "uom",
        symbol: "OM",
    })),
    convertDisplayUnitToBaseUnit: vi.fn().mockResolvedValue("OM"),
}));

vi.mock("../shared/services/cosmos-transaction-fee-estimator.ts", () => ({
    CosmosTransactionFeeEstimator: {
        estimateGasForCoinTransfer: vi.fn().mockResolvedValue(1000),
    },
}));

vi.mock("../shared/helpers/cosmos-transaction-receipt.ts", () => ({
    getPaidFeeFromReceipt: vi.fn().mockReturnValue(1000),
}));

vi.mock("../../../shared/helpers/cosmos-assets.ts", () => ({
    getAvailableAssets: vi.fn().mockResolvedValue([] as unknown as AssetList[]),
}));

describe("CosmosTransferActionService", () => {
    describe("Execute", () => {
        const mockSigningCosmWasmClient = {
            sendTokens: vi.fn().mockResolvedValue({
                transactionHash: "mockTxHash",
            }),
        };

        const mockCosmosWalletChains = {
            walletChainsData: {},
            getWalletAddress: vi.fn().mockReturnValue("senderAddress"),
            getSigningCosmWasmClient: vi
                .fn()
                .mockReturnValue(mockSigningCosmWasmClient),
        };

        beforeEach(() => {
            vi.clearAllMocks();
        });

        it("should handle transfer successfully without custom chain assets passed", async () => {
            const mockCosmosTransferParams = {
                chainName: "test",
                symbol: "ts",
                amount: "1234",
                toAddress: "receiverAddress",
            };

            const cosmosTransferActionService = new CosmosTransferActionService(
                mockCosmosWalletChains
            );

            vi.mocked(getAssetBySymbol).mockReturnValue({
                base: "uom",
                symbol: "OM",
            });

            const expectedResult = {
                from: "senderAddress",
                to: "receiverAddress",
                gasPaid: "1000 uom",
                txHash: "mockTxHash",
            };

            await expect(
                cosmosTransferActionService.execute(mockCosmosTransferParams)
            ).resolves.toEqual(expectedResult);
        });

        it("should handle transfer successfully with custom chain assets passed", async () => {
            const mockCosmosTransferParams = {
                chainName: "test",
                symbol: "ts",
                amount: "1234",
                toAddress: "receiverAddress",
            };

            const mockCustomChainAssets = [
                {
                    chain_name: "test",
                    assets: [
                        {
                            denom_units: [{ denom: "uom", exponent: 0 }],
                            base: "uom",
                            symbol: "OM",
                            display: "om",
                            type_asset: "native",
                            name: "Test Asset",
                        },
                    ],
                },
            ];

            const cosmosTransferActionService = new CosmosTransferActionService(
                mockCosmosWalletChains
            );

            vi.mocked(getAssetBySymbol).mockReturnValue({
                base: "uom",
                symbol: "OM",
            });

            const expectedResult = {
                from: "senderAddress",
                to: "receiverAddress",
                gasPaid: "1000 uom",
                txHash: "mockTxHash",
            };

            await expect(
                cosmosTransferActionService.execute(
                    mockCosmosTransferParams,
                    mockCustomChainAssets as AssetList[]
                )
            ).resolves.toEqual(expectedResult);
        });

        it("should throw an error if no receiver address is provided", async () => {
            const mockCosmosTransferParams = {
                chainName: "test",
                symbol: "ts",
                amount: "1234",
            };

            const cosmosTransferActionService = new CosmosTransferActionService(
                mockCosmosWalletChains
            );

            await expect(
                cosmosTransferActionService.execute(mockCosmosTransferParams)
            ).rejects.toThrow("No receiver address");
        });

        it("should throw an error if no symbol is provided", async () => {
            const mockCosmosTransferParams = {
                chainName: "test",
                amount: "1234",
                toAddress: "address",
            };

            const cosmosTransferActionService = new CosmosTransferActionService(
                mockCosmosWalletChains
            );

            await expect(
                cosmosTransferActionService.execute(mockCosmosTransferParams)
            ).rejects.toThrow("No symbol");
        });

        it("should throw an error if transfer fails", async () => {
            const mockCosmosTransferParams = {
                chainName: "test",
                symbol: "ts",
                amount: "1234",
                toAddress: "receiverAddress",
            };

            mockSigningCosmWasmClient.sendTokens.mockImplementation(() => {
                throw new Error("Transaction Failed");
            });

            const cosmosTransferActionService = new CosmosTransferActionService(
                mockCosmosWalletChains
            );

            await expect(
                cosmosTransferActionService.execute(mockCosmosTransferParams)
            ).rejects.toThrow("Transaction Failed");
        });

        it("should throw an error invalid chain name is provided", async () => {
            const mockCosmosTransferParams = {
                chainName: "test",
                symbol: "ts",
                amount: "1234",
                toAddress: "address",
            };

            mockCosmosWalletChains.getWalletAddress.mockResolvedValue(null);

            const cosmosTransferActionService = new CosmosTransferActionService(
                mockCosmosWalletChains
            );

            await expect(
                cosmosTransferActionService.execute(mockCosmosTransferParams)
            ).rejects.toThrow("Cannot get wallet address for chain");
        });
    });
});
