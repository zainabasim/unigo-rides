import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import NeedARide from "./pages/NeedARide";
import OfferARide from "./pages/OfferARide";
import MyRides from "./pages/MyRides";
import SearchingRides from "./pages/SearchingRides";
import RideConfirmed from "./pages/RideConfirmed";
import DriverDashboard from "./pages/DriverDashboard";
import RidePartner from "./pages/RidePartner";
import ManageRide from "./pages/ManageRide";
import Chat from "./pages/Chat";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();


const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/need-a-ride" element={<ProtectedRoute><NeedARide /></ProtectedRoute>} />
            <Route path="/offer-a-ride" element={<ProtectedRoute><OfferARide /></ProtectedRoute>} />
            <Route path="/searching-rides" element={<ProtectedRoute><SearchingRides /></ProtectedRoute>} />
            <Route path="/ride-confirmed/:bookingId" element={<ProtectedRoute><RideConfirmed /></ProtectedRoute>} />
            <Route path="/my-rides" element={<ProtectedRoute><MyRides /></ProtectedRoute>} />
            <Route path="/driver-dashboard" element={<ProtectedRoute><DriverDashboard /></ProtectedRoute>} />
            <Route path="/ride-partner/:bookingId" element={<ProtectedRoute><RidePartner /></ProtectedRoute>} />
            <Route path="/manage-ride/:rideId" element={<ProtectedRoute><ManageRide /></ProtectedRoute>} />
            <Route path="/chat/:rideId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
