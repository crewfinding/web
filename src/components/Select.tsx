import ReactSelect, { type Props as ReactSelectProps } from 'react-select'
import { useTranslation } from '../hooks/useTranslation'

// All colors are CSS custom properties, so the control re-themes with the
// .dark class — no theme prop threading needed.
export function Select<Option>(props: ReactSelectProps<Option, false>) {
  const { t } = useTranslation()
  return (
    <ReactSelect
      // Localized fallbacks for react-select's built-in English messages;
      // the props spread below lets callers override them.
      noOptionsMessage={() => t('common.select.noOptions')}
      loadingMessage={() => t('common.select.loading')}
      {...props}
      classNamePrefix="rs"
      styles={{
        control: (base, state) => ({
          ...base,
          backgroundColor: 'var(--color-surface-1)',
          borderColor: state.isFocused ? 'var(--color-primary)' : 'var(--color-hairline)',
          borderWidth: '1px',
          borderRadius: '8px',
          minHeight: '44px',
          boxShadow: state.isFocused ? '0 0 0 2px var(--color-primary-focus)' : 'none',
          '&:hover': {
            borderColor: 'var(--color-hairline-strong)',
          },
        }),
        singleValue: (base) => ({
          ...base,
          color: 'var(--color-ink)',
        }),
        input: (base) => ({
          ...base,
          color: 'var(--color-ink)',
        }),
        placeholder: (base) => ({
          ...base,
          color: 'var(--color-ink-subtle)',
        }),
        menu: (base) => ({
          ...base,
          backgroundColor: 'var(--color-surface-1)',
          border: '1px solid var(--color-hairline)',
          borderRadius: '8px',
          boxShadow: 'var(--shadow-card)',
          zIndex: 50,
        }),
        option: (base, state) => ({
          ...base,
          backgroundColor: state.isSelected
            ? 'var(--color-primary)'
            : state.isFocused
              ? 'var(--color-surface-2)'
              : 'transparent',
          color: state.isSelected ? 'var(--color-on-primary)' : 'var(--color-ink)',
          cursor: 'pointer',
          padding: '10px 12px',
        }),
        indicatorSeparator: () => ({ display: 'none' }),
        dropdownIndicator: (base) => ({
          ...base,
          color: 'var(--color-ink-subtle)',
          '&:hover': { color: 'var(--color-ink)' },
        }),
        noOptionsMessage: (base) => ({
          ...base,
          color: 'var(--color-ink-subtle)',
        }),
      }}
      theme={(rsTheme) => ({
        ...rsTheme,
        borderRadius: 8,
        colors: {
          ...rsTheme.colors,
          primary: 'var(--color-primary)',
          primary75: 'var(--color-primary-focus)',
          primary50: 'var(--color-primary-focus)',
          primary25: 'var(--color-surface-2)',
          neutral0: 'var(--color-surface-1)',
          neutral5: 'var(--color-surface-2)',
          neutral10: 'var(--color-surface-2)',
          neutral20: 'var(--color-hairline)',
          neutral30: 'var(--color-hairline)',
          neutral40: 'var(--color-ink-subtle)',
          neutral50: 'var(--color-ink-subtle)',
          neutral60: 'var(--color-ink)',
          neutral70: 'var(--color-ink)',
          neutral80: 'var(--color-ink)',
          neutral90: 'var(--color-ink)',
        },
      })}
    />
  )
}
