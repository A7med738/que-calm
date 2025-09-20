import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Star, Clock, Users, Building2, ArrowLeft } from "lucide-react";

// Mock data for medical centers
const medicalCenters = [
  {
    id: 1,
    name: "عيادة الدكتور محمد أحمد",
    specialty: "طب الأسنان",
    image: "/placeholder.svg",
    rating: 4.8,
    status: "مفتوح الآن",
    statusType: "open" as const,
    waitingCount: 5,
    address: "شارع الملك فهد، الرياض",
    estimatedWait: "25 دقيقة"
  },
  {
    id: 2,
    name: "مركز النور للعيون",
    specialty: "طب العيون",
    image: "/placeholder.svg",
    rating: 4.9,
    status: "مزدحم",
    statusType: "busy" as const,
    waitingCount: 12,
    address: "حي السليمانية، الرياض",
    estimatedWait: "45 دقيقة"
  },
  {
    id: 3,
    name: "عيادة الأسرة الحديثة",
    specialty: "طب الأسرة",
    image: "/placeholder.svg",
    rating: 4.6,
    status: "متاح",
    statusType: "available" as const,
    waitingCount: 3,
    address: "شارع العليا، الرياض",
    estimatedWait: "15 دقيقة"
  }
];

const PatientDashboard = () => {
  const [searchQuery, setSearchQuery] = useState("");
  
  const filteredCenters = medicalCenters.filter(center =>
    center.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    center.specialty.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-accent text-accent-foreground";
      case "busy":
        return "bg-destructive text-destructive-foreground";
      case "available":
        return "bg-accent text-accent-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-l from-primary/5 to-accent/5 border-b">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">أهلاً بك، أحمد</h1>
              <p className="text-muted-foreground">ابحث عن المركز الطبي المناسب لك</p>
            </div>
            <Link to="/" className="text-primary hover:text-primary/80 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-2xl">
            <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="ابحث عن مركز طبي، تخصص، أو طبيب..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-12 py-6 text-lg rounded-xl border-2 focus:border-primary"
            />
          </div>
        </div>
      </div>

      {/* Medical Centers List */}
      <div className="container mx-auto px-6 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">المراكز الطبية المتاحة</h2>
          <p className="text-muted-foreground">اختر المركز المناسب واحجز دورك</p>
        </div>

        <div className="space-y-6">
          {filteredCenters.map((center) => (
            <Card key={center.id} className="hover:shadow-lg transition-all duration-300 cursor-pointer">
              <CardContent className="p-6">
                <div className="flex gap-6">
                  {/* Center Image */}
                  <div className="flex-shrink-0">
                    <div className="w-24 h-24 bg-muted rounded-xl flex items-center justify-center">
                      <Building2 className="h-12 w-12 text-muted-foreground" />
                    </div>
                  </div>

                  {/* Center Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-semibold text-card-foreground mb-1">
                          {center.name}
                        </h3>
                        <p className="text-primary font-medium mb-2">{center.specialty}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{center.address}</span>
                        </div>
                      </div>
                      <Badge className={getStatusColor(center.statusType)}>
                        {center.status}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-6 mb-4">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{center.rating}</span>
                      </div>
                      
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{center.waitingCount} منتظر</span>
                      </div>
                      
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>الانتظار المتوقع: {center.estimatedWait}</span>
                      </div>
                    </div>

                    <Link to={`/patient/center/${center.id}`}>
                      <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
                        عرض التفاصيل واحجز دورك
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredCenters.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">لم يتم العثور على نتائج</h3>
            <p className="text-muted-foreground">حاول البحث بكلمات مختلفة</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientDashboard;