"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { UserRole } from "@/types";
import type { ManagedUser } from "@/types/users";
import {
  createManagedUserAction,
  resetManagedUserPasswordAction,
  setManagedUserActiveAction,
  updateManagedUserAction,
} from "./actions";

const roles: { value: UserRole; label: string }[] = [
  { value: "SADM", label: "Super Admin" },
  { value: "ADM", label: "Admin" },
  { value: "STF", label: "Staff" },
];

function getRoleLabel(role: UserRole) {
  return roles.find((item) => item.value === role)?.label ?? role;
}

function formatCreatedAt(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

export default function UserManagerClient({
  currentUserId,
  users,
}: {
  currentUserId: string;
  users: ManagedUser[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [passwordUser, setPasswordUser] = useState<ManagedUser | null>(null);
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return users;
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(normalizedQuery) ||
        user.username.toLowerCase().includes(normalizedQuery) ||
        getRoleLabel(user.role).toLowerCase().includes(normalizedQuery),
    );
  }, [query, users]);

  const activeCount = users.filter((user) => user.is_active).length;

  function showResult(ok: boolean, message?: string) {
    setErrorMessage(ok ? "" : message ?? "Operasi akun gagal.");
    setSuccessMessage(ok ? message ?? "Perubahan tersimpan." : "");
    if (ok) router.refresh();
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setPending(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const result = await createManagedUserAction({
        name: formData.get("name"),
        username: formData.get("username"),
        password: formData.get("password"),
        role: formData.get("role"),
      });
      if (!result.ok) {
        showResult(false, result.error);
        return;
      }
      form.reset();
      setShowCreateForm(false);
      showResult(true, "Akun berhasil dibuat.");
    } finally {
      setPending(false);
    }
  }

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingUser) return;
    const formData = new FormData(event.currentTarget);
    setPending(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const result = await updateManagedUserAction({
        id: editingUser.id,
        name: formData.get("name"),
        username: formData.get("username"),
        role: formData.get("role"),
      });
      if (!result.ok) {
        showResult(false, result.error);
        return;
      }
      setEditingUser(null);
      showResult(true, "Data akun berhasil diperbarui.");
    } finally {
      setPending(false);
    }
  }

  async function handlePasswordReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!passwordUser) return;
    const formData = new FormData(event.currentTarget);
    setPending(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const result = await resetManagedUserPasswordAction({
        id: passwordUser.id,
        password: formData.get("password"),
      });
      if (!result.ok) {
        showResult(false, result.error);
        return;
      }
      setPasswordUser(null);
      showResult(true, "Password berhasil diperbarui.");
    } finally {
      setPending(false);
    }
  }

  async function toggleActive(user: ManagedUser) {
    const nextIsActive = !user.is_active;
    const confirmation = nextIsActive
      ? `Aktifkan akun ${user.username}?`
      : `Nonaktifkan akun ${user.username}? Pengguna tersebut tidak dapat login lagi.`;
    if (!window.confirm(confirmation)) return;

    setPending(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const result = await setManagedUserActiveAction({
        id: user.id,
        isActive: nextIsActive,
      });
      if (!result.ok) {
        showResult(false, result.error);
        return;
      }
      showResult(
        true,
        nextIsActive ? "Akun berhasil diaktifkan." : "Akun dinonaktifkan.",
      );
    } finally {
      setPending(false);
    }
  }

  const inputClassName =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100";

  return (
    <div className="space-y-4 md:space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 md:text-2xl">
            User Manager
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Kelola akun, role, status, dan password pengguna.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowCreateForm((value) => !value);
            setErrorMessage("");
            setSuccessMessage("");
          }}
          className="rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-800"
        >
          {showCreateForm ? "Tutup" : "Tambah pengguna"}
        </button>
      </header>

      {(errorMessage || successMessage) && (
        <p
          role={errorMessage ? "alert" : "status"}
          className={`rounded-lg border px-3 py-2 text-sm ${
            errorMessage
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {errorMessage || successMessage}
        </p>
      )}

      {showCreateForm && (
        <form
          onSubmit={handleCreate}
          className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 md:p-5"
        >
          <h2 className="font-semibold text-gray-900">Buat akun</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-sm text-gray-700">
              <span>Nama</span>
              <input
                name="name"
                required
                maxLength={100}
                autoComplete="name"
                className={inputClassName}
              />
            </label>
            <label className="space-y-1 text-sm text-gray-700">
              <span>Username</span>
              <input
                name="username"
                required
                maxLength={50}
                autoComplete="username"
                className={inputClassName}
              />
            </label>
            <label className="space-y-1 text-sm text-gray-700">
              <span>Password awal</span>
              <input
                name="password"
                type="password"
                required
                minLength={12}
                maxLength={72}
                autoComplete="new-password"
                className={inputClassName}
              />
              <span className="block text-xs text-gray-500">
                12-72 byte; password disimpan sebagai hash.
              </span>
            </label>
            <label className="space-y-1 text-sm text-gray-700">
              <span>Role</span>
              <select name="role" defaultValue="STF" className={inputClassName}>
                {roles.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Menyimpan..." : "Simpan pengguna"}
          </button>
        </form>
      )}

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Total pengguna</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {users.length}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Pengguna aktif</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {activeCount}
          </p>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-gray-200 p-3 sm:flex-row sm:items-center sm:justify-between md:p-4">
          <h2 className="font-semibold text-gray-900">Daftar pengguna</h2>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari nama, username, atau role..."
            aria-label="Cari pengguna"
            className={`${inputClassName} sm:max-w-xs`}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th scope="col" className="px-4 py-3">Pengguna</th>
                <th scope="col" className="px-4 py-3">Role</th>
                <th scope="col" className="px-4 py-3">Status</th>
                <th scope="col" className="px-4 py-3">Dibuat</th>
                <th scope="col" className="px-4 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="text-gray-700">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.username}</p>
                  </td>
                  <td className="px-4 py-3">{getRoleLabel(user.role)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        user.is_active
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {user.is_active ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {formatCreatedAt(user.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingUser(user)}
                        disabled={pending}
                        className="rounded-md border border-gray-300 px-2.5 py-1.5 text-xs font-medium hover:bg-gray-50 disabled:opacity-60"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setPasswordUser(user)}
                        disabled={pending}
                        className="rounded-md border border-gray-300 px-2.5 py-1.5 text-xs font-medium hover:bg-gray-50 disabled:opacity-60"
                      >
                        Reset password
                      </button>
                      <button
                        type="button"
                        onClick={() => void toggleActive(user)}
                        disabled={
                          pending ||
                          (user.id === currentUserId && user.is_active)
                        }
                        className={`rounded-md border px-2.5 py-1.5 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50 ${
                          user.is_active
                            ? "border-red-200 text-red-700 hover:bg-red-50"
                            : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                        }`}
                      >
                        {user.is_active ? "Nonaktifkan" : "Aktifkan"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-sm text-gray-500"
                  >
                    {users.length === 0
                      ? "Belum ada pengguna."
                      : "Tidak ada pengguna yang cocok."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={handleUpdate}
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-user-title"
            className="w-full max-w-lg space-y-4 rounded-xl bg-white p-5 shadow-xl"
          >
            <h2 id="edit-user-title" className="text-lg font-semibold text-gray-900">
              Edit pengguna
            </h2>
            <label className="block space-y-1 text-sm text-gray-700">
              <span>Nama</span>
              <input
                name="name"
                defaultValue={editingUser.name}
                required
                maxLength={100}
                className={inputClassName}
              />
            </label>
            <label className="block space-y-1 text-sm text-gray-700">
              <span>Username</span>
              <input
                name="username"
                defaultValue={editingUser.username}
                required
                maxLength={50}
                className={inputClassName}
              />
            </label>
            <label className="block space-y-1 text-sm text-gray-700">
              <span>Role</span>
              <select
                name="role"
                defaultValue={editingUser.role}
                className={inputClassName}
              >
                {roles.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={pending}
                className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {pending ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </form>
        </div>
      )}

      {passwordUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={handlePasswordReset}
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-password-title"
            className="w-full max-w-lg space-y-4 rounded-xl bg-white p-5 shadow-xl"
          >
            <h2
              id="reset-password-title"
              className="text-lg font-semibold text-gray-900"
            >
              Reset password
            </h2>
            <p className="text-sm text-gray-600">
              Atur password baru untuk {passwordUser.username}.
            </p>
            <label className="block space-y-1 text-sm text-gray-700">
              <span>Password baru</span>
              <input
                name="password"
                type="password"
                required
                minLength={12}
                maxLength={72}
                autoComplete="new-password"
                className={inputClassName}
              />
              <span className="block text-xs text-gray-500">
                12-72 byte; password tidak ditampilkan kembali.
              </span>
            </label>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPasswordUser(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={pending}
                className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {pending ? "Menyimpan..." : "Simpan password"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
