import { createStore } from "little-state-machine";

createStore({
  // Organization data
  organizations: [],
  organizationMap: {},
  selectedOrgId: null,
  currentAction: null,

  // Assistant data
  assistants: [],
  assistantMap: {},
  assistantSearch: "",
  assistantPage: 1,
  editAssistantId: null,
  assistantValues: {},
  assistantLoading: false,

  // Edit form data
  orgEditValues: {},
  editedOrgKeys: [],
  assistantEditValuesArray: [],
  editStep: null,
  showAssistantBulkEdit: false,

  // UI state
  popupOpen: false,
  popupMessage: "",
  confirmOpen: false,
  confirmMessage: "",
  onConfirm: null,
  menuOpenId: null,
});
