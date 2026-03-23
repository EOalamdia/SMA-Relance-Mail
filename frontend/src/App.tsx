import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"

import MainLayout from "./MainLayout"
import DevToolsPage from "./pages/DevTools"
import HomePage from "./pages/Home"
import ItemsPage from "./pages/Items"
import ModulesPage from "./pages/Modules"
import SettingsPage from "./pages/Settings"

const rawBasename = import.meta.env.BASE_URL || "/"
const basename = rawBasename.endsWith("/") && rawBasename.length > 1 ? rawBasename.slice(0, -1) : rawBasename

export default function App() {
  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/modules" element={<ModulesPage />} />
          {/* PLACEHOLDER: remplacer /items par la route metier de la nouvelle app */}
          <Route path="/items" element={<ItemsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/dev-tools" element={<DevToolsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
