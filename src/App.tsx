import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import PatientLogin from "./pages/patient/PatientLogin";
import PatientDashboard from "./pages/patient/PatientDashboard";
import CenterDetails from "./pages/patient/CenterDetails";
import QueueTracking from "./pages/patient/QueueTracking";
import BookingForm from "./pages/patient/BookingForm";
import ClinicDashboard from "./pages/clinic/ClinicDashboard";
import ClinicAuthSimple from "./pages/clinic/ClinicAuthSimple";
import ClinicLogin from "./pages/clinic/ClinicLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import SetAdmin from "./pages/SetAdmin";
import AdminDirect from "./pages/AdminDirect";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/patient/login" element={<PatientLogin />} />
          <Route path="/patient/dashboard" element={<PatientDashboard />} />
          <Route path="/patient/center/:id" element={<CenterDetails />} />
          <Route path="/patient/booking/:centerId/:serviceId" element={<BookingForm />} />
          <Route path="/patient/queue/:bookingId" element={<QueueTracking />} />
          <Route path="/clinic/login" element={<ClinicLogin />} />
          <Route path="/clinic/auth" element={<ClinicAuthSimple />} />
          <Route path="/clinic/dashboard" element={<ClinicDashboard />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin-direct" element={<AdminDirect />} />
          <Route path="/set-admin" element={<SetAdmin />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;