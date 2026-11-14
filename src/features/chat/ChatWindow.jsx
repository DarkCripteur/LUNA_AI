import { useEffect, useRef, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { FileText, ImageIcon, Mic, MicOff, Plus, SendHorizontal, Volume2, VolumeX, X } from 'lucide-react'

function renderSimpleMarkdown(value) {
  const escaped = String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*(\*?[^*]+\*?)\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br />')

  return escaped
}

export function MessageList({ messages }) {
  const parentRef = useRef(null)
  const [speakingMessageId, setSpeakingMessageId] = useState(null)
  const speechAvailable = typeof window !== 'undefined'
    && 'speechSynthesis' in window
    && 'SpeechSynthesisUtterance' in window
  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 132,
    overscan: 6,
  })

  useEffect(() => {
    if (messages.length > 0) {
      virtualizer.scrollToIndex(messages.length - 1, { align: 'end' })
    }
  }, [messages.length, virtualizer])

  useEffect(() => () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
  }, [])

  const toggleSpeech = (message) => {
    if (!speechAvailable) return

    if (speakingMessageId === message.id) {
      window.speechSynthesis.cancel()
      setSpeakingMessageId(null)
      return
    }

    window.speechSynthesis.cancel()
    const utterance = new window.SpeechSynthesisUtterance(message.content)
    utterance.lang = 'fr-FR'
    utterance.onend = () => setSpeakingMessageId(null)
    utterance.onerror = () => setSpeakingMessageId(null)
    setSpeakingMessageId(message.id)
    window.speechSynthesis.speak(utterance)
  }

  if (messages.length === 0) {
    return (
      <div className="message-list" ref={parentRef} />
    )
  }

  return (
    <div className="message-list" ref={parentRef}>
      <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative', width: '100%' }}>
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const message = messages[virtualItem.index]
          return (
            <div
              key={message.id}
              className={`message-row ${message.role === 'user' ? 'is-user' : 'is-assistant'}`}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <div className="message-bubble">
                <div className="message-role">{message.role === 'user' ? 'Vous' : 'Luna'}</div>
                <div className="message-content" dangerouslySetInnerHTML={{ __html: renderSimpleMarkdown(message.content) }} />
                {message.role === 'assistant' && (
                  <div className="message-actions">
                    <button
                      type="button"
                      className="message-action"
                      aria-label={speakingMessageId === message.id ? 'Arrêter la lecture vocale' : 'Lire la réponse à voix haute'}
                      title={speechAvailable ? 'Lire la réponse à voix haute' : 'La lecture vocale n’est pas prise en charge par ce navigateur'}
                      aria-pressed={speakingMessageId === message.id}
                      disabled={!speechAvailable}
                      onClick={() => toggleSpeech(message)}
                    >
                      {speakingMessageId === message.id ? <VolumeX size={15} /> : <Volume2 size={15} />}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function FileAttachmentList({ files, onRemoveFile }) {
  if (!files.length) return null

  return (
    <div className="attachment-strip">
      {files.map((file) => (
        <div className="attachment-chip" key={file.id}>
          {file.type.startsWith('image/') ? <ImageIcon size={14} /> : <FileText size={14} />}
          <span>{file.name}</span>
          <button type="button" onClick={() => onRemoveFile(file.id)} aria-label={`Retirer ${file.name}`}>
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  )
}

export function ChatComposer({ onSendMessage, attachments, setAttachments }) {
  const [draft, setDraft] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [voiceStatus, setVoiceStatus] = useState('')
  const textareaRef = useRef(null)
  const recognitionRef = useRef(null)

  useEffect(() => () => {
    recognitionRef.current?.abort()
  }, [])

  const toggleVoiceInput = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setVoiceStatus('La dictée vocale n’est pas prise en charge par ce navigateur.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'fr-FR'
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript || '')
        .join(' ')
        .trim()

      if (transcript) {
        setDraft((current) => [current.trim(), transcript].filter(Boolean).join(' '))
        setVoiceStatus('')
      }
    }
    recognition.onerror = (event) => {
      const messages = {
        'not-allowed': 'Autorise l’accès au microphone pour utiliser la dictée vocale.',
        'service-not-allowed': 'Le service de reconnaissance vocale est bloqué.',
        'no-speech': 'Aucune parole détectée. Réessaie.',
        network: 'La reconnaissance vocale est indisponible pour le moment.',
      }
      setVoiceStatus(messages[event.error] || 'La reconnaissance vocale a échoué.')
      setIsListening(false)
      recognitionRef.current = null
    }
    recognition.onend = () => {
      setIsListening(false)
      recognitionRef.current = null
    }

    recognitionRef.current = recognition
    setVoiceStatus('Écoute en cours…')
    setIsListening(true)
    recognition.start()
  }

  const onAttachmentSelected = (event) => {
    const availableFiles = Array.from(event.target.files || [])
    const nextFiles = availableFiles.map((file) => ({
      id: `${file.name}-${file.lastModified}`,
      name: file.name,
      type: file.type,
    }))

    setAttachments((previous) => [...previous, ...nextFiles])
    event.target.value = ''
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const trimmedDraft = draft.trim()

    if (!trimmedDraft && attachments.length === 0) {
      return
    }

    onSendMessage(trimmedDraft || 'Voici les fichiers joints.', attachments)
    recognitionRef.current?.abort()
    recognitionRef.current = null
    setDraft('')
    setAttachments([])
    setIsListening(false)
    setVoiceStatus('')
  }

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`
    }
  }, [draft])

  return (
    <form className="composer" onSubmit={handleSubmit}>
      <FileAttachmentList
        files={attachments}
        onRemoveFile={(id) => setAttachments((current) => current.filter((file) => file.id !== id))}
      />

      <div className="composer-panel">
        <label className="upload-button" title="Ajouter un fichier">
          <Plus size={18} />
          <input type="file" multiple onChange={onAttachmentSelected} />
        </label>

        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          rows={1}
          placeholder="Posez votre question à Luna AI..."
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              handleSubmit(event)
            }
          }}
        />

        <button
          type="button"
          className={`voice-button ${isListening ? 'is-listening' : ''}`}
          onClick={toggleVoiceInput}
          aria-label={isListening ? 'Arrêter la dictée vocale' : 'Démarrer la dictée vocale'}
          aria-pressed={isListening}
          title={isListening ? 'Arrêter la dictée vocale' : 'Démarrer la dictée vocale'}
        >
          {isListening ? <MicOff size={17} /> : <Mic size={17} />}
        </button>

        <button type="submit" className="send-button" aria-label="Envoyer" disabled={!draft.trim() && attachments.length === 0}>
          <SendHorizontal size={18} />
        </button>
      </div>
      {voiceStatus && <p className="voice-status" role="status">{voiceStatus}</p>}
    </form>
  )
}

export function WelcomeScreen() {
  return (
    <div className="welcome-screen">
      <h1>Par où commencer&nbsp;?</h1>
    </div>
  )
}
