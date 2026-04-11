import { useState, useRef, useEffect } from "react";
import { Search, X, MapPin, Navigation, Building, Map } from "lucide-react";

interface LocationResult {
  display_name: string;
  lat: string;
  lon: string;
  type?: string;
  importance?: number;
}

interface KarachiArea {
  name: string;
  displayName: string;
  lat: number;
  lng: number;
  type: "area" | "landmark" | "university";
  icon: React.ReactNode;
}

interface LocationSearchProps {
  placeholder?: string;
  onSelect: (location: { name: string; lat: number; lng: number }) => void;
  value?: string;
}

// Karachi Areas Database
const KARACHI_AREAS: KarachiArea[] = [
  // Major Areas
  { name: "gulshan", displayName: "Gulshan-e-Iqbal", lat: 24.9333, lng: 67.0833, type: "area", icon: <Building className="w-4 h-4" /> },
  { name: "gulshan-e-iqbal", displayName: "Gulshan-e-Iqbal", lat: 24.9333, lng: 67.0833, type: "area", icon: <Building className="w-4 h-4" /> },
  { name: "north nazimabad", displayName: "North Nazimabad", lat: 24.9500, lng: 67.0667, type: "area", icon: <Building className="w-4 h-4" /> },
  { name: "clifton", displayName: "Clifton", lat: 24.8000, lng: 67.0500, type: "area", icon: <Building className="w-4 h-4" /> },
  { name: "defence", displayName: "Defence Housing Authority (DHA)", lat: 24.8000, lng: 67.0833, type: "area", icon: <Building className="w-4 h-4" /> },
  { name: "dha", displayName: "Defence Housing Authority (DHA)", lat: 24.8000, lng: 67.0833, type: "area", icon: <Building className="w-4 h-4" /> },
  { name: "saddar", displayName: "Saddar", lat: 24.8600, lng: 67.0010, type: "area", icon: <Building className="w-4 h-4" /> },
  { name: "korangi", displayName: "Korangi", lat: 24.8333, lng: 67.1333, type: "area", icon: <Building className="w-4 h-4" /> },
  { name: "johar", displayName: "Johar", lat: 24.9500, lng: 67.1333, type: "area", icon: <Building className="w-4 h-4" /> },
  { name: "gulistan-e-jauhar", displayName: "Gulistan-e-Jauhar", lat: 24.9333, lng: 67.1333, type: "area", icon: <Building className="w-4 h-4" /> },
  { name: "bahadurabad", displayName: "Bahadurabad", lat: 24.9167, lng: 67.0833, type: "area", icon: <Building className="w-4 h-4" /> },
  { name: "liaquatabad", displayName: "Liaquatabad", lat: 24.9333, lng: 67.0500, type: "area", icon: <Building className="w-4 h-4" /> },
  { name: "landhi", displayName: "Landhi", lat: 24.8500, lng: 67.2000, type: "area", icon: <Building className="w-4 h-4" /> },
  { name: "malir", displayName: "Malir", lat: 24.8833, lng: 67.2000, type: "area", icon: <Building className="w-4 h-4" /> },
  { name: "shah faisal", displayName: "Shah Faisal", lat: 24.8833, lng: 67.1667, type: "area", icon: <Building className="w-4 h-4" /> },
  { name: "nazimabad", displayName: "Nazimabad", lat: 24.9333, lng: 67.0500, type: "area", icon: <Building className="w-4 h-4" /> },
  { name: "pechs", displayName: "PECHS", lat: 24.8667, lng: 67.0500, type: "area", icon: <Building className="w-4 h-4" /> },
  { name: "garden", displayName: "Garden", lat: 24.8667, lng: 67.0333, type: "area", icon: <Building className="w-4 h-4" /> },
  { name: "cantt", displayName: "Cantt", lat: 24.8833, lng: 67.0833, type: "area", icon: <Building className="w-4 h-4" /> },
  { name: "khi", displayName: "Karachi", lat: 24.8607, lng: 67.0011, type: "area", icon: <Map className="w-4 h-4" /> },
  
  // Universities and Educational Institutions
  { name: "ned university", displayName: "NED University of Engineering & Technology", lat: 24.9340, lng: 67.1113, type: "university", icon: <Building className="w-4 h-4" /> },
  { name: "ned", displayName: "NED University of Engineering & Technology", lat: 24.9340, lng: 67.1113, type: "university", icon: <Building className="w-4 h-4" /> },
  { name: "uok", displayName: "University of Karachi", lat: 24.9333, lng: 67.1333, type: "university", icon: <Building className="w-4 h-4" /> },
  { name: "iob", displayName: "Institute of Business Administration", lat: 24.9167, lng: 67.1167, type: "university", icon: <Building className="w-4 h-4" /> },
  { name: "nust", displayName: "NUST - Karachi Campus", lat: 24.9333, lng: 67.1333, type: "university", icon: <Building className="w-4 h-4" /> },
  
  // Landmarks
  { name: "jinnah terminal", displayName: "Jinnah International Airport", lat: 24.9065, lng: 67.1608, type: "landmark", icon: <MapPin className="w-4 h-4" /> },
  { name: "airport", displayName: "Jinnah International Airport", lat: 24.9065, lng: 67.1608, type: "landmark", icon: <MapPin className="w-4 h-4" /> },
  { name: "port grand", displayName: "Port Grand Food Street", lat: 24.8333, lng: 67.0000, type: "landmark", icon: <MapPin className="w-4 h-4" /> },
  { name: "seaview", displayName: "Sea View Beach", lat: 24.7833, lng: 67.0667, type: "landmark", icon: <MapPin className="w-4 h-4" /> },
  { name: "clifton beach", displayName: "Clifton Beach", lat: 24.8000, lng: 67.0500, type: "landmark", icon: <MapPin className="w-4 h-4" /> },
  { name: "mazar-e-quaid", displayName: "Mazar-e-Quaid", lat: 24.8667, lng: 67.0333, type: "landmark", icon: <MapPin className="w-4 h-4" /> },
  { name: "quaid e azam", displayName: "Mazar-e-Quaid", lat: 24.8667, lng: 67.0333, type: "landmark", icon: <MapPin className="w-4 h-4" /> },
  { name: "frere hall", displayName: "Frere Hall", lat: 24.8333, lng: 67.0333, type: "landmark", icon: <MapPin className="w-4 h-4" /> },
  { name: "empress market", displayName: "Empress Market", lat: 24.8667, lng: 67.0333, type: "landmark", icon: <MapPin className="w-4 h-4" /> },
];

const LocationSearch = ({ placeholder = "Search location...", onSelect, value }: LocationSearchProps) => {
  const [query, setQuery] = useState(value || "");
  const [results, setResults] = useState<(LocationResult | KarachiArea)[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value !== undefined) setQuery(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchLocations = async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    setLoading(true);
    
    try {
      // First search Karachi areas database
      const karachiMatches = KARACHI_AREAS.filter(area => 
        area.name.toLowerCase().includes(q.toLowerCase()) ||
        area.displayName.toLowerCase().includes(q.toLowerCase())
      );
      
      // Then search OpenStreetMap for more specific addresses
      let apiResults: LocationResult[] = [];
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q + ", Karachi, Pakistan")}&limit=3`
        );
        apiResults = await res.json();
      } catch (error) {
        console.log("API search failed, using local database only");
      }
      
      // Combine results, prioritizing Karachi areas
      const combinedResults = [...karachiMatches, ...apiResults];
      setResults(combinedResults);
      setIsOpen(combinedResults.length > 0);
      setHighlightedIndex(-1);
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
      setIsOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchLocations(val), 400);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : results.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0) {
          handleSelect(results[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const handleSelect = (result: LocationResult | KarachiArea) => {
    let locationName: string;
    let latitude: number;
    let longitude: number;
    
    if ('displayName' in result) {
      // KarachiArea
      locationName = result.displayName;
      latitude = result.lat;
      longitude = result.lng;
    } else {
      // LocationResult
      locationName = result.display_name.split(",").slice(0, 3).join(", ");
      latitude = parseFloat(result.lat);
      longitude = parseFloat(result.lon);
    }
    
    setQuery(locationName);
    setIsOpen(false);
    onSelect({ name: locationName, lat: latitude, lng: longitude });
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();
          
          const locationName = data.display_name?.split(",").slice(0, 3).join(", ") || "Current Location";
          setQuery(locationName);
          onSelect({ name: locationName, lat: latitude, lng: longitude });
          setIsOpen(false);
        } catch (error) {
          setQuery("Current Location");
          onSelect({ name: "Current Location", lat: latitude, lng: longitude });
          setIsOpen(false);
        }
        
        setLocationLoading(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        alert("Unable to retrieve your location. Please enable location services.");
        setLocationLoading(false);
      }
    );
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/70" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full h-12 rounded-xl border-2 border-primary/30 bg-black/80 backdrop-blur-sm pl-10 pr-20 text-sm text-white placeholder:text-primary/70 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/40 focus:bg-black/90 transition-all duration-200"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
          {query && (
            <button
              onClick={() => { setQuery(""); setResults([]); setIsOpen(false); }}
              className="p-1.5 hover:bg-primary/20 rounded-lg transition-colors border border-primary/30"
            >
              <X className="w-4 h-4 text-primary/70 hover:text-primary" />
            </button>
          )}
          <button
            onClick={getCurrentLocation}
            disabled={locationLoading}
            className="p-1.5 hover:bg-primary/20 rounded-lg transition-colors border border-primary/30 disabled:opacity-50"
            title="Use current location"
          >
            <Navigation className={`w-4 h-4 ${locationLoading ? 'animate-pulse text-primary' : 'text-primary/70 hover:text-primary'}`} />
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border-2 border-primary/20 bg-black/95 backdrop-blur-sm shadow-2xl shadow-primary/20 max-h-64 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-sm text-primary text-center animate-pulse">
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-neon-green rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-neon-green rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-neon-green rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
              <span className="ml-2">Searching Karachi areas...</span>
            </div>
          ) : (
            results.map((result, i) => {
              const isKarachiArea = 'displayName' in result;
              const isHighlighted = i === highlightedIndex;
              const locationName = isKarachiArea ? result.displayName : result.display_name.split(",").slice(0, 3).join(", ");
              const icon = isKarachiArea ? result.icon : <MapPin className="w-4 h-4" />;
              
              return (
                <button
                  key={i}
                  onClick={() => handleSelect(result)}
                  onMouseEnter={() => setHighlightedIndex(i)}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-all duration-200 border-b border-primary/10 last:border-b-0 ${
                    isHighlighted 
                      ? 'bg-primary/20 border-l-4 border-l-primary' 
                      : 'hover:bg-primary/10 hover:border-l-4 hover:border-l-primary'
                  }`}
                >
                  <div className={`shrink-0 mt-0.5 ${
                    isKarachiArea ? 'text-primary' : 'text-primary/80'
                  }`}>
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={`text-foreground line-clamp-2 font-medium ${
                      isHighlighted ? 'text-primary' : ''
                    }`}>
                      {locationName}
                    </span>
                    {isKarachiArea && result.type && (
                      <span className="text-xs text-primary/60 block mt-1">
                        {result.type === 'university' ? 'University' : 
                         result.type === 'landmark' ? 'Landmark' : 'Area'}
                      </span>
                    )}
                  </div>
                  {isKarachiArea && (
                    <div className="text-xs text-primary/60 shrink-0">
                      24.{result.lat.toFixed(2)}°N, 67.{result.lng.toFixed(2)}°E
                    </div>
                  )}
                </button>
              );
            })
          )}
          
          {results.length === 0 && !loading && (
            <div className="p-4 text-center">
              <div className="text-primary/60 text-sm mb-2">
                <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                No locations found
              </div>
              <p className="text-xs text-primary/40">
                Try searching for areas like "Gulshan", "Clifton", or "DHA"
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LocationSearch;
