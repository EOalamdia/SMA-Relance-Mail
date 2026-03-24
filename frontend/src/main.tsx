import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import App from "./App"
import "./index.css"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Register Service Worker for PWA
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  const baseUrl = import.meta.env.BASE_URL.endsWith("/") ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`
  const serviceWorkerUrl = `${baseUrl}sw.js`

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(serviceWorkerUrl)
      .then((reg) => {
        reg.onupdatefound = () => {
          const installingWorker = reg.installing
          if (!installingWorker) return
          installingWorker.onstatechange = () => {
            if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
              window.location.reload()
            }
          }
        }
      })
      .catch((err) => {
        console.error("SW registration failed: ", err)
      })
  })

  let refreshing = false
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshing) return
    refreshing = true
    window.location.reload()
  })
}
