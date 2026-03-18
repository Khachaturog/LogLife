import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Box, CheckboxGroup, Flex, IconButton, RadioGroup, Select, SegmentedControl, Text, TextArea, TextField } from '@radix-ui/themes'
import { AppBar } from '@/components/AppBar'
import { PageLoading } from '@/components/PageLoading'
import { CheckIcon, MinusIcon, PlusIcon } from '@radix-ui/react-icons'
import { api } from '@/lib/api'
import { DatePicker } from '@/components/DatePicker'
import { DurationInput } from '@/components/DurationInput'
import { todayLocalISO, nowTimeLocal } from '@/lib/format-utils'
import type { BlockConfig, BlockRow, DeedWithBlocks, ValueJson } from '@/types/database'
import layoutStyles from '@/styles/layout.module.css'
import styles from './FillFormPage.module.css'

function getBlockOptions(block: BlockRow): { id: string; label: string }[] {
  const fromConfig = (block.config as BlockConfig | null)?.options
  if (fromConfig?.length) return fromConfig.map((o) => ({ id: o.id, label: o.label }))
  return []
}

/**
 * Страница добавления записи к делу.
 * Форма с полями по блокам дела (число, текст, выбор, шкала, да/нет, время и т.д.).
 */
export function FillFormPage() {
  const { id: deedId } = useParams<{ id: string }>()
  const navigate = useNavigate()

  // --- Состояние ---
  const [deed, setDeed] = useState<DeedWithBlocks | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [recordDate, setRecordDate] = useState(todayLocalISO())
  const [recordTime, setRecordTime] = useState(nowTimeLocal())
  const [answers, setAnswers] = useState<Record<string, ValueJson>>({})

  // --- Загрузка дела ---
  useEffect(() => {
    if (!deedId) return
    let cancelled = false
    setLoading(true)
    api.deeds
      .get(deedId)
      .then((data) => { if (!cancelled) setDeed(data ?? null) })
      .catch((e) => {
        if (!cancelled) {
          console.error(e?.message ?? 'Ошибка загрузки дела')
          navigate('/', { replace: true })
        }
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [deedId, navigate])

  const blocks = useMemo(() => deed?.blocks ?? [], [deed])

  const requiredMissing = useMemo(() => {
    for (const b of blocks) {
      if (!b.is_required) continue
      const v = answers[b.id]
      if (v === undefined) return true
      if ('number' in v && v.number === undefined) return true
      if ('text' in v && (v.text ?? '').trim() === '') return true
      if ('optionId' in v && !v.optionId) return true
      if ('optionIds' in v && (!v.optionIds || v.optionIds.length === 0)) return true
      if ('scaleValue' in v && (v.scaleValue === undefined || v.scaleValue < 1)) return true
      if ('yesNo' in v && v.yesNo === undefined) return true
      if ('durationHms' in v) {
        const hms = (v as { durationHms?: string }).durationHms ?? ''
        if (hms.length < 8 || !/^\d{2}:\d{2}:\d{2}$/.test(hms)) return true
      }
    }
    return false
  }, [blocks, answers])

  const canSubmit = !requiredMissing && !saving

  function setAnswer(blockId: string, value: ValueJson) {
    setAnswers((prev) => ({ ...prev, [blockId]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!deedId || !canSubmit) return
    setSaving(true)
    try {
      await api.deeds.createRecord(deedId, {
        record_date: recordDate,
        record_time: recordTime,
        answers: Object.keys(answers).length ? answers : undefined,
      })
      navigate(-1)
    } catch (err: unknown) {
      console.error(err instanceof Error ? err.message : 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  // --- Рендер ---
  if (loading) {
    return <PageLoading onBack={() => navigate(-1)} message="Загружаем форму…" />
  }

  if (!deed) {
    return (
      <Box p="4">
        <AppBar onBack={() => navigate(-1)} />
        <Text as="p" color="crimson">
          Дело не найдено.
        </Text>
      </Box>
    )
  }

  return (
    <Box className={layoutStyles.pageContainer} >
      <form onSubmit={handleSubmit}>
        
        <AppBar
          onBack={() => navigate(-1)}
          title={`${deed.emoji} ${deed.name}`}
          actions={
            <IconButton
              size="3"
              color="classic"
              radius='full'
              variant="classic"
              type="submit"
              disabled={!canSubmit}
              aria-label={saving ? 'Сохранение…' : 'Добавить запись'}
            >
              <CheckIcon width={18} height={18} />
            </IconButton>
          }
        />

        <Flex direction="column" >
          {deed.description && (
            <Text as="p" size="2" color="gray" >
              {deed.description}
            </Text>
          )}
        </Flex>
        <Flex direction="column" gap="4" >
          {/* Дата и время */}
          <Flex gap="4">
            <Flex direction="column" gap="1">
              <Text size="2" weight="medium">Дата</Text>
              <DatePicker value={recordDate} onChange={setRecordDate} />
            </Flex>
            <Flex direction="column" gap="1">
              <Text size="2" weight="medium">Время</Text>
              <TextField.Root
                size="3"
                type="time"
                value={recordTime}
                onChange={(e) => setRecordTime(e.target.value)}
              />
            </Flex>
          </Flex>

          {/* Поля по блокам */}
          {blocks.map((block) => (
            <Flex key={block.id} direction="column" gap="1">
              <Text size="2" weight="medium">
                {block.title}{block.is_required && ' *'}
              </Text>
              {block.block_type === 'number' && (
                <Flex gap="2" align="center" >
                  <TextField.Root 
                    style={{ flex: 1 }}
                    size="3"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    value={(answers[block.id] as { number?: number } | undefined)?.number ?? ''}
                    onChange={(e) =>
                      setAnswer(block.id, {
                        number:
                          e.target.value === ''
                            ? undefined
                            : Math.max(0, Number(e.target.value)),
                      })
                    }
                  />
                  <IconButton
                    size="3"
                    color="gray"
                    variant="classic"
                    radius='full'
                    type="button"
                    aria-label="Уменьшить значение"
                    onClick={() => {
                      const current =
                        (answers[block.id] as { number?: number } | undefined)?.number ?? 0
                      const next = Math.max(0, current - 1)
                      setAnswer(block.id, { number: next })
                    }}
                  >
                    <MinusIcon />
                  </IconButton>
                  <IconButton
                    size="3"
                    color="gray"
                    variant="classic"
                    radius='full'
                    type="button"
                    aria-label="Увеличить значение"
                    onClick={() => {
                      const current =
                        (answers[block.id] as { number?: number } | undefined)?.number ?? 0
                      setAnswer(block.id, { number: current + 1 })
                    }}
                  >
                    <PlusIcon />
                  </IconButton>
                </Flex>
              )}
              {block.block_type === 'text_short' && (
                <TextField.Root
                  size="3"
                  value={(answers[block.id] as { text?: string } | undefined)?.text ?? ''}
                  onChange={(e) => setAnswer(block.id, { text: e.target.value })}
                />
              )}
              {block.block_type === 'text_paragraph' && (
                <TextArea
                  value={(answers[block.id] as { text?: string } | undefined)?.text ?? ''}
                  onChange={(e) => setAnswer(block.id, { text: e.target.value })}
                  placeholder=""
                  resize="vertical"
                />
              )}
              {block.block_type === 'single_select' && (
                <Select.Root
                  size="3"
                  value={(answers[block.id] as { optionId?: string } | undefined)?.optionId || undefined}
                  onValueChange={(v) => setAnswer(block.id, { optionId: v })}
                >
                  <Select.Trigger placeholder="Выберите" />
                  <Select.Content>
                    {getBlockOptions(block).map((opt) => (
                      <Select.Item key={opt.id} value={opt.id}>{opt.label}</Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              )}
              {block.block_type === 'multi_select' && (
                <CheckboxGroup.Root
                  size="3"
                  value={
                    (answers[block.id] as { optionIds?: string[] } | undefined)?.optionIds ?? []
                  }
                  onValueChange={(nextValues) => {
                    // Сохраняем выбранные опции блока в ответе
                    setAnswer(block.id, { optionIds: nextValues })
                  }}
                >
                  <Flex direction="column" gap="1">
                    {getBlockOptions(block).map((opt) => (
                      <Text as="label" key={opt.id} size="1" className={styles.checkboxLabel}>
                        <CheckboxGroup.Item value={opt.id}>{opt.label}</CheckboxGroup.Item>
                      </Text>
                    ))}
                  </Flex>
                </CheckboxGroup.Root>
              )}
              {block.block_type === 'scale' && (
                <SegmentedControl.Root
                  value={
                    (answers[block.id] as { scaleValue?: number } | undefined)?.scaleValue?.toString()
                  }
                  onValueChange={(v) => setAnswer(block.id, { scaleValue: Number(v) })}
                  size="2"
                >
                  {Array.from(
                    { length: Math.min(10, Math.max(1, (block.config as BlockConfig | null)?.divisions ?? 5)) },
                    (_, i) => i + 1
                  ).map((n) => (
                    <SegmentedControl.Item key={n} value={String(n)}>
                      {n}
                    </SegmentedControl.Item>
                  ))}
                </SegmentedControl.Root>
              )}
              {block.block_type === 'duration' && (
                <DurationInput
                  value={(answers[block.id] as { durationHms?: string } | undefined)?.durationHms ?? ''}
                  onChange={(hms) => setAnswer(block.id, { durationHms: hms })}
                  placeholder="00:00:00"
                />
              )}
              {block.block_type === 'yes_no' && (
                <RadioGroup.Root
                  size="3"
                  value={
                    (answers[block.id] as { yesNo?: boolean } | undefined)?.yesNo === true
                      ? 'true'
                      : (answers[block.id] as { yesNo?: boolean } | undefined)?.yesNo === false
                        ? 'false'
                        : ''
                  }
                  onValueChange={(v) => setAnswer(block.id, { yesNo: v === 'true' })}
                >
                  <Flex gap="4">
                    <Text as="label" size="3" className={styles.checkboxLabel}>
                      <RadioGroup.Item value="true" />
                      Да
                    </Text>
                    <Text as="label" size="3" className={styles.checkboxLabel}>
                      <RadioGroup.Item value="false" />
                      Нет
                    </Text>
                  </Flex>
                </RadioGroup.Root>
              )}
            </Flex>
          ))}

          {requiredMissing && (
            <Text size="2" color="crimson">
              Заполните все обязательные поля.
            </Text>
          )}
        </Flex>
      </form>
    </Box>
  )
}
