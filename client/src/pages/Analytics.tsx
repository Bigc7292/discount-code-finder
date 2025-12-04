import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { BarChart3, TrendingUp, Mail, Users, DollarSign, Calendar, LineChart } from "lucide-react";
import { LineChart as RechartsLine, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, FunnelChart, Funnel, LabelList, Cell } from "recharts";
import { Link, useLocation } from "wouter";
import { getLoginUrl } from "@/const";

export default function Analytics() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  
  // Date range state (default: last 30 days)
  const [dateRange, setDateRange] = useState(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    };
  });

  // Fetch analytics data
  const { data: emailMetrics, isLoading: emailLoading } = trpc.analytics.emailMetrics.useQuery(
    { startDate: dateRange.start, endDate: dateRange.end },
    { enabled: isAuthenticated && user?.role === "admin" }
  );

  const { data: emailByCategory, isLoading: categoryLoading } = trpc.analytics.emailMetricsByCategory.useQuery(
    { startDate: dateRange.start, endDate: dateRange.end },
    { enabled: isAuthenticated && user?.role === "admin" }
  );

  const { data: trialMetrics, isLoading: trialLoading } = trpc.analytics.trialConversion.useQuery(
    { startDate: dateRange.start, endDate: dateRange.end },
    { enabled: isAuthenticated && user?.role === "admin" }
  );

  const { data: subscriptionMetrics, isLoading: subLoading } = trpc.analytics.subscriptionMetrics.useQuery(
    { startDate: dateRange.start, endDate: dateRange.end },
    { enabled: isAuthenticated && user?.role === "admin" }
  );

  const { data: dailyEmailData, isLoading: dailyEmailLoading } = trpc.analytics.dailyEmailMetrics.useQuery(
    { startDate: dateRange.start, endDate: dateRange.end },
    { enabled: isAuthenticated && user?.role === "admin" }
  );

  const { data: funnelData, isLoading: funnelLoading } = trpc.analytics.conversionFunnel.useQuery(
    { startDate: dateRange.start, endDate: dateRange.end },
    { enabled: isAuthenticated && user?.role === "admin" }
  );

  const { data: dailyTrialData, isLoading: dailyTrialLoading } = trpc.analytics.dailyTrialConversions.useQuery(
    { startDate: dateRange.start, endDate: dateRange.end },
    { enabled: isAuthenticated && user?.role === "admin" }
  );

  const { data: cohortData, isLoading: cohortLoading } = trpc.analytics.cohortAnalysis.useQuery(
    undefined,
    { enabled: isAuthenticated && user?.role === "admin" }
  );

  const { data: ltvData, isLoading: ltvLoading } = trpc.analytics.lifetimeValueByCohort.useQuery(
    undefined,
    { enabled: isAuthenticated && user?.role === "admin" }
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>Please sign in to view analytics</CardDescription>
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

  if (user?.role !== "admin") {
    setLocation("/");
    return null;
  }

  const isLoading = emailLoading || categoryLoading || trialLoading || subLoading || dailyEmailLoading || funnelLoading || dailyTrialLoading || cohortLoading || ltvLoading;

  const COLORS = ['#4F46E5', '#7C3AED', '#EC4899', '#F59E0B', '#10B981'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-4 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Analytics
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost">Admin</Button>
            </Link>
            <Link href="/search">
              <Button variant="ghost">Search</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container py-12">
        {/* Date Range Selector */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Date Range
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="text-sm text-gray-600 mb-1 block">Start Date</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="flex-1">
                <label className="text-sm text-gray-600 mb-1 block">End Date</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    const end = new Date();
                    const start = new Date();
                    start.setDate(start.getDate() - 7);
                    setDateRange({
                      start: start.toISOString().split('T')[0],
                      end: end.toISOString().split('T')[0],
                    });
                  }}
                >
                  Last 7 Days
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const end = new Date();
                    const start = new Date();
                    start.setDate(start.getDate() - 30);
                    setDateRange({
                      start: start.toISOString().split('T')[0],
                      end: end.toISOString().split('T')[0],
                    });
                  }}
                >
                  Last 30 Days
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-gray-600">Loading analytics...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Email Metrics Overview */}
            <div>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Mail className="w-6 h-6 text-indigo-600" />
                Email Engagement
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm text-gray-600">Emails Sent</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-indigo-600">
                      {emailMetrics?.sent || 0}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm text-gray-600">Emails Opened</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">
                      {emailMetrics?.opened || 0}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {emailMetrics?.openRate || 0}% open rate
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm text-gray-600">Emails Clicked</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-purple-600">
                      {emailMetrics?.clicked || 0}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {emailMetrics?.clickRate || 0}% click rate
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm text-gray-600">Click-Through Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-orange-600">
                      {emailMetrics?.clickThroughRate || 0}%
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      of opened emails
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Email by Category */}
            <div>
              <h2 className="text-2xl font-bold mb-4">Email Performance by Category</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {emailByCategory?.map((category) => (
                  <Card key={category.category}>
                    <CardHeader>
                      <CardTitle className="capitalize">
                        {category.category.replace(/_/g, " ")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Sent:</span>
                          <span className="font-semibold">{category.sent}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Opened:</span>
                          <span className="font-semibold">{category.opened}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Clicked:</span>
                          <span className="font-semibold">{category.clicked}</span>
                        </div>
                        <div className="pt-2 border-t">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Open Rate:</span>
                            <span className="font-semibold text-green-600">{category.openRate}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Click Rate:</span>
                            <span className="font-semibold text-purple-600">{category.clickRate}%</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Trial Conversion */}
            <div>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Users className="w-6 h-6 text-indigo-600" />
                Trial Conversion
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm text-gray-600">Trials Started</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-indigo-600">
                      {trialMetrics?.started || 0}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm text-gray-600">Trials Converted</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">
                      {trialMetrics?.converted || 0}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm text-gray-600">Trials Expired</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-red-600">
                      {trialMetrics?.expired || 0}
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-2 border-green-200 bg-green-50">
                  <CardHeader>
                    <CardTitle className="text-sm text-gray-600 flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      Conversion Rate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">
                      {trialMetrics?.conversionRate || 0}%
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Daily Email Performance Chart */}
            {dailyEmailData && dailyEmailData.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <LineChart className="w-6 h-6 text-indigo-600" />
                  Daily Email Performance
                </h2>
                <Card>
                  <CardHeader>
                    <CardTitle>Email Engagement Trends</CardTitle>
                    <CardDescription>Track email sent, opened, and clicked over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsLine data={dailyEmailData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="sent" stroke="#4F46E5" strokeWidth={2} name="Sent" />
                        <Line type="monotone" dataKey="opened" stroke="#10B981" strokeWidth={2} name="Opened" />
                        <Line type="monotone" dataKey="clicked" stroke="#7C3AED" strokeWidth={2} name="Clicked" />
                      </RechartsLine>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Conversion Funnel */}
            {funnelData && funnelData.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Conversion Funnel</h2>
                <Card>
                  <CardHeader>
                    <CardTitle>User Journey to Conversion</CardTitle>
                    <CardDescription>Track drop-off at each stage</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={funnelData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="stage" type="category" width={150} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#4F46E5">
                          {funnelData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                          <LabelList dataKey="percentage" position="right" formatter={(value: number) => `${value}%`} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Daily Trial Conversions */}
            {dailyTrialData && dailyTrialData.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Daily Trial Activity</h2>
                <Card>
                  <CardHeader>
                    <CardTitle>Trial Starts, Conversions, and Expirations</CardTitle>
                    <CardDescription>Monitor trial performance over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsLine data={dailyTrialData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="started" stroke="#4F46E5" strokeWidth={2} name="Started" />
                        <Line type="monotone" dataKey="converted" stroke="#10B981" strokeWidth={2} name="Converted" />
                        <Line type="monotone" dataKey="expired" stroke="#EF4444" strokeWidth={2} name="Expired" />
                      </RechartsLine>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Cohort Analysis */}
            {cohortData && cohortData.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Users className="w-6 h-6 text-indigo-600" />
                  Cohort Analysis
                </h2>
                <Card>
                  <CardHeader>
                    <CardTitle>User Cohorts by Signup Month</CardTitle>
                    <CardDescription>Track retention and conversion by cohort</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Cohort</th>
                            <th className="text-right p-2">Total Users</th>
                            <th className="text-right p-2">Active</th>
                            <th className="text-right p-2">Trial</th>
                            <th className="text-right p-2">Canceled</th>
                            <th className="text-right p-2">Retention %</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cohortData.map((cohort) => (
                            <tr key={cohort.cohort} className="border-b hover:bg-gray-50">
                              <td className="p-2 font-medium">{cohort.cohort}</td>
                              <td className="text-right p-2">{cohort.totalUsers}</td>
                              <td className="text-right p-2 text-green-600">{cohort.activeSubscriptions}</td>
                              <td className="text-right p-2 text-blue-600">{cohort.trialUsers}</td>
                              <td className="text-right p-2 text-red-600">{cohort.canceledSubscriptions}</td>
                              <td className="text-right p-2 font-semibold">{cohort.retentionRate}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Lifetime Value by Cohort */}
            {ltvData && ltvData.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Lifetime Value by Cohort</h2>
                <Card>
                  <CardHeader>
                    <CardTitle>Average LTV per Cohort</CardTitle>
                    <CardDescription>Estimated lifetime value based on subscription duration</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={ltvData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="cohort" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="lifetimeValue" fill="#10B981" name="Lifetime Value ($)" />
                        <Bar dataKey="avgMonthsActive" fill="#4F46E5" name="Avg Months Active" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Subscription Metrics */}
            <div>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <DollarSign className="w-6 h-6 text-indigo-600" />
                Subscription Metrics
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm text-gray-600">Subscriptions Created</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">
                      {subscriptionMetrics?.created || 0}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm text-gray-600">Subscriptions Canceled</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-red-600">
                      {subscriptionMetrics?.canceled || 0}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm text-gray-600">Churn Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-orange-600">
                      {subscriptionMetrics?.churnRate || 0}%
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
