import { useState, useEffect } from "react";
import { MessageCircle, Phone, Send } from "lucide-react";

interface Message {
  id: string;
  sender_id: string;
  sender_name: string;
  receiver_id: string;
  receiver_name: string;
  content: string;
  timestamp: string;
  type: "text" | "whatsapp" | "call";
}

interface ChatProps {
  currentUser: {
    id: string;
    name: string;
    user_role: "driver" | "passenger";
    whatsapp: string;
  };
  otherUser: {
    id: string;
    name: string;
    user_role: "driver" | "passenger";
    whatsapp: string;
    phone: string;
  };
}

const ChatSystem = ({ currentUser, otherUser }: ChatProps) => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  // Mock messages for demo
  useEffect(() => {
    const demoMessages: Message[] = [
      {
        id: "1",
        sender_id: currentUser.id,
        sender_name: currentUser.name,
        receiver_id: otherUser.id,
        receiver_name: otherUser.name,
        content: "Hi! I need a ride to campus.",
        timestamp: new Date().toISOString(),
        type: "text"
      }
    ];
    setMessages(demoMessages);
  }, [currentUser, otherUser]);

  const sendMessage = () => {
    if (!message.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      sender_id: currentUser.id,
      sender_name: currentUser.name,
      receiver_id: otherUser.id,
      receiver_name: otherUser.name,
      content: message,
      timestamp: new Date().toISOString(),
      type: "text"
    };

    setMessages(prev => [...prev, newMessage]);
    setMessage("");
  };

  const connectWhatsApp = () => {
    const whatsappUrl = `https://wa.me/${otherUser.whatsapp.replace(/^0/, '92')}`;
    window.open(whatsappUrl, '_blank');
  };

  const makeCall = () => {
    window.open(`tel:${otherUser.phone}`, '_blank');
  };

  return (
    <div className="fixed bottom-0 right-0 w-80 h-96 bg-white border-l border-t border-gray-200 shadow-lg flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            <span className="text-xs font-bold">{currentUser.name.charAt(0)}</span>
          </div>
          <div>
            <p className="text-sm font-medium">{currentUser.name}</p>
            <p className="text-xs text-gray-500">{currentUser.user_role}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            <span className="text-xs font-bold">{otherUser.name.charAt(0)}</span>
          </div>
          <div>
            <p className="text-sm font-medium">{otherUser.name}</p>
            <p className="text-xs text-gray-500">{otherUser.user_role}</p>
          </div>
        </div>
        <button
          onClick={() => window.parent.postMessage({ type: 'close-chat' })}
          className="text-gray-500 hover:text-gray-700"
        >
          ×
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender_id === currentUser.id ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-xs ${msg.sender_id === currentUser.id ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-800'} rounded-lg p-2`}>
              <p className="text-sm">{msg.content}</p>
              <p className="text-xs opacity-75">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Contact Options */}
      <div className="p-3 border-t border-gray-200">
        <div className="flex gap-2">
          <button
            onClick={connectWhatsApp}
            className="flex-1 bg-green-500 text-white py-2 px-3 rounded-lg flex items-center justify-center gap-2 hover:bg-green-600 transition-colors"
          >
            <Phone className="w-4 h-4" />
            Connect to WhatsApp
          </button>
          <button
            onClick={makeCall}
            className="flex-1 bg-blue-500 text-white py-2 px-3 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors"
          >
            <Phone className="w-4 h-4" />
            Dial a Call
          </button>
        </div>

        {/* Message Input */}
        <div className="flex gap-2 p-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                sendMessage();
              }
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!message.trim()}
            className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatSystem;
