import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Building2, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  ToggleLeft, 
  ToggleRight,
  ArrowRight,
  Users,
  Star,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Clock
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useAdminCenters, MedicalCenterForm } from "@/hooks/useAdminCenters";
import { useToast } from "@/hooks/use-toast";

const AdminDashboard = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCenter, setEditingCenter] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newCenter, setNewCenter] = useState<MedicalCenterForm>({
    name: "",
    specialty: "",
    address: "",
    phone: "",
    email: "",
    hours: "",
    description: "",
    admin_email: "",
    admin_password: ""
  });

  const { user, signOut, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const { 
    centers, 
    loading: centersLoading, 
    createMedicalCenter, 
    updateMedicalCenter, 
    deleteMedicalCenter, 
    toggleCenterStatus 
  } = useAdminCenters();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if not admin - but give more time for user to load
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!roleLoading && user && !isAdmin()) {
        console.log('User is not admin, redirecting to home');
        navigate("/");
      }
    }, 2000); // Wait 2 seconds

    return () => clearTimeout(timer);
  }, [roleLoading, user, isAdmin, navigate]);

  // Add a delay to prevent premature redirect
  useEffect(() => {
    if (!user && !authLoading) {
      console.log('No user found, redirecting to home');
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  const handleSignOut = async () => {
    try {
      const { error } = await signOut();
      if (error) {
        console.warn('Sign out error (but continuing):', error);
      }
      // Always redirect even if there's an error
      navigate("/");
    } catch (error) {
      console.error("Unexpected error signing out:", error);
      // Still redirect even if there's an unexpected error
      navigate("/");
    }
  };

  const handleCreateCenter = async () => {
    try {
      const result = await createMedicalCenter(newCenter);
      
      toast({
        title: "تم إنشاء المركز بنجاح",
        description: `تم إنشاء المركز الطبي "${newCenter.name}" بنجاح. الرقم التسلسلي: ${result.serial_number}. يرجى تسجيل الدخول كمدير باستخدام: ${result.admin_email}`,
      });

      // Reset form
      setNewCenter({
        name: "",
        specialty: "",
        address: "",
        phone: "",
        email: "",
        hours: "",
        description: "",
        admin_email: "",
        admin_password: ""
      });
      setIsAddDialogOpen(false);
    } catch (error) {
      toast({
        title: "خطأ في إنشاء المركز",
        description: "حدث خطأ أثناء إنشاء المركز الطبي",
        variant: "destructive",
      });
    }
  };

  const handleEditCenter = async () => {
    if (!editingCenter) return;

    try {
      await updateMedicalCenter(editingCenter.id, {
        name: editingCenter.name,
        specialty: editingCenter.specialty,
        address: editingCenter.address,
        phone: editingCenter.phone,
        email: editingCenter.email,
        hours: editingCenter.hours,
        description: editingCenter.description
      });

      toast({
        title: "تم تحديث المركز بنجاح",
        description: "تم تحديث بيانات المركز الطبي بنجاح",
      });

      setEditingCenter(null);
      setIsEditDialogOpen(false);
    } catch (error) {
      toast({
        title: "خطأ في تحديث المركز",
        description: "حدث خطأ أثناء تحديث المركز الطبي",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCenter = async (centerId: string, centerName: string) => {
    try {
      await deleteMedicalCenter(centerId);
      toast({
        title: "تم حذف المركز بنجاح",
        description: `تم حذف المركز الطبي "${centerName}" نهائياً`,
      });
    } catch (error) {
      toast({
        title: "خطأ في حذف المركز",
        description: "حدث خطأ أثناء حذف المركز الطبي",
        variant: "destructive",
      });
    }
  };

  const handleToggleStatus = async (centerId: string, currentStatus: string, centerName: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await toggleCenterStatus(centerId, newStatus as 'active' | 'inactive');
      
      toast({
        title: "تم تغيير حالة المركز",
        description: `تم ${newStatus === 'active' ? 'تفعيل' : 'إلغاء تفعيل'} المركز "${centerName}"`,
      });
    } catch (error) {
      toast({
        title: "خطأ في تغيير الحالة",
        description: "حدث خطأ أثناء تغيير حالة المركز",
        variant: "destructive",
      });
    }
  };

  const filteredCenters = centers.filter(center =>
    center.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    center.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
    center.serial_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading || roleLoading || centersLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // Don't render content if not admin or not logged in
  // But give special treatment to the specific admin user
  if (!user) {
    return null;
  }
  
  // Special case for the specific admin user
  if (user.id === '130f849a-d894-4ce6-a78e-0df3812093de') {
    // console.log('Special admin user detected, allowing access');
  } else if (!isAdmin()) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-l from-primary/5 to-accent/5 border-b">
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">لوحة تحكم الإدارة</h1>
              <p className="text-muted-foreground">إدارة المراكز الطبية والمستخدمين</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">مرحباً، {user?.email}</span>
              <Button variant="outline" onClick={handleSignOut}>
                تسجيل الخروج
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Search and Add Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="ابحث عن مركز طبي..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                إضافة مركز طبي
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>إضافة مركز طبي جديد</DialogTitle>
                <DialogDescription>
                  أدخل بيانات المركز الطبي الجديد وسيتم توليد رقم تسلسلي تلقائياً
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">اسم المركز الطبي *</Label>
                  <Input
                    id="name"
                    value={newCenter.name}
                    onChange={(e) => setNewCenter({...newCenter, name: e.target.value})}
                    placeholder="أدخل اسم المركز"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="specialty">التخصص *</Label>
                  <Input
                    id="specialty"
                    value={newCenter.specialty}
                    onChange={(e) => setNewCenter({...newCenter, specialty: e.target.value})}
                    placeholder="أدخل التخصص"
                  />
                </div>
                
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="address">العنوان *</Label>
                  <Input
                    id="address"
                    value={newCenter.address}
                    onChange={(e) => setNewCenter({...newCenter, address: e.target.value})}
                    placeholder="أدخل العنوان"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">رقم الهاتف *</Label>
                  <Input
                    id="phone"
                    value={newCenter.phone}
                    onChange={(e) => setNewCenter({...newCenter, phone: e.target.value})}
                    placeholder="02-xxxx-xxxx"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newCenter.email}
                    onChange={(e) => setNewCenter({...newCenter, email: e.target.value})}
                    placeholder="center@example.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="hours">ساعات العمل *</Label>
                  <Input
                    id="hours"
                    value={newCenter.hours}
                    onChange={(e) => setNewCenter({...newCenter, hours: e.target.value})}
                    placeholder="الأحد - الخميس: 9:00 ص - 9:00 م"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="admin_email">بريد إداري المركز</Label>
                  <Input
                    id="admin_email"
                    type="email"
                    value={newCenter.admin_email}
                    onChange={(e) => setNewCenter({...newCenter, admin_email: e.target.value})}
                    placeholder="admin@center.com"
                  />
                </div>
                
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="description">الوصف</Label>
                  <Textarea
                    id="description"
                    value={newCenter.description}
                    onChange={(e) => setNewCenter({...newCenter, description: e.target.value})}
                    placeholder="أدخل وصف المركز الطبي"
                    rows={3}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button onClick={handleCreateCenter}>
                  إنشاء المركز
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Centers List */}
        <div className="space-y-4">
          {filteredCenters.map((center) => (
            <Card key={center.id} className="hover:shadow-lg transition-all duration-300">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row items-start justify-between mb-4 gap-3">
                      <div className="flex-1">
                        <h3 className="text-lg sm:text-xl font-semibold text-card-foreground mb-2">
                          {center.name}
                        </h3>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            <span>{center.specialty}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>{center.address}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            <span>{center.phone}</span>
                          </div>
                          {center.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              <span>{center.email}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>{center.hours}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>{center.doctor_count} طبيب</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{center.service_count} خدمة</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge className={center.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {center.status === 'active' ? 'نشط' : 'غير نشط'}
                        </Badge>
                        <Badge variant="outline">
                          {center.serial_number}
                        </Badge>
                        {center.average_rating && (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">{center.average_rating}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingCenter(center);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      تعديل
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(center.id, center.status, center.name)}
                    >
                      {center.status === 'active' ? (
                        <ToggleLeft className="h-4 w-4 mr-2" />
                      ) : (
                        <ToggleRight className="h-4 w-4 mr-2" />
                      )}
                      {center.status === 'active' ? 'إلغاء تفعيل' : 'تفعيل'}
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4 mr-2" />
                          حذف
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                          <AlertDialogDescription>
                            هل أنت متأكد من حذف المركز الطبي "{center.name}" نهائياً؟ لا يمكن التراجع عن هذا الإجراء.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>إلغاء</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteCenter(center.id, center.name)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            حذف نهائي
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredCenters.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">لا توجد مراكز طبية</h3>
            <p className="text-muted-foreground">
              {searchQuery ? 'لم يتم العثور على مراكز تطابق البحث' : 'لم يتم إنشاء أي مراكز طبية بعد'}
            </p>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تعديل المركز الطبي</DialogTitle>
            <DialogDescription>
              قم بتعديل بيانات المركز الطبي
            </DialogDescription>
          </DialogHeader>
          
          {editingCenter && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">اسم المركز الطبي *</Label>
                <Input
                  id="edit-name"
                  value={editingCenter.name}
                  onChange={(e) => setEditingCenter({...editingCenter, name: e.target.value})}
                  placeholder="أدخل اسم المركز"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-specialty">التخصص *</Label>
                <Input
                  id="edit-specialty"
                  value={editingCenter.specialty}
                  onChange={(e) => setEditingCenter({...editingCenter, specialty: e.target.value})}
                  placeholder="أدخل التخصص"
                />
              </div>
              
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="edit-address">العنوان *</Label>
                <Input
                  id="edit-address"
                  value={editingCenter.address}
                  onChange={(e) => setEditingCenter({...editingCenter, address: e.target.value})}
                  placeholder="أدخل العنوان"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-phone">رقم الهاتف *</Label>
                <Input
                  id="edit-phone"
                  value={editingCenter.phone}
                  onChange={(e) => setEditingCenter({...editingCenter, phone: e.target.value})}
                  placeholder="02-xxxx-xxxx"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-email">البريد الإلكتروني</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editingCenter.email}
                  onChange={(e) => setEditingCenter({...editingCenter, email: e.target.value})}
                  placeholder="center@example.com"
                />
              </div>
              
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="edit-hours">ساعات العمل *</Label>
                <Input
                  id="edit-hours"
                  value={editingCenter.hours}
                  onChange={(e) => setEditingCenter({...editingCenter, hours: e.target.value})}
                  placeholder="الأحد - الخميس: 9:00 ص - 9:00 م"
                />
              </div>
              
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="edit-description">الوصف</Label>
                <Textarea
                  id="edit-description"
                  value={editingCenter.description}
                  onChange={(e) => setEditingCenter({...editingCenter, description: e.target.value})}
                  placeholder="أدخل وصف المركز الطبي"
                  rows={3}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleEditCenter}>
              حفظ التغييرات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
