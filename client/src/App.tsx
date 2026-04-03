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

function ProtectedRoute() {
  const { user } = useAuth();

  return user ? <Outlet /> : <Navigate to={"/auth"} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/subjects" element={<SubjectSelect />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/score" element={<Score />} />
      </Route>
      <Route path="/" element={<Landing />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/pricing" element={<Pricing />} />
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
