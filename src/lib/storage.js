export const STORAGE_KEY = 'luna-ai-conversations-v1'

export function readConversationList() {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function writeConversationList(conversations) {
  if (typeof window === 'undefined') {
    return false
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations))
    return true
  } catch {
    return false
  }
}

export function buildConversationTitle(messages = []) {
  const firstUserMessage = messages.find((message) => message.role === 'user')
  const text = firstUserMessage?.content || 'Nouvelle discussion'
  return text.length > 44 ? `${text.slice(0, 44)}...` : text
}

export function sortConversations(conversations) {
  return [...conversations].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
}

export function createEmptyConversationRecord(id, createdAt = new Date().toISOString()) {
  return {
    id,
    title: 'Nouvelle discussion',
    updatedAt: createdAt,
    messages: [],
  }
}

export function createConversationRecord({ id, content, createdAt = new Date().toISOString() }) {
  const message = {
    id: `${id}-user`,
    role: 'user',
    content,
    createdAt,
  }

  return {
    id,
    title: buildConversationTitle([message]),
    updatedAt: new Date().toISOString(),
    messages: [message],
  }
}
