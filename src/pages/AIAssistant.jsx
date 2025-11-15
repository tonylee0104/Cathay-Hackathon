import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Send, Loader2, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function AIAssistant() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello! I'm your Cathay Cargo AI Assistant. I can help you with:\n\n- Calculating costs for orders\n- Generating quotations\n- Finding order information\n- Vendor recommendations\n\nWhat would you like to do?"
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list(),
  });

  const { data: quotations = [] } = useQuery({
    queryKey: ['quotations'],
    queryFn: () => base44.entities.Quotation.list(),
  });

  const { data: vendors = [] } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => base44.entities.TruckingVendor.list(),
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const context = `
You are an AI assistant for Cathay Cargo's quotation system. Here's the current data:

ORDERS (${orders.length} total):
${JSON.stringify(orders.slice(0, 5), null, 2)}

QUOTATIONS (${quotations.length} total):
${JSON.stringify(quotations.slice(0, 5), null, 2)}

VENDORS (${vendors.length} total):
${JSON.stringify(vendors, null, 2)}

User query: ${userMessage}

Provide helpful, concise responses. If the user wants to:
- Calculate costs: Explain the process and show relevant orders
- Generate quotes: Summarize quotation details
- Find orders: Search and display matching orders
- Get vendor info: Show vendor details and rates

Be friendly and professional. Format responses with markdown for readability.
      `;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: context,
      });

      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: typeof response === 'string' ? response : response.response || "I'm here to help!" 
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "I apologize, but I encountered an error. Please try again or rephrase your question." 
      }]);
    }

    setIsLoading(false);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="p-6 md:p-8 flex-shrink-0">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-[#006564]" />
            AI Assistant
          </h1>
          <p className="text-gray-600 mt-1">Ask questions about orders, costs, and quotations</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-6 md:px-8 pb-6 md:pb-8 min-h-0">
        <Card className="border-none shadow-lg flex-1 flex flex-col min-h-0">
          <CardHeader className="border-b flex-shrink-0">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#006564]" />
              Chat
            </CardTitle>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col p-0 min-h-0">
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-4 ${
                        message.role === 'user'
                          ? 'bg-[#006564] text-white'
                          : 'bg-white border border-gray-200'
                      }`}
                    >
                      {message.role === 'assistant' ? (
                        <ReactMarkdown
                          className="prose prose-sm max-w-none"
                          components={{
                            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                            ul: ({ children }) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,
                            li: ({ children }) => <li className="mb-1">{children}</li>,
                            strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      ) : (
                        <p className="text-sm">{message.content}</p>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <Loader2 className="w-5 h-5 animate-spin text-[#006564]" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <div className="border-t p-4 flex-shrink-0">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask me anything about your cargo operations..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="bg-[#006564] hover:bg-[#00877C]"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Tip: Try "Show me recent orders" or "Calculate cost for order ORD-12345"
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}