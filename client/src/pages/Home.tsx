import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { Search, Shield, Zap, Gift, TrendingUp, Users } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Search className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              CodeFinder
            </span>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link href="/search">
                  <Button variant="ghost">Search</Button>
                </Link>
                <Link href="/profile">
                  <Button variant="default">Dashboard</Button>
                </Link>
              </>
            ) : (
              <>
                <a href={getLoginUrl()}>
                  <Button variant="ghost">Sign In</Button>
                </a>
                <a href={getLoginUrl()}>
                  <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                    Start Free Trial
                  </Button>
                </a>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Find Verified Discount Codes in Seconds
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            AI-powered search that finds, verifies, and delivers working discount codes directly to your inbox. 
            No more expired codes. No more wasted time. Just savings.
          </p>
          <div className="flex items-center justify-center gap-4">
            {isAuthenticated ? (
              <Link href="/search">
                <Button size="lg" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-lg px-8 py-6">
                  Start Searching
                  <Search className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            ) : (
              <a href={getLoginUrl()}>
                <Button size="lg" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-lg px-8 py-6">
                  Start 7-Day Free Trial
                  <Zap className="ml-2 w-5 h-5" />
                </Button>
              </a>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-4">
            7 days free, then $9.99/month. Cancel anytime.
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Why Choose CodeFinder?</h2>
          <p className="text-xl text-gray-600">Powered by AI, verified by automation, delivered with precision</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="border-2 hover:border-indigo-200 transition-all hover:shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <Search className="w-6 h-6 text-indigo-600" />
              </div>
              <CardTitle>AI-Powered Search</CardTitle>
              <CardDescription>
                Our AI scours the web across multiple sources to find the best discount codes for any product or service
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-purple-200 transition-all hover:shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle>Automated Verification</CardTitle>
              <CardDescription>
                Every code is tested through checkout simulation before delivery. Only verified, working codes reach you
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-pink-200 transition-all hover:shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-pink-600" />
              </div>
              <CardTitle>Instant Delivery</CardTitle>
              <CardDescription>
                Verified codes appear in your inbox within minutes. No waiting, no expired codes, just savings
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-indigo-200 transition-all hover:shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-indigo-600" />
              </div>
              <CardTitle>Unlimited Searches</CardTitle>
              <CardDescription>
                Search as much as you want. One flat monthly rate for unlimited discount code discoveries
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-purple-200 transition-all hover:shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle>Referral Rewards</CardTitle>
              <CardDescription>
                Share with friends and earn free months when they subscribe. Everyone saves more together
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-pink-200 transition-all hover:shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
                <Gift className="w-6 h-6 text-pink-600" />
              </div>
              <CardTitle>7-Day Free Trial</CardTitle>
              <CardDescription>
                Try everything risk-free for a week. Experience the power of verified discount codes
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="container py-20">
        <div className="max-w-5xl mx-auto bg-gradient-to-r from-indigo-50 to-purple-50 rounded-3xl p-12">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Three simple steps to savings</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-bold mb-2">Search</h3>
              <p className="text-gray-600">
                Enter what you're shopping for - any product, service, or merchant
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-bold mb-2">Verify</h3>
              <p className="text-gray-600">
                Our AI finds and tests codes through automated checkout simulation
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-600 to-red-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-bold mb-2">Save</h3>
              <p className="text-gray-600">
                Receive verified codes in your inbox and start saving immediately
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold mb-6">Ready to Start Saving?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of smart shoppers who never pay full price
          </p>
          {isAuthenticated ? (
            <Link href="/search">
              <Button size="lg" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-lg px-8 py-6">
                Go to Search
              </Button>
            </Link>
          ) : (
            <a href={getLoginUrl()}>
              <Button size="lg" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-lg px-8 py-6">
                Start Your Free Trial
              </Button>
            </a>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-50 py-12">
        <div className="container text-center text-gray-600">
          <p>&copy; 2024 CodeFinder. All rights reserved.</p>
          <p className="mt-2 text-sm">AI-powered discount code discovery and verification platform</p>
        </div>
      </footer>
    </div>
  );
}
