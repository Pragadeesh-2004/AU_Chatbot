"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, FileText, Image as ImageIcon, Trash2 } from "lucide-react";

type FileItem = {
  id: number;
  name: string;
  type: "file" | "image";
  url?: string;
};

export default function FileManager() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [showUpload, setShowUpload] = useState(false);

  const handleAddFile = (e: React.ChangeEvent<HTMLInputElement>, type: "file" | "image") => {
    const file = e.target.files?.[0];
    if (!file) return;
    const id = Date.now();
    const url = URL.createObjectURL(file);
    setFiles([...files, { id, name: file.name, type, url }]);
    setShowUpload(false);
  };

  const handleDelete = (id: number) => {
    setFiles(files.filter(f => f.id !== id));
  };

  return (
    <div className="w-full max-w-lg mx-auto mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">File Management</h2>
        <Button
          className="bg-white text-black hover:bg-gray-200 rounded-full p-2"
          onClick={() => setShowUpload(!showUpload)}
        >
          <Plus size={20} />
        </Button>
      </div>
      {showUpload && (
        <div className="flex gap-4 mb-4">
          <label className="cursor-pointer flex items-center gap-2 bg-[#23272f] text-white px-4 py-2 rounded hover:bg-[#2a2a2a]">
            <FileText size={18} />
            <span>Add File</span>
            <input
              type="file"
              className="hidden"
              onChange={e => handleAddFile(e, "file")}
              accept=".pdf,.doc,.docx,.txt"
            />
          </label>
          <label className="cursor-pointer flex items-center gap-2 bg-[#23272f] text-white px-4 py-2 rounded hover:bg-[#2a2a2a]">
            <ImageIcon size={18} />
            <span>Add Picture</span>
            <input
              type="file"
              className="hidden"
              onChange={e => handleAddFile(e, "image")}
              accept="image/*"
            />
          </label>
        </div>
      )}
      <div className="space-y-3">
        {files.length === 0 ? (
          <p className="text-gray-400 text-center">No files uploaded yet.</p>
        ) : (
          files.map(file => (
            <Card key={file.id} className="flex items-center gap-4 bg-[#23272f] text-white p-4">
              {file.type === "image" ? (
                <img src={file.url} alt={file.name} className="w-12 h-12 object-cover rounded" />
              ) : (
                <FileText size={32} />
              )}
              <div className="flex-1">
                <div className="font-semibold">{file.name}</div>
                <div className="text-xs text-gray-400">{file.type === "image" ? "Picture" : "File"}</div>
              </div>
              <Button
                variant="ghost"
                className="text-red-400 hover:bg-red-900/20"
                onClick={() => handleDelete(file.id)}
              >
                <Trash2 size={18} />
              </Button>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}