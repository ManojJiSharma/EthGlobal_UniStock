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

    /// @notice Set protocol fee
    /// @param fee New protocol fee (in basis points)
    function setProtocolFee(uint24 fee) external onlyAdmin {
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
    /// @param caller Caller address
    /// @param authorized Whether the caller is authorized
    function setAuthorizedCaller(address caller, bool authorized) external onlyAdmin {
        authorizedCallers[caller] = authorized;
    }

    /// @notice Get token fee (custom or default)
    /// @param token Token address
    /// @return fee Fee for the token
    function getTokenFee(address token) public view returns (uint24 fee) {
        return customFees[token] > 0 ? customFees[token] : defaultProtocolFee;
    }

    /// @notice Initialize a new pool
    /// @param key Pool key
    /// @param sqrtPriceX96 Initial sqrt price
    /// @return tick Initial tick
    function initializePool(PoolKey memory key, uint160 sqrtPriceX96) external onlyAuthorized returns (int24 tick) {
        // Check if tokens are whitelisted
        require(whitelistedTokens[Currency.unwrap(key.currency0)], "Unistock: Token0 not whitelisted");
        require(whitelistedTokens[Currency.unwrap(key.currency1)], "Unistock: Token1 not whitelisted");

        // Initialize the pool
        tick = super.initialize(key, sqrtPriceX96);

        // Mark pool as active
        PoolId poolId = key.toId();
        activePools[poolId] = true;
        poolKeys[poolId] = key;

        // Emit custom event
        emit UnistockPoolCreated(
            poolId,
            Currency.unwrap(key.currency0),
            Currency.unwrap(key.currency1),
            key.fee,
            key.tickSpacing
        );
    }

    /// @notice Check if pool is active
    /// @param poolId Pool ID
    /// @return active Whether the pool is active
    function isPoolActive(PoolId poolId) external view returns (bool active) {
        return activePools[poolId];
    }

    /// @notice Get pool key
    /// @param poolId Pool ID
    /// @return key Pool key
    function getPoolKey(PoolId poolId) external view returns (PoolKey memory key) {
        return poolKeys[poolId];
    }

    /// @notice Get pool statistics
    /// @param poolId Pool ID
    /// @return volume Pool volume
    /// @return swapCount Number of swaps
    /// @return liquidityVolume Liquidity volume
    /// @return currentLiquidity Current liquidity
    /// @return feesCollected Fees collected
    function getPoolStats(PoolId poolId) external view returns (uint256 volume, uint256 swapCount, uint256 liquidityVolume, uint128 currentLiquidity, uint256 feesCollected) {
        volume = poolVolume[poolId];
        swapCount = poolSwapCount[poolId];
        liquidityVolume = poolLiquidityVolume[poolId];
        currentLiquidity = totalLiquidity[poolId];
        feesCollected = protocolFeesCollected[poolId];
    }

    /// @notice Calculate pool TVL
    /// @param poolId Pool ID
    /// @return tvl0 TVL for token0
    /// @return tvl1 TVL for token1
    function calculatePoolTVL(PoolId poolId) external view returns (uint256 tvl0, uint256 tvl1) {
        // This is a simplified calculation
        // In practice, you'd calculate based on current liquidity and price
        tvl0 = poolVolume[poolId] / 2;
        tvl1 = poolVolume[poolId] / 2;
    }

    /// @notice Execute swap
    /// @param key Pool key
    /// @param params Swap parameters
    /// @param hookData Hook data
    /// @return callerDelta Caller balance delta
    function executeSwap(PoolKey memory key, IPoolManager.SwapParams memory params, bytes calldata hookData)
        external
        onlyAuthorized
        onlyActivePool(key.toId())
        returns (BalanceDelta callerDelta)
    {
        // Execute swap
        callerDelta = this.swap(key, params, hookData);

        // Update pool statistics
        PoolId poolId = key.toId();
        poolVolume[poolId] += abs(callerDelta.amount0()) + abs(callerDelta.amount1());
        poolSwapCount[poolId]++;

        // Emit custom event
        emit SwapExecuted(
            poolId,
            msg.sender,
            Currency.unwrap(key.currency0),
            Currency.unwrap(key.currency1),
            abs(callerDelta.amount0()),
            abs(callerDelta.amount1())
        );
    }

    /// @notice Execute modify liquidity
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
        }

        // Emit custom event
        emit LiquidityModified(
            poolId,
            msg.sender,
            params.tickLower,
            params.tickUpper,
            params.liquidityDelta
        );
    }

    /// @notice Public wrapper for modifyLiquidity
    /// @param key Pool key
    /// @param params Modify liquidity parameters
    /// @param hookData Hook data
    /// @return delta Balance delta
    /// @return feesAccrued Fees accrued
    function modifyLiquidity(PoolKey memory key, IPoolManager.ModifyLiquidityParams memory params, bytes calldata hookData)
        external
        onlyAuthorized
        onlyActivePool(key.toId())
        returns (BalanceDelta delta, BalanceDelta feesAccrued)
    {
        return super.modifyLiquidity(key, params, hookData);
    }

    /// @notice Public wrapper for swap
    /// @param key Pool key
    /// @param params Swap parameters
    /// @param hookData Hook data
    /// @return delta Balance delta
    function swap(PoolKey memory key, IPoolManager.SwapParams memory params, bytes calldata hookData)
        external
        onlyAuthorized
        onlyActivePool(key.toId())
        returns (BalanceDelta delta)
    {
        return super.swap(key, params, hookData);
    }

    /// @notice Public wrapper for settle
    /// @param currency Currency to settle
    /// @return paid Amount paid
    function settle(address currency) external payable returns (uint256 paid) {
        return super.settle(Currency.wrap(currency));
    }

    /// @notice Public wrapper for take
    /// @param currency Currency to take
    /// @param to Recipient address
    /// @param amount Amount to take
    function take(address currency, address to, uint256 amount) external {
        super.take(Currency.wrap(currency), to, amount);
    }

    /// @notice Public wrapper for sync
    /// @param currency Currency to sync
    function sync(address currency) external {
        super.sync(Currency.wrap(currency));
    }

    /// @notice Deactivate pool
    /// @param poolId Pool ID
    function deactivatePool(PoolId poolId) external onlyAdmin {
        activePools[poolId] = false;
    }

    /// @notice Reactivate pool
    /// @param poolId Pool ID
    function reactivatePool(PoolId poolId) external onlyAdmin {
        activePools[poolId] = true;
    }

    /// @notice Collect protocol fees
    /// @param poolId Pool ID
    /// @param amount0 Amount of token0 to collect
    /// @param amount1 Amount of token1 to collect
    function collectProtocolFees(PoolId poolId, uint256 amount0, uint256 amount1) external onlyAdmin {
        protocolFeesCollected[poolId] += amount0 + amount1;
    }

    /// @notice Get token fee statistics
    /// @param token Token address
    /// @return amount Amount of fees collected
    function getTokenFeeStats(address token) external view returns (uint256 amount) {
        return tokenFeesCollected[token];
    }

    /// @notice Get pool price
    /// @param poolId Pool ID
    /// @return sqrtPrice Current sqrt price
    /// @return tick Current tick
    function getPoolPrice(PoolId poolId) external view returns (uint160 sqrtPrice, int24 tick) {
        // This is a simplified implementation
        // In practice, you'd get the actual price from the pool
        sqrtPrice = 79228162514264337593543950336; // 1:1 price
        tick = 0;
    }

    /// @notice Update pool statistics
    /// @param poolId Pool ID
    /// @param newVolume New volume
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
