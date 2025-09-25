import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const morpherOracleAbi = [
	{
	  "type": "function",
	  "name": "_CANCEL_ORDER_TYPEHASH",
	  "inputs": [],
	  "outputs": [{ "name": "", "type": "bytes32", "internalType": "bytes32" }],
	  "stateMutability": "view"
	},
	{
	  "type": "function",
	  "name": "_PERMIT_TYPEHASH",
	  "inputs": [],
	  "outputs": [{ "name": "", "type": "bytes32", "internalType": "bytes32" }],
	  "stateMutability": "view"
	},
	{
	  "type": "function",
	  "name": "__callback",
	  "inputs": [
		{ "name": "_orderId", "type": "bytes32", "internalType": "bytes32" },
		{ "name": "_price", "type": "uint256", "internalType": "uint256" },
		{
		  "name": "_unadjustedMarketPrice",
		  "type": "uint256",
		  "internalType": "uint256"
		},
		{ "name": "_spread", "type": "uint256", "internalType": "uint256" },
		{
		  "name": "_liquidationTimestamp",
		  "type": "uint256",
		  "internalType": "uint256"
		},
		{ "name": "_timeStamp", "type": "uint256", "internalType": "uint256" },
		{
		  "name": "_gasForNextCallback",
		  "type": "uint256",
		  "internalType": "uint256"
		}
	  ],
	  "outputs": [
		{
		  "name": "createdPosition",
		  "type": "tuple",
		  "internalType": "struct MorpherTradeEngine.position",
		  "components": [
			{
			  "name": "lastUpdated",
			  "type": "uint256",
			  "internalType": "uint256"
			},
			{
			  "name": "longShares",
			  "type": "uint256",
			  "internalType": "uint256"
			},
			{
			  "name": "shortShares",
			  "type": "uint256",
			  "internalType": "uint256"
			},
			{
			  "name": "meanEntryPrice",
			  "type": "uint256",
			  "internalType": "uint256"
			},
			{
			  "name": "meanEntrySpread",
			  "type": "uint256",
			  "internalType": "uint256"
			},
			{
			  "name": "meanEntryLeverage",
			  "type": "uint256",
			  "internalType": "uint256"
			},
			{
			  "name": "liquidationPrice",
			  "type": "uint256",
			  "internalType": "uint256"
			},
			{
			  "name": "positionHash",
			  "type": "bytes32",
			  "internalType": "bytes32"
			}
		  ]
		}
	  ],
	  "stateMutability": "nonpayable"
	},
	{
	  "type": "function",
	  "name": "adminLiquidationOrder",
	  "inputs": [
		{ "name": "_address", "type": "address", "internalType": "address" },
		{ "name": "_marketId", "type": "bytes32", "internalType": "bytes32" }
	  ],
	  "outputs": [
		{ "name": "_orderId", "type": "bytes32", "internalType": "bytes32" }
	  ],
	  "stateMutability": "nonpayable"
	},
	{
	  "type": "function",
	  "name": "callBackAddress",
	  "inputs": [{ "name": "", "type": "address", "internalType": "address" }],
	  "outputs": [{ "name": "", "type": "bool", "internalType": "bool" }],
	  "stateMutability": "view"
	},
	{
	  "type": "function",
	  "name": "callBackCollectionAddress",
	  "inputs": [],
	  "outputs": [
		{ "name": "", "type": "address", "internalType": "address payable" }
	  ],
	  "stateMutability": "view"
	},
	{
	  "type": "function",
	  "name": "cancelOrder",
	  "inputs": [
		{ "name": "_orderId", "type": "bytes32", "internalType": "bytes32" }
	  ],
	  "outputs": [],
	  "stateMutability": "nonpayable"
	},
	{
	  "type": "function",
	  "name": "checkOrderConditions",
	  "inputs": [
		{ "name": "_orderId", "type": "bytes32", "internalType": "bytes32" },
		{ "name": "_price", "type": "uint256", "internalType": "uint256" }
	  ],
	  "outputs": [
		{ "name": "_conditionsMet", "type": "bool", "internalType": "bool" }
	  ],
	  "stateMutability": "view"
	},
	{
	  "type": "function",
	  "name": "createLiquidationOrder",
	  "inputs": [
		{ "name": "_address", "type": "address", "internalType": "address" },
		{ "name": "_marketId", "type": "bytes32", "internalType": "bytes32" }
	  ],
	  "outputs": [
		{ "name": "_orderId", "type": "bytes32", "internalType": "bytes32" }
	  ],
	  "stateMutability": "payable"
	},
	{
	  "type": "function",
	  "name": "createOrder",
	  "inputs": [
		{
		  "name": "createOrderParams",
		  "type": "tuple",
		  "internalType": "struct MorpherOracle.CreateOrderStruct",
		  "components": [
			{
			  "name": "_marketId",
			  "type": "bytes32",
			  "internalType": "bytes32"
			},
			{
			  "name": "_closeSharesAmount",
			  "type": "uint256",
			  "internalType": "uint256"
			},
			{
			  "name": "_openMPHTokenAmount",
			  "type": "uint256",
			  "internalType": "uint256"
			},
			{
			  "name": "_tradeDirection",
			  "type": "bool",
			  "internalType": "bool"
			},
			{
			  "name": "_orderLeverage",
			  "type": "uint256",
			  "internalType": "uint256"
			},
			{
			  "name": "_onlyIfPriceAbove",
			  "type": "uint256",
			  "internalType": "uint256"
			},
			{
			  "name": "_onlyIfPriceBelow",
			  "type": "uint256",
			  "internalType": "uint256"
			},
			{
			  "name": "_goodUntil",
			  "type": "uint256",
			  "internalType": "uint256"
			},
			{
			  "name": "_goodFrom",
			  "type": "uint256",
			  "internalType": "uint256"
			}
		  ]
		}
	  ],
	  "outputs": [
		{ "name": "_orderId", "type": "bytes32", "internalType": "bytes32" }
	  ],
	  "stateMutability": "payable"
	},
	{
	  "type": "function",
	  "name": "createOrder",
	  "inputs": [
		{ "name": "_marketId", "type": "bytes32", "internalType": "bytes32" },
		{
		  "name": "_closeSharesAmount",
		  "type": "uint256",
		  "internalType": "uint256"
		},
		{
		  "name": "_openMPHTokenAmount",
		  "type": "uint256",
		  "internalType": "uint256"
		},
		{ "name": "_tradeDirection", "type": "bool", "internalType": "bool" },
		{
		  "name": "_orderLeverage",
		  "type": "uint256",
		  "internalType": "uint256"
		},
		{
		  "name": "_onlyIfPriceAbove",
		  "type": "uint256",
		  "internalType": "uint256"
		},
		{
		  "name": "_onlyIfPriceBelow",
		  "type": "uint256",
		  "internalType": "uint256"
		},
		{ "name": "_goodUntil", "type": "uint256", "internalType": "uint256" },
		{ "name": "_goodFrom", "type": "uint256", "internalType": "uint256" }
	  ],
	  "outputs": [
		{ "name": "_orderId", "type": "bytes32", "internalType": "bytes32" }
	  ],
	  "stateMutability": "payable"
	},
	{
	  "type": "function",
	  "name": "createOrderFromGasToken",
	  "inputs": [
		{
		  "name": "createOrderParams",
		  "type": "tuple",
		  "internalType": "struct MorpherOracle.CreateOrderStruct",
		  "components": [
			{
			  "name": "_marketId",
			  "type": "bytes32",
			  "internalType": "bytes32"
			},
			{
			  "name": "_closeSharesAmount",
			  "type": "uint256",
			  "internalType": "uint256"
			},
			{
			  "name": "_openMPHTokenAmount",
			  "type": "uint256",
			  "internalType": "uint256"
			},
			{
			  "name": "_tradeDirection",
			  "type": "bool",
			  "internalType": "bool"
			},
			{
			  "name": "_orderLeverage",
			  "type": "uint256",
			  "internalType": "uint256"
			},
			{
			  "name": "_onlyIfPriceAbove",
			  "type": "uint256",
			  "internalType": "uint256"
			},
			{
			  "name": "_onlyIfPriceBelow",
			  "type": "uint256",
			  "internalType": "uint256"
			},
			{
			  "name": "_goodUntil",
			  "type": "uint256",
			  "internalType": "uint256"
			},
			{
			  "name": "_goodFrom",
			  "type": "uint256",
			  "internalType": "uint256"
			}
		  ]
		}
	  ],
	  "outputs": [
		{ "name": "orderId", "type": "bytes32", "internalType": "bytes32" }
	  ],
	  "stateMutability": "payable"
	},
	{
	  "type": "function",
	  "name": "createOrderFromToken",
	  "inputs": [
		{
		  "name": "createOrderParams",
		  "type": "tuple",
		  "internalType": "struct MorpherOracle.CreateOrderStruct",
		  "components": [
			{
			  "name": "_marketId",
			  "type": "bytes32",
			  "internalType": "bytes32"
			},
			{
			  "name": "_closeSharesAmount",
			  "type": "uint256",
			  "internalType": "uint256"
			},
			{
			  "name": "_openMPHTokenAmount",
			  "type": "uint256",
			  "internalType": "uint256"
			},
			{
			  "name": "_tradeDirection",
			  "type": "bool",
			  "internalType": "bool"
			},
			{
			  "name": "_orderLeverage",
			  "type": "uint256",
			  "internalType": "uint256"
			},
			{
			  "name": "_onlyIfPriceAbove",
			  "type": "uint256",
			  "internalType": "uint256"
			},
			{
			  "name": "_onlyIfPriceBelow",
			  "type": "uint256",
			  "internalType": "uint256"
			},
			{
			  "name": "_goodUntil",
			  "type": "uint256",
			  "internalType": "uint256"
			},
			{
			  "name": "_goodFrom",
			  "type": "uint256",
			  "internalType": "uint256"
			}
		  ]
		},
		{
		  "name": "inputToken",
		  "type": "tuple",
		  "internalType": "struct MorpherOracle.TokenPermitEIP712Struct",
		  "components": [
			{
			  "name": "tokenAddress",
			  "type": "address",
			  "internalType": "address"
			},
			{ "name": "owner", "type": "address", "internalType": "address" },
			{ "name": "value", "type": "uint256", "internalType": "uint256" },
			{
			  "name": "minOutValue",
			  "type": "uint256",
			  "internalType": "uint256"
			},
			{
			  "name": "deadline",
			  "type": "uint256",
			  "internalType": "uint256"
			},
			{ "name": "v", "type": "uint8", "internalType": "uint8" },
			{ "name": "r", "type": "bytes32", "internalType": "bytes32" },
			{ "name": "s", "type": "bytes32", "internalType": "bytes32" }
		  ]
		}
	  ],
	  "outputs": [],
	  "stateMutability": "nonpayable"
	},
	{
	  "type": "function",
	  "name": "createOrderFromToken",
	  "inputs": [
		{
		  "name": "createOrderParams",
		  "type": "tuple",
		  "internalType": "struct MorpherOracle.CreateOrderStruct",
		  "components": [
			{
			  "name": "_marketId",
			  "type": "bytes32",
			  "internalType": "bytes32"
			},
			{
			  "name": "_closeSharesAmount",
			  "type": "uint256",
			  "internalType": "uint256"
			},
			{
			  "name": "_openMPHTokenAmount",
			  "type": "uint256",
			  "internalType": "uint256"
			},
			{
			  "name": "_tradeDirection",
			  "type": "bool",
			  "internalType": "bool"
			},
			{
			  "name": "_orderLeverage",
			  "type": "uint256",
			  "internalType": "uint256"
			},
			{
			  "name": "_onlyIfPriceAbove",
			  "type": "uint256",
			  "internalType": "uint256"
			},
			{
			  "name": "_onlyIfPriceBelow",
			  "type": "uint256",
			  "internalType": "uint256"
			},
			{
			  "name": "_goodUntil",
			  "type": "uint256",
			  "internalType": "uint256"
			},
			{
			  "name": "_goodFrom",
			  "type": "uint256",
			  "internalType": "uint256"
			}
		  ]
		},
		{
		  "name": "inputToken",
		  "type": "tuple",
		  "internalType": "struct MorpherOracle.TokenPermitEIP712Struct",
		  "components": [
			{
			  "name": "tokenAddress",
			  "type": "address",
			  "internalType": "address"
			},
			{ "name": "owner", "type": "address", "internalType": "address" },
			{ "name": "value", "type": "uint256", "internalType": "uint256" },
			{
			  "name": "minOutValue",
			  "type": "uint256",
			  "internalType": "uint256"
			},
			{
			  "name": "deadline",
			  "type": "uint256",
			  "internalType": "uint256"
			},
			{ "name": "v", "type": "uint8", "internalType": "uint8" },
			{ "name": "r", "type": "bytes32", "internalType": "bytes32" },
			{ "name": "s", "type": "bytes32", "internalType": "bytes32" }
		  ]
		},
		{
		  "name": "_addressPositionOwner",
		  "type": "address",
		  "internalType": "address"
		},
		{ "name": "deadline", "type": "uint256", "internalType": "uint256" },
		{ "name": "v", "type": "uint8", "internalType": "uint8" },
		{ "name": "r", "type": "bytes32", "internalType": "bytes32" },
		{ "name": "s", "type": "bytes32", "internalType": "bytes32" }
	  ],
	  "outputs": [],
	  "stateMutability": "nonpayable"
	},
	{
	  "type": "function",
	  "name": "createOrderPermittedBySignature",
	  "inputs": [
		{
		  "name": "createOrderParams",
		  "type": "tuple",
		  "internalType": "struct MorpherOracle.CreateOrderStruct",
		  "components": [
			{
			  "name": "_marketId",
			  "type": "bytes32",
			  "internalType": "bytes32"
			},
			{
			  "name": "_closeSharesAmount",
			  "type": "uint256",
			  "internalType": "uint256"
			},
			{
			  "name": "_openMPHTokenAmount",
			  "type": "uint256",
			  "internalType": "uint256"
			},
			{
			  "name": "_tradeDirection",
			  "type": "bool",
			  "internalType": "bool"
			},
			{
			  "name": "_orderLeverage",
			  "type": "uint256",
			  "internalType": "uint256"
			},
			{
			  "name": "_onlyIfPriceAbove",
			  "type": "uint256",
			  "internalType": "uint256"
			},
			{
			  "name": "_onlyIfPriceBelow",
			  "type": "uint256",
			  "internalType": "uint256"
			},
			{
			  "name": "_goodUntil",
			  "type": "uint256",
			  "internalType": "uint256"
			},
			{
			  "name": "_goodFrom",
			  "type": "uint256",
			  "internalType": "uint256"
			}
		  ]
		},
		{
		  "name": "_addressPositionOwner",
		  "type": "address",
		  "internalType": "address"
		},
		{ "name": "deadline", "type": "uint256", "internalType": "uint256" },
		{ "name": "v", "type": "uint8", "internalType": "uint8" },
		{ "name": "r", "type": "bytes32", "internalType": "bytes32" },
		{ "name": "s", "type": "bytes32", "internalType": "bytes32" }
	  ],
	  "outputs": [
		{ "name": "orderId", "type": "bytes32", "internalType": "bytes32" }
	  ],
	  "stateMutability": "nonpayable"
	},
	{
	  "type": "function",
	  "name": "initiateCancelOrder",
	  "inputs": [
		{ "name": "_orderId", "type": "bytes32", "internalType": "bytes32" }
	  ],
	  "outputs": [],
	  "stateMutability": "nonpayable"
	},
	{
	  "type": "function",
	  "name": "initiateCancelOrderPermitted",
	  "inputs": [
		{ "name": "_orderId", "type": "bytes32", "internalType": "bytes32" },
		{ "name": "_owner", "type": "address", "internalType": "address" },
		{ "name": "deadline", "type": "uint256", "internalType": "uint256" },
		{ "name": "v", "type": "uint8", "internalType": "uint8" },
		{ "name": "r", "type": "bytes32", "internalType": "bytes32" },
		{ "name": "s", "type": "bytes32", "internalType": "bytes32" }
	  ],
	  "outputs": [],
	  "stateMutability": "nonpayable"
	},
	{
	  "type": "function",
	  "name": "nonces",
	  "inputs": [
		{ "name": "owner", "type": "address", "internalType": "address" }
	  ],
	  "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
	  "stateMutability": "view"
	},
	{
	  "type": "function",
	  "name": "orderCancellationRequested",
	  "inputs": [{ "name": "", "type": "bytes32", "internalType": "bytes32" }],
	  "outputs": [{ "name": "", "type": "bool", "internalType": "bool" }],
	  "stateMutability": "view"
	},
	{
	  "type": "function",
	  "name": "setCallbackCollectionAddress",
	  "inputs": [
		{
		  "name": "_address",
		  "type": "address",
		  "internalType": "address payable"
		}
	  ],
	  "outputs": [],
	  "stateMutability": "nonpayable"
	},
	{
	  "type": "function",
	  "name": "setMorpherSwapHelperAddress",
	  "inputs": [
		{
		  "name": "_helperAddress",
		  "type": "address",
		  "internalType": "address"
		}
	  ],
	  "outputs": [],
	  "stateMutability": "nonpayable"
	},
	{
	  "type": "function",
	  "name": "setStateAddress",
	  "inputs": [
		{ "name": "_address", "type": "address", "internalType": "address" }
	  ],
	  "outputs": [],
	  "stateMutability": "nonpayable"
	},
	{
	  "type": "function",
	  "name": "uniswapRouter",
	  "inputs": [],
	  "outputs": [{ "name": "", "type": "address", "internalType": "address" }],
	  "stateMutability": "view"
	},
	{
	  "type": "function",
	  "name": "useWhiteList",
	  "inputs": [],
	  "outputs": [{ "name": "", "type": "bool", "internalType": "bool" }],
	  "stateMutability": "view"
	},
	{
	  "type": "function",
	  "name": "wMaticAddress",
	  "inputs": [],
	  "outputs": [{ "name": "", "type": "address", "internalType": "address" }],
	  "stateMutability": "view"
	},
	{
	  "type": "function",
	  "name": "whiteList",
	  "inputs": [{ "name": "", "type": "address", "internalType": "address" }],
	  "outputs": [{ "name": "", "type": "bool", "internalType": "bool" }],
	  "stateMutability": "view"
	},
	{
	  "type": "event",
	  "name": "AddressBlackListed",
	  "inputs": [
		{
		  "name": "_address",
		  "type": "address",
		  "indexed": false,
		  "internalType": "address"
		}
	  ],
	  "anonymous": false
	},
	{
	  "type": "event",
	  "name": "AddressWhiteListed",
	  "inputs": [
		{
		  "name": "_address",
		  "type": "address",
		  "indexed": false,
		  "internalType": "address"
		}
	  ],
	  "anonymous": false
	},
	{
	  "type": "event",
	  "name": "AdminLiquidationOrderCreated",
	  "inputs": [
		{
		  "name": "_orderId",
		  "type": "bytes32",
		  "indexed": true,
		  "internalType": "bytes32"
		},
		{
		  "name": "_address",
		  "type": "address",
		  "indexed": true,
		  "internalType": "address"
		},
		{
		  "name": "_marketId",
		  "type": "bytes32",
		  "indexed": true,
		  "internalType": "bytes32"
		},
		{
		  "name": "_closeSharesAmount",
		  "type": "uint256",
		  "indexed": false,
		  "internalType": "uint256"
		},
		{
		  "name": "_openMPHTokenAmount",
		  "type": "uint256",
		  "indexed": false,
		  "internalType": "uint256"
		},
		{
		  "name": "_tradeDirection",
		  "type": "bool",
		  "indexed": false,
		  "internalType": "bool"
		},
		{
		  "name": "_orderLeverage",
		  "type": "uint256",
		  "indexed": false,
		  "internalType": "uint256"
		}
	  ],
	  "anonymous": false
	},
	{
	  "type": "event",
	  "name": "AdminOrderCancelled",
	  "inputs": [
		{
		  "name": "_orderId",
		  "type": "bytes32",
		  "indexed": true,
		  "internalType": "bytes32"
		},
		{
		  "name": "_sender",
		  "type": "address",
		  "indexed": true,
		  "internalType": "address"
		},
		{
		  "name": "_oracleAddress",
		  "type": "address",
		  "indexed": true,
		  "internalType": "address"
		}
	  ],
	  "anonymous": false
	},
	{
	  "type": "event",
	  "name": "LiquidationOrderCreated",
	  "inputs": [
		{
		  "name": "_orderId",
		  "type": "bytes32",
		  "indexed": true,
		  "internalType": "bytes32"
		},
		{
		  "name": "_sender",
		  "type": "address",
		  "indexed": false,
		  "internalType": "address"
		},
		{
		  "name": "_address",
		  "type": "address",
		  "indexed": true,
		  "internalType": "address"
		},
		{
		  "name": "_marketId",
		  "type": "bytes32",
		  "indexed": true,
		  "internalType": "bytes32"
		}
	  ],
	  "anonymous": false
	},
	{
	  "type": "event",
	  "name": "OrderCancellationRequestedEvent",
	  "inputs": [
		{
		  "name": "_orderId",
		  "type": "bytes32",
		  "indexed": true,
		  "internalType": "bytes32"
		},
		{
		  "name": "_sender",
		  "type": "address",
		  "indexed": true,
		  "internalType": "address"
		}
	  ],
	  "anonymous": false
	},
	{
	  "type": "event",
	  "name": "OrderCancelled",
	  "inputs": [
		{
		  "name": "_orderId",
		  "type": "bytes32",
		  "indexed": true,
		  "internalType": "bytes32"
		},
		{
		  "name": "_sender",
		  "type": "address",
		  "indexed": true,
		  "internalType": "address"
		},
		{
		  "name": "_oracleAddress",
		  "type": "address",
		  "indexed": true,
		  "internalType": "address"
		}
	  ],
	  "anonymous": false
	},
	{
	  "type": "event",
	  "name": "OrderCreated",
	  "inputs": [
		{
		  "name": "_orderId",
		  "type": "bytes32",
		  "indexed": true,
		  "internalType": "bytes32"
		},
		{
		  "name": "_address",
		  "type": "address",
		  "indexed": true,
		  "internalType": "address"
		},
		{
		  "name": "_marketId",
		  "type": "bytes32",
		  "indexed": true,
		  "internalType": "bytes32"
		},
		{
		  "name": "_closeSharesAmount",
		  "type": "uint256",
		  "indexed": false,
		  "internalType": "uint256"
		},
		{
		  "name": "_openMPHTokenAmount",
		  "type": "uint256",
		  "indexed": false,
		  "internalType": "uint256"
		},
		{
		  "name": "_tradeDirection",
		  "type": "bool",
		  "indexed": false,
		  "internalType": "bool"
		},
		{
		  "name": "_orderLeverage",
		  "type": "uint256",
		  "indexed": false,
		  "internalType": "uint256"
		},
		{
		  "name": "_onlyIfPriceBelow",
		  "type": "uint256",
		  "indexed": false,
		  "internalType": "uint256"
		},
		{
		  "name": "_onlyIfPriceAbove",
		  "type": "uint256",
		  "indexed": false,
		  "internalType": "uint256"
		},
		{
		  "name": "_goodFrom",
		  "type": "uint256",
		  "indexed": false,
		  "internalType": "uint256"
		},
		{
		  "name": "_goodUntil",
		  "type": "uint256",
		  "indexed": false,
		  "internalType": "uint256"
		}
	  ],
	  "anonymous": false
	},
	{
	  "type": "event",
	  "name": "OrderFailed",
	  "inputs": [
		{
		  "name": "_orderId",
		  "type": "bytes32",
		  "indexed": true,
		  "internalType": "bytes32"
		},
		{
		  "name": "_address",
		  "type": "address",
		  "indexed": true,
		  "internalType": "address"
		},
		{
		  "name": "_marketId",
		  "type": "bytes32",
		  "indexed": true,
		  "internalType": "bytes32"
		},
		{
		  "name": "_closeSharesAmount",
		  "type": "uint256",
		  "indexed": false,
		  "internalType": "uint256"
		},
		{
		  "name": "_openMPHTokenAmount",
		  "type": "uint256",
		  "indexed": false,
		  "internalType": "uint256"
		},
		{
		  "name": "_tradeDirection",
		  "type": "bool",
		  "indexed": false,
		  "internalType": "bool"
		},
		{
		  "name": "_orderLeverage",
		  "type": "uint256",
		  "indexed": false,
		  "internalType": "uint256"
		},
		{
		  "name": "_onlyIfPriceBelow",
		  "type": "uint256",
		  "indexed": false,
		  "internalType": "uint256"
		},
		{
		  "name": "_onlyIfPriceAbove",
		  "type": "uint256",
		  "indexed": false,
		  "internalType": "uint256"
		},
		{
		  "name": "_goodFrom",
		  "type": "uint256",
		  "indexed": false,
		  "internalType": "uint256"
		},
		{
		  "name": "_goodUntil",
		  "type": "uint256",
		  "indexed": false,
		  "internalType": "uint256"
		}
	  ],
	  "anonymous": false
	},
	{
	  "type": "event",
	  "name": "OrderProcessed",
	  "inputs": [
		{
		  "name": "_orderId",
		  "type": "bytes32",
		  "indexed": true,
		  "internalType": "bytes32"
		},
		{
		  "name": "_price",
		  "type": "uint256",
		  "indexed": false,
		  "internalType": "uint256"
		},
		{
		  "name": "_unadjustedMarketPrice",
		  "type": "uint256",
		  "indexed": false,
		  "internalType": "uint256"
		},
		{
		  "name": "_spread",
		  "type": "uint256",
		  "indexed": false,
		  "internalType": "uint256"
		},
		{
		  "name": "_positionLiquidationTimestamp",
		  "type": "uint256",
		  "indexed": false,
		  "internalType": "uint256"
		},
		{
		  "name": "_timeStamp",
		  "type": "uint256",
		  "indexed": false,
		  "internalType": "uint256"
		},
		{
		  "name": "_newLongShares",
		  "type": "uint256",
		  "indexed": false,
		  "internalType": "uint256"
		},
		{
		  "name": "_newShortShares",
		  "type": "uint256",
		  "indexed": false,
		  "internalType": "uint256"
		},
		{
		  "name": "_newMeanEntry",
		  "type": "uint256",
		  "indexed": false,
		  "internalType": "uint256"
		},
		{
		  "name": "_newMeanSprad",
		  "type": "uint256",
		  "indexed": false,
		  "internalType": "uint256"
		},
		{
		  "name": "_newMeanLeverage",
		  "type": "uint256",
		  "indexed": false,
		  "internalType": "uint256"
		},
		{
		  "name": "_liquidationPrice",
		  "type": "uint256",
		  "indexed": false,
		  "internalType": "uint256"
		}
	  ],
	  "anonymous": false
	},
  ] as const;
