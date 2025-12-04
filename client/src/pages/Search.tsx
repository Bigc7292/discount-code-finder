import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Search as SearchIcon, Loader2, CheckCircle, Clock, XCircle, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";
import { getLoginUrl } from "@/const";

export default function Search() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const [currentSearchId, setCurrentSearchId] = useState<number | null>(null);

  // Get search limit status
  const { data: searchLimit } = trpc.search.getLimit.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 60000, // Refresh every minute
  });

  const createSearchMutation = trpc.search.create.useMutation({
    onSuccess: (data) => {
      setCurrentSearchId(data.searchId);
      const remainingMsg = data.remaining !== undefined ? ` ${data.remaining} searches remaining today.` : "";
      toast.success(`Search started! We're finding and verifying codes for you.${remainingMsg}`);
      setQuery("");
    },
    onError: (error) => {
      if (error.message.includes("subscription")) {
        toast.error("Please subscribe to start searching for discount codes");
        setLocation("/profile");
      } else {
        toast.error(error.message || "Failed to start search");
      }
    },
  });

  const { data: searchHistory } = trpc.search.getHistory.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 5000, // Poll every 5 seconds for updates
  });

  const { data: currentResults, refetch: refetchResults } = trpc.search.getResults.useQuery(
    { searchId: currentSearchId! },
    {
      enabled: currentSearchId !== null,
      refetchInterval: 3000,
    }
  );

  const handleSearch = () => {
    if (!query.trim()) {
      toast.error("Please enter a search query");
      return;
    }
    createSearchMutation.mutate({ query: query.trim() });
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied to clipboard!");
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>Please sign in to search for discount codes</CardDescription>
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
                <SearchIcon className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                CodeFinder
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/inbox">
              <Button variant="ghost">Inbox</Button>
            </Link>
            <Link href="/profile">
              <Button variant="ghost">Profile</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container py-12">
        {/* Search Bar */}
        <div className="max-w-3xl mx-auto mb-12">
          <Card className="border-2 border-indigo-200 shadow-lg">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">Search for Discount Codes</CardTitle>
                  <CardDescription>
                    Enter any product, service, or merchant name to find verified discount codes
                  </CardDescription>
                </div>
                {searchLimit && (
                  <div className="text-sm text-right">
                    {searchLimit.limit < 100 ? (
                      <div>
                        <div className="text-gray-600">Searches today:</div>
                        <div className="font-semibold text-lg">
                          <span className="text-purple-600">{searchLimit.remaining}</span>
                          <span className="text-gray-400"> / {searchLimit.limit}</span>
                        </div>
                        {searchLimit.remaining === 0 && (
                          <div className="text-xs text-red-600 mt-1">Limit reached</div>
                        )}
                      </div>
                    ) : (
                      <div className="text-green-600 font-semibold">✓ Unlimited</div>
                    )}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., Nike shoes, Uber Eats, Booking.com hotel..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="text-lg"
                />
                <Button
                  onClick={handleSearch}
                  disabled={createSearchMutation.isPending}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 px-8"
                >
                  {createSearchMutation.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <SearchIcon className="w-5 h-5 mr-2" />
                      Search
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Current Search Results */}
        {currentResults && (
          <div className="max-w-5xl mx-auto mb-12">
            <h2 className="text-2xl font-bold mb-4">Current Search Results</h2>
            <Card className="mb-4">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{currentResults.search.query}</CardTitle>
                    <CardDescription>
                      {currentResults.search.status === "processing" && "Searching and verifying codes..."}
                      {currentResults.search.status === "completed" && `Found ${currentResults.codes.length} verified codes`}
                      {currentResults.search.status === "failed" && "Search failed"}
                    </CardDescription>
                  </div>
                  <Badge variant={
                    currentResults.search.status === "completed" ? "default" :
                    currentResults.search.status === "processing" ? "secondary" : "destructive"
                  }>
                    {currentResults.search.status === "processing" && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                    {currentResults.search.status === "completed" && <CheckCircle className="w-4 h-4 mr-1" />}
                    {currentResults.search.status === "failed" && <XCircle className="w-4 h-4 mr-1" />}
                    {currentResults.search.status}
                  </Badge>
                </div>
              </CardHeader>
            </Card>

            {currentResults.codes.length > 0 && (
              <div className="grid gap-4">
                {currentResults.codes.map((code) => (
                  <Card key={code.id} className="border-2 border-green-200 bg-green-50/50">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-xl font-bold">{code.merchantName}</h3>
                            <Badge className="bg-green-600">Verified</Badge>
                          </div>
                          <p className="text-gray-700 mb-2">{code.description}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="font-semibold text-green-600">{code.discountAmount}</span>
                            {code.expiryDate && (
                              <span>Expires: {new Date(code.expiryDate).toLocaleDateString()}</span>
                            )}
                            <span className="text-xs">Source: {code.source}</span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 ml-4">
                          <div className="bg-white border-2 border-dashed border-indigo-300 rounded-lg px-4 py-2 font-mono text-lg font-bold text-center">
                            {code.code}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyCode(code.code)}
                          >
                            <Copy className="w-4 h-4 mr-1" />
                            Copy
                          </Button>
                          {code.merchantUrl && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(code.merchantUrl!, "_blank")}
                            >
                              <ExternalLink className="w-4 h-4 mr-1" />
                              Visit
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Search History */}
        {searchHistory && searchHistory.length > 0 && (
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">Recent Searches</h2>
            <div className="grid gap-4">
              {searchHistory.slice(0, 10).map((search) => (
                <Card
                  key={search.id}
                  className="cursor-pointer hover:border-indigo-300 transition-all"
                  onClick={() => setCurrentSearchId(search.id)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{search.query}</h3>
                        <p className="text-sm text-gray-600">
                          {new Date(search.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant={
                        search.status === "completed" ? "default" :
                        search.status === "processing" ? "secondary" : "destructive"
                      }>
                        {search.status === "processing" && <Clock className="w-4 h-4 mr-1" />}
                        {search.status === "completed" && <CheckCircle className="w-4 h-4 mr-1" />}
                        {search.status === "failed" && <XCircle className="w-4 h-4 mr-1" />}
                        {search.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
