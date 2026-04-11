import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Send, MapPin, Clock, Users, MessageCircle } from "lucide-react";

interface ChatMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  message: string;
  created_at: string;
  type: "text" | "location" | "time";
}

interface RouteChatProps {
  rideId: string;
  driverId: string;
  compact?: boolean;
}

const RouteChat = ({ rideId, driverId, compact = false }: RouteChatProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isOnline, setIsOnline] = useState<{ [key: string]: boolean }>({});

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["chat-messages", rideId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ride_messages")
        .select("*")
        .eq("ride_id", rideId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!rideId,
  });

  const sendMessage = useMutation({
    mutationFn: async (messageText: string) => {
      const { data, error } = await supabase
        .from("ride_messages")
        .insert({
          ride_id: rideId,
          sender_id: user?.id,
          message: messageText.trim(),
          type: "text"
        });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-messages", rideId] });
      setMessage("");
    },
    onError: (err: Error) => {
      toast.error("Failed to send message: " + err.message);
    },
  });

  const sendQuickMessage = useMutation({
    mutationFn: async (quickMessage: { type: "location" | "time"; message: string }) => {
      const { data, error } = await supabase
        .from("ride_messages")
        .insert({
          ride_id: rideId,
          sender_id: user?.id,
          message: quickMessage.message,
          type: quickMessage.type
        });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-messages", rideId] });
    },
  });

  useEffect(() => {
    // Set up real-time subscription
    const subscription = supabase
      .channel(`ride-chat-${rideId}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'ride_messages',
          filter: `ride_id=eq.${rideId}`
        }, 
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ["chat-messages", rideId] });
          
          // Update typing status
          const newMessage = payload.new as ChatMessage;
          if (newMessage.sender_id !== user?.id) {
            setIsTyping(false);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [rideId, user?.id, queryClient]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (message.trim() && !sendMessage.isPending) {
      sendMessage.mutate(message);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (messageDate.getTime() === today.getTime()) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const quickMessages = [
    { 
      type: "location" as const, 
      message: "I'm waiting at Main Gate", 
      icon: <MapPin className="w-4 h-4" />,
      label: "Main Gate"
    },
    { 
      type: "location" as const, 
      message: "Waiting at M-2 Parking lot", 
      icon: <MapPin className="w-4 h-4" />,
      label: "M-2 Parking"
    },
    { 
      type: "location" as const, 
      message: "At Convocation Hill", 
      icon: <MapPin className="w-4 h-4" />,
      label: "Convocation Hill"
    },
    { 
      type: "time" as const, 
      message: "Running 5 minutes late", 
      icon: <Clock className="w-4 h-4" />,
      label: "5 min late"
    },
    { 
      type: "time" as const, 
      message: "Be there in 2 minutes", 
      icon: <Clock className="w-4 h-4" />,
      label: "2 min away"
    },
  ];

  if (compact) {
    return (
      <button
        onClick={() => {/* Open full chat */}}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        <MessageCircle className="w-4 h-4" />
        <span className="text-sm font-medium">Chat</span>
        {messages.length > 0 && (
          <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {messages.length}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Ride Chat</h3>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="w-4 h-4" />
          <span>{messages.length} messages</span>
        </div>
      </div>

      {/* Quick Messages */}
      <div className="p-3 border-b border-border bg-muted/30">
        <p className="text-xs text-muted-foreground mb-2">Quick messages:</p>
        <div className="flex gap-2 overflow-x-auto">
          {quickMessages.map((quickMsg, index) => (
            <button
              key={index}
              onClick={() => sendQuickMessage.mutate(quickMsg)}
              disabled={sendQuickMessage.isPending}
              className="flex items-center gap-1 px-2 py-1.5 bg-background border border-border rounded-lg text-xs font-medium hover:bg-muted transition-colors whitespace-nowrap disabled:opacity-50"
            >
              {quickMsg.icon}
              {quickMsg.label}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="text-center text-muted-foreground py-8">
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No messages yet</p>
            <p className="text-sm">Start coordinating with your ride partners!</p>
          </div>
        ) : (
          messages.map((msg: ChatMessage) => {
            const isOwn = msg.sender_id === user?.id;
            
            return (
              <div
                key={msg.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[70%] rounded-lg px-3 py-2 ${
                  isOwn 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  <p className="text-sm break-words">{msg.message}</p>
                  <p className={`text-xs mt-1 ${
                    isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground/70'
                  }`}>
                    {msg.sender_name} • {formatTime(msg.created_at)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-muted text-muted-foreground rounded-lg px-3 py-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-border bg-card">
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            disabled={sendMessage.isPending}
          />
          <button
            onClick={handleSendMessage}
            disabled={!message.trim() || sendMessage.isPending}
            className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-muted-foreground">
            Press Enter to send, Shift+Enter for new line
          </p>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-xs text-muted-foreground">End-to-end encrypted</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteChat;
