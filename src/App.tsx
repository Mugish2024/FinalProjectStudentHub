import { useState } from 'react';
import DashboardLayout from './layouts/DashboardLayout';
import RegistrationVerification from './pages/RegistrationVerification';
import Payments from './pages/Payments';
import PlaceholderPage from './components/PlaceholderPage';

import StudentDashboard from './pages/StudentDashboard';

function App() {
  const [activePage, setActivePage] = useState('dashboard');

  const renderContent = () => {
    switch (activePage) {
      case 'dashboard':
        return <StudentDashboard />;
      case 'registration':
        return <RegistrationVerification />;
      case 'attendance':
        return <PlaceholderPage title="Attendance Records" />;
      case 'payments':
        return <Payments />;
      case 'events':
        return <PlaceholderPage title="Events" />;
      case 'claims':
        return <PlaceholderPage title="Claims" />;
      case 'discipline':
        return <PlaceholderPage title="Discipline Record" />;
      default:
        return <PlaceholderPage title="Page Not Found" />;
    }
  };

  return (
    <DashboardLayout activePage={activePage} setActivePage={setActivePage}>
      {renderContent()}
    </DashboardLayout>
  );
}

export default App;
