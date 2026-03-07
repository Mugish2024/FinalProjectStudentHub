import { useState } from 'react';
import DashboardLayout from './layouts/DashboardLayout';
import RegistrationVerification from './pages/RegistrationVerification';
import Payments from './pages/Payments';
import Elections from './pages/Elections';
import Discipline from './pages/Discipline';
import Attendance from './pages/Attendance';
import Claims from './pages/Claims';
import Events from './pages/Events';
import PlaceholderPage from './components/PlaceholderPage';
import StudentDashboard from './pages/StudentDashboard';
import Landing from './pages/Landing';
import StudentLabour from './pages/StudentLabour';
import DeanLabourManagement from './pages/DeanLabourManagement';
import Login from './pages/Login';

type UserRole = 'student' | 'staff' | null;

const DEAN_PAGES = new Set(['labour-mgmt', 'groups', 'courses', 'dashboard-tools', 'exam']);

function App() {
  const [activePage, setActivePage] = useState('landing');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>(null);

  const navigateWithAuth = (page: string) => {
    if (!isLoggedIn && page !== 'landing') {
      setActivePage('login');
      return;
    }

    if (DEAN_PAGES.has(page) && userRole !== 'staff') {
      setActivePage('dashboard');
      return;
    }

    setActivePage(page);
  };

  const renderContent = () => {
    switch (activePage) {
      case 'dashboard':
        return <StudentDashboard navigateTo={navigateWithAuth} />;
      case 'labour':
        return <StudentLabour />;
      case 'labour-mgmt':
        return <DeanLabourManagement />;
      case 'groups':
        return <PlaceholderPage title="Groups & Sizes" />;
      case 'courses':
        return <PlaceholderPage title="Courses" />;
      case 'dashboard-tools':
        return <PlaceholderPage title="Dean Dashboard" />;
      case 'exam':
        return <PlaceholderPage title="Exam Officer" />;
      case 'elections':
        return <Elections />;
      case 'registration':
        return <RegistrationVerification />;
      case 'attendance':
        return <Attendance />;
      case 'payments':
        return <Payments />;
      case 'events':
        return <Events />;
      case 'claims':
        return <Claims />;
      case 'discipline':
        return <Discipline />;
      default:
        return <PlaceholderPage title="Page Not Found" />;
    }
  };

  // Standalone pages outside main layout
  if (activePage === 'landing') {
    return <Landing onEnter={() => setActivePage('login')} />;
  }

  if (activePage === 'login') {
    return <Login
      onLogin={(isStaff) => {
        setIsLoggedIn(true);
        setUserRole(isStaff ? 'staff' : 'student');
        if (isStaff) {
          setActivePage('labour-mgmt');
        } else {
          setActivePage('dashboard');
        }
      }}
      onBack={() => setActivePage('landing')}
    />;
  }

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserRole(null);
    setActivePage('landing');
  };

  const headerTitle = userRole === 'staff' ? 'Dean Portal' : 'Student Portal';
  const profileName = userRole === 'staff' ? 'Dean User' : 'Student User';
  const profileId = userRole === 'staff' ? 'STAFF-01' : '26701';

  return (
    <DashboardLayout
      activePage={activePage}
      setActivePage={navigateWithAuth}
      userRole={userRole}
      title={headerTitle}
      userName={profileName}
      userId={profileId}
      onLogout={handleLogout}
    >
      {renderContent()}
    </DashboardLayout>
  );
}

export default App;
