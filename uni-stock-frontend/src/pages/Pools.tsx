import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Plus, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUnistockDEX } from "@/hooks/useUnistockDEX";
import { useWallet } from "@/hooks/useWallet";
import { TOKENS } from "@/config/contracts";

const Pools = () => {
  const navigate = useNavigate();
  const { pools, isLoading, error, fetchPools } = useUnistockDEX();
  const { isConnected, address } = useWallet();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<'volume' | 'apr' | 'liquidity' | 'fees'>('volume');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterFee, setFilterFee] = useState<string>('all');

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

  const formatAPR = (apr: string) => {
    return `${parseFloat(apr).toFixed(2)}%`;
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

  const filteredPools = pools.filter(pool => {
    const matchesSearch = searchTerm === '' || 
      getTokenSymbol(pool.token0).toLowerCase().includes(searchTerm.toLowerCase()) ||
      getTokenSymbol(pool.token1).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFee = filterFee === 'all' || 
      (filterFee === 'low' && pool.fee <= 500) ||
      (filterFee === 'medium' && pool.fee > 500 && pool.fee <= 3000) ||
      (filterFee === 'high' && pool.fee > 3000);
    
    return matchesSearch && matchesFee;
  });

  const sortedPools = [...filteredPools].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'volume':
        aValue = parseFloat(a.volume24h);
        bValue = parseFloat(b.volume24h);
        break;
      case 'apr':
        aValue = parseFloat(a.apr);
        bValue = parseFloat(b.apr);
        break;
      case 'liquidity':
        aValue = parseFloat(a.liquidity);
        bValue = parseFloat(b.liquidity);
        break;
      case 'fees':
        aValue = parseFloat(a.fees24h);
        bValue = parseFloat(b.fees24h);
        break;
      default:
        return 0;
    }
    
    return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
  });

  const totalLiquidity = pools.reduce((sum, pool) => sum + parseFloat(pool.liquidity), 0);
  const totalVolume = pools.reduce((sum, pool) => sum + parseFloat(pool.volume24h), 0);
  const totalFees = pools.reduce((sum, pool) => sum + parseFloat(pool.fees24h), 0);
  const avgAPR = pools.length > 0 ? pools.reduce((sum, pool) => sum + parseFloat(pool.apr), 0) / pools.length : 0;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="ml-2">Loading pools...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="text-center text-red-500">
          <p>Error loading pools: {error}</p>
          <Button onClick={fetchPools} className="mt-2">
            Retry
          </Button>
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
            Liquidity Pools
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Explore and manage liquidity pools on Unistock DEX
          </p>
        </div>

        {/* Pool Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
          <Card className="p-6 animated-card hover-lift stagger-4 glow-effect float-delay">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Avg APR</p>
              <p className="text-2xl font-bold text-green-500">{formatAPR(avgAPR.toString())}</p>
            </div>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="p-6 animated-card hover-lift slide-in-up">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search pools..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <select
                value={filterFee}
                onChange={(e) => setFilterFee(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background"
              >
                <option value="all">All Fees</option>
                <option value="low">Low (≤0.05%)</option>
                <option value="medium">Medium (0.05%-0.3%)</option>
                <option value="high">High (&gt;0.3%)</option>
              </select>
              
              <Button
                variant="outline"
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              >
                {sortOrder === 'desc' ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </Card>

        {/* Pools Table */}
        <Card className="animated-card hover-lift scale-in">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-semibold">Pool</th>
                  <th className="text-right p-4 font-semibold">Liquidity</th>
                  <th className="text-right p-4 font-semibold">24h Volume</th>
                  <th className="text-right p-4 font-semibold">24h Fees</th>
                  <th className="text-right p-4 font-semibold">APR</th>
                  <th className="text-center p-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedPools.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center p-8 text-muted-foreground">
                      {pools.length === 0 ? (
                        <div>
                          <p className="text-lg font-semibold mb-2">No pools found</p>
                          <p className="text-sm">No liquidity pools are currently active on Unistock DEX.</p>
                          <p className="text-sm">Be the first to create a pool!</p>
                        </div>
                      ) : (
                        <p>No pools match your search criteria.</p>
                      )}
                    </td>
                  </tr>
                ) : (
                  sortedPools.map((pool, index) => (
                    <tr 
                      key={pool.id} 
                      className="border-b hover:bg-muted/50 transition-colors animated-card"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                              {getTokenSymbol(pool.token0).charAt(0)}
                            </div>
                            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-xs font-bold -ml-2">
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
                      </td>
                      <td className="text-right p-4 font-semibold">
                        {formatNumber(pool.liquidity)}
                      </td>
                      <td className="text-right p-4 font-semibold">
                        {formatNumber(pool.volume24h)}
                      </td>
                      <td className="text-right p-4 font-semibold">
                        {formatNumber(pool.fees24h)}
                      </td>
                      <td className="text-right p-4 font-semibold text-green-500">
                        {formatAPR(pool.apr)}
                      </td>
                      <td className="text-center p-4">
                        <Button 
                          onClick={handleAddLiquidity}
                          variant="outline"
                          size="sm"
                          className="hover-lift"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Liquidity
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* New Position Button */}
        <div className="text-center">
          <Button 
            onClick={handleAddLiquidity}
            className="btn-gradient hover-lift"
            size="lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Position
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Pools;
