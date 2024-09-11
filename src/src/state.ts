import { S } from "./types";

export const initialState: Partial<S> = {
  address: null,
  multiSigner: null,
  multiSignerId: null,
  error: null,
  status: "disconnected",
  isConnecting: false,
  isConnected: false,
  initialized: false,
  chainId: null
};

export function reducer(state: S, action: any): S {
  switch (action.type) {
    case "SET_STATE":
      return { ...state, ...action.payload };
    default:
      return state;
  }
}
