"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSearchPagination } from "@/hooks/useSearchPagination";
import { useRateLimitState } from "@/hooks/useRateLimitState";

import OrganisationDetails from "@/components/rate-limit/OrganisationDetails";
import AssistantSection from "@/components/rate-limit/AssistantSection";
import DialogPopup from "@/components/rate-limit/DialogPopup";
import ConfirmDialog from "@/components/rate-limit/ConfirmDialog";

const RATE_LIMIT_ORG_API = "http://localhost:3000/rate-limit/organisation";
const ORG_API = "http://localhost:3000/organisation";

interface Organization {
  _id: string;
  name: string;
}

const OrganisationOwnerPage: React.FC = () => {
  const params = useParams();
  const organisationSlug = params.organisationslug as string;
  const { state, actions } = useRateLimitState();
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Local state for this page only
  const [loading, setLoading] = useState<boolean>(true);
  const [orgData, setOrgData] = useState<Organization | null>(null);
  const [orgExists, setOrgExists] = useState<boolean>(false);

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

  useEffect(() => {
    fetchOrganisationByName();
  }, [organisationSlug]);
  
  useEffect(() => {
    if (orgData?._id && orgExists) {
      fetchAllData();
      fetchOrganisationMap();
      fetchAssistantsMap(orgData._id);
    }
  }, [orgData, orgExists]);

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

  const fetchOrganisationByName = async (): Promise<void> => {
    try {
      setLoading(true);
      
      const res = await fetch(ORG_API);
      
      if (!res.ok) {
        setOrgExists(false);
        return;
      }
      
      const organisations: Organization[] = await res.json();
      const decodedOrgName = decodeURIComponent(organisationSlug);
      const org = organisations.find((o: Organization) => o.name === decodedOrgName);
      
      if (!org) {
        setOrgExists(false);
        return;
      }
      
      setOrgData(org);
      setOrgExists(true);
      
    } catch (err) {
      setOrgExists(false);
    } finally {
      setLoading(false);
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
      }
      
      actions.setOrganizationMap({ organizationMap: map });
    } catch {
      actions.setOrganizationMap({ organizationMap: {} });
    }
  };

  const fetchAssistantsMap = async (orgId: string): Promise<void> => {
    try {
      const res = await fetch(`${ORG_API}/${orgId}/assistants`);
      if (res.ok) {
        const assistants = await res.json();
        const map: { [key: string]: string } = {};
        
        for (const assistant of assistants) {
          map[assistant._id] = assistant.name;
        }
        
        actions.setAssistantMap({ assistantMap: map });
        fetchAllAssistants(orgId);
      }
    } catch (err) {
      actions.setAssistantMap({ assistantMap: {} });
    }
  };

  const fetchAllAssistants = async (orgId: string): Promise<void> => {
    try {
      const res = await fetch(`${RATE_LIMIT_ORG_API}/${orgId}/assistant?page=1&limit=1000`);
      if (res.ok) {
        const data = await res.json();
        actions.setAssistants({ assistants: data.data || [] });
      }
    } catch (err) {
      actions.setAssistants({ assistants: [] });
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
    actions.setMenuOpen({ menuId: null });
  };

  const handleAssistantSave = async (assistant: any) => {
    actions.setAssistantLoading({ loading: true });
    try {
      if (!orgData?._id) {
        actions.showPopup({ message: "No organisation selected." });
        return;
      }
      
      const patchBody = {
        input_token_per_user: Number((state.assistantValues || {}).input_token_per_user || 0),
        input_token_per_assistant: Number((state.assistantValues || {}).input_token_per_assistant || 0),
        output_token_per_user: Number((state.assistantValues || {}).output_token_per_user || 0),
        output_token_per_assistant: Number((state.assistantValues || {}).output_token_per_assistant || 0),
        file_count: Number((state.assistantValues || {}).file_count || 0),
        file_size: Number((state.assistantValues || {}).file_size || 0),
        knowledge_base_index_size: Number((state.assistantValues || {}).knowledge_base_index_size || 0),
      };
      
      const res = await fetch(`${RATE_LIMIT_ORG_API}/${orgData._id}/assistant/${assistant.assistant_id || assistant._id}`, {
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
      actions.showPopup({ message: "Assistant updated successfully." });
      fetchAllAssistants(orgData._id);
    } catch (err: any) {
      let assistantName = (state.assistantMap || {})[assistant.assistant_id || assistant._id] || (assistant.assistant_id || assistant._id);
      actions.showPopup({ message: `Error updating "${assistantName}":\n${err.message || "An error occurred"}` });
    } finally {
      actions.setAssistantLoading({ loading: false });
    }
  };

  const handleAssistantReset = (assistant: any) => {
    const assistantName = (state.assistantMap || {})[assistant.assistant_id || assistant._id] || (assistant.assistant_id || assistant._id);
    actions.showConfirm({
      message: `Are you sure you want to reset all rate limits for assistant "${assistantName}" to 0?`,
      onConfirm: async () => {
        try {
          if (!orgData?._id) {
            actions.showPopup({ message: "No organisation selected." });
            return;
          }

          const resetBody = {
            input_token_per_user: 0,
            input_token_per_assistant: 0,
            output_token_per_user: 0,
            output_token_per_assistant: 0,
            file_count: 0,
            file_size: 0,
            knowledge_base_index_size: 0,
          };
          
          const res = await fetch(`${RATE_LIMIT_ORG_API}/${orgData._id}/assistant/${assistant.assistant_id || assistant._id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(resetBody),
          });
          
          const json = await res.json();
          if (!res.ok) {
            actions.showPopup({ message: json.message || "Failed to reset assistant rate limits" });
            return;
          }
          
          actions.showPopup({ message: `Assistant "${assistantName}" rate limits reset successfully.` });
          fetchAllAssistants(orgData._id);
        } catch (err: any) {
          actions.showPopup({ message: err.message || "An error occurred" });
        }
      }
    });
    actions.setMenuOpen({ menuId: null });
  };

  const handleAssistantDelete = (assistant: any) => {
    const assistantName = (state.assistantMap || {})[assistant.assistant_id || assistant._id] || (assistant.assistant_id || assistant._id);
    actions.showConfirm({
      message: `Are you sure you want to delete rate limits for assistant "${assistantName}"?`,
      onConfirm: async () => {
        try {
          if (!orgData?._id) {
            actions.showPopup({ message: "No organisation selected." });
            return;
          }

          const res = await fetch(`${RATE_LIMIT_ORG_API}/${orgData._id}/assistant/${assistant.assistant_id || assistant._id}`, {
            method: "DELETE"
          });
          
          const json = await res.json();
          if (!res.ok) {
            actions.showPopup({ message: json.message || "Failed to delete assistant rate limits" });
            return;
          }
          
          actions.showPopup({ message: `Assistant "${assistantName}" rate limits deleted successfully.` });
          fetchAllAssistants(orgData._id);
        } catch (err: any) {
          actions.showPopup({ message: err.message || "An error occurred" });
        }
      }
    });
    actions.setMenuOpen({ menuId: null });
  };

  if (loading) {
    return (
      <div className="flex items-center w-full justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading {decodeURIComponent(organisationSlug)} organization...</p>
        </div>
      </div>
    );
  }

  if (!orgExists || !orgData) {
    return null;
  }

  const currentOrgData = (state.organizations || []).find((org: any) => org.org_id === orgData?._id);

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

      <Card>
        <CardHeader>
          <CardTitle>
            Organisation: {(state.organizationMap || {})[orgData?._id || ''] || orgData?.name || decodeURIComponent(organisationSlug)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentOrgData && (
            <OrganisationDetails organisation={currentOrgData} />
          )}

          {!currentOrgData && orgData && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-4 w-full md:w-1/2 mb-6">
              <h3 className="font-semibold text-yellow-800">No Rate Limit Configuration</h3>
              <p className="text-yellow-700">This organization does not have rate limit settings configured yet.</p>
            </div>
          )}

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
              showActions={true}
              onReset={handleAssistantReset}
              onDelete={handleAssistantDelete}
              menuOpenId={state.menuOpenId}
              onMenuToggle={(menuId) => actions.setMenuOpen({ menuId })}
              menuRef={menuRef}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrganisationOwnerPage;