import { Button } from '@/components/ui/button'
import { ArrowRight, TrendingUp, Shield, Globe } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import heroImage from '@/assets/hero-bg.jpg'

export function LendingBorrow() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      {/* <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-black opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/20" />
      </div> */}
      
      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8 text-center">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl mb-6">
            <span className="gradient-text">DeFi Lending</span>
            <br />
            on Rootstock
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground max-w-2xl mx-auto">
            Supply, borrow, and earn on Rootstock testnet with our advanced 
            lending protocol. Cross-chain functionality coming soon.
          </p>
          
          <div className="mt-6 flex justify-center gap-4">
            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
              Rootstock Testnet Active
            </Badge>
            <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20">
              Cross-Chain Coming Soon
            </Badge>
          </div>
          
          {/* <div className="mt-10 flex items-center justify-center gap-x-6">
            <Button size="lg" className="bg-gradient-primary text-primary-foreground border-0 hover:opacity-90 glow-on-hover">
              Launch App
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="outline" size="lg" className="border-border bg-background/50 backdrop-blur-sm">
              View Markets
            </Button>
          </div> */}
          
          {/* Stats */}
          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div className="financial-card p-6">
              <div className="flex items-center justify-center mb-3">
                <TrendingUp className="h-8 w-8 text-accent" />
              </div>
              <div className="text-2xl font-bold gradient-text">$50M+</div>
              <div className="text-sm text-muted-foreground">Total Value Locked</div>
            </div>
            
            <div className="financial-card p-6">
              <div className="flex items-center justify-center mb-3">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <div className="text-2xl font-bold gradient-text">99.9%</div>
              <div className="text-sm text-muted-foreground">Uptime</div>
            </div>
            
            <div className="financial-card p-6">
              <div className="flex items-center justify-center mb-3">
                <Globe className="h-8 w-8 text-secondary" />
              </div>
              <div className="text-2xl font-bold gradient-text">1</div>
              <div className="text-sm text-muted-foreground">Active Chains</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
