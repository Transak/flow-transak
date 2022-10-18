import { Network } from './types';

export const NetworkConfig: Record<string, Network> = {
  main: {
    transactionLink: hash => `https://flowscan.org/transaction/${hash}`,
    walletLink: address => `https://flowscan.org/account/${address}`,
    networkName: 'mainnet',
    serverUrl: 'https://rest-mainnet.onflow.org',
    '0xFT': '0xf233dcee88fe0abe'
  },
  testnet: {
    transactionLink: hash => `https://testnet.flowscan.org/transaction/${hash}`,
    walletLink: address => `https://testnet.flowscan.org/account/${address}`,
    networkName: 'testnet',
    serverUrl: 'https://rest-testnet.onflow.org',
    '0xFT': '0x9a0766d93b6608b7'
  },
};

module.exports = { NetworkConfig };
