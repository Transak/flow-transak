import { getNetwork, ENetworkName, isValidWalletAddress, getBalance, getTransaction, sendTransaction} from '../src/index';
import { describe, expect, test } from '@jest/globals';

require('dotenv').config()
const PRIVATE_KEY = process.env.PRIVATE_KEY || ''
// variables
const mainTimeout = 14000;

describe('Flow Integration Module', () => {
  test(
    'it should return valid NetworkConfiguration for mainnet',
    async function () {
      const result = getNetwork(ENetworkName.main);
      expect(result.networkName).toBe('mainnet');
    },
    mainTimeout * 3,
  );
  test(
    'it should return valid NetworkConfiguration for testnet',
    async function () {
      const result = getNetwork(ENetworkName.testnet);
      expect(result.networkName).toBe('testnet');
    },
    mainTimeout * 3,
  );

  test(
    'it should return valid Address for testnet',
    async function () {
      const result = await isValidWalletAddress(ENetworkName.testnet, '0x73c05de1c4223787');
      expect(result).toBe( true);
    },
    mainTimeout * 3,
  );

  test(
    'it should return not a valid Address for testnet',
    async function () {
      try {
        const result = await isValidWalletAddress(ENetworkName.testnet, '23847238748237423');
        expect(result).not.toBe(true)
      } catch (error) {
        expect(error.message).toBe("Invalid account provided");
      }
    },
    mainTimeout * 3,
  );

  test(
    'it should return a valid Address for mainnet',
    async function () {
      const result = await isValidWalletAddress(ENetworkName.main, '0xd64268552e3a48ab');
      expect(result).toBe(true)
    },
    mainTimeout * 3,
  );

  test(
    'it should return not a valid Address for testnet',
    async function () {
      try {
        const result = await isValidWalletAddress(ENetworkName.testnet, '0xd64268552e3a48ab');
        expect(result).not.toBe(true)
      } catch (error) {
        expect(error.message).toBe("Invalid account provided");
      }
    },
    mainTimeout * 3,
  );

  test(
    'it should return not a valid Address for mainnet',
    async function () {
      try {
        const result = await isValidWalletAddress(ENetworkName.testnet, '0xd64268552e3a48abb');
        expect(result).not.toBe(true)
      } catch (error) {
        expect(error.message).toBe("Invalid account provided");
      }
    },
    mainTimeout * 3,
  );

  test(
    'it should return a FUSD Balance for account on Testnet',
    async function () {
      const result = await getBalance(
        { 
          network: ENetworkName.testnet, 
          walletAddress: '0x73c05de1c4223787', 
          tokenContractAddress: '0xe223d8a629e49c68', 
          tokenIdentifier: 'FUSD', 
          tokenBalancePublicPath: '/public/fusdBalance'
        }
      )
      expect( typeof result ).toBe('number')
    },
    mainTimeout * 3,
  );

  test(
    'it should return a FLOW Token Balance for account on Testnet',
    async function () {
      const result = await getBalance(
        { 
          network: ENetworkName.testnet, 
          walletAddress: '0x73c05de1c4223787', 
          tokenContractAddress: '0x7e60df042a9c0868', 
          tokenIdentifier: 'FlowToken', 
          tokenBalancePublicPath: '/public/flowTokenBalance'
        }
      )
      expect( typeof result ).toBe('number')
    },
    mainTimeout * 3,
  );
  
  test(
    'it should throw Error if account is not enabled for receiving FUSD on Testnet',
    async function () {
      try {
        const result = await getBalance(
          { 
            network: ENetworkName.testnet, 
            walletAddress: '0x39575205948ccd4e', 
            tokenContractAddress: '0xe223d8a629e49c68', 
            tokenIdentifier: 'FUSD', 
            tokenBalancePublicPath: '/public/fusdBalance'
          }
        )
        expect( typeof result ).toBe('number')
      } catch (error) {
        expect(error).toBeDefined()
      }
    },
    mainTimeout * 3,
  );

  test( 'is should fetch the Transaction Object ',
    async function(){
      /*
        0	Unknown
        1	Transaction Pending - Awaiting Finalization
        2	Transaction Finalized - Awaiting Execution
        3	Transaction Executed - Awaiting Sealing
        4	Transaction Sealed - Transaction Complete. At this point the transaction result has been committed to the blockchain.
        5	Transaction Expired
      */
      await getTransaction({ network: ENetworkName.testnet, txnHash: '49564d6961b23f424a63f6d9b56d62db3aeb00e46fefcc67835384c0ee1cd9ed'})
    }
  )

  test( 'is should fetch the Transaction Object for successfull txn ',
    async function(){
      /*
        0	Unknown
        1	Transaction Pending - Awaiting Finalization
        2	Transaction Finalized - Awaiting Execution
        3	Transaction Executed - Awaiting Sealing
        4	Transaction Sealed - Transaction Complete. At this point the transaction result has been committed to the blockchain.
        5	Transaction Expired
      */
      const transactionDetails = await getTransaction({ network: ENetworkName.main, txnHash: 'c5b9060b493891046a224b16c84a3742beb4033ee87e11b0786b313c59f22e7c'})
      expect( transactionDetails ).toBeDefined()
      expect( transactionDetails.receipt.isSuccessful ).toBe(true)
    },
    mainTimeout * 3
  )

  test.skip( 'is should fetch the Transaction Object for fail txn',
    async function(){
      /*
        0	Unknown
        1	Transaction Pending - Awaiting Finalization
        2	Transaction Finalized - Awaiting Execution
        3	Transaction Executed - Awaiting Sealing
        4	Transaction Sealed - Transaction Complete. At this point the transaction result has been committed to the blockchain.
        5	Transaction Expired
      */
        const transactionDetails =  await getTransaction({ network: ENetworkName.testnet, txnHash: '5c886d639c63e14be0eb0870a29cf2f67413b3930e4f77a38ca4c3f1b1712a5c'})
      expect( transactionDetails ).toBeDefined()
      expect( transactionDetails.receipt.isSuccessful ).toBe(false)
      expect( transactionDetails.receipt.gasCostInCrypto ).toBe(0.00000104)
    },
    mainTimeout * 3
  )

  test( 'is should send the Transaction',
    async function(){
      /*
        0	Unknown
        1	Transaction Pending - Awaiting Finalization
        2	Transaction Finalized - Awaiting Execution
        3	Transaction Executed - Awaiting Sealing
        4	Transaction Sealed - Transaction Complete. At this point the transaction result has been committed to the blockchain.
        5	Transaction Expired
      */
      const transactionDetails =  await sendTransaction({ 
        network: ENetworkName.testnet, 
        amount: "0.001", 
        fromWalletAddress: '0x73c05de1c4223787', 
        recepient: '0x39575205948ccd4e', 
        privateKey: PRIVATE_KEY,
        tokenIdentifier: 'FlowToken',
        tokenContractAddress: '0x7e60df042a9c0868',
        tokenStoragePath: '/storage/flowTokenVault',
        tokenReceiverPath: '/public/flowTokenReceiver'
      })
      expect( transactionDetails ).toBeDefined()
      expect( transactionDetails.receipt.isSuccessful ).toBe(true)
    },
    mainTimeout * 3
  )

  test( 'is should send the Transaction for FUSD token',
    async function(){
      /*
        0	Unknown
        1	Transaction Pending - Awaiting Finalization
        2	Transaction Finalized - Awaiting Execution
        3	Transaction Executed - Awaiting Sealing
        4	Transaction Sealed - Transaction Complete. At this point the transaction result has been committed to the blockchain.
        5	Transaction Expired
      */
      const transactionDetails =  await sendTransaction({ 
        network: ENetworkName.testnet, 
        amount: "00.001", 
        fromWalletAddress: '0x73c05de1c4223787', 
        recepient: '0x39575205948ccd4e', 
        privateKey: PRIVATE_KEY,
        tokenIdentifier: 'FUSD',
        tokenContractAddress: '0xe223d8a629e49c68',
        tokenStoragePath: '/storage/fusdVault',
        tokenReceiverPath: '/public/fusdReceiver'
      })
      expect( transactionDetails ).toBeDefined()
      expect( transactionDetails.receipt.isSuccessful ).toBe(true)
    },
    mainTimeout * 3
  )
});