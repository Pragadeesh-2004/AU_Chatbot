import { GlobalState } from "little-state-machine";

// Organization Actions
export function setOrganizations(
  state: GlobalState,
  payload: { organizations: any[] }
) {
  return { ...state, organizations: payload.organizations };
}

export function setOrganizationMap(
  state: GlobalState,
  payload: { organizationMap: { [key: string]: string } }
) {
  return { ...state, organizationMap: payload.organizationMap };
}

export function setSelectedOrgId(
  state: GlobalState,
  payload: { orgId: string | null }
) {
  return { ...state, selectedOrgId: payload.orgId };
}

export function setCurrentAction(
  state: GlobalState,
  payload: { action: "view" | "edit" | null }
) {
  return { ...state, currentAction: payload.action };
}

// Assistant Actions
export function setAssistants(
  state: GlobalState,
  payload: { assistants: any[] }
) {
  return { ...state, assistants: payload.assistants };
}

export function setAssistantMap(
  state: GlobalState,
  payload: { assistantMap: { [key: string]: string } }
) {
  return { ...state, assistantMap: payload.assistantMap };
}

export function setAssistantSearch(
  state: GlobalState,
  payload: { search: string }
) {
  return { ...state, assistantSearch: payload.search };
}

export function setAssistantPage(
  state: GlobalState,
  payload: { page: number }
) {
  return { ...state, assistantPage: payload.page };
}

export function setEditAssistantId(
  state: GlobalState,
  payload: { id: string | null }
) {
  return { ...state, editAssistantId: payload.id };
}

export function setAssistantValues(
  state: GlobalState,
  payload: { values: any }
) {
  return { ...state, assistantValues: payload.values };
}

export function setAssistantLoading(
  state: GlobalState,
  payload: { loading: boolean }
) {
  return { ...state, assistantLoading: payload.loading };
}

// Organization Edit Actions
export function setOrgEditValues(state: GlobalState, payload: { values: any }) {
  return { ...state, orgEditValues: payload.values };
}

export function setEditedOrgKeys(
  state: GlobalState,
  payload: { keys: string[] }
) {
  return { ...state, editedOrgKeys: payload.keys };
}

export function setAssistantEditValuesArray(
  state: GlobalState,
  payload: { values: any[] }
) {
  return { ...state, assistantEditValuesArray: payload.values };
}

export function setEditStep(
  state: GlobalState,
  payload: { step: "summary" | "org" | "assistants" | null }
) {
  return { ...state, editStep: payload.step };
}

export function setShowAssistantBulkEdit(
  state: GlobalState,
  payload: { show: boolean }
) {
  return { ...state, showAssistantBulkEdit: payload.show };
}

// UI Actions
export function showPopup(state: GlobalState, payload: { message: string }) {
  return { ...state, popupOpen: true, popupMessage: payload.message || "" };
}

export function hidePopup(state: GlobalState) {
  return { ...state, popupOpen: false, popupMessage: "" };
}

export function showConfirm(
  state: GlobalState,
  payload: { message: string; onConfirm: () => void }
) {
  return {
    ...state,
    confirmOpen: true,
    confirmMessage: payload.message || "",
    onConfirm: payload.onConfirm,
  };
}

export function hideConfirm(state: GlobalState) {
  return { ...state, confirmOpen: false, confirmMessage: "", onConfirm: null };
}

export function setMenuOpen(
  state: GlobalState,
  payload: { menuId: string | null }
) {
  return { ...state, menuOpenId: payload.menuId };
}

// Reset Action
export function resetToHome(state: GlobalState) {
  return {
    ...state,
    selectedOrgId: null,
    currentAction: null,
    editStep: null,
    showAssistantBulkEdit: false,
    orgEditValues: {},
    editedOrgKeys: [],
    assistantEditValuesArray: [],
    assistantSearch: "",
    assistantPage: 1,
    editAssistantId: null,
    menuOpenId: null,
  };
}
