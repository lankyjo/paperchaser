import { useState } from 'react'
import { documentsRepo } from '../../db/repos'
import { moneyDocumentsCsv } from '../../document/csvExport'
import { downloadFile } from '../../lib/downloadFile'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { todayIso } from '../../lib/todayIso'

const firstOfYear = () => `${new Date().getFullYear()}-01-01`

// Downloads sent invoices, receipts and credit notes for a date range as CSV.
export function AccountantExport() {
  const [from, setFrom] = useState(firstOfYear())
  const [to, setTo] = useState(todayIso())
  const exportCsv = async () => downloadFile(`paperchaser-${from}-to-${to}.csv`, moneyDocumentsCsv(await documentsRepo.listReal(), { from, to }), 'text/csv')
  return (
    <section aria-label="Export for your accountant" className="flex flex-col gap-3 rounded-lg border bg-card p-4">
      <h2 className="font-medium">Export for your accountant</h2>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Input aria-label="From" type="date" className="w-40" value={from} onChange={(e) => setFrom(e.target.value)} />
        <span>to</span>
        <Input aria-label="To" type="date" className="w-40" value={to} onChange={(e) => setTo(e.target.value)} />
        <Button onClick={() => void exportCsv()}>Download CSV</Button>
      </div>
    </section>
  )
}
