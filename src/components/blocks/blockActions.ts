import { addBlock, moveBlock, toggleBlockHidden, type Block, type BlockType } from '../../document/blocks'
import { canHideBlock, documentBlocks } from '../../document/documentBlocks'
import type { DocumentModel } from '../../document/types'

// Block structure edits on any document, committed through the caller's undo history.
export function blockActions(model: DocumentModel, commit: (next: DocumentModel) => void) {
  const blocks = documentBlocks(model)
  const setBlocks = (next: Block[]) => commit({ ...model, blocks: next })
  return {
    blocks,
    canHide: (type: BlockType) => canHideBlock(model, type),
    addBlock: (type: BlockType) => setBlocks(addBlock(blocks, type, null, crypto.randomUUID())),
    moveBlock: (id: string, delta: -1 | 1) => setBlocks(moveBlock(blocks, id, delta)),
    toggleHidden: (id: string) => {
      const block = blocks.find((b) => b.id === id)
      if (block && canHideBlock(model, block.type)) setBlocks(toggleBlockHidden(blocks, id))
    },
  }
}
