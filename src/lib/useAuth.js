import { useState, useEffect, useCallback } from 'react'

export default function useAuth() {
  const [token, setToken] = useState(null)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('ares_token')
    if (saved) setToken(saved)
    setChecked(true)
  }, [])

  const login = useCallback((value) => {
    localStorage.setItem('ares_token', value)
    setToken(value)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('ares_token')
    setToken(null)
  }, [])

  const authHeaders = token ? { 'X-Auth-Token': token } : {}

  return { token, checked, login, logout, authHeaders }
}
