import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Menu, X, Wallet, ChevronDown } from 'lucide-react'
import { useWallet } from '@/hooks/useWallet'
import { NETWORK_CONFIG } from '@/config/contracts'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  
  const {
    isConnected,
    address,
    isCorrectNetwork,
    isConnecting,
    isSwitchingNetwork,
    connectWallet,
    disconnectWallet,
    switchNetwork
  } = useWallet()

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const handleConnect = async () => {
    console.log("Connecting wallet...");
    await connectWallet();
  }

  const handleDisconnect = () => {
    disconnectWallet()
    setIsDropdownOpen(false)
  }

  const handleSwitchNetwork = async () => {
    console.log("Switching network...");
    await switchNetwork();
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <a href="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <span className="text-white font-bold text-sm">U</span>
              </div>
              <span className="text-xl font-bold gradient-text">uniStock</span>
            </a>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="/" className="text-foreground hover:text-primary transition-colors">
              Home
            </a>
            <a href="/swap" className="text-foreground hover:text-primary transition-colors">
              Swap
            </a>
            <a href="/pools" className="text-foreground hover:text-primary transition-colors">
              Pools
            </a>
            <a href="/liquidity" className="text-foreground hover:text-primary transition-colors">
              Liquidity
            </a>
            <a href="/lending-borrowing" className="text-foreground hover:text-primary transition-colors">
              Lending/Borrowing
            </a>
          </nav>

          {/* Wallet Connection */}
          <div className="flex items-center space-x-4">
            {/* Network Status */}
            {isConnected && (
              <div className="hidden sm:flex items-center space-x-2">
                {isCorrectNetwork ? (
                  <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                    {NETWORK_CONFIG.chainName}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20">
                    Wrong Network
                  </Badge>
                )}
              </div>
            )}

            {/* Connect/Account Button */}
            {!isConnected ? (
              <Button
                onClick={handleConnect}
                disabled={isConnecting}
                className="bg-gradient-primary text-primary-foreground border-0 hover:opacity-90"
              >
                {isConnecting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wallet className="w-4 h-4 mr-2" />
                    Connect Wallet
                  </>
                )}
              </Button>
            ) : (
              <div className="relative">
                <Button
                  onClick={toggleDropdown}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <span>{formatAddress(address!)}</span>
                  <ChevronDown className="w-4 h-4" />
                </Button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-background border rounded-md shadow-lg z-50">
                    <div className="p-2">
                      <div className="px-3 py-2 text-sm text-muted-foreground border-b">
                        {formatAddress(address!)}
                      </div>
                      {!isCorrectNetwork && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleSwitchNetwork}
                          disabled={isSwitchingNetwork}
                          className="w-full justify-start mt-2"
                        >
                          {isSwitchingNetwork ? (
                            <>
                              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2"></div>
                              Switching...
                            </>
                          ) : (
                            `Switch to ${NETWORK_CONFIG.chainName}`
                          )}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDisconnect}
                        className="w-full justify-start mt-1 text-red-500 hover:text-red-600"
                      >
                        Disconnect
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMenu}
              className="md:hidden"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t">
            <nav className="py-4 space-y-2">
              <a
                href="/"
                className="block px-4 py-2 text-foreground hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </a>
              <a
                href="/swap"
                className="block px-4 py-2 text-foreground hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Swap
              </a>
              <a
                href="/pools"
                className="block px-4 py-2 text-foreground hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Pools
              </a>
              <a
                href="/liquidity"
                className="block px-4 py-2 text-foreground hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Liquidity
              </a>
              <a
                href="/lending"
                className="block px-4 py-2 text-foreground hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Lending
              </a>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
