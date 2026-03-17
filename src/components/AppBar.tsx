import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Box, Flex, IconButton, Text } from '@radix-ui/themes'
import { ArrowLeftIcon } from '@radix-ui/react-icons'
import styles from './AppBar.module.css'

/** При скролле страницы — true (для обводки и тени AppBar) */
function useScrolled(): boolean {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 5)
    handleScroll() // начальное состояние
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  return scrolled
}

export interface AppBarProps {
  /** URL для кнопки «Назад» (Link) */
  backHref?: string
  /** Обработчик для кнопки «Назад» (Button с onClick), если нет backHref */
  onBack?: () => void
  /** Заголовок в центре */
  title?: string
  /** Кнопки и другие действия справа */
  actions?: React.ReactNode
}

/**
 * Верхняя панель для внутренних страниц и форм.
 * Показывает кнопку «Назад» и опционально заголовок.
 */
export function AppBar({ backHref, onBack, title, actions }: AppBarProps) {
  const showBack = backHref != null || onBack != null
  const scrolled = useScrolled()

  return (
    <Box className={`${styles.appBar} ${scrolled ? styles.appBarScrolled : ''}`} asChild>
      <header>
        <Flex align="center" gap="3" className={styles.row}>
          {/* Контейнер «Назад» рендерим только при наличии кнопки — иначе gap смещает заголовок */}
          {showBack && (
            <Flex align="center" style={{ flexShrink: 0 }}>
              {backHref != null ? (
                <IconButton 
                variant="classic"
                color="gray" 
                radius='full' 
                size="3" 
                asChild aria-label="Назад">
                  <Link to={backHref}>
                    <ArrowLeftIcon width={18} height={18} />
                  </Link>
                </IconButton>
              ) : (
                <IconButton 
                variant="classic"
                color="gray" 
                radius='full' 
                size="3" 
                onClick={onBack} 
                aria-label="Назад">
                  <ArrowLeftIcon width={18} height={18} />
                </IconButton>
              )}
            </Flex>
          )}
          {title && (
            <Text size="5" weight="medium" className={styles.title} truncate>
              {title}
            </Text>
          )}
          {actions && (
            <Flex align="center" gap="2" style={{ flexShrink: 0 }} className={styles.actions}>
              {actions}
            </Flex>
          )}
        </Flex>
      </header>
    </Box>
  )
}
