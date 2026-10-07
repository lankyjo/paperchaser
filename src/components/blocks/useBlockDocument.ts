import { addBlock, moveBlock, toggleBlockHidden, updateBlock, type Block, type BlockType } from '../../document/blocks'
import type { DocumentModel } from '../../document/types'
import { useHistory } from '../edit/useHistory'

// Undoable, autosaved edits to a block document: change, add, move and hide blocks.
export function useBlockDocument(initial: DocumentModel) {
  const history = useHistory(initial)
  const { model, commit } = history
  const blocks = model.blocks ?? []
  const setBlocks = (next: Block[]) => commit({ ...model, blocks: next })

  return {
    history,
    blocks,
    changeBlock: (block: Block) => setBlocks(updateBlock(blocks, block)),
    addBlock: (type: BlockType, afterId: string | null) => setBlocks(addBlock(blocks, type, afterId, crypto.randomUUID())),
    moveBlock: (id: string, delta: -1 | 1) => setBlocks(moveBlock(blocks, id, delta)),
    toggleHidden: (id: string) => setBlocks(toggleBlockHidden(blocks, id)),
  }
}
