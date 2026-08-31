import React from 'react';
import { AppProvider, useAppStore } from './store/appStore';
import { AppLayout } from './components/templates/AppLayout';
import { ChatInterface } from './components/organisms/ChatInterface';
import { TicketingPortal } from './components/organisms/TicketingPortal';
import { KnowledgeExplorer } from './components/organisms/KnowledgeExplorer';
import { ApprovalsInbox } from './components/organisms/ApprovalsInbox';
import { AuditTrailViewer } from './components/organisms/AuditTrailViewer';
import { AdminDashboard } from './components/organisms/AdminDashboard';
import { EvaluationCenter } from './components/organisms/EvaluationCenter';
import { SandboxSettings } from './components/organisms/SandboxSettings';

const MainContent: React.FC = () => {
  const { activeTab } = useAppStore();

  switch (activeTab) {
    case 'chat':
      return <ChatInterface />;
    case 'tickets':
      return <TicketingPortal />;
    case 'knowledge':
      return <KnowledgeExplorer />;
    case 'approvals':
      return <ApprovalsInbox />;
    case 'audit':
      return <AuditTrailViewer />;
    case 'admin':
      return <AdminDashboard />;
    case 'eval':
      return <EvaluationCenter />;
    case 'settings':
      return <SandboxSettings />;
    default:
      return <ChatInterface />;
  }
};

export function App() {
  return (
    <AppProvider>
      <AppLayout>
        <MainContent />
      </AppLayout>
    </AppProvider>
  );
}

export default App;
