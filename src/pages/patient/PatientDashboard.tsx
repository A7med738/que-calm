import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Star, Users, Building2, Plus, User, Calendar, Heart, Clock, X, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useBookings } from "@/hooks/useBookings";
import { useMedicalCenters } from "@/hooks/useMedicalCenters";
import { useToast } from "@/hooks/use-toast";

const PatientDashboard = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [favoriteCenters, setFavoriteCenters] = useState<number[]>([]);
  const { user, signOut, loading: authLoading } = useAuth();
  const { profile, familyMembers, loading: profileLoading } = useProfile();
  const { bookings, loading: bookingsLoading, cancelBooking } = useBookings();
  const { centers, loading: centersLoading, search } = useMedicalCenters();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if not logged in
  useEffect(() => {
    if (!user && !authLoading) {
      navigate("/patient/login");
    }
  }, [user, authLoading, navigate]);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "خطأ في تسجيل الخروج",
        description: error.message,
        variant: "destructive",
      });
    } else {
      navigate("/patient/login");
    }
  };
  
  const toggleFavorite = (centerId: number) => {
    setFavoriteCenters(prev => {
      if (prev.includes(centerId)) {
        toast({
          title: "تم إزالة المركز من المفضلة",
          description: "تم حذف المركز من قائمة المفضلة",
        });
        return prev.filter(id => id !== centerId);
      } else {
        toast({
          title: "تم إضافة المركز للمفضلة",
          description: "تم حفظ المركز في قائمة المفضلة",
        });
        return [...prev, centerId];
      }
    });
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      await cancelBooking(bookingId);
      toast({
        title: "تم إلغاء الحجز",
        description: "تم إلغاء حجزك بنجاح",
      });
    } catch (error) {
      toast({
        title: "خطأ في إلغاء الحجز",
        description: "حدث خطأ أثناء إلغاء الحجز، حاول مرة أخرى",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'no_show':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'في الانتظار';
      case 'confirmed':
        return 'مؤكد';
      case 'in_progress':
        return 'قيد التنفيذ';
      case 'completed':
        return 'مكتمل';
      case 'cancelled':
        return 'ملغي';
      case 'no_show':
        return 'لم يحضر';
      default:
        return status;
    }
  };
  
  // Handle search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      search(searchQuery);
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchQuery, search]);

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-l from-primary/5 to-accent/5 border-b">
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">

          {/* Search Bar */}
          <div className="relative max-w-2xl">
            <Search className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="ابحث عن مركز طبي، تخصص، أو طبيب..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 sm:pr-12 py-4 sm:py-6 text-base sm:text-lg rounded-xl border-2 focus:border-primary"
            />
          </div>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === "dashboard" && (
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Family Members Section */}
        {familyMembers.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                أفراد العائلة
              </CardTitle>
              <CardDescription>
                يمكنك الحجز لأي من أفراد عائلتك
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {familyMembers.map((member) => (
                  <Badge key={member.id} variant="secondary" className="gap-1">
                    <Users className="h-3 w-3" />
                    {member.full_name} {member.relationship && `(${member.relationship})`}
                  </Badge>
                ))}
                <Button variant="outline" size="sm" className="gap-1">
                  <Plus className="h-3 w-3" />
                  إضافة فرد جديد
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

          <div className="mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-2">المراكز الطبية المتاحة</h2>
            <p className="text-sm sm:text-base text-muted-foreground">اختر المركز المناسب واحجز دورك</p>
        </div>

          {centersLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">جاري تحميل المراكز الطبية...</p>
            </div>
          ) : centers.length > 0 ? (
            <div className="space-y-4 sm:space-y-6">
              {centers.map((center) => (
            <Card key={center.id} className="hover:shadow-lg transition-all duration-300 cursor-pointer relative">
              {/* Heart Button - Top Left */}
              <button
                onClick={() => toggleFavorite(center.id)}
                className="absolute top-3 left-3 p-1 hover:bg-muted rounded-full transition-colors z-10"
              >
                <Heart 
                  className={`h-4 w-4 ${
                    favoriteCenters.includes(center.id) 
                      ? "fill-red-500 text-red-500" 
                      : "text-muted-foreground hover:text-red-500"
                  }`} 
                />
              </button>
              
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                  {/* Center Image */}
                  <div className="flex-shrink-0 mx-auto sm:mx-0">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-muted rounded-xl flex items-center justify-center">
                      <Building2 className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
                    </div>
                  </div>

                  {/* Center Info */}
                  <div className="flex-1 text-center sm:text-right">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between mb-3 gap-2">
                  <div className="flex-1">
                        <h3 className="text-lg sm:text-xl font-semibold text-card-foreground mb-1">
                          {center.name}
                        </h3>
                        <p className="text-primary font-medium mb-2">{center.specialty}</p>
                        <div className="flex items-center justify-center sm:justify-start gap-2 text-xs sm:text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>{center.address}</span>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-800">
                        مفتوح
                      </Badge>
                    </div>

                      <div className="flex flex-col sm:flex-row items-center sm:items-center gap-3 sm:gap-6 mb-4">
                      <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs sm:text-sm font-medium">{center.average_rating || center.rating}</span>
                      </div>
                      
                        <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
                          <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>{center.doctor_count} طبيب</span>
                      </div>
                    </div>

                    <Link to={`/patient/center/${center.id}`}>
                        <Button className="bg-accent hover:bg-accent/90 text-accent-foreground w-full sm:w-auto text-sm">
                        عرض التفاصيل واحجز دورك
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

          ) : (
          <div className="text-center py-12">
            <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">لا توجد مراكز طبية</h3>
              <p className="text-muted-foreground">لم يتم العثور على مراكز طبية متاحة</p>
            </div>
          )}
        </div>
      )}

      {/* Profile Tab Content */}
      {activeTab === "profile" && (
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {/* Profile Header */}
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {profile?.full_name || "عزيزي المستخدم"}
            </h1>
            <p className="text-muted-foreground">عضو منذ {new Date().getFullYear()}</p>
          </div>

          {/* Profile Information */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  المعلومات الشخصية
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">الاسم الكامل</label>
                    <p className="text-foreground font-medium">{profile?.full_name || "غير محدد"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">البريد الإلكتروني</label>
                    <p className="text-foreground font-medium">{user?.email || "غير محدد"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">رقم الهاتف</label>
                    <p className="text-foreground font-medium">{profile?.phone || "غير محدد"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">تاريخ الميلاد</label>
                    <p className="text-foreground font-medium">{profile?.birth_date || "غير محدد"}</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full sm:w-auto">
                  تعديل المعلومات
                </Button>
              </CardContent>
            </Card>

            {/* Family Members */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  أفراد العائلة
                </CardTitle>
                <CardDescription>
                  إدارة أفراد العائلة المسجلين في حسابك
                </CardDescription>
              </CardHeader>
              <CardContent>
                {familyMembers.length > 0 ? (
                  <div className="space-y-3">
                    {familyMembers.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{member.full_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {member.relationship || "فرد من العائلة"}
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          تعديل
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground mb-4">لم تقم بإضافة أفراد العائلة بعد</p>
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      إضافة فرد جديد
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Account Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  إعدادات الحساب
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <User className="h-4 w-4" />
                    تغيير كلمة المرور
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Calendar className="h-4 w-4" />
                    إعدادات الإشعارات
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2 text-destructive hover:text-destructive">
                    <User className="h-4 w-4" />
                    حذف الحساب
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Sign Out */}
            <Card>
              <CardContent className="pt-6">
                <Button 
                  variant="destructive" 
                  className="w-full gap-2"
                  onClick={handleSignOut}
                >
                  <User className="h-4 w-4" />
                  تسجيل الخروج
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Favorites Tab Content */}
      {activeTab === "favorites" && (
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">المراكز المفضلة</h2>
            <p className="text-muted-foreground">المراكز الطبية التي قمت بحفظها</p>
          </div>

                 {favoriteCenters.length > 0 ? (
                   <div className="space-y-4 sm:space-y-6">
                     {centers
                       .filter(center => favoriteCenters.includes(center.id))
                       .map((center) => (
                  <Card key={center.id} className="hover:shadow-lg transition-all duration-300 relative">
                    {/* Heart Button - Top Left */}
                    <button
                      onClick={() => toggleFavorite(center.id)}
                      className="absolute top-3 left-3 p-1 hover:bg-muted rounded-full transition-colors z-10"
                    >
                      <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                    </button>
                    
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                        {/* Center Image */}
                        <div className="flex-shrink-0 mx-auto sm:mx-0">
                          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-muted rounded-xl flex items-center justify-center">
                            <Building2 className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
                          </div>
                        </div>

                        {/* Center Info */}
                        <div className="flex-1 text-center sm:text-right">
                          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between mb-3 gap-2">
                            <div className="flex-1">
                              <h3 className="text-lg sm:text-xl font-semibold text-card-foreground mb-1">
                                {center.name}
                              </h3>
                              <p className="text-primary font-medium mb-2">{center.specialty}</p>
                              <div className="flex items-center justify-center sm:justify-start gap-2 text-xs sm:text-sm text-muted-foreground">
                                <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span>{center.address}</span>
                              </div>
                            </div>
                            <Badge className="bg-green-100 text-green-800">
                              مفتوح
                            </Badge>
                          </div>

                          <div className="flex flex-col sm:flex-row items-center sm:items-center gap-3 sm:gap-6 mb-4">
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-xs sm:text-sm font-medium">{center.average_rating || center.rating}</span>
                            </div>

                            <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
                              <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span>{center.doctor_count} طبيب</span>
                            </div>
                          </div>

                          <Link to={`/patient/center/${center.id}`}>
                            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground w-full sm:w-auto text-sm">
                              عرض التفاصيل واحجز دورك
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">لا توجد مراكز مفضلة</h3>
              <p className="text-muted-foreground mb-6">لم تقم بحفظ أي مراكز طبية في المفضلة بعد</p>
              <Button 
                onClick={() => setActiveTab("dashboard")}
                className="gap-2"
              >
                <Building2 className="h-4 w-4" />
                تصفح المراكز
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Bookings Tab Content */}
      {activeTab === "bookings" && (
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">حجوزاتي</h2>
            <p className="text-muted-foreground">جميع حجوزاتك الطبية</p>
          </div>

          {bookingsLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">جاري تحميل الحجوزات...</p>
            </div>
          ) : bookings.length > 0 ? (
            <div className="space-y-4 sm:space-y-6">
              {bookings.map((booking) => (
                <Card key={booking.id} className="hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row items-start justify-between mb-4 gap-3">
                          <div className="flex-1">
                            <h3 className="text-lg sm:text-xl font-semibold text-card-foreground mb-2">
                              {booking.medical_center_name}
                            </h3>
                            <div className="space-y-2 text-sm sm:text-base text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>{new Date(booking.booking_date).toLocaleDateString('ar-EG')} - {booking.booking_time}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4" />
                                <span>{booking.service_name}</span>
                                <span className="text-primary font-medium">{booking.service_price} جنيه</span>
                              </div>
                              {booking.doctor_name && (
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4" />
                                  <span>{booking.doctor_name}</span>
                                </div>
                              )}
                              {booking.family_member_name && (
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4" />
                                  <span>لـ {booking.family_member_name}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                <span>{booking.medical_center_address}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                <span>رقم الدور: {booking.queue_number}</span>
                                {booking.waiting_count !== null && booking.waiting_count > 0 && (
                                  <span className="text-orange-600">({booking.waiting_count} منتظرين)</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge className={getStatusColor(booking.status)}>
                              {getStatusText(booking.status)}
                            </Badge>
                            {booking.queue_status === 'called' && (
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                تم الاستدعاء
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                          {booking.status === 'pending' || booking.status === 'confirmed' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelBooking(booking.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="h-4 w-4 mr-2" />
                              إلغاء الحجز
                            </Button>
                          ) : null}
                          
                          {booking.status === 'confirmed' && booking.qr_code && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/patient/queue/${booking.id}`)}
                            >
                              <Calendar className="h-4 w-4 mr-2" />
                              متابعة الطابور
                            </Button>
                          )}
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/patient/center/${booking.medical_center_id}`)}
                          >
                            <Building2 className="h-4 w-4 mr-2" />
                            عرض المركز
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">لا توجد حجوزات</h3>
              <p className="text-muted-foreground mb-6">لم تقم بحجز أي مواعيد طبية بعد</p>
              <Button
                onClick={() => setActiveTab("dashboard")}
                className="gap-2"
              >
                <Building2 className="h-4 w-4" />
                تصفح المراكز الطبية
              </Button>
          </div>
        )}
      </div>
      )}

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
        <div className="flex items-center justify-around py-2">
          <button
            onClick={() => setActiveTab("dashboard")}
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
            onClick={() => setActiveTab("favorites")}
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
            onClick={() => setActiveTab("bookings")}
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
            onClick={() => setActiveTab("profile")}
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

      {/* Add bottom padding to prevent content from being hidden behind the bottom nav */}
      <div className="h-20"></div>
    </div>
  );
};

export default PatientDashboard;