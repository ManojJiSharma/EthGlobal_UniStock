import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { CONTRACTS, TOKENS, POOL_CONFIG } from '@/config/contracts';
import { 
  POOL_MANAGER_ABI, 
  ROUTER_ABI,
  ERC20_ABI,
  PoolKey,
  PoolStats,
  PoolTVL,
  UserStats,
  UserPosition,
  SwapResult,
  LiquidityResult
} from '@/config/abis';

interface PoolData {
  id: string;
  token0: string;
  token1: string;
  fee: number;
  tickSpacing: number;
  liquidity: string;
  volume24h: string;
  fees24h: string;
  apr: string;
  isActive: boolean;
}

interface TokenData {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
  price: string;
}

interface SwapQuote {
  amountOut: string;
  amountIn: string;
  priceImpact: string;
  fee: string;
  route: string[];
}

export const useUnistockDEX = () => {
  const [pools, setPools] = useState<PoolData[]>([]);
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [router, setRouter] = useState<ethers.Contract | null>(null);
  const [poolManager, setPoolManager] = useState<ethers.Contract | null>(null);

  // Initialize provider and signer
  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      const newProvider = new ethers.BrowserProvider(window.ethereum);
      setProvider(newProvider);
      
      newProvider.getSigner().then((newSigner) => {
        setSigner(newSigner);
        
        // Initialize contracts
        const routerContract = new ethers.Contract(CONTRACTS.ROUTER, ROUTER_ABI, newSigner);
        const poolManagerContract = new ethers.Contract(CONTRACTS.POOL_MANAGER, POOL_MANAGER_ABI, newProvider);
        
        setRouter(routerContract);
        setPoolManager(poolManagerContract);
      }).catch(console.error);
    }
  }, []);

  // Error handling utility
  const handleContractError = useCallback((error: any) => {
    if (error.code === 'INSUFFICIENT_FUNDS') {
      return 'Insufficient funds for transaction';
    } else if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
      return 'Transaction may fail or require manual gas limit';
    } else if (error.message.includes('Unistock: Unauthorized')) {
      return 'User not authorized to perform this action';
    } else if (error.message.includes('Unistock: Pool not active')) {
      return 'Pool is not active';
    } else if (error.message.includes('Unistock: Insufficient liquidity')) {
      return 'Insufficient liquidity in pool';
    } else if (error.message.includes('Unistock: Position not found')) {
      return 'Liquidity position not found';
    } else if (error.message.includes('Unistock: Max amount exceeded')) {
      return 'Maximum amount exceeded';
    } else {
      return error.message || 'Unknown error occurred';
    }
  }, []);

  // Retry logic with exponential backoff
  const retryTransaction = useCallback(async (
    transactionFunction: () => Promise<any>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await transactionFunction();
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
        console.log(`Transaction attempt ${attempt} failed, retrying in ${delay}ms...`);
      }
    }
  }, []);

  // Get pool ID for token pair
  const getPoolId = useCallback((token0: string, token1: string, fee: number = POOL_CONFIG.defaultFee, tickSpacing: number = POOL_CONFIG.defaultTickSpacing) => {
    const [tokenA, tokenB] = token0 < token1 ? [token0, token1] : [token1, token0];
    return ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ['address', 'address', 'uint24', 'int24', 'address'],
        [tokenA, tokenB, fee, tickSpacing, ethers.ZeroAddress]
      )
    );
  }, []);

  // Fetch pool data from contracts
  const fetchPools = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!poolManager) {
        console.error('PoolManager not available');
        setPools([]);
        return;
      }

      console.log('Fetching real pool data from Unistock contracts...');
      
      const realPools: PoolData[] = [];
      
      // Check for common token pairs and fee tiers
      const tokenPairs = [
        [TOKENS.WETH, TOKENS.USDC],
        [TOKENS.WETH, TOKENS.USDT],
        [TOKENS.USDC, TOKENS.DAI],
        [TOKENS.WETH, TOKENS.DAI],
        [TOKENS.USDC, TOKENS.USDT]
      ];
      
      const feeTiers = [100, 500, 3000, 10000];
      
      for (const [tokenA, tokenB] of tokenPairs) {
        for (const fee of feeTiers) {
          try {
            const poolId = getPoolId(tokenA, tokenB, fee);
            
            // Check if pool is active
            const isActive = await poolManager.isPoolActive(poolId);
            
            if (isActive) {
              // Get pool stats
              const stats = await poolManager.getPoolStats(poolId);
              const tvl = await poolManager.calculatePoolTVL(poolId);
              
              realPools.push({
                id: poolId,
                token0: tokenA < tokenB ? tokenA : tokenB,
                token1: tokenA < tokenB ? tokenB : tokenA,
                fee: fee,
                tickSpacing: POOL_CONFIG.feeTiers.find(tier => tier.fee === fee)?.tickSpacing || 60,
                liquidity: ethers.formatEther(tvl.tvl0.add(tvl.tvl1)),
                volume24h: ethers.formatEther(stats.volume),
                fees24h: ethers.formatEther(stats.feesCollected),
                apr: '0', // TODO: Calculate APR
                isActive: true
              });
            }
          } catch (err) {
            console.log(`Pool ${tokenA}/${tokenB} (fee: ${fee}) does not exist or is not active`);
          }
        }
      }
      
      console.log(`Found ${realPools.length} active pools`);
      setPools(realPools);
      
    } catch (err) {
      console.error('Error fetching pools:', err);
      setError('Failed to fetch pools from contracts');
      setPools([]);
    } finally {
      setIsLoading(false);
    }
  }, [poolManager, getPoolId]);

  // Fetch token data and balances
  const fetchTokens = useCallback(async (userAddress?: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const tokenAddresses = Object.values(TOKENS);
      const mockTokens: TokenData[] = tokenAddresses.map((address, index) => ({
        address,
        symbol: ['WETH', 'USDC', 'USDT', 'DAI'][index] || 'UNKNOWN',
        name: ['Wrapped Ethereum', 'USD Coin', 'Tether USD', 'Dai Stablecoin'][index] || 'Unknown Token',
        decimals: 18,
        balance: userAddress ? '0' : '0',
        price: ['2500', '1', '1', '1'][index] || '0'
      }));

      setTokens(mockTokens);
    } catch (err) {
      setError('Failed to fetch tokens');
      console.error('Error fetching tokens:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get quote for exact input swap
  const getAmountOut = useCallback(async (
    tokenIn: string,
    tokenOut: string,
    amountIn: string,
    fee: number = POOL_CONFIG.defaultFee,
    tickSpacing: number = POOL_CONFIG.defaultTickSpacing
  ): Promise<string> => {
    try {
      if (!router) {
        throw new Error('Router not available');
      }

      const amountInWei = ethers.parseEther(amountIn);
      const amountOutWei = await router.getAmountOut(tokenIn, tokenOut, amountInWei, fee, tickSpacing);
      return ethers.formatEther(amountOutWei);
    } catch (error) {
      console.error('Quote failed:', error);
      throw new Error('Unable to get quote');
    }
  }, [router]);

  // Get quote for exact output swap
  const getAmountIn = useCallback(async (
    tokenIn: string,
    tokenOut: string,
    amountOut: string,
    fee: number = POOL_CONFIG.defaultFee,
    tickSpacing: number = POOL_CONFIG.defaultTickSpacing
  ): Promise<string> => {
    try {
      if (!router) {
        throw new Error('Router not available');
      }

      const amountOutWei = ethers.parseEther(amountOut);
      const amountInWei = await router.getAmountIn(tokenIn, tokenOut, amountOutWei, fee, tickSpacing);
      return ethers.formatEther(amountInWei);
    } catch (error) {
      console.error('Quote failed:', error);
      throw new Error('Unable to get quote');
    }
  }, [router]);

  // Approve token spending
  const approveToken = useCallback(async (
    tokenAddress: string,
    amount: string,
    spender: string = CONTRACTS.ROUTER
  ): Promise<SwapResult> => {
    try {
      if (!signer) {
        throw new Error('Signer not available');
      }

      const token = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
      
      // Check current allowance
      const currentAllowance = await token.allowance(await signer.getAddress(), spender);
      const amountWei = ethers.parseEther(amount);
      
      // Only approve if needed
      if (currentAllowance < amountWei) {
        const gasEstimate = await token.estimateGas.approve(spender, amountWei);
        const tx = await token.approve(spender, amountWei, {
          gasLimit: gasEstimate * 120n / 100n // 20% buffer
        });
        const receipt = await tx.wait();
        
        return {
          success: true,
          transactionHash: receipt.hash,
          gasUsed: receipt.gasUsed.toString()
        };
      } else {
        return {
          success: true,
          error: 'Token already approved'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: handleContractError(error)
      };
    }
  }, [signer, handleContractError]);

  // Execute exact input swap
  const swapExactInputSingle = useCallback(async (
    tokenIn: string,
    tokenOut: string,
    amountIn: string,
    minAmountOut: string,
    fee: number = POOL_CONFIG.defaultFee,
    tickSpacing: number = POOL_CONFIG.defaultTickSpacing
  ): Promise<SwapResult> => {
    try {
      if (!router) {
        throw new Error('Router not available');
      }

      const amountInWei = ethers.parseEther(amountIn);
      const minAmountOutWei = ethers.parseEther(minAmountOut);

      // Estimate gas first
      const gasEstimate = await router.estimateGas.swapExactInputSingle(
        tokenIn,
        tokenOut,
        amountInWei,
        minAmountOutWei,
        fee,
        tickSpacing
      );

      // Execute swap
      const tx = await router.swapExactInputSingle(
        tokenIn,
        tokenOut,
        amountInWei,
        minAmountOutWei,
        fee,
        tickSpacing,
        {
          gasLimit: gasEstimate * 120n / 100n // 20% buffer
        }
      );

      const receipt = await tx.wait();
      
      return {
        success: true,
        transactionHash: receipt.hash,
        gasUsed: receipt.gasUsed.toString(),
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      return {
        success: false,
        error: handleContractError(error)
      };
    }
  }, [router, handleContractError]);

  // Execute exact output swap
  const swapExactOutputSingle = useCallback(async (
    tokenIn: string,
    tokenOut: string,
    amountOut: string,
    maxAmountIn: string,
    fee: number = POOL_CONFIG.defaultFee,
    tickSpacing: number = POOL_CONFIG.defaultTickSpacing
  ): Promise<SwapResult> => {
    try {
      if (!router) {
        throw new Error('Router not available');
      }

      const amountOutWei = ethers.parseEther(amountOut);
      const maxAmountInWei = ethers.parseEther(maxAmountIn);

      const gasEstimate = await router.estimateGas.swapExactOutputSingle(
        tokenIn,
        tokenOut,
        amountOutWei,
        maxAmountInWei,
        fee,
        tickSpacing
      );

      const tx = await router.swapExactOutputSingle(
        tokenIn,
        tokenOut,
        amountOutWei,
        maxAmountInWei,
        fee,
        tickSpacing,
        {
          gasLimit: gasEstimate * 120n / 100n
        }
      );

      const receipt = await tx.wait();
      
      return {
        success: true,
        transactionHash: receipt.hash,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      return {
        success: false,
        error: handleContractError(error)
      };
    }
  }, [router, handleContractError]);

  // Complete swap flow with slippage protection
  const performSwap = useCallback(async (
    tokenIn: string,
    tokenOut: string,
    amountIn: string,
    slippage: number = 0.5
  ): Promise<SwapResult> => {
    try {
      // 1. Get quote
      const amountOut = await getAmountOut(tokenIn, tokenOut, amountIn);
      
      // 2. Calculate minimum amount out with slippage
      const minAmountOut = (parseFloat(amountOut) * (100 - slippage)) / 100;
      
      // 3. Perform swap
      const result = await swapExactInputSingle(
        tokenIn,
        tokenOut,
        amountIn,
        minAmountOut.toString()
      );
      
      if (result.success) {
        return {
          ...result,
          amountOut: amountOut,
          minAmountOut: minAmountOut.toString()
        };
      } else {
        return result;
      }
    } catch (error) {
      return {
        success: false,
        error: handleContractError(error)
      };
    }
  }, [getAmountOut, swapExactInputSingle, handleContractError]);

  // Add liquidity
  const addLiquidity = useCallback(async (
    token0: string,
    token1: string,
    amount0: string,
    amount1: string,
    tickLower: number = -60,
    tickUpper: number = 60,
    fee: number = POOL_CONFIG.defaultFee,
    tickSpacing: number = POOL_CONFIG.defaultTickSpacing
  ): Promise<LiquidityResult> => {
    try {
      if (!router) {
        throw new Error('Router not available');
      }

      const amount0Wei = ethers.parseEther(amount0);
      const amount1Wei = ethers.parseEther(amount1);

      const gasEstimate = await router.estimateGas.addLiquidity(
        token0,
        token1,
        amount0Wei,
        amount1Wei,
        tickLower,
        tickUpper,
        fee,
        tickSpacing
      );

      const tx = await router.addLiquidity(
        token0,
        token1,
        amount0Wei,
        amount1Wei,
        tickLower,
        tickUpper,
        fee,
        tickSpacing,
        {
          gasLimit: gasEstimate * 120n / 100n
        }
      );

      const receipt = await tx.wait();
      
      // Parse liquidity amount from events
      const liquidityEvent = receipt.logs.find(log => {
        try {
          const parsed = router.interface.parseLog(log);
          return parsed?.name === 'LiquidityAdded';
        } catch {
          return false;
        }
      });

      let liquidity = '0';
      if (liquidityEvent) {
        const parsed = router.interface.parseLog(liquidityEvent);
        liquidity = parsed?.args.amount0?.toString() || '0';
      }

      // Get updated position
      const poolId = getPoolId(token0, token1, fee, tickSpacing);
      const position = await getUserPosition(await signer!.getAddress(), poolId);

      return {
        success: true,
        transactionHash: receipt.hash,
        gasUsed: receipt.gasUsed.toString(),
        liquidity: liquidity,
        position: position
      };
    } catch (error) {
      return {
        success: false,
        error: handleContractError(error)
      };
    }
  }, [router, signer, getPoolId, handleContractError]);

  // Remove liquidity
  const removeLiquidity = useCallback(async (
    token0: string,
    token1: string,
    liquidityAmount: string,
    tickLower: number = -60,
    tickUpper: number = 60,
    fee: number = POOL_CONFIG.defaultFee,
    tickSpacing: number = POOL_CONFIG.defaultTickSpacing
  ): Promise<LiquidityResult> => {
    try {
      if (!router) {
        throw new Error('Router not available');
      }

      const gasEstimate = await router.estimateGas.removeLiquidity(
        token0,
        token1,
        liquidityAmount,
        tickLower,
        tickUpper,
        fee,
        tickSpacing
      );

      const tx = await router.removeLiquidity(
        token0,
        token1,
        liquidityAmount,
        tickLower,
        tickUpper,
        fee,
        tickSpacing,
        {
          gasLimit: gasEstimate * 120n / 100n
        }
      );

      const receipt = await tx.wait();
      
      return {
        success: true,
        transactionHash: receipt.hash,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      return {
        success: false,
        error: handleContractError(error)
      };
    }
  }, [router, handleContractError]);

  // Get user position
  const getUserPosition = useCallback(async (
    userAddress: string,
    poolId: string
  ): Promise<UserPosition | null> => {
    try {
      if (!router) {
        throw new Error('Router not available');
      }

      const position = await router.getUserPosition(userAddress, poolId);
      
      return {
        tickLower: Number(position.tickLower),
        tickUpper: Number(position.tickUpper),
        liquidity: position.liquidity.toString(),
        salt: position.salt.toString(),
        exists: position.exists
      };
    } catch (error) {
      console.error('Failed to get user position:', error);
      return null;
    }
  }, [router]);

  // Get user statistics
  const getUserStats = useCallback(async (userAddress: string): Promise<UserStats | null> => {
    try {
      if (!router) {
        throw new Error('Router not available');
      }

      const stats = await router.getUserStats(userAddress);
      
      return {
        swapCount: stats.swapCount.toString(),
        volume: ethers.formatEther(stats.volume),
        referralReward: ethers.formatEther(stats.referralReward)
      };
    } catch (error) {
      console.error('Failed to get user stats:', error);
      return null;
    }
  }, [router]);

  // Set referrer
  const setReferrer = useCallback(async (
    userAddress: string,
    referrerAddress: string
  ): Promise<SwapResult> => {
    try {
      if (!router) {
        throw new Error('Router not available');
      }

      const gasEstimate = await router.estimateGas.setReferrer(userAddress, referrerAddress);
      
      const tx = await router.setReferrer(userAddress, referrerAddress, {
        gasLimit: gasEstimate * 120n / 100n
      });

      const receipt = await tx.wait();
      
      return {
        success: true,
        transactionHash: receipt.hash,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      return {
        success: false,
        error: handleContractError(error)
      };
    }
  }, [router, handleContractError]);

  // Claim referral rewards
  const claimReferralRewards = useCallback(async (): Promise<SwapResult> => {
    try {
      if (!router) {
        throw new Error('Router not available');
      }

      const gasEstimate = await router.estimateGas.claimReferralRewards();
      
      const tx = await router.claimReferralRewards({
        gasLimit: gasEstimate * 120n / 100n
      });

      const receipt = await tx.wait();
      
      return {
        success: true,
        transactionHash: receipt.hash,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      return {
        success: false,
        error: handleContractError(error)
      };
    }
  }, [router, handleContractError]);

  // Get token balance
  const getTokenBalance = useCallback(async (tokenAddress: string, userAddress: string): Promise<string> => {
    try {
      if (!provider) {
        throw new Error('Provider not available');
      }

      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
      
      const [balance, decimals] = await Promise.all([
        tokenContract.balanceOf(userAddress),
        tokenContract.decimals()
      ]);
      
      return ethers.formatUnits(balance, decimals);
    } catch (error) {
      console.error('Error getting token balance:', error);
      return '0';
    }
  }, [provider]);

  // Initialize data fetching
  useEffect(() => {
    fetchPools();
    fetchTokens();
  }, [fetchPools, fetchTokens]);

  return {
    // State
    pools,
    tokens,
    isLoading,
    error,
    provider,
    signer,
    router,
    poolManager,
    
    // Core functions
    fetchPools,
    fetchTokens,
    getAmountOut,
    getAmountIn,
    approveToken,
    swapExactInputSingle,
    swapExactOutputSingle,
    performSwap,
    addLiquidity,
    removeLiquidity,
    getUserPosition,
    getUserStats,
    setReferrer,
    claimReferralRewards,
    getTokenBalance,
    
    // Utilities
    getPoolId,
    handleContractError,
    retryTransaction
  };
};
