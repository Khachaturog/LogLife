import { Link } from 'react-router-dom'
import { Avatar, Badge, Card, Flex, IconButton, Text } from '@radix-ui/themes'
import { PlusIcon } from '@radix-ui/react-icons'
import type { DeedWithBlocks } from '@/types/database'
import type { RecordRow, RecordAnswerRow } from '@/types/database'
import { getDeedDisplayNumbers } from '@/lib/deed-utils'

type DeedCardProps = {
  deed: DeedWithBlocks
  records: (RecordRow & { record_answers?: RecordAnswerRow[] })[]
}

/**
 * Карточка дела в списке.
 * Левая часть (название + статистика) — ссылка на просмотр дела.
 * Кнопка + — ссылка на форму добавления записи.
 */
export function DeedCard({ deed, records }: DeedCardProps) {
  // today/total зависят от типа блоков: см. getDeedDisplayNumbers в deed-utils
  const { today, total } = getDeedDisplayNumbers(deed.blocks ?? [], records)

  return (
    <Card asChild>
        {/* Кликабельная область: переход на /deeds/:id */}
        <Link
          to={`/deeds/${deed.id}`}
        >
          <Flex direction="row" justify="between" align="center">
          <Flex align="start" gap="2">
            <Avatar
              size="1"
              radius="large"
              color="gray"
              variant="soft"
              fallback={deed.emoji || '📋'}
            />
            <Flex direction="column" gap="1">
              <Flex align="center" gapX="2" gapY="0" wrap="wrap">
                <Text weight="medium">{deed.name}</Text>
                {deed.category && (
                  <Badge size="1" color="gray" radius="large" variant="surface">
                    {deed.category}
                  </Badge>
                )}
              </Flex>
              <Text as="p" size="2" color="gray">
                {today} сегодня · {total} всего
              </Text>
            </Flex>
          </Flex>
        {/* Кнопка добавления записи: переход на /deeds/:id/fill */}
        <IconButton
          size="3"
          variant="surface"
          radius="large"
          asChild
          title="Добавить запись"
          aria-label="Добавить запись"
          >
          <Link to={`/deeds/${deed.id}/fill`}>
            <PlusIcon />
          </Link>
        </IconButton>
            </Flex>
          </Link>
    </Card>
  )
}
