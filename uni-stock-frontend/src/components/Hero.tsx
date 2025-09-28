import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, TrendingUp, Shield, Zap, Users, Globe } from 'lucide-react'
import { useWallet } from '@/hooks/useWallet'
import { NETWORK_CONFIG } from '@/config/contracts'

export default function Hero() {
  const { isConnected, connectWallet, isConnecting } = useWallet()

  const handleGetStarted = () => {
    if (!isConnected) {
      connectWallet()
    } else {
      // Scroll to swap section or navigate to swap page
      const swapSection = document.getElementById('swap')
      if (swapSection) {
        swapSection.scrollIntoView({ behavior: 'smooth' })
      } else {
        window.location.href = '/swap'
      }
    }
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
      
      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8 text-center">
        <div className="text-center max-w-4xl mx-auto">
          {/* Main Hero Content */}
          <div className="mb-20">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6 fade-in">
              <TrendingUp className="w-4 h-4" />
              Built on {NETWORK_CONFIG.chainName} with Uniswap v4
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight fade-in-delay-1">
              Trade on{" "}
              <span className="gradient-text bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
                uniStock
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed fade-in-delay-2">
              The most advanced decentralized exchange on {NETWORK_CONFIG.chainName}. Swap tokens,
              provide liquidity, and earn fees with ultra-low gas costs.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center fade-in-delay-3">
              <Button
                size="lg"
                onClick={handleGetStarted}
                disabled={isConnecting}
                className="bg-gradient-primary text-primary-foreground border-0 hover:opacity-90 glow-on-hover text-lg px-8 py-3"
              >
                {isConnecting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Connecting...
                  </>
                ) : (
                  <>
                    {isConnected ? 'Start Trading' : 'Connect Wallet'}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                className="border-border bg-background/50 backdrop-blur-sm text-lg px-8 py-3"
                onClick={() => {
                  const marketsSection = document.getElementById('markets')
                  if (marketsSection) {
                    marketsSection.scrollIntoView({ behavior: 'smooth' })
                  }
                }}
              >
                View Markets
              </Button>
            </div>

            {/* Network Badge */}
            <div className="mt-6 flex justify-center">
              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                {NETWORK_CONFIG.chainName} Active
              </Badge>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card className="p-6 animated-card hover-lift slide-in-up">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">
                  Lightning Fast
                </h3>
                <p className="text-muted-foreground">
                  Trade with minimal fees on {NETWORK_CONFIG.chainName} using Uniswap v4
                </p>
              </div>
            </Card>

            <Card className="p-6 animated-card hover-lift slide-in-up">
              <div className="text-center">
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-secondary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">
                  Secure & Decentralized
                </h3>
                <p className="text-muted-foreground">
                  Your funds are always in your control with non-custodial trading
                </p>
              </div>
            </Card>

            <Card className="p-6 animated-card hover-lift slide-in-up">
              <div className="text-center">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-3">
                  Community Driven
                </h3>
                <p className="text-muted-foreground">
                  Built by the community, for the community. Earn rewards by participating
                </p>
              </div>
            </Card>
          </div>

          {/* Stats Section */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold gradient-text mb-2">$50M+</div>
              <div className="text-sm text-muted-foreground">Total Volume</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold gradient-text mb-2">10K+</div>
              <div className="text-sm text-muted-foreground">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold gradient-text mb-2">99.9%</div>
              <div className="text-sm text-muted-foreground">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold gradient-text mb-2">0.01%</div>
              <div className="text-sm text-muted-foreground">Trading Fees</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
