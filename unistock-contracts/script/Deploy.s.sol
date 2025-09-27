// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import {UnistockPoolManager} from "../src/core/UnistockPoolManager.sol";
import {UnistockRouter} from "../src/periphery/UnistockRouter.sol";
import {MintableToken} from "../src/tokens/MintableToken.sol";
import {IPoolManager} from "@unistock/v4-core/interfaces/IPoolManager.sol";
import {PoolKey} from "@unistock/v4-core/types/PoolKey.sol";
import {Currency, CurrencyLibrary} from "@unistock/v4-core/types/Currency.sol";
import {IHooks} from "@unistock/v4-core/interfaces/IHooks.sol";
import {TickMath} from "@unistock/v4-core/libraries/TickMath.sol";

/// @title Deploy Unistock Staging
/// @notice Gas-optimized deployment script for RSK testnet
contract Deploy is Script {
    // ============ CONTRACT STATE ============
    // Core contracts
    UnistockPoolManager public poolManager;
    UnistockRouter public router;

    // Mintable tokens
    MintableToken public usdtToken;
    MintableToken public usdcToken;
    MintableToken public daiToken;

    // Configuration
    address public admin;
    address public feeRecipient;

    // Token addresses - these will be set after deployment
    address public USDC;
    address public USDT;
    address public DAI;

    // ============ GAS-OPTIMIZED INDIVIDUAL DEPLOYMENT FUNCTIONS ============

    /// @notice Deploy USDT token only (estimated gas: ~800K)
    function deployUSDT() public {
        _setupDeployment();

        vm.startBroadcast();
        usdtToken = new MintableToken("Test USDT", "tUSDT", 6, admin);
        vm.stopBroadcast();

        console.logString("=== USDT DEPLOYED ===");
        console.logString("tUSDT address:");
        console.logAddress(address(usdtToken));
        console.logString("Admin:");
        console.logAddress(admin);
    }

    /// @notice Deploy USDC token only (estimated gas: ~800K)
    function deployUSDC() public {
        _setupDeployment();

        vm.startBroadcast();
        usdcToken = new MintableToken("Test USDC", "tUSDC", 6, admin);
        vm.stopBroadcast();

        console.logString("=== USDC DEPLOYED ===");
        console.logString("tUSDC address:");
        console.logAddress(address(usdcToken));
        console.logString("Admin:");
        console.logAddress(admin);
    }

    /// @notice Deploy DAI token only (estimated gas: ~800K)
    function deployDAI() public {
        _setupDeployment();

        vm.startBroadcast();
        daiToken = new MintableToken("Test DAI", "tDAI", 18, admin);
        vm.stopBroadcast();

        console.logString("=== DAI DEPLOYED ===");
        console.logString("tDAI address:");
        console.logAddress(address(daiToken));
        console.logString("Admin:");
        console.logAddress(admin);
    }

    /// @notice Deploy PoolManager only (estimated gas: ~3M)
    function deployPoolManager() public {
        _setupDeployment();

        vm.startBroadcast();
        poolManager = new UnistockPoolManager(admin);
        vm.stopBroadcast();

        console.logString("=== POOL MANAGER DEPLOYED ===");
        console.logString("UnistockPoolManager address:");
        console.logAddress(address(poolManager));
        console.logString("Admin:");
        console.logAddress(admin);
    }

    /// @notice Deploy Router only (estimated gas: ~2.5M)
    /// @dev Requires PoolManager to be deployed first
    function deployRouter(address poolManagerAddr) public {
        _setupDeployment();

        require(poolManagerAddr != address(0), "Invalid PoolManager address");

        vm.startBroadcast();
        router = new UnistockRouter(IPoolManager(poolManagerAddr));
        vm.stopBroadcast();

        console.logString("=== ROUTER DEPLOYED ===");
        console.logString("UnistockRouter address:");
        console.logAddress(address(router));
        console.logString("PoolManager address:");
        console.logAddress(poolManagerAddr);
    }

    /// @notice Configure PoolManager (estimated gas: ~200K)
    function configurePoolManager(address poolManagerAddr) public {
        _setupDeployment();

        require(poolManagerAddr != address(0), "Invalid PoolManager address");

        vm.startBroadcast();
        UnistockPoolManager pm = UnistockPoolManager(poolManagerAddr);

        // Configure PoolManager
        pm.setFeeRecipient(feeRecipient);
        pm.setDefaultProtocolFee(500); // 0.05%

        vm.stopBroadcast();

        console.logString("=== POOL MANAGER CONFIGURED ===");
        console.logString("Fee recipient set to:");
        console.logAddress(feeRecipient);
    }

    /// @notice Configure Router (estimated gas: ~150K)
    function configureRouter(address routerAddr) public {
        _setupDeployment();

        require(routerAddr != address(0), "Invalid Router address");

        vm.startBroadcast();
        UnistockRouter r = UnistockRouter(routerAddr);

        // Configure Router
        r.setFeeRecipient(feeRecipient);
        r.setSwapFee(10); // 0.1%
        r.setMaxSlippage(500); // 5%

        vm.stopBroadcast();

        console.logString("=== ROUTER CONFIGURED ===");
        console.logString("Fee recipient set to:");
        console.logAddress(feeRecipient);
    }

    /// @notice Authorize Router to call PoolManager (estimated gas: ~50K)
    function authorizeRouter(address poolManagerAddr, address routerAddr) public {
        _setupDeployment();

        require(poolManagerAddr != address(0), "Invalid PoolManager address");
        require(routerAddr != address(0), "Invalid Router address");

        vm.startBroadcast();
        UnistockPoolManager pm = UnistockPoolManager(poolManagerAddr);
        pm.setAuthorizedCaller(routerAddr, true);
        vm.stopBroadcast();

        console.logString("=== ROUTER AUTHORIZED ===");
        console.logString("Router authorized to call PoolManager");
    }

    /// @notice Whitelist tokens in PoolManager (estimated gas: ~150K)
    function whitelistTokens(address poolManagerAddr, address usdt, address usdc, address dai) public {
        _setupDeployment();

        require(poolManagerAddr != address(0), "Invalid PoolManager address");
        require(usdt != address(0) && usdc != address(0) && dai != address(0), "Invalid token addresses");

        vm.startBroadcast();
        UnistockPoolManager pm = UnistockPoolManager(poolManagerAddr);

        pm.setWhitelistedToken(usdt, true);
        pm.setWhitelistedToken(usdc, true);
        pm.setWhitelistedToken(dai, true);

        vm.stopBroadcast();

        console.logString("=== TOKENS WHITELISTED ===");
        console.logString("USDT whitelisted:");
        console.logAddress(usdt);
        console.logString("USDC whitelisted:");
        console.logAddress(usdc);
        console.logString("DAI whitelisted:");
        console.logAddress(dai);
    }

    /// @notice Initialize a single pool (estimated gas: ~300K)
    function initializePool(address poolManagerAddr, address token0, address token1, uint24 fee, int24 tickSpacing)
        public
    {
        require(poolManagerAddr != address(0), "Invalid PoolManager address");
        require(token0 != address(0) && token1 != address(0), "Invalid token addresses");

        // Ensure token0 < token1
        if (token0 > token1) {
            (token0, token1) = (token1, token0);
        }

        vm.startBroadcast();
        UnistockPoolManager pm = UnistockPoolManager(poolManagerAddr);

        PoolKey memory key = PoolKey({
            currency0: Currency.wrap(token0),
            currency1: Currency.wrap(token1),
            fee: fee,
            tickSpacing: tickSpacing,
            hooks: IHooks(address(0))
        });

        uint160 sqrtPriceX96 = TickMath.getSqrtPriceAtTick(0);

        try pm.initializePool(key, sqrtPriceX96) returns (int24 tick) {
            console.logString("=== POOL INITIALIZED ===");
            console.logString("Pool created successfully");
        } catch Error(string memory reason) {
            console.logString("Failed to create pool:");
            console.logString(reason);
        }

        vm.stopBroadcast();
    }

    /// @notice Mint tokens to admin (estimated gas: ~200K)
    function mintTokens(address usdt, address usdc, address dai) public {
        _setupDeployment();

        require(usdt != address(0) && usdc != address(0) && dai != address(0), "Invalid token addresses");

        vm.startBroadcast();

        uint256 usdtAmount = 100000 * 10 ** 6; // 100K tUSDT
        uint256 usdcAmount = 100000 * 10 ** 6; // 100K tUSDC
        uint256 daiAmount = 100000 * 10 ** 18; // 100K tDAI

        MintableToken(usdt).mint(admin, usdtAmount);
        MintableToken(usdc).mint(admin, usdcAmount);
        MintableToken(dai).mint(admin, daiAmount);

        vm.stopBroadcast();

        console.logString("=== TOKENS MINTED ===");
        console.logString("100K tokens minted to admin for each token");
    }

    // ============ HELPER FUNCTIONS ============

    function _setupDeployment() internal {
        admin = msg.sender;
        feeRecipient = msg.sender;

        console.logString("=== DEPLOYMENT SETUP ===");
        console.logString("Environment: RSK TESTNET");
        console.logString("Admin address:");
        console.logAddress(admin);
    }

    /// @notice Get deployment summary
    function getDeploymentSummary() public view {
        console.logString("=== DEPLOYMENT SUMMARY ===");
        console.logString("PoolManager:");
        console.logAddress(address(poolManager));
        console.logString("Router:");
        console.logAddress(address(router));
        console.logString("USDT:");
        console.logAddress(address(usdtToken));
        console.logString("USDC:");
        console.logAddress(address(usdcToken));
        console.logString("DAI:");
        console.logAddress(address(daiToken));
    }
}
