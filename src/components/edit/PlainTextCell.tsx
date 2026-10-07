import { getPlainText } from '../../document/richtext'
import { RichTextCell } from './RichTextCell'

interface PlainTextCellProps {
  value: string
  placeholder: string
  editable: boolean
  onCommit: (text: string) => void
}

// A plain-text field of a block: an inline editor that commits text without formatting, or the text itself.
export function PlainTextCell({ value, placeholder, editable, onCommit }: PlainTextCellProps) {
  if (!editable) return value
  return <RichTextCell key={value} text={value} placeholder={placeholder} onCommit={(next) => onCommit(getPlainText(next))} />
}
