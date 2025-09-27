import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWallet } from "@/hooks/useWallet";

const Header = () => {
  const location = useLocation();
  const {
    isConnected,
    address,
    isCorrectNetwork,
    isInitialized,
    isConnecting,
    isSwitchingNetwork,
    connectWallet,
    disconnectWallet,
    switchNetwork,
  } = useWallet();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleConnect = async () => {
    console.log("Connect button clicked");
    try {
      if (!isCorrectNetwork) {
        console.log("Switching network...");
        await switchNetwork();
      } else {
        console.log("Connecting wallet...");
        await connectWallet();
      }
    } catch (error) {
      console.error("Error in handleConnect:", error);
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    setIsMenuOpen(false);
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // Debug logging
  useEffect(() => {
    console.log("Header state:", {
      isInitialized,
      isConnected,
      address,
      isCorrectNetwork,
      isConnecting,
      isSwitchingNetwork,
    });
  }, [
    isInitialized,
    isConnected,
    address,
    isCorrectNetwork,
    isConnecting,
    isSwitchingNetwork,
  ]);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 hover-lift">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">U</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
              UniStock
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              to="/"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive("/") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Home
            </Link>
            <Link
              to="/swap"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive("/swap") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Swap
            </Link>
            <Link
              to="/pools"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive("/pools") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Pools
            </Link>
            <Link
              to="/liquidity"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive("/liquidity")
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              Liquidity
            </Link>
          </nav>

          {/* Wallet Connection */}
          <div className="flex items-center space-x-4">
            {!isInitialized ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-muted-foreground">
                  Initializing...
                </span>
              </div>
            ) : isConnected ? (
              <div className="flex items-center space-x-2">
                {!isCorrectNetwork && (
                  <Badge variant="destructive" className="text-xs">
                    Wrong Network
                  </Badge>
                )}
                <div className="relative">
                  <Button
                    variant="outline"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center space-x-2"
                  >
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">
                      {formatAddress(address!)}
                    </span>
                  </Button>

                  {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-background border rounded-md shadow-lg z-50">
                      <div className="p-2">
                        <div className="px-3 py-2 text-sm text-muted-foreground border-b">
                          {formatAddress(address!)}
                        </div>
                        {!isCorrectNetwork && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={switchNetwork}
                            disabled={isSwitchingNetwork}
                            className="w-full justify-start mt-2"
                          >
                            {isSwitchingNetwork ? (
                              <>
                                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2"></div>
                                Switching...
                              </>
                            ) : (
                              "Switch to Sepolia"
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
              </div>
            ) : (
              <Button
                onClick={handleConnect}
                disabled={isConnecting || isSwitchingNetwork}
                className="btn-gradient hover-lift"
              >
                {isConnecting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Connecting...
                  </>
                ) : isSwitchingNetwork ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Switching...
                  </>
                ) : (
                  "Connect Wallet"
                )}
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t">
            <nav className="flex flex-col space-y-2 py-4">
              <Link
                to="/"
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  isActive("/") ? "text-primary" : "text-muted-foreground"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/swap"
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  isActive("/swap") ? "text-primary" : "text-muted-foreground"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Swap
              </Link>
              <Link
                to="/pools"
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  isActive("/pools") ? "text-primary" : "text-muted-foreground"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Pools
              </Link>
              <Link
                to="/liquidity"
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  isActive("/liquidity")
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Liquidity
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
