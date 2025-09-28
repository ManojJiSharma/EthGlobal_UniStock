import { useState } from 'react';
import { SEPOLIA_NETWORK_CONFIG } from '../config/contracts';

export function useNetworkSwitch() {
  const [isSwitching, setIsSwitching] = useState(false);

  const switchToSepolia = async (): Promise<boolean> => {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask is not installed');
    }

    try {
      setIsSwitching(true);

      // Request to switch to Sepolia
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }], // 11155111 in hex
      });

      return true;
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          // Add Sepolia network to MetaMask
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0xaa36a7',
                chainName: 'Sepolia',
                nativeCurrency: {
                  name: 'Ethereum',
                  symbol: 'ETH',
                  decimals: 18,
                },
                rpcUrls: ['https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'],
                blockExplorerUrls: ['https://sepolia.etherscan.io/'],
              },
            ],
          });
          return true;
        } catch (addError) {
          console.error('Failed to add Sepolia network:', addError);
          throw new Error('Failed to add Sepolia network to MetaMask');
        }
      } else {
        console.error('Failed to switch to Sepolia:', switchError);
        throw new Error('Failed to switch to Sepolia network');
      }
    } finally {
      setIsSwitching(false);
    }
  };

  const getCurrentChainId = async (): Promise<string | null> => {
    if (typeof window.ethereum === 'undefined') {
      return null;
    }

    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      return chainId;
    } catch (error) {
      console.error('Failed to get current chain ID:', error);
      return null;
    }
  };

  const isSepolia = async (): Promise<boolean> => {
    const chainId = await getCurrentChainId();
    return chainId === '0xaa36a7'; // 11155111 in hex
  };

  return {
    isSwitching,
    switchToSepolia,
    getCurrentChainId,
    isSepolia,
  };
}
