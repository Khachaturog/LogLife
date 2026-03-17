import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Box, DropdownMenu, Flex, Heading, IconButton, Text } from '@radix-ui/themes'
import { AppBar } from '@/components/AppBar'
import { PageLoading } from '@/components/PageLoading'
import { DotsHorizontalIcon, Pencil1Icon, PlusIcon, TrashIcon } from '@radix-ui/react-icons'
import { api } from '@/lib/api'
import { RecordCard } from '@/components/RecordCard'
import type { DeedWithBlocks, RecordRow } from '@/types/database'
import layoutStyles from '@/styles/layout.module.css'
import styles from './DeedViewPage.module.css'
import { formatDate, pluralRecords, pluralDays } from '@/lib/format-utils'
import { currentStreak, maxStreak, workdayWeekendCounts } from '@/lib/deed-analytics'

/**
 * Страница просмотра дела.
 * Показывает заголовок, описание, аналитику (стрики, рабочие/выходные дни) и историю записей по датам.
 */
export function DeedViewPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  // --- Состояние ---
  const [deed, setDeed] = useState<DeedWithBlocks | null>(null)
  const [records, setRecords] = useState<(RecordRow & { record_answers?: { block_id: string; value_json: unknown }[] })[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // --- Загрузка дела и записей ---
  useEffect(() => {
    if (!id) return
    let cancelled = false
    Promise.all([api.deeds.get(id), api.deeds.records(id)])
      .then(([deedData, recordsData]) => {
        if (!cancelled) {
          setDeed(deedData ?? null)
          setRecords(recordsData)
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message ?? 'Ошибка загрузки')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [id])

  // --- Удаление дела (с подтверждением) ---
  const handleDelete = async () => {
    if (!id) return
    if (!confirm('Удалить дело? Все записи также будут удалены.')) return
    try {
      await api.deeds.delete(id)
      navigate('/')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Не удалось удалить дело'
      setError(msg)
    }
  }

  // --- Вычисляемые данные ---
  // Записи сгруппированы по дате, сортировка: новые сверху
  const byDate = useMemo(() => {
    const sorted = [...records].sort((a, b) => {
      const d = b.record_date.localeCompare(a.record_date)
      if (d !== 0) return d
      return (b.record_time ?? '').toString().localeCompare((a.record_time ?? '').toString())
    })
    const map = new Map<string, typeof records>()
    for (const r of sorted) {
      const date = r.record_date
      if (!map.has(date)) map.set(date, [])
      map.get(date)!.push(r)
    }
    return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a))
  }, [records])

  // Аналитика: стрики и распределение по рабочим/выходным (только если есть записи)
  const analytics = useMemo(() => {
    if (records.length === 0) return null
    return {
      currentStreak: currentStreak(records),
      maxStreak: maxStreak(records),
      workdayWeekend: workdayWeekendCounts(records),
    }
  }, [records])

  // --- Рендер состояний загрузки и ошибки ---
  if (loading) {
    return <PageLoading backHref="/" title="Дело" />
  }

  if (error || !deed) {
    return (
      <Box p="4">
        <AppBar backHref="/" />
        <Text as="p" color="crimson" mt="2">
          {error ?? 'Дело не найдено'}
        </Text>
      </Box>
    )
  }

  // --- Основной контент ---
  return (
    <Box className={layoutStyles.pageContainer}>
      <AppBar
        backHref="/"
        title={`${deed.emoji} ${deed.name}`}
        actions={
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              <IconButton variant="classic" color="gray" size="3" radius="full" aria-label="Действия">
                <DotsHorizontalIcon width={18} height={18} />
              </IconButton>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content>
              <DropdownMenu.Item asChild>
                <Link to={`/deeds/${id}/fill`}>
                  <PlusIcon /> Добавить
                </Link>
              </DropdownMenu.Item>
              <DropdownMenu.Item asChild>
                <Link to={`/deeds/${id}/edit`}>
                  <Pencil1Icon /> Редактировать
                </Link>
              </DropdownMenu.Item>
              <DropdownMenu.Separator />
              <DropdownMenu.Item color="red" onSelect={handleDelete}>
                <TrashIcon /> Удалить
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        }
      />

      {/* Категория и описание */}
      {deed.category && (
        <Text as="p" size="2" color="gray" mb="2">
          Категория: {deed.category}
        </Text>
      )}
      {deed.description && (
        <Text as="p" size="2" mb="4">
          {deed.description}
        </Text>
      )}

      {/* Блок аналитики: стрики и рабочие/выходные дни */}
      {analytics && (
        <Box py="3" className={styles.analyticsSection}>
          <Heading size="3" mb="2">
            Аналитика
          </Heading>
          <Text as="p" size="2" mb="1">
            Текущий стрик: <Text weight="bold">{analytics.currentStreak}</Text> {pluralDays(analytics.currentStreak)},
            максимальный стрик: <Text weight="bold">{analytics.maxStreak}</Text> {pluralDays(analytics.maxStreak)}.
          </Text>
          <Text as="p" size="2">
            В рабочие дни: {pluralRecords(analytics.workdayWeekend.workday)}, в выходные:{' '}
            {pluralRecords(analytics.workdayWeekend.weekend)}.
          </Text>
        </Box>
      )}

      {/* История записей по датам */}
      <Heading size="3" mt="4" mb="2">
        История — {pluralRecords(records.length)}
      </Heading>

      {records.length === 0 ? (
        <Text as="p" color="gray">
          Пока нет записей. Добавьте первую.
        </Text>
      ) : (
        <Flex direction="column" gap="4">
          {byDate.map(([date, dayRecords]) => (
            <Box key={date}>
              <Text as="p" weight="medium" size="2" mb="2">
                {formatDate(date)} ({dayRecords.length})
              </Text>
              <Flex direction="column" gap="2">
                {dayRecords.map((rec) => (
                  <RecordCard
                    key={rec.id}
                    record={rec}
                    blocks={deed.blocks ?? []}
                    avatarFallback={deed.emoji}
                  />
                ))}
              </Flex>
            </Box>
          ))}
        </Flex>
      )}
    </Box>
  )
}
