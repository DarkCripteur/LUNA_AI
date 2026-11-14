import { useQuery } from '@tanstack/react-query'
import { readConversationList } from '../lib/storage'

export function useChats() {
  return useQuery({
    queryKey: ['chats'],
    queryFn: readConversationList,
    initialData: readConversationList,
  })
}
