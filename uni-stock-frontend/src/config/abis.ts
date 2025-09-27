// Unistock DEX Contract ABIs
export const POOL_MANAGER_ABI = [
  // Events
  'event PoolInitialized(bytes32 indexed poolId, address indexed token0, address indexed token1, uint24 fee, int24 tickSpacing)',
  'event LiquidityAdded(address indexed user, address indexed token0, address indexed token1, uint256 amount0, uint256 amount1, int24 tickLower, int24 tickUpper)',
  'event LiquidityRemoved(address indexed user, address indexed token0, address indexed token1, uint256 amount0, uint256 amount1, int24 tickLower, int24 tickUpper)',
  
  // Functions
  'function initializePool(tuple(address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks) poolKey, uint160 sqrtPriceX96) external',
  'function isPoolActive(bytes32 poolId) external view returns (bool)',
  'function getPoolKey(bytes32 poolId) external view returns (tuple(address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks))',
  'function getPoolStats(bytes32 poolId) external view returns (uint256 volume, uint256 swapCount, uint256 liquidityVolume, uint256 currentLiquidity, uint256 feesCollected)',
  'function calculatePoolTVL(bytes32 poolId) external view returns (uint256 tvl0, uint256 tvl1)',
] as const;

export const ROUTER_ABI = [
  // Events
  'event UnistockSwap(address indexed user, address indexed tokenIn, address indexed tokenOut, uint256 amountIn, uint256 amountOut, uint24 fee)',
  'event LiquidityAdded(address indexed user, address indexed token0, address indexed token1, uint256 amount0, uint256 amount1, int24 tickLower, int24 tickUpper)',
  'event LiquidityRemoved(address indexed user, address indexed token0, address indexed token1, uint256 amount0, uint256 amount1, int24 tickLower, int24 tickUpper)',
  'event ReferrerSet(address indexed user, address indexed referrer)',
  'event ReferralRewardClaimed(address indexed user, uint256 amount)',
  
  // Swap Functions
  'function swapExactInputSingle(address tokenIn, address tokenOut, uint256 amountIn, uint256 minAmountOut, uint24 fee, int24 tickSpacing) external returns (uint256 amountOut)',
  'function swapExactOutputSingle(address tokenIn, address tokenOut, uint256 amountOut, uint256 maxAmountIn, uint24 fee, int24 tickSpacing) external returns (uint256 amountIn)',
  
  // Quote Functions
  'function getAmountOut(address tokenIn, address tokenOut, uint256 amountIn, uint24 fee, int24 tickSpacing) external view returns (uint256 amountOut)',
  'function getAmountIn(address tokenIn, address tokenOut, uint256 amountOut, uint24 fee, int24 tickSpacing) external view returns (uint256 amountIn)',
  
  // Liquidity Functions
  'function addLiquidity(address token0, address token1, uint256 amount0, uint256 amount1, int24 tickLower, int24 tickUpper, uint24 fee, int24 tickSpacing) external returns (uint256 liquidity)',
  'function removeLiquidity(address token0, address token1, uint256 liquidityAmount, int24 tickLower, int24 tickUpper, uint24 fee, int24 tickSpacing) external returns (uint256 amount0, uint256 amount1)',
  
  // Position Functions
  'function getUserPosition(address userAddress, bytes32 poolId) external view returns (int24 tickLower, int24 tickUpper, uint256 liquidity, uint256 salt, bool exists)',
  
  // Referral Functions
  'function setReferrer(address userAddress, address referrerAddress) external',
  'function claimReferralRewards() external',
  'function getUserStats(address userAddress) external view returns (uint256 swapCount, uint256 volume, uint256 referralReward)',
] as const;

// ERC20 ABI for token interactions
export const ERC20_ABI = [
  'function balanceOf(address owner) external view returns (uint256)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function transfer(address to, uint256 amount) external returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) external returns (bool)',
  'function decimals() external view returns (uint8)',
  'function symbol() external view returns (string)',
  'function name() external view returns (string)',
  'function totalSupply() external view returns (uint256)',
] as const;

// Types for TypeScript
export interface PoolKey {
  currency0: string;
  currency1: string;
  fee: number;
  tickSpacing: number;
  hooks: string;
}

export interface PoolStats {
  volume: string;
  swapCount: string;
  liquidityVolume: string;
  currentLiquidity: string;
  feesCollected: string;
}

export interface PoolTVL {
  token0: string;
  token1: string;
}

export interface UserStats {
  swapCount: string;
  volume: string;
  referralReward: string;
}

export interface UserPosition {
  tickLower: number;
  tickUpper: number;
  liquidity: string;
  salt: string;
  exists: boolean;
}

export interface SwapResult {
  success: boolean;
  transactionHash?: string;
  gasUsed?: string;
  blockNumber?: number;
  amountOut?: string;
  minAmountOut?: string;
  error?: string;
}

export interface LiquidityResult {
  success: boolean;
  transactionHash?: string;
  gasUsed?: string;
  liquidity?: string;
  position?: UserPosition;
  error?: string;
}
