import { useNavigate, useLocation } from "react-router-dom";
import { Building2, Heart, Calendar, User } from "lucide-react";

const PatientBottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine active tab based on current route
  const getActiveTab = () => {
    const path = location.pathname;
    if (path === "/patient/dashboard") return "dashboard";
    if (path === "/patient/center" || path.startsWith("/patient/center/")) return "dashboard";
    if (path === "/patient/booking" || path.startsWith("/patient/booking/")) return "dashboard";
    if (path === "/patient/queue" || path.startsWith("/patient/queue/")) return "bookings";
    return "dashboard";
  };

  const activeTab = getActiveTab();

  const handleTabClick = (tab: string) => {
    switch (tab) {
      case "dashboard":
        navigate("/patient/dashboard");
        break;
      case "favorites":
        navigate("/patient/dashboard?tab=favorites");
        break;
      case "bookings":
        navigate("/patient/dashboard?tab=bookings");
        break;
      case "profile":
        navigate("/patient/dashboard?tab=profile");
        break;
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="flex items-center justify-around py-2">
        <button
          onClick={() => handleTabClick("dashboard")}
          className={`flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors ${
            activeTab === "dashboard"
              ? "text-primary bg-primary/10"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Building2 className="h-5 w-5" />
          <span className="text-xs font-medium">المراكز</span>
        </button>
        
        <button
          onClick={() => handleTabClick("favorites")}
          className={`flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors ${
            activeTab === "favorites"
              ? "text-primary bg-primary/10"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Heart className="h-5 w-5" />
          <span className="text-xs font-medium">المفضلة</span>
        </button>
        
        <button
          onClick={() => handleTabClick("bookings")}
          className={`flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors ${
            activeTab === "bookings"
              ? "text-primary bg-primary/10"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Calendar className="h-5 w-5" />
          <span className="text-xs font-medium">حجوزاتي</span>
        </button>
        
        <button
          onClick={() => handleTabClick("profile")}
          className={`flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors ${
            activeTab === "profile"
              ? "text-primary bg-primary/10"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <User className="h-5 w-5" />
          <span className="text-xs font-medium">حسابي</span>
        </button>
      </div>
    </div>
  );
};

export default PatientBottomNavigation;
