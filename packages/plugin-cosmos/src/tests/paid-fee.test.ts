import { describe, it, expect } from "vitest";
import type {
    DeliverTxResponse,
    ExecuteResult,
} from "@cosmjs/cosmwasm-stargate";
import { getPaidFeeFromReceipt } from "../shared/helpers/cosmos-transaction-receipt";

describe("PaidFee", () => {
    describe("getPaidFeeFromReceipt", () => {
        it("should return the correct fee from a matching event", () => {
            const receipt: ExecuteResult = {
                logs: [],
                transactionHash: "",
                events: [
                    {
                        type: "fee_pay",
                        attributes: [
                            { key: "fee", value: "100uatom" },
                            { key: "other_key", value: "200" },
                        ],
                    },
                    {
                        type: "tip_refund",
                        attributes: [{ key: "tip", value: "50uatom" }],
                    },
                ],
                height: 0,
                gasUsed: BigInt(0),
                gasWanted: BigInt(0),
            };

            const result = getPaidFeeFromReceipt(receipt);

            expect(result).toBe(150);
        });

        it("should return 0 if no matching events are present", () => {
            const receipt: DeliverTxResponse = {
                height: 0,
                transactionHash: "",
                gasUsed: BigInt(0),
                gasWanted: BigInt(0),
                code: 0,
                events: [
                    {
                        type: "unrelated_event",
                        attributes: [{ key: "some_key", value: "123" }],
                    },
                ],
                rawLog: "",
                msgResponses: [],
                txIndex: 0,
            };

            const result = getPaidFeeFromReceipt(receipt);

            expect(result).toBe(0);
        });

        it("should ignore invalid number values", () => {
            const receipt: ExecuteResult = {
                logs: [],
                transactionHash: "",
                events: [
                    {
                        type: "fee_pay",
                        attributes: [
                            { key: "fee", value: "invalid_value" },
                            { key: "fee", value: "200uatom" },
                        ],
                    },
                ],
                height: 0,
                gasUsed: BigInt(0),
                gasWanted: BigInt(0),
            };

            const result = getPaidFeeFromReceipt(receipt);

            expect(result).toBe(200);
        });

        it("should handle an empty receipt gracefully", () => {
            const receipt: DeliverTxResponse = {
                height: 0,
                transactionHash: "",
                gasUsed: BigInt(0),
                gasWanted: BigInt(0),
                code: 0,
                events: [],
                rawLog: "",
                msgResponses: [],
                txIndex: 0,
            };

            const result = getPaidFeeFromReceipt(receipt);

            expect(result).toBe(0);
        });

        it("should return correct value if fee comes from tx event", () => {
            const receipt: DeliverTxResponse = {
                "code": 0,
                "height": 17704098,
                "txIndex": 0,
                "rawLog": "",
                "transactionHash": "504E62EBD4D12D9AAD6328521AD6EAAF8EBF13867DD2C5DC917B4EFA215537D9",
                "events": [
                  {
                    "type": "coin_spent",
                    "attributes": [
                      {
                        "key": "spender",
                        "value": "osmo1f0y9ajzslq24qja455l7eq7fq3hv9c85erxcvj"
                      },
                      {
                        "key": "amount",
                        "value": "102684uosmo"
                      }
                    ]
                  },
                  {
                    "type": "coin_received",
                    "attributes": [
                      {
                        "key": "receiver",
                        "value": "osmo17xpfvakm2amg962yls6f84z3kell8c5lczssa0"
                      },
                      {
                        "key": "amount",
                        "value": "102684uosmo"
                      }
                    ]
                  },
                  {
                    "type": "transfer",
                    "attributes": [
                      {
                        "key": "recipient",
                        "value": "osmo17xpfvakm2amg962yls6f84z3kell8c5lczssa0"
                      },
                      {
                        "key": "sender",
                        "value": "osmo1f0y9ajzslq24qja455l7eq7fq3hv9c85erxcvj"
                      },
                      {
                        "key": "amount",
                        "value": "102684uosmo"
                      }
                    ]
                  },
                  {
                    "type": "message",
                    "attributes": [
                      {
                        "key": "sender",
                        "value": "osmo1f0y9ajzslq24qja455l7eq7fq3hv9c85erxcvj"
                      }
                    ]
                  },
                  {
                    "type": "tx",
                    "attributes": [
                      {
                        "key": "fee",
                        "value": "102684uosmo"
                      }
                    ]
                  },
                  {
                    "type": "tx",
                    "attributes": [
                      {
                        "key": "acc_seq",
                        "value": "osmo1f0y9ajzslq24qja455l7eq7fq3hv9c85erxcvj/13"
                      }
                    ]
                  },
                  {
                    "type": "tx",
                    "attributes": [
                      {
                        "key": "signature",
                        "value": "jqpi+2pDWPQ/fK6wEqUlwGSp+LRsOVJsdldPdE58j45yQf2Sb/7PzE2WX3ChlmYqHg+2PcTy4MPJlyovU0GzTw=="
                      }
                    ]
                  },
                  {
                    "type": "message",
                    "attributes": [
                      {
                        "key": "action",
                        "value": "/cosmos.bank.v1beta1.MsgSend"
                      },
                      {
                        "key": "sender",
                        "value": "osmo1f0y9ajzslq24qja455l7eq7fq3hv9c85erxcvj"
                      },
                      {
                        "key": "module",
                        "value": "bank"
                      },
                      {
                        "key": "msg_index",
                        "value": "0"
                      }
                    ]
                  },
                  {
                    "type": "coin_spent",
                    "attributes": [
                      {
                        "key": "spender",
                        "value": "osmo1f0y9ajzslq24qja455l7eq7fq3hv9c85erxcvj"
                      },
                      {
                        "key": "amount",
                        "value": "10uosmo"
                      },
                      {
                        "key": "msg_index",
                        "value": "0"
                      }
                    ]
                  },
                  {
                    "type": "coin_received",
                    "attributes": [
                      {
                        "key": "receiver",
                        "value": "osmo1sgscpnehrvgwm8ekgwk47ru2wvz7agfs50v692"
                      },
                      {
                        "key": "amount",
                        "value": "10uosmo"
                      },
                      {
                        "key": "msg_index",
                        "value": "0"
                      }
                    ]
                  },
                  {
                    "type": "transfer",
                    "attributes": [
                      {
                        "key": "recipient",
                        "value": "osmo1sgscpnehrvgwm8ekgwk47ru2wvz7agfs50v692"
                      },
                      {
                        "key": "sender",
                        "value": "osmo1f0y9ajzslq24qja455l7eq7fq3hv9c85erxcvj"
                      },
                      {
                        "key": "amount",
                        "value": "10uosmo"
                      },
                      {
                        "key": "msg_index",
                        "value": "0"
                      }
                    ]
                  },
                  {
                    "type": "message",
                    "attributes": [
                      {
                        "key": "sender",
                        "value": "osmo1f0y9ajzslq24qja455l7eq7fq3hv9c85erxcvj"
                      },
                      {
                        "key": "msg_index",
                        "value": "0"
                      }
                    ]
                  }
                ],
                "msgResponses": [
                  {
                    "typeUrl": "/cosmos.bank.v1beta1.MsgSendResponse",
                    "value": {}
                  }
                ],
                "gasUsed": "89775",
                "gasWanted": "102684"
              };

            const result = getPaidFeeFromReceipt(receipt);

            expect(result).toBe(102684);
        });
    });
});
