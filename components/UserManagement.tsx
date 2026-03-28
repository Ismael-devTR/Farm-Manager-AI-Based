"use client";

import { useActionState, useState, useRef, useEffect, useTransition } from "react";
import { createUser, updateUserRole, resetUserPassword, deleteUser } from "@/lib/actions/user";
import type { ActionState } from "@/lib/actions/user";
import { useDict } from "@/components/LocaleProvider";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type Props = {
  users: User[];
  currentUserId: string;
};

export default function UserManagement({ users, currentUserId }: Props) {
  const dict = useDict();
  const t = dict.settings;

  return (
    <div className="space-y-6">
      <AddUserForm />
      {users.length === 0 ? (
        <p className="text-sm text-gray-500">{t.noUsers}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-3 py-2 font-medium text-gray-600">{t.userName}</th>
                <th className="text-left px-3 py-2 font-medium text-gray-600">{t.userEmail}</th>
                <th className="text-left px-3 py-2 font-medium text-gray-600">{t.userRole}</th>
                <th />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <UserRow key={u.id} user={u} isSelf={u.id === currentUserId} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AddUserForm() {
  const dict = useDict();
  const t = dict.settings;
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(createUser, {});

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  const cls = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500";

  return (
    <form ref={formRef} action={action} className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">{t.userName}</label>
        <input name="name" required className={cls} />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">{t.userEmail}</label>
        <input name="email" type="email" required className={cls} />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">{t.userPassword}</label>
        <input name="password" type="password" required minLength={6} className={cls} />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">{t.userRole}</label>
        <select name="role" required className={cls}>
          <option value="VIEWER">{t.roleViewer}</option>
          <option value="EDITOR">{t.roleEditor}</option>
          <option value="ADMIN">{t.roleAdmin}</option>
        </select>
      </div>
      <div>
        <button
          type="submit"
          disabled={pending}
          className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors"
        >
          {pending ? t.adding : t.addUser}
        </button>
      </div>
      {(state.error || state.success) && (
        <p className={`sm:col-span-5 text-sm ${state.error ? "text-red-600" : "text-green-600"}`}>
          {state.error || state.success}
        </p>
      )}
    </form>
  );
}

function UserRow({ user, isSelf }: { user: User; isSelf: boolean }) {
  const dict = useDict();
  const t = dict.settings;
  const [isPending, startTransition] = useTransition();
  const [roleError, setRoleError] = useState<string | null>(null);
  const [showReset, setShowReset] = useState(false);

  const roleLabels: Record<string, string> = {
    ADMIN: t.roleAdmin,
    EDITOR: t.roleEditor,
    VIEWER: t.roleViewer,
  };

  function handleRoleChange(newRole: string) {
    setRoleError(null);
    startTransition(async () => {
      const result = await updateUserRole(user.id, newRole as "ADMIN" | "EDITOR" | "VIEWER");
      if (result.error) setRoleError(result.error);
    });
  }

  function handleDelete() {
    if (!confirm(t.confirmDeleteUser)) return;
    startTransition(async () => {
      const result = await deleteUser(user.id);
      if (result.error) alert(result.error);
    });
  }

  return (
    <>
      <tr className={isPending ? "opacity-50" : ""}>
        <td className="px-3 py-2 font-medium">{user.name}</td>
        <td className="px-3 py-2 text-gray-600">{user.email}</td>
        <td className="px-3 py-2">
          <select
            value={user.role}
            onChange={(e) => handleRoleChange(e.target.value)}
            disabled={isPending}
            className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {Object.entries(roleLabels).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
          {roleError && <p className="text-xs text-red-600 mt-0.5">{roleError}</p>}
        </td>
        <td className="px-3 py-2 text-right space-x-2">
          <button
            onClick={() => setShowReset(!showReset)}
            className="text-xs text-blue-600 hover:underline"
          >
            {t.resetPassword}
          </button>
          {!isSelf && (
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="text-xs text-red-500 hover:underline"
            >
              {t.deleteUser}
            </button>
          )}
        </td>
      </tr>
      {showReset && (
        <tr>
          <td colSpan={4} className="px-3 py-2 bg-gray-50">
            <ResetPasswordForm userId={user.id} onDone={() => setShowReset(false)} />
          </td>
        </tr>
      )}
    </>
  );
}

function ResetPasswordForm({ userId, onDone }: { userId: string; onDone: () => void }) {
  const dict = useDict();
  const t = dict.settings;
  const boundAction = resetUserPassword.bind(null, userId);
  const [state, action, pending] = useActionState(boundAction, {} as ActionState);

  useEffect(() => {
    if (state.success) {
      const timer = setTimeout(onDone, 1500);
      return () => clearTimeout(timer);
    }
  }, [state.success, onDone]);

  const cls = "rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500";

  return (
    <form action={action} className="flex items-center gap-3">
      <input name="newPassword" type="password" required minLength={6} placeholder={t.newPassword} className={cls} />
      <button
        type="submit"
        disabled={pending}
        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium px-3 py-1.5 rounded-lg text-xs transition-colors"
      >
        {pending ? t.resettingPassword : t.resetPassword}
      </button>
      <button type="button" onClick={onDone} className="text-xs text-gray-500 hover:text-gray-700">
        {dict.common.cancel}
      </button>
      {state.error && <span className="text-xs text-red-600">{state.error}</span>}
      {state.success && <span className="text-xs text-green-600">{state.success}</span>}
    </form>
  );
}
