import { useNumericCell, type NumericCellProps } from './useNumericCell'

// Filtered contentEditable for money (minor units) or quantity values.
export function NumericCell(props: NumericCellProps) {
  const { ref, focused, invalid, displayRaw, viewText, handleFocus, handleBlur, handleKeyDown, handlePaste } =
    useNumericCell(props)

  return (
    <div className="relative inline-block min-w-[4ch]">
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        inputMode="decimal"
        data-numeric-cell=""
        tabIndex={0}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        className={
          invalid
            ? 'rounded px-1 outline-none ring-[1.5px] ring-destructive'
            : focused
              ? 'rounded px-1 outline-none ring-2 ring-primary ring-offset-2 ring-offset-white'
              : 'rounded px-1 outline-none hover:ring-1 hover:ring-ring'
        }
        style={{ minWidth: '4ch', textAlign: 'right' }}
      >
        {focused ? displayRaw : viewText}
      </div>
      {invalid && (
        <div
          role="alert"
          className="absolute left-0 top-full z-10 mt-1 whitespace-nowrap rounded bg-destructive px-2 py-1 text-xs text-destructive-foreground shadow"
        >
          Enter a valid number.
        </div>
      )}
    </div>
  )
}
