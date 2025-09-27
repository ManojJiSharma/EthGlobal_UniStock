import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Loader2, BarChart3 } from "lucide-react";
import { useUnistockDEX } from "@/hooks/useUnistockDEX";
import { useWallet } from "@/hooks/useWallet";
import SwapWidget from "@/components/SwapWidget";
import { TOKENS } from "@/config/contracts";

const Swap = () => {
  const { pools, isLoading, error, fetchPools } = useUnistockDEX();
  const { isConnected, address } = useWallet();
  const [sortBy, setSortBy] = useState<'volume' | 'liquidity'>('volume');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchPools();
  }, [fetchPools]);

  const formatNumber = (num: string) => {
    const number = parseFloat(num);
    if (number >= 1000000) {
      return `$${(number / 1000000).toFixed(1)}M`;
    } else if (number >= 1000) {
      return `$${(number / 1000).toFixed(1)}K`;
    }
    return `$${number.toFixed(0)}`;
  };

  const getTokenSymbol = (address: string) => {
    const tokenMap: { [key: string]: string } = {
      [TOKENS.WETH]: 'WETH',
      [TOKENS.USDC]: 'USDC',
      [TOKENS.USDT]: 'USDT',
      [TOKENS.DAI]: 'DAI',
    };
    return tokenMap[address] || 'UNKNOWN';
  };

  const sortedPools = [...pools].sort((a, b) => {
    let aValue, bValue;
    
    if (sortBy === 'volume') {
      aValue = parseFloat(a.volume24h);
      bValue = parseFloat(b.volume24h);
    } else {
      aValue = parseFloat(a.liquidity);
      bValue = parseFloat(b.liquidity);
    }
    
    return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
  });

  const totalLiquidity = pools.reduce((sum, pool) => sum + parseFloat(pool.liquidity), 0);
  const totalVolume = pools.reduce((sum, pool) => sum + parseFloat(pool.volume24h), 0);
  const totalFees = pools.reduce((sum, pool) => sum + parseFloat(pool.fees24h), 0);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="ml-2">Loading swap data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 relative z-10">
      <div className="space-y-8">
        {/* Page Header */}
        <div className="text-center fade-in">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Swap Tokens
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Trade tokens instantly on Unistock DEX
          </p>
        </div>

        {/* Market Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 animated-card hover-lift stagger-1 glow-effect float">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Total Liquidity</p>
              <p className="text-2xl font-bold">{formatNumber(totalLiquidity.toString())}</p>
            </div>
          </Card>
          <Card className="p-6 animated-card hover-lift stagger-2 glow-effect float-delay">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">24h Volume</p>
              <p className="text-2xl font-bold">{formatNumber(totalVolume.toString())}</p>
            </div>
          </Card>
          <Card className="p-6 animated-card hover-lift stagger-3 glow-effect float">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">24h Fees</p>
              <p className="text-2xl font-bold">{formatNumber(totalFees.toString())}</p>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Swap Widget */}
          <div className="lg:col-span-2">
            <SwapWidget />
          </div>

          {/* Top Pools */}
          <div className="space-y-6">
            <Card className="p-6 animated-card hover-lift slide-in-up">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Top Pools
                </h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSortBy('volume')}
                    className={sortBy === 'volume' ? 'bg-primary text-primary-foreground' : ''}
                  >
                    Volume
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSortBy('liquidity')}
                    className={sortBy === 'liquidity' ? 'bg-primary text-primary-foreground' : ''}
                  >
                    Liquidity
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                  >
                    {sortOrder === 'desc' ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {sortedPools.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">No pools available</p>
                    <p className="text-xs">Pools will appear here once created</p>
                  </div>
                ) : (
                  sortedPools.slice(0, 5).map((pool, index) => (
                    <div 
                      key={pool.id} 
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors animated-card"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1">
                          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                            {getTokenSymbol(pool.token0).charAt(0)}
                          </div>
                          <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-xs font-bold -ml-1">
                            {getTokenSymbol(pool.token1).charAt(0)}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {getTokenSymbol(pool.token0)}/{getTokenSymbol(pool.token1)}
                          </p>
                          <Badge variant="secondary" className="text-xs">
                            {pool.fee / 10000}%
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">
                          {sortBy === 'volume' ? formatNumber(pool.volume24h) : formatNumber(pool.liquidity)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {sortBy === 'volume' ? '24h Volume' : 'Liquidity'}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Market Info */}
            <Card className="p-6 animated-card hover-lift slide-in-up">
              <h3 className="text-lg font-semibold mb-4">Market Info</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Protocol</span>
                  <Badge variant="secondary">Unistock DEX</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Network</span>
                  <span>Sepolia</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Active Pools</span>
                  <span>{pools.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Pairs</span>
                  <span>{pools.length}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Swap;
