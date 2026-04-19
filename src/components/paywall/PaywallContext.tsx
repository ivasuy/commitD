"use client";

import { createContext, useContext } from "react";

interface PaywallContextValue {
  openUpgrade: () => void;
  canOpenUpgrade: boolean;
}

const noop = () => {
  // noop
};

const PaywallContext = createContext<PaywallContextValue>({
  openUpgrade: noop,
  canOpenUpgrade: true,
});

export function PaywallProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: PaywallContextValue;
}) {
  return <PaywallContext.Provider value={value}>{children}</PaywallContext.Provider>;
}

export function usePaywall() {
  return useContext(PaywallContext);
}
