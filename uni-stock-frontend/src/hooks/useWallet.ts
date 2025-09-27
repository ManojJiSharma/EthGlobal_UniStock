import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { NETWORK_CONFIG } from '@/config/contracts';

// Extend Window interface for ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (event: string, callback: (...args: any[]) => void) => void;
      isMetaMask?: boolean;
    };
  }
}

export const useWallet = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);

  // Check if wallet is already connected
  const checkConnection = useCallback(async () => {
    if (typeof window.ethereum === 'undefined') {
      console.log('MetaMask not installed');
      setIsInitialized(true);
      return;
    }

    try {
      console.log('Checking existing connection...');
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      console.log('Existing accounts:', accounts);
      
      if (accounts.length > 0) {
        const newProvider = new ethers.BrowserProvider(window.ethereum);
        const newSigner = await newProvider.getSigner();
        const network = await newProvider.getNetwork();
        
        console.log('Network:', network);
        console.log('Chain ID:', network.chainId.toString());
        console.log('Expected Chain ID:', NETWORK_CONFIG.chainId);
        
        setProvider(newProvider);
        setSigner(newSigner);
        setAddress(accounts[0]);
        setIsConnected(true);
        setIsCorrectNetwork(network.chainId === BigInt(NETWORK_CONFIG.chainId));
        
        console.log('Wallet connected:', accounts[0]);
        console.log('Correct network:', network.chainId === BigInt(NETWORK_CONFIG.chainId));
      }
      
      setIsInitialized(true);
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

    setIsConnecting(true);
    console.log('Starting wallet connection...');

    try {
      // Request account access
      console.log('Requesting account access...');
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      console.log('Accounts received:', accounts);
      
      if (accounts.length === 0) {
        throw new Error('No accounts returned');
      }

      const newProvider = new ethers.BrowserProvider(window.ethereum);
      const newSigner = await newProvider.getSigner();
      const network = await newProvider.getNetwork();

      console.log('Provider created, network:', network);

      setProvider(newProvider);
      setSigner(newSigner);
      setAddress(accounts[0]);
      setIsConnected(true);
      setIsCorrectNetwork(network.chainId === BigInt(NETWORK_CONFIG.chainId));

      console.log('Wallet connected successfully:', accounts[0]);
      console.log('Correct network:', network.chainId === BigInt(NETWORK_CONFIG.chainId));

      // Set up event listeners
      const handleAccountsChanged = (accounts: string[]) => {
        console.log('Accounts changed:', accounts);
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          setAddress(accounts[0]);
        }
      };

      const handleChainChanged = (chainId: string) => {
        console.log('Chain changed:', chainId);
        const newChainId = parseInt(chainId, 16);
        setIsCorrectNetwork(newChainId === NETWORK_CONFIG.chainId);
        if (newChainId !== NETWORK_CONFIG.chainId) {
          alert(`Please switch to ${NETWORK_CONFIG.chainName} network`);
        }
      };

      // Remove existing listeners to avoid duplicates
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
      
      // Add new listeners
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      
      if (error.code === 4001) {
        alert('Connection rejected by user');
      } else if (error.code === -32002) {
        alert('Connection request already pending');
      } else {
        alert(`Failed to connect wallet: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    console.log('Disconnecting wallet...');
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

    setIsSwitchingNetwork(true);
    console.log('Switching to network:', NETWORK_CONFIG.chainId);

    try {
      // First try to switch to the network
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${NETWORK_CONFIG.chainId.toString(16)}` }],
      });
      
      console.log('Network switched successfully');
      
      // Update the network state
      if (provider) {
        const network = await provider.getNetwork();
        setIsCorrectNetwork(network.chainId === BigInt(NETWORK_CONFIG.chainId));
        console.log('Network state updated:', network.chainId === BigInt(NETWORK_CONFIG.chainId));
      }
      
      // If not connected, connect after network switch
      if (!isConnected) {
        console.log('Not connected, connecting wallet after network switch...');
        await connectWallet();
      }
      
    } catch (error: any) {
      console.error('Error switching network:', error);
      
      if (error.code === 4902) {
        // Network not added, add it
        try {
          console.log('Adding network...');
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${NETWORK_CONFIG.chainId.toString(16)}`,
              chainName: NETWORK_CONFIG.chainName,
              nativeCurrency: NETWORK_CONFIG.nativeCurrency,
              rpcUrls: NETWORK_CONFIG.rpcUrls,
              blockExplorerUrls: NETWORK_CONFIG.blockExplorerUrls,
            }],
          });
          console.log('Network added successfully');
          
          // Update the network state
          if (provider) {
            const network = await provider.getNetwork();
            setIsCorrectNetwork(network.chainId === BigInt(NETWORK_CONFIG.chainId));
            console.log('Network state updated after adding:', network.chainId === BigInt(NETWORK_CONFIG.chainId));
          }
          
          // If not connected, connect after adding network
          if (!isConnected) {
            console.log('Not connected, connecting wallet after adding network...');
            await connectWallet();
          }
          
        } catch (addError: any) {
          console.error('Error adding network:', addError);
          alert(`Failed to add network: ${addError.message || 'Unknown error'}`);
        }
      } else if (error.code === 4001) {
        alert('Network switch rejected by user');
      } else {
        alert(`Failed to switch network: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setIsSwitchingNetwork(false);
    }
  }, [provider, isConnected, connectWallet]);

  // Initialize on mount
  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  return {
    isConnected,
    address,
    isCorrectNetwork,
    isInitialized,
    isConnecting,
    isSwitchingNetwork,
    provider,
    signer,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    checkConnection
  };
};
