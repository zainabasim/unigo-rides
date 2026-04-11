import { useState } from "react";
import { MapPin, Building, GraduationCap, Home, Book } from "lucide-react";

interface Landmark {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  coordinates: { lat: number; lng: number };
  category: "gate" | "building" | "parking" | "facility";
}

interface CampusLandmarkSelectorProps {
  onSelect: (landmark: Landmark) => void;
  selectedLandmark?: Landmark;
  compact?: boolean;
}

const CAMPUS_LANDMARKS: Landmark[] = [
  {
    id: "main-gate",
    name: "Main Gate",
    description: "University main entrance on University Road",
    icon: <MapPin className="w-5 h-5" />,
    coordinates: { lat: 24.9340, lng: 67.1113 },
    category: "gate"
  },
  {
    id: "convocation-hill",
    name: "Convocation Hill",
    description: "Historic hill with panoramic city view",
    icon: <GraduationCap className="w-5 h-5" />,
    coordinates: { lat: 24.9350, lng: 67.1120 },
    category: "facility"
  },
  {
    id: "central-fountain",
    name: "Central Fountain",
    description: "Main campus fountain area",
    icon: <MapPin className="w-5 h-5" />,
    coordinates: { lat: 24.9335, lng: 67.1105 },
    category: "facility"
  },
  {
    id: "staff-colony",
    name: "Staff Colony",
    description: "Faculty residential area",
    icon: <Home className="w-5 h-5" />,
    coordinates: { lat: 24.9320, lng: 67.1090 },
    category: "building"
  },
  {
    id: "lej-library",
    name: "LEJ Library",
    description: "Liaquat Memorial Library",
    icon: <Book className="w-5 h-5" />,
    coordinates: { lat: 24.9345, lng: 67.1118 },
    category: "building"
  },
  {
    id: "engineering-block",
    name: "Engineering Block",
    description: "Main engineering departments building",
    icon: <Building className="w-5 h-5" />,
    coordinates: { lat: 24.9330, lng: 67.1100 },
    category: "building"
  },
  {
    id: "computer-science",
    name: "CS Department",
    description: "Computer Science & IT building",
    icon: <Building className="w-5 h-5" />,
    coordinates: { lat: 24.9335, lng: 67.1115 },
    category: "building"
  },
  {
    id: "electrical-engineering",
    name: "EE Department",
    description: "Electrical Engineering block",
    icon: <Building className="w-5 h-5" />,
    coordinates: { lat: 24.9325, lng: 67.1095 },
    category: "building"
  },
  {
    id: "m-2-parking",
    name: "M-2 Parking",
    description: "Mechanical department parking area",
    icon: <MapPin className="w-5 h-5" />,
    coordinates: { lat: 24.9315, lng: 67.1085 },
    category: "parking"
  },
  {
    id: "sports-complex",
    name: "Sports Complex",
    description: "Main sports and recreation area",
    icon: <Building className="w-5 h-5" />,
    coordinates: { lat: 24.9355, lng: 67.1130 },
    category: "facility"
  }
];

const CampusLandmarkSelector = ({ onSelect, selectedLandmark, compact = false }: CampusLandmarkSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredLandmarks = CAMPUS_LANDMARKS.filter(landmark =>
    landmark.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    landmark.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "gate": return "text-blue-600 bg-blue-100";
      case "building": return "text-purple-600 bg-purple-100";
      case "parking": return "text-orange-600 bg-orange-100";
      case "facility": return "text-green-600 bg-green-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  if (compact) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        <MapPin className="w-4 h-4" />
        <span className="text-sm font-medium">
          {selectedLandmark ? selectedLandmark.name : "Select Drop-off"}
        </span>
      </button>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-foreground flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          NED Campus Drop-off Points
        </h3>
        <div className="text-xs text-muted-foreground">
          GPS accuracy may vary • Choose exact location
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search landmarks..."
          className="w-full h-12 rounded-xl border border-border bg-background pl-4 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      </div>

      {/* Landmarks Grid */}
      <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
        {filteredLandmarks.map((landmark) => {
          const categoryColors = getCategoryColor(landmark.category);
          const isSelected = selectedLandmark?.id === landmark.id;
          
          return (
            <button
              key={landmark.id}
              onClick={() => {
                onSelect(landmark);
                setIsOpen(false);
              }}
              className={`p-4 rounded-xl border text-left transition-all duration-200 ${
                isSelected
                  ? "border-primary bg-primary/10 shadow-sm"
                  : "border-border bg-card hover:border-primary/50 hover:shadow-md"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${categoryColors}`}>
                  {landmark.icon}
                </div>
                <div className="flex-1">
                  <h4 className={`font-semibold text-foreground mb-1 ${
                    isSelected ? "text-primary" : ""
                  }`}>
                    {landmark.name}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {landmark.description}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${categoryColors}`}>
                      {landmark.category}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {landmark.coordinates.lat.toFixed(4)}, {landmark.coordinates.lng.toFixed(4)}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Popular Quick Select */}
      <div className="border-t border-border pt-4">
        <h4 className="font-medium text-foreground mb-3">Popular Drop-offs</h4>
        <div className="grid grid-cols-2 gap-2">
          {CAMPUS_LANDMARKS.slice(0, 4).map((landmark) => (
            <button
              key={landmark.id}
              onClick={() => {
                onSelect(landmark);
                setIsOpen(false);
              }}
              className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded ${getCategoryColor(landmark.category)}`}>
                  {landmark.icon}
                </div>
                <span className="text-sm font-medium text-foreground">{landmark.name}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* GPS Notice */}
      <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-orange-600 mt-0.5" />
          <div className="text-sm text-orange-700">
            <p className="font-medium mb-1">GPS Accuracy Notice</p>
            <p>
              Campus GPS coordinates can be off by 10-20 meters. 
              Selecting a specific landmark ensures the driver knows exactly where to stop.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampusLandmarkSelector;
