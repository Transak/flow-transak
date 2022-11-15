import { getAccount, withPrefix, send, decode, config, query, tx, getTransactionStatus, getTransaction, mutate } from "@onflow/fcl";

import { NetworkConfig } from './config';
import { ENetworkName, getfeeStatsResult, Network, TransactionReceipt, TransactionResponse } from "./types";
import { getSigner } from './signer';

const getNetwork = (network: ENetworkName) :Network =>  NetworkConfig[network];

const initializeFlow = ( network )=>{
  const networkConfiguration = getNetwork( network )
  config({
    "accessNode.api":networkConfiguration.serverUrl,
    "flow.network": networkConfiguration.networkName,
    "0xFT": networkConfiguration["0xFT"]
  });
}

const isValidWalletAddress = async(network: ENetworkName, accountAddress: string) :Promise<boolean> => {
  initializeFlow( network )
  accountAddress = withPrefix(accountAddress);
  if (!accountAddress || accountAddress.length !== 18) {
    return false
  }
  try {
    const accountInfo = await 
      send([getAccount(accountAddress)])
    .then(decode);
  } catch (error) {
    return false
  }
  return true
};

const getWalletLink = (walletAddress: string, network: ENetworkName) =>
  getNetwork(network).walletLink(walletAddress) as string;

const getTransactionLink = (txId: string, network: ENetworkName) => getNetwork(network).transactionLink(txId) as string;

async function getBalance( {network, walletAddress, tokenContractAddress, tokenIdentifier, tokenBalancePublicPath } : { 
  network: ENetworkName;
  walletAddress: string;
  tokenContractAddress: string;
  tokenIdentifier: string;
  tokenBalancePublicPath: string
}
): Promise<number> {
  initializeFlow( network )
  const CODE = `
    import ${tokenIdentifier} from ${tokenContractAddress}
    import FungibleToken from 0xFT
    pub fun main(account: Address): UFix64 {
      let vaultRef = getAccount(account)
      .getCapability(${tokenBalancePublicPath})
      .borrow<&${tokenIdentifier}.Vault{FungibleToken.Balance}>()
      ?? panic("Could not borrow Balance reference to the Vault")
      return vaultRef.balance
    }
  `
  const args = (arg, t) => [arg(walletAddress, t.Address)];
  const balance = await query({ cadence:CODE, args });
  return parseFloat(balance);
}


async function getFeeStats(network: string): Promise<getfeeStatsResult> {
  return {
    feeCryptoCurrency: 'FLOW',
    baseFee: 0.000003, // current Fee
    lowFeeCharged: 0.000003,
    standardFeeCharged: 0.000003,
    fastFeeCharged: 0.000003,
    maxFeeCharged: 0.000003, // double the base Fee
  };
}

// https://developers.flow.com/tools/fcl-js/reference/api#transactionobject

function decodeTransactionStatus( { status, statusCode }: { status: number; statusCode: number }) {
  /*
    0	Unknown
    1	Transaction Pending - Awaiting Finalization
    2	Transaction Finalized - Awaiting Execution
    3	Transaction Executed - Awaiting Sealing
    4	Transaction Sealed - Transaction Complete. At this point the transaction result has been committed to the blockchain.
    5	Transaction Expired

    isExecuted: boolean;
    isSuccessful: boolean;
    isFailed: boolean;
    isInvalid: boolean;
    isPending: boolean;
  */

  const booleanTransactionFlags = {
    isExecuted: false,
    isSuccessful: false,
    isFailed: false,
    isInvalid: false,
    isPending: false,
  }

  switch ( status ) {
    case 4:
      switch ( statusCode ) {
        case 0:
          booleanTransactionFlags.isSuccessful = true
          booleanTransactionFlags.isExecuted = true
          break;
        default:
          booleanTransactionFlags.isFailed = true
          break;
      }
      break;
    case 1:
      booleanTransactionFlags.isPending = true
      break;
    case 3:
      booleanTransactionFlags.isExecuted = true
      break;
    case 5:
      booleanTransactionFlags.isFailed = true
      break;
    default:
      booleanTransactionFlags.isPending = true
      break;
  }
  return booleanTransactionFlags
}

function getSenderWalletAddress( txnStatusData ) : string | null {
  const gasFees = getGasAmountUsedInTransaction( txnStatusData )
  for( const event of txnStatusData.events ){
    if( event.type && event.type.includes("FlowToken.TokensWithdrawn")){
      if( Number( event.data.amount ) === gasFees ){
        return event.data.from
      }
    }
  }
  return null
}

function getReceiverWaleltAddress( txnStatusData ) :string | null {
  const gasFees = getGasAmountUsedInTransaction( txnStatusData )
  for( const event of txnStatusData.events ){
    if( event.type && event.type.includes("FlowToken.TokensDeposited")){
      if( Number( event.data.amount ) !== gasFees ){
        return event.data.to
      }
    }
  }
  return null
}

function getGasAmountUsedInTransaction( txnStatusData ): number | null {
  for( const event of txnStatusData.events ){
    if( event.type && event.type.includes("FlowFees.FeesDeducted")){
      return Number( event.data.amount  )
    }
  }
  return null
}

function getAmountTransferedinTransaction( txnStatusData ): number | null {
  const gasFees = getGasAmountUsedInTransaction( txnStatusData )
  for( const event of txnStatusData.events ){
    if( event.type && event.type.includes("FlowToken.TokensWithdrawn")){
      if( Number( event.data.amount ) !== gasFees ){
        return event.data.amount 
      }
    }
  }
  return null
}

async function getTransaction({txnHash, network}: {txnHash: string, network: ENetworkName}): Promise< TransactionResponse > {
  initializeFlow(network);
  const txnStatusData = await send([
    getTransactionStatus(txnHash ),
  ]).then(decode);
  
  const transactionReceipt :TransactionReceipt= { 
    transactionHash: txnHash,
    transactionLink: getTransactionLink(txnHash, network),
    network,
    gasPrice: null,
    gasLimit: null, // gasLimit
    gasCostInCrypto: getGasAmountUsedInTransaction(txnStatusData), // process the JSON to get gasCost
    gasCostCryptoCurrency: 'FLOW',
    amount: getAmountTransferedinTransaction( txnStatusData ),
    from: getSenderWalletAddress( txnStatusData ),
    to: getReceiverWaleltAddress( txnStatusData),
    nonce: null,
    date: new Date(),
    ...decodeTransactionStatus( { status: txnStatusData.status, statusCode: txnStatusData.statusCode } ) 
  }
  return {
    receipt: transactionReceipt,
    transactionData: txnStatusData
  }
}


/*
  network: ENetworkName;
  walletAddress: string;
  tokenContractAddress: string;
  tokenIdentifier: string;
  tokenBalancePublicPath: string
*/
async function sendTransaction({
  network,
  recepient,
  fromWalletAddress,
  amount,
  privateKey,
  tokenIdentifier,
  tokenContractAddress, 
  tokenStoragePath, // /storage/flowTokenVault
  tokenReceiverPath // /public/flowTokenReceiver
}: {network: ENetworkName; recepient: string; fromWalletAddress: string; amount: string; privateKey:string; tokenIdentifier:string; tokenContractAddress: string; tokenStoragePath:string; tokenReceiverPath: string }): Promise< TransactionResponse > {

  initializeFlow( network )
  const cadence = `
    import ${tokenIdentifier} from ${tokenContractAddress}
    import FungibleToken from 0xFT

    transaction(recepient: Address, amount: UFix64){
      prepare(signer: AuthAccount){
        let sender = signer.borrow<&${tokenIdentifier}.Vault>(from: ${tokenStoragePath})
          ?? panic("Could not borrow Provider reference to the Vault")

        let receiverAccount = getAccount(recepient)

        let receiver = receiverAccount.getCapability(${tokenReceiverPath})
          .borrow<&${tokenIdentifier}.Vault{FungibleToken.Receiver}>()
          ?? panic("Could not borrow Receiver reference to the Vault")

        receiver.deposit(from: <- sender.withdraw(amount: amount))
      }
    }
  `;

  const signer = getSigner(privateKey, fromWalletAddress)
  const args = (arg, t) => [arg(recepient, t.Address), arg(amount, t.UFix64)];
  const proposer = signer;
  const payer = signer;
  const authorizations = [signer];

  // "mutate" method will return us transaction id
  const txId = await mutate({
    cadence,
    args,
    proposer,
    payer,
    authorizations,
    limit: 100
  });
  console.log(`Submitted transaction ${txId} to the network`);
  console.log("Waiting for transaction to be sealed...");
  const label = "Transaction Sealing Time";
  // We will use transaction id in order to "subscribe" to it's state change and get the details of the transaction
  console.time(label);
  await tx(txId).onceSealed();
  console.timeEnd(label);
  return getTransaction({txnHash: txId, network})
}

export {
  ENetworkName,
  isValidWalletAddress,
  getNetwork,
  getWalletLink,
  getTransactionLink,
  getBalance,
  getTransaction,
  getFeeStats,
  sendTransaction
}