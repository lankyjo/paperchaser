import { useState } from 'react'
import { preferencesRepo, projectsRepo } from '../../db/repos'
import { useMountEffect } from '../../hooks/useMountEffect'
import { isLikelyPrivateMode, shouldSuggestHomeScreen } from '../../lib/dataSafety'

const INSTALL_DISMISSED_KEY = 'homeScreenTipDismissed'

interface Safety {
  hasData: boolean
  privateMode: boolean
  suggestInstall: boolean
}

const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true

// Reads what could cost the user their data: a private window or a Safari tab that was never added to the Home Screen.
export function useDataSafety() {
  const [safety, setSafety] = useState<Safety | null>(null)

  useMountEffect(() => {
    void (async () => {
      const [dismissed, projects, estimate] = await Promise.all([
        preferencesRepo.get<boolean>(INSTALL_DISMISSED_KEY),
        projectsRepo.list(),
        navigator.storage?.estimate?.().catch(() => undefined),
      ])
      setSafety({
        hasData: projects.length > 0,
        privateMode: isLikelyPrivateMode(estimate?.quota),
        suggestInstall: !dismissed && shouldSuggestHomeScreen(navigator.userAgent, isStandalone()),
      })
    })()
  })

  const dismissInstall = () => {
    void preferencesRepo.put(INSTALL_DISMISSED_KEY, true)
    setSafety((s) => s && { ...s, suggestInstall: false })
  }

  return { safety, dismissInstall }
}
