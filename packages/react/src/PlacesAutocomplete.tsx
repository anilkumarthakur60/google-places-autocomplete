import { forwardRef, useEffect, useId, useRef } from 'react'
import type { ChangeEvent, KeyboardEvent } from 'react'
import { usePlacesAutocomplete } from './usePlacesAutocomplete'
import {
  bindOutsideClose,
  type PlacesAutocompleteConfig,
} from '@anil-labs/google-places-autocomplete-core'

export interface PlacesAutocompleteProps extends Omit<
  PlacesAutocompleteConfig,
  'onSelect' | 'onError'
> {
  /** Controlled input value. Omit for uncontrolled usage driven entirely by the machine's own query state. */
  value?: string
  onValueChange?: (value: string) => void
  onSelect?: PlacesAutocompleteConfig['onSelect']
  onError?: PlacesAutocompleteConfig['onError']
  placeholder?: string
  className?: string
}

export const PlacesAutocomplete = forwardRef<HTMLInputElement, PlacesAutocompleteProps>(
  function PlacesAutocomplete(
    {
      value,
      onValueChange,
      onSelect,
      onError,
      placeholder = 'Search for an address…',
      className,
      ...config
    },
    ref,
  ) {
    const uid = useId()
    const rootRef = useRef<HTMLDivElement>(null)
    const { state, controller } = usePlacesAutocomplete({ ...config, onSelect, onError })

    // Lets a parent reset the field (e.g. on form submit) by writing to
    // `value`; the guard avoids re-issuing setQuery for a no-op change.
    useEffect(() => {
      if (value !== undefined && value !== state.query) controller.setQuery(value)
    }, [value, state.query, controller])

    useEffect(() => {
      if (!rootRef.current) return
      return bindOutsideClose(rootRef.current, () => controller.close())
    }, [controller])

    function handleChange(event: ChangeEvent<HTMLInputElement>): void {
      const next = event.target.value
      onValueChange?.(next)
      controller.setQuery(next)
    }

    function handleKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault()
          controller.moveActive(1)
          break
        case 'ArrowUp':
          event.preventDefault()
          controller.moveActive(-1)
          break
        case 'Enter':
          if (state.isOpen) {
            event.preventDefault()
            controller.selectActive()
          }
          break
        case 'Escape':
          controller.close()
          break
      }
    }

    return (
      <div className={['gpa-root', className].filter(Boolean).join(' ')} ref={rootRef}>
        <input
          ref={ref}
          className="gpa-input"
          type="text"
          role="combobox"
          aria-expanded={state.isOpen}
          aria-autocomplete="list"
          aria-controls={`${uid}-panel`}
          aria-activedescendant={
            state.isOpen && state.activeIndex >= 0
              ? `${uid}-option-${state.activeIndex}`
              : undefined
          }
          autoComplete="off"
          placeholder={placeholder}
          value={state.query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
        />
        {state.isOpen && (
          <div className="gpa-panel" id={`${uid}-panel`}>
            {state.status === 'loading' ? (
              <div className="gpa-status" role="status">
                Searching…
              </div>
            ) : state.suggestions.length === 0 ? (
              <div className="gpa-empty" role="status">
                No results found
              </div>
            ) : (
              <ul className="gpa-listbox" role="listbox">
                {state.suggestions.map((suggestion, index) => (
                  <li
                    key={suggestion.placeId}
                    id={`${uid}-option-${index}`}
                    className="gpa-option"
                    role="option"
                    aria-selected={index === state.activeIndex}
                    data-active={index === state.activeIndex}
                    onMouseDown={(event) => {
                      event.preventDefault()
                      controller.selectSuggestion(suggestion)
                    }}
                  >
                    <div className="gpa-option-main">{suggestion.mainText}</div>
                    {suggestion.secondaryText && (
                      <div className="gpa-option-secondary">{suggestion.secondaryText}</div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    )
  },
)
