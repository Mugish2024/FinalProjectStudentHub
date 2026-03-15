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
import DeanDashboard from './pages/DeanDashboard';
import DeanAttendance from './pages/DeanAttendance';
import Login from './pages/Login';

type AuthProfile = {
  fullName: string;
  studentNumber: string;
  faculty: string;
  department: string;
  program: string;
  credits: number;
  role: 'student' | 'staff' | 'dean' | 'admin';
  gpa: string;
  semester: number;
  disciplineStatus: string;
};

type UserRole = 'student' | 'staff' | 'dean' | 'admin' | null;

const DEAN_PAGES = new Set(['labour-mgmt', 'groups', 'courses', 'dashboard-tools', 'exam', 'attendance-review']);

function App() {
  const [activePage, setActivePage] = useState('landing');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);

  const isStaffRole = (role: UserRole) => role === 'staff' || role === 'dean' || role === 'admin';

  const navigateWithAuth = (page: string) => {
    if (!isLoggedIn && page !== 'landing') {
      setActivePage('login');
      return;
    }

    if (DEAN_PAGES.has(page) && !isStaffRole(userRole)) {
      setActivePage('dashboard');
      return;
    }

    if (page === 'registration' && !isStaffRole(userRole)) {
      setActivePage('dashboard');
      return;
    }

    setActivePage(page);
  };

  const renderContent = () => {
    switch (activePage) {
      case 'dashboard':
        return (
          <StudentDashboard
            navigateTo={navigateWithAuth}
            fullName={profile?.fullName ?? 'Student User'}
            studentNumber={profile?.studentNumber ?? '26701'}
            faculty={profile?.faculty ?? 'Information Technology'}
            department={profile?.department ?? 'Software Engineering'}
            program={profile?.program ?? 'Day'}
            credits={profile?.credits ?? 0}
          />
        );
      case 'labour':
        return (
          <StudentLabour
            studentNumber={profile?.studentNumber ?? ''}
            gpa={profile?.gpa ?? '0.00'}
            semester={profile?.semester ?? 0}
            disciplineStatus={profile?.disciplineStatus ?? ''}
          />
        );
      case 'labour-mgmt':
        return <DeanLabourManagement />;
      case 'groups':
        return <PlaceholderPage title="Groups & Sizes" />;
      case 'courses':
        return <PlaceholderPage title="Courses" />;
      case 'dashboard-tools':
        return <DeanDashboard />;
      case 'attendance-review':
        return <DeanAttendance />;
      case 'exam':
        return <PlaceholderPage title="Exam Officer" />;
      case 'elections':
        return <Elections />;
      case 'registration':
        return <RegistrationVerification />;
      case 'attendance':
        return <Attendance studentNumber={profile?.studentNumber ?? ''} />;
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
      onLogin={(loginProfile) => {
        setIsLoggedIn(true);
        setProfile(loginProfile);
        setUserRole(loginProfile.role);
        if (isStaffRole(loginProfile.role)) {
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
    setProfile(null);
    setActivePage('landing');
  };

  const isStaff = isStaffRole(userRole);
  const headerTitle = isStaff ? 'Dean Portal' : 'Student Portal';
  const profileName = profile?.fullName ?? (isStaff ? 'Dean User' : 'Student User');
  const profileId = profile?.studentNumber ?? (isStaff ? 'STAFF-01' : '26701');

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
