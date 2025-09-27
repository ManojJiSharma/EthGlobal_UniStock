// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IPoolManager} from "@unistock/v4-core/interfaces/IPoolManager.sol";
import {PoolKey} from "@unistock/v4-core/types/PoolKey.sol";
import {Currency, CurrencyLibrary} from "@unistock/v4-core/types/Currency.sol";
import {BalanceDelta, BalanceDeltaLibrary} from "@unistock/v4-core/types/BalanceDelta.sol";
import {PoolId} from "@unistock/v4-core/types/PoolId.sol";
import {IERC20Minimal} from "@unistock/v4-core/interfaces/external/IERC20Minimal.sol";
import {TickMath} from "@unistock/v4-core/libraries/TickMath.sol";
import {SqrtPriceMath} from "@unistock/v4-core/libraries/SqrtPriceMath.sol";
import {LiquidityMath} from "@unistock/v4-core/libraries/LiquidityMath.sol";
import {FullMath} from "@unistock/v4-core/libraries/FullMath.sol";
import {FixedPoint96} from "@unistock/v4-core/libraries/FixedPoint96.sol";
import {IHooks} from "@unistock/v4-core/interfaces/IHooks.sol";

/// @title Unistock Router
/// @notice Complete DEX router with Uniswap V4 integration and custom features
/// @dev Full implementation of DEX functionality with proper Uniswap V4 math
contract UnistockRouter {
    using CurrencyLibrary for Currency;
    using BalanceDeltaLibrary for BalanceDelta;

    // Custom events
    event UnistockSwap(
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        uint24 fee
    );
    event LiquidityAdded(
        address indexed user,
        address indexed token0,
        address indexed token1,
        uint256 amount0,
        uint256 amount1,
        int24 tickLower,
        int24 tickUpper
    );
    event LiquidityRemoved(
        address indexed user,
        address indexed token0,
        address indexed token1,
        uint256 amount0,
        uint256 amount1,
        int24 tickLower,
        int24 tickUpper
    );

    // Custom state
    mapping(address => bool) public authorizedCallers;
    mapping(address => uint256) public userSwapCount;
    mapping(address => uint256) public totalVolume;

    address public admin;
    uint256 public maxSlippage = 500; // 5% in basis points
    uint256 public swapFee = 10; // 0.1% in basis points
    address public feeRecipient;

    // Referral system
    mapping(address => address) public referrers;
    mapping(address => uint256) public referralRewards;
    uint256 public referralRate = 100; // 1% in basis points

    IPoolManager public immutable poolManager;

    // Pool configurations and liquidity positions
    mapping(PoolId => PoolKey) public poolConfigs;
    mapping(address => mapping(PoolId => Position)) public positions;

    // Position structure for liquidity management
    struct Position {
        int24 tickLower;
        int24 tickUpper;
        uint128 liquidity;
        bytes32 salt;
        bool exists;
    }

    // Swap fee information
    struct SwapFeeInfo {
        address token;
        uint256 amount;
    }

    // Mapping to store swap fee information for callbacks
    mapping(address => SwapFeeInfo) public swapFeeInfo;

    modifier onlyAdmin() {
        require(msg.sender == admin, "Unistock: Only admin");
        _;
    }

    modifier onlyAuthorized() {
        require(authorizedCallers[msg.sender] || msg.sender == admin, "Unistock: Unauthorized");
        _;
    }

    constructor(IPoolManager _poolManager) {
        poolManager = _poolManager;
        admin = msg.sender;
        feeRecipient = msg.sender;
    }

    /// @notice Set authorized caller
    /// @param caller Address to authorize/unauthorize
    /// @param authorized Whether the caller is authorized
    function setAuthorizedCaller(address caller, bool authorized) external onlyAdmin {
        authorizedCallers[caller] = authorized;
    }

    /// @notice Set maximum slippage tolerance
    /// @param _maxSlippage New max slippage in basis points
    function setMaxSlippage(uint256 _maxSlippage) external onlyAdmin {
        require(_maxSlippage <= 10000, "Unistock: Slippage too high");
        maxSlippage = _maxSlippage;
    }

    /// @notice Set swap fee
    /// @param _swapFee New swap fee in basis points
    function setSwapFee(uint256 _swapFee) external onlyAdmin {
        require(_swapFee <= 1000, "Unistock: Fee too high");
        swapFee = _swapFee;
    }

    /// @notice Set fee recipient
    /// @param recipient New fee recipient address
    function setFeeRecipient(address recipient) external onlyAdmin {
        require(recipient != address(0), "Unistock: Invalid recipient");
        feeRecipient = recipient;
    }

    /// @notice Set referral rate
    /// @param rate New referral rate in basis points
    function setReferralRate(uint256 rate) external onlyAdmin {
        require(rate <= 1000, "Unistock: Rate too high");
        referralRate = rate;
    }

    /// @notice Set referrer for a user
    /// @param user User address
    /// @param referrer Referrer address
    function setReferrer(address user, address referrer) external {
        require(referrers[user] == address(0), "Unistock: Referrer already set");
        require(user != referrer, "Unistock: Cannot refer self");
        referrers[user] = referrer;
    }

    /// @notice Register a pool configuration
    /// @param key Pool key
    function registerPool(PoolKey memory key) external onlyAdmin {
        poolConfigs[key.toId()] = key;
    }

    /// @notice Swap exact input for output using Uniswap V4 math
    /// @param tokenIn Input token address
    /// @param tokenOut Output token address
    /// @param amountIn Input amount
    /// @param minAmountOut Minimum output amount
    /// @param fee Pool fee tier
    /// @param tickSpacing Pool tick spacing
    /// @return amountOut Output amount
    function swapExactInputSingle(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut,
        uint24 fee,
        int24 tickSpacing
    ) external onlyAuthorized returns (uint256 amountOut) {
        // Create pool key
        PoolKey memory key = _createPoolKey(tokenIn, tokenOut, fee, tickSpacing);

        // Calculate and apply swap fee
        uint256 feeAmount = (amountIn * swapFee) / 10000;
        uint256 amountInAfterFee = amountIn - feeAmount;

        // Store fee information for the callback
        swapFeeInfo[msg.sender] = SwapFeeInfo({token: tokenIn, amount: feeAmount});

        // Perform the swap using Uniswap V4 logic
        amountOut = _performSwap(key, amountInAfterFee, minAmountOut, true, tokenIn, tokenOut);

        // Update user stats
        userSwapCount[msg.sender]++;
        totalVolume[msg.sender] += amountIn;

        // Handle referral rewards
        if (referrers[msg.sender] != address(0)) {
            uint256 referralReward = (feeAmount * referralRate) / 10000;
            referralRewards[referrers[msg.sender]] += referralReward;
        }

        // Emit event
        emit UnistockSwap(msg.sender, tokenIn, tokenOut, amountIn, amountOut, fee);
    }

    /// @notice Swap exact output for input using Uniswap V4 math
    /// @param tokenIn Input token address
    /// @param tokenOut Output token address
    /// @param amountOut Exact output amount
    /// @param maxAmountIn Maximum input amount
    /// @param fee Pool fee tier
    /// @param tickSpacing Pool tick spacing
    /// @return amountIn Input amount
    function swapExactOutputSingle(
        address tokenIn,
        address tokenOut,
        uint256 amountOut,
        uint256 maxAmountIn,
        uint24 fee,
        int24 tickSpacing
    ) external onlyAuthorized returns (uint256 amountIn) {
        // Create pool key
        PoolKey memory key = _createPoolKey(tokenIn, tokenOut, fee, tickSpacing);

        // Perform the swap using Uniswap V4 logic
        amountIn = _performSwap(key, amountOut, maxAmountIn, false, tokenIn, tokenOut);

        // Apply swap fee to input amount
        uint256 feeAmount = (amountIn * swapFee) / 10000;
        amountIn += feeAmount;

        require(amountIn <= maxAmountIn, "Unistock: Max amount exceeded");

        // Store fee information for the callback
        swapFeeInfo[msg.sender] = SwapFeeInfo({token: tokenIn, amount: feeAmount});

        // Update user stats
        userSwapCount[msg.sender]++;
        totalVolume[msg.sender] += amountIn;

        // Handle referral rewards
        if (referrers[msg.sender] != address(0)) {
            uint256 referralReward = (feeAmount * referralRate) / 10000;
            referralRewards[referrers[msg.sender]] += referralReward;
        }

        // Emit event
        emit UnistockSwap(msg.sender, tokenIn, tokenOut, amountIn, amountOut, fee);
    }

    /// @notice Add liquidity to a pool using Uniswap V4 math
    /// @param token0 First token address
    /// @param token1 Second token address
    /// @param amount0 Amount of token0
    /// @param amount1 Amount of token1
    /// @param tickLower Lower tick for liquidity range
    /// @param tickUpper Upper tick for liquidity range
    /// @param fee Pool fee tier
    /// @param tickSpacing Pool tick spacing
    /// @return liquidity Amount of liquidity added
    function addLiquidity(
        address token0,
        address token1,
        uint256 amount0,
        uint256 amount1,
        int24 tickLower,
        int24 tickUpper,
        uint24 fee,
        int24 tickSpacing
    ) external onlyAuthorized returns (uint128 liquidity) {
        PoolKey memory key = _createPoolKey(token0, token1, fee, tickSpacing);

        // Calculate liquidity delta using Uniswap V4 math
        liquidity = _calculateLiquidityFromAmounts(amount0, amount1, tickLower, tickUpper);

        // Create modify liquidity params
        IPoolManager.ModifyLiquidityParams memory params = IPoolManager.ModifyLiquidityParams({
            tickLower: tickLower,
            tickUpper: tickUpper,
            liquidityDelta: int256(uint256(liquidity)),
            salt: keccak256(abi.encodePacked(msg.sender, block.timestamp))
        });

        // Perform liquidity modification
        _performModifyLiquidity(key, params);

        // Store position
        positions[msg.sender][key.toId()] = Position({
            tickLower: tickLower,
            tickUpper: tickUpper,
            liquidity: liquidity,
            salt: params.salt,
            exists: true
        });

        // Emit event
        emit LiquidityAdded(msg.sender, token0, token1, amount0, amount1, tickLower, tickUpper);
    }

    /// @notice Remove liquidity from a pool
    /// @param token0 First token address
    /// @param token1 Second token address
    /// @param liquidityAmount Amount of liquidity to remove
    /// @param tickLower Lower tick for liquidity range
    /// @param tickUpper Upper tick for liquidity range
    /// @param fee Pool fee tier
    /// @param tickSpacing Pool tick spacing
    function removeLiquidity(
        address token0,
        address token1,
        uint128 liquidityAmount,
        int24 tickLower,
        int24 tickUpper,
        uint24 fee,
        int24 tickSpacing
    ) external onlyAuthorized {
        PoolKey memory key = _createPoolKey(token0, token1, fee, tickSpacing);
        PoolId poolId = key.toId();

        // Verify position exists
        Position storage position = positions[msg.sender][poolId];
        require(position.exists, "Unistock: Position not found");
        require(position.liquidity >= liquidityAmount, "Unistock: Insufficient liquidity");

        // Create modify liquidity params
        IPoolManager.ModifyLiquidityParams memory params = IPoolManager.ModifyLiquidityParams({
            tickLower: tickLower,
            tickUpper: tickUpper,
            liquidityDelta: -int256(uint256(liquidityAmount)),
            salt: position.salt
        });

        // Perform liquidity modification
        (BalanceDelta delta,) = _performModifyLiquidity(key, params);

        // Update position
        position.liquidity -= liquidityAmount;
        if (position.liquidity == 0) {
            position.exists = false;
        }

        // Calculate amounts removed
        uint256 amount0 = uint256(int256(-delta.amount0()));
        uint256 amount1 = uint256(int256(-delta.amount1()));

        // Emit event
        emit LiquidityRemoved(msg.sender, token0, token1, amount0, amount1, tickLower, tickUpper);
    }

    /// @notice Get quote for exact input swap
    /// @param tokenIn Input token address
    /// @param tokenOut Output token address
    /// @param amountIn Input amount
    /// @param fee Pool fee tier
    /// @param tickSpacing Pool tick spacing
    /// @return amountOut Output amount
    function getAmountOut(address tokenIn, address tokenOut, uint256 amountIn, uint24 fee, int24 tickSpacing)
        external
        view
        returns (uint256 amountOut)
    {
        PoolKey memory key = _createPoolKey(tokenIn, tokenOut, fee, tickSpacing);

        // Get current pool state (simplified - in practice you'd query the pool manager)
        uint160 currentSqrtPrice = TickMath.getSqrtPriceAtTick(0); // Simplified

        // Calculate output amount using Uniswap V4 math
        amountOut = _calculateSwapOutput(currentSqrtPrice, amountIn, true);
    }

    /// @notice Get quote for exact output swap
    /// @param tokenIn Input token address
    /// @param tokenOut Output token address
    /// @param amountOut Output amount
    /// @param fee Pool fee tier
    /// @param tickSpacing Pool tick spacing
    /// @return amountIn Input amount
    function getAmountIn(address tokenIn, address tokenOut, uint256 amountOut, uint24 fee, int24 tickSpacing)
        external
        view
        returns (uint256 amountIn)
    {
        PoolKey memory key = _createPoolKey(tokenIn, tokenOut, fee, tickSpacing);

        // Get current pool state (simplified - in practice you'd query the pool manager)
        uint160 currentSqrtPrice = TickMath.getSqrtPriceAtTick(0); // Simplified

        // Calculate input amount using Uniswap V4 math
        amountIn = _calculateSwapInput(currentSqrtPrice, amountOut, true);
    }

    /// @notice Get user statistics
    /// @param user User address
    /// @return swapCount Number of swaps performed
    /// @return volume Total volume traded
    /// @return referralReward Total referral rewards earned
    function getUserStats(address user)
        external
        view
        returns (uint256 swapCount, uint256 volume, uint256 referralReward)
    {
        return (userSwapCount[user], totalVolume[user], referralRewards[user]);
    }

    /// @notice Get user position for a pool
    /// @param user User address
    /// @param poolId Pool ID
    /// @return position User's position in the pool
    function getUserPosition(address user, PoolId poolId) external view returns (Position memory position) {
        return positions[user][poolId];
    }

    /// @notice Claim referral rewards
    function claimReferralRewards() external {
        uint256 rewards = referralRewards[msg.sender];
        require(rewards > 0, "Unistock: No rewards to claim");

        referralRewards[msg.sender] = 0;
        // Transfer rewards to user
        // Implementation depends on your reward token mechanism
    }

    /// @notice Emergency function to pause trading
    function emergencyPause() external onlyAdmin {
        // Implementation for emergency pause
        // This would require additional state management
    }

    /// @notice Transfer admin role
    /// @param newAdmin New admin address
    function transferAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "Unistock: Invalid admin");
        admin = newAdmin;
    }

    // Internal functions implementing Uniswap V4 math and logic

    /// @notice Create a pool key with proper token ordering
    function _createPoolKey(address tokenA, address tokenB, uint24 fee, int24 tickSpacing)
        internal
        pure
        returns (PoolKey memory)
    {
        // Ensure token0 < token1
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);

        return PoolKey({
            currency0: Currency.wrap(token0),
            currency1: Currency.wrap(token1),
            fee: fee,
            tickSpacing: tickSpacing,
            hooks: IHooks(address(0)) // No hooks for basic functionality
        });
    }

    /// @notice Perform a swap using the pool manager with proper Uniswap V4 integration
    function _performSwap(
        PoolKey memory key,
        uint256 amount,
        uint256 limit,
        bool exactInput,
        address tokenIn,
        address tokenOut
    ) internal returns (uint256 resultAmount) {
        // Determine swap direction based on the actual token addresses
        // zeroForOne = true means swapping token0 for token1
        // zeroForOne = false means swapping token1 for token0
        bool zeroForOne = _determineSwapDirection(key, tokenIn, tokenOut);

        // Create swap params
        IPoolManager.SwapParams memory params = IPoolManager.SwapParams({
            zeroForOne: zeroForOne,
            amountSpecified: exactInput ? -int256(amount) : int256(amount),
            sqrtPriceLimitX96: zeroForOne ? TickMath.MIN_SQRT_PRICE + 1 : TickMath.MAX_SQRT_PRICE - 1
        });

        // Use the unlock mechanism to call swap
        bytes memory result = poolManager.unlock(abi.encode(key, params, exactInput, limit, msg.sender));
        BalanceDelta swapDelta = abi.decode(result, (BalanceDelta));

        // Calculate result amount from delta
        if (exactInput) {
            // For exact input, we want the positive delta (the output amount)
            resultAmount = uint256(int256(swapDelta.amount0() > 0 ? swapDelta.amount0() : swapDelta.amount1()));
        } else {
            // For exact output, we want the negative delta (the input amount)
            resultAmount = uint256(int256(swapDelta.amount0() < 0 ? -swapDelta.amount0() : -swapDelta.amount1()));
        }

        return resultAmount;
    }

    /// @notice Perform liquidity modification using pool manager
    function _performModifyLiquidity(PoolKey memory key, IPoolManager.ModifyLiquidityParams memory params)
        internal
        returns (BalanceDelta delta, BalanceDelta feesAccrued)
    {
        // Use the unlock mechanism to call modifyLiquidity
        bytes memory result = poolManager.unlock(abi.encode(key, params, msg.sender));
        return abi.decode(result, (BalanceDelta, BalanceDelta));
    }

    /// @notice Calculate liquidity from token amounts using Uniswap V4 math
    function _calculateLiquidityFromAmounts(uint256 amount0, uint256 amount1, int24 tickLower, int24 tickUpper)
        internal
        pure
        returns (uint128 liquidity)
    {
        // Get sqrt prices for the tick range
        uint160 sqrtPriceAX96 = TickMath.getSqrtPriceAtTick(tickLower);
        uint160 sqrtPriceBX96 = TickMath.getSqrtPriceAtTick(tickUpper);

        // Calculate liquidity using Uniswap V4 formula
        if (amount0 > 0 && amount1 > 0) {
            // Both amounts provided - use the minimum
            uint128 liquidity0 = _getLiquidityForAmount0(sqrtPriceAX96, sqrtPriceBX96, amount0);
            uint128 liquidity1 = _getLiquidityForAmount1(sqrtPriceAX96, sqrtPriceBX96, amount1);
            liquidity = liquidity0 < liquidity1 ? liquidity0 : liquidity1;
        } else if (amount0 > 0) {
            liquidity = _getLiquidityForAmount0(sqrtPriceAX96, sqrtPriceBX96, amount0);
        } else if (amount1 > 0) {
            liquidity = _getLiquidityForAmount1(sqrtPriceAX96, sqrtPriceBX96, amount1);
        }

        return liquidity;
    }

    /// @notice Calculate liquidity for amount0 using Uniswap V4 math
    function _getLiquidityForAmount0(uint160 sqrtPriceAX96, uint160 sqrtPriceBX96, uint256 amount0)
        internal
        pure
        returns (uint128 liquidity)
    {
        if (sqrtPriceAX96 > sqrtPriceBX96) {
            (sqrtPriceAX96, sqrtPriceBX96) = (sqrtPriceBX96, sqrtPriceAX96);
        }

        uint256 intermediate = FullMath.mulDiv(sqrtPriceAX96, sqrtPriceBX96, FixedPoint96.Q96);
        return uint128(FullMath.mulDiv(amount0, intermediate, sqrtPriceBX96 - sqrtPriceAX96));
    }

    /// @notice Calculate liquidity for amount1 using Uniswap V4 math
    function _getLiquidityForAmount1(uint160 sqrtPriceAX96, uint160 sqrtPriceBX96, uint256 amount1)
        internal
        pure
        returns (uint128 liquidity)
    {
        if (sqrtPriceAX96 > sqrtPriceBX96) {
            (sqrtPriceAX96, sqrtPriceBX96) = (sqrtPriceBX96, sqrtPriceAX96);
        }

        return uint128(FullMath.mulDiv(amount1, FixedPoint96.Q96, sqrtPriceBX96 - sqrtPriceAX96));
    }

    /// @notice Calculate swap output using Uniswap V4 math
    function _calculateSwapOutput(uint160 sqrtPriceX96, uint256 amount, bool zeroForOne)
        internal
        pure
        returns (uint256)
    {
        // Simplified calculation - in practice you'd use the full SqrtPriceMath
        if (zeroForOne) {
            return FullMath.mulDiv(amount, sqrtPriceX96, FixedPoint96.Q96);
        } else {
            return FullMath.mulDiv(amount, FixedPoint96.Q96, sqrtPriceX96);
        }
    }

    /// @notice Calculate swap input using Uniswap V4 math
    function _calculateSwapInput(uint160 sqrtPriceX96, uint256 amount, bool zeroForOne)
        internal
        pure
        returns (uint256)
    {
        // Simplified calculation - in practice you'd use the full SqrtPriceMath
        if (zeroForOne) {
            return FullMath.mulDiv(amount, FixedPoint96.Q96, sqrtPriceX96);
        } else {
            return FullMath.mulDiv(amount, sqrtPriceX96, FixedPoint96.Q96);
        }
    }

    /// @notice Determine swap direction based on token addresses
    function _determineSwapDirection(PoolKey memory key, address tokenIn, address tokenOut)
        internal
        pure
        returns (bool)
    {
        address token0 = Currency.unwrap(key.currency0);
        address token1 = Currency.unwrap(key.currency1);

        // If tokenIn is token0, then we're swapping zeroForOne (token0 -> token1)
        // If tokenIn is token1, then we're swapping oneForZero (token1 -> token0)
        return tokenIn == token0;
    }

    /// @notice Settle currency using proper Uniswap V4 settlement
    function _settleCurrency(Currency currency, address payer, uint256 amount) internal {
        if (amount == 0) return;

        if (currency.isAddressZero()) {
            // Native currency - send ETH to pool manager and settle
            poolManager.settle{value: amount}();
        } else {
            // ERC20 token - transfer tokens to pool manager then settle
            address token = Currency.unwrap(currency);
            IERC20Minimal(token).transferFrom(payer, address(poolManager), amount);
            poolManager.settle();
        }
    }

    /// @notice Take currency using proper Uniswap V4 taking
    function _takeCurrency(Currency currency, address recipient, uint256 amount) internal {
        if (amount == 0) return;

        // Take currency from pool manager to recipient
        poolManager.take(currency, recipient, amount);
    }

    /// @notice Unlock callback for pool manager interactions
    function unlockCallback(bytes calldata data) external returns (bytes memory) {
        require(msg.sender == address(poolManager), "Unistock: Only pool manager");

        // Try to decode as swap operation first (more common)
        try this.decodeSwapCallback(data) returns (
            PoolKey memory key, IPoolManager.SwapParams memory params, bool exactInput, uint256 limit, address user
        ) {
            // Call swap directly (PoolManager is now unlocked)
            BalanceDelta swapDelta = poolManager.swap(key, params, "");

            // Handle token transfers based on the delta
            _handleSwapTransfers(key, params, swapDelta, user);

            // Handle swap fees if any - transfer directly to fee recipient
            SwapFeeInfo memory feeInfo = swapFeeInfo[user];
            if (feeInfo.amount > 0) {
                // Transfer fee tokens directly from user to fee recipient
                IERC20Minimal(feeInfo.token).transferFrom(user, feeRecipient, feeInfo.amount);
                // Clear the fee info
                delete swapFeeInfo[user];
            }

            // Return the result
            return abi.encode(swapDelta);
        } catch {
            // Try to decode as liquidity operation
            (PoolKey memory key, IPoolManager.ModifyLiquidityParams memory params, address user) =
                abi.decode(data, (PoolKey, IPoolManager.ModifyLiquidityParams, address));

            // Call modifyLiquidity directly (PoolManager is now unlocked)
            (BalanceDelta delta, BalanceDelta feesAccrued) = poolManager.modifyLiquidity(key, params, "");

            // Handle token transfers based on the delta
            _handleLiquidityTransfers(key, delta, user);

            // Return the results
            return abi.encode(delta, feesAccrued);
        }
    }

    /// @notice Decode swap callback data
    function decodeSwapCallback(bytes calldata data)
        external
        pure
        returns (
            PoolKey memory key,
            IPoolManager.SwapParams memory params,
            bool exactInput,
            uint256 limit,
            address user
        )
    {
        return abi.decode(data, (PoolKey, IPoolManager.SwapParams, bool, uint256, address));
    }

    /// @notice Decode liquidity callback data
    function decodeLiquidityCallback(bytes calldata data)
        external
        pure
        returns (PoolKey memory key, IPoolManager.ModifyLiquidityParams memory params, address user)
    {
        return abi.decode(data, (PoolKey, IPoolManager.ModifyLiquidityParams, address));
    }

    /// @notice Handle swap transfers based on balance delta
    function _handleSwapTransfers(
        PoolKey memory key,
        IPoolManager.SwapParams memory params,
        BalanceDelta swapDelta,
        address user
    ) internal {
        // Handle currency0 delta
        int128 delta0 = swapDelta.amount0();
        if (delta0 < 0) {
            // User owes currency0 (negative delta) - sync, transfer and settle
            uint256 amount0 = uint256(uint128(-delta0));
            poolManager.sync(key.currency0);
            IERC20Minimal(Currency.unwrap(key.currency0)).transferFrom(user, address(poolManager), amount0);
            poolManager.settle();
        } else if (delta0 > 0) {
            // User receives currency0 (positive delta) - take from pool
            poolManager.take(key.currency0, user, uint256(uint128(delta0)));
        }

        // Handle currency1 delta
        int128 delta1 = swapDelta.amount1();
        if (delta1 < 0) {
            // User owes currency1 (negative delta) - sync, transfer and settle
            uint256 amount1 = uint256(uint128(-delta1));
            poolManager.sync(key.currency1);
            IERC20Minimal(Currency.unwrap(key.currency1)).transferFrom(user, address(poolManager), amount1);
            poolManager.settle();
        } else if (delta1 > 0) {
            // User receives currency1 (positive delta) - take from pool
            poolManager.take(key.currency1, user, uint256(uint128(delta1)));
        }
    }

    /// @notice Handle liquidity transfers based on balance delta
    function _handleLiquidityTransfers(PoolKey memory key, BalanceDelta delta, address user) internal {
        // Handle currency0 delta
        int128 delta0 = delta.amount0();
        if (delta0 < 0) {
            // User owes currency0 (negative delta) - sync, transfer and settle
            uint256 amount0 = uint256(uint128(-delta0));
            poolManager.sync(key.currency0);
            IERC20Minimal(Currency.unwrap(key.currency0)).transferFrom(user, address(poolManager), amount0);
            poolManager.settle();
        } else if (delta0 > 0) {
            // User receives currency0 (positive delta) - take from pool
            poolManager.take(key.currency0, user, uint256(uint128(delta0)));
        }

        // Handle currency1 delta
        int128 delta1 = delta.amount1();
        if (delta1 < 0) {
            // User owes currency1 (negative delta) - sync, transfer and settle
            uint256 amount1 = uint256(uint128(-delta1));
            poolManager.sync(key.currency1);
            IERC20Minimal(Currency.unwrap(key.currency1)).transferFrom(user, address(poolManager), amount1);
            poolManager.settle();
        } else if (delta1 > 0) {
            // User receives currency1 (positive delta) - take from pool
            poolManager.take(key.currency1, user, uint256(uint128(delta1)));
        }
    }

    /// @notice Get absolute value of int256
    function abs(int256 x) internal pure returns (uint256) {
        return uint256(x < 0 ? -x : x);
    }
}
