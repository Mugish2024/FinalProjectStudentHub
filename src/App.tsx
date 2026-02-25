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

function App() {
  const [activePage, setActivePage] = useState('landing');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Helper to change page with auth check
  const navigateWithAuth = (page: string) => {
    if (!isLoggedIn && page !== 'landing') {
      setActivePage('login');
    } else {
      setActivePage(page);
    }
  };

  const renderContent = () => {
    switch (activePage) {
      case 'dashboard':
        return <StudentDashboard navigateTo={navigateWithAuth} />;
      case 'labour':
        return <StudentLabour />;
      case 'labour-mgmt':
        return <DeanLabourManagement />;
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
    setActivePage('landing');
  };

  return (
    <DashboardLayout
      activePage={activePage}
      setActivePage={navigateWithAuth}
      onLogout={handleLogout}
    >
      {renderContent()}
    </DashboardLayout>
  );
}

export default App;
