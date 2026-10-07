import type { Block } from '../../document/blocks'
import { getPlainText } from '../../document/richtext'
import { RichTextCell } from '../edit/RichTextCell'
import { AnswerBox } from './AnswerBox'
import { labelStyle } from './blockStyles'

type RatingBlock = Extract<Block, { type: 'rating' }>
type Question = RatingBlock['questions'][number]
const SCALE = [1, 2, 3, 4, 5] as const

// Questions rated 1–5 with printable boxes; clicking a box while editing logs the client's answer.
export function RatingBlockView({ block, onChange }: { block: RatingBlock; onChange?: (next: Block) => void }) {
  const setQuestion = (idx: number, q: Question) => onChange?.({ ...block, questions: block.questions.map((it, i) => (i === idx ? q : it)) })
  const text = (value: string, placeholder: string, commit: (t: string) => void) =>
    onChange ? <RichTextCell key={value} text={value} placeholder={placeholder} onCommit={(next) => commit(getPlainText(next))} /> : value

  return (
    <section>
      <h3 style={{ ...labelStyle, margin: '0 0 6px' }}>{text(block.title, 'Section title', (title) => onChange?.({ ...block, title }))}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr repeat(5, 24px)', alignItems: 'center', rowGap: '6px' }}>
        <span />
        {SCALE.map((n) => (
          <span key={n} style={{ ...labelStyle, textAlign: 'center' }}>{n}</span>
        ))}
        {block.questions.map((q, idx) => (
          <div key={idx} style={{ display: 'contents' }}>
            <span>{text(q.text, 'Question', (t) => setQuestion(idx, { ...q, text: t }))}</span>
            {SCALE.map((n) => (
              <span key={n} style={{ textAlign: 'center' }}>
                <AnswerBox
                  label={`${q.text || 'Question ' + (idx + 1)}: ${n}`}
                  filled={q.answer === n}
                  onToggle={onChange && (() => setQuestion(idx, { ...q, answer: q.answer === n ? undefined : n }))}
                />
              </span>
            ))}
          </div>
        ))}
      </div>
      {onChange && (
        <button type="button" className="mt-1 text-[11px] text-muted-foreground underline print:hidden" onClick={() => onChange({ ...block, questions: [...block.questions, { text: '' }] })}>
          Add question
        </button>
      )}
    </section>
  )
}
