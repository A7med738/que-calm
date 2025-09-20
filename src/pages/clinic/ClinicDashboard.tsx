import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, Clock, User, SkipForward, CheckCircle, Settings, Stethoscope } from "lucide-react";

// Mock queue data
const queueData = [
  { id: 1, number: 18, name: "أحمد محمد العلي", service: "كشف وتشخيص", time: "2:30 م", status: "current" },
  { id: 2, number: 19, name: "فاطمة أحمد السالم", service: "تنظيف الأسنان", time: "2:35 م", status: "waiting" },
  { id: 3, number: 20, name: "محمد عبدالله الخالد", service: "حشو الأسنان", time: "2:40 م", status: "waiting" },
  { id: 4, number: 21, name: "نورا سعد المطيري", service: "كشف وتشخيص", time: "2:45 م", status: "waiting" },
  { id: 5, number: 22, name: "عبدالرحمن علي الغامدي", service: "استشارة تقويم", time: "2:50 م", status: "waiting" }
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
    avgWaitTime: "15 دقيقة",
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
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{clinicInfo.name}</h1>
              <div className="flex items-center gap-4 mt-1">
                <span className="text-sm text-muted-foreground">اليوم: {clinicInfo.todayPatients} مريض</span>
                <span className="text-sm text-muted-foreground">متوسط الانتظار: {clinicInfo.avgWaitTime}</span>
                <Badge className="bg-accent text-accent-foreground">{clinicInfo.currentStatus}</Badge>
              </div>
            </div>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-card border-l min-h-screen">
          <div className="p-4">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-right ${
                      selectedTab === tab.id
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {selectedTab === "queue" && (
            <div className="space-y-6">
              {/* Current Patient Card */}
              {currentPatient && (
                <Card className="border-primary/20 bg-gradient-to-l from-primary/5 to-transparent">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <User className="h-6 w-6 text-primary" />
                      المريض التالي
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-3xl font-bold text-foreground mb-2">
                            رقم {currentPatient.number}
                          </h3>
                          <p className="text-xl font-semibold text-card-foreground">
                            {currentPatient.name}
                          </p>
                          <p className="text-primary font-medium">{currentPatient.service}</p>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>وقت الحجز: {currentPatient.time}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-3">
                        <Button 
                          onClick={handleNextPatient}
                          className="bg-accent hover:bg-accent/90 text-accent-foreground flex items-center gap-2"
                          size="lg"
                        >
                          <CheckCircle className="h-5 w-5" />
                          التالي - انتهى الفحص
                        </Button>
                        <Button 
                          onClick={handleSkipPatient}
                          variant="outline"
                          className="border-orange-300 text-orange-600 hover:bg-orange-50 flex items-center gap-2"
                          size="lg"
                        >
                          <SkipForward className="h-5 w-5" />
                          تأجيل - لم يحضر
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Queue Overview */}
              <div className="grid md:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="p-6 text-center">
                    <Users className="h-8 w-8 text-primary mx-auto mb-2" />
                    <div className="text-2xl font-bold text-foreground">{totalWaiting}</div>
                    <p className="text-muted-foreground">في الانتظار</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 text-center">
                    <Clock className="h-8 w-8 text-accent mx-auto mb-2" />
                    <div className="text-2xl font-bold text-foreground">15</div>
                    <p className="text-muted-foreground">دقيقة متوسط انتظار</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 text-center">
                    <CheckCircle className="h-8 w-8 text-accent mx-auto mb-2" />
                    <div className="text-2xl font-bold text-foreground">23</div>
                    <p className="text-muted-foreground">تم فحصهم اليوم</p>
                  </CardContent>
                </Card>
              </div>

              {/* Waiting List */}
              <Card>
                <CardHeader>
                  <CardTitle>قائمة الانتظار</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {waitingPatients.map((patient, index) => (
                      <div key={patient.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="font-bold text-primary">{patient.number}</span>
                          </div>
                          <div>
                            <p className="font-semibold text-card-foreground">{patient.name}</p>
                            <p className="text-sm text-muted-foreground">{patient.service}</p>
                          </div>
                        </div>
                        <div className="text-left">
                          <p className="text-sm text-muted-foreground">المرتبة {index + 1}</p>
                          <p className="text-sm text-muted-foreground">{patient.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {selectedTab === "services" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>إدارة الخدمات</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center py-8">
                    قريباً - صفحة إدارة الخدمات
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {selectedTab === "settings" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>إعدادات المركز</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center py-8">
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