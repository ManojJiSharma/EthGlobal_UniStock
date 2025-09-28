// Simple debug script to check pool manager functions
const { ethers } = require('ethers');

// Rootstock testnet RPC
const RPC_URL = 'https://public-node.testnet.rsk.co';
const provider = new ethers.JsonRpcProvider(RPC_URL);

// Contract addresses
const POOL_MANAGER_ADDRESS = '0x3f5a57be9419f3b748503e54082835e6b3579210';
const ROUTER_ADDRESS = '0xc2ee3689a00970762ef2dec84f714df31ff8c1fe';

// Simple ABI for testing
const POOL_MANAGER_ABI = [
  'function admin() external view returns (address)',
  'function authorizedCallers(address) external view returns (bool)',
  'function getPoolKey(bytes32 poolId) external view returns (tuple(address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks))',
  'function isPoolActive(bytes32 poolId) external view returns (bool)',
];

const ROUTER_ABI = [
  'function admin() external view returns (address)',
  'function authorizedCallers(address) external view returns (bool)',
  'function addLiquidity(address token0, address token1, uint256 amount0, uint256 amount1, int24 tickLower, int24 tickUpper, uint24 fee, int24 tickSpacing) external returns (uint128 liquidity)',
];

async function debugContracts() {
  try {
    console.log('Connecting to Rootstock testnet...');
    
    const poolManager = new ethers.Contract(POOL_MANAGER_ADDRESS, POOL_MANAGER_ABI, provider);
    const router = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, provider);
    
    console.log('Pool Manager Address:', POOL_MANAGER_ADDRESS);
    console.log('Router Address:', ROUTER_ADDRESS);
    
    // Check if contracts are deployed
    try {
      const poolManagerAdmin = await poolManager.admin();
      console.log('Pool Manager Admin:', poolManagerAdmin);
    } catch (err) {
      console.log('Pool Manager not accessible:', err.message);
    }
    
    try {
      const routerAdmin = await router.admin();
      console.log('Router Admin:', routerAdmin);
    } catch (err) {
      console.log('Router not accessible:', err.message);
    }
    
    // Check if router is authorized in pool manager
    try {
      const isAuthorized = await poolManager.authorizedCallers(ROUTER_ADDRESS);
      console.log('Router authorized in Pool Manager:', isAuthorized);
    } catch (err) {
      console.log('Could not check authorization:', err.message);
    }
    
    // Test pool key generation
    const token0 = '0x52e902767d5aFD0fba635C741DE33757655B1fa1'; // USDC
    const token1 = '0xC20A069d7Ec2C6E289f6910491b2C5243ffe7aCd'; // USDT
    const fee = 3000;
    const tickSpacing = 60;
    
    const [tokenA, tokenB] = token0 < token1 ? [token0, token1] : [token1, token0];
    const poolId = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ['address', 'address', 'uint24', 'int24', 'address'],
        [tokenA, tokenB, fee, tickSpacing, ethers.ZeroAddress]
      )
    );
    
    console.log('Generated Pool ID:', poolId);
    
    // Check if pool exists
    try {
      const poolKey = await poolManager.getPoolKey(poolId);
      console.log('Pool Key:', poolKey);
      
      const isActive = await poolManager.isPoolActive(poolId);
      console.log('Pool Active:', isActive);
    } catch (err) {
      console.log('Pool does not exist or error:', err.message);
    }
    
  } catch (error) {
    console.error('Debug error:', error);
  }
}

debugContracts();
