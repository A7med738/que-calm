import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
} from '@/components/ui/alert-dialog';
import { 
  Plus, 
  Edit, 
  Trash2, 
  ToggleLeft, 
  ToggleRight,
  Stethoscope,
  DollarSign,
  User
} from 'lucide-react';
import { useClinicServices, ServiceForm } from '@/hooks/useClinicServices';
import { useToast } from '@/hooks/use-toast';

interface ServicesManagementProps {
  medicalCenterId: string;
}

const ServicesManagement = ({ medicalCenterId }: ServicesManagementProps) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newService, setNewService] = useState<ServiceForm>({
    name: '',
    description: '',
    price: 0,
    doctor_name: '',
    doctor_specialty: ''
  });

  const { 
    services, 
    loading, 
    createService, 
    updateService, 
    deleteService, 
    toggleServiceStatus 
  } = useClinicServices(medicalCenterId);
  const { toast } = useToast();

  const handleCreateService = async () => {
    try {
      await createService(newService);
      
      toast({
        title: "تم إنشاء الخدمة بنجاح",
        description: `تم إنشاء خدمة "${newService.name}" بنجاح`,
      });

      // Reset form
      setNewService({
        name: '',
        description: '',
        price: 0,
        doctor_name: '',
        doctor_specialty: ''
      });
      setIsAddDialogOpen(false);
    } catch (error) {
      toast({
        title: "خطأ في إنشاء الخدمة",
        description: "حدث خطأ أثناء إنشاء الخدمة",
        variant: "destructive",
      });
    }
  };

  const handleEditService = async () => {
    if (!editingService) return;

    try {
      await updateService(editingService.id, {
        name: editingService.name,
        description: editingService.description,
        price: editingService.price,
        doctor_name: editingService.doctor_name,
        doctor_specialty: editingService.doctor_specialty
      });

      toast({
        title: "تم تحديث الخدمة بنجاح",
        description: "تم تحديث بيانات الخدمة بنجاح",
      });

      setEditingService(null);
      setIsEditDialogOpen(false);
    } catch (error) {
      toast({
        title: "خطأ في تحديث الخدمة",
        description: "حدث خطأ أثناء تحديث الخدمة",
        variant: "destructive",
      });
    }
  };

  const handleDeleteService = async (serviceId: string, serviceName: string) => {
    try {
      await deleteService(serviceId);
      toast({
        title: "تم حذف الخدمة بنجاح",
        description: `تم حذف خدمة "${serviceName}" نهائياً`,
      });
    } catch (error) {
      toast({
        title: "خطأ في حذف الخدمة",
        description: "حدث خطأ أثناء حذف الخدمة",
        variant: "destructive",
      });
    }
  };

  const handleToggleStatus = async (serviceId: string, currentStatus: boolean, serviceName: string) => {
    try {
      await toggleServiceStatus(serviceId, !currentStatus);
      
      toast({
        title: "تم تغيير حالة الخدمة",
        description: `تم ${!currentStatus ? 'تفعيل' : 'إلغاء تفعيل'} خدمة "${serviceName}"`,
      });
    } catch (error) {
      toast({
        title: "خطأ في تغيير الحالة",
        description: "حدث خطأ أثناء تغيير حالة الخدمة",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">جاري تحميل الخدمات...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">إدارة الخدمات</h2>
          <p className="text-muted-foreground">أدر خدمات مركزك الطبي</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              إضافة خدمة
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>إضافة خدمة جديدة</DialogTitle>
              <DialogDescription>
                أدخل تفاصيل الخدمة الجديدة
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">اسم الخدمة *</Label>
                <Input
                  id="name"
                  value={newService.name}
                  onChange={(e) => setNewService({...newService, name: e.target.value})}
                  placeholder="أدخل اسم الخدمة"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="price">السعر (جنيه) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={newService.price}
                  onChange={(e) => setNewService({...newService, price: Number(e.target.value)})}
                  placeholder="0"
                />
              </div>
              
              
              <div className="space-y-2">
                <Label htmlFor="doctor_name">اسم الطبيب *</Label>
                <Input
                  id="doctor_name"
                  value={newService.doctor_name}
                  onChange={(e) => setNewService({...newService, doctor_name: e.target.value})}
                  placeholder="أدخل اسم الطبيب"
                />
              </div>
              
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="doctor_specialty">تخصص الطبيب *</Label>
                <Input
                  id="doctor_specialty"
                  value={newService.doctor_specialty}
                  onChange={(e) => setNewService({...newService, doctor_specialty: e.target.value})}
                  placeholder="أدخل تخصص الطبيب"
                />
              </div>
              
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="description">وصف الخدمة</Label>
                <Textarea
                  id="description"
                  value={newService.description}
                  onChange={(e) => setNewService({...newService, description: e.target.value})}
                  placeholder="أدخل وصف الخدمة"
                  rows={3}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={handleCreateService}>
                إضافة الخدمة
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Services List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service) => (
          <Card key={service.id} className="hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{service.name}</CardTitle>
                  <Badge className={service.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {service.is_active ? 'نشط' : 'غير نشط'}
                  </Badge>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingService(service);
                      setIsEditDialogOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleStatus(service.id, service.is_active, service.name)}
                  >
                    {service.is_active ? (
                      <ToggleLeft className="h-4 w-4" />
                    ) : (
                      <ToggleRight className="h-4 w-4" />
                    )}
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                        <AlertDialogDescription>
                          هل أنت متأكد من حذف خدمة "{service.name}" نهائياً؟ لا يمكن التراجع عن هذا الإجراء.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteService(service.id, service.name)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          حذف نهائي
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>{service.doctor_name}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Stethoscope className="h-4 w-4" />
                <span>{service.doctor_specialty}</span>
              </div>
              
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span>{service.price} جنيه</span>
              </div>
              
              {service.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {service.description}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {services.length === 0 && (
        <div className="text-center py-12">
          <Stethoscope className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">لا توجد خدمات</h3>
          <p className="text-muted-foreground">
            ابدأ بإضافة خدمات مركزك الطبي
          </p>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تعديل الخدمة</DialogTitle>
            <DialogDescription>
              عدل تفاصيل الخدمة
            </DialogDescription>
          </DialogHeader>
          
          {editingService && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">اسم الخدمة *</Label>
                <Input
                  id="edit-name"
                  value={editingService.name}
                  onChange={(e) => setEditingService({...editingService, name: e.target.value})}
                  placeholder="أدخل اسم الخدمة"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-price">السعر (جنيه) *</Label>
                <Input
                  id="edit-price"
                  type="number"
                  value={editingService.price}
                  onChange={(e) => setEditingService({...editingService, price: Number(e.target.value)})}
                  placeholder="0"
                />
              </div>
              
              
              <div className="space-y-2">
                <Label htmlFor="edit-doctor_name">اسم الطبيب *</Label>
                <Input
                  id="edit-doctor_name"
                  value={editingService.doctor_name}
                  onChange={(e) => setEditingService({...editingService, doctor_name: e.target.value})}
                  placeholder="أدخل اسم الطبيب"
                />
              </div>
              
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="edit-doctor_specialty">تخصص الطبيب *</Label>
                <Input
                  id="edit-doctor_specialty"
                  value={editingService.doctor_specialty}
                  onChange={(e) => setEditingService({...editingService, doctor_specialty: e.target.value})}
                  placeholder="أدخل تخصص الطبيب"
                />
              </div>
              
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="edit-description">وصف الخدمة</Label>
                <Textarea
                  id="edit-description"
                  value={editingService.description}
                  onChange={(e) => setEditingService({...editingService, description: e.target.value})}
                  placeholder="أدخل وصف الخدمة"
                  rows={3}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleEditService}>
              حفظ التغييرات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ServicesManagement;
