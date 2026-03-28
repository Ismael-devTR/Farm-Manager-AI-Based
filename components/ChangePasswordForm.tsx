"use client";

import { useActionState, useRef, useEffect } from "react";
import { changeOwnPassword } from "@/lib/actions/user";
import { useDict } from "@/components/LocaleProvider";

export default function ChangePasswordForm() {
  const dict = useDict();
  const t = dict.settings;
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(changeOwnPassword, {});

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  const cls = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500";

  return (
    <form ref={formRef} action={action} className="space-y-4 max-w-sm">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t.currentPassword}</label>
        <input name="currentPassword" type="password" required className={cls} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t.newPassword}</label>
        <input name="newPassword" type="password" required minLength={6} className={cls} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t.confirmPassword}</label>
        <input name="confirmPassword" type="password" required minLength={6} className={cls} />
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && <p className="text-sm text-green-600">{state.success}</p>}

      <button
        type="submit"
        disabled={pending}
        className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium px-5 py-2 rounded-lg text-sm transition-colors"
      >
        {pending ? t.updatingPassword : t.updatePassword}
      </button>
    </form>
  );
}
