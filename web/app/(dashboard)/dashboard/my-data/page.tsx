"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Database, 
  FileUp, 
  FileText, 
  Trash2, 
  Download, 
  Loader2, 
  CheckCircle2,
  AlertCircle,
  Calendar,
  HardDrive
} from "lucide-react";

export default function MyDataPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [datasets, setDatasets] = useState<any[]>([]);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function getData() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profile) {
          setProfile(profile);
          fetchDatasets(profile.workspace_id);
        }
      }
      setLoading(false);
    }

    getData();
  }, [supabase]);

  async function fetchDatasets(workspaceId: string) {
    const { data, error } = await supabase
      .from("user_datasets")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });

    if (data) setDatasets(data);
  }

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setUploading(true);
      setMessage(null);

      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      const fileName = file.name;
      const fileExt = fileName.split(".").pop();
      
      if (fileExt !== "csv") {
        throw new Error("Please upload a CSV file.");
      }

      const filePath = `datasets/${profile.workspace_id}/${Date.now()}-${fileName}`;

      // 1. Upload to Storage
      const { error: uploadError } = await supabase.storage
        .from("datasets")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Create Database Record
      const { error: dbError } = await supabase
        .from("user_datasets")
        .insert({
          workspace_id: profile.workspace_id,
          name: fileName,
          file_path: filePath,
          metadata: {
            size: file.size,
            type: file.type,
            lastModified: file.lastModified
          }
        });

      if (dbError) throw dbError;

      fetchDatasets(profile.workspace_id);
      setMessage({ type: "success", text: "Dataset uploaded successfully!" });
    } catch (error: any) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setUploading(false);
    }
  }

  async function deleteDataset(id: string, filePath: string) {
    if (!confirm("Are you sure you want to delete this dataset?")) return;

    try {
      // 1. Delete from Storage
      await supabase.storage.from("datasets").remove([filePath]);

      // 2. Delete from DB
      const { error } = await supabase
        .from("user_datasets")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setDatasets(datasets.filter(d => d.id !== id));
      setMessage({ type: "success", text: "Dataset deleted." });
    } catch (error: any) {
      setMessage({ type: "error", text: error.message });
    }
  }

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">My Data</h1>
          <p className="text-brand-600">Manage and upload your organization's compensation datasets.</p>
        </div>
        <label className="cursor-pointer">
          <Button asChild isLoading={uploading}>
            <span>
              <FileUp size={18} className="mr-2" />
              Upload CSV
            </span>
          </Button>
          <input
            type="file"
            className="hidden"
            accept=".csv"
            onChange={handleFileUpload}
            disabled={uploading}
          />
        </label>
      </div>

      {message && (
        <div className={`flex items-center gap-2 rounded-xl p-4 text-sm font-medium ${
          message.type === "success" ? "bg-green-50 text-green-700 ring-1 ring-green-200" : "bg-red-50 text-red-700 ring-1 ring-red-200"
        }`}>
          {message.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {message.text}
        </div>
      )}

      <div className="grid gap-6">
        {datasets.length === 0 ? (
          <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
            <div className="mb-4 rounded-full bg-brand-50 p-4 text-brand-400">
              <Database size={48} />
            </div>
            <h3 className="text-lg font-bold text-brand-900">No datasets yet</h3>
            <p className="mb-6 max-w-xs text-brand-500">
              Upload your first compensation CSV to start benchmarking with your own data.
            </p>
            <label className="cursor-pointer">
              <Button variant="outline" asChild>
                <span>Select CSV File</span>
              </Button>
              <input
                type="file"
                className="hidden"
                accept=".csv"
                onChange={handleFileUpload}
              />
            </label>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {datasets.map((dataset) => (
              <Card key={dataset.id} className="group overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-5">
                  <div className="mb-4 flex items-start justify-between">
                    <div className="rounded-xl bg-brand-50 p-3 text-brand-600">
                      <FileText size={24} />
                    </div>
                    <button 
                      onClick={() => deleteDataset(dataset.id, dataset.file_path)}
                      className="rounded-lg p-2 text-brand-300 hover:bg-red-50 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  
                  <h3 className="mb-1 font-bold text-brand-900 truncate" title={dataset.name}>
                    {dataset.name}
                  </h3>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-brand-500">
                      <Calendar size={14} />
                      Uploaded {new Date(dataset.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-brand-500">
                      <HardDrive size={14} />
                      {(dataset.metadata?.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                </div>
                
                <div className="flex border-t border-border/50">
                  <button className="flex-1 px-4 py-3 text-xs font-bold text-brand-600 hover:bg-brand-50 transition-colors border-r border-border/50">
                    USE AS ACTIVE
                  </button>
                  <button className="flex-1 px-4 py-3 text-xs font-bold text-brand-600 hover:bg-brand-50 transition-colors">
                    DOWNLOAD
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Card className="p-6 bg-brand-900 text-white overflow-hidden relative">
        <div className="relative z-10 max-w-lg">
          <h2 className="text-xl font-bold mb-2">Data Security & Privacy</h2>
          <p className="text-brand-200 text-sm leading-relaxed">
            Your uploaded datasets are encrypted at rest and isolated to your workspace. 
            Only authorized members of your team can access this data. Qeemly uses this 
            data solely for your internal benchmarking and does not share it with third parties.
          </p>
        </div>
        <Database size={120} className="absolute -right-8 -bottom-8 text-white/5 rotate-12" />
      </Card>
    </div>
  );
}
