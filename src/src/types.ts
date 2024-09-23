import { Connector } from "wagmi";
import { AuthSig } from "./aut-sig";
import { ReactNode } from "react";

export type S = {
  address: string;
  isConnecting: boolean;
  isConnected: boolean;
  status: "connected" | "connecting" | "disconnected" | "reconnecting";
  initialized: boolean;
  error: string;
  chainId: number;
  multiSigner: any;
  multiSignerId: string;
  authSig?: AuthSig;
  connectors: Connector[];
  renewAuthSig: () => Promise<S>;
  connect: (c: Connector) => Promise<S>;
  disconnect: () => Promise<void>;
  setStateChangeCallback: () => (s: S) => void;
};


export interface AutWalletConnectorProps {
  titleContent?: ReactNode;
  loadingContent: ReactNode;
  connect: (c: Connector) => Promise<S>;
}
