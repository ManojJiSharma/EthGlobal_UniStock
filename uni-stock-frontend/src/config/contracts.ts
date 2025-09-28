// Unistock DEX Contracts
export const CONTRACTS = {
  // Core Unistock DEX Contracts
  POOL_MANAGER: "0x3f5a57be9419f3b748503e54082835e6b3579210", // UnistockPoolManager address - UPDATE AFTER DEPLOYMENT
  ROUTER: "0xc2ee3689a00970762ef2dec84f714df31ff8c1fe", // UnistockRouter address - UPDATE AFTER DEPLOYMENT
  // Lending Contract
  LENDING: "0x...", // Lending Contract address - UPDATE AFTER DEPLOYMENT
} as const;

// Network Configuration
export const NETWORK_CONFIG = {
  chainId: 31, // Rootstock Testnet
  chainName: 'Rootstock Testnet',
  nativeCurrency: {
    name: 'Rootstock Bitcoin',
    symbol: 'RBTC',
    decimals: 18,
  },
  rpcUrls: ['https://public-node.testnet.rsk.co'],
  blockExplorerUrls: ['https://explorer.testnet.rsk.co/'],
};

// Sepolia Network Configuration
export const SEPOLIA_NETWORK_CONFIG = {
  chainId: 11155111, // Sepolia
  chainName: 'Sepolia',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: ['https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'],
  blockExplorerUrls: ['https://sepolia.etherscan.io/'],
};

// Common Token Addresses on Rootstock Testnet
export const TOKENS = {
  WETH: '0x0000000000000000000000000000000000000000', // WETH placeholder - UPDATE WITH ACTUAL ADDRESS
  USDC: '0xc20a069d7ec2c6e289f6910491b2c5243ffe7acd',
  USDT: '0x52e902767d5afd0fba635c741de33757655b1fa1',
  DAI: '0xaef32061a38ff859238a34777775a4606b608ab9',
} as const;

// Sepolia Token Addresses
export const SEPOLIA_TOKENS = {
  USDT: '0x66448b09b6d83Caaf98ac805C1Bb2111a4D146f9',
  WBTC: '0xF31CFD92CcA32C0d31cD042d02F310046D6d07A6',
  WETH: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14',
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

// Lending Contract Addresses for Sepolia
const CONTRACT_ADDRESSES = {
  [11155111]: { // Sepolia
    lzLiquidation: "0x764BF4Ee1293afC906fef87441B7147899BA695c",
    comptroller: "0xD286000aa66B2e31BF23325E837cC18Aa6DC916b",
    uniswapAnchored: "0x5140E0B6A1fCAA8B1f97d0C1fE6c56e1779Ef4E2",
    usdt: "0x66448b09b6d83Caaf98ac805C1Bb2111a4D146f9",
    usdtLToken: "0x0dC79F74f76863BFcffB240770De684e32Ab026E",
    WBTC: "0xF31CFD92CcA32C0d31cD042d02F310046D6d07A6",
    WBTClToken: "0x2171a8720e1a720F7D003EA57d01626eB3FD3941"
  },
  [421614]: { // Arbitrum Sepolia
    lzLiquidation: "0xE46ABf646E2520C32F320aE6A83e3c01494aCDaB",
    comptroller: "0x149Df73495798f7848fB4C306c6dC6b57fe0A477",
    uniswapAnchored: "0x1c881c2e9Ac15170F4dBca0a1B47924B944baf0B",
    usdt: "0xf456Cd915ae9F3202898D3876c16deF7586b52aF",
    usdtLToken: "0x6a5cea0f0A3772F03D641Df2Bdac4f9903a2d56c",
    WBTC: "0xD331DabfDE05128bd11Eb9D63B78d7520a520A6B",
    WBTClToken: "0xf04e70c740cd0e94d50A27AB238202dF08EFeF29"
  },
  [11155420]: { // Optimism Sepolia
    lzLiquidation: "0xBdD3B73Cde3fA97520f73A94147745B95840fE8b",
    comptroller: "0x992F94A86b16e05B32Fc71eA92FeeB634C8cb729",
    uniswapAnchored: "0xa2151Bf8fdBD5D9706110e15230E0F645E4B8E9e",
    usdt: "0x97E8180B390E1f753B9ED48a0B4955F8B589C63A",
    usdtLToken: "0xd6724d24e11c77687d1eA6AC9cBe669d84A1c989",
    WBTC: "0xBbEDfa9C906Cd9f757f6Ecab3BCb6ff83Ed0Fd7D",
    WBTClToken: "0x8a40366DFEDD45bFF691F9cc71B68F290C36524C"
  },
  [84532]: { // Base Sepolia
    lzLiquidation: "0x8FF877C2DDf0ceEa58B329156d4DBe9686ce666e",
    comptroller: "0xaE910880CCa13E274896F46E45B371f5e59AEBEB",
    uniswapAnchored: "0x7C41365dBe49632dE225DF92805D9CFD68F63AD9",
    usdt: "0x9d9cD9043b10551E27209A0ec56C2Ae8A0B43Eae",
    usdtLToken: "0x7870D50846C5E4CBe6057185E07728Bf10d9a18c",
    WBTC: "0x7eA2f98661b6F0142B0aE7A2Bfd419AE5D2a55b9",
    WBTClToken: "0x5B6238D452cC22fC5Cf9F4F7FAFC06C9109D27fC"
  },
  [686868]: { // Merlin Testnet
    lzLiquidation: "0x72bb7F2ad912E9bbF821dC32AB802A3F66CDf443",
    comptroller: "0x40F836b59e662fCD2a57B0fd04477F2389f33539",
    uniswapAnchored: "0xf19709bD0c6eb9b756761d8C7f76247Cf0F3EF2A",
    usdt: "0x5d0e946c1DDFB4A0869CD88Ee266A4Cf8b02Bb1D",
    usdtLToken: "0x1bbf6036EcfCd6a65b8146691B38b94e750CD0cf",
    WBTC: "0x1B5b6e917cEE98485B7Eda6152f047e8f1B20A59",
    WBTClToken: "0xAED47C293F1ff62304ce13e4436Cbe5613841c3E"
  }
};

// Export Sepolia contracts
export const SEPOLIA_CONTRACTS = CONTRACT_ADDRESSES[11155111];

export default CONTRACT_ADDRESSES;
