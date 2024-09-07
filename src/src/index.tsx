import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import {
  Connector,
  ConnectorAlreadyConnectedError,
  ProviderNotFoundError,
  useAccount,
  useConnect,
  useDisconnect,
  useSwitchChain
} from "wagmi";
import { getEthersProvider, getEthersSigner } from "./ethers";
import { ParseErrorMessage } from "./error-parser";
import { wagmiConfig } from "./setup.config";
import {
  AutWalletConnector,
  WalletConnectorProvider,
  useWalletConnector
} from "./wallet-connector";
import { S } from "./types";

interface AutConnectorProps {
  defaultChainId?: number;
}

const initialState: Partial<S> = {
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

function reducer(state: S, action: any) {
  switch (action.type) {
    case "SET_STATE":
      const newState = { ...state, ...action.payload };
      return newState;
    default:
      return state;
  }
}

const multiSignerId = (address: string, chainId: number) => {
  return `${address}-${chainId}`;
};

const useAutConnector = ({
  defaultChainId
}: Partial<AutConnectorProps> = {}) => {
  const { address, status, chainId: currentChainId } = useAccount();
  const { connectAsync, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { chains } = useSwitchChain();
  const initialized = useRef<boolean>(false);
  const stateChangeCallback = useRef<(s: S) => void | null>(null);
  const [state, dispatch] = useReducer(reducer, initialState);

  const isConnected = useMemo(() => {
    return status === "connected";
  }, [status]);

  const isConnecting = useMemo(() => {
    return status === "connecting";
  }, [status]);

  const isCorrectChain = useMemo(() => {
    return chains.some((v) => v.id === currentChainId);
  }, [chains, currentChainId]);

  const isAddressChanged = useMemo(() => {
    return state.address !== address;
  }, [state.address, address]);

  const chainId = useMemo(() => {
    if (isCorrectChain) return currentChainId;
    if (defaultChainId) return defaultChainId;
    return chains[0].id;
  }, [chains, currentChainId, isCorrectChain, defaultChainId]);

  const setStateChangeCallbackHandler = useCallback(
    (callback: (s: S) => void) => {
      stateChangeCallback.current = callback;
    },
    []
  );

  useEffect(() => {
    if (!isCorrectChain && isConnected) {
      disconnect();
    }
  }, [isCorrectChain, isConnected]);

  useEffect(() => {
    if (address && isConnected && isCorrectChain) {
      initialiseSDKWithSigner();
    } else if (!address) {
      initialiseSDKWithoutSigner();
    }
  }, [isAddressChanged, isConnected, isCorrectChain]);

  const initialiseSDKWithSigner = async () => {
    dispatch({ type: "SET_STATE", payload: { isConnecting: true } });
    try {
      // const changed = state.multiSignerId !== multiSignerId(address, chainId);
      const { signer, provider } = await getEthersSigner({ chainId });
      const readonlyProvider = getEthersProvider({ chainId });
      const multiSigner = {
        signer,
        readOnlySigner: readonlyProvider,
        provider
      };

      let newState = {
        ...state,
        chainId,
        status,
        address,
        multiSigner,
        multiSignerId: multiSignerId(address, chainId),
        isConnecting: false,
        isConnected: !!signer
      };
      if (stateChangeCallback.current) {
        stateChangeCallback.current(newState);
      }
      dispatch({
        type: "SET_STATE",
        payload: newState
      });
    } catch (err) {
      console.log(err);
    }
    initialized.current = true;
  };

  const initialiseSDKWithoutSigner = async () => {
    dispatch({ type: "SET_STATE", payload: { isConnecting: true } });

    try {
      let newChainId = isCorrectChain
        ? chainId
        : defaultChainId || chains[0].id;
      // const changed = state.multiSignerId !== multiSignerId(null, newChainId);
      const provider = getEthersProvider({ chainId: newChainId });
      const multiSigner = { signer: provider, readOnlySigner: provider };

      let newState = {
        ...state,
        chainId,
        status,
        address,
        multiSigner,
        multiSignerId: multiSignerId(null, newChainId),
        isConnecting: false,
        isConnected: !!provider
      };
      if (stateChangeCallback.current) {
        stateChangeCallback.current(newState);
      }
      dispatch({
        type: "SET_STATE",
        payload: newState
      });
    } catch (err) {
      console.log(err);
    }
    initialized.current = true;
  };

  const _connect = async (c: Connector) => {
    // dispatch({ type: "SET_STATE", payload: { error: null } });
    try {
      let selectedConnector: Connector;
      for (const connector of connectors) {
        if (c.id === connector.id) {
          selectedConnector = connector;
          break;
        }
      }
      let newAddress = address;
      try {
        const response = await connectAsync({
          connector: selectedConnector,
          chainId
        });
        newAddress = response.accounts[0];
      } catch (error) {
        if (error instanceof ConnectorAlreadyConnectedError) {
          const accounts = await selectedConnector.getAccounts();
          newAddress = accounts[0];
        } else if (error instanceof ProviderNotFoundError) {
          const errMsg = `${error.shortMessage} Make sure you have ${selectedConnector.name} installed.`;
          const newState: Partial<S> = {
            error: errMsg,
            isConnecting: false,
            isConnected: false,
            chainId,
            status: "disconnected",
            address: null
          };
          // dispatch({
          //   type: "SET_STATE",
          //   payload: newState
          // });
          return {
            ...state,
            ...newState
          };
        } else {
          const errorMsg = ParseErrorMessage(error);
          const newState = {
            error: errorMsg,
            isConnecting: false,
            isConnected: false,
            chainId,
            status: "disconnected",
            address: null
          };
          // dispatch({ type: "SET_STATE", payload: newState });
          return {
            ...state,
            ...newState
          };
        }
      }

      const { signer, provider } = await getEthersSigner({ chainId });
      const readOnlyProvider = getEthersProvider({ chainId });
      if (signer) {
        const multiSigner = {
          signer: signer,
          readOnlySigner: readOnlyProvider as any,
          provider
        };

        const newState: Partial<S> = {
          address: newAddress,
          multiSigner,
          chainId,
          multiSignerId: multiSignerId(newAddress, chainId),
          status: "connected",
          isConnecting: false,
          isConnected: true
        };

        // dispatch({ type: "SET_STATE", payload: newState });

        return {
          ...state,
          ...newState
        };
      }
    } catch (err) {
      // dispatch({ type: "SET_STATE", payload: { isConnecting: false } });
      console.error(err);
    }
    // return {
    //   ...state,
    //   chainId,
    //   status,
    //   address
    // };
  };

  const connect = useCallback(
    async (c?: Connector) => {
      const result = await _connect(c);
      return result;
    },
    [isConnected, connectors, address, chainId, isCorrectChain]
  );

  return {
    ...state,
    isConnected,
    isConnecting,
    chainId,
    address,
    status,
    initialized: initialized.current,
    connect,
    disconnect,
    setStateChangeCallback: setStateChangeCallbackHandler
  } as S;
};

export {
  useAutConnector,
  wagmiConfig,
  useWalletConnector,
  WalletConnectorProvider,
  AutWalletConnector
};
