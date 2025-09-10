"use client";

import React, { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSearchPagination } from "@/hooks/useSearchPagination";
import { useRateLimitState } from "@/hooks/useRateLimitState";

import SearchInput from "@/components/rate-limit/SearchInput";
import DialogPopup from "@/components/rate-limit/DialogPopup";
import ConfirmDialog from "@/components/rate-limit/ConfirmDialog";
import TablePagination from "@/components/rate-limit/TablePagination";
import OrganisationTable from "@/components/rate-limit/OrganisationTable";
import PageHeader from "@/components/rate-limit/PageHeader";
import OrganisationDetails from "@/components/rate-limit/OrganisationDetails";
import AssistantSection from "@/components/rate-limit/AssistantSection";
import AssistantBulkEditForm from "@/components/rate-limit/AssistantBulkEditForm";
import OrganisationForm from "@/components/rate-limit/OrganisationForm";

const RATE_LIMIT_ORG_API = "http://localhost:3000/rate-limit/organisation";
const ORG_API = "http://localhost:3000/organisation";

const OrganisationRateLimitPage = () => {
  const { state, actions } = useRateLimitState();
  const menuRef = useRef<HTMLDivElement | null>(null);

  
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const orgSearchResults = useSearchPagination(
    (state.organizations || []).map((org: any) => ({
      ...org,
      searchableText: (state.organizationMap || {})[org.org_id] || org.org_id
    })), 
    search, 
    currentPage, 
    10, 
    ['searchableText']
  );

  const assistantSearchResults = useSearchPagination(
    (state.assistants || []).map((assistant: any) => ({
      ...assistant,
      searchableText: (state.assistantMap || {})[assistant.assistant_id || assistant._id] || ""
    })), 
    state.assistantSearch || "", 
    state.assistantPage || 1, 
    10, 
    ['searchableText']
  );

  useEffect(() => setCurrentPage(1), [search]);
  
  useEffect(() => {
    fetchAllData();
    fetchOrganisationMap();
  }, []);
  
  useEffect(() => {
    if (state.selectedOrgId) fetchAssistantsMap(state.selectedOrgId);
  }, [state.selectedOrgId]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        actions.setMenuOpen({ menuId: null });
      }
    }
    if (state.menuOpenId) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [state.menuOpenId]);

  const ensureOrganisationRateLimit = async (orgId: string) => {
    try {
      const checkRes = await fetch(`${RATE_LIMIT_ORG_API}/${orgId}`);
      if (checkRes.ok) return;

      const createBody = {
        org_id: orgId,
        max_input_token: 0,
        max_output_token: 0,
        file_count: 0,
        file_size: 0,
        knowledge_base_count: 0,
        knowledge_base_index_size: 0,
        active_assistant_count: 0
      };
      
      await fetch(RATE_LIMIT_ORG_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createBody),
      });
    } catch (err) {
      console.error("Failed to ensure organisation rate limit:", err);
    }
  };

  const ensureAssistantRateLimit = async (orgId: string, assistantId: string) => {
    try {
      const checkRes = await fetch(`${RATE_LIMIT_ORG_API}/${orgId}/assistant/${assistantId}`);
      if (checkRes.ok) return;

      const createBody = {
        assistant_id: assistantId,
        input_token_per_user: 0,
        input_token_per_assistant: 0,
        output_token_per_user: 0,
        output_token_per_assistant: 0,
        file_count: 0,
        file_size: 0,
        knowledge_base_index_size: 0
      };
      
      await fetch(`${RATE_LIMIT_ORG_API}/${orgId}/assistant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createBody),
      });
    } catch (err) {
      console.error("Failed to ensure assistant rate limit:", err);
    }
  };

  const fetchAllData = async () => {
    try {
      const res = await fetch(`${RATE_LIMIT_ORG_API}?page=1&limit=1000`);
      const data = await res.json();
      actions.setOrganizations({ organizations: data.data || [] });
    } catch (err) {
      console.error("Failed to fetch organisation data:", err);
      actions.showPopup({ message: "Failed to fetch organisation data." });
    }
  };

  const fetchOrganisationMap = async () => {
    try {
      const res = await fetch(ORG_API);
      const data = await res.json();
      const map: { [key: string]: string } = {};
      
      for (const org of data) {
        map[org._id] = org.name;
        await ensureOrganisationRateLimit(org._id);
      }
      
      actions.setOrganizationMap({ organizationMap: map });
    } catch {
      actions.setOrganizationMap({ organizationMap: {} });
    }
  };

  const fetchAllAssistants = async (orgId: string) => {
    try {
      const res = await fetch(`${RATE_LIMIT_ORG_API}/${orgId}/assistant?page=1&limit=1000`);
      const data = await res.json();
      actions.setAssistants({ assistants: data.data || [] });
    } catch (err) {
      console.error("Failed to fetch assistant data:", err);
      actions.showPopup({ message: "Failed to fetch assistant data." });
      actions.setAssistants({ assistants: [] });
    }
  };

  const fetchAssistantsMap = async (orgId: string) => {
    try {
      const res = await fetch(`${ORG_API}/${orgId}/assistants`);
      const assistants = await res.json();
      const map: { [key: string]: string } = {};
      
      for (const assistant of assistants) {
        map[assistant._id] = assistant.name;
        await ensureAssistantRateLimit(orgId, assistant._id);
      }
      
      actions.setAssistantMap({ assistantMap: map });
      fetchAllAssistants(orgId);
    } catch {
      actions.setAssistantMap({ assistantMap: {} });
    }
  };

  const handleAssistantEdit = (assistant: any) => {
    const values = {
      assistant_id: assistant.assistant_id ?? assistant._id ?? "",
      input_token_per_user: String(assistant.input_token_per_user ?? ""),
      input_token_per_assistant: String(assistant.input_token_per_assistant ?? ""),
      output_token_per_user: String(assistant.output_token_per_user ?? ""),
      output_token_per_assistant: String(assistant.output_token_per_assistant ?? ""),
      file_count: String(assistant.file_count ?? ""),
      file_size: String(assistant.file_size ?? ""),
      knowledge_base_index_size: String(assistant.knowledge_base_index_size ?? ""),
    };
    actions.setAssistantValues({ values });
    actions.setEditAssistantId({ id: assistant.assistant_id ?? assistant._id });
  };

  const handleAssistantSave = async (assistant: any) => {
    actions.setAssistantLoading({ loading: true });
    try {
      if (!state.selectedOrgId) {
        actions.showPopup({ message: "No organisation selected." });
        return;
      }
      
      const patchBody = {
        input_token_per_user: Number(state.assistantValues?.input_token_per_user || 0),
        input_token_per_assistant: Number(state.assistantValues?.input_token_per_assistant || 0),
        output_token_per_user: Number(state.assistantValues?.output_token_per_user || 0),
        output_token_per_assistant: Number(state.assistantValues?.output_token_per_assistant || 0),
        file_count: Number(state.assistantValues?.file_count || 0),
        file_size: Number(state.assistantValues?.file_size || 0),
        knowledge_base_index_size: Number(state.assistantValues?.knowledge_base_index_size || 0),
      };
      
      const res = await fetch(`${RATE_LIMIT_ORG_API}/${state.selectedOrgId}/assistant/${assistant.assistant_id || assistant._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patchBody),
      });
      
      const json = await res.json();
      if (!res.ok) {
        let assistantName = (state.assistantMap || {})[assistant.assistant_id || assistant._id] || (assistant.assistant_id || assistant._id);
        let errorMsg = json.message || "Failed to update assistant";
        errorMsg = errorMsg.replace(/^Assistant '.*?' PATCH failed:\s*/, "");
        actions.showPopup({ message: `Error for "${assistantName}":\n${errorMsg.split(";").map((e: string) => e.trim()).join("\n")}` });
        return;
      }
      
      actions.setEditAssistantId({ id: null });
      fetchAllAssistants(state.selectedOrgId);
    } catch (err: any) {
      let assistantName = (state.assistantMap || {})[assistant.assistant_id || assistant._id] || (assistant.assistant_id || assistant._id);
      actions.showPopup({ message: `Error updating "${assistantName}":\n${err.message || "An error occurred"}` });
    } finally {
      actions.setAssistantLoading({ loading: false });
    }
  };

  const resetToHomePage = () => {
    actions.resetToHome();
    setSearch("");
    setCurrentPage(1);
  };

  const hasAssistants = assistantSearchResults.filtered.length > 0;
  const assistantDependentKeys = ["max_input_token", "max_output_token", "file_count", "file_size", "knowledge_base_index_size"];

  const handleOrgValueChange = (key: string, value: string) => {
    const newValues = { ...(state.orgEditValues || {}), [key]: value };
    const newKeys = (state.editedOrgKeys || []).includes(key) ? (state.editedOrgKeys || []) : [...(state.editedOrgKeys || []), key];
    actions.setOrgEditValues({ values: newValues });
    actions.setEditedOrgKeys({ keys: newKeys });
  };

  const handleOrgSave = async () => {
    if ((state.editedOrgKeys || []).length === 0) {
      actions.showPopup({ message: "No organisation keys have been edited. Please edit at least one key before proceeding." });
      return;
    }
    
    const hasAssistantDependentKey = (state.editedOrgKeys || []).some((key: string) => assistantDependentKeys.includes(key));
    
    if (hasAssistants && hasAssistantDependentKey) {
      const assistantValues = (state.assistants || []).map((a: any) => ({
        assistant_id: a.assistant_id ?? a._id ?? "",
        input_token_per_user: String(a.input_token_per_user ?? ""),
        input_token_per_assistant: String(a.input_token_per_assistant ?? ""),
        output_token_per_user: String(a.output_token_per_user ?? ""),
        output_token_per_assistant: String(a.output_token_per_assistant ?? ""),
        file_count: String(a.file_count ?? ""),
        file_size: String(a.file_size ?? ""),
        knowledge_base_index_size: String(a.knowledge_base_index_size ?? ""),
      }));
      actions.setAssistantEditValuesArray({ values: assistantValues });
      actions.setShowAssistantBulkEdit({ show: true });
      return;
    }
    
    try {
      const patchBody = Object.fromEntries(
        (state.editedOrgKeys || []).map((key: string) => [key, Number((state.orgEditValues || {})[key])])
      );
      
      const res = await fetch(`${RATE_LIMIT_ORG_API}/${state.selectedOrgId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patchBody),
      });
      
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to update organisation");
      
      actions.showPopup({ message: "Organisation updated successfully." });
      resetToHomePage();
      fetchAllData();
    } catch (err: any) {
      actions.showPopup({ message: err.message || "An error occurred" });
    }
  };

  const handleAssistantBulkValueChange = (idx: number, key: string, value: string) => {
    const arr = [...(state.assistantEditValuesArray || [])];
    arr[idx][key] = value;
    actions.setAssistantEditValuesArray({ values: arr });
  };

  const handleAssistantBulkSave = async () => {
    try {
      const patchBody = {
        ...Object.fromEntries((state.editedOrgKeys || []).map((key: string) => [key, Number((state.orgEditValues || {})[key])])),
        assistants: (state.assistantEditValuesArray || []).map((a: any) => {
          const filtered: any = { assistant_id: a.assistant_id };
          if ((state.editedOrgKeys || []).includes("max_input_token")) {
            filtered.input_token_per_user = Number(a.input_token_per_user);
            filtered.input_token_per_assistant = Number(a.input_token_per_assistant);
          }
          if ((state.editedOrgKeys || []).includes("max_output_token")) {
            filtered.output_token_per_user = Number(a.output_token_per_user);
            filtered.output_token_per_assistant = Number(a.output_token_per_assistant);
          }
          if ((state.editedOrgKeys || []).includes("file_count")) filtered.file_count = Number(a.file_count);
          if ((state.editedOrgKeys || []).includes("file_size")) filtered.file_size = Number(a.file_size);
          if ((state.editedOrgKeys || []).includes("knowledge_base_index_size")) filtered.knowledge_base_index_size = Number(a.knowledge_base_index_size);
          return filtered;
        })
      };
      
      const res = await fetch(`${RATE_LIMIT_ORG_API}/${state.selectedOrgId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patchBody),
      });
      
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to update organisation and assistants");
      
      actions.showPopup({ message: "Organisation and assistants updated successfully." });
      resetToHomePage();
      fetchAllData();
    } catch (err: any) {
      actions.showPopup({ message: err.message || "An error occurred" });
    }
  };

  const handleView = (org: any) => {
    actions.setSelectedOrgId({ orgId: org.org_id });
    actions.setCurrentAction({ action: "view" });
  };

  const handleEdit = (org: any) => {
    actions.setSelectedOrgId({ orgId: org.org_id });
    const values = {
      max_input_token: String(org.max_input_token ?? ""),
      max_output_token: String(org.max_output_token ?? ""),
      file_count: String(org.file_count ?? ""),
      file_size: String(org.file_size ?? ""),
      knowledge_base_count: String(org.knowledge_base_count ?? ""),
      knowledge_base_index_size: String(org.knowledge_base_index_size ?? ""),
      active_assistant_count: String(org.active_assistant_count ?? ""),
    };
    actions.setOrgEditValues({ values });
    actions.setEditedOrgKeys({ keys: [] });
    actions.setEditStep({ step: "org" });
    actions.setCurrentAction({ action: "edit" });
  };

  const handleDelete = (org: any) => {
    actions.showConfirm({
      message: "Are you sure you want to delete this organisation rate limit?",
      onConfirm: async () => {
        try {
          const res = await fetch(`${RATE_LIMIT_ORG_API}/${org.org_id}`, { method: "DELETE" });
          const json = await res.json();
          if (!res.ok) {
            actions.showPopup({ message: json.message || "Failed to delete organisation rate limit" });
            return;
          }
          actions.showPopup({ message: "Organisation rate limit deleted successfully." });
          fetchAllData();
        } catch (err: any) {
          actions.showPopup({ message: err.message || "An error occurred" });
        }
      }
    });
  };

  // Wrapper functions for components expecting setState-style functions
  const setOrgEditValues = (valuesOrUpdater: any) => {
    if (typeof valuesOrUpdater === 'function') {
      const newValues = valuesOrUpdater(state.orgEditValues || {});
      actions.setOrgEditValues({ values: newValues });
    } else {
      actions.setOrgEditValues({ values: valuesOrUpdater });
    }
  };

  const setEditedOrgKeys = (keysOrUpdater: string[] | ((prev: string[]) => string[])) => {
    if (typeof keysOrUpdater === 'function') {
      const newKeys = keysOrUpdater(state.editedOrgKeys || []);
      actions.setEditedOrgKeys({ keys: newKeys });
    } else {
      actions.setEditedOrgKeys({ keys: keysOrUpdater });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-2">Organisation Rate Limits</h1>

      <DialogPopup
        open={state.popupOpen || false}
        setOpen={() => actions.hidePopup()}
        message={state.popupMessage || ""}
      />

      <ConfirmDialog
        open={state.confirmOpen || false}
        setOpen={() => actions.hideConfirm()}
        message={state.confirmMessage || ""}
        onConfirm={() => {
          actions.hideConfirm();
          if (state.onConfirm) state.onConfirm();
        }}
      />

      {!state.selectedOrgId && (
        <>
          <SearchInput 
            placeholder="Search Organisation" 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            className="max-w-xs mb-4" 
          />
          <Card>
            <CardHeader><CardTitle>Organisation Rate Limit Management</CardTitle></CardHeader>
            <CardContent>
              <OrganisationTable
                organisations={orgSearchResults.paginated}
                organisationMap={state.organizationMap || {}}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
                menuOpenId={state.menuOpenId}
                onMenuToggle={(menuId) => actions.setMenuOpen({ menuId })}
                searchTerm={search}
              />
              <TablePagination
                currentPage={orgSearchResults.currentPage}
                totalPages={orgSearchResults.totalPages}
                onPageChange={setCurrentPage}
              />
            </CardContent>
          </Card>
        </>
      )}

      {state.selectedOrgId && state.currentAction === "view" && (
        <Card>
          <PageHeader 
            title={`Organisation: ${(state.organizationMap || {})[state.selectedOrgId] || state.selectedOrgId}`}
            onBack={resetToHomePage}
          />
          <CardContent>
            {/* Organisation Details */}
            {(() => {
              const org = (state.organizations || []).find((o: any) => o.org_id === state.selectedOrgId);
              if (!org) return null;
              return <OrganisationDetails organisation={org} />;
            })()}

            {/* Assistant Section */}
            <div className="mt-6">
              <AssistantSection
                assistants={assistantSearchResults.paginated}
                assistantsMap={state.assistantMap || {}}
                searchValue={state.assistantSearch || ""}
                onSearchChange={(search) => actions.setAssistantSearch({ search })}
                currentPage={assistantSearchResults.currentPage}
                totalPages={assistantSearchResults.totalPages}
                onPageChange={(page) => actions.setAssistantPage({ page })}
                editAssistantId={null}
                assistantValues={{}}
                setAssistantValues={() => {}}
                onEdit={() => {}}
                onSave={() => {}}
                onCancel={() => {}}
                assistantLoading={false}
                showEdit={false}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {state.selectedOrgId && state.currentAction === "edit" && (state.editStep === "summary" || state.editStep === null) && (
        <Card>
          <PageHeader 
            title={`Edit Organisation: ${(state.organizationMap || {})[state.selectedOrgId] || state.selectedOrgId}`}
            onBack={resetToHomePage}
          />
          <CardContent>
            <OrganisationDetails organisation={state.orgEditValues || {}} />
            
            <div className="mb-6">
              <Button variant="default" onClick={() => actions.setEditStep({ step: "org" })}>
                Edit Organisation Values
              </Button>
            </div>

            <div className="mt-6">
              <AssistantSection
                assistants={assistantSearchResults.paginated}
                assistantsMap={state.assistantMap || {}}
                searchValue={state.assistantSearch || ""}
                onSearchChange={(search) => actions.setAssistantSearch({ search })}
                currentPage={assistantSearchResults.currentPage}
                totalPages={assistantSearchResults.totalPages}
                onPageChange={(page) => actions.setAssistantPage({ page })}
                editAssistantId={state.editAssistantId}
                assistantValues={state.assistantValues || {}}
                setAssistantValues={(values) => actions.setAssistantValues({ values })}
                onEdit={handleAssistantEdit}
                onSave={handleAssistantSave}
                onCancel={() => actions.setEditAssistantId({ id: null })}
                assistantLoading={state.assistantLoading || false}
                showEdit={true}
              />
            </div>
          </CardContent>
        </Card>
      )}
      
      {state.selectedOrgId && state.currentAction === "edit" && state.editStep === "org" && (
        <Card>
          <PageHeader 
            title={`Edit Organisation: ${(state.organizationMap || {})[state.selectedOrgId] || state.selectedOrgId}`}
            onBack={resetToHomePage}
          />
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Organisation Rate Limits</CardTitle>
                </CardHeader>
                <CardContent>
                  <OrganisationForm
                    values={state.orgEditValues || {}}
                    setValues={setOrgEditValues}
                    editedKeys={state.editedOrgKeys || []}
                    setEditedKeys={setEditedOrgKeys}
                    onNext={handleOrgSave}
                    onCancel={resetToHomePage}
                    hasAssistants={hasAssistants}
                    loading={false}
                    originalValues={(state.organizations || []).find((o: any) => o.org_id === state.selectedOrgId) || {}}
                  />
                </CardContent>
              </Card>

              {state.showAssistantBulkEdit && (
                <Card>
                  <CardHeader>
                    <CardTitle>Assistants</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AssistantBulkEditForm
                      assistantEditValuesArray={state.assistantEditValuesArray || []}
                      assistantsMap={state.assistantMap || {}}
                      editedOrgKeys={state.editedOrgKeys || []}
                      onValueChange={handleAssistantBulkValueChange}
                      onSave={handleAssistantBulkSave}
                      onBack={() => actions.setShowAssistantBulkEdit({ show: false })}
                    />
                  </CardContent>
                </Card>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OrganisationRateLimitPage;