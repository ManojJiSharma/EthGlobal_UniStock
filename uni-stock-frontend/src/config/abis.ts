import { ethers } from 'ethers';

// ERC20 ABI for token operations
export const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
  'function totalSupply() view returns (uint256)',
] as const;

// Pool Manager ABI - Updated with all required functions
export const POOL_MANAGER_ABI = [
  // Events
  'event PoolInitialized(bytes32 indexed poolId, address indexed token0, address indexed token1, uint24 fee, int24 tickSpacing)',
  'event LiquidityAdded(address indexed user, address indexed token0, address indexed token1, uint256 amount0, uint256 amount1, int24 tickLower, int24 tickUpper)',
  'event LiquidityRemoved(address indexed user, address indexed token0, address indexed token1, uint256 amount0, uint256 amount1, int24 tickLower, int24 tickUpper)',
  
  // Core Pool Manager Functions
  'function initializePool(tuple(address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks) poolKey, uint160 sqrtPriceX96) external',
  'function isPoolActive(bytes32 poolId) external view returns (bool)',
  'function getPoolKey(bytes32 poolId) external view returns (tuple(address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks))',
  'function getPoolStats(bytes32 poolId) external view returns (uint256 volume, uint256 swapCount, uint256 liquidityVolume, uint256 currentLiquidity, uint256 feesCollected)',
  'function calculatePoolTVL(bytes32 poolId) external view returns (uint256 tvl0, uint256 tvl1)',
  
  // Unlock mechanism - This is the missing function!
  'function unlock(bytes calldata data) external returns (bytes memory)',
  
  // Liquidity management - This is the missing function!
  'function modifyLiquidity(tuple(address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks) poolKey, tuple(int24 tickLower, int24 tickUpper, int256 liquidityDelta, uint256 salt) params, bytes calldata hookData) external returns (tuple(int128, int128) delta, tuple(int128, int128) feesAccrued)',
  
  // Swap functions
  'function swap(tuple(address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks) poolKey, tuple(bool zeroForOne, int256 amountSpecified, uint160 sqrtPriceLimitX96) params, bytes calldata hookData) external returns (tuple(int128, int128) delta)',
  
  // Token settlement functions
  'function settle(address currency) external payable returns (uint256 paid)',
  'function take(address currency, address to, uint256 amount) external',
  'function sync(address currency) external',
  
  // Admin Functions
  'function setAuthorizedCaller(address caller, bool authorized) external',
  'function authorizedCallers(address) external view returns (bool)',
  'function admin() external view returns (address)',
  'function transferAdmin(address newAdmin) external',
] as const;

// Router ABI - Updated to match UnistockRouter.sol
export const ROUTER_ABI = [
  // Events
  'event UnistockSwap(address indexed user, address indexed tokenIn, address indexed tokenOut, uint256 amountIn, uint256 amountOut)',
  'event LiquidityAdded(address indexed user, address indexed token0, address indexed token1, uint256 amount0, uint256 amount1, int24 tickLower, int24 tickUpper)',
  'event LiquidityRemoved(address indexed user, address indexed token0, address indexed token1, uint256 amount0, uint256 amount1, int24 tickLower, int24 tickUpper)',
  
  // Core Router Functions
  'function addLiquidity(address token0, address token1, uint256 amount0, uint256 amount1, int24 tickLower, int24 tickUpper, uint24 fee, int24 tickSpacing) external returns (uint128 liquidity)',
  'function removeLiquidity(address token0, address token1, uint128 liquidityAmount, int24 tickLower, int24 tickUpper, uint24 fee, int24 tickSpacing) external',
  'function swapExactInputSingle(address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOutMin, uint24 fee, int24 tickSpacing) external returns (uint256 amountOut)',
  'function swapExactOutputSingle(address tokenIn, address tokenOut, uint256 amountOut, uint256 amountInMax, uint24 fee, int24 tickSpacing) external returns (uint256 amountIn)',
  
  // Quote Functions
  'function getAmountOut(address tokenIn, address tokenOut, uint256 amountIn, uint24 fee, int24 tickSpacing) external view returns (uint256 amountOut)',
  'function getAmountIn(address tokenIn, address tokenOut, uint256 amountOut, uint24 fee, int24 tickSpacing) external view returns (uint256 amountIn)',
  
  // Position Management
  'function getUserPosition(address user, bytes32 poolId) external view returns (tuple(int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 salt, bool exists))',
  'function getUserStats(address user) external view returns (tuple(uint256 swapCount, uint256 volume, uint256 referralReward))',
  
  // Referral System
  'function setReferrer(address user, address referrer) external',
  'function claimReferralRewards() external',
  
  // Admin Functions
  'function setAuthorizedCaller(address caller, bool authorized) external',
  'function setMaxSlippage(uint256 maxSlippage) external',
  'function setSwapFee(uint24 swapFee) external',
  'function setFeeRecipient(address feeRecipient) external',
  'function setReferralRate(uint256 referralRate) external',
  'function registerPool(tuple(address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks) poolKey) external',
  'function transferAdmin(address newAdmin) external',
  'function emergencyPause() external',
  
  // View Functions
  'function authorizedCallers(address) external view returns (bool)',
  'function maxSlippage() external view returns (uint256)',
  'function swapFee() external view returns (uint24)',
  'function feeRecipient() external view returns (address)',
  'function referralRate() external view returns (uint256)',
  'function admin() external view returns (address)',
  'function poolConfigs(bytes32) external view returns (tuple(uint24 fee, int24 tickSpacing, bool active))',
  'function positions(address, bytes32) external view returns (tuple(int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 salt, bool exists))',
  'function referrers(address) external view returns (address)',
  'function referralRewards(address) external view returns (uint256)',
  'function userSwapCount(address) external view returns (uint256)',
  'function totalVolume() external view returns (uint256)',
  'function swapFeeInfo(address) external view returns (tuple(address token, uint256 amount))',
  
  // Internal Callback Functions
  'function unlockCallback(bytes calldata data) external returns (bytes memory)',
  'function decodeSwapCallback(bytes calldata data) external pure returns (tuple(tuple(address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks), tuple(bool zeroForOne, int256 amountSpecified, uint160 sqrtPriceLimitX96), bool, uint256, address))',
  'function decodeLiquidityCallback(bytes calldata data) external pure returns (tuple(tuple(address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks), tuple(int24 tickLower, int24 tickUpper, int256 liquidityDelta, uint256 salt), address))',
] as const;

// LzLiquidation ABI - Based on the actual contract
export const LZ_LIQUIDATION_ABI = [
  // Core Lending Functions
  'function supply(uint256 _amount, address _token) external',
  'function redeem(uint256 _amount, address payable _lToken) external returns (uint256)',
  'function borrow(uint256 _amount, address _token) external',
  'function repayBorrow(uint256 _amount, address _lToken, uint8 chainType, uint256 srcEid) external',
  'function liquidateBorrow(address borrower, uint256 repayAmount, address lTokenCollateral, address underlying, uint8 chainType, uint256 srcEid) external',
  
  // View Functions
  'function getHypotheticalAccountLiquidityCollateral(address account, address lTokenModify, uint256 redeemTokens, uint256 borrowAmount) external view returns (uint256, uint256)',
  'function totalInvestment(address account, address lToken) external view returns (uint256)',
  'function borrowBalance(address account, address lToken) external view returns (tuple(uint256 amount, uint256 borrowIndex))',
  'function lzSuppliedAssets(address account) external view returns (address[] memory)',
  'function lzSuppliedAssetIndex(address account, address lToken) external view returns (uint256)',
  'function underlyingTolToken(address underlying) external view returns (address)',
  'function lTokenToUnderlying(address lToken) external view returns (address)',
  'function borrowWithInterest(address borrower, address lToken) external view returns (uint256)',
  'function borrowWithInterestSame(address borrower, address lToken) external view returns (uint256)',
  'function lendAccrued(address account) external view returns (uint256)',
  
  // Admin Functions
  'function addSupportedTokens(address underlying, address lToken) external',
  'function addUnderlyingToDestUnderlying(address underlying, address destUnderlying, uint256 destId) external',
  'function enterMarkets(address _lToken) external',
  'function claimLend(address[] memory holders, address[] memory lTokens, bool borrowers, bool suppliers) external',
  'function withdraw(uint256 amount) external',
  'function setGasLimit(uint128 _gasLimit) external',
  
  // Events
  'event SupplySuccess(address indexed supplier, address indexed lToken, uint256 supplyAmount, uint256 supplyTokens)',
  'event RedeemSuccess(address indexed redeemer, address indexed lToken, uint256 redeemAmount, uint256 redeemTokens)',
  'event BorrowSuccess(address indexed borrower, address indexed lToken, uint256 accountBorrow)',
  'event RepaySuccess(address indexed repayBorrowPayer, address indexed lToken, uint256 repayBorrowAccountBorrows)',
  'event LiquidateBorrow(address indexed liquidator, address indexed lToken, address indexed borrower, address lTokenCollateral)',
] as const;

// L-Token ABI (Compound-style lending token)
export const L_TOKEN_ABI = [
  // Core Lending Functions
  'function mint(uint256 mintAmount) external returns (uint256)',
  'function redeem(uint256 redeemTokens) external returns (uint256)',
  'function redeemUnderlying(uint256 redeemAmount) external returns (uint256)',
  'function borrow(uint256 borrowAmount) external returns (uint256)',
  'function repayBorrow(uint256 repayAmount) external returns (uint256)',
  'function repayBorrowBehalf(address borrower, uint256 repayAmount) external returns (uint256)',
  'function liquidateBorrow(address borrower, uint256 repayAmount, address cTokenCollateral) external returns (uint256)',
  
  // View Functions
  'function balanceOf(address owner) external view returns (uint256)',
  'function borrowBalanceStored(address account) external view returns (uint256)',
  'function exchangeRateStored() external view returns (uint256)',
  'function totalSupply() external view returns (uint256)',
  'function totalBorrows() external view returns (uint256)',
  'function totalReserves() external view returns (uint256)',
  'function getCash() external view returns (uint256)',
  'function accrueInterest() external returns (uint256)',
  'function borrowRatePerBlock() external view returns (uint256)',
  'function supplyRatePerBlock() external view returns (uint256)',
  'function totalBorrowsCurrent() external returns (uint256)',
  'function borrowBalanceCurrent(address account) external returns (uint256)',
  'function totalSupplyCurrent() external returns (uint256)',
  'function exchangeRateCurrent() external returns (uint256)',
  'function getAccountSnapshot(address account) external view returns (uint256, uint256, uint256, uint256)',
  'function borrowRatePerBlock() external view returns (uint256)',
  'function supplyRatePerBlock() external view returns (uint256)',
  'function totalBorrowsCurrent() external returns (uint256)',
  'function borrowBalanceCurrent(address account) external returns (uint256)',
  'function totalSupplyCurrent() external returns (uint256)',
  'function exchangeRateCurrent() external returns (uint256)',
  'function getAccountSnapshot(address account) external view returns (uint256, uint256, uint256, uint256)',
  
  // Events
  'event Mint(address minter, uint256 mintAmount, uint256 mintTokens)',
  'event Redeem(address redeemer, uint256 redeemAmount, uint256 redeemTokens)',
  'event Borrow(address borrower, uint256 borrowAmount, uint256 accountBorrows, uint256 totalBorrows)',
  'event RepayBorrow(address payer, address borrower, uint256 repayAmount, uint256 accountBorrows, uint256 totalBorrows)',
  'event LiquidateBorrow(address liquidator, address borrower, uint256 repayAmount, address cTokenCollateral, uint256 seizeTokens)',
] as const;

// Comprehensive Lending ABI for Sepolia
export const LENDING_ABI = LZ_LIQUIDATION_ABI;

// Comptroller ABI for Sepolia
export const COMPTROLLER_ABI = [
  'function enterMarkets(address[] calldata cTokens) external returns (uint256[] memory)',
  'function exitMarket(address cToken) external returns (uint256)',
  'function getAccountLiquidity(address account) external view returns (uint256, uint256, uint256)',
  'function getAssetsIn(address account) external view returns (address[] memory)',
  'function checkMembership(address account, address cToken) external view returns (bool)',
  'function getHypotheticalAccountLiquidity(address account, address cTokenModify, uint256 redeemTokens, uint256 borrowAmount) external view returns (uint256, uint256, uint256)',
  'function closeFactorMantissa() external view returns (uint256)',
  'function liquidationIncentiveMantissa() external view returns (uint256)',
  'function oracle() external view returns (address)',
  'function pauseGuardian() external view returns (address)',
  'function _setPauseGuardian(address newPauseGuardian) external returns (uint256)',
  'function _setMintPaused(address cToken, bool state) external returns (bool)',
  'function _setBorrowPaused(address cToken, bool state) external returns (bool)',
  'function _setTransferPaused(bool state) external returns (bool)',
  'function _setSeizePaused(bool state) external returns (bool)',
  'function _become(address unitroller) external',
  'function _setPriceOracle(address newOracle) external returns (uint256)',
  'function _setCloseFactor(uint256 newCloseFactorMantissa) external returns (uint256)',
  'function _setCollateralFactor(address cToken, uint256 newCollateralFactorMantissa) external returns (uint256)',
  'function _setLiquidationIncentive(uint256 newLiquidationIncentiveMantissa) external returns (uint256)',
  'function _setMaxAssets(uint256 newMaxAssets) external returns (uint256)',
  'function _setLiquidationIncentive(uint256 newLiquidationIncentiveMantissa) external returns (uint256)',
  'function _supportMarket(address cToken) external returns (uint256)',
  'function _setMarketBorrowCaps(address[] calldata cTokens, uint256[] calldata newBorrowCaps) external',
  'function _setMarketSupplyCaps(address[] calldata cTokens, uint256[] calldata newSupplyCaps) external',
  'function _setBorrowCapGuardian(address newBorrowCapGuardian) external',
  'function _setSupplyCapGuardian(address newSupplyCapGuardian) external',
  'function _setPauseGuardian(address newPauseGuardian) external returns (uint256)',
  'function _setMintPaused(address cToken, bool state) external returns (bool)',
  'function _setBorrowPaused(address cToken, bool state) external returns (bool)',
  'function _setTransferPaused(bool state) external returns (bool)',
  'function _setSeizePaused(bool state) external returns (bool)',
  'function _become(address unitroller) external',
  'function _setPriceOracle(address newOracle) external returns (uint256)',
  'function _setCloseFactor(uint256 newCloseFactorMantissa) external returns (uint256)',
  'function _setCollateralFactor(address cToken, uint256 newCollateralFactorMantissa) external returns (uint256)',
  'function _setLiquidationIncentive(uint256 newLiquidationIncentiveMantissa) external returns (uint256)',
  'function _setMaxAssets(uint256 newMaxAssets) external returns (uint256)',
  'function _setLiquidationIncentive(uint256 newLiquidationIncentiveMantissa) external returns (uint256)',
  'function _supportMarket(address cToken) external returns (uint256)',
  'function _setMarketBorrowCaps(address[] calldata cTokens, uint256[] calldata newBorrowCaps) external',
  'function _setMarketSupplyCaps(address[] calldata cTokens, uint256[] calldata newSupplyCaps) external',
  'function _setBorrowCapGuardian(address newBorrowCapGuardian) external',
  'function _setSupplyCapGuardian(address newSupplyCapGuardian) external',
] as const;

// Type definitions
export interface PoolKey {
  currency0: string;
  currency1: string;
  fee: number;
  tickSpacing: number;
  hooks: string;
}

export interface PoolStats {
  volume: bigint;
  swapCount: bigint;
  liquidityVolume: bigint;
  currentLiquidity: bigint;
  feesCollected: bigint;
}

export interface PoolTVL {
  tvl0: bigint;
  tvl1: bigint;
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
  error?: string;
  amountOut?: string;
  minAmountOut?: string;
}

export interface LiquidityResult {
  success: boolean;
  transactionHash?: string;
  gasUsed?: string;
  liquidity?: string;
  position?: UserPosition | null;
  error?: string;
}

export interface LendingResult {
  success: boolean;
  transactionHash?: string;
  gasUsed?: string;
  error?: string;
}

export interface AccountLiquidity {
  collateral: bigint;
  borrows: bigint;
  healthFactor: bigint;
}

export interface UserLendingData {
  healthFactor: string;
  totalInvestment: string;
  borrowed: string;
}

export interface LendingMarket {
  asset: string;
  symbol: string;
  name: string;
  decimals: number;
  lTokenAddress: string;
  supplyRate: string;
  borrowRate: string;
  totalSupply: string;
  totalBorrows: string;
  collateralFactor: string;
  isActive: boolean;
}
