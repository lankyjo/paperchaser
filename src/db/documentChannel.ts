const CHANNEL = 'paperchaser-documents'

interface DocumentSaved {
  id: string
  rev: number
}

// Tells other tabs a document was saved; BroadcastChannel never echoes to the sender.
export function announceSave(message: DocumentSaved) {
  const channel = new BroadcastChannel(CHANNEL)
  channel.postMessage(message)
  channel.close()
}

export function listenForSaves(onSaved: (message: DocumentSaved) => void): () => void {
  const channel = new BroadcastChannel(CHANNEL)
  channel.onmessage = (event: MessageEvent<DocumentSaved>) => onSaved(event.data)
  return () => channel.close()
}
