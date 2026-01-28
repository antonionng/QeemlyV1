"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { User, Upload, Loader2, CheckCircle2 } from "lucide-react";

export default function ProfilePage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [fullName, setFullName] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function getProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profile) {
          setProfile(profile);
          setFullName(profile.full_name || "");
        }
      }
      setLoading(false);
    }

    getProfile();
  }, [supabase]);

  async function updateProfile() {
    setSaving(true);
    setMessage(null);

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({ type: "success", text: "Profile updated successfully!" });
    }
    setSaving(false);
  }

  async function uploadAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setUploading(true);
      setMessage(null);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("You must select an image to upload.");
      }

      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          avatar_url: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateError) {
        throw updateError;
      }

      setProfile({ ...profile, avatar_url: publicUrl });
      setMessage({ type: "success", text: "Avatar updated successfully!" });
    } catch (error: any) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setUploading(false);
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
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-brand-900">Profile Settings</h1>
        <p className="text-brand-600">Manage your personal information and how you appear to your team.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <Card className="p-6 md:col-span-1">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="relative h-32 w-32 overflow-hidden rounded-2xl bg-brand-100 ring-4 ring-white shadow-lg">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={fullName} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-brand-400">
                  <User size={64} />
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <Loader2 className="h-8 w-8 animate-spin text-white" />
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <label className="cursor-pointer">
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700">
                  <Upload size={16} />
                  Change photo
                </span>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={uploadAvatar}
                  disabled={uploading}
                />
              </label>
              <p className="text-xs text-brand-500">JPG, GIF or PNG. Max size of 2MB.</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 md:col-span-2">
          <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); updateProfile(); }}>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-brand-900">Email Address</label>
              <Input value={user?.email || ""} disabled fullWidth className="bg-brand-50/50" />
              <p className="text-xs text-brand-500">Your email cannot be changed.</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="fullName" className="text-sm font-semibold text-brand-900">Full Name</label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                fullWidth
              />
            </div>

            {message && (
              <div className={`flex items-center gap-2 rounded-lg p-3 text-sm font-medium ${
                message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
              }`}>
                {message.type === "success" && <CheckCircle2 size={16} />}
                {message.text}
              </div>
            )}

            <div className="flex justify-end">
              <Button type="submit" isLoading={saving}>
                Save Changes
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
