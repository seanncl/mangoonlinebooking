import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { BookingProvider } from "@/context/BookingContext";
import { AuthProvider } from "@/context/AuthContext";
import LocationSelection from "./pages/LocationSelection";
import BookingFlowSelection from "./pages/BookingFlowSelection";
import ServiceSelection from "./pages/ServiceSelection";
import StaffSelection from "./pages/StaffSelection";
import StaffAssignment from "./pages/StaffAssignment";
import TimeSelection from "./pages/TimeSelection";
import ClientInfo from "./pages/ClientInfo";
import PhoneVerification from "./pages/PhoneVerification";
import Confirmation from "./pages/Confirmation";
import BookingSuccess from "./pages/BookingSuccess";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <BookingProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LocationSelection />} />
              <Route path="/booking-flow" element={<BookingFlowSelection />} />
              <Route path="/services" element={<ServiceSelection />} />
              <Route path="/staff" element={<StaffSelection />} />
              <Route path="/staff-assignment" element={<StaffAssignment />} />
              <Route path="/time" element={<TimeSelection />} />
              <Route path="/info" element={<ClientInfo />} />
              <Route path="/verify" element={<PhoneVerification />} />
              <Route path="/confirm" element={<Confirmation />} />
              <Route path="/success" element={<BookingSuccess />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/profile" element={<Profile />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </BookingProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
