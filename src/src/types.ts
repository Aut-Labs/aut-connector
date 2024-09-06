import { Connector } from "wagmi";

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
  connect: (c?: Connector) => Promise<S>;
  disconnect: () => Promise<void>;
  setStateChangeCallback: () => (s: S) => void;
};
