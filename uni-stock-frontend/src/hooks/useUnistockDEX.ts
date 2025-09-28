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
        
        // Initialize contracts - both need signer for transactions
        const routerContract = new ethers.Contract(CONTRACTS.ROUTER, ROUTER_ABI, newSigner);
        const poolManagerContract = new ethers.Contract(CONTRACTS.POOL_MANAGER, POOL_MANAGER_ABI, newSigner);
        
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
    } else if (error.message.includes('0x486aa307')) {
      return 'Pool does not exist or is not initialized';
    } else if (error.message.includes('0xe450d38c')) {
      return 'Router not authorized or pool not registered';
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

  // Create PoolKey struct
  const createPoolKey = useCallback((token0: string, token1: string, fee: number, tickSpacing: number) => {
    const [tokenA, tokenB] = token0 < token1 ? [token0, token1] : [token1, token0];
    return {
      currency0: tokenA,
      currency1: tokenB,
      fee: fee,
      tickSpacing: tickSpacing,
      hooks: ethers.ZeroAddress
    };
  }, []);

  // Check and configure contracts
  const ensureContractsConfigured = useCallback(async (): Promise<boolean> => {
    try {
      if (!poolManager || !router) {
        throw new Error('PoolManager or Router not available');
      }

      console.log('Checking contract configuration...');

      // Check if router is authorized in pool manager
      const isAuthorized = await (poolManager as any).authorizedCallers(CONTRACTS.ROUTER);
      console.log('Router authorization status:', isAuthorized);
      
      if (!isAuthorized) {
        console.log('Router not authorized, attempting to authorize...');
        try {
          const authTx = await (poolManager as any).setAuthorizedCaller(CONTRACTS.ROUTER, true);
          await authTx.wait();
          console.log('Router authorized successfully');
        } catch (authError) {
          console.log('Failed to authorize router (may not be admin):', authError);
          // Continue anyway
        }
      }

      // Check router admin
      try {
        const routerAdmin = await (router as any).admin();
        console.log('Router admin:', routerAdmin);
      } catch (err) {
        console.log('Could not get router admin:', err);
      }

      // Check pool manager admin
      try {
        const poolManagerAdmin = await (poolManager as any).admin();
        console.log('Pool manager admin:', poolManagerAdmin);
      } catch (err) {
        console.log('Could not get pool manager admin:', err);
      }

      return true;
    } catch (error) {
      console.log('Contract configuration check failed:', error);
      return false;
    }
  }, [poolManager, router]);

  // Initialize pool if it doesn't exist
  const initializePool = useCallback(async (
    token0: string,
    token1: string,
    fee: number,
    tickSpacing: number
  ): Promise<boolean> => {
    try {
      if (!poolManager || !router) {
        throw new Error('PoolManager or Router not available');
      }

      // Ensure contracts are configured
      await ensureContractsConfigured();

      const poolId = getPoolId(token0, token1, fee, tickSpacing);
      let poolInitialized = false;
      
      // Check if pool already exists and is properly initialized
      try {
        const poolInfo = await (poolManager as any).getPoolKey(poolId);
        console.log('Pool info:', poolInfo);
        
        // Check if pool is properly initialized (not all zeros)
        const isInitialized = poolInfo[0] !== ethers.ZeroAddress || poolInfo[1] !== ethers.ZeroAddress;
        
        if (isInitialized) {
          console.log('Pool already exists and is initialized');
          poolInitialized = true;
        } else {
          console.log('Pool exists but is not initialized, initializing...');
        }
      } catch (err) {
        console.log('Pool does not exist, initializing...');
      }

      // Create PoolKey struct
      const poolKey = createPoolKey(token0, token1, fee, tickSpacing);
      
      // Initialize the pool if not already initialized
      if (!poolInitialized) {
        // Initialize the pool with 1:1 price (sqrtPriceX96 = 79228162514264337593543950336)
        const sqrtPriceX96 = 79228162514264337593543950336n; // 1:1 price
        
        const tx = await (poolManager as any).initializePool(poolKey, sqrtPriceX96);

        console.log('Pool initialization transaction:', tx.hash);
        const receipt = await tx.wait();
        console.log('Pool initialized successfully');
      }
      
      // Always try to register the pool with the router (even if already registered)
      try {
        console.log('Registering pool with router...');
        const registerTx = await (router as any).registerPool(poolKey);
        await registerTx.wait();
        console.log('Pool registered with router successfully');
      } catch (registerError) {
        console.log('Pool registration failed (may already be registered):', registerError);
        // Continue anyway as the pool is initialized
      }
      
      return true;
    } catch (error) {
      console.error('Failed to initialize pool:', error);
      return false;
    }
  }, [poolManager, router, getPoolId, createPoolKey, ensureContractsConfigured]);

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
      const amountOutWei = await (router as any).getAmountOut(tokenIn, tokenOut, amountInWei, fee, tickSpacing);
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
      const amountInWei = await (router as any).getAmountIn(tokenIn, tokenOut, amountOutWei, fee, tickSpacing);
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
        const gasEstimate = await (token as any).estimateGas.approve(spender, amountWei);
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
      const gasEstimate = await (router as any).estimateGas.swapExactInputSingle(
        tokenIn,
        tokenOut,
        amountInWei,
        minAmountOutWei,
        fee,
        tickSpacing
      );

      // Execute swap
      const tx = await (router as any).swapExactInputSingle(
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

      const gasEstimate = await (router as any).estimateGas.swapExactOutputSingle(
        tokenIn,
        tokenOut,
        amountOutWei,
        maxAmountInWei,
        fee,
        tickSpacing
      );

      const tx = await (router as any).swapExactOutputSingle(
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

  // Add liquidity - approve both router and pool manager
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
      if (!router || !signer) {
        throw new Error('Router or Signer not available');
      }

      console.log('Starting addLiquidity process...');
      console.log('Router address:', CONTRACTS.ROUTER);
      console.log('Pool manager address:', CONTRACTS.POOL_MANAGER);

      const amount0Wei = ethers.parseEther(amount0);
      const amount1Wei = ethers.parseEther(amount1);

      // Initialize pool first if it doesn't exist
      const poolInitialized = await initializePool(token0, token1, fee, tickSpacing);
      console.log("🚀 ~ useUnistockDEX ~ poolInitialized:", poolInitialized)
      if (!poolInitialized) {
        throw new Error('Failed to initialize pool');
      }

      // Check if user is authorized to call the router
      const userAddress = await signer.getAddress();
      console.log('User address:', userAddress);
      
      // Check if user is authorized in router
      const isUserAuthorized = await (router as any).authorizedCallers(userAddress);
      console.log('User authorization status:', isUserAuthorized);
      
      if (!isUserAuthorized) {
        console.log('User not authorized, attempting to authorize...');
        try {
          const authTx = await (router as any).setAuthorizedCaller(userAddress, true);
          await authTx.wait();
          console.log('User authorized successfully');
        } catch (authError) {
          console.log('Failed to authorize user (may not be admin):', authError);
          // Continue anyway - user might be admin
        }
      }

      // Approve tokens for BOTH router and pool manager
      const token0Contract = new ethers.Contract(token0, ERC20_ABI, signer);
      const token1Contract = new ethers.Contract(token1, ERC20_ABI, signer);
      
      // Check and approve token0 for router
      const allowance0Router = await token0Contract.allowance(userAddress, CONTRACTS.ROUTER);
      console.log("🚀 ~ useUnistockDEX ~ allowance0Router:", allowance0Router)
      if (allowance0Router < amount0Wei) {
        console.log('Approving token0 for router...');
        const approveTx0 = await token0Contract.approve(CONTRACTS.ROUTER, amount0Wei);
        await approveTx0.wait();
      }
      
      // Check and approve token0 for pool manager
      const allowance0PoolManager = await token0Contract.allowance(userAddress, CONTRACTS.POOL_MANAGER);
      console.log("🚀 ~ useUnistockDEX ~ allowance0PoolManager:", allowance0PoolManager)
      if (allowance0PoolManager < amount0Wei) {
        console.log('Approving token0 for pool manager...');
        const approveTx0PM = await token0Contract.approve(CONTRACTS.POOL_MANAGER, amount0Wei);
        await approveTx0PM.wait();
      }
      
      // Check and approve token1 for router
      const allowance1Router = await token1Contract.allowance(userAddress, CONTRACTS.ROUTER);
      console.log("🚀 ~ useUnistockDEX ~ allowance1Router:", allowance1Router)
      if (allowance1Router < amount1Wei) {
        console.log('Approving token1 for router...');
        const approveTx1 = await token1Contract.approve(CONTRACTS.ROUTER, amount1Wei);
        await approveTx1.wait();
      }
      
      // Check and approve token1 for pool manager
      const allowance1PoolManager = await token1Contract.allowance(userAddress, CONTRACTS.POOL_MANAGER);
      console.log("🚀 ~ useUnistockDEX ~ allowance1PoolManager:", allowance1PoolManager)
      if (allowance1PoolManager < amount1Wei) {
        console.log('Approving token1 for pool manager...');
        const approveTx1PM = await token1Contract.approve(CONTRACTS.POOL_MANAGER, amount1Wei);
        await approveTx1PM.wait();
      }

      // Try to call addLiquidity with manual gas limit
      console.log('Attempting to add liquidity with manual gas limit...');
      console.log('Router contract:', router);
      console.log('Router address:', await router.getAddress());
      
      // Check if the function exists
      console.log('Router interface:', router.interface);
      console.log('Available functions:', router.interface.fragments.map(f => f.name));
      
      // Try calling addLiquidity with a fixed gas limit to bypass estimation
      console.log('Calling addLiquidity with fixed gas limit...');
      
      const tx = await (router as any).addLiquidity(
        token0,
        token1,
        amount0Wei,
        amount1Wei,
        tickLower,
        tickUpper,
        fee,
        tickSpacing,
        {
          gasLimit: 500000n // Fixed gas limit to bypass estimation
        }
      );

      console.log('Transaction sent:', tx.hash);

      const receipt = await tx.wait();
      
      // Parse liquidity amount from events
      const liquidityEvent = receipt.logs.find(log => {
        try {
          const parsed = (router as any).interface.parseLog(log);
          return parsed?.name === 'LiquidityAdded';
        } catch {
          return false;
        }
      });

      let liquidity = '0';
      if (liquidityEvent) {
        const parsed = (router as any).interface.parseLog(liquidityEvent);
        liquidity = parsed?.args.amount0?.toString() || '0';
      }

      // Get updated position
      const poolId = getPoolId(token0, token1, fee, tickSpacing);
      const position = await getUserPosition(userAddress, poolId);

      return {
        success: true,
        transactionHash: receipt.hash,
        gasUsed: receipt.gasUsed.toString(),
        liquidity: liquidity,
        position: position
      };
    } catch (error) {
      console.error('Add liquidity error:', error);
      return {
        success: false,
        error: handleContractError(error)
      };
    }
  }, [router, signer, getPoolId, handleContractError, poolManager, initializePool]);

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

      const liquidityAmountWei = ethers.parseUnits(liquidityAmount, 0); // liquidity is uint128

      const gasEstimate = await (router as any).estimateGas.removeLiquidity(
        token0,
        token1,
        liquidityAmountWei,
        tickLower,
        tickUpper,
        fee,
        tickSpacing
      );

      const tx = await (router as any).removeLiquidity(
        token0,
        token1,
        liquidityAmountWei,
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

      const position = await (router as any).getUserPosition(userAddress, poolId);
      
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

      const stats = await (router as any).getUserStats(userAddress);
      
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

      const gasEstimate = await (router as any).estimateGas.setReferrer(userAddress, referrerAddress);
      
      const tx = await (router as any).setReferrer(userAddress, referrerAddress, {
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

      const gasEstimate = await (router as any).estimateGas.claimReferralRewards();
      
      const tx = await (router as any).claimReferralRewards({
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
    initializePool,
    
    // Utilities
    getPoolId,
    handleContractError,
    retryTransaction
  };
};
