import { setupWalletSelector } from '@near-wallet-selector/core';
import { setupNearWallet } from '@near-wallet-selector/near-wallet';
import { setupGoogleWallet } from '@near-wallet-selector/google';

const WALLET_CONFIG = [
  setupNearWallet(),
  setupGoogleWallet(),
];

export const walletSelector = setupWalletSelector({
  network: 'testnet', // Switch to 'mainnet' in prod
  wallets: WALLET_CONFIG,
  debug: process.env.NODE_ENV === 'development',
});

export async function connectWallet() {
  const selector = await walletSelector;
  const wallet = await selector.getWalletModal().open();
  if (wallet) {
    await wallet.signIn();
    return wallet.accountId;
  }
  throw new Error('Wallet connection failed');
}

export async function disconnectWallet() {
  const selector = await walletSelector;
  const wallet = selector.getCurrentWallet();
  if (wallet) await wallet.signOut();
}

export async function signIntent(data: any) {
  const selector = await walletSelector;
  const wallet = selector.getCurrentWallet();
  if (!wallet) throw new Error('No wallet connected');
  // Simplified: sign a transaction intent for match data
  const tx = await wallet.signTransaction({ receiverId: process.env.NEAR_CONTRACT_ID || '', actions: [{ functionCall: { methodName: 'storeIntent', args: Buffer.from(JSON.stringify(data)).toString('base64') } }] });
  return tx.transaction.hash;
}