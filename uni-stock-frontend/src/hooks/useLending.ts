import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWallet } from './useWallet';
import { LZ_LIQUIDATION_ABI, L_TOKEN_ABI, ERC20_ABI, LendingResult, UserLendingData, LendingMarket } from '../config/abis';

// Contract addresses for Rootstock testnet
const LENDING_CONTRACT_ADDRESS = '0x1234567890123456789012345678901234567890'; // Replace with actual address
const COMPTROLLER_ADDRESS = '0x1234567890123456789012345678901234567890'; // Replace with actual address

// Token addresses for Rootstock testnet
const TOKEN_ADDRESSES = {
  USDC: '0x52e902767d5aFD0fba635C741DE33757655B1fa1',
  USDT: '0xC20A069d7Ec2C6E289f6910491b2C5243ffe7aCd',
  DAI: '0x1234567890123456789012345678901234567890', // Replace with actual DAI address
};

export const useLending = () => {
  const { signer, address, isConnected } = useWallet();
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState<UserLendingData | null>(null);
  const [markets, setMarkets] = useState<LendingMarket[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Get lending contract instance
  const getLendingContract = useCallback(() => {
    if (!signer) return null;
    return new ethers.Contract(LENDING_CONTRACT_ADDRESS, LZ_LIQUIDATION_ABI, signer);
  }, [signer]);

  // Get token contract instance
  const getTokenContract = useCallback((tokenAddress: string) => {
    if (!signer) return null;
    return new ethers.Contract(tokenAddress, ERC20_ABI, signer);
  }, [signer]);

  // Get lToken contract instance
  const getLTokenContract = useCallback((lTokenAddress: string) => {
    if (!signer) return null;
    return new ethers.Contract(lTokenAddress, L_TOKEN_ABI, signer);
  }, [signer]);

  // Supply tokens to lending protocol
  const supply = useCallback(async (tokenAddress: string, amount: string): Promise<LendingResult> => {
    if (!isConnected || !signer) {
      return { success: false, error: 'Wallet not connected' };
    }

    try {
      setLoading(true);
      setError(null);

      const lendingContract = getLendingContract();
      console.log("🚀 ~ useLending ~ lendingContract:", lendingContract)
      if (!lendingContract) {
        throw new Error('Lending contract not available');
      }

      const tokenContract = getTokenContract(tokenAddress);
      if (!tokenContract) {
        throw new Error('Token contract not available');
      }

      // Convert amount to wei
      const decimals = await tokenContract.decimals();
      const amountWei = ethers.parseUnits(amount, decimals);

      // Check and approve token spending
      const allowance = await tokenContract.allowance(address, LENDING_CONTRACT_ADDRESS);
      if (allowance < amountWei) {
        const approveTx = await tokenContract.approve(LENDING_CONTRACT_ADDRESS, amountWei);
        await approveTx.wait();
      }

      // Supply tokens
      const tx = await lendingContract.supply(amountWei, tokenAddress);
      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: receipt.hash,
        gasUsed: receipt.gasUsed.toString(),
      };
    } catch (err: any) {
      console.error('Supply error:', err);
      return {
        success: false,
        error: err.message || 'Supply failed',
      };
    } finally {
      setLoading(false);
    }
  }, [isConnected, signer, address, getLendingContract, getTokenContract]);

  // Redeem tokens from lending protocol
  const redeem = useCallback(async (lTokenAddress: string, amount: string): Promise<LendingResult> => {
    if (!isConnected || !signer) {
      return { success: false, error: 'Wallet not connected' };
    }

    try {
      setLoading(true);
      setError(null);

      const lendingContract = getLendingContract();
      if (!lendingContract) {
        throw new Error('Lending contract not available');
      }

      // Convert amount to wei
      const lTokenContract = getLTokenContract(lTokenAddress);
      if (!lTokenContract) {
        throw new Error('LToken contract not available');
      }

      const decimals = await lTokenContract.decimals();
      const amountWei = ethers.parseUnits(amount, decimals);

      // Redeem tokens
      const tx = await lendingContract.redeem(amountWei, lTokenAddress);
      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: receipt.hash,
        gasUsed: receipt.gasUsed.toString(),
      };
    } catch (err: any) {
      console.error('Redeem error:', err);
      return {
        success: false,
        error: err.message || 'Redeem failed',
      };
    } finally {
      setLoading(false);
    }
  }, [isConnected, signer, getLendingContract, getLTokenContract]);

  // Borrow tokens from lending protocol
  const borrow = useCallback(async (tokenAddress: string, amount: string): Promise<LendingResult> => {
    if (!isConnected || !signer) {
      return { success: false, error: 'Wallet not connected' };
    }

    try {
      setLoading(true);
      setError(null);

      const lendingContract = getLendingContract();
      if (!lendingContract) {
        throw new Error('Lending contract not available');
      }

      // Convert amount to wei
      const tokenContract = getTokenContract(tokenAddress);
      if (!tokenContract) {
        throw new Error('Token contract not available');
      }

      const decimals = await tokenContract.decimals();
      const amountWei = ethers.parseUnits(amount, decimals);

      // Borrow tokens
      const tx = await lendingContract.borrow(amountWei, tokenAddress);
      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: receipt.hash,
        gasUsed: receipt.gasUsed.toString(),
      };
    } catch (err: any) {
      console.error('Borrow error:', err);
      return {
        success: false,
        error: err.message || 'Borrow failed',
      };
    } finally {
      setLoading(false);
    }
  }, [isConnected, signer, getLendingContract, getTokenContract]);

  // Repay borrowed tokens
  const repayBorrow = useCallback(async (lTokenAddress: string, amount: string): Promise<LendingResult> => {
    if (!isConnected || !signer) {
      return { success: false, error: 'Wallet not connected' };
    }

    try {
      setLoading(true);
      setError(null);

      const lendingContract = getLendingContract();
      if (!lendingContract) {
        throw new Error('Lending contract not available');
      }

      // Convert amount to wei
      const lTokenContract = getLTokenContract(lTokenAddress);
      if (!lTokenContract) {
        throw new Error('LToken contract not available');
      }

      const decimals = await lTokenContract.decimals();
      const amountWei = ethers.parseUnits(amount, decimals);

      // Get underlying token address
      const underlyingToken = await lendingContract.lTokenToUnderlying(lTokenAddress);
      
      // Check and approve token spending
      const tokenContract = getTokenContract(underlyingToken);
      if (!tokenContract) {
        throw new Error('Token contract not available');
      }

      const allowance = await tokenContract.allowance(address, LENDING_CONTRACT_ADDRESS);
      if (allowance < amountWei) {
        const approveTx = await tokenContract.approve(LENDING_CONTRACT_ADDRESS, amountWei);
        await approveTx.wait();
      }

      // Repay borrowed tokens (chainType: 8 for SameChain, srcEid: 0)
      const tx = await lendingContract.repayBorrow(amountWei, lTokenAddress, 8, 0);
      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: receipt.hash,
        gasUsed: receipt.gasUsed.toString(),
      };
    } catch (err: any) {
      console.error('Repay borrow error:', err);
      return {
        success: false,
        error: err.message || 'Repay borrow failed',
      };
    } finally {
      setLoading(false);
    }
  }, [isConnected, signer, address, getLendingContract, getLTokenContract, getTokenContract]);

  // Get user lending data
  const fetchUserData = useCallback(async () => {
    if (!isConnected || !signer || !address) return;

    try {
      setLoading(true);
      setError(null);

      const lendingContract = getLendingContract();
      if (!lendingContract) {
        throw new Error('Lending contract not available');
      }

      // Get user's supplied assets
      const suppliedAssets = await lendingContract.lzSuppliedAssets(address);
      
      let totalInvestment = 0n;
      let totalBorrowed = 0n;

      // Calculate total investment and borrowed amounts
      for (const lTokenAddress of suppliedAssets) {
        const investment = await lendingContract.totalInvestment(address, lTokenAddress);
        totalInvestment += investment;

        const borrowed = await lendingContract.borrowWithInterest(address, lTokenAddress);
        totalBorrowed += borrowed;
      }

      // Calculate health factor (simplified)
      const healthFactor = totalInvestment > 0n 
        ? (totalInvestment * 10000n) / (totalBorrowed + 1n) // Avoid division by zero
        : 0n;

      setUserData({
        healthFactor: (Number(healthFactor) / 100).toFixed(2),
        totalInvestment: ethers.formatEther(totalInvestment),
        borrowed: ethers.formatEther(totalBorrowed),
      });
    } catch (err: any) {
      console.error('Fetch user data error:', err);
      setError(err.message || 'Failed to fetch user data');
    } finally {
      setLoading(false);
    }
  }, [isConnected, signer, address, getLendingContract]);

  // Get lending markets
  const fetchMarkets = useCallback(async () => {
    if (!isConnected || !signer) return;

    try {
      setLoading(true);
      setError(null);

      const lendingContract = getLendingContract();
      if (!lendingContract) {
        throw new Error('Lending contract not available');
      }

      const marketsData: LendingMarket[] = [];

      // Get markets for each token
      for (const [symbol, tokenAddress] of Object.entries(TOKEN_ADDRESSES)) {
        try {
          const lTokenAddress = await lendingContract.underlyingTolToken(tokenAddress);
          if (lTokenAddress === ethers.ZeroAddress) continue;

          const tokenContract = getTokenContract(tokenAddress);
          const lTokenContract = getLTokenContract(lTokenAddress);
          
          if (!tokenContract || !lTokenContract) continue;

          const [name, decimals, totalSupply, totalBorrows] = await Promise.all([
            tokenContract.name(),
            tokenContract.decimals(),
            lTokenContract.totalSupply(),
            lTokenContract.totalBorrows(),
          ]);

          // Get supply and borrow rates
          const [supplyRate, borrowRate] = await Promise.all([
            lTokenContract.supplyRatePerBlock(),
            lTokenContract.borrowRatePerBlock(),
          ]);

          marketsData.push({
            asset: tokenAddress,
            symbol,
            name,
            decimals,
            lTokenAddress,
            supplyRate: ethers.formatEther(supplyRate),
            borrowRate: ethers.formatEther(borrowRate),
            totalSupply: ethers.formatEther(totalSupply),
            totalBorrows: ethers.formatEther(totalBorrows),
            collateralFactor: '0.8', // Default value
            isActive: true,
          });
        } catch (err) {
          console.warn(`Failed to fetch market data for ${symbol}:`, err);
        }
      }

      setMarkets(marketsData);
    } catch (err: any) {
      console.error('Fetch markets error:', err);
      setError(err.message || 'Failed to fetch markets');
    } finally {
      setLoading(false);
    }
  }, [isConnected, signer, getLendingContract, getTokenContract, getLTokenContract]);

  // Refresh all data
  const refresh = useCallback(async () => {
    await Promise.all([
      fetchUserData(),
      fetchMarkets(),
    ]);
  }, [fetchUserData, fetchMarkets]);

  // Auto-refresh data when wallet connects
  useEffect(() => {
    if (isConnected && signer) {
      refresh();
    }
  }, [isConnected, signer, refresh]);

  return {
    // Functions
    supply,
    redeem,
    borrow,
    repayBorrow,
    refresh,
    
    // State
    loading,
    userData,
    markets,
    error,
    
    // Utils
    getLendingContract,
    getTokenContract,
    getLTokenContract,
  };
};
