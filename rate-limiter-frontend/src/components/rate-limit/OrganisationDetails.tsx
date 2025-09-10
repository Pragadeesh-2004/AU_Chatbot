"use client";

import React from "react";

interface OrganisationDetailsProps {
  organisation: {
    max_input_token: number;
    max_output_token: number;
    file_count: number;
    file_size: number;
    knowledge_base_count: number;
    knowledge_base_index_size: number;
    active_assistant_count: number;
  };
}

const OrganisationDetails: React.FC<OrganisationDetailsProps> = ({ organisation }) => {
  return (
    <div className="mb-4 grid grid-cols-2 gap-2">
      <div><b>Input Limit:</b> {organisation.max_input_token}</div>
      <div><b>Output Limit:</b> {organisation.max_output_token}</div>
      <div><b>File Count:</b> {organisation.file_count}</div>
      <div><b>File Size:</b> {organisation.file_size}</div>
      <div><b>Knowledge Base Count:</b> {organisation.knowledge_base_count}</div>
      <div><b>Knowledge Base Index Size:</b> {organisation.knowledge_base_index_size}</div>
      <div><b>Active Assistants:</b> {organisation.active_assistant_count}</div>
    </div>
  );
};

export default OrganisationDetails;