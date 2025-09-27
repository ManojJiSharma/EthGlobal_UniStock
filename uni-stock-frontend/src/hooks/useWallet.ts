import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { NETWORK_CONFIG } from '@/config/contract';

export const useWallet = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);

  // Check if wallet is already connected
  const checkConnection = useCallback(async () => {
    if (typeof window.ethereum === 'undefined') {
      console.log('MetaMask not installed');
      return;
    }

    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        const newProvider = new ethers.BrowserProvider(window.ethereum);
        const newSigner = await newProvider.getSigner();
        const network = await newProvider.getNetwork();
        
        setProvider(newProvider);
        setSigner(newSigner);
        setAddress(accounts[0]);
        setIsConnected(true);
        setIsCorrectNetwork(network.chainId === BigInt(NETWORK_CONFIG.chainId));
        setIsInitialized(true);
      } else {
        setIsInitialized(true);
      }
    } catch (error) {
      console.error('Error checking connection:', error);
      setIsInitialized(true);
    }
  }, []);

  // Connect wallet
  const connectWallet = useCallback(async () => {
    if (typeof window.ethereum === 'undefined') {
      alert('Please install MetaMask!');
      return;
    }

    try {
      const newProvider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await newProvider.send('eth_requestAccounts', []);
      const newSigner = await newProvider.getSigner();
      const network = await newProvider.getNetwork();

      setProvider(newProvider);
      setSigner(newSigner);
      setAddress(accounts[0]);
      setIsConnected(true);
      setIsCorrectNetwork(network.chainId === BigInt(NETWORK_CONFIG.chainId));

      // Listen for account changes
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          setAddress(accounts[0]);
        }
      });

      // Listen for network changes
      window.ethereum.on('chainChanged', (chainId: string) => {
        const newChainId = parseInt(chainId, 16);
        setIsCorrectNetwork(newChainId === NETWORK_CONFIG.chainId);
        if (newChainId !== NETWORK_CONFIG.chainId) {
          alert(`Please switch to ${NETWORK_CONFIG.chainName} network`);
        }
      });

    } catch (error) {
      console.error('Error connecting wallet:', error);
      if (error instanceof Error && error.message.includes('User rejected')) {
        alert('Connection rejected by user');
      } else {
        alert('Failed to connect wallet');
      }
    }
  }, []);

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    setAddress(null);
    setIsConnected(false);
    setIsCorrectNetwork(false);
    setProvider(null);
    setSigner(null);
  }, []);

  // Switch network
  const switchNetwork = useCallback(async () => {
    if (typeof window.ethereum === 'undefined') {
      alert('Please install MetaMask!');
      return;
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${NETWORK_CONFIG.chainId.toString(16)}` }],
      });
    } catch (error: any) {
      if (error.code === 4902) {
        // Network not added, add it
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [NETWORK_CONFIG],
          });
        } catch (addError) {
          console.error('Error adding network:', addError);
          alert('Failed to add network');
        }
      } else {
        console.error('Error switching network:', error);
        alert('Failed to switch network');
      }
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  return {
    isConnected,
    address,
    isCorrectNetwork,
    isInitialized,
    provider,
    signer,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    checkConnection
  };
};
