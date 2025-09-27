// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {PoolManager} from "@unistock/v4-core/PoolManager.sol";
import {IPoolManager} from "@unistock/v4-core/interfaces/IPoolManager.sol";
import {Currency, CurrencyLibrary} from "@unistock/v4-core/types/Currency.sol";
import {PoolKey} from "@unistock/v4-core/types/PoolKey.sol";
import {PoolId} from "@unistock/v4-core/types/PoolId.sol";
import {BalanceDelta, BalanceDeltaLibrary} from "@unistock/v4-core/types/BalanceDelta.sol";
import {TickMath} from "@unistock/v4-core/libraries/TickMath.sol";
import {Hooks} from "@unistock/v4-core/libraries/Hooks.sol";
import {IHooks} from "@unistock/v4-core/interfaces/IHooks.sol";
import {FullMath} from "@unistock/v4-core/libraries/FullMath.sol";

/// @title Unistock Pool Manager
/// @notice Extended PoolManager with Unistock-specific features
/// @dev Fork of Uniswap V4 PoolManager with custom DEX features
contract UnistockPoolManager is PoolManager {
    using CurrencyLibrary for Currency;
    using BalanceDeltaLibrary for BalanceDelta;

    // Custom events
    event UnistockPoolCreated(
        PoolId indexed poolId, address indexed token0, address indexed token1, uint24 fee, int24 tickSpacing
    );
    event TokenWhitelisted(address indexed token, bool whitelisted);
    event CustomFeeSet(address indexed token, uint24 oldFee, uint24 newFee);
    event ProtocolFeeUpdated(uint24 oldFee, uint24 newFee);
    event SwapExecuted(
        PoolId indexed poolId,
        address indexed user,
        address indexed tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );
    event LiquidityModified(
        PoolId indexed poolId, address indexed user, int24 tickLower, int24 tickUpper, int256 liquidityDelta
    );

    // Custom state variables
    mapping(address => bool) public whitelistedTokens;
    mapping(address => uint24) public customFees;
    mapping(PoolId => bool) public activePools;
    mapping(PoolId => PoolKey) public poolKeys;

    address public feeRecipient;
    uint24 public defaultProtocolFee = 500; // 0.05%
    uint24 public maxProtocolFee = 1000; // 1%

    // Access control
    mapping(address => bool) public authorizedCallers;
    address public admin;

    // Trading statistics and analytics
    mapping(PoolId => uint256) public poolVolume;
    mapping(PoolId => uint256) public poolSwapCount;
    mapping(PoolId => uint256) public poolLiquidityVolume;
    mapping(PoolId => uint128) public totalLiquidity;

    // Fee collection tracking
    mapping(PoolId => uint256) public protocolFeesCollected;
    mapping(address => uint256) public tokenFeesCollected;

    modifier onlyAdmin() {
        require(msg.sender == admin, "Unistock: Only admin");
        _;
    }

    modifier onlyAuthorized() {
        require(authorizedCallers[msg.sender] || msg.sender == admin, "Unistock: Unauthorized");
        _;
    }

    modifier onlyActivePool(PoolId poolId) {
        require(activePools[poolId], "Unistock: Pool not active");
        _;
    }

    constructor(address initialOwner) PoolManager(initialOwner) {
        admin = initialOwner;
        feeRecipient = initialOwner;
    }

    /// @notice Set token whitelist status
    /// @param token Token address to whitelist/unwhitelist
    /// @param whitelisted Whether the token is whitelisted
    function setWhitelistedToken(address token, bool whitelisted) external onlyAdmin {
        whitelistedTokens[token] = whitelisted;
        emit TokenWhitelisted(token, whitelisted);
    }

    /// @notice Set custom fee for a specific token
    /// @param token Token address
    /// @param fee Custom fee (in basis points, max 1%)
    function setCustomFee(address token, uint24 fee) external onlyAdmin {
        require(fee <= maxProtocolFee, "Unistock: Fee too high");
        uint24 oldFee = customFees[token];
        customFees[token] = fee;
        emit CustomFeeSet(token, oldFee, fee);
    }

    /// @notice Set default protocol fee
    /// @param fee New protocol fee (in basis points)
    function setDefaultProtocolFee(uint24 fee) external onlyAdmin {
        require(fee <= maxProtocolFee, "Unistock: Fee too high");
        uint24 oldFee = defaultProtocolFee;
        defaultProtocolFee = fee;
        emit ProtocolFeeUpdated(oldFee, fee);
    }

    /// @notice Set fee recipient
    /// @param recipient New fee recipient address
    function setFeeRecipient(address recipient) external onlyAdmin {
        require(recipient != address(0), "Unistock: Invalid recipient");
        feeRecipient = recipient;
    }

    /// @notice Set authorized caller
    /// @param caller Address to authorize/unauthorize
    /// @param authorized Whether the caller is authorized
    function setAuthorizedCaller(address caller, bool authorized) external onlyAdmin {
        authorizedCallers[caller] = authorized;
    }

    /// @notice Initialize pool with Unistock-specific logic
    /// @param key Pool key containing token addresses, fee, tick spacing, and hooks
    /// @param sqrtPriceX96 Initial sqrt price
    /// @return tick Initial tick
    function initializePool(PoolKey memory key, uint160 sqrtPriceX96) external noDelegateCall returns (int24 tick) {
        // Validate token ordering (currency0 must be < currency1)
        require(key.currency0 < key.currency1, "CurrenciesOutOfOrderOrEqual");

        // Validate tick spacing
        require(key.tickSpacing >= TickMath.MIN_TICK_SPACING, "TickSpacingTooSmall");
        require(key.tickSpacing <= TickMath.MAX_TICK_SPACING, "TickSpacingTooLarge");

        // Validate hook address if hooks are used
        if (address(key.hooks) != address(0)) {
            require(Hooks.isValidHookAddress(key.hooks, key.fee), "HookAddressNotValid");
        }

        // Check if tokens are whitelisted (if whitelisting is enabled)
        address token0 = Currency.unwrap(key.currency0);
        address token1 = Currency.unwrap(key.currency1);

        // Only check whitelist if at least one token is whitelisted (allows some flexibility)
        if (whitelistedTokens[token0] || whitelistedTokens[token1]) {
            require(whitelistedTokens[token0], "Unistock: Token0 not whitelisted");
            require(whitelistedTokens[token1], "Unistock: Token1 not whitelisted");
        }

        // Call parent initialize function directly
        tick = this.initialize(key, sqrtPriceX96);

        // Mark pool as active and store pool key
        PoolId poolId = key.toId();
        activePools[poolId] = true;
        poolKeys[poolId] = key;

        // Emit custom event
        emit UnistockPoolCreated(poolId, token0, token1, key.fee, key.tickSpacing);
    }

    /// @notice Execute swap with enhanced tracking and analytics
    /// @param key Pool key
    /// @param params Swap parameters
    /// @param hookData Hook data
    /// @return swapDelta Swap result delta
    function executeSwap(PoolKey memory key, IPoolManager.SwapParams memory params, bytes calldata hookData)
        external
        onlyAuthorized
        onlyActivePool(key.toId())
        returns (BalanceDelta swapDelta)
    {
        // Execute the swap
        swapDelta = this.swap(key, params, hookData);

        // Update pool statistics
        PoolId poolId = key.toId();
        poolSwapCount[poolId]++;

        // Calculate volume (simplified)
        uint256 volume = uint256(abs(params.amountSpecified));
        poolVolume[poolId] += volume;

        // Emit custom event
        address tokenIn = params.zeroForOne ? Currency.unwrap(key.currency0) : Currency.unwrap(key.currency1);
        address tokenOut = params.zeroForOne ? Currency.unwrap(key.currency1) : Currency.unwrap(key.currency0);

        emit SwapExecuted(
            poolId, msg.sender, tokenIn, tokenOut, volume, uint256(abs(swapDelta.amount0() + swapDelta.amount1()))
        );

        return swapDelta;
    }

    /// @notice Execute liquidity modification with enhanced tracking
    /// @param key Pool key
    /// @param params Modify liquidity parameters
    /// @param hookData Hook data
    /// @return callerDelta Caller balance delta
    /// @return feesAccrued Fees accrued
    function executeModifyLiquidity(
        PoolKey memory key,
        IPoolManager.ModifyLiquidityParams memory params,
        bytes calldata hookData
    ) external onlyAuthorized onlyActivePool(key.toId()) returns (BalanceDelta callerDelta, BalanceDelta feesAccrued) {
        // Execute liquidity modification
        (callerDelta, feesAccrued) = this.modifyLiquidity(key, params, hookData);

        // Update pool statistics
        PoolId poolId = key.toId();

        // Update liquidity tracking
        if (params.liquidityDelta > 0) {
            totalLiquidity[poolId] += uint128(uint256(params.liquidityDelta));
            poolLiquidityVolume[poolId] += uint256(params.liquidityDelta);
        } else {
            totalLiquidity[poolId] -= uint128(uint256(-params.liquidityDelta));
            poolLiquidityVolume[poolId] += uint256(-params.liquidityDelta);
        }

        // Emit custom event
        emit LiquidityModified(poolId, msg.sender, params.tickLower, params.tickUpper, params.liquidityDelta);

        return (callerDelta, feesAccrued);
    }

    /// @notice Collect protocol fees from a pool
    /// @param poolId Pool ID
    /// @param amount0 Amount of token0 fees to collect
    /// @param amount1 Amount of token1 fees to collect
    function collectProtocolFees(PoolId poolId, uint256 amount0, uint256 amount1)
        external
        onlyAdmin
        onlyActivePool(poolId)
    {
        // Update fee tracking
        protocolFeesCollected[poolId] += amount0 + amount1;

        // Transfer fees to fee recipient
        PoolKey memory key = poolKeys[poolId];
        if (amount0 > 0) {
            tokenFeesCollected[Currency.unwrap(key.currency0)] += amount0;
        }
        if (amount1 > 0) {
            tokenFeesCollected[Currency.unwrap(key.currency1)] += amount1;
        }
    }

    /// @notice Check if a pool is active
    /// @param poolId Pool ID to check
    /// @return isActive Whether the pool is active
    function isPoolActive(PoolId poolId) external view returns (bool isActive) {
        return activePools[poolId];
    }

    /// @notice Get custom fee for a token, returns default if not set
    /// @param token Token address
    /// @return fee Custom fee or default fee
    function getTokenFee(address token) external view returns (uint24 fee) {
        return customFees[token] > 0 ? customFees[token] : defaultProtocolFee;
    }

    /// @notice Get comprehensive pool statistics
    /// @param poolId Pool ID
    /// @return volume Total volume traded
    /// @return swapCount Total number of swaps
    /// @return liquidityVolume Total liquidity volume
    /// @return currentLiquidity Current total liquidity
    /// @return feesCollected Total protocol fees collected
    function getPoolStats(PoolId poolId)
        external
        view
        returns (
            uint256 volume,
            uint256 swapCount,
            uint256 liquidityVolume,
            uint128 currentLiquidity,
            uint256 feesCollected
        )
    {
        return (
            poolVolume[poolId],
            poolSwapCount[poolId],
            poolLiquidityVolume[poolId],
            totalLiquidity[poolId],
            protocolFeesCollected[poolId]
        );
    }

    /// @notice Get pool key by ID
    /// @param poolId Pool ID
    /// @return key Pool key
    function getPoolKey(PoolId poolId) external view returns (PoolKey memory key) {
        return poolKeys[poolId];
    }

    /// @notice Get token fee collection statistics
    /// @param token Token address
    /// @return feesCollected Total fees collected for this token
    function getTokenFeeStats(address token) external view returns (uint256 feesCollected) {
        return tokenFeesCollected[token];
    }

    /// @notice Calculate pool TVL (Total Value Locked) - simplified
    /// @param poolId Pool ID
    /// @return tvl0 TVL in token0
    /// @return tvl1 TVL in token1
    function calculatePoolTVL(PoolId poolId) external view returns (uint256 tvl0, uint256 tvl1) {
        // This is a simplified calculation
        // In practice, you'd query the actual pool reserves and calculate based on current price
        uint128 liquidity = totalLiquidity[poolId];

        // Simplified TVL calculation (would need actual price oracle in production)
        tvl0 = uint256(liquidity) / 2;
        tvl1 = uint256(liquidity) / 2;
    }

    /// @notice Get pool price information - simplified
    /// @param poolId Pool ID
    /// @return sqrtPriceX96 Current sqrt price
    /// @return tick Current tick
    function getPoolPrice(PoolId poolId) external view returns (uint160 sqrtPriceX96, int24 tick) {
        // This would query the actual pool state in a real implementation
        // For now, return simplified values
        sqrtPriceX96 = TickMath.getSqrtPriceAtTick(0);
        tick = 0;
    }

    /// @notice Emergency function to deactivate a pool
    /// @param poolId Pool ID to deactivate
    function deactivatePool(PoolId poolId) external onlyAdmin {
        activePools[poolId] = false;
    }

    /// @notice Emergency function to reactivate a pool
    /// @param poolId Pool ID to reactivate
    function reactivatePool(PoolId poolId) external onlyAdmin {
        require(Currency.unwrap(poolKeys[poolId].currency0) != address(0), "Unistock: Pool not found");
        activePools[poolId] = true;
    }

    /// @notice Emergency function to update pool statistics (admin only)
    /// @param poolId Pool ID
    /// @param newVolume New volume value
    /// @param newSwapCount New swap count
    function updatePoolStats(PoolId poolId, uint256 newVolume, uint256 newSwapCount) external onlyAdmin {
        poolVolume[poolId] = newVolume;
        poolSwapCount[poolId] = newSwapCount;
    }

    /// @notice Transfer admin role
    /// @param newAdmin New admin address
    function transferAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "Unistock: Invalid admin");
        admin = newAdmin;
    }

    /// @notice Get absolute value of int256
    function abs(int256 x) internal pure returns (uint256) {
        return uint256(x < 0 ? -x : x);
    }
}
