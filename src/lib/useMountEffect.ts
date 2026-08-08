import { useEffect } from 'react'

/**
 * One-time mount effect — the house-rule-sanctioned mount wrapper (AGENTS.md:
 * never call useEffect directly in components; use a mount wrapper for
 * one-time external sync on mount). Wraps useEffect with an empty dependency
 * array to make the intent explicit.
 */
export function useMountEffect(effect: () => void | (() => void)) {
  useEffect(effect, [])
}
