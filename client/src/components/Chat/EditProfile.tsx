import { useState, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { getErrorMessage } from "../../utils/error";
import { uploadToCloudinary } from "../../utils/cloudinary";
import Avatar from "../UI/Avatar";
import api from "../../utils/api";

interface EditProfileProps {
  onClose: () => void;
}

export default function EditProfile({ onClose }: EditProfileProps) {
  const { user, login, token } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    username: user?.username || "",
    bio: user?.bio || "",
  });
  const [avatar, setAvatar] = useState<string>(user?.avatar || "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    setError("Please select an image file");
    return;
  }
  if (file.size > 2 * 1024 * 1024) {
    setError("Image must be less than 2MB");
    return;
  }

  setUploading(true);
  setError("");
  try {
    const url = await uploadToCloudinary(file);
    setAvatar(url);
  } catch (error: unknown) {
    setError(getErrorMessage(error));
  } finally {
    setUploading(false);
  }
};

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await api.put("/users/profile", {
        username: form.username,
        bio: form.bio,
        avatar,
      });

      // Update auth context with new user data
      login(token!, { ...user!, ...res.data });
      setSuccess("Profile updated successfully!");
      setTimeout(() => onClose(), 1500);
    } catch (error: unknown) {
      setError(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.5)" }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6 shadow-xl"
        style={{ background: "var(--bg-primary)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2
            className="text-lg font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Edit Profile
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-70 transition"
            style={{ background: "var(--bg-input)" }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="var(--text-secondary)"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Avatar upload */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            {avatar ? (
              <img
                src={avatar}
                alt="avatar"
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <Avatar username={user?.username || "U"} size="lg" />
            )}
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center text-white transition"
              style={{ background: "#0084ff" }}
            >
              {uploading ? (
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-3 h-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              )}
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
          <p
            className="text-xs mt-2"
            style={{ color: "var(--text-secondary)" }}
          >
            Click camera to change photo (max 2MB)
          </p>
        </div>

        {/* Error / Success */}
        {error && (
          <div
            className="mb-4 px-4 py-2 rounded-lg text-sm text-red-400"
            style={{ background: "rgba(239,68,68,0.1)" }}
          >
            {error}
          </div>
        )}
        {success && (
          <div
            className="mb-4 px-4 py-2 rounded-lg text-sm text-green-400"
            style={{ background: "rgba(34,197,94,0.1)" }}
          >
            {success}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label
              className="block text-xs font-medium mb-1"
              style={{ color: "var(--text-secondary)" }}
            >
              Username
            </label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none border"
              style={{
                background: "var(--bg-input)",
                color: "var(--text-primary)",
                borderColor: "var(--border-color)",
              }}
            />
          </div>

          <div>
            <label
              className="block text-xs font-medium mb-1"
              style={{ color: "var(--text-secondary)" }}
            >
              Bio
            </label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              maxLength={150}
              rows={3}
              placeholder="Tell something about yourself..."
              className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none border resize-none"
              style={{
                background: "var(--bg-input)",
                color: "var(--text-primary)",
                borderColor: "var(--border-color)",
              }}
            />
            <p
              className="text-xs text-right mt-1"
              style={{ color: "var(--text-secondary)" }}
            >
              {form.bio.length}/150
            </p>
          </div>

          <div>
            <label
              className="block text-xs font-medium mb-1"
              style={{ color: "var(--text-secondary)" }}
            >
              Email
            </label>
            <input
              type="email"
              value={user?.email || ""}
              disabled
              className="w-full rounded-lg px-4 py-2.5 text-sm border opacity-50 cursor-not-allowed"
              style={{
                background: "var(--bg-input)",
                color: "var(--text-primary)",
                borderColor: "var(--border-color)",
              }}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium transition"
              style={{
                background: "var(--bg-input)",
                color: "var(--text-secondary)",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || uploading}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white transition hover:opacity-80"
              style={{ background: "#0084ff" }}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
