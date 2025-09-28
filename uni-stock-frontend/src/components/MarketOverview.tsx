import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown } from 'lucide-react'

// Rootstock testnet markets (ACTIVE)
const rootstockMarkets = [
  {
    token: 'RBTC',
    chain: 'Rootstock',
    supplyAPY: 3.45,
    borrowAPY: 5.67,
    totalSupplied: '125,000',
    totalBorrowed: '89,500',
    utilization: 71.6,
    change24h: 2.1,
    active: true
  },
  {
    token: 'USDC',
    chain: 'Rootstock',
    supplyAPY: 8.92,
    borrowAPY: 12.34,
    totalSupplied: '45M',
    totalBorrowed: '32M',
    utilization: 71.1,
    change24h: -0.5,
    active: true
  },
  {
    token: 'USDT',
    chain: 'Rootstock',
    supplyAPY: 2.15,
    borrowAPY: 4.89,
    totalSupplied: '5,670',
    totalBorrowed: '3,890',
    utilization: 68.6,
    change24h: 1.8,
    active: true
  },
  {
    token: 'DAI',
    chain: 'Rootstock',
    supplyAPY: 6.78,
    borrowAPY: 9.45,
    totalSupplied: '2.5M',
    totalBorrowed: '1.8M',
    utilization: 72.0,
    change24h: 3.2,
    active: true
  }
]

// Other chain markets (DISABLED)
const otherChainMarkets = [
  {
    token: 'ETH',
    chain: 'Ethereum',
    supplyAPY: 3.45,
    borrowAPY: 5.67,
    totalSupplied: '125,000',
    totalBorrowed: '89,500',
    utilization: 71.6,
    change24h: 2.1,
    active: false
  },
  {
    token: 'USDC',
    chain: 'Arbitrum',
    supplyAPY: 8.92,
    borrowAPY: 12.34,
    totalSupplied: '45M',
    totalBorrowed: '32M',
    utilization: 71.1,
    change24h: -0.5,
    active: false
  },
  {
    token: 'WBTC',
    chain: 'Polygon',
    supplyAPY: 2.15,
    borrowAPY: 4.89,
    totalSupplied: '5,670',
    totalBorrowed: '3,890',
    utilization: 68.6,
    change24h: 1.8,
    active: false
  },
  {
    token: 'MATIC',
    chain: 'Polygon',
    supplyAPY: 6.78,
    borrowAPY: 9.45,
    totalSupplied: '2.5M',
    totalBorrowed: '1.8M',
    utilization: 72.0,
    change24h: 3.2,
    active: false
  }
]

// All markets combined
const allMarkets = [...rootstockMarkets, ...otherChainMarkets]

export function MarketOverview() {
  return (
    <section id="markets" className="py-24 px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            <span className="gradient-text">Market Overview</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Real-time lending and borrowing rates across supported assets and chains
          </p>
          <div className="mt-4">
            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
              Rootstock Testnet Active
            </Badge>
            <Badge variant="outline" className="ml-2 bg-gray-500/10 text-gray-500 border-gray-500/20">
              Other Chains Coming Soon
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {allMarkets.map((market, index) => (
            <Card 
              key={`${market.token}-${market.chain}`} 
              className={`financial-card ${!market.active ? 'opacity-60' : ''}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{market.token}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className={market.active ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-gray-500/10 text-gray-500 border-gray-500/20"}
                    >
                      {market.chain}
                    </Badge>
                    {!market.active && (
                      <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20 text-xs">
                        Coming Soon
                      </Badge>
                    )}
                  </div>
                </div>
                <CardDescription>
                  {market.active ? 'Active Market' : 'Market Coming Soon'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Supply APY</p>
                    <p className="text-lg font-semibold text-green-600">{market.supplyAPY}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Borrow APY</p>
                    <p className="text-lg font-semibold text-red-600">{market.borrowAPY}%</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total Supplied</span>
                    <span className="font-medium">${market.totalSupplied}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total Borrowed</span>
                    <span className="font-medium">${market.totalBorrowed}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Utilization</span>
                    <span className="font-medium">{market.utilization}%</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm text-muted-foreground">24h Change</span>
                  <div className="flex items-center gap-1">
                    {market.change24h >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                    <span className={`text-sm font-medium ${market.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {market.change24h >= 0 ? '+' : ''}{market.change24h}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
