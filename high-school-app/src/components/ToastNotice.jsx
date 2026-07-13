import { useSchool } from '../context/useSchool'

export default function ToastNotice() {
  const { toast } = useSchool()
  if (!toast) return null
  return (
    <div className="toast-container position-fixed top-0 end-0 p-3">
      <div className={`toast show text-bg-${toast.variant} border-0`} role="status">
        <div className="toast-body">{toast.message}</div>
      </div>
    </div>
  )
}
