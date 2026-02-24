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

function App() {
  const [activePage, setActivePage] = useState('landing');

  const renderContent = () => {
    switch (activePage) {
      case 'dashboard':
        return <StudentDashboard navigateTo={setActivePage} />;
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

  if (activePage === 'landing') {
    return <Landing onEnter={() => setActivePage('dashboard')} />;
  }

  return (
    <DashboardLayout activePage={activePage} setActivePage={setActivePage}>
      {renderContent()}
    </DashboardLayout>
  );
}

export default App;
