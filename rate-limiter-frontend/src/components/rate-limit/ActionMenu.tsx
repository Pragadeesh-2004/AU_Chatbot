"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { MoreVertical } from "lucide-react";

interface ActionMenuProps {
  isOpen: boolean;
  onToggle: () => void;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isLastRow?: boolean;
}

const ActionMenu: React.FC<ActionMenuProps> = ({
  isOpen,
  onToggle,
  onView,
  onEdit,
  onDelete,
  isLastRow = false
}) => {
  return (
    <div className="relative">
      <Button variant="ghost" size="icon" onClick={onToggle}>
        <MoreVertical className="w-5 h-5" />
      </Button>
      {isOpen && (
        <div className={`absolute right-0 ${isLastRow ? "bottom-full mb-2" : "top-full mt-2"} z-10 bg-white border rounded shadow-lg min-w-[120px]`}>
          <button className="block w-full text-left px-4 py-2 hover:bg-gray-100" onClick={onView}>
            View
          </button>
          <button className="block w-full text-left px-4 py-2 hover:bg-gray-100" onClick={onEdit}>
            Edit/Reset
          </button>
          <button className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600" onClick={onDelete}>
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default ActionMenu;