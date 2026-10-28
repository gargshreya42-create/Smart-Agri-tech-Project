import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute, { homeFor } from './components/ProtectedRoute';
import { Spinner } from './components/feedback';
import { useAuth } from './context/AuthContext';

// Route-level code splitting: each page is downloaded only when first visited.
const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Farms = lazy(() => import('./pages/Farms'));
const Crops = lazy(() => import('./pages/Crops'));
const CropDetail = lazy(() => import('./pages/CropDetail'));
const Soil = lazy(() => import('./pages/Soil'));
const Weather = lazy(() => import('./pages/Weather'));
const Pests = lazy(() => import('./pages/Pests'));
const Resources = lazy(() => import('./pages/Resources'));
const Orders = lazy(() => import('./pages/Orders'));
const OrderDetail = lazy(() => import('./pages/OrderDetail'));
const Experts = lazy(() => import('./pages/Experts'));
const Community = lazy(() => import('./pages/Community'));
const PostDetail = lazy(() => import('./pages/PostDetail'));
const Profile = lazy(() => import('./pages/Profile'));
const Credits = lazy(() => import('./pages/Credits'));
const NotFound = lazy(() => import('./pages/NotFound'));

const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminFarms = lazy(() => import('./pages/admin/AdminFarms'));
const AdminCrops = lazy(() => import('./pages/admin/AdminCrops'));
const AdminResources = lazy(() => import('./pages/admin/AdminResources'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminWeather = lazy(() => import('./pages/admin/AdminWeather'));
const AdminPests = lazy(() => import('./pages/admin/AdminPests'));
const AdminExperts = lazy(() => import('./pages/admin/AdminExperts'));
const AdminCommunity = lazy(() => import('./pages/admin/AdminCommunity'));
const AdminReports = lazy(() => import('./pages/admin/AdminReports'));

// Signed-in users skip the login / register screens.
function GuestOnly({ children }) {
  const { user, booting } = useAuth();
  if (booting) return <Spinner className="min-vh-100" />;
  return user ? <Navigate to={homeFor(user)} replace /> : children;
}

export default function App() {
  return (
    <Suspense fallback={<Spinner className="min-vh-100" />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/credits" element={<Credits />} />
        </Route>
        <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
        <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />

        <Route element={<ProtectedRoute role="farmer" />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/farm" element={<Farms />} />
            <Route path="/crops" element={<Crops />} />
            <Route path="/crops/:id" element={<CropDetail />} />
            <Route path="/soil" element={<Soil />} />
            <Route path="/weather" element={<Weather />} />
            <Route path="/pests" element={<Pests />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/:id" element={<OrderDetail />} />
            <Route path="/experts" element={<Experts />} />
            <Route path="/community" element={<Community />} />
            <Route path="/community/:id" element={<PostDetail />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute role="admin" />}>
          <Route element={<DashboardLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/farms" element={<AdminFarms />} />
            <Route path="/admin/crops" element={<AdminCrops />} />
            <Route path="/admin/resources" element={<AdminResources />} />
            <Route path="/admin/orders" element={<AdminOrders />} />
            <Route path="/admin/weather" element={<AdminWeather />} />
            <Route path="/admin/pests" element={<AdminPests />} />
            <Route path="/admin/experts" element={<AdminExperts />} />
            <Route path="/admin/community" element={<AdminCommunity />} />
            <Route path="/admin/community/:id" element={<PostDetail />} />
            <Route path="/admin/reports" element={<AdminReports />} />
            <Route path="/admin/settings" element={<Profile adminView />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
