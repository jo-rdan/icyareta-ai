import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/useAuth";
import { QuizProvider } from "./context/QuizContext";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import SubjectSelect from "./pages/SubjectSelect";
import Quiz from "./pages/Quiz";
import Score from "./pages/Score";
import Pricing from "./pages/Pricing";
import Dashboard from "./pages/Dashboard";

/**
 * Guards /app/* routes.
 * Unauthenticated users are redirected to /auth.
 * Uses Outlet so this works as a layout route in React Router 7.
 */
function ProtectedRoute() {
  const { user } = useAuth();
  return user ? <Outlet /> : <Navigate to="/auth" replace />;
}

/**
 * Smart root redirect:
 * - Logged-in users  → /app/subjects
 * - Guests           → /landing
 */
function RootRedirect() {
  const { user } = useAuth();
  return <Navigate to={user ? "/app/subjects" : "/landing"} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Root → smart redirect */}
      <Route path="/" element={<RootRedirect />} />

      {/* Public pages */}
      <Route path="/landing" element={<Landing />} />
      <Route path="/auth" element={<Auth />} />

      {/* Protected app — all under /app */}
      <Route path="/app" element={<ProtectedRoute />}>
        <Route path="subjects" element={<SubjectSelect />} />
        <Route path="quiz" element={<Quiz />} />
        <Route path="score" element={<Score />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="pricing" element={<Pricing />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <QuizProvider>
          <AppRoutes />
        </QuizProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
