import type { City } from "@prisma/client";

type State = {
  query: string;
  selected: Partial<City> | null;
  dropdownOpen: boolean;
};

type Action =
  | { type: "SET_QUERY"; payload: string }
  | { type: "SET_SELECTED"; payload: Partial<City> | null }
  | { type: "OPEN_DROPDOWN" }
  | { type: "CLOSE_DROPDOWN" }
  | { type: "RESET" };

export const initialAutocompleteState: State = {
  query: "",
  selected: null,
  dropdownOpen: false,
};

export function autocompleteReducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_QUERY":
      return { ...state, query: action.payload, selected: null };
    case "SET_SELECTED":
      return { ...state, selected: action.payload, dropdownOpen: false };
    case "OPEN_DROPDOWN":
      return { ...state, dropdownOpen: true };
    case "CLOSE_DROPDOWN":
      return { ...state, dropdownOpen: false };
    case "RESET":
      return initialAutocompleteState;
    default:
      return state;
  }
}
