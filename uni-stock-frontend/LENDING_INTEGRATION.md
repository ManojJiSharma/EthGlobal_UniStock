# Lending Protocol Integration

This document describes the lending protocol integration with the UniStock frontend.

## Overview

The lending protocol has been integrated to support:
- Supply tokens to earn interest
- Redeem lTokens for underlying assets
- Borrow tokens against collateral
- Repay borrowed tokens
- View account liquidity and positions

## Network Configuration

- **Network**: Rootstock Testnet
- **Chain ID**: 31
- **RPC URL**: https://public-node.testnet.rsk.co
- **Explorer**: https://explorer.testnet.rsk.co/

## Contract Functions Integrated

### Supply & Redeem
- `supply(uint256 _amount, address _token)` - Supply underlying tokens to earn interest
- `redeem(uint256 _amount, address payable _lToken)` - Redeem lTokens for underlying tokens

### Borrow & Repay
- `borrow(uint256 _amount, address _token)` - Borrow underlying tokens against collateral
- `repayBorrow(uint256 _amount, address _lToken, uint8 chainType, uint256 srcEid)` - Repay borrowed tokens

### View Functions
- `getHypotheticalAccountLiquidityCollateral()` - Get account liquidity and collateral info
- `totalInvestment(address, address)` - Get user's total investment in a token
- `borrowBalance(address, address)` - Get user's borrow balance for a token

## Files Modified/Created

### Created Files:
1. `src/hooks/useLending.ts` - Main lending hook with contract interactions
2. `src/components/LendingForms.tsx` - Updated lending interface component

### Modified Files:
1. `src/config/contracts.ts` - Added lending contract address and updated network config
2. `src/config/abis.ts` - Added lending contract ABI and types

## Usage

### Connect Wallet
Users must connect their wallet to Rootstock testnet before using lending functions.

### Supply Tokens
1. Select token to supply
2. Enter amount
3. Click "Supply Token"
4. Confirm transaction

### Borrow Tokens
1. Ensure sufficient collateral is supplied
2. Select token to borrow
3. Enter amount (within health factor limits)
4. Click "Borrow Token"
5. Confirm transaction

### Health Factor
The system displays the user's health factor, which must remain above 1.0 to avoid liquidation.

## Error Handling

The integration includes comprehensive error handling for:
- Insufficient funds
- Insufficient collateral
- Borrow cap exceeded
- Market not listed
- Gas estimation failures

## Next Steps

1. Update contract addresses after deployment
2. Add real token addresses for Rootstock testnet
3. Implement cross-chain functionality (currently disabled)
4. Add more detailed error messages and user guidance

## Contract Address Updates Required

Before going live, update these addresses in `src/config/contracts.ts`:
- `CONTRACTS.LENDING` - Main lending contract address
- Update token addresses for actual Rootstock testnet tokens
