import { useContext } from 'react'
import { SchoolContext } from './SchoolContextValue'

export function useSchool() {
  const context = useContext(SchoolContext)
  if (!context) throw new Error('useSchool must be used inside SchoolProvider')
  return context
}
