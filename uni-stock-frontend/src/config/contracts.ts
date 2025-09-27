// Unistock DEX Contracts
export const CONTRACTS = {
  // Core Unistock DEX Contracts
  POOL_MANAGER: "0x...", // UnistockPoolManager address - UPDATE AFTER DEPLOYMENT
  ROUTER: "0x...", // UnistockRouter address - UPDATE AFTER DEPLOYMENT
} as const;

// Network Configuration
export const NETWORK_CONFIG = {
  chainId: 11155111, // Sepolia
  chainName: 'Sepolia',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: ['https://sepolia.infura.io/v3/YOUR_INFURA_KEY'],
  blockExplorerUrls: ['https://sepolia.etherscan.io/'],
};

// Common Token Addresses on Sepolia
export const TOKENS = {
  WETH: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14',
  USDC: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
  USDT: '0x7169D38820dfd117C3FA1f22a697dBA58d90BA06',
  DAI: '0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357',
} as const;

// Pool Configuration
export const POOL_CONFIG = {
  feeTiers: [
    { fee: 100, label: '0.01%', tickSpacing: 1 },
    { fee: 500, label: '0.05%', tickSpacing: 10 },
    { fee: 3000, label: '0.3%', tickSpacing: 60 },
    { fee: 10000, label: '1%', tickSpacing: 200 },
  ],
  defaultFee: 3000, // 0.3%
  defaultTickSpacing: 60,
};
