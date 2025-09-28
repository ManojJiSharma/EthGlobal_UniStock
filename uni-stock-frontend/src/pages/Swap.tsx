import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ArrowUpDown, Loader2, TrendingUp, Info } from 'lucide-react'
import { useUnistockDEX } from '@/hooks/useUnistockDEX'
import { useWallet } from '@/hooks/useWallet'
import { toast } from '@/components/ui/use-toast'
import { NETWORK_CONFIG } from '@/config/contracts'

// Mock tokens for Rootstock testnet
const tokens = [
  { symbol: 'RBTC', name: 'Rootstock Bitcoin', address: '0x0000000000000000000000000000000000000000', balance: '0.5', decimals: 18 },
  { symbol: 'USDC', name: 'USD Coin', address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', balance: '1,000', decimals: 6 },
  { symbol: 'USDT', name: 'Tether USD', address: '0x7169D38820dfd117C3FA1f22a697dBA58d90BA06', balance: '500', decimals: 6 },
  { symbol: 'DAI', name: 'Dai Stablecoin', address: '0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357', balance: '750', decimals: 18 }
]

export default function Swap() {
  const [tokenIn, setTokenIn] = useState('RBTC')
  const [tokenOut, setTokenOut] = useState('USDC')
  const [amountIn, setAmountIn] = useState('')
  const [amountOut, setAmountOut] = useState('')
  const [slippage, setSlippage] = useState('0.5')
  const [isLoadingQuote, setIsLoadingQuote] = useState(false)

  const { 
    pools, 
    isLoading: dexLoading, 
    error: dexError,
    getAmountOut,
    performSwap,
    isLoading: swapLoading
  } = useUnistockDEX()
  
  const { 
    isConnected, 
    address, 
    isCorrectNetwork, 
    connectWallet, 
    switchNetwork,
    isSwitchingNetwork
  } = useWallet()

  // Get quote when inputs change
  useEffect(() => {
    if (amountIn && tokenIn && tokenOut && isConnected) {
      getQuote()
    }
  }, [amountIn, tokenIn, tokenOut, isConnected])

  const getQuote = async () => {
    if (!amountIn || !tokenIn || !tokenOut) return

    setIsLoadingQuote(true)
    try {
      const tokenInData = tokens.find(t => t.symbol === tokenIn)
      const tokenOutData = tokens.find(t => t.symbol === tokenOut)
      
      if (tokenInData && tokenOutData) {
        const quote = await getAmountOut(tokenInData.address, tokenOutData.address, amountIn)
        setAmountOut(quote)
      }
    } catch (error) {
      console.error('Quote error:', error)
      setAmountOut('')
    } finally {
      setIsLoadingQuote(false)
    }
  }

  const handleSwap = async () => {
    if (!isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet first",
        variant: "destructive"
      })
      return
    }

    if (!isCorrectNetwork) {
      toast({
        title: "Wrong network",
        description: `Please switch to ${NETWORK_CONFIG.chainName}`,
        variant: "destructive"
      })
      return
    }

    if (!amountIn || !tokenIn || !tokenOut) {
      toast({
        title: "Missing information",
        description: "Please enter amount and select tokens",
        variant: "destructive"
      })
      return
    }

    try {
      const tokenInData = tokens.find(t => t.symbol === tokenIn)
      const tokenOutData = tokens.find(t => t.symbol === tokenOut)
      
      if (tokenInData && tokenOutData) {
        const result = await performSwap(tokenInData.address, tokenOutData.address, amountIn, parseFloat(slippage))
        
        if (result.success) {
          toast({
            title: "Swap successful",
            description: `Successfully swapped ${amountIn} ${tokenIn} for ${result.amountOut} ${tokenOut}`,
          })
          setAmountIn('')
          setAmountOut('')
        } else {
          toast({
            title: "Swap failed",
            description: result.error || "Transaction failed",
            variant: "destructive"
          })
        }
      }
    } catch (error) {
      console.error('Swap error:', error)
      toast({
        title: "Swap failed",
        description: "An unexpected error occurred",
        variant: "destructive"
      })
    }
  }

  const switchTokens = () => {
    const tempToken = tokenIn
    const tempAmount = amountIn
    setTokenIn(tokenOut)
    setTokenOut(tempToken)
    setAmountIn(amountOut)
    setAmountOut(tempAmount)
  }

  const getButtonText = () => {
    if (!isConnected) return 'Connect Wallet'
    if (!isCorrectNetwork) return 'Switch Network'
    if (swapLoading) return 'Swapping...'
    if (isSwitchingNetwork) return 'Switching Network...'
    if (!amountIn) return 'Enter Amount'
    if (!amountOut) return 'Insufficient Liquidity'
    return 'Swap'
  }

  const isButtonDisabled = () => {
    if (!isConnected) return false
    if (!isCorrectNetwork) return false
    if (swapLoading) return true
    if (isSwitchingNetwork) return true
    if (!amountIn) return true
    if (!amountOut) return true
    return false
  }

  const handleButtonClick = () => {
    if (!isConnected) {
      connectWallet()
    } else if (!isCorrectNetwork) {
      switchNetwork()
    } else {
      handleSwap()
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">
              <span className="gradient-text">Token Swap</span>
            </h1>
            <p className="text-muted-foreground">
              Trade tokens instantly on {NETWORK_CONFIG.chainName}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Swap Interface */}
            <div className="lg:col-span-2">
              <Card className="financial-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-accent" />
                    Swap Tokens
                  </CardTitle>
                  <CardDescription>
                    Exchange tokens with minimal slippage and low fees
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Token In */}
                  <div className="space-y-2">
                    <Label>From</Label>
                    <div className="flex gap-2">
                      <Select value={tokenIn} onValueChange={setTokenIn}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {tokens.map((token) => (
                            <SelectItem key={token.symbol} value={token.symbol}>
                              {token.symbol}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        placeholder="0.0"
                        value={amountIn}
                        onChange={(e) => setAmountIn(e.target.value)}
                        className="flex-1"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Balance: {tokens.find(t => t.symbol === tokenIn)?.balance} {tokenIn}
                    </p>
                  </div>

                  {/* Swap Button */}
                  <div className="flex justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={switchTokens}
                      className="rounded-full p-2"
                    >
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Token Out */}
                  <div className="space-y-2">
                    <Label>To</Label>
                    <div className="flex gap-2">
                      <Select value={tokenOut} onValueChange={setTokenOut}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {tokens.map((token) => (
                            <SelectItem key={token.symbol} value={token.symbol}>
                              {token.symbol}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        placeholder="0.0"
                        value={amountOut}
                        readOnly
                        className="flex-1 bg-muted"
                      />
                    </div>
                    {isLoadingQuote && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Getting quote...
                      </div>
                    )}
                  </div>

                  {/* Slippage */}
                  <div className="space-y-2">
                    <Label>Slippage Tolerance</Label>
                    <div className="flex gap-2">
                      {['0.1', '0.5', '1.0'].map((value) => (
                        <Button
                          key={value}
                          variant={slippage === value ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSlippage(value)}
                        >
                          {value}%
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Swap Button */}
                  <Button
                    className="w-full bg-gradient-primary text-primary-foreground border-0 hover:opacity-90"
                    onClick={handleButtonClick}
                    disabled={isButtonDisabled()}
                  >
                    {swapLoading || isSwitchingNetwork ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {getButtonText()}
                      </>
                    ) : (
                      getButtonText()
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Info Panel */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    Protocol Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Protocol</span>
                    <Badge variant="secondary">Unistock DEX</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Network</span>
                    <span>{NETWORK_CONFIG.chainName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Active Pools</span>
                    <span>{pools.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Pairs</span>
                    <span>{pools.length}</span>
                  </div>
                </CardContent>
              </Card>

              {dexError && (
                <Card className="border-destructive">
                  <CardContent className="pt-6">
                    <p className="text-destructive text-sm">{dexError}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
