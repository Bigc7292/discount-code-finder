import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { 
  User, 
  CreditCard, 
  Gift, 
  Copy, 
  CheckCircle, 
  Clock,
  Crown,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { useState } from "react";

export default function Profile() {
  const { user, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [referralCode, setReferralCode] = useState("");

  const { data: subscriptionStatus } = trpc.subscription.getStatus.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: searchLimit } = trpc.search.getLimit.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: referralInfo } = trpc.referral.getInfo.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const createCheckoutMutation = trpc.subscription.createCheckout.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.open(data.url, "_blank");
        toast.success("Redirecting to checkout...");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create checkout session");
    },
  });

  const cancelSubscriptionMutation = trpc.subscription.cancel.useMutation({
    onSuccess: () => {
      toast.success("Subscription canceled successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to cancel subscription");
    },
  });

  const { data: portalUrl } = trpc.subscription.getPortalUrl.useQuery(undefined, {
    enabled: false,
  });

  const handleSubscribe = () => {
    createCheckoutMutation.mutate({ referralCode: referralCode || undefined });
  };

  const handleCancelSubscription = () => {
    if (confirm("Are you sure you want to cancel your subscription?")) {
      cancelSubscriptionMutation.mutate();
    }
  };

  const copyReferralLink = () => {
    if (referralInfo?.referralLink) {
      navigator.clipboard.writeText(referralInfo.referralLink);
      toast.success("Referral link copied to clipboard!");
    }
  };

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>Please sign in to view your profile</CardDescription>
          </CardHeader>
          <CardContent>
            <a href={getLoginUrl()}>
              <Button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600">
                Sign In
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-4 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                CodeFinder
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/search">
              <Button variant="ghost">Search</Button>
            </Link>
            <Link href="/inbox">
              <Button variant="ghost">Inbox</Button>
            </Link>
            {user?.role === "admin" && (
              <Link href="/admin">
                <Button variant="outline">
                  <Crown className="w-4 h-4 mr-2" />
                  Admin
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="container py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* User Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-semibold">{user?.name || "Not set"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-semibold">{user?.email || "Not set"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Account Type</p>
                <Badge>{user?.role === "admin" ? "Admin" : "User"}</Badge>
              </div>
              <Button variant="outline" onClick={handleLogout}>
                Sign Out
              </Button>
            </CardContent>
          </Card>

          {/* Subscription Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Subscription Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {subscriptionStatus && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status</span>
                    <Badge variant={subscriptionStatus.isActive ? "default" : "secondary"}>
                      {subscriptionStatus.status === "trial" && <Clock className="w-4 h-4 mr-1" />}
                      {subscriptionStatus.status === "active" && <CheckCircle className="w-4 h-4 mr-1" />}
                      {subscriptionStatus.status}
                    </Badge>
                  </div>

                  {subscriptionStatus.status === "trial" && subscriptionStatus.trialEndsAt && (
                    <div>
                      <p className="text-sm text-gray-600">Trial ends</p>
                      <p className="font-semibold">
                        {new Date(subscriptionStatus.trialEndsAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  {subscriptionStatus.status === "active" && subscriptionStatus.subscriptionEndsAt && (
                    <div>
                      <p className="text-sm text-gray-600">Next billing date</p>
                      <p className="font-semibold">
                        {new Date(subscriptionStatus.subscriptionEndsAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  {subscriptionStatus.freeMonthsRemaining > 0 && (
                    <div>
                      <p className="text-sm text-gray-600">Free months remaining</p>
                      <p className="font-semibold text-green-600">
                        {subscriptionStatus.freeMonthsRemaining} month(s)
                      </p>
                    </div>
                  )}

                  {/* Show search limit for trial users */}
                  {subscriptionStatus.status === "trial" && searchLimit && searchLimit.limit < 100 && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-purple-900">Daily Search Limit</h4>
                          <p className="text-sm text-purple-700">
                            Trial users get {searchLimit.limit} searches per day
                          </p>
                        </div>
                        <div className="text-3xl font-bold text-purple-600">
                          {searchLimit.remaining}/{searchLimit.limit}
                        </div>
                      </div>
                      <p className="text-xs text-purple-600">
                        Upgrade to premium for unlimited searches!
                      </p>
                    </div>
                  )}

                  {/* Show unlimited badge for paid users */}
                  {subscriptionStatus.status === "active" && searchLimit && searchLimit.limit >= 100 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <div>
                          <h4 className="font-semibold text-green-900">Unlimited Searches</h4>
                          <p className="text-sm text-green-700">
                            You have unlimited discount code searches
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {!subscriptionStatus.isActive && (
                    <div className="space-y-4 pt-4 border-t">
                      <p className="text-sm text-gray-600">
                        Subscribe now to start searching for discount codes
                      </p>
                      <Input
                        placeholder="Enter referral code (optional)"
                        value={referralCode}
                        onChange={(e) => setReferralCode(e.target.value)}
                      />
                      <Button
                        onClick={handleSubscribe}
                        disabled={createCheckoutMutation.isPending}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                      >
                        Subscribe - $9.99/month
                      </Button>
                    </div>
                  )}

                  {subscriptionStatus.isActive && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={handleCancelSubscription}
                        disabled={cancelSubscriptionMutation.isPending}
                      >
                        Cancel Subscription
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Referral Program */}
          <Card className="border-2 border-purple-200 bg-purple-50/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-purple-600" />
                Referral Program
              </CardTitle>
              <CardDescription>
                Share your referral link and earn 1 free month for each friend who subscribes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {referralInfo && (
                <>
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Your Referral Link</p>
                    <div className="flex gap-2">
                      <Input
                        value={referralInfo.referralLink}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button onClick={copyReferralLink} variant="outline">
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="text-center p-4 bg-white rounded-lg">
                      <p className="text-3xl font-bold text-purple-600">
                        {referralInfo.totalReferrals}
                      </p>
                      <p className="text-sm text-gray-600">Total Referrals</p>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg">
                      <p className="text-3xl font-bold text-green-600">
                        {referralInfo.rewardsEarned}
                      </p>
                      <p className="text-sm text-gray-600">Rewards Earned</p>
                    </div>
                  </div>

                  {referralInfo.referrals.length > 0 && (
                    <div className="pt-4 border-t">
                      <p className="text-sm font-semibold mb-2">Your Referrals</p>
                      <div className="space-y-2">
                        {referralInfo.referrals.map((ref) => (
                          <div
                            key={ref.id}
                            className="flex items-center justify-between p-3 bg-white rounded-lg"
                          >
                            <div>
                              <p className="font-semibold">{ref.userName}</p>
                              <p className="text-xs text-gray-600">
                                {new Date(ref.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            {ref.rewardGranted ? (
                              <Badge className="bg-green-600">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Rewarded
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <Clock className="w-3 h-3 mr-1" />
                                Pending
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
