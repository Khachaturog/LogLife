import { Box, Flex, Text } from '@radix-ui/themes'
import { AppBar } from '@/components/AppBar'
import layoutStyles from '@/styles/layout.module.css'

type PageLoadingProps = {
  /** Заголовок страницы в AppBar (опционально) */
  title?: string
  /** Ссылка назад для AppBar, если нужна кнопка «Назад» */
  backHref?: string
  /** Обработчик для кнопки «Назад», если нет backHref */
  onBack?: () => void
  /** Дополнительные действия в AppBar (иконки, кнопки) */
  actions?: React.ReactNode
  /** Текст вместо дефолтного «Загрузка…» */
  message?: string
}

/**
 * Единое состояние загрузки для внутренних страниц.
 * Использует pageContainer + (опционально) AppBar и центрирует текст по вертикали.
 */
export function PageLoading({ title, backHref, onBack, actions, message }: PageLoadingProps) {
  return (
    <Box className={layoutStyles.pageContainer}>
      {(title || backHref || onBack || actions) && (
        <AppBar title={title} backHref={backHref} onBack={onBack} actions={actions} />
      )}
      <Flex
        direction="column"
        align="center"
        justify="center"
        style={{ minHeight: '40vh' }}
      >
        <Text size="2" color="gray">
          {message ?? 'Загружаю страницу…'}
        </Text>
      </Flex>
    </Box>
  )
}

