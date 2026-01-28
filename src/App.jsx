import { useState } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";

import Login from "./components/Login";
import Navbar from "./components/Navbar";
import Assessment from "./pages/Assessment";
import Scoreboard from "./pages/Scoreboard";
import AdminReports from "./pages/AdminReports";
import CycleManagement from "./pages/CycleManagement";
import EmployeeDetails from "./pages/EmployeeDetails";
import Disclaimer from "./pages/Disclaimer";

function App() {
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState("user");
  const [acceptedDisclaimer, setAcceptedDisclaimer] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // Keep navbar “activeTab” in sync with URL
  const activeTab = location.pathname.startsWith("/scores")
    ? "scores"
    : location.pathname.startsWith("/reports")
      ? "reports"
      : location.pathname.startsWith("/cycles")
        ? "cycles"
        : "assessment"; // includes /assessment and /disclaimer

  if (!session) {
    return (
      <Login
        onLogin={(user) => {
          setSession(user);
          setUserRole(user.app_role);
          setAcceptedDisclaimer(false);
          navigate("/disclaimer", { replace: true });
        }}
      />
    );
  }

  const setActiveTabFn = (tab) => {
    if (tab === "assessment") {
      // if they haven't accepted yet, keep them at disclaimer
      navigate(acceptedDisclaimer ? "/assessment" : "/disclaimer");
    }
    if (tab === "scores") navigate("/scores");
    if (tab === "reports") navigate("/reports");
    if (tab === "cycles") navigate("/cycles");
  };

  return (
    <div className="app-container">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTabFn}
        isAdmin={userRole === "admin"}
      />

      <div className="content">
        <Routes>
          <Route path="/employee/:id" element={<EmployeeDetails />} />

          {/* Default route goes to disclaimer first */}
          <Route path="/" element={<Navigate to="/disclaimer" replace />} />

          <Route
            path="/disclaimer"
            element={
              <Disclaimer
                user={session}
                onStart={() => {
                  setAcceptedDisclaimer(true);
                  navigate("/assessment", { replace: true });
                }}
              />
            }
          />

          <Route
            path="/assessment"
            element={
              acceptedDisclaimer ? (
                <Assessment reviewer={session} />
              ) : (
                <Navigate to="/disclaimer" replace />
              )
            }
          />

          <Route path="/scores" element={<Scoreboard />} />

          <Route
            path="/reports"
            element={
              userRole === "admin" ? (
                <AdminReports />
              ) : (
                <Navigate to="/assessment" replace />
              )
            }
          />

          <Route
            path="/cycles"
            element={
              userRole === "admin" ? (
                <CycleManagement />
              ) : (
                <Navigate to="/assessment" replace />
              )
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/disclaimer" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
