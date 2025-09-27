import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUpDown, Loader2, AlertCircle } from 'lucide-react';
import { useUnistockDEX } from '@/hooks/useUnistockDEX';
import { useWallet } from '@/hooks/useWallet';
import { TOKENS } from '@/config/contracts';

const SwapWidget = () => {
  const { 
    performSwap, 
    getAmountOut, 
    approveToken, 
    getTokenBalance,
    isLoading: dexLoading 
  } = useUnistockDEX();
  
  const { 
    isConnected, 
    address, 
    isCorrectNetwork, 
    isInitialized, 
    connectWallet, 
    switchNetwork 
  } = useWallet();

  const [fromToken, setFromToken] = useState(TOKENS.USDC);
  const [toToken, setToToken] = useState(TOKENS.WETH);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingQuote, setIsGettingQuote] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fromBalance, setFromBalance] = useState('0');
  const [toBalance, setToBalance] = useState('0');

  // Get token symbol
  const getTokenSymbol = (address: string) => {
    const tokenMap: { [key: string]: string } = {
      [TOKENS.WETH]: 'WETH',
      [TOKENS.USDC]: 'USDC',
      [TOKENS.USDT]: 'USDT',
      [TOKENS.DAI]: 'DAI',
    };
    return tokenMap[address] || 'UNKNOWN';
  };

  // Fetch balances
  const fetchBalances = useCallback(async () => {
    if (!address) return;
    
    try {
      const fromBal = await getTokenBalance(fromToken, address);
      const toBal = await getTokenBalance(toToken, address);
      setFromBalance(fromBal);
      setToBalance(toBal);
    } catch (error) {
      console.error('Error fetching balances:', error);
    }
  }, [address, fromToken, toToken, getTokenBalance]);

  // Get quote when amount changes
  useEffect(() => {
    const getQuote = async () => {
      if (!fromAmount || parseFloat(fromAmount) <= 0) {
        setToAmount('');
        return;
      }

      setIsGettingQuote(true);
      setError(null);

      try {
        const quote = await getAmountOut(fromToken, toToken, fromAmount);
        setToAmount(quote);
      } catch (error) {
        console.error('Error getting quote:', error);
        setError('Unable to get quote');
        setToAmount('');
      } finally {
        setIsGettingQuote(false);
      }
    };

    const timeoutId = setTimeout(getQuote, 500); // Debounce
    return () => clearTimeout(timeoutId);
  }, [fromAmount, fromToken, toToken, getAmountOut]);

  // Fetch balances when address or tokens change
  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  // Handle token selection
  const handleTokenSelect = (token: string, isFrom: boolean) => {
    if (isFrom) {
      setFromToken(token);
      setFromAmount('');
      setToAmount('');
    } else {
      setToToken(token);
      setToAmount('');
    }
  };

  // Handle reverse tokens
  const handleReverseTokens = () => {
    const tempToken = fromToken;
    const tempAmount = fromAmount;
    setFromToken(toToken);
    setToToken(tempToken);
    setFromAmount(toAmount);
    setToAmount(tempAmount);
  };

  // Handle swap
  const handleSwap = async () => {
    if (!isConnected || !address) {
      connectWallet();
      return;
    }

    if (!isCorrectNetwork) {
      switchNetwork();
      return;
    }

    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Starting swap process...');
      
      // 1. Approve token if needed
      console.log('Approving token:', { fromToken, amount: fromAmount });
      const approvalResult = await approveToken(fromToken, fromAmount);
      
      if (!approvalResult.success) {
        throw new Error(approvalResult.error || 'Token approval failed');
      }
      
      console.log('Approval successful, executing swap...');
      
      // 2. Execute swap
      const swapResult = await performSwap(fromToken, toToken, fromAmount, 0.5); // 0.5% slippage
      
      if (swapResult.success) {
        console.log('Swap successful!');
        setFromAmount('');
        setToAmount('');
        // Refresh balances
        await fetchBalances();
      } else {
        throw new Error(swapResult.error || 'Swap failed');
      }
    } catch (error) {
      console.error('Error executing swap:', error);
      setError(error instanceof Error ? error.message : 'Swap failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Get button disabled state
  const getButtonDisabled = () => {
    if (!isInitialized) return true;
    if (isLoading) return true;
    if (!isConnected) return false;
    if (!isCorrectNetwork) return false;
    if (!fromAmount || parseFloat(fromAmount) <= 0) return true;
    if (parseFloat(fromAmount) > parseFloat(fromBalance)) return true;
    return false;
  };

  // Get button text
  const getButtonText = () => {
    if (!isInitialized) return 'Initializing...';
    if (isLoading) return 'Swapping...';
    if (!isConnected) return 'Connect Wallet';
    if (!isCorrectNetwork) return 'Switch Network';
    if (!fromAmount || parseFloat(fromAmount) <= 0) return 'Enter Amount';
    if (parseFloat(fromAmount) > parseFloat(fromBalance)) return 'Insufficient Balance';
    return 'Swap';
  };

  return (
    <Card className="p-6 animated-card hover-lift scale-in">
      <div className="space-y-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Swap Tokens</h2>
          <p className="text-muted-foreground">Trade tokens on Unistock DEX</p>
        </div>

        {/* From Token */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">From</label>
            <div className="text-sm text-muted-foreground">
              Balance: {parseFloat(fromBalance).toFixed(4)}
            </div>
          </div>
          <div className="flex space-x-2">
            <div className="flex-1">
              <Input
                type="number"
                placeholder="0.0"
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
                className="text-lg"
              />
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFromAmount(fromBalance)}
                className="text-xs"
              >
                Max
              </Button>
              <select
                value={fromToken}
                onChange={(e) => handleTokenSelect(e.target.value, true)}
                className="px-3 py-2 border rounded-md bg-background min-w-[100px]"
              >
                {Object.entries(TOKENS).map(([key, address]) => (
                  <option key={key} value={address}>
                    {getTokenSymbol(address)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Reverse Button */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReverseTokens}
            className="rounded-full p-2 hover-lift"
          >
            <ArrowUpDown className="w-4 h-4" />
          </Button>
        </div>

        {/* To Token */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">To</label>
            <div className="text-sm text-muted-foreground">
              Balance: {parseFloat(toBalance).toFixed(4)}
            </div>
          </div>
          <div className="flex space-x-2">
            <div className="flex-1">
              <Input
                type="number"
                placeholder="0.0"
                value={toAmount}
                readOnly
                className="text-lg bg-muted"
              />
            </div>
            <div className="flex space-x-2">
              <select
                value={toToken}
                onChange={(e) => handleTokenSelect(e.target.value, false)}
                className="px-3 py-2 border rounded-md bg-background min-w-[100px]"
              >
                {Object.entries(TOKENS).map(([key, address]) => (
                  <option key={key} value={address}>
                    {getTokenSymbol(address)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Quote Loading */}
        {isGettingQuote && (
          <div className="flex items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Getting quote...
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="flex items-center space-x-2 text-red-500 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Swap Button */}
        <Button
          onClick={handleSwap}
          disabled={getButtonDisabled()}
          className="w-full btn-gradient hover-lift"
          size="lg"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
          ) : null}
          {getButtonText()}
        </Button>

        {/* Swap Info */}
        {fromAmount && toAmount && !isGettingQuote && (
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>Price Impact</span>
              <span>~0.1%</span>
            </div>
            <div className="flex justify-between">
              <span>Network Fee</span>
              <span>~$0.0005</span>
            </div>
            <div className="flex justify-between">
              <span>Protocol</span>
              <Badge variant="secondary">Unistock DEX</Badge>
            </div>
            <div className="flex justify-between">
              <span>Route</span>
              <span className="text-xs">
                {getTokenSymbol(fromToken)} → {getTokenSymbol(toToken)}
              </span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default SwapWidget;
