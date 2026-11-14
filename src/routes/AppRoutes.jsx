import { useEffect, useMemo, useState } from 'react'
import { Outlet, createRootRoute, createRoute, createRouter, useNavigate, useParams, useRouterState } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { PanelLeftOpen, UserRound } from 'lucide-react'
import { Sidebar } from '../features/sidebar/Sidebar'
import { ChatComposer, MessageList } from '../features/chat/ChatWindow'
import { ProfileModal } from '../features/profile/ProfileModal'
import { useUiStore } from '../store/uiStore'
import { buildConversationTitle, createConversationRecord, createEmptyConversationRecord, sortConversations, writeConversationList } from '../lib/storage'
import { useChats } from '../hooks/useChats'

function RootLayout() {
  const navigate = useNavigate()
  const currentPath = useRouterState({ select: (state) => state.location.pathname })
  const activeTheme = useUiStore((state) => state.theme)
  const setTheme = useUiStore((state) => state.setTheme)
  const { data: conversations = [] } = useChats()
  const queryClient = useQueryClient()

  useEffect(() => {
    document.body.dataset.theme = activeTheme
    setTheme(activeTheme)
  }, [activeTheme, setTheme])

  const handleCreateConversation = () => {
    const createdId = `chat-${Date.now()}`
    const nextConversations = sortConversations([createEmptyConversationRecord(createdId), ...conversations])
    queryClient.setQueryData(['chats'], nextConversations)
    writeConversationList(nextConversations)
    navigate({ to: `/c/${createdId}` })
  }

  const handleDeleteConversation = (id) => {
    const target = conversations.find((item) => item.id === id)
    if (!target || !window.confirm(`Supprimer la conversation « ${target.title} » ?`)) return

    const nextConversations = conversations.filter((item) => item.id !== id)
    queryClient.setQueryData(['chats'], nextConversations)
    writeConversationList(nextConversations)

    if (currentPath === `/c/${id}`) {
      navigate({ to: nextConversations[0] ? `/c/${nextConversations[0].id}` : '/' })
    }
  }

  const handleRenameConversation = (id) => {
    const target = conversations.find((item) => item.id === id)
    if (!target) return

    const updatedTitle = window.prompt('Renommer cette discussion', target.title)
    if (!updatedTitle) return

    const nextConversations = conversations.map((item) => (item.id === id ? { ...item, title: updatedTitle, updatedAt: new Date().toISOString() } : item))
    queryClient.setQueryData(['chats'], nextConversations)
    writeConversationList(nextConversations)
  }

  return (
    <div className={`app-shell ${activeTheme}`}>
      <Sidebar
        conversations={conversations}
        onCreateConversation={handleCreateConversation}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
      />
      <main className="workspace-panel">
        <Outlet />
      </main>
      <ProfileModal />
    </div>
  )
}

function HomePage() {
  const navigate = useNavigate()
  const sidebarOpen = useUiStore((state) => state.sidebarOpen)
  const toggleSidebar = useUiStore((state) => state.toggleSidebar)
  const setProfileOpen = useUiStore((state) => state.setProfileOpen)
  const { data: conversations = [] } = useChats()
  const queryClient = useQueryClient()
  const [attachments, setAttachments] = useState([])

  const createDirectConversation = (rawContent = 'Nouvelle discussion') => {
    const createdId = `chat-${Date.now()}`
    const conversation = createConversationRecord({ id: createdId, content: rawContent, files: attachments })
    const nextConversations = sortConversations([conversation, ...conversations])
    queryClient.setQueryData(['chats'], nextConversations)
    writeConversationList(nextConversations)
    navigate({ to: `/c/${createdId}` })
  }

  return (
    <div className="workspace-body welcome-layout">
      <header className="workspace-header top-actions">
        {!sidebarOpen && (
          <button
            className="icon-button workspace-sidebar-toggle"
            type="button"
            onClick={toggleSidebar}
            aria-label="Afficher la barre latérale"
            title="Afficher la barre latérale"
          >
            <PanelLeftOpen size={18} />
          </button>
        )}
        <button className="profile-shortcut" type="button" onClick={() => setProfileOpen(true)} aria-label="Ouvrir le profil" title="Profil">
          <UserRound size={17} />
        </button>
      </header>

      <div className="floating-composer compact">
        <ChatComposer
          onSendMessage={(content) => createDirectConversation(content)}
          attachments={attachments}
          setAttachments={setAttachments}
        />
      </div>
    </div>
  )
}

function ChatPage() {
  const { chatId } = useParams({ strict: false })
  const navigate = useNavigate()
  const sidebarOpen = useUiStore((state) => state.sidebarOpen)
  const toggleSidebar = useUiStore((state) => state.toggleSidebar)
  const setProfileOpen = useUiStore((state) => state.setProfileOpen)
  const queryClient = useQueryClient()
  const { data: conversations = [] } = useChats()
  const [attachments, setAttachments] = useState([])

  const conversation = useMemo(
    () => conversations.find((item) => item.id === chatId),
    [chatId, conversations],
  )

  useEffect(() => {
    if (!chatId) {
      if (conversations[0]) {
        navigate({ to: `/c/${conversations[0].id}` })
      }
      return
    }

    const latestConversations = queryClient.getQueryData(['chats']) || conversations
    if (latestConversations.some((item) => item.id === chatId)) return

    const nextConversations = sortConversations([
      createEmptyConversationRecord(chatId),
      ...latestConversations,
    ])
    queryClient.setQueryData(['chats'], nextConversations)
    writeConversationList(nextConversations)
  }, [chatId, conversations, navigate, queryClient])

  const persistConversations = (nextConversations) => {
    queryClient.setQueryData(['chats'], nextConversations)
    writeConversationList(nextConversations)
  }

  const handleSendMessage = (content, files) => {
    if (!conversation) {
      const createdId = `chat-${Date.now()}`
      const newConversation = createConversationRecord({ id: createdId, content, files })
      persistConversations(sortConversations([newConversation, ...conversations]))
      navigate({ to: `/c/${createdId}` })
      return
    }

    const nextMessages = [
      ...conversation.messages,
      { id: `msg-${Date.now()}`, role: 'user', content, createdAt: new Date().toISOString() },
    ]

    const nextConversations = sortConversations(
      conversations.map((item) =>
        item.id === conversation.id
          ? {
              ...item,
              title: buildConversationTitle(nextMessages),
              updatedAt: new Date().toISOString(),
              messages: nextMessages,
            }
          : item,
      ),
    )

    persistConversations(nextConversations)
  }

  return (
    <div className="workspace-body">
      {!sidebarOpen && (
        <button
          className="icon-button chat-sidebar-toggle"
          type="button"
          onClick={toggleSidebar}
          aria-label="Afficher la barre latérale"
          title="Afficher la barre latérale"
        >
          <PanelLeftOpen size={18} />
        </button>
      )}

      <button
        className="profile-shortcut chat-profile-shortcut"
        type="button"
        onClick={() => setProfileOpen(true)}
        aria-label="Ouvrir le profil"
        title="Profil"
      >
        <UserRound size={17} />
      </button>

      <MessageList messages={conversation?.messages || []} />

      <ChatComposer onSendMessage={handleSendMessage} attachments={attachments} setAttachments={setAttachments} />

    </div>
  )
}

const rootRoute = createRootRoute({ component: RootLayout })
const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: HomePage })
const chatRoute = createRoute({ getParentRoute: () => rootRoute, path: '/c/$chatId', component: ChatPage })
const routeTree = rootRoute.addChildren([indexRoute, chatRoute])

export function createAppRouter() {
  return createRouter({ routeTree })
}
