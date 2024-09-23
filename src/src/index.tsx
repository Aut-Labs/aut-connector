import { useCallback, useEffect, useMemo, useRef } from "react";
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
import { S } from "./types";
import { AuthSig, signAutMessage, validateAndGetCacheAuthSig } from "./aut-sig";
import {
  useWalletConnector,
  WalletConnectorProvider
} from "./WalletConnectorProvider";
import { AutWalletConnector } from "./wallet-connector";
import { getFilteredConnectors } from "./buttons";

const multiSignerId = (address: string, chainId: number) => {
  return `${address}-${chainId}`;
};

const useAutConnector = () => {
  const { defaultChainId, requestSig, dispatch, state } = useWalletConnector();
  const {
    address,
    status,
    chainId: currentChainId,
    isConnected,
    isConnecting,
    isReconnecting
  } = useAccount();
  const { connectAsync, connectors: allConnectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { chains } = useSwitchChain();
  const initialized = useRef<boolean>(false);
  const stateChangeCallback = useRef<(s: S) => void | null>(null);
  const requestSigRef = useRef(requestSig);
  const signing = useRef(false);
  const previousState = useRef({
    address,
    isConnected,
    isCorrectChain: false,
    chainId: currentChainId
  });

  const isReady = useMemo(
    () => !(isReconnecting || isConnecting),
    [isReconnecting, isConnecting]
  );

  const filteredConnectors = useMemo(
    () => getFilteredConnectors(allConnectors, window),
    [allConnectors]
  );

  const isCorrectChain = useMemo(() => {
    return chains.some((v) => v.id === currentChainId);
  }, [chains, currentChainId]);

  const chainId = useMemo(() => {
    if (isCorrectChain) return currentChainId;
    if (defaultChainId) return defaultChainId;
    return chains[0].id;
  }, [chains, currentChainId, isCorrectChain, defaultChainId]);

  const defaultChain = useMemo(() => {
    return wagmiConfig.chains.find((v) => v.id === defaultChainId);
  }, [defaultChainId]);

  const setStateChangeCallbackHandler = useCallback(
    (callback: (s: S) => void) => {
      stateChangeCallback.current = callback;
    },
    []
  );

  // useEffect(() => {
  //   // if (!isCorrectChain && isConnected) {
  //   //   disconnect();
  //   // }
  // }, [isCorrectChain, isConnected]);

  useEffect(() => {
    if (isReady) {
      const prev = previousState.current;
      const hasAddressChanged = prev.address !== address;
      const hasConnectionStatusChanged = prev.isConnected !== isConnected;
      const hasChainChanged = prev.isCorrectChain !== isCorrectChain;
      const hasChainIdChanged = prev.chainId !== chainId;

      const hasChanged =
        hasAddressChanged ||
        hasConnectionStatusChanged ||
        hasChainChanged ||
        hasChainIdChanged;

      const isConnectionValid = address && isConnected && isCorrectChain;

      let initialiseWithSigner = false;

      if (hasChanged && isConnectionValid) {
        initialiseWithSigner = true;
      }

      if (initialiseWithSigner) {
        _initialiseSDKWithSigner();
      } else if (!address || !isCorrectChain) {
        _initialiseSDKWithoutSigner();
      }
      previousState.current = { address, isConnected, isCorrectChain, chainId };
    }
  }, [address, isConnected, isCorrectChain, isReady, chainId]);

  const _initialiseSDKWithSigner = async () => {
    if (signing.current) return;
    let newState = {
      ...state
    };
    try {
      const { signer, provider } = await getEthersSigner({ chainId }, defaultChain);
      const readonlyProvider = getEthersProvider({ chainId }, defaultChain);
      const multiSigner = {
        signer,
        readOnlySigner: readonlyProvider,
        provider
      };
      newState = {
        ...newState,
        chainId,
        status,
        address,
        multiSigner,
        multiSignerId: multiSignerId(address, chainId),
        isConnecting: false,
        isConnected: !!signer
      };
      newState.authSig = await _getAuthSig(newState as S);
      if (stateChangeCallback.current) {
        stateChangeCallback.current(newState);
      }
      console.log("Connected with signer");
    } catch (err) {
      console.log(err);
    }
    dispatch({
      type: "SET_STATE",
      payload: newState
    });
    initialized.current = true;
  };

  const _initialiseSDKWithoutSigner = async () => {
    let newState: S = {
      ...state
    };

    try {
      let newChainId = isCorrectChain
        ? chainId
        : defaultChainId || chains[0].id;
      const provider = getEthersProvider({ chainId: newChainId }, defaultChain);
      const multiSigner = { signer: provider, readOnlySigner: provider };

      newState = {
        ...newState,
        chainId: newChainId,
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
      console.log("Connected with read only signer");
    } catch (err) {
      console.log(err);
    }
    dispatch({
      type: "SET_STATE",
      payload: newState
    });
    initialized.current = true;
  };

  const _connect = async (c: Connector): Promise<S> => {
    try {
      let selectedConnector: Connector = c;
      for (const connector of filteredConnectors) {
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
          return {
            ...state,
            ...newState
          };
        } else {
          const errorMsg = ParseErrorMessage(error);
          const newState: Partial<S> = {
            error: errorMsg,
            isConnecting: false,
            isConnected: false,
            chainId,
            status: "disconnected",
            address: null
          };
          return {
            ...state,
            ...newState
          };
        }
      }

      const { signer, provider } = await getEthersSigner({ chainId }, defaultChain);
      const readOnlyProvider = getEthersProvider({ chainId }, defaultChain);
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
        newState.authSig = await _getAuthSig(newState as S);
        return {
          ...state,
          ...newState
        };
      }
    } catch (err) {
      console.error(err);
    }
  };

  const _getAuthSig = async (state: S): Promise<AuthSig> => {
    let authSig: AuthSig | null = await validateAndGetCacheAuthSig(
      state.chainId,
      state.multiSigner.provider
    );
    if (authSig) return authSig;

    if (requestSigRef.current) {
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;
      const expirationTime = new Date(Date.now() + thirtyDays).toISOString();
      try {
        authSig = await signAutMessage({
          provider: state.multiSigner.provider,
          account: state.address,
          resources: [],
          derivedVia: "web3.eth.personal.sign",
          chainId: state.chainId,
          expiration: expirationTime,
          uri: window.location.origin
        });
      } catch (err) {
        console.error(err);
      }
    }
    return authSig;
  };

  const connect = useCallback(async (c: Connector) => {
    signing.current = requestSigRef.current;
    const s = await _connect(c);
    dispatch({
      type: "SET_STATE",
      payload: s
    });
    signing.current = false;
    return s;
  }, []);

  const renewAuthSig = useCallback(async () => {
    const authSig = await _getAuthSig(state as S);
    dispatch({
      type: "SET_STATE",
      payload: {
        authSig
      }
    });
    return { ...state, authSig };
  }, [state]);

  return {
    ...state,
    isConnected,
    isConnecting,
    chainId,
    address,
    status,
    initialized: initialized.current,
    connectors: filteredConnectors,
    renewAuthSig,
    connect,
    disconnect,
    setStateChangeCallback: setStateChangeCallbackHandler
  } as S;
};

export {
  useAutConnector,
  useWalletConnector,
  wagmiConfig,
  AutWalletConnector,
  WalletConnectorProvider,
};
