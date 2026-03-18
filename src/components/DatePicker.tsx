import { useEffect, useRef, useState } from 'react'
import AirDatepicker from 'air-datepicker'
import localeRu from 'air-datepicker/locale/ru'
import { TextField } from '@radix-ui/themes'

/** Формат даты для API: YYYY-MM-DD */
const DATE_FORMAT = 'yyyy-MM-dd'

function parseDate(value: string): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const d = new Date(value + 'T12:00:00')
  return isNaN(d.getTime()) ? null : d
}

/** Определение iOS/Android для использования нативного date picker */
function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  // `userAgentData` есть не во всех типах браузеров/средах — делаем narrow через каст.
  const nav = navigator as Navigator & { userAgentData?: { mobile?: boolean } }
  if (nav.userAgentData?.mobile === true) return true
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
}

/**
 * DatePicker: на десктопе — Air Datepicker, на iOS/Android — нативный input type="date".
 * value и onChange в формате YYYY-MM-DD.
 */
export function DatePicker({
  value,
  onChange,
  minDate,
  maxDate,
  id,
  disabled,
  placeholder = 'Выберите дату',
}: {
  value: string
  onChange: (value: string) => void
  minDate?: string
  maxDate?: string
  id?: string
  disabled?: boolean
  placeholder?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const dpRef = useRef<AirDatepicker | null>(null)

  // Определение мобильного — после монтирования, чтобы избежать расхождений при SSR
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    setIsMobile(isMobileDevice())
  }, [])

  // Air Datepicker — только на десктопе (хуки вызываем всегда, чтобы соблюдать Rules of Hooks)
  useEffect(() => {
    if (isMobile || !inputRef.current || disabled) return

    const parsed = value ? parseDate(value) : null
    const dp = new AirDatepicker(inputRef.current, {
      locale: localeRu,
      dateFormat: DATE_FORMAT,
      selectedDates: parsed ? [parsed] : [],
      startDate: parsed ?? new Date(),
      minDate: minDate ? parseDate(minDate) ?? undefined : undefined,
      maxDate: maxDate ? parseDate(maxDate) ?? undefined : undefined,
      autoClose: true,
      onSelect: ({ formattedDate, date }) => {
        if (date && formattedDate) onChange(formattedDate as string)
      },
    })

    dpRef.current = dp
    return () => {
      dp.destroy()
      dpRef.current = null
    }
  }, [disabled, isMobile])

  // Синхронизация при изменении value извне (controlled)
  useEffect(() => {
    if (isMobile || !dpRef.current || disabled) return
    const parsed = value ? parseDate(value) : null
    dpRef.current.update({
      selectedDates: parsed ? [parsed] : [],
      minDate: minDate ? parseDate(minDate) ?? undefined : undefined,
      maxDate: maxDate ? parseDate(maxDate) ?? undefined : undefined,
    })
  }, [value, minDate, maxDate, disabled, isMobile])

  // На iOS/Android — нативный date picker, но в оболочке Radix TextField
  if (isMobile) {
    return (
      <TextField.Root
        size="3"
        type="date"
        id={id}
        value={value || ''}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
          onChange(event.target.value)
        }
        min={minDate}
        max={maxDate}
        disabled={disabled}
      />
    )
  }

  // На десктопе — Air Datepicker, инициализируем его на input
  return (
    <TextField.Root
      ref={inputRef}
      size="3"
      type="text"
      id={id}
      placeholder={placeholder}
      disabled={disabled}
    />
  )
}
