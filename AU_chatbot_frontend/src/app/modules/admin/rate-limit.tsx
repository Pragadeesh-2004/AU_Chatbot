"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Edit, Save, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { z } from "zod";

// Simple Dialog component
function Dialog({ open, type, message, onClose }: { open: boolean; type: "error" | "success"; message: string; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className={`rounded-xl shadow-lg p-6 min-w-[300px] ${type === "error" ? "bg-red-900 border-red-700" : "bg-green-900 border-green-700"} border`}>
        <div className="text-lg font-semibold mb-2 text-white">{type === "error" ? "Error" : "Success"}</div>
        <div className="mb-4 text-white">{message}</div>
        <Button onClick={onClose} className="bg-white text-black hover:bg-gray-200">Close</Button>
      </div>
    </div>
  );
}

const rateLimitSchema = z.object({
  requestsPerDay: z.number().min(1).max(100000),
  inputTokensPerDay: z.number().min(1).max(1000000),
  outputTokensPerDay: z.number().min(1).max(1000000),
  fileCount: z.number().min(1).max(50),
  fileSizePerFile: z.number().min(1).max(100),
  memoryCount: z.number().min(1).max(1000)
});

type RateLimitData = z.infer<typeof rateLimitSchema>;

const roleOptions = [
  { value: "guest", label: "Guest" },
  { value: "official", label: "Official" },
  { value: "scholar", label: "Scholar" },
  { value: "faculty", label: "Faculty" },
  { value: "student", label: "Student" },
];

export default function RateLimitDashboard() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState("guest");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const [currentData, setCurrentData] = useState<RateLimitData>({
    requestsPerDay: 100,
    inputTokensPerDay: 1000,
    outputTokensPerDay: 1000,
    fileCount: 5,
    fileSizePerFile: 10,
    memoryCount: 50
  });

  const [editData, setEditData] = useState<RateLimitData>(currentData);
  const [hasChanges, setHasChanges] = useState(false);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"error" | "success">("success");
  const [dialogMessage, setDialogMessage] = useState("");

  useEffect(() => {
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    localStorage.removeItem("userRole");
  }, []);

  useEffect(() => {
    fetchRateLimits();
  }, [selectedRole]);

  useEffect(() => {
    const changed = Object.keys(currentData).some(
      key => Number(currentData[key as keyof RateLimitData]) !== Number(editData[key as keyof RateLimitData])
    );
    setHasChanges(changed);
  }, [currentData, editData]);

  const fetchRateLimits = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000"}/admin/rate-limits/${selectedRole}`
      );
      if (res.ok) {
        const data = await res.json();
        const mappedData: RateLimitData = {
          requestsPerDay: data.request_per_day,
          inputTokensPerDay: data.input_token_per_day,
          outputTokensPerDay: data.output_token_per_day,
          fileCount: data.file_count,
          fileSizePerFile: data.file_size,
          memoryCount: data.memory_count,
        };
        setCurrentData(mappedData);
        setEditData(mappedData);
      }
    } catch (err) {
      setDialogType("error");
      setDialogMessage("Failed to fetch rate limits.");
      setDialogOpen(true);
    }
    setLoading(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setDialogOpen(false);
  };

  const handleCancel = () => {
    setEditData(currentData);
    setIsEditing(false);
    setDialogOpen(false);
  };

  const handleSave = async () => {
    try {
      rateLimitSchema.parse(editData);
      setLoading(true);

      const payload = {
        request_per_day: editData.requestsPerDay,
        input_token_per_day: editData.inputTokensPerDay,
        output_token_per_day: editData.outputTokensPerDay,
        file_count: editData.fileCount,
        file_size: editData.fileSizePerFile,
        memory_count: editData.memoryCount,
      };

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000"}/admin/rate-limits/${selectedRole}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }
      );

      if (res.ok) {
        setCurrentData(editData);
        setIsEditing(false);
        setDialogType("success");
        setDialogMessage("Rate limits updated successfully!");
        setDialogOpen(true);
      } else {
        setDialogType("error");
        setDialogMessage("Failed to update rate limits.");
        setDialogOpen(true);
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        setDialogType("error");
        setDialogMessage("Please enter valid numbers for all fields.");
        setDialogOpen(true);
      } else {
        setDialogType("error");
        setDialogMessage("Failed to save changes.");
        setDialogOpen(true);
      }
    }
    setLoading(false);
  };

  const handleInputChange = (field: keyof RateLimitData, value: string) => {
    const numValue = value === "" ? 0 : Number(value);
    setEditData(prev => ({ ...prev, [field]: numValue }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800">
      <Dialog
        open={dialogOpen}
        type={dialogType}
        message={dialogMessage}
        onClose={() => setDialogOpen(false)}
      />
      <div className="flex items-center justify-between p-6 border-b border-blue-800">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="text-cyan-300 hover:bg-blue-900"
            onClick={() => router.push("/modules/admin")}
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-2xl font-bold text-cyan-100">Rate Limit Dashboard</h1>
        </div>
      </div>

      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-8">
          <label className="block mb-2 text-cyan-100 text-lg font-semibold">Select Role</label>
          <Select value={selectedRole} onValueChange={setSelectedRole} disabled={isEditing}>
            <SelectTrigger className="w-64 bg-blue-900/50 text-cyan-100 border-blue-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-blue-900 text-cyan-100 border-blue-700">
              {roleOptions.map(role => (
                <SelectItem key={role.value} value={role.value}>
                  {role.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="bg-blue-900/30 backdrop-blur-md border border-blue-800 rounded-2xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-cyan-100">
              Rate Limits for {roleOptions.find(r => r.value === selectedRole)?.label}
            </h2>
            {!isEditing && (
              <Button
                onClick={handleEdit}
                className="bg-cyan-700 hover:bg-cyan-800 text-white flex items-center gap-2"
                disabled={loading}
              >
                <Edit size={16} />
                Edit
              </Button>
            )}
          </div>

          {loading && (
            <div className="text-center text-cyan-200 mb-4">Loading...</div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block mb-2 text-cyan-200 font-medium">Requests Per Day</label>
              <Input
                type="number"
                value={isEditing ? String(editData.requestsPerDay ?? "") : String(currentData.requestsPerDay ?? "")}
                onChange={e => handleInputChange('requestsPerDay', e.target.value)}
                disabled={!isEditing}
                className="bg-blue-900/50 text-cyan-100 border-blue-700 disabled:opacity-70"
                min="1"
                max="100000"
              />
            </div>

            <div>
              <label className="block mb-2 text-cyan-200 font-medium">Input Tokens Per Day</label>
              <Input
                type="number"
                value={isEditing ? String(editData.inputTokensPerDay ?? "") : String(currentData.inputTokensPerDay ?? "")}
                onChange={e => handleInputChange('inputTokensPerDay', e.target.value)}
                disabled={!isEditing}
                className="bg-blue-900/50 text-cyan-100 border-blue-700 disabled:opacity-70"
                min="1"
                max="1000000"
              />
            </div>

            <div>
              <label className="block mb-2 text-cyan-200 font-medium">Output Tokens Per Day</label>
              <Input
                type="number"
                value={isEditing ? String(editData.outputTokensPerDay ?? "") : String(currentData.outputTokensPerDay ?? "")}
                onChange={e => handleInputChange('outputTokensPerDay', e.target.value)}
                disabled={!isEditing}
                className="bg-blue-900/50 text-cyan-100 border-blue-700 disabled:opacity-70"
                min="1"
                max="1000000"
              />
            </div>

            <div>
              <label className="block mb-2 text-cyan-200 font-medium">Max File Count</label>
              <Input
                type="number"
                value={isEditing ? String(editData.fileCount ?? "") : String(currentData.fileCount ?? "")}
                onChange={e => handleInputChange('fileCount', e.target.value)}
                disabled={!isEditing}
                className="bg-blue-900/50 text-cyan-100 border-blue-700 disabled:opacity-70"
                min="1"
                max="50"
              />
            </div>

            <div>
              <label className="block mb-2 text-cyan-200 font-medium">File Size Per File (MB)</label>
              <Input
                type="number"
                value={isEditing ? String(editData.fileSizePerFile ?? "") : String(currentData.fileSizePerFile ?? "")}
                onChange={e => handleInputChange('fileSizePerFile', e.target.value)}
                disabled={!isEditing}
                className="bg-blue-900/50 text-cyan-100 border-blue-700 disabled:opacity-70"
                min="1"
                max="100"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block mb-2 text-cyan-200 font-medium">Memory Count</label>
              <Input
                type="number"
                value={isEditing ? String(editData.memoryCount ?? "") : String(currentData.memoryCount ?? "")}
                onChange={e => handleInputChange('memoryCount', e.target.value)}
                disabled={!isEditing}
                className="bg-blue-900/50 text-cyan-100 border-blue-700 disabled:opacity-70"
                min="1"
                max="1000"
              />
            </div>
          </div>

          {isEditing && (
            <div className="flex gap-4 mt-8">
              <Button
                onClick={handleSave}
                disabled={!hasChanges || loading}
                className="bg-green-700 hover:bg-green-800 text-white flex items-center gap-2"
              >
                <Save size={16} />
                Save Changes
              </Button>
              <Button
                onClick={handleCancel}
                variant="outline"
                className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white flex items-center gap-2"
              >
                <X size={16} />
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}