import { useState } from "react";
import { Phone, MessageCircle, ChevronDown } from "lucide-react";

interface PhoneContactProps {
  phoneNumber: string;
  userName?: string;
  compact?: boolean;
}

const PhoneContact = ({ phoneNumber, userName, compact = false }: PhoneContactProps) => {
  const [showOptions, setShowOptions] = useState(false);

  const handleWhatsAppClick = () => {
    const whatsappUrl = `https://wa.me/${phoneNumber.replace(/[^0-9]/g, '')}`;
    window.open(whatsappUrl, '_blank');
    setShowOptions(false);
  };

  const handleCallClick = () => {
    window.location.href = `tel:${phoneNumber}`;
    setShowOptions(false);
  };

  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowOptions(!showOptions)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm"
        >
          <Phone className="w-4 h-4" />
          <span>Contact</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${showOptions ? 'rotate-180' : ''}`} />
        </button>
        
        {showOptions && (
          <div className="absolute top-full left-0 mt-1 w-48 rounded-lg border border-border bg-background shadow-lg z-50">
            <button
              onClick={handleWhatsAppClick}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-green-600" />
              Chat on WhatsApp
            </button>
            <button
              onClick={handleCallClick}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
            >
              <Phone className="w-4 h-4 text-blue-600" />
              Call Number
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Phone className="w-4 h-4" />
        <span>Contact {userName || 'Driver'}</span>
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={handleWhatsAppClick}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors text-sm font-medium"
        >
          <MessageCircle className="w-4 h-4" />
          Chat on WhatsApp
        </button>
        <button
          onClick={handleCallClick}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Phone className="w-4 h-4" />
          Call Now
        </button>
      </div>
    </div>
  );
};

export default PhoneContact;
