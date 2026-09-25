import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { AIChatbot } from './components/AIChatbot';
import { DemoWorkflowModal } from './components/DemoWorkflowModal';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { CitizenDashboard } from './pages/CitizenDashboard';
import { OfficerDashboard } from './pages/OfficerDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { Citizen360Page } from './pages/Citizen360Page';
import { TechnicalArchitecturePage } from './pages/TechnicalArchitecturePage';

function AppContent() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [demoOpen, setDemoOpen] = useState(false);
  const [selectedCitizen360Id, setSelectedCitizen360Id] = useState(null);

  const handleOpenCitizen360 = (citizenId) => {
    setSelectedCitizen360Id(citizenId);
    setActiveTab('citizen360');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <LandingPage
            onOpenDemo={() => setDemoOpen(true)}
            onGoToLogin={() => setActiveTab('login')}
            onGoToDashboard={() => setActiveTab('dashboard')}
          />
        );

      case 'login':
        return (
          <LoginPage
            onLoginSuccess={() => setActiveTab('dashboard')}
          />
        );

      case 'dashboard':
        if (!user) {
          return (
            <LoginPage
              onLoginSuccess={() => setActiveTab('dashboard')}
            />
          );
        }
        if (user.role === 'CITIZEN') {
          return <CitizenDashboard onOpenDemo={() => setDemoOpen(true)} />;
        }
        if (user.role === 'DEPARTMENT_OFFICER') {
          return <OfficerDashboard onSelectCitizen360={handleOpenCitizen360} />;
        }
        if (user.role === 'INTEGRATION_ADMIN') {
          return <AdminDashboard />;
        }
        return <CitizenDashboard onOpenDemo={() => setDemoOpen(true)} />;

      case 'citizen360':
        return <Citizen360Page citizenIdProp={selectedCitizen360Id} />;

      case 'architecture':
        return <TechnicalArchitecturePage />;

      default:
        return (
          <LandingPage
            onOpenDemo={() => setDemoOpen(true)}
            onGoToLogin={() => setActiveTab('login')}
          />
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header
        onOpenDemo={() => setDemoOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <main className="flex-1">
        {renderContent()}
      </main>

      <Footer />

      {/* Floating Sangam Sahayak Multilingual Voice Assistant */}
      <AIChatbot />

      {/* Guided Interoperability Demo Modal */}
      <DemoWorkflowModal
        isOpen={demoOpen}
        onClose={() => setDemoOpen(false)}
        onFinish={() => {
          setDemoOpen(false);
          setActiveTab('dashboard');
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LanguageProvider>
  );
}
