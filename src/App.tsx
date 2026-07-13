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
import PasswordReset from './pages/PasswordReset';
import GuildInbox from './pages/GuildInbox';
import GuildDashboard from './pages/GuildDashboard';
import AucasaPlan from './pages/AucasaPlan';
import AdminDashboard from './pages/AdminDashboard';
import StudentIssues from './pages/StudentIssues';
import About from './pages/About';
import Services from './pages/Services';
import Signup from './pages/Signup';
import Contact from './pages/Contact';
import NotificationsCenter from './pages/NotificationsCenter';
import SettingsCenter from './pages/SettingsCenter';
import SemesterManagement from './pages/SemesterManagement';
import StudentCardManager from './pages/StudentCardManager';

type AppRole = 'student' | 'staff' | 'dean' | 'admin' | 'finance' | 'student_card_manager' | 'guild_president' | 'minister_sport' | 'minister_evangelism' | 'minister_international_affairs';

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
  role: AppRole;
  gpa: string;
  semester: number;
  disciplineStatus: string;
};

type UserRole = AppRole | null;

const DEAN_PAGES = new Set(['labour-mgmt', 'groups', 'courses', 'dashboard-tools', 'exam', 'attendance-review', 'students', 'candidate-review', 'semester-management']);
const ADMIN_PAGES = new Set(['admin-dashboard', 'user-management']);
const FINANCE_PAGES = new Set(['finance-review', 'finance-budgets', 'finance-expenses', 'finance-receipts', 'finance-reports']);
const CARD_MANAGER_PAGES = new Set(['student-card-manager']);
const GUILD_PAGES = new Set(['guild-dashboard', 'guild-inbox', 'semester-management']);
const GUILD_EXTRA_ALLOWED_PAGES = new Set(['attendance-review', 'semester-management']);
const AUTH_SESSION_KEY = 'aucasa_auth_session';
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
type SavedSession = { isLoggedIn?: boolean; profile?: AuthProfile | null; lastActiveAt?: number };

const readSavedSession = (): SavedSession => {
  try {
    const raw = window.localStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as SavedSession;
    if (parsed?.isLoggedIn && typeof parsed.lastActiveAt === 'number' && Date.now() - parsed.lastActiveAt > SESSION_TIMEOUT_MS) {
      window.localStorage.removeItem(AUTH_SESSION_KEY);
      return {};
    }
    return parsed ?? {};
  } catch {
    return {};
  }
};

function App() {
  const savedSession = readSavedSession();
  const initialProfile = savedSession?.isLoggedIn && savedSession?.profile ? savedSession.profile : null;
  const [activePage, setActivePage] = useState(() => {
    if (!initialProfile) return 'landing';
    if (initialProfile.role === 'staff' || initialProfile.role === 'dean') return 'dashboard-tools';
    if (initialProfile.role === 'admin') return 'admin-dashboard';
    if (initialProfile.role === 'finance') return 'finance-review';
    if (initialProfile.role === 'student_card_manager') return 'student-card-manager';
    if (initialProfile.role === 'guild_president') return 'guild-dashboard';
    return 'dashboard';
  });
  const [selectedAttendanceSessionId, setSelectedAttendanceSessionId] = useState<number | undefined>(undefined);
  const [selectedAttendanceQrToken, setSelectedAttendanceQrToken] = useState<string>('');
  const [aboutTopic, setAboutTopic] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(Boolean(initialProfile));
  const [userRole, setUserRole] = useState<UserRole>(initialProfile?.role ?? null);
  const [profile, setProfile] = useState<AuthProfile | null>(initialProfile);
  const [passwordResetToken, setPasswordResetToken] = useState('');

  const isDeanRole = (role: UserRole) => role === 'staff' || role === 'dean';
  const isAdminRole = (role: UserRole) => role === 'admin';
  const isFinanceRole = (role: UserRole) => role === 'finance';
  const isCardManagerRole = (role: UserRole) => role === 'student_card_manager';
  const isGuildRole = (role: UserRole) => role === 'guild_president' || role === 'minister_sport' || role === 'minister_evangelism' || role === 'minister_international_affairs';
  const resolveDefaultPageForRole = (role: AuthProfile['role']) => {
    if (isDeanRole(role)) return 'dashboard-tools';
    if (isAdminRole(role)) return 'admin-dashboard';
    if (isFinanceRole(role)) return 'finance-review';
    if (isCardManagerRole(role)) return 'student-card-manager';
    if (isGuildRole(role)) return 'guild-dashboard';
    return 'dashboard';
  };

  useEffect(() => {
    if (!isLoggedIn) return;

    const refreshActivity = () => {
      window.localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({
        isLoggedIn: true,
        profile,
        lastActiveAt: Date.now(),
      }));
    };

    const expireIfInactive = () => {
      const saved = readSavedSession();
      if (saved?.isLoggedIn && typeof saved.lastActiveAt === 'number' && Date.now() - saved.lastActiveAt > SESSION_TIMEOUT_MS) {
        setIsLoggedIn(false);
        setUserRole(null);
        setProfile(null);
        setActivePage('landing');
        window.localStorage.removeItem(AUTH_SESSION_KEY);
      }
    };

    const events = ['click', 'keydown', 'mousemove', 'touchstart'];
    events.forEach((eventName) => window.addEventListener(eventName, refreshActivity, { passive: true }));
    const interval = window.setInterval(expireIfInactive, 60_000);
    refreshActivity();

    return () => {
      events.forEach((eventName) => window.removeEventListener(eventName, refreshActivity));
      window.clearInterval(interval);
    };
  }, [isLoggedIn, profile]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const resetToken = params.get('resetToken') ?? '';
    if (resetToken) {
      setPasswordResetToken(resetToken);
      setActivePage('reset-password');
      window.history.replaceState({}, '', window.location.pathname);
      return;
    }

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
    if (!isLoggedIn && (page !== 'landing' && page !== 'about' && page !== 'services' && page !== 'contact' && page !== 'signup' && page !== 'login' && page !== 'forgot-password' && page !== 'reset-password')) {
      setActivePage('login');
      return;
    }

    const canAccessDeanPages = isDeanRole(userRole) || (isGuildRole(userRole) && GUILD_EXTRA_ALLOWED_PAGES.has(page));
    const fallbackPage = userRole ? resolveDefaultPageForRole(userRole) : 'dashboard';

    if (DEAN_PAGES.has(page) && !canAccessDeanPages) {
      setActivePage(fallbackPage);
      return;
    }

    if (ADMIN_PAGES.has(page) && !isAdminRole(userRole)) {
      setActivePage(fallbackPage);
      return;
    }

    if (FINANCE_PAGES.has(page) && !(isFinanceRole(userRole) || isAdminRole(userRole))) {
      setActivePage(fallbackPage);
      return;
    }

    if (CARD_MANAGER_PAGES.has(page) && !(isCardManagerRole(userRole) || isAdminRole(userRole))) {
      setActivePage(fallbackPage);
      return;
    }

    if (GUILD_PAGES.has(page) && !isGuildRole(userRole)) {
      setActivePage(fallbackPage);
      return;
    }

    if (page === 'registration' && !(isDeanRole(userRole) || isAdminRole(userRole))) {
      setActivePage(fallbackPage);
      return;
    }

    setActivePage(page);
  };

  const renderContent = () => {
    switch (activePage) {
      case 'dashboard':
        if (isGuildRole(userRole)) {
          return <GuildDashboard userId={profile?.userId ?? 0} onNavigate={navigateWithAuth} />;
        }
        if (isDeanRole(userRole)) {
          return <DeanDashboard onNavigate={navigateWithAuth} />;
        }
        if (isAdminRole(userRole)) {
          return <AdminDashboard fullName={profile?.fullName ?? 'System Admin'} mode="overview" />;
        }
        if (isFinanceRole(userRole)) {
          return <FinancePaymentReview initialTab="overview" currentUserRole={userRole} currentUserName={profile?.fullName ?? 'Finance User'} />;
        }
        return (
          <StudentDashboard
            navigateTo={navigateWithAuth}
            studentId={profile?.studentId ?? null}
            fullName={profile?.fullName ?? 'Student User'}
            studentNumber={profile?.studentNumber ?? '26701'}
            faculty={profile?.faculty ?? 'Information Technology'}
            department={profile?.department ?? 'Software Engineering'}
            program={profile?.program ?? 'Day'}
            credits={profile?.credits ?? 0}
            gpa={Number(profile?.gpa ?? '0')}
            semester={profile?.semester ?? 0}
          />
        );
      case 'labour':
        return (
          <StudentLabour
            studentNumber={profile?.studentNumber ?? ''}
            fullName={profile?.fullName ?? ''}
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
        return <DeanDashboard onNavigate={navigateWithAuth} />;
      case 'attendance-review':
        return <DeanAttendance />;
      case 'students':
        return <DeanStudentList />;
      case 'candidate-review':
        return <DeanCandidateReview />;
      case 'semester-management':
        return <SemesterManagement currentUserRole={userRole} currentUserName={profile?.fullName ?? 'User'} />;
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
      case 'student-card-manager':
        return <StudentCardManager managerUserId={profile?.userId ?? 0} />;
      case 'guild-inbox':
        return <GuildInbox userId={profile?.userId ?? 0} />;
      case 'guild-dashboard':
        return <GuildDashboard userId={profile?.userId ?? 0} onNavigate={navigateWithAuth} />;
      case 'aucasa-plan':
        return (
          <AucasaPlan
            viewerMode={isGuildRole(userRole) ? 'manage' : 'view'}
            ratingUserKey={profile?.studentNumber ?? profile?.username ?? 'viewer'}
          />
        );
      case 'admin-dashboard':
        return <AdminDashboard fullName={profile?.fullName ?? 'System Admin'} mode="overview" />;
      case 'user-management':
        return <AdminDashboard fullName={profile?.fullName ?? 'System Admin'} mode="management" />;
      case 'student-issues':
        return <StudentIssues studentNumber={profile?.studentNumber ?? ''} />;
      case 'exam':
        return <PlaceholderPage title="Exam Officer" />;
      case 'elections':
        return (
          <Elections
            studentNumber={profile?.studentNumber ?? ''}
            gpa={profile?.gpa ?? '0.00'}
            credits={profile?.credits ?? 0}
            disciplineStatus={profile?.disciplineStatus ?? ''}
          />
        );
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
      case 'notifications':
        return <NotificationsCenter userRole={userRole} studentId={profile?.studentId ?? null} />;
      case 'settings':
        return <SettingsCenter
          fullName={profile?.fullName}
          userId={profile?.studentNumber ?? (isAdminRole(userRole) ? 'ADMIN-01' : (isFinanceRole(userRole) ? 'FINANCE-01' : (isGuildRole(userRole) ? 'GUILD-01' : (isDeanRole(userRole) ? 'STAFF-01' : '26701'))))}
          userRole={userRole}
        />;
      default:
        return <PlaceholderPage title="Page Not Found" />;
    }
  };

  // Standalone pages outside main layout
  if (activePage === 'landing') {
    return <Landing
      onEnter={() => setActivePage('login')}
      onNavigate={(page, topic) => {
        setAboutTopic(page === 'about' ? topic ?? null : null);
        setActivePage(page);
      }}
    />;
  }

  if (activePage === 'about') {
    return <About
      onBack={() => setActivePage('landing')}
      onEnter={() => setActivePage('login')}
      onNavigate={(page) => {
        setAboutTopic(page === 'about' ? aboutTopic : null);
        setActivePage(page);
      }}
      topic={aboutTopic}
    />;
  }

  if (activePage === 'services') {
    return <Services onBack={() => setActivePage('landing')} />;
  }
  if (activePage === 'contact') {
    return <Contact onBack={() => setActivePage('landing')} />;
  }
  if (activePage === 'signup') {
    return <Signup onBack={() => setActivePage('landing')} onLogin={() => setActivePage('login')} />;
  }

  if (activePage === 'forgot-password' || activePage === 'reset-password') {
    return <PasswordReset
      token={activePage === 'reset-password' ? passwordResetToken : ''}
      onBack={() => setActivePage('login')}
      onLogin={() => setActivePage('login')}
    />;
  }

  if (activePage === 'login') {
    return <Login
      onLogin={(loginProfile) => {
        setIsLoggedIn(true);
        setProfile(loginProfile);
        setUserRole(loginProfile.role);
        window.localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({
          isLoggedIn: true,
          profile: loginProfile,
          lastActiveAt: Date.now(),
        }));
        if (selectedAttendanceQrToken && loginProfile.role === 'student') {
          setActivePage('attendance-checkin');
          return;
        }
        setActivePage(resolveDefaultPageForRole(loginProfile.role));
      }}
      onBack={() => setActivePage('landing')}
      onSignUp={() => setActivePage('signup')}
      onForgotPassword={() => setActivePage('forgot-password')}
      attendanceNotice={Boolean(selectedAttendanceQrToken)}
    />;
  }

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserRole(null);
    setProfile(null);
    setActivePage('landing');
    window.localStorage.removeItem(AUTH_SESSION_KEY);
  };

  const isStaff = isDeanRole(userRole);
  const isAdmin = isAdminRole(userRole);
  const isFinance = isFinanceRole(userRole);
  const isCardManager = isCardManagerRole(userRole);
  const isGuild = isGuildRole(userRole);
  const headerTitle = isAdmin
    ? (activePage === 'user-management' ? 'User Management' : 'System Overview')
    : isFinance
    ? 'Finance Portal'
    : isCardManager
    ? 'Student Card Office'
    : (isGuild ? 'Guild President Portal' : (isStaff ? 'Dean Portal' : 'Student Portal'));
  const profileName = profile?.fullName ?? (isAdmin ? 'System Admin' : (isFinance ? 'Finance User' : (isCardManager ? 'Card Manager' : (isGuild ? 'Guild President' : (isStaff ? 'Dean User' : 'Student User')))));
  const profileId = profile?.studentNumber ?? (isAdmin ? 'ADMIN-01' : (isFinance ? 'FINANCE-01' : (isCardManager ? 'CARD-01' : (isGuild ? 'GUILD-01' : (isStaff ? 'STAFF-01' : '26701')))));

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
