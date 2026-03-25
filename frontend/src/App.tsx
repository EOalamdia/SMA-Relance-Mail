import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"

import MainLayout from "./MainLayout"
import HomePage from "./pages/Home"
import DashboardPage from "./pages/Dashboard"
import OrganizationTypesPage from "./pages/OrganizationTypes"
import OrganizationsPage from "./pages/Organizations"
import ContactsPage from "./pages/Contacts"
import TrainingCoursesPage from "./pages/TrainingCourses"
import CourseApplicabilityPage from "./pages/CourseApplicability"
import TrainingSessionsPage from "./pages/TrainingSessions"
import DueItemsPage from "./pages/DueItems"
import ReminderRulesPage from "./pages/ReminderRules"
import EmailTemplatesPage from "./pages/EmailTemplates"
import ReminderJobsPage from "./pages/ReminderJobs"
import EmailDeliveriesPage from "./pages/EmailDeliveries"
import ImportDataPage from "./pages/ImportData"
import CommunicationTopicsPage from "./pages/CommunicationTopics"
import EmailSubscriptionsPage from "./pages/EmailSubscriptions"
import UnsubscribeEventsPage from "./pages/UnsubscribeEvents"
import UnsubscribePage from "./pages/Unsubscribe"

const rawBasename = import.meta.env.BASE_URL || "/"
const basename = rawBasename.endsWith("/") && rawBasename.length > 1 ? rawBasename.slice(0, -1) : rawBasename

export default function App() {
  return (
    <BrowserRouter basename={basename}>
      <Routes>
        {/* Public route — no auth, no layout */}
        <Route path="/unsubscribe" element={<UnsubscribePage />} />

        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/organization-types" element={<OrganizationTypesPage />} />
          <Route path="/organizations" element={<OrganizationsPage />} />
          <Route path="/contacts" element={<ContactsPage />} />
          <Route path="/training-courses" element={<TrainingCoursesPage />} />
          <Route path="/course-applicability" element={<CourseApplicabilityPage />} />
          <Route path="/training-sessions" element={<TrainingSessionsPage />} />
          <Route path="/due-items" element={<DueItemsPage />} />
          <Route path="/reminder-rules" element={<ReminderRulesPage />} />
          <Route path="/email-templates" element={<EmailTemplatesPage />} />
          <Route path="/reminder-jobs" element={<ReminderJobsPage />} />
          <Route path="/email-deliveries" element={<EmailDeliveriesPage />} />
          <Route path="/import" element={<ImportDataPage />} />
          <Route path="/communication-topics" element={<CommunicationTopicsPage />} />
          <Route path="/email-subscriptions" element={<EmailSubscriptionsPage />} />
          <Route path="/unsubscribe-events" element={<UnsubscribeEventsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
