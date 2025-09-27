import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, TrendingUp, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUnistockDEX } from "@/hooks/useUnistockDEX";
import { TOKENS } from "@/config/contracts";

const PoolsOverview = () => {
  const navigate = useNavigate();
  const { pools, isLoading, error, fetchPools } = useUnistockDEX();

  useEffect(() => {
    fetchPools();
  }, [fetchPools]);

  const handleAddLiquidity = () => {
    navigate("/liquidity");
  };

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

  const topPools = pools
    .sort((a, b) => parseFloat(b.liquidity) - parseFloat(a.liquidity))
    .slice(0, 3);

  const totalLiquidity = pools.reduce((sum, pool) => sum + parseFloat(pool.liquidity), 0);
  const totalVolume = pools.reduce((sum, pool) => sum + parseFloat(pool.volume24h), 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Loading pools...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
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
            <p className="text-sm text-muted-foreground mb-2">Active Pools</p>
            <p className="text-2xl font-bold">{pools.length}</p>
          </div>
        </Card>
      </div>

      {/* Top Pools */}
      <Card className="p-6 animated-card hover-lift slide-in-up">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Top Pools
          </h3>
          <Button 
            onClick={handleAddLiquidity}
            variant="outline"
            className="hover-lift"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Liquidity
          </Button>
        </div>

        {pools.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-muted-foreground" />
            </div>
            <h4 className="text-lg font-semibold mb-2">No Pools Yet</h4>
            <p className="text-muted-foreground mb-4">
              Be the first to create a liquidity pool on Unistock DEX
            </p>
            <Button 
              onClick={handleAddLiquidity}
              className="btn-gradient hover-lift"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Pool
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {topPools.map((pool, index) => (
              <div 
                key={pool.id} 
                className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors animated-card"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold">
                      {getTokenSymbol(pool.token0).charAt(0)}
                    </div>
                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-sm font-bold -ml-2">
                      {getTokenSymbol(pool.token1).charAt(0)}
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold">
                      {getTokenSymbol(pool.token0)}/{getTokenSymbol(pool.token1)}
                    </p>
                    <Badge variant="secondary" className="text-xs">
                      {pool.fee / 10000}% fee
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatNumber(pool.liquidity)}</p>
                  <p className="text-sm text-muted-foreground">Liquidity</p>
                </div>
              </div>
            ))}
            
            {pools.length > 3 && (
              <div className="text-center pt-4">
                <Button 
                  variant="outline"
                  onClick={() => navigate('/pools')}
                  className="hover-lift"
                >
                  View All Pools
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default PoolsOverview;
