import { X } from 'lucide-react'
import { useUiStore } from '../../store/uiStore'

export function ProfileModal() {
  const profileOpen = useUiStore((state) => state.profileOpen)
  const setProfileOpen = useUiStore((state) => state.setProfileOpen)
  if (!profileOpen) return null

  return (
    <div className="modal-backdrop" onClick={() => setProfileOpen(false)}>
      <div className="profile-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-head">
          <h3>Profil</h3>
          <button className="icon-button" onClick={() => setProfileOpen(false)} aria-label="Fermer le profil">
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
