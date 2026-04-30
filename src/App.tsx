import { useEffect, useState } from 'react';
import DashboardLayout from './layouts/DashboardLayout';
import RegistrationVerification from './pages/RegistrationVerification';
import Payments from './pages/Payments';
import Elections from './pages/Elections';
import Discipline from './pages/Discipline';
import Attendance from './pages/Attendance';
import AttendanceCheckIn from './pages/AttendanceCheckIn';
import Claims from './pages/Claims';
import Events from './pages/Events';
import PlaceholderPage from './components/PlaceholderPage';
import StudentDashboard from './pages/StudentDashboard';
import Landing from './pages/Landing';
import StudentLabour from './pages/StudentLabour';
import DeanLabourManagement from './pages/DeanLabourManagement';
import DeanDashboard from './pages/DeanDashboard';
import DeanAttendance from './pages/DeanAttendance';
import DeanStudentList from './pages/DeanStudentList';
import DeanCandidateReview from './pages/DeanCandidateReview';
import FinancePaymentReview from './pages/FinancePaymentReview';
import Login from './pages/Login';
import GuildInbox from './pages/GuildInbox';
import GuildDashboard from './pages/GuildDashboard';
import AdminDashboard from './pages/AdminDashboard';
import StudentIssues from './pages/StudentIssues';
import About from './pages/About';
import Services from './pages/Services';

type AuthProfile = {
  userId: number;
  studentId?: number | null;
  username: string;
  fullName: string;
  studentNumber: string;
  faculty: string;
  department: string;
  program: string;
  credits: number;
  role: 'student' | 'staff' | 'dean' | 'admin' | 'finance' | 'guild_president';
  gpa: string;
  semester: number;
  disciplineStatus: string;
};

type UserRole = 'student' | 'staff' | 'dean' | 'admin' | 'finance' | 'guild_president' | null;

const DEAN_PAGES = new Set(['labour-mgmt', 'groups', 'courses', 'dashboard-tools', 'exam', 'attendance-review', 'students', 'candidate-review']);
const ADMIN_PAGES = new Set(['admin-dashboard']);
const FINANCE_PAGES = new Set(['finance-review', 'finance-budgets', 'finance-expenses', 'finance-receipts', 'finance-reports']);
const GUILD_PAGES = new Set(['guild-dashboard', 'guild-inbox']);
const GUILD_EXTRA_ALLOWED_PAGES = new Set(['attendance-review']);

function App() {
  const [activePage, setActivePage] = useState('landing');
  const [selectedAttendanceSessionId, setSelectedAttendanceSessionId] = useState<number | undefined>(undefined);
  const [selectedAttendanceQrToken, setSelectedAttendanceQrToken] = useState<string>('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);

  const isDeanRole = (role: UserRole) => role === 'staff' || role === 'dean';
  const isAdminRole = (role: UserRole) => role === 'admin';
  const isFinanceRole = (role: UserRole) => role === 'finance';
  const isGuildRole = (role: UserRole) => role === 'guild_president';

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qrToken = params.get('attendanceQr') ?? '';
    const session = params.get('attendanceSession');
    if (!qrToken) return;

    setSelectedAttendanceQrToken(qrToken);
    if (session) {
      const parsed = Number(session);
      if (!Number.isNaN(parsed)) {
        setSelectedAttendanceSessionId(parsed);
      }
    }

    if (isLoggedIn) {
      setActivePage('attendance-checkin');
    } else {
      setActivePage('login');
    }

    window.history.replaceState({}, '', window.location.pathname);
  }, [isLoggedIn]);

  const navigateWithAuth = (page: string) => {
    if (!isLoggedIn && (page !== 'landing' && page !== 'about' && page !== 'services')) {
      setActivePage('login');
      return;
    }

    const canAccessDeanPages = isDeanRole(userRole) || (isGuildRole(userRole) && GUILD_EXTRA_ALLOWED_PAGES.has(page));
    if (DEAN_PAGES.has(page) && !canAccessDeanPages) {
      setActivePage('dashboard');
      return;
    }

    if (ADMIN_PAGES.has(page) && !isAdminRole(userRole)) {
      setActivePage('dashboard');
      return;
    }

    if (FINANCE_PAGES.has(page) && !(isFinanceRole(userRole) || isAdminRole(userRole))) {
      setActivePage('dashboard');
      return;
    }

    if (GUILD_PAGES.has(page) && !isGuildRole(userRole)) {
      setActivePage('dashboard');
      return;
    }

    if (page === 'registration' && !(isDeanRole(userRole) || isAdminRole(userRole))) {
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
      case 'students':
        return <DeanStudentList />;
      case 'candidate-review':
        return <DeanCandidateReview />;
      case 'finance-review':
        return <FinancePaymentReview initialTab="overview" currentUserRole={userRole} currentUserName={profile?.fullName ?? 'Finance User'} />;
      case 'finance-budgets':
        return <FinancePaymentReview initialTab="budget-control" currentUserRole={userRole} currentUserName={profile?.fullName ?? 'Finance User'} />;
      case 'finance-expenses':
        return <FinancePaymentReview initialTab="expenses" currentUserRole={userRole} currentUserName={profile?.fullName ?? 'Finance User'} />;
      case 'finance-receipts':
        return <FinancePaymentReview initialTab="receipts" currentUserRole={userRole} currentUserName={profile?.fullName ?? 'Finance User'} />;
      case 'finance-reports':
        return <FinancePaymentReview initialTab="statements" currentUserRole={userRole} currentUserName={profile?.fullName ?? 'Finance User'} />;
      case 'guild-inbox':
        return <GuildInbox userId={profile?.userId ?? 0} />;
      case 'guild-dashboard':
        return <GuildDashboard userId={profile?.userId ?? 0} onNavigate={navigateWithAuth} />;
      case 'admin-dashboard':
        return <AdminDashboard fullName={profile?.fullName ?? 'System Admin'} />;
      case 'student-issues':
        return <StudentIssues studentNumber={profile?.studentNumber ?? ''} />;
      case 'exam':
        return <PlaceholderPage title="Exam Officer" />;
      case 'elections':
        return <Elections studentNumber={profile?.studentNumber ?? ''} />;
      case 'registration':
        return <RegistrationVerification />;
      case 'attendance':
        return (
          <Attendance
            studentNumber={profile?.studentNumber ?? ''}
            onOpenCheckIn={(sessionId) => {
              setSelectedAttendanceSessionId(sessionId);
              navigateWithAuth('attendance-checkin');
            }}
          />
        );
      case 'attendance-checkin':
        return (
          <AttendanceCheckIn
            studentNumber={profile?.studentNumber ?? ''}
            initialSessionId={selectedAttendanceSessionId}
            initialQrToken={selectedAttendanceQrToken}
            onBack={() => navigateWithAuth('attendance')}
          />
        );
      case 'payments':
        return <Payments studentId={profile?.studentId ?? null} studentNumber={profile?.studentNumber ?? ''} />;
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
    return <Landing onEnter={() => setActivePage('login')} onNavigate={setActivePage} />;
  }

  if (activePage === 'about') {
    return <About onBack={() => setActivePage('landing')} />;
  }

  if (activePage === 'services') {
    return <Services onBack={() => setActivePage('landing')} />;
  }

  if (activePage === 'login') {
    return <Login
      onLogin={(loginProfile) => {
        setIsLoggedIn(true);
        setProfile(loginProfile);
        setUserRole(loginProfile.role);
        if (selectedAttendanceQrToken && loginProfile.role === 'student') {
          setActivePage('attendance-checkin');
          return;
        }
        if (isDeanRole(loginProfile.role)) {
          setActivePage('dashboard-tools');
        } else if (isAdminRole(loginProfile.role)) {
          setActivePage('admin-dashboard');
        } else if (isFinanceRole(loginProfile.role)) {
          setActivePage('finance-review');
        } else if (isGuildRole(loginProfile.role)) {
          setActivePage('guild-dashboard');
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

  const isStaff = isDeanRole(userRole);
  const isAdmin = isAdminRole(userRole);
  const isFinance = isFinanceRole(userRole);
  const isGuild = isGuildRole(userRole);
  const headerTitle = isAdmin
    ? 'Admin Portal'
    : isFinance
    ? 'Finance Portal'
    : (isGuild ? 'Guild President Portal' : (isStaff ? 'Dean Portal' : 'Student Portal'));
  const profileName = profile?.fullName ?? (isAdmin ? 'System Admin' : (isFinance ? 'Finance User' : (isGuild ? 'Guild President' : (isStaff ? 'Dean User' : 'Student User'))));
  const profileId = profile?.studentNumber ?? (isAdmin ? 'ADMIN-01' : (isFinance ? 'FINANCE-01' : (isGuild ? 'GUILD-01' : (isStaff ? 'STAFF-01' : '26701'))));

  return (
    <DashboardLayout
      activePage={activePage}
      setActivePage={navigateWithAuth}
      userRole={userRole}
      title={headerTitle}
      userName={profileName}
      userId={profileId}
      onLogout={handleLogout}
      userAccountId={profile?.userId ?? null}
    >
      {renderContent()}
    </DashboardLayout>
  );
}

export default App;
