import { Link } from '@tanstack/react-router'
import {
  CircleDashed,
  ImageIcon,
  LibraryBig,
  MessageSquareText,
  PanelLeftClose,
  PencilLine,
  Plus,
  Search,
  Settings2,
  SquareTerminal,
  Trash2,
} from 'lucide-react'
import { sortConversations } from '../../lib/storage'
import { useUiStore } from '../../store/uiStore'

const navItems = [
  { label: 'Nouveau chat', icon: MessageSquareText },
  { label: 'Recherche', icon: Search },
  { label: 'Images', icon: ImageIcon },
  { label: 'Planifié', icon: PencilLine },
  { label: 'Bibliothèque', icon: LibraryBig },
  { label: 'Plugins', icon: SquareTerminal },
  { label: 'Explorer', icon: CircleDashed },
]

export function Sidebar({ conversations, onCreateConversation, onDeleteConversation }) {
  const sidebarOpen = useUiStore((state) => state.sidebarOpen)
  const toggleSidebar = useUiStore((state) => state.toggleSidebar)
  const setProfileOpen = useUiStore((state) => state.setProfileOpen)
  const recentConversations = sortConversations(conversations)

  return (
    <>
      {sidebarOpen && (
        <button
          className="sidebar-backdrop"
          type="button"
          aria-label="Fermer la barre latérale"
          onClick={toggleSidebar}
        />
      )}
      <aside className={`sidebar ${sidebarOpen ? 'is-open' : 'is-collapsed'}`}>
      <div className="sidebar-header">
        <div className="brand-block">
          <span className="brand-text">Luna</span>
        </div>

        <div className="sidebar-header-actions">
          <button
            className="icon-button ghost"
            type="button"
            aria-label="Fermer la barre latérale"
            title="Fermer la barre latérale"
            onClick={toggleSidebar}
          >
            <PanelLeftClose size={16} />
          </button>
          <button className="icon-button ghost" aria-label="Nouvelle discussion" onClick={onCreateConversation}>
            <Plus size={16} />
          </button>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Navigation principale">
        {navItems.map(({ label, icon: Icon }) => (
          <button key={label} className="nav-item" type="button">
            <Icon size={16} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-section">
        <div className="section-row">
          <span>Projets</span>
          <span>›</span>
        </div>
      </div>

      <section className="conversation-history" aria-label="Historique des conversations">
        <div className="conversation-history-heading">Conversations</div>
        {recentConversations.length > 0 ? (
          <nav className="conversation-list" aria-label="Conversations enregistrées">
            {recentConversations.map((conversation) => (
              <div className="conversation-entry" key={conversation.id}>
                <Link
                  to={`/c/${conversation.id}`}
                  className="conversation-link"
                  activeProps={{ className: 'conversation-link is-active' }}
                  title={conversation.title}
                >
                  {conversation.title}
                </Link>
                <button
                  type="button"
                  className="conversation-delete"
                  aria-label={`Supprimer la conversation : ${conversation.title}`}
                  title="Supprimer la conversation"
                  onClick={() => onDeleteConversation(conversation.id)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </nav>
        ) : null}
      </section>

      <div className="profile-footer">
        <div className="profile-user">
          <div className="profile-meta">
            <strong aria-label="Nom du profil">&nbsp;</strong>
            <span>Free plan</span>
          </div>
        </div>

        <button className="plan-button" type="button" onClick={() => setProfileOpen(true)}>
          <Settings2 size={14} />
          Profil
        </button>
      </div>
      </aside>
    </>
  )
}
