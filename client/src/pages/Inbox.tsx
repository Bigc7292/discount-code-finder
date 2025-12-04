import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Inbox as InboxIcon, Copy, ExternalLink, Mail, MailOpen } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";

export default function Inbox() {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const { data: messages, isLoading } = trpc.inbox.getMessages.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const markReadMutation = trpc.inbox.markRead.useMutation({
    onSuccess: () => {
      utils.inbox.getMessages.invalidate();
    },
  });

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied to clipboard!");
  };

  const handleMarkRead = (messageId: number) => {
    markReadMutation.mutate({ messageId });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>Please sign in to view your inbox</CardDescription>
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
                <InboxIcon className="w-6 h-6 text-white" />
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
            <Link href="/profile">
              <Button variant="ghost">Profile</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Your Inbox</h1>
            <p className="text-gray-600">Verified discount codes delivered straight to you</p>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Loading messages...</p>
            </div>
          ) : messages && messages.length > 0 ? (
            <div className="space-y-4">
              {messages.map((item) => {
                const code = item.code;
                const search = item.search;
                const message = item.message;

                if (!code || !search) return null;

                return (
                  <Card
                    key={message.id}
                    className={`border-2 transition-all ${
                      message.isRead
                        ? "border-gray-200 bg-white"
                        : "border-green-200 bg-green-50/50"
                    }`}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {message.isRead ? (
                              <MailOpen className="w-5 h-5 text-gray-400" />
                            ) : (
                              <Mail className="w-5 h-5 text-green-600" />
                            )}
                            <h3 className="text-xl font-bold">{code.merchantName}</h3>
                            <Badge className="bg-green-600">Verified</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            Search: {search.query}
                          </p>
                          <p className="text-gray-700 mb-2">{code.description}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="font-semibold text-green-600">
                              {code.discountAmount}
                            </span>
                            {code.expiryDate && (
                              <span>
                                Expires: {new Date(code.expiryDate).toLocaleDateString()}
                              </span>
                            )}
                            <span className="text-xs">
                              Received: {new Date(message.createdAt).toLocaleDateString()}
                            </span>
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
                          {!message.isRead && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleMarkRead(message.id)}
                            >
                              Mark Read
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <InboxIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No messages yet</h3>
                <p className="text-gray-600 mb-4">
                  Start searching for discount codes and verified codes will appear here
                </p>
                <Link href="/search">
                  <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                    Start Searching
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
