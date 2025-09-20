import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, Clock, User, SkipForward, CheckCircle, Settings, Stethoscope } from "lucide-react";

// Mock queue data
const queueData = [
  { id: 1, number: 18, name: "أحمد محمد علي", service: "كشف وتشخيص", time: "2:30 م", status: "current" },
  { id: 2, number: 19, name: "فاطمة أحمد سالم", service: "تنظيف الأسنان", time: "2:35 م", status: "waiting" },
  { id: 3, number: 20, name: "محمد عبدالله خالد", service: "حشو الأسنان", time: "2:40 م", status: "waiting" },
  { id: 4, number: 21, name: "نورا سعد محمود", service: "كشف وتشخيص", time: "2:45 م", status: "waiting" },
  { id: 5, number: 22, name: "عبدالرحمن علي حسن", service: "استشارة تقويم", time: "2:50 م", status: "waiting" }
];

const ClinicDashboard = () => {
  const [queue, setQueue] = useState(queueData);
  const [currentPatient, setCurrentPatient] = useState(queue[0]);
  const [selectedTab, setSelectedTab] = useState("queue");

  const handleNextPatient = () => {
    const currentIndex = queue.findIndex(p => p.id === currentPatient?.id);
    if (currentIndex < queue.length - 1) {
      setCurrentPatient(queue[currentIndex + 1]);
    }
  };

  const handleSkipPatient = () => {
    // Move current patient to end of queue
    const updatedQueue = queue.filter(p => p.id !== currentPatient?.id);
    const skippedPatient = { ...currentPatient, status: "waiting" as const };
    const newQueue = [...updatedQueue, skippedPatient];
    setQueue(newQueue);
    
    if (updatedQueue.length > 0) {
      setCurrentPatient(updatedQueue[0]);
    }
  };

  const waitingPatients = queue.filter(p => p.status === "waiting");
  const totalWaiting = waitingPatients.length;

  const clinicInfo = {
    name: "عيادة الدكتور محمد أحمد",
    todayPatients: 28,
    currentStatus: "مفتوح"
  };

  const tabs = [
    { id: "queue", label: "الطابور المباشر", icon: Users },
    { id: "services", label: "الخدمات", icon: Stethoscope },
    { id: "settings", label: "الإعدادات", icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex-1">
              <h1 className="text-lg sm:text-2xl font-bold text-foreground">{clinicInfo.name}</h1>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 mt-1">
                <span className="text-xs sm:text-sm text-muted-foreground">اليوم: {clinicInfo.todayPatients} مريض</span>
                <Badge className="bg-accent text-accent-foreground text-xs">{clinicInfo.currentStatus}</Badge>
              </div>
            </div>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* Sidebar */}
        <div className="w-full lg:w-64 bg-card border-b lg:border-b-0 lg:border-l min-h-auto lg:min-h-screen">
          <div className="p-3 sm:p-4">
            <nav className="flex lg:flex-col gap-2 lg:space-y-2 overflow-x-auto lg:overflow-x-visible">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedTab(tab.id)}
                    className={`flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2 lg:py-3 rounded-lg transition-colors text-right whitespace-nowrap lg:w-full ${
                      selectedTab === tab.id
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon className="h-4 w-4 lg:h-5 lg:w-5" />
                    <span className="text-sm lg:text-base">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 sm:p-6">
          {selectedTab === "queue" && (
            <div className="space-y-4 sm:space-y-6">
              {/* Current Patient Card */}
              {currentPatient && (
                <Card className="border-primary/20 bg-gradient-to-l from-primary/5 to-transparent">
                  <CardHeader className="pb-3 sm:pb-6">
                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                      <User className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                      المريض التالي
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 sm:space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      <div className="space-y-3 sm:space-y-4">
                        <div>
                          <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                            رقم {currentPatient.number}
                          </h3>
                          <p className="text-lg sm:text-xl font-semibold text-card-foreground">
                            {currentPatient.name}
                          </p>
                          <p className="text-primary font-medium text-sm sm:text-base">{currentPatient.service}</p>
                          <div className="flex items-center gap-2 text-muted-foreground text-sm sm:text-base">
                            <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span>وقت الحجز: {currentPatient.time}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2 sm:gap-3">
                        <Button 
                          onClick={handleNextPatient}
                          className="bg-accent hover:bg-accent/90 text-accent-foreground flex items-center gap-2 text-sm sm:text-base"
                          size="lg"
                        >
                          <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                          <span className="hidden sm:inline">التالي - انتهى الفحص</span>
                          <span className="sm:hidden">التالي</span>
                        </Button>
                        <Button 
                          onClick={handleSkipPatient}
                          variant="outline"
                          className="border-orange-300 text-orange-600 hover:bg-orange-50 flex items-center gap-2 text-sm sm:text-base"
                          size="lg"
                        >
                          <SkipForward className="h-4 w-4 sm:h-5 sm:w-5" />
                          <span className="hidden sm:inline">تأجيل - لم يحضر</span>
                          <span className="sm:hidden">تأجيل</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Queue Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <Card>
                  <CardContent className="p-4 sm:p-6 text-center">
                    <Users className="h-6 w-6 sm:h-8 sm:w-8 text-primary mx-auto mb-2" />
                    <div className="text-xl sm:text-2xl font-bold text-foreground">{totalWaiting}</div>
                    <p className="text-muted-foreground text-sm sm:text-base">في الانتظار</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 sm:p-6 text-center">
                    <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-accent mx-auto mb-2" />
                    <div className="text-xl sm:text-2xl font-bold text-foreground">23</div>
                    <p className="text-muted-foreground text-sm sm:text-base">تم فحصهم اليوم</p>
                  </CardContent>
                </Card>
              </div>

              {/* Waiting List */}
              <Card>
                <CardHeader className="pb-3 sm:pb-6">
                  <CardTitle className="text-lg sm:text-xl">قائمة الانتظار</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 sm:space-y-4">
                    {waitingPatients.map((patient, index) => (
                      <div key={patient.id} className="flex items-center justify-between p-3 sm:p-4 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="font-bold text-primary text-sm sm:text-base">{patient.number}</span>
                          </div>
                          <div>
                            <p className="font-semibold text-card-foreground text-sm sm:text-base">{patient.name}</p>
                            <p className="text-xs sm:text-sm text-muted-foreground">{patient.service}</p>
                          </div>
                        </div>
                        <div className="text-left">
                          <p className="text-xs sm:text-sm text-muted-foreground">المرتبة {index + 1}</p>
                          <p className="text-xs sm:text-sm text-muted-foreground">{patient.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {selectedTab === "services" && (
            <div className="space-y-4 sm:space-y-6">
              <Card>
                <CardHeader className="pb-3 sm:pb-6">
                  <CardTitle className="text-lg sm:text-xl">إدارة الخدمات</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center py-6 sm:py-8 text-sm sm:text-base">
                    قريباً - صفحة إدارة الخدمات
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {selectedTab === "settings" && (
            <div className="space-y-4 sm:space-y-6">
              <Card>
                <CardHeader className="pb-3 sm:pb-6">
                  <CardTitle className="text-lg sm:text-xl">إعدادات المركز</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center py-6 sm:py-8 text-sm sm:text-base">
                    قريباً - صفحة الإعدادات
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClinicDashboard;