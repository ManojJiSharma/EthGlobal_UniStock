import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Shield,
  Zap,
  Users,
  ArrowRight,
  Github,
  Twitter,
  Linkedin,
  Mail,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Team from "./Team";

const Hero = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate("/swap");
  };

  const handleAddLiquidity = () => {
    navigate("/liquidity");
  };

  const teamMembers = [
    {
      name: "Alex Chen",
      role: "Full Stack Developer",
      image:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      bio: "Blockchain enthusiast with 5+ years in DeFi development",
      social: {
        github: "alexchen",
        twitter: "alexchen_dev",
        linkedin: "alexchen",
      },
    },
    {
      name: "Sarah Johnson",
      role: "Smart Contract Engineer",
      image:
        "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
      bio: "Solidity expert specializing in Uniswap v4 protocols",
      social: {
        github: "sarahj",
        twitter: "sarahj_crypto",
        linkedin: "sarahjohnson",
      },
    },
    {
      name: "Mike Rodriguez",
      role: "Frontend Developer",
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      bio: "React specialist focused on user experience and design",
      social: {
        github: "mikerod",
        twitter: "mikerod_dev",
        linkedin: "mikerodriguez",
      },
    },
    {
      name: "Emma Wilson",
      role: "Backend Developer",
      image:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      bio: "Node.js expert with deep knowledge of blockchain infrastructure",
      social: {
        github: "emmaw",
        twitter: "emmaw_dev",
        linkedin: "emmawilson",
      },
    },
    {
      name: "David Kim",
      role: "DevOps Engineer",
      image:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
      bio: "Infrastructure specialist ensuring scalable and secure deployments",
      social: {
        github: "davidk",
        twitter: "davidk_devops",
        linkedin: "davidkim",
      },
    },
  ];

  return (
    <div className="relative z-10">
      {/* Main Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          {/* Main Hero Content */}
          <div className="mb-20">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6 fade-in">
              <TrendingUp className="w-4 h-4" />
              Built on Sepolia with Uniswap v4
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight fade-in-delay-1">
              Trade on{" "}
              <span className="gradient-text bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
                uniStock
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed fade-in-delay-2">
              The most advanced decentralized exchange on Sepolia. Swap tokens,
              provide liquidity, and earn fees with ultra-low gas costs.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center fade-in-delay-3">
              <Button
                onClick={handleGetStarted}
                size="lg"
                className="btn-gradient hover-lift text-lg px-8 py-6"
              >
                Get Started
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                onClick={handleAddLiquidity}
                variant="outline"
                size="lg"
                className="hover-lift text-lg px-8 py-6"
              >
                Add Liquidity
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
            <Card className="p-6 animated-card hover-lift stagger-1 glow-effect float">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-2">$2.5M+</h3>
                <p className="text-muted-foreground">Total Volume</p>
              </div>
            </Card>

            <Card className="p-6 animated-card hover-lift stagger-2 glow-effect float-delay">
              <div className="text-center">
                <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-2xl font-bold mb-2">15+</h3>
                <p className="text-muted-foreground">Active Pools</p>
              </div>
            </Card>

            <Card className="p-6 animated-card hover-lift stagger-3 glow-effect float">
              <div className="text-center">
                <div className="w-12 h-12 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-6 h-6 text-secondary" />
                </div>
                <h3 className="text-2xl font-bold mb-2">0.05%</h3>
                <p className="text-muted-foreground">Lowest Fees</p>
              </div>
            </Card>
          </div>

          {/* Features Section */}
          <div className="mb-20">
            <h2 className="text-3xl md:text-4xl font-bold mb-12 fade-in">
              Why Choose uniStock?
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="p-6 animated-card hover-lift slide-in-left">
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">
                    Advanced Trading
                  </h3>
                  <p className="text-muted-foreground">
                    Trade with minimal fees on Sepolia using Uniswap v4
                  </p>
                </div>
              </Card>

              <Card className="p-6 animated-card hover-lift slide-in-up">
                <div className="text-center">
                  <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-accent" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">
                    Secure & Audited
                  </h3>
                  <p className="text-muted-foreground">
                    Built on battle-tested Uniswap v4 smart contracts
                  </p>
                </div>
              </Card>

              <Card className="p-6 animated-card hover-lift slide-in-right">
                <div className="text-center">
                  <div className="w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-8 h-8 text-secondary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Lightning Fast</h3>
                  <p className="text-muted-foreground">
                    Instant swaps with optimized gas efficiency
                  </p>
                </div>
              </Card>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <Card className="p-8 animated-card hover-lift glow-effect">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                Ready to Start Trading?
              </h2>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Join thousands of users already trading on uniStock. Experience
                the future of decentralized finance.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={handleGetStarted}
                  size="lg"
                  className="btn-gradient hover-lift"
                >
                  Start Trading
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button
                  onClick={handleAddLiquidity}
                  variant="outline"
                  size="lg"
                  className="hover-lift"
                >
                  Provide Liquidity
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Hero;
