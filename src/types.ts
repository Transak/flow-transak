export enum ENetworkName {
  main = 'main',
  testnet = 'testnet'
}

export type Network = {
  networkName: string;
  transactionLink: (arg0: string) => string;
  walletLink: (arg0: string) => string;
  serverUrl: string;
  '0xFT': string;
};

export interface TransactionResponse {
  transactionData: object; // raw transaction details from blockchain rpc or sdk
  receipt: TransactionReceipt;
}

export interface TransactionReceipt {
  date: Date;
  transactionHash: string;
  transactionLink: string;
  network: string;
  gasPrice: number | null;
  gasLimit: number | null;
  gasCostInCrypto: number | null;
  gasCostCryptoCurrency: string;
  amount: number | null;
  isExecuted: boolean;
  isSuccessful: boolean;
  isFailed: boolean;
  isInvalid: boolean;
  isPending: boolean;
  from: string | null;
  to: string | null;
  nonce: number | null;
}

export type getfeeStatsResult = {
  feeCryptoCurrency: string;
  baseFee: number;
  lowFeeCharged: number;
  standardFeeCharged: number;
  fastFeeCharged: number;
  maxFeeCharged: number;
};