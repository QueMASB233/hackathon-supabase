import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthLayout } from './layouts/AuthLayout'
import { AppShell } from './layouts/AppShell'
import { RequireSession } from './layouts/RequireSession'
import { WorkspaceLayout } from './layouts/WorkspaceLayout'
import { LoginPage } from './pages/LoginPage'
import { SignupPage } from './pages/SignupPage'
import { CheckEmailPage } from './pages/CheckEmailPage'
import { AuthCallbackPage } from './pages/AuthCallbackPage'
import { InvitePage } from './pages/InvitePage'
import { HomeRedirect } from './pages/HomeRedirect'
import { DashboardPage } from './pages/DashboardPage'
import { NewClientPage } from './pages/NewClientPage'
import { ChatPage } from './pages/ChatPage'
import { DocumentsPage } from './pages/DocumentsPage'
import { ConversationsPage } from './pages/ConversationsPage'
import { ActivityPage } from './pages/ActivityPage'
import { ForbiddenPage, NotFoundPage, UnauthorizedPage } from './pages/StatusPages'
import { Toaster } from './components/ui/Toaster'

export default function App() {
  return (
    <>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/check-email" element={<CheckEmailPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/invite/:token" element={<InvitePage />} />
        </Route>
        <Route element={<RequireSession />}>
          <Route path="/app" element={<AppShell />}>
            <Route index element={<HomeRedirect />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="clients/new" element={<NewClientPage />} />
            <Route path="workspaces/:id" element={<WorkspaceLayout />}>
              <Route index element={<ChatPage />} />
              <Route path="chat/:conversationId?" element={<ChatPage />} />
              <Route path="documents" element={<DocumentsPage />} />
              <Route path="conversations" element={<ConversationsPage />} />
              <Route path="activity" element={<ActivityPage />} />
            </Route>
          </Route>
        </Route>
        <Route path="/401" element={<UnauthorizedPage />} />
        <Route path="/403" element={<ForbiddenPage />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Toaster />
    </>
  )
}
