// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

/// @title MintableToken
/// @notice A mintable ERC20 token for staging/testing purposes
/// @dev This token should NOT be used in production
contract MintableToken is ERC20, Ownable, ERC20Permit {
    uint8 private _decimals;

    constructor(string memory name, string memory symbol, uint8 decimals_, address initialOwner)
        ERC20(name, symbol)
        Ownable(initialOwner)
        ERC20Permit(name)
    {
        _decimals = decimals_;
    }

    /// @notice Mint tokens to a specific address
    /// @param to Address to mint tokens to
    /// @param amount Amount of tokens to mint
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /// @notice Burn tokens from a specific address
    /// @param from Address to burn tokens from
    /// @param amount Amount of tokens to burn
    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }

    /// @notice Get the number of decimals
    /// @return Number of decimals
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    /// @notice Batch mint tokens to multiple addresses
    /// @param recipients Array of recipient addresses
    /// @param amounts Array of amounts to mint
    function batchMint(address[] calldata recipients, uint256[] calldata amounts) external onlyOwner {
        require(recipients.length == amounts.length, "Arrays length mismatch");

        for (uint256 i = 0; i < recipients.length; i++) {
            _mint(recipients[i], amounts[i]);
        }
    }

    /// @notice Emergency function to mint tokens (for testing only)
    /// @param to Address to mint tokens to
    /// @param amount Amount of tokens to mint
    function emergencyMint(address to, uint256 amount) external {
        // Only allow emergency minting in staging/testnet environments
        require(block.chainid != 30, "Emergency minting not allowed on mainnet");
        _mint(to, amount);
    }
}
