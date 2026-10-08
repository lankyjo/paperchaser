import { addBlock, removeBlock, reorderBlocks, toggleBlockHidden, type Block, type BlockType } from '../../document/blocks'
import { canHideBlock, canRemoveBlock, documentBlocks } from '../../document/documentBlocks'
import type { DocumentModel } from '../../document/types'

// Block structure edits on any document, committed through the caller's undo history.
export function blockActions(model: DocumentModel, commit: (next: DocumentModel) => void) {
  const blocks = documentBlocks(model)
  const setBlocks = (next: Block[]) => commit({ ...model, blocks: next })
  return {
    blocks,
    canHide: (type: BlockType) => canHideBlock(model, type),
    addBlock: (type: BlockType) => setBlocks(addBlock(blocks, type, null, crypto.randomUUID())),
    canRemove: (type: BlockType) => canRemoveBlock(model, type),
    reorderBlocks: (from: number, to: number) => setBlocks(reorderBlocks(blocks, from, to)),
    removeBlock: (id: string) => {
      const block = blocks.find((b) => b.id === id)
      if (block && canRemoveBlock(model, block.type)) setBlocks(removeBlock(blocks, id))
    },
    toggleHidden: (id: string) => {
      const block = blocks.find((b) => b.id === id)
      if (block && canHideBlock(model, block.type)) setBlocks(toggleBlockHidden(blocks, id))
    },
  }
}
