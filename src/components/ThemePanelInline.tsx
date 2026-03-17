/**
 * Inline-панель настройки темы (на странице, не оверлей).
 * Использует useThemeContext из Radix Themes.
 */
import { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Flex,
  Grid,
  Heading,
  Text,
  Theme,
  Tooltip,
  useThemeContext,
} from '@radix-ui/themes'
import { getMatchingGrayColor } from '@radix-ui/themes/helpers'

const ACCENT_COLORS = [
  'gray', 'gold', 'bronze', 'brown', 'yellow', 'amber', 'orange',
  'tomato', 'red', 'ruby', 'crimson', 'pink', 'plum', 'purple', 'violet',
  'iris', 'indigo', 'blue', 'cyan', 'teal', 'jade', 'green', 'grass', 'lime', 'mint', 'sky',
] as const

const GRAY_COLORS = ['auto', 'gray', 'mauve', 'slate', 'sage', 'olive', 'sand'] as const
const RADII = ['none', 'small', 'medium', 'large', 'full'] as const
const SCALING = ['90%', '95%', '100%', '105%', '110%'] as const
const PANEL_BACKGROUND = ['solid', 'translucent'] as const

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

interface ThemePanelInlineProps {
  onAppearanceChange?: (value: 'light' | 'dark') => void
}

export function ThemePanelInline({ onAppearanceChange }: ThemePanelInlineProps) {
  const theme = useThemeContext()
  const {
    appearance,
    onAppearanceChange: onThemeAppearanceChange,
    accentColor,
    onAccentColorChange,
    grayColor,
    onGrayColorChange,
    panelBackground,
    onPanelBackgroundChange,
    radius,
    onRadiusChange,
    scaling,
    onScalingChange,
  } = theme

  const resolvedGray = grayColor === 'auto' ? getMatchingGrayColor(accentColor) : grayColor
  const [localAppearance, setLocalAppearance] = useState<'light' | 'dark' | null>(
    appearance === 'inherit' ? null : appearance
  )
  const [copyState, setCopyState] = useState<'idle' | 'copying' | 'copied'>('idle')

  // Синхронизация с document.documentElement при appearance="inherit"
  useEffect(() => {
    if (appearance !== 'inherit') return
    const check = () => {
      const el = document.documentElement
      const body = document.body
      const isDark =
        el.classList.contains('dark') ||
        el.classList.contains('dark-theme') ||
        body.classList.contains('dark') ||
        body.classList.contains('dark-theme')
      setLocalAppearance(isDark ? 'dark' : 'light')
    }
    check()
    const obs = new MutationObserver(check)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    obs.observe(document.body, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [appearance])

  const effectiveAppearance = appearance === 'inherit' ? localAppearance : appearance

  const handleAppearanceChange = (v: 'light' | 'dark') => {
    if (appearance !== 'inherit') {
      onThemeAppearanceChange(v)
    } else if (onAppearanceChange) {
      onAppearanceChange(v)
    } else {
      setLocalAppearance(v)
      const el = document.documentElement
      el.style.colorScheme = v
      el.classList.remove('light', 'dark', 'light-theme', 'dark-theme')
      el.classList.add(v)
    }
  }

  async function handleCopyTheme() {
    const opts: Record<string, string | undefined> = {
      appearance: appearance === 'inherit' ? undefined : appearance,
      accentColor: accentColor === 'indigo' ? undefined : accentColor,
      grayColor: grayColor === 'auto' ? undefined : grayColor,
      panelBackground: panelBackground === 'translucent' ? undefined : panelBackground,
      radius: radius === 'medium' ? undefined : radius,
      scaling: scaling === '100%' ? undefined : scaling,
    }
    const attrs = Object.entries(opts)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => `${k}="${v}"`)
      .join(' ')
    const tag = attrs ? `<Theme ${attrs}>` : '<Theme>'
    setCopyState('copying')
    await navigator.clipboard.writeText(tag)
    setCopyState('copied')
    setTimeout(() => setCopyState('idle'), 2000)
  }

  return (
    <Box
      p="4"
      style={{
        borderRadius: 'var(--radius-4)',
        backgroundColor: 'var(--color-panel-solid)',
        border: '1px solid var(--gray-a6)',
      }}
    >
      <Theme radius="medium" scaling="100%">
        <Heading size="3" mb="4" className="rt-ThemePanelHeading">
          Тема
        </Heading>

        {/* Accent color */}
        <Text as="p" size="2" weight="medium" id="accent-color-title">
          Accent color
        </Text>
        <Grid columns="10" gap="2" mt="2" role="group" aria-labelledby="accent-color-title">
          {ACCENT_COLORS.map((c) => (
            <label
              key={c}
              className="rt-ThemePanelSwatch"
              style={{ backgroundColor: `var(--${c}-9)` }}
            >
              <Tooltip content={`${cap(c)}${accentColor === 'gray' && resolvedGray !== 'gray' ? ` (${cap(resolvedGray)})` : ''}`}>
                <input
                  className="rt-ThemePanelSwatchInput"
                  type="radio"
                  name="accentColor"
                  value={c}
                  checked={accentColor === c}
                  onChange={(e) => onAccentColorChange(e.target.value as typeof accentColor)}
                />
              </Tooltip>
            </label>
          ))}
        </Grid>

        {/* Gray color */}
        <Text as="p" size="2" weight="medium" id="gray-color-title" mt="4">
          Gray color
        </Text>
        <Grid columns="10" gap="2" mt="2" role="group" aria-labelledby="gray-color-title">
          {GRAY_COLORS.map((c) => (
            <Flex key={c} align="center" justify="center">
              <label
                className="rt-ThemePanelSwatch"
                style={{
                  backgroundColor: c === 'auto' ? `var(--${resolvedGray}-9)` : c === 'gray' ? 'var(--gray-9)' : `var(--${c}-9)`,
                  filter: c === 'gray' ? 'saturate(0)' : undefined,
                }}
              >
                <Tooltip content={`${cap(c)}${c === 'auto' ? ` (${cap(resolvedGray)})` : ''}`}>
                  <input
                    className="rt-ThemePanelSwatchInput"
                    type="radio"
                    name="grayColor"
                    value={c}
                    checked={grayColor === c}
                    onChange={(e) => onGrayColorChange(e.target.value as typeof grayColor)}
                  />
                </Tooltip>
              </label>
            </Flex>
          ))}
        </Grid>

        {/* Appearance */}
        <Text as="p" size="2" weight="medium" id="appearance-title" mt="4">
          Appearance
        </Text>
        <Grid columns="2" gap="2" mt="2" role="group" aria-labelledby="appearance-title">
          {(['light', 'dark'] as const).map((v) => (
            <label key={v} className="rt-ThemePanelRadioCard">
              <input
                className="rt-ThemePanelRadioCardInput"
                type="radio"
                name="appearance"
                value={v}
                checked={effectiveAppearance === v}
                onChange={() => handleAppearanceChange(v)}
              />
              <Flex align="center" justify="center" height="32px" gap="2">
                {v === 'light' ? (
                  <SunIcon />
                ) : (
                  <MoonIcon />
                )}
                <Text size="1" weight="medium">{cap(v)}</Text>
              </Flex>
            </label>
          ))}
        </Grid>

        {/* Radius */}
        <Text as="p" size="2" weight="medium" id="radius-title" mt="4">
          Radius
        </Text>
        <Grid columns="5" gap="2" mt="2" role="group" aria-labelledby="radius-title">
          {RADII.map((r) => (
            <Flex key={r} direction="column" align="center">
              <label className="rt-ThemePanelRadioCard">
                <input
                  className="rt-ThemePanelRadioCardInput"
                  type="radio"
                  name="radius"
                  id={`theme-panel-radius-${r}`}
                  value={r}
                  checked={radius === r}
                  onChange={(e) => onRadiusChange(e.target.value as typeof radius)}
                />
                <Theme asChild radius={r}>
                  <Box
                    m="3"
                    width="32px"
                    height="32px"
                    style={{
                      borderTopLeftRadius: r === 'full' ? '80%' : 'var(--radius-5)',
                      backgroundImage: 'linear-gradient(to bottom right, var(--accent-3), var(--accent-4))',
                      borderTop: '2px solid var(--accent-a8)',
                      borderLeft: '2px solid var(--accent-a8)',
                    }}
                  />
                </Theme>
              </label>
              <Box pt="2">
                <Text as="label" size="1" color="gray" htmlFor={`theme-panel-radius-${r}`} style={{ cursor: 'pointer' }}>
                  {cap(r)}
                </Text>
              </Box>
            </Flex>
          ))}
        </Grid>

        {/* Scaling */}
        <Text as="p" size="2" weight="medium" id="scaling-title" mt="4">
          Scaling
        </Text>
        <Grid columns="5" gap="2" mt="2" role="group" aria-labelledby="scaling-title">
          {SCALING.map((s) => (
            <label key={s} className="rt-ThemePanelRadioCard">
              <input
                className="rt-ThemePanelRadioCardInput"
                type="radio"
                name="scaling"
                value={s}
                checked={scaling === s}
                onChange={(e) => onScalingChange(e.target.value as typeof scaling)}
              />
              <Flex align="center" justify="center" height="32px">
                <Theme asChild scaling={s}>
                  <Flex align="center" justify="center">
                    <Text size="1" weight="medium">{s}</Text>
                  </Flex>
                </Theme>
              </Flex>
            </label>
          ))}
        </Grid>

        {/* Panel background */}
        <Flex mt="4" align="center" gap="2">
          <Text as="p" size="2" weight="medium" id="panel-background-title">
            Panel background
          </Text>
        </Flex>
        <Grid columns="2" gap="2" mt="2" role="group" aria-labelledby="panel-background-title">
          {PANEL_BACKGROUND.map((v) => (
            <label key={v} className="rt-ThemePanelRadioCard">
              <input
                className="rt-ThemePanelRadioCardInput"
                type="radio"
                name="panelBackground"
                value={v}
                checked={panelBackground === v}
                onChange={(e) => onPanelBackgroundChange(e.target.value as typeof panelBackground)}
              />
              <Flex align="center" justify="center" height="32px" gap="2">
                {v === 'solid' ? <SolidIcon /> : <TranslucentIcon />}
                <Text size="1" weight="medium">{cap(v)}</Text>
              </Flex>
            </label>
          ))}
        </Grid>

        <Button mt="4" style={{ width: '100%' }} onClick={handleCopyTheme}>
          {copyState === 'copied' ? 'Скопировано' : 'Скопировать тему'}
        </Button>
      </Theme>
    </Box>
  )
}

function SunIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M7.5 0C7.77614 0 8 0.223858 8 0.5V2.5C8 2.77614 7.77614 3 7.5 3C7.22386 3 7 2.77614 7 2.5V0.5C7 0.223858 7.22386 0 7.5 0ZM2.1967 2.1967C2.39196 2.00144 2.70854 2.00144 2.90381 2.1967L4.31802 3.61091C4.51328 3.80617 4.51328 4.12276 4.31802 4.31802C4.12276 4.51328 3.80617 4.51328 3.61091 4.31802L2.1967 2.90381C2.00144 2.70854 2.00144 2.39196 2.1967 2.1967ZM0.5 7C0.223858 7 0 7.22386 0 7.5C0 7.77614 0.223858 8 0.5 8H2.5C2.77614 8 3 7.77614 3 7.5C3 7.22386 2.77614 7 2.5 7H0.5ZM2.1967 12.8033C2.00144 12.608 2.00144 12.2915 2.1967 12.0962L3.61091 10.682C3.80617 10.4867 4.12276 10.4867 4.31802 10.682C4.51328 10.8772 4.51328 11.1938 4.31802 11.3891L2.90381 12.8033C2.70854 12.9986 2.39196 12.9986 2.1967 12.8033ZM12.5 7C12.2239 7 12 7.22386 12 7.5C12 7.77614 12.2239 8 12.5 8H14.5C14.7761 8 15 7.77614 15 7.5C15 7.22386 14.7761 7 14.5 7H12.5ZM10.682 4.31802C10.4867 4.12276 10.4867 3.80617 10.682 3.61091L12.0962 2.1967C12.2915 2.00144 12.608 2.00144 12.8033 2.1967C12.9986 2.39196 12.9986 2.70854 12.8033 2.90381L11.3891 4.31802C11.1938 4.51328 10.8772 4.51328 10.682 4.31802ZM8 12.5C8 12.2239 7.77614 12 7.5 12C7.22386 12 7 12.2239 7 12.5V14.5C7 14.7761 7.22386 15 7.5 15C7.77614 15 8 14.7761 8 14.5V12.5ZM10.682 10.682C10.8772 10.4867 11.1938 10.4867 11.3891 10.682L12.8033 12.0962C12.9986 12.2915 12.9986 12.608 12.8033 12.8033C12.608 12.9986 12.2915 12.9986 12.0962 12.8033L10.682 11.3891C10.4867 11.1938 10.4867 10.8772 10.682 10.682ZM5.5 7.5C5.5 6.39543 6.39543 5.5 7.5 5.5C8.60457 5.5 9.5 6.39543 9.5 7.5C9.5 8.60457 8.60457 9.5 7.5 9.5C6.39543 9.5 5.5 8.60457 5.5 7.5ZM7.5 4.5C5.84315 4.5 4.5 5.84315 4.5 7.5C4.5 9.15685 5.84315 10.5 7.5 10.5C9.15685 10.5 10.5 9.15685 10.5 7.5C10.5 5.84315 9.15685 4.5 7.5 4.5Z"
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
      />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M2.89998 0.499976C2.89998 0.279062 2.72089 0.0999756 2.49998 0.0999756C2.27906 0.0999756 2.09998 0.279062 2.09998 0.499976V1.09998H1.49998C1.27906 1.09998 1.09998 1.27906 1.09998 1.49998C1.09998 1.72089 1.27906 1.89998 1.49998 1.89998H2.09998V2.49998C2.09998 2.72089 2.27906 2.89998 2.49998 2.89998C2.72089 2.89998 2.89998 2.72089 2.89998 2.49998V1.89998H3.49998C3.72089 1.89998 3.89998 1.72089 3.89998 1.49998C3.89998 1.27906 3.72089 1.09998 3.49998 1.09998H2.89998V0.499976Z"
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
      />
      <path
        d="M8.54406 0.98184L8.24618 0.941586C8.03275 0.917676 7.90692 1.1655 8.02936 1.34194C8.17013 1.54479 8.29981 1.75592 8.41754 1.97445C8.91878 2.90485 9.20322 3.96932 9.20322 5.10022C9.20322 8.37201 6.82247 11.0878 3.69887 11.6097C3.45736 11.65 3.20988 11.6772 2.96008 11.6906C2.74563 11.702 2.62729 11.9535 2.77721 12.1072C2.84551 12.1773 2.91535 12.2458 2.98667 12.3128L3.05883 12.3795L3.31883 12.6045L3.50684 12.7532L3.62796 12.8433L3.81491 12.9742L3.99079 13.089C4.11175 13.1651 4.23536 13.2375 4.36157 13.3059L4.62496 13.4412L4.88553 13.5607L5.18837 13.6828L5.43169 13.7686C5.56564 13.8128 5.70149 13.8529 5.83857 13.8885C5.94262 13.9155 6.04767 13.9401 6.15405 13.9622C6.27993 13.9883 6.40713 14.0109 6.53544 14.0298L6.85241 14.0685L7.11934 14.0892C7.24637 14.0965 7.37436 14.1002 7.50322 14.1002C11.1483 14.1002 14.1032 11.1453 14.1032 7.50023C14.1032 7.25044 14.0893 7.00389 14.0623 6.76131L14.0255 6.48407C13.991 6.26083 13.9453 6.04129 13.8891 5.82642C13.8213 5.56709 13.7382 5.31398 13.6409 5.06881L13.5279 4.80132L13.4507 4.63542L13.3766 4.48666C13.2178 4.17773 13.0353 3.88295 12.8312 3.60423L12.6782 3.40352L12.4793 3.16432L12.3157 2.98361L12.1961 2.85951L12.0355 2.70246L11.8134 2.50184L11.4925 2.24191L11.2483 2.06498L10.9562 1.87446L10.6346 1.68894L10.3073 1.52378L10.1938 1.47176L9.95488 1.3706L9.67791 1.2669L9.42566 1.1846L9.10075 1.09489L8.83599 1.03486L8.54406 0.98184ZM10.4032 5.30023C10.4032 4.27588 10.2002 3.29829 9.83244 2.40604C11.7623 3.28995 13.1032 5.23862 13.1032 7.50023C13.1032 10.593 10.596 13.1002 7.50322 13.1002C6.63646 13.1002 5.81597 12.9036 5.08355 12.5522C6.5419 12.0941 7.81081 11.2082 8.74322 10.0416C8.87963 10.2284 9.10028 10.3497 9.34928 10.3497C9.76349 10.3497 10.0993 10.0139 10.0993 9.59971C10.0993 9.24256 9.84965 8.94373 9.51535 8.86816C9.57741 8.75165 9.63653 8.63334 9.6926 8.51332C9.88358 8.63163 10.1088 8.69993 10.35 8.69993C11.0403 8.69993 11.6 8.14028 11.6 7.44993C11.6 6.75976 11.0406 6.20024 10.3505 6.19993C10.3853 5.90487 10.4032 5.60464 10.4032 5.30023Z"
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
      />
    </svg>
  )
}

function SolidIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M0.877075 7.49988C0.877075 3.84219 3.84222 0.877045 7.49991 0.877045C11.1576 0.877045 14.1227 3.84219 14.1227 7.49988C14.1227 11.1575 11.1576 14.1227 7.49991 14.1227C3.84222 14.1227 0.877075 11.1575 0.877075 7.49988ZM7.49991 1.82704C4.36689 1.82704 1.82708 4.36686 1.82708 7.49988C1.82708 10.6329 4.36689 13.1727 7.49991 13.1727C10.6329 13.1727 13.1727 10.6329 13.1727 7.49988C13.1727 4.36686 10.6329 1.82704 7.49991 1.82704Z"
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
      />
    </svg>
  )
}

function TranslucentIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M0.877075 7.49988C0.877075 3.84219 3.84222 0.877045 7.49991 0.877045C11.1576 0.877045 14.1227 3.84219 14.1227 7.49988C14.1227 11.1575 11.1576 14.1227 7.49991 14.1227C3.84222 14.1227 0.877075 11.1575 0.877075 7.49988ZM7.49991 1.82704C4.36689 1.82704 1.82708 4.36686 1.82708 7.49988C1.82708 10.6329 4.36689 13.1727 7.49991 13.1727C10.6329 13.1727 13.1727 10.6329 13.1727 7.49988C13.1727 4.36686 10.6329 1.82704 7.49991 1.82704Z"
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
      />
    </svg>
  )
}
