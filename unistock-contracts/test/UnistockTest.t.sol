// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "forge-std/console2.sol";
import {UnistockPoolManager} from "../src/core/UnistockPoolManager.sol";
import {UnistockRouter} from "../src/periphery/UnistockRouter.sol";
// import {UnistockIncentiveHook} from "../src/hooks/UnistockIncentiveHook.sol";
import {IPoolManager} from "@unistock/v4-core/interfaces/IPoolManager.sol";
import {PoolKey} from "@unistock/v4-core/types/PoolKey.sol";
import {Currency, CurrencyLibrary} from "@unistock/v4-core/types/Currency.sol";
import {IHooks} from "@unistock/v4-core/interfaces/IHooks.sol";
import {TickMath} from "@unistock/v4-core/libraries/TickMath.sol";
import {LPFeeLibrary} from "@unistock/v4-core/libraries/LPFeeLibrary.sol";
import {PoolId} from "@unistock/v4-core/types/PoolId.sol";

/// @title Unistock Tests
/// @notice Test suite for Unistock DEX
contract UnistockTest is Test {
    // Contracts
    UnistockPoolManager public poolManager;
    UnistockRouter public router;
    // UnistockIncentiveHook public incentiveHook;

    // Test accounts
    address public admin;
    address public user1;
    address public user2;
    address public feeRecipient;

    // Test tokens
    address public tokenA;
    address public tokenB;
    address public rewardToken;

    // Pool configuration
    PoolKey public poolKey;
    uint24 public constant FEE = 3000; // 0.3%
    int24 public constant TICK_SPACING = 60;

    // Test constants matching Uniswap V4
    uint160 public constant SQRT_PRICE_1_1 = 79228162514264337593543950336;

    function setUp() public {
        // Set up test accounts
        admin = address(this);
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        feeRecipient = makeAddr("feeRecipient");

        // Deploy mock tokens
        tokenA = address(new MockERC20("Token A", "TKA"));
        tokenB = address(new MockERC20("Token B", "TKB"));
        rewardToken = address(new MockERC20("Reward Token", "RWT"));

        // Deploy contracts
        poolManager = new UnistockPoolManager(admin);
        router = new UnistockRouter(IPoolManager(address(poolManager)));
        // incentiveHook = new UnistockIncentiveHook(IPoolManager(address(poolManager)));

        // Configure contracts
        poolManager.setFeeRecipient(feeRecipient);
        poolManager.setWhitelistedToken(tokenA, true);
        poolManager.setWhitelistedToken(tokenB, true);
        poolManager.setAuthorizedCaller(address(router), true);

        router.setFeeRecipient(feeRecipient);

        // Set up pool key (ensure tokenA < tokenB)
        address token0 = tokenA < tokenB ? tokenA : tokenB;
        address token1 = tokenA < tokenB ? tokenB : tokenA;

        poolKey = PoolKey({
            currency0: Currency.wrap(token0),
            currency1: Currency.wrap(token1),
            fee: FEE,
            tickSpacing: TICK_SPACING,
            hooks: IHooks(address(0)) // No hooks for initial testing
        });

        // Mint tokens to test users
        MockERC20(tokenA).mint(user1, 1000000e18);
        MockERC20(tokenB).mint(user1, 1000000e18);
        MockERC20(tokenA).mint(user2, 1000000e18);
        MockERC20(tokenB).mint(user2, 1000000e18);

        // Approve router to spend tokens
        vm.startPrank(user1);
        MockERC20(tokenA).approve(address(router), type(uint256).max);
        MockERC20(tokenB).approve(address(router), type(uint256).max);
        vm.stopPrank();

        vm.startPrank(user2);
        MockERC20(tokenA).approve(address(router), type(uint256).max);
        MockERC20(tokenB).approve(address(router), type(uint256).max);
        vm.stopPrank();
        // MockERC20(rewardToken).mint(address(incentiveHook), 1000000e18);

        // Set up incentive (commented out for now)
        // incentiveHook.addIncentive(poolKey, rewardToken, 1e18); // 1 token per second
    }

    function testPoolManagerDeployment() public {
        assertEq(poolManager.admin(), admin);
        assertEq(poolManager.feeRecipient(), feeRecipient);
        assertEq(poolManager.defaultProtocolFee(), 500); // 0.05%
    }

    function testRouterDeployment() public {
        assertEq(router.admin(), admin);
        assertEq(router.feeRecipient(), feeRecipient);
        assertEq(router.swapFee(), 10); // 0.1%
    }

    // function testIncentiveHookDeployment() public {
    //     assertEq(incentiveHook.admin(), admin);
    // }

    function testTokenWhitelisting() public {
        assertTrue(poolManager.whitelistedTokens(tokenA));
        assertTrue(poolManager.whitelistedTokens(tokenB));

        // Test adding new token
        address newToken = address(new MockERC20("New Token", "NEW"));
        poolManager.setWhitelistedToken(newToken, true);
        assertTrue(poolManager.whitelistedTokens(newToken));
    }

    function testCustomFees() public {
        uint24 customFee = 1000; // 1%
        poolManager.setCustomFee(tokenA, customFee);
        assertEq(poolManager.customFees(tokenA), customFee);
        assertEq(poolManager.getTokenFee(tokenA), customFee);
    }

    function testPoolInitialization() public {
        // Initialize pool with proper sqrt price
        uint160 sqrtPriceX96 = SQRT_PRICE_1_1; // 1:1 price
        int24 tick = poolManager.initializePool(poolKey, sqrtPriceX96);

        // Pool should be active after initialization
        assertTrue(poolManager.isPoolActive(poolKey.toId()));
        assertEq(tick, 0); // Should be 0 for 1:1 price
    }

    function testSwapFunctionality() public {
        // Initialize pool first
        uint160 sqrtPriceX96 = SQRT_PRICE_1_1;
        poolManager.initializePool(poolKey, sqrtPriceX96);

        // Authorize user1 to use the router
        router.setAuthorizedCaller(user1, true);

        // Add liquidity so there are tokens to swap
        vm.startPrank(user1);
        router.addLiquidity(tokenA, tokenB, 10000e18, 10000e18, -60, 60, FEE, TICK_SPACING);
        vm.stopPrank();

        vm.startPrank(user1);

        // Perform a swap
        uint256 amountIn = 1000e18;
        uint256 minAmountOut = 0;

        uint256 balanceBefore = MockERC20(tokenB).balanceOf(user1);
        router.swapExactInputSingle(tokenA, tokenB, amountIn, minAmountOut, FEE, TICK_SPACING);
        uint256 balanceAfter = MockERC20(tokenB).balanceOf(user1);

        // Check that the swap actually happened
        assertGt(balanceAfter, balanceBefore, "Swap should increase TokenB balance");

        // Check user stats
        (uint256 swapCount, uint256 volume,) = router.getUserStats(user1);
        assertEq(swapCount, 1);
        assertEq(volume, amountIn);

        vm.stopPrank();
    }

    // function testIncentiveSystem() public {
    //     // Check pending rewards
    //     uint256 pendingRewards = incentiveHook.getPendingRewards(user1, poolKey);
    //     console2.log("Pending rewards:", pendingRewards);

    //     // This would require actual liquidity provision to test properly
    //     assertTrue(true); // Placeholder test
    // }

    function testReferralSystem() public {
        // Initialize pool first
        uint160 sqrtPriceX96 = SQRT_PRICE_1_1;
        poolManager.initializePool(poolKey, sqrtPriceX96);

        // Authorize user1 to use the router for adding liquidity
        router.setAuthorizedCaller(user1, true);

        // Add liquidity so there are tokens to swap
        vm.startPrank(user1);
        router.addLiquidity(tokenA, tokenB, 10000e18, 10000e18, -60, 60, FEE, TICK_SPACING);
        vm.stopPrank();

        // Authorize user2 to use the router
        router.setAuthorizedCaller(user2, true);

        // Set up referral
        vm.prank(user1);
        router.setReferrer(user2, user1);

        // Perform swap by user2 (should generate referral reward for user1)
        vm.startPrank(user2);
        router.swapExactInputSingle(tokenA, tokenB, 1000e18, 0, FEE, TICK_SPACING);
        vm.stopPrank();

        // Check referral rewards
        uint256 referralReward = router.referralRewards(user1);
        assertGt(referralReward, 0, "Referral reward should be generated");
    }

    function testAccessControl() public {
        // Test admin functions
        address newAdmin = makeAddr("newAdmin");
        poolManager.transferAdmin(newAdmin);
        assertEq(poolManager.admin(), newAdmin);

        // Test unauthorized access
        vm.prank(user1);
        vm.expectRevert("Unistock: Only admin");
        poolManager.setWhitelistedToken(tokenA, false);
    }

    function testEmergencyFunctions() public {
        // Test emergency pool deactivation
        uint160 sqrtPriceX96 = SQRT_PRICE_1_1;
        poolManager.initializePool(poolKey, sqrtPriceX96);

        poolManager.deactivatePool(poolKey.toId());
        assertFalse(poolManager.isPoolActive(poolKey.toId()));
    }
}

/// @title Mock ERC20 Token for Testing
contract MockERC20 {
    string public name;
    string public symbol;
    uint8 public decimals = 18;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor(string memory _name, string memory _symbol) {
        name = _name;
        symbol = _symbol;
    }

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
        totalSupply += amount;
        emit Transfer(address(0), to, amount);
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
        return true;
    }
}
