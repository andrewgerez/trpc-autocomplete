import { useEffect, useReducer, useRef, type JSX } from "react";
import styles from "./index.module.css";
import { api } from "~/utils/api";
import type { City } from "@prisma/client";
import { autocompleteReducer, initialAutocompleteState } from "./state";
import { useDebouncedValue } from "~/shared/hooks/use-debounced-value";

function Autocomplete(): JSX.Element {
  const [state, dispatch] = useReducer(
    autocompleteReducer,
    initialAutocompleteState,
  );
  const debouncedQuery = useDebouncedValue(state.query, 400);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: options, isLoading } = api.city.autocomplete.useQuery(
    { query: debouncedQuery },
    { enabled: debouncedQuery.length > 1 },
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        dispatch({ type: "CLOSE_DROPDOWN" });
      }
    }
    if (state.dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [state.dropdownOpen]);

  useEffect(() => {
    if (state.query.length > 1 && !state.selected) {
      dispatch({ type: "OPEN_DROPDOWN" });
    } else {
      dispatch({ type: "CLOSE_DROPDOWN" });
    }
  }, [state.query, state.selected]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: "SET_QUERY", payload: e.target.value });
  };

  const handleSelect = (option: Partial<City>) => {
    dispatch({ type: "SET_SELECTED", payload: option });
  };

  const handleInputFocus = () => {
    if (state.query.length > 1 && !state.selected) {
      dispatch({ type: "OPEN_DROPDOWN" });
    }
  };

  const closeDetails = () => {
    dispatch({ type: "SET_SELECTED", payload: null });
  };

  return (
    <div ref={containerRef} className={styles.autocompleteContainer}>
      <input
        className={styles.input}
        type="text"
        value={state.query}
        onChange={handleInputChange}
        placeholder="Enter the name of the city…"
        aria-label="Search city"
        autoComplete="off"
        onFocus={handleInputFocus}
      />
      {state.dropdownOpen && state.query.length > 1 && !state.selected && (
        <ul className={styles.optionsList}>
          {isLoading && <li className={styles.loading}>Loading…</li>}
          {!isLoading && options?.length === 0 && (
            <li className={styles.noResults}>No cities found.</li>
          )}
          {options?.map((option) => (
            <button
              key={option.id}
              className={styles.optionItem}
              onClick={() => handleSelect(option)}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSelect(option);
              }}
            >
              <span className={styles.cityName}>{option.city}</span>
              {option.population && (
                <span className={styles.population}>
                  Pop: {Number(option.population).toLocaleString()}
                </span>
              )}
            </button>
          ))}
        </ul>
      )}
      {state.selected && (
        <div className={styles.selectedCard}>
          <button
            className={styles.closeBtn}
            onClick={closeDetails}
            aria-label="Close details"
            type="button"
          >
            ×
          </button>
          <h4>{state.selected.city}</h4>
          <ul>
            <li>
              <b>Country:</b> {state.selected.country} ({state.selected.iso2})
            </li>
            <li>
              <b>State/Region:</b> {state.selected.adminName}
            </li>
            <li>
              <b>Latitude:</b> {state.selected.latitude}
            </li>
            <li>
              <b>Longitude:</b> {state.selected.longitude}
            </li>
            <li>
              <b>Population:</b>{" "}
              {Number(state.selected.population).toLocaleString()}
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}

export default Autocomplete;
