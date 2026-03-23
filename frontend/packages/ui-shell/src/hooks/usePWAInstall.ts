import { useState, useEffect } from 'react'

export function usePWAInstall() {
  const [installPrompt, setInstallPrompt] = useState<any>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [isAndroid, setIsAndroid] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [promptDismissed, setPromptDismissed] = useState(false)

  useEffect(() => {
    // Détection "déjà installé" : mode standalone (display-mode) ou navigator.standalone (iOS Safari)
    const standaloneMediaQuery = window.matchMedia('(display-mode: standalone)')
    const isStandalone = standaloneMediaQuery.matches || (navigator as any).standalone === true
    setIsInstalled(isStandalone)

    // Détection OS
    const ua = navigator.userAgent || navigator.vendor || (window as any).opera
    const iosDevice = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream
    const androidDevice = /android/i.test(ua)
    setIsIOS(iosDevice)
    setIsAndroid(androidDevice)

    // Écouter le prompt natif PWA (Chrome/Edge Android, Chrome Desktop)
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault()
      setInstallPrompt(e)
    }

    // Écouter l'installation réussie pour masquer le bouton
    const handleAppInstalled = () => {
      setInstallPrompt(null)
      setIsInstalled(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async (): Promise<'prompt' | 'ios' | 'android' | 'unavailable'> => {
    // Prompt natif disponible (Chrome/Edge Android/Desktop)
    if (installPrompt) {
      installPrompt.prompt()
      const { outcome } = await installPrompt.userChoice
      if (outcome === 'accepted') {
        setInstallPrompt(null)
        setIsInstalled(true)
      } else {
        setPromptDismissed(true)
      }
      return 'prompt'
    }

    // iOS Safari : instructions manuelles nécessaires
    if (isIOS) {
      return 'ios'
    }

    // Android sans prompt natif (Firefox, Samsung Browser, etc.)
    if (isAndroid) {
      return 'android'
    }

    return 'unavailable'
  }

  // L'app est installable si :
  // - Pas encore installée
  // - ET (prompt natif dispo OU iOS Safari OU Android)
  const promptReady = !!installPrompt
  const canShowInstallHelp = !isInstalled && (promptReady || isIOS || isAndroid)

  return {
    isInstallable: canShowInstallHelp && !promptDismissed,
    isIOS,
    isAndroid,
    isInstalled,
    promptReady,
    handleInstallClick,
  }
}

