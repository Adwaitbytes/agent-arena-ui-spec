"use client";
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { setupWalletSelector, WalletSelector, AccountState } from "@near-wallet-selector/core";
import { setupNearWallet } from "@near-wallet-selector/near-wallet";
import { setupModal, WalletSelectorModal } from "@near-wallet-selector/modal-ui";
import "@near-wallet-selector/modal-ui/styles.css";

export type NearWalletContextType = {
  selector: WalletSelector | null;
  modal: WalletSelectorModal | null;
  accountId: string | null;
  isReady: boolean;
  connect: () => void;
  disconnect: () => Promise<void>;
  refreshAccounts: () => void;
};

const NearWalletContext = createContext<NearWalletContextType | undefined>(undefined);

export const NearWalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selector, setSelector] = useState<WalletSelector | null>(null);
  const [modal, setModal] = useState<WalletSelectorModal | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const unsubRef = useRef<() => void>();

  const network = process.env.NEXT_PUBLIC_NEAR_NETWORK || "testnet";
  const contractId = process.env.NEXT_PUBLIC_NEAR_CONTRACT_ID; // optional for login-only flows

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const _selector = await setupWalletSelector({
          network: network as any,
          modules: [setupNearWallet()],
        });
        if (cancelled) return;
        setSelector(_selector);

        const _modal = setupModal(_selector, contractId ? { contractId } : {});
        setModal(_modal);

        const setFromState = (accounts: AccountState[]) => {
          const active = accounts.find((a) => a.active) || accounts[0];
          setAccountId(active?.accountId ?? null);
        };

        const state = _selector.store.getState();
        setFromState(state.accounts);

        unsubRef.current = _selector.store.observable.subscribe(({ accounts }) => setFromState(accounts));
        setIsReady(true);
      } catch (e) {
        console.error("Failed to init NEAR Wallet Selector", e);
        setIsReady(true);
      }
    })();
    return () => {
      if (unsubRef.current) unsubRef.current();
      cancelled = true;
    };
  }, [network, contractId]);

  const connect = () => {
    if (!modal) return;
    modal.show();
  };

  const refreshAccounts = () => {
    if (!selector) return;
    const { accounts } = selector.store.getState();
    const active = accounts.find((a) => a.active) || accounts[0];
    setAccountId(active?.accountId ?? null);
  };

  const disconnect = async () => {
    if (!selector) return;
    const wallet = await selector.wallet();
    await wallet.signOut();
    refreshAccounts();
  };

  const value = useMemo(
    () => ({ selector, modal, accountId, isReady, connect, disconnect, refreshAccounts }),
    [selector, modal, accountId, isReady]
  );

  return <NearWalletContext.Provider value={value}>{children}</NearWalletContext.Provider>;
};

export const useNearWallet = () => {
  const ctx = useContext(NearWalletContext);
  if (!ctx) throw new Error("useNearWallet must be used within NearWalletProvider");
  return ctx;
};