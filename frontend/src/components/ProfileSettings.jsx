import React, { useState } from "react";
import { User, Mail, Shield, Lock, Key, CheckCircle, AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import { supabase } from "../supabaseClient";

const ProfileSettings = ({ userRole, userData, onBack }) => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const firstName = userData?.first_name || '';
  const lastName = userData?.last_name || '';
  const fullName = firstName || lastName ? `${firstName} ${lastName}`.trim() : userData?.name || 'User';
  const email = userData?.email || '';

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    if (!oldPassword || !newPassword || !confirmPassword) {
      setMessage({ type: "error", text: "Please fill in all password fields." });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "New password and confirm password do not match." });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "New password must be at least 6 characters long." });
      return;
    }

    setIsLoading(true);
    try {
      // 1. Verify old password by re-authenticating
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: oldPassword,
      });

      if (signInError) {
        setMessage({ type: "error", text: "Incorrect current password." });
        setIsLoading(false);
        return;
      }

      // 2. If successful, update user password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        setMessage({ type: "error", text: updateError.message });
      } else {
        setMessage({ type: "success", text: "Password changed successfully!" });
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (error) {
      setMessage({ type: "error", text: "An unexpected error occurred." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 transition-colors duration-300">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="space-y-2">
          {onBack && (
            <button 
              onClick={onBack}
              className="group flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[var(--color-primary)] transition-colors mb-4"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Back
            </button>
          )}
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Profile Settings
          </h1>
          <p className="text-slate-500 font-medium">Manage your account details and security settings.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Profile Overview Card */}
          <div className="card md:col-span-1 p-6 flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-3xl bg-slate-100 dark:bg-slate-800 text-[var(--color-primary)] flex items-center justify-center text-3xl font-black border-2 border-slate-200 dark:border-slate-700 shadow-sm mb-4 uppercase">
              {fullName[0]}
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{fullName}</h2>
            <p className="text-sm text-slate-500 mb-4 break-all">{email}</p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs font-bold uppercase tracking-wider">
              <Shield size={14} />
              {userRole || 'Operator'}
            </div>
          </div>

           {/* Details and Security Forms */}
          <div className="md:col-span-2 space-y-6">
            
            {/* User Details */}
            <div className="card p-6">
               <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                 <User className="text-[var(--color-primary)]" size={20} />
                 Account Details
               </h3>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">First Name</label>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-200 font-medium cursor-not-allowed opacity-80">
                      {firstName || '-'}
                    </div>
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Last Name</label>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-200 font-medium cursor-not-allowed opacity-80">
                      {lastName || '-'}
                    </div>
                 </div>
                 <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Email Address</label>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-200 font-medium cursor-not-allowed opacity-80 flex items-center gap-2">
                      <Mail size={16} className="text-slate-400" />
                      <span className="truncate">{email}</span>
                    </div>
                 </div>
               </div>
            </div>

            {/* Change Password */}
            <div className="card p-6 border-l-4 border-l-rose-500">
               <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                 <Lock className="text-rose-500" size={20} />
                 Change Password
               </h3>
               <p className="text-sm text-slate-500 mb-6">Update your password to keep your account secure.</p>

               {message.text && (
                <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 border ${
                  message.type === 'error' 
                    ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/30 dark:border-rose-900 dark:text-rose-400' 
                    : 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-900 dark:text-emerald-400'
                }`}>
                  {message.type === 'error' ? <AlertCircle size={20} className="shrink-0 mt-0.5" /> : <CheckCircle size={20} className="shrink-0 mt-0.5" />}
                  <span className="text-sm font-medium leading-relaxed">{message.text}</span>
                </div>
               )}

               <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Current Password</label>
                    <div className="relative">
                      <Key size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="password" 
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        className="input pl-10 w-full"
                        placeholder="Enter your current password"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">New Password</label>
                      <input 
                        type="password" 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="input w-full"
                        placeholder="Enter new password"
                        required
                        minLength={6}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Confirm New Password</label>
                      <input 
                        type="password" 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="input w-full"
                        placeholder="Confirm new password"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                     <button
                       type="submit"
                       disabled={isLoading}
                       className="btn text-white bg-rose-500 hover:bg-rose-600 disabled:opacity-50 min-w-[150px] shadow-sm shadow-rose-500/20"
                     >
                       {isLoading ? <Loader2 size={18} className="animate-spin" /> : "Update Password"}
                     </button>
                  </div>
               </form>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
