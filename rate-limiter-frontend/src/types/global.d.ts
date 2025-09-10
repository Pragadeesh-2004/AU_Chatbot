import "little-state-machine";

declare module "little-state-machine" {
  interface GlobalState {
    // Organization data
    organizations: any[];
    organizationMap: { [key: string]: string };
    selectedOrgId: string | null;
    currentAction: "view" | "edit" | null;

    // Assistant data
    assistants: any[];
    assistantMap: { [key: string]: string };
    assistantSearch: string;
    assistantPage: number;
    editAssistantId: string | null;
    assistantValues: any;
    assistantLoading: boolean;

    // Edit form data
    orgEditValues: any;
    editedOrgKeys: string[];
    assistantEditValuesArray: any[];
    editStep: "summary" | "org" | "assistants" | null;
    showAssistantBulkEdit: boolean;

    // UI state
    popupOpen: boolean;
    popupMessage: string;
    confirmOpen: boolean;
    confirmMessage: string;
    onConfirm: (() => void) | null;
    menuOpenId: string | null;
  }
}
