import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import NotificationBell from './components/NotificationBell';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import JobFeedPage from './pages/JobFeedPage';
import PostJobPage from './pages/PostJobPage';
import CandidatesPage from './pages/CandidatesPage';
import KanbanPage from './pages/KanbanPage';
import ProfilePage from './pages/ProfilePage';
import InterviewsPage from './pages/InterviewsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import ReferralsPage from './pages/ReferralsPage';
import OffersPage from './pages/OffersPage';
import CompliancePage from './pages/CompliancePage';
import NurturePage from './pages/NurturePage';
import CopilotPage from './pages/CopilotPage';
import CareerSitePage from './pages/CareerSitePage';
import OrganizationSettings from './pages/OrganizationSettings';
import WorkflowAutomation from './pages/WorkflowAutomation';
import CandidatePortalPage from './pages/CandidatePortalPage';
import CareerSiteBuilderPage from './pages/CareerSiteBuilderPage';
import EmailTemplatesPage from './pages/EmailTemplatesPage';
import {
  LayoutDashboard, Search, PlusCircle, User, LogOut,
  Calendar, BarChart3, Settings, Columns3, Home,
  UserPlus, FileText, Shield, Mail, Brain, Globe, Building, Zap, Briefcase, Palette
} from 'lucide-react';
import './index.css';

function AppRoutes() {
  const { user, loading, logout } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="pulse" style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>Loading HireFlow…</div>
      </div>
    );
  }

  // Public pages — no sidebar
  if (['/login', '/register', '/careers'].includes(location.pathname)) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/careers" element={<div className="app-layout"><main className="main-content" style={{ marginLeft: 0, maxWidth: '100%' }}><CareerSitePage /></main></div>} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  // Role-based UI Flags
  const isJobSeeker = user.role === 'JOB_SEEKER';
  const isAdmin = user.role === 'ORG_ADMIN' || user.role === 'SYSTEM_ADMIN';
  const isHiringManager = user.role === 'HIRING_MANAGER';
  const isRecruiter = user.role === 'RECRUITER';
  const isInterviewer = user.role === 'INTERVIEWER';
  const isCoordinator = user.role === 'COORDINATOR';

  // "Staff" are any internal employees
  const isStaff = !isJobSeeker;
  
  // High-level access groups
  const canManageJobs = isAdmin || isRecruiter || isHiringManager;
  const canManageWorkflows = isAdmin || isRecruiter;
  const canViewAnalytics = isAdmin || isRecruiter || isHiringManager;
  const canViewCompliance = isAdmin || isRecruiter;

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <nav className="sidebar">
        <div className="sidebar-logo">HireFlow AI</div>

        <div className="sidebar-section">Main</div>
        <NavLink to="/" end className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={18} /> Dashboard
        </NavLink>
        <NavLink to="/jobs" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Search size={18} /> {isStaff ? 'Job Feed' : 'Find Jobs'}
        </NavLink>
        {isJobSeeker && (
          <NavLink to="/portal" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Briefcase size={18} /> My Applications
          </NavLink>
        )}
        <NavLink to="/interviews" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Calendar size={18} /> Interviews
        </NavLink>
        {isStaff && (
          <NavLink to="/referrals" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <UserPlus size={18} /> Referrals
          </NavLink>
        )}
        <NavLink to="/offers" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <FileText size={18} /> Offers
        </NavLink>

        {isStaff && (
          <>
            <div className="sidebar-section">Recruitment Tools</div>
            {canManageJobs && (
              <NavLink to="/post-job" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <PlusCircle size={18} /> Post a Job
              </NavLink>
            )}
            {canViewAnalytics && (
              <NavLink to="/analytics" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <BarChart3 size={18} /> Analytics
              </NavLink>
            )}
            {canViewCompliance && (
              <NavLink to="/compliance" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <Shield size={18} /> DEI & Compliance
              </NavLink>
            )}
            {canManageWorkflows && (
              <NavLink to="/nurture" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <Mail size={18} /> Nurture
              </NavLink>
            )}
            <NavLink to="/copilot" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <Brain size={18} /> AI Copilot
            </NavLink>
            <NavLink to="/careers" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <Globe size={18} /> Public Site
            </NavLink>
            {isAdmin && (
              <NavLink to="/site-builder" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <Palette size={18} /> Site Builder
              </NavLink>
            )}
            
            {(isAdmin || canManageWorkflows) && (
              <>
                <div className="sidebar-section">Enterprise</div>
                {isAdmin && (
                  <NavLink to="/organization" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                    <Building size={18} /> Org Settings
                  </NavLink>
                )}
                {canManageWorkflows && (
                  <NavLink to="/workflows" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                    <Zap size={18} /> Automations
                  </NavLink>
                )}
              </>
            )}
          </>
        )}

        <div className="sidebar-section">Account</div>
        <NavLink to="/profile" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <User size={18} /> My Profile
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Settings size={18} /> Settings
        </NavLink>

        <div style={{ marginTop: 'auto' }}>
          {/* Notification Bell */}
          <div style={{ padding: '8px 14px' }}>
            <NotificationBell />
          </div>

          <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border-subtle)', marginTop: 8 }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 2 }}>{user.name || user.email}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>{user.role.replace('_', ' ')}</span>
            </div>
          </div>
          <button
            className="sidebar-link"
            onClick={logout}
            style={{ cursor: 'pointer', background: 'none', border: 'none', width: '100%', textAlign: 'left', fontFamily: 'var(--font-sans)' }}
          >
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/jobs" element={<JobFeedPage />} />
          <Route path="/post-job" element={<PostJobPage />} />
          <Route path="/candidates/:jobId" element={<CandidatesPage />} />
          <Route path="/pipeline/:jobId" element={<KanbanPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/interviews" element={<InterviewsPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/referrals" element={<ReferralsPage />} />
          <Route path="/offers" element={<OffersPage />} />
          <Route path="/compliance" element={<CompliancePage />} />
          <Route path="/nurture" element={<NurturePage />} />
          <Route path="/copilot" element={<CopilotPage />} />
          <Route path="/careers" element={<CareerSitePage />} />
          <Route path="/organization" element={<OrganizationSettings />} />
          <Route path="/workflows" element={<WorkflowAutomation />} />
          <Route path="/email-templates" element={<EmailTemplatesPage />} />
          <Route path="/portal" element={<CandidatePortalPage />} />
          <Route path="/site-builder" element={<CareerSiteBuilderPage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="mobile-nav">
        <NavLink to="/" end className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
          <Home size={20} />
          <span>Home</span>
        </NavLink>
        <NavLink to="/jobs" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
          <Search size={20} />
          <span>Jobs</span>
        </NavLink>
        <NavLink to="/interviews" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
          <Calendar size={20} />
          <span>Interviews</span>
        </NavLink>
        <NavLink to="/offers" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
          <FileText size={20} />
          <span>Offers</span>
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
          <Settings size={20} />
          <span>More</span>
        </NavLink>
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

