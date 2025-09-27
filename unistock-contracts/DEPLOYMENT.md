# 🚀 Unistock DEX Deployment Guide

This guide covers deploying the Unistock DEX contracts to Rootstock mainnet and testnet.

## 📋 Prerequisites

### Required Tools
- [Foundry](https://book.getfoundry.sh/getting-started/installation) (latest version)
- Git
- Node.js 16+

### Required Accounts
- Rootstock wallet with sufficient RBTC for gas fees
- Admin wallet address for contract ownership
- Fee recipient wallet address

## 🔧 Environment Setup

### 1. Create Environment File

Create a `.env` file in the project root:

```bash
# Rootstock Network Configuration
ROOTSTOCK_MAINNET_RPC_URL=https://public-node.rsk.co
ROOTSTOCK_TESTNET_RPC_URL=https://public-node.testnet.rsk.co

# API Keys (optional for verification)
INFURA_API_KEY=your_infura_key_here
ETHERSCAN_API_KEY=your_etherscan_key_here

# Deployment Configuration
PRIVATE_KEY=your_private_key_here
ADMIN_ADDRESS=your_admin_address_here
FEE_RECIPIENT_ADDRESS=your_fee_recipient_address_here

# Gas Configuration
GAS_PRICE=20000000000
GAS_LIMIT=3000000
```

### 2. Source Environment Variables

```bash
# Load environment variables
source .env
```

## 🌐 Rootstock Network Information

### Rootstock Testnet
- **Chain ID**: 31
- **Currency**: tRBTC
- **RPC URL**: https://public-node.testnet.rsk.co
- **Explorer**: https://explorer.testnet.rsk.co
- **Faucet**: https://faucet.testnet.rsk.co

### Rootstock Mainnet
- **Chain ID**: 30
- **Currency**: RBTC
- **RPC URL**: https://public-node.rsk.co
- **Explorer**: https://explorer.rsk.co

## 💰 Gas Requirements

### Estimated Gas Costs (Rootstock)

| Operation | Gas Cost | RBTC Cost (at 20 gwei) |
|-----------|----------|------------------------|
| Pool Manager Deploy | ~3,000,000 | ~0.06 RBTC |
| Router Deploy | ~2,500,000 | ~0.05 RBTC |
| Pool Initialize | ~400,000 | ~0.008 RBTC |
| Swap | ~200,000 | ~0.004 RBTC |

**Total Deployment Cost**: ~0.12 RBTC

## 🧪 Testnet Deployment

### Step 1: Get Testnet RBTC

1. Visit [Rootstock Testnet Faucet](https://faucet.testnet.rsk.co)
2. Enter your wallet address
3. Claim testnet RBTC

### Step 2: Deploy to Testnet

```bash
# Deploy to Rootstock Testnet
forge script script/DeployUnistock.s.sol:DeployUnistock \
  --rpc-url rootstock_testnet \
  --broadcast \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --private-key $PRIVATE_KEY \
  -vvvv
```

### Step 3: Verify Deployment

```bash
# Check deployment status
forge script script/DeployUnistock.s.sol:DeployUnistock \
  --rpc-url rootstock_testnet \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY
```

## 🏗️ Mainnet Deployment

### Step 1: Pre-Deployment Checklist

- [ ] Contracts tested on testnet
- [ ] Admin wallet has sufficient RBTC
- [ ] Fee recipient address configured
- [ ] Environment variables set
- [ ] Backup of private keys

### Step 2: Deploy to Mainnet

```bash
# Deploy to Rootstock Mainnet
forge script script/DeployUnistock.s.sol:DeployUnistock \
  --rpc-url rootstock_mainnet \
  --broadcast \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --private-key $PRIVATE_KEY \
  --slow \
  -vvvv
```

### Step 3: Post-Deployment Setup

```bash
# Initialize default pools (optional)
forge script script/DeployUnistock.s.sol:DeployUnistock \
  --rpc-url rootstock_mainnet \
  --sig "initializeDefaultPools()" \
  --private-key $PRIVATE_KEY
```

## 🔍 Contract Verification

### Automatic Verification

Contracts are automatically verified during deployment if the `--verify` flag is used.

### Manual Verification

```bash
# Verify specific contract
forge verify-contract \
  --chain-id 30 \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  CONTRACT_ADDRESS \
  src/core/UnistockPoolManager.sol:UnistockPoolManager
```

## 📊 Post-Deployment Configuration

### 1. Set Initial Configuration

```bash
# Set fee recipient
cast send $POOL_MANAGER_ADDRESS \
  "setFeeRecipient(address)" \
  $FEE_RECIPIENT_ADDRESS \
  --rpc-url rootstock_mainnet \
  --private-key $PRIVATE_KEY

# Set default protocol fee
cast send $POOL_MANAGER_ADDRESS \
  "setDefaultProtocolFee(uint24)" \
  500 \
  --rpc-url rootstock_mainnet \
  --private-key $PRIVATE_KEY
```

### 2. Whitelist Tokens

```bash
# Whitelist common tokens (example)
cast send $POOL_MANAGER_ADDRESS \
  "setWhitelistedToken(address,bool)" \
  $TOKEN_ADDRESS \
  true \
  --rpc-url rootstock_mainnet \
  --private-key $PRIVATE_KEY
```

### 3. Initialize First Pool

```bash
# Initialize a pool (example: RBTC/USDT)
cast send $POOL_MANAGER_ADDRESS \
  "initializePool((address,address,uint24,int24,address),uint160)" \
  "($RBTC_ADDRESS,$USDT_ADDRESS,3000,60,0x0000000000000000000000000000000000000000)" \
  "79228162514264337593543950336" \
  --rpc-url rootstock_mainnet \
  --private-key $PRIVATE_KEY
```

## 🛡️ Security Considerations

### Pre-Deployment

1. **Test Thoroughly**: Deploy and test on testnet first
2. **Review Configuration**: Double-check all addresses and parameters
3. **Backup Keys**: Ensure private keys are safely backed up
4. **Gas Estimation**: Test gas costs on testnet

### Post-Deployment

1. **Transfer Ownership**: Consider transferring admin role to multisig
2. **Monitor Activity**: Watch for unusual contract interactions
3. **Regular Backups**: Keep records of all configuration changes
4. **Emergency Procedures**: Have emergency pause procedures ready

## 📋 Common Rootstock Tokens

### Mainnet Token Addresses

```solidity
// Common Rootstock Mainnet Tokens
address constant RBTC = 0x0000000000000000000000000000000000000000;
address constant USDT = 0xEf213441a85DF4d7acBdAe0Cf78004E1e486BB96;
address constant USDC = 0x2C54921A96A6e8e5Bc3c2c6b4b7b7b7b7b7b7b7b7; // Check current address
address constant DAI = 0x6B175474E89094C44Da98b954EedeAC495271d0F; // Check current address
```

### Testnet Token Addresses

```solidity
// Common Rootstock Testnet Tokens
address constant tRBTC = 0x0000000000000000000000000000000000000000;
address constant tUSDT = 0x4C4c6F5d6E9e8e5Bc3c2c6b4b7b7b7b7b7b7b7b7; // Check current address
```

## 🔧 Troubleshooting

### Common Issues

1. **Gas Estimation Failed**
   ```bash
   # Increase gas limit
   --gas-limit 5000000
   ```

2. **Verification Failed**
   ```bash
   # Try manual verification
   forge verify-contract --chain-id 30 CONTRACT_ADDRESS CONTRACT_NAME
   ```

3. **RPC Connection Issues**
   ```bash
   # Use alternative RPC
   --rpc-url https://rsk-live.skalenodes.com/v1/elated-tan-skat
   ```

### Debug Commands

```bash
# Check deployment status
forge script script/DeployUnistock.s.sol:DeployUnistock \
  --rpc-url rootstock_mainnet \
  --dry-run

# Estimate gas costs
forge script script/DeployUnistock.s.sol:DeployUnistock \
  --rpc-url rootstock_mainnet \
  --gas-estimate
```

## 📞 Support

If you encounter issues during deployment:

1. Check the [Rootstock Documentation](https://developers.rsk.co/)
2. Join the [Rootstock Discord](https://discord.gg/rsk)
3. Create an issue in this repository
4. Contact the Unistock team

## ✅ Deployment Checklist

### Pre-Deployment
- [ ] Environment variables configured
- [ ] Testnet deployment successful
- [ ] Gas costs estimated
- [ ] Admin and fee recipient addresses confirmed
- [ ] Backup procedures in place

### Deployment
- [ ] Mainnet deployment completed
- [ ] Contracts verified on explorer
- [ ] Initial configuration applied
- [ ] First pool initialized
- [ ] Token whitelisting configured

### Post-Deployment
- [ ] Admin functions tested
- [ ] Emergency procedures documented
- [ ] Monitoring systems in place
- [ ] Documentation updated with addresses

---

**⚠️ Important**: Always test on testnet first and ensure you have sufficient RBTC for gas fees before mainnet deployment.
