import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, ArrowDownUp, TrendingUp, Shield } from 'lucide-react'
import { useState } from 'react'

const tokens = [
  // { symbol: 'ETH', name: 'Ethereum', chain: 'Ethereum', balance: '12.5' },
  { symbol: 'USDC', name: 'USD Coin', chain: 'Arbitrum', balance: '5,000' },
  { symbol: 'WBTC', name: 'Wrapped Bitcoin', chain: 'Polygon', balance: '0.75' },
  // { symbol: 'MATIC', name: 'Polygon', chain: 'Polygon', balance: '2,500' }
]

export function LendingForms() {
  const [supplyAmount, setSupplyAmount] = useState('')
  const [borrowAmount, setBorrowAmount] = useState('')
  const [selectedSupplyToken, setSelectedSupplyToken] = useState('')
  const [selectedBorrowToken, setSelectedBorrowToken] = useState('')

  return (
    <section id="portfolio" className="py-24 px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            <span className="gradient-text">Lending Interface</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Supply assets to earn yield or borrow against your collateral
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Supply/Redeem */}
          <Card className="financial-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-accent" />
                Supply & Earn
              </CardTitle>
              <CardDescription>
                Supply tokens to earn interest and use them as collateral
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="supply" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="supply">Supply</TabsTrigger>
                  <TabsTrigger value="redeem">Redeem</TabsTrigger>
                </TabsList>
                
                <TabsContent value="supply" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="supply-token">Select Token</Label>
                    <Select value={selectedSupplyToken} onValueChange={setSelectedSupplyToken}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose token to supply" />
                      </SelectTrigger>
                      <SelectContent>
                        {tokens.map((token) => (
                          <SelectItem key={token.symbol} value={token.symbol}>
                            <div className="flex items-center justify-between w-full">
                              <span>{token.symbol} - {token.name}</span>
                              <Badge variant="outline" className="ml-2">{token.chain}</Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="supply-amount">Amount</Label>
                    <div className="relative">
                      <Input
                        id="supply-amount"
                        type="number"
                        placeholder="0.0"
                        value={supplyAmount}
                        onChange={(e) => setSupplyAmount(e.target.value)}
                        className="pr-16"
                      />
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs"
                        onClick={() => {
                          const selectedToken = tokens.find(t => t.symbol === selectedSupplyToken)
                          if (selectedToken) setSupplyAmount(selectedToken.balance)
                        }}
                      >
                        MAX
                      </Button>
                    </div>
                    {selectedSupplyToken && (
                      <p className="text-xs text-muted-foreground">
                        Balance: {tokens.find(t => t.symbol === selectedSupplyToken)?.balance} {selectedSupplyToken}
                      </p>
                    )}
                  </div>
                  
                  <div className="bg-muted/50 p-3 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Supply APY</span>
                      <span className="metric-positive font-semibold">3.45%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>You will receive</span>
                      <span className="font-semibold">{supplyAmount || '0'} l{selectedSupplyToken || 'Token'}</span>
                    </div>
                  </div>
                  
                  <Button className="w-full bg-gradient-primary text-primary-foreground border-0 hover:opacity-90">
                    Supply {selectedSupplyToken || 'Token'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </TabsContent>
                
                <TabsContent value="redeem" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="redeem-token">Select lToken</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose lToken to redeem" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lETH">lETH - Lending ETH</SelectItem>
                        <SelectItem value="lUSDC">lUSDC - Lending USDC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="redeem-amount">Amount</Label>
                    <Input
                      id="redeem-amount"
                      type="number"
                      placeholder="0.0"
                    />
                  </div>
                  
                  <Button className="w-full" variant="outline">
                    Redeem Tokens
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Borrow/Repay */}
          <Card className="financial-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowDownUp className="h-5 w-5 text-primary" />
                Borrow & Repay
              </CardTitle>
              <CardDescription>
                Borrow against your collateral or repay existing loans
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="borrow" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="borrow">Borrow</TabsTrigger>
                  <TabsTrigger value="repay">Repay</TabsTrigger>
                </TabsList>
                
                <TabsContent value="borrow" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="borrow-token">Select Token to Borrow</Label>
                    <Select value={selectedBorrowToken} onValueChange={setSelectedBorrowToken}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose token to borrow" />
                      </SelectTrigger>
                      <SelectContent>
                        {tokens.map((token) => (
                          <SelectItem key={token.symbol} value={token.symbol}>
                            <div className="flex items-center justify-between w-full">
                              <span>{token.symbol} - {token.name}</span>
                              <Badge variant="outline" className="ml-2">{token.chain}</Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="borrow-amount">Amount</Label>
                    <Input
                      id="borrow-amount"
                      type="number"
                      placeholder="0.0"
                      value={borrowAmount}
                      onChange={(e) => setBorrowAmount(e.target.value)}
                    />
                  </div>
                  
                  <div className="bg-muted/50 p-3 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Borrow APY</span>
                      <span className="metric-negative font-semibold">5.67%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Health Factor</span>
                      <span className="metric-positive font-semibold">2.45</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Available to borrow</span>
                      <span className="font-semibold">$25,000</span>
                    </div>
                  </div>
                  
                  <Button className="w-full bg-gradient-secondary text-secondary-foreground border-0 hover:opacity-90">
                    Borrow {selectedBorrowToken || 'Token'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </TabsContent>
                
                <TabsContent value="repay" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="repay-token">Select Borrowed Token</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose loan to repay" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="WBTC">WBTC - 1.2 borrowed</SelectItem>
                        <SelectItem value="USDC">USDC - 5,000 borrowed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="repay-amount">Amount</Label>
                    <Input
                      id="repay-amount"
                      type="number"
                      placeholder="0.0"
                    />
                  </div>
                  
                  <Button className="w-full" variant="outline">
                    Repay Loan
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Cross-Chain Section */}
        <div className="mt-16">
          <Card className="financial-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-secondary" />
                    Cross-Chain Operations
                  </CardTitle>
                  <CardDescription>
                    Borrow and liquidate across different blockchain networks
                  </CardDescription>
                </div>
                <Badge variant="outline" className="bg-gradient-secondary text-secondary-foreground border-0">
                  Coming Soon
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="h-20 flex-col" disabled>
                  <ArrowDownUp className="h-6 w-6 mb-2" />
                  Cross-Chain Borrow
                </Button>
                <Button variant="outline" className="h-20 flex-col" disabled>
                  <Shield className="h-6 w-6 mb-2" />
                  Cross-Chain Liquidation
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
