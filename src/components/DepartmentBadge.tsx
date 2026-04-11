import { Shield, Award, Star, CheckCircle } from "lucide-react";

interface DepartmentBadgeProps {
  department: string;
  designation?: string;
  trustLevel?: "high" | "medium" | "low";
  showIcon?: boolean;
  compact?: boolean;
}

const DEPARTMENT_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  "Computer Science": { bg: "bg-blue-100", text: "text-blue-700", icon: "💻" },
  "Electronic Engineering": { bg: "bg-green-100", text: "text-green-700", icon: "⚡" },
  "Civil Engineering": { bg: "bg-orange-100", text: "text-orange-700", icon: "🏗️" },
  "Mechanical Engineering": { bg: "bg-purple-100", text: "text-purple-700", icon: "⚙️" },
  "Electrical Engineering": { bg: "bg-yellow-100", text: "text-yellow-700", icon: "🔌" },
  "Chemical Engineering": { bg: "bg-red-100", text: "text-red-700", icon: "🧪" },
  "Metallurgy": { bg: "bg-gray-100", text: "text-gray-700", icon: "🔧" },
  "Petroleum Engineering": { bg: "bg-indigo-100", text: "text-indigo-700", icon: "🛢️" },
  "Textile Engineering": { bg: "bg-pink-100", text: "text-pink-700", icon: "🧵" },
  "Architecture": { bg: "bg-teal-100", text: "text-teal-700", icon: "🏛️" },
  "Management Sciences": { bg: "bg-emerald-100", text: "text-emerald-700", icon: "📊" },
  "Applied Sciences": { bg: "bg-cyan-100", text: "text-cyan-700", icon: "🔬" },
};

const TRUST_BADGES = {
  high: {
    icon: <Award className="w-4 h-4 text-yellow-500" />,
    label: "Trusted Driver",
    color: "bg-yellow-100 text-yellow-700",
    description: "50+ successful rides"
  },
  medium: {
    icon: <Shield className="w-4 h-4 text-blue-500" />,
    label: "Verified Faculty",
    color: "bg-blue-100 text-blue-700",
    description: "20+ successful rides"
  },
  low: {
    icon: <CheckCircle className="w-4 h-4 text-green-500" />,
    label: "New Member",
    color: "bg-green-100 text-green-700",
    description: "Getting started"
  }
};

const DepartmentBadge = ({ 
  department, 
  designation, 
  trustLevel = "medium", 
  showIcon = true, 
  compact = false 
}: DepartmentBadgeProps) => {
  const deptInfo = DEPARTMENT_COLORS[department] || {
    bg: "bg-gray-100", 
    text: "text-gray-700", 
    icon: "🎓" 
  };
  
  const trustInfo = TRUST_BADGES[trustLevel];

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${deptInfo.bg} ${deptInfo.text}`}>
        {showIcon && <span>{deptInfo.icon}</span>}
        {department.split(' ')[0]}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Department Badge */}
      <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg ${deptInfo.bg} ${deptInfo.text}`}>
        {showIcon && <span className="text-sm">{deptInfo.icon}</span>}
        <div>
          <p className="font-semibold text-sm">{department}</p>
          {designation && (
            <p className="text-xs opacity-75">{designation}</p>
          )}
        </div>
      </div>

      {/* Trust Badge */}
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${trustInfo.color}`}>
        {trustInfo.icon}
        <span>{trustInfo.label}</span>
      </div>

      {/* Trust Info */}
      <div className="text-xs text-muted-foreground">
        <p>{trustInfo.description}</p>
      </div>
    </div>
  );
};

export default DepartmentBadge;
