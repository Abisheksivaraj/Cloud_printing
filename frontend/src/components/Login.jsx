import React, { useState } from "react";
import { Eye, EyeOff, Mail, Lock, Loader2, ArrowRight, Shield } from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import { API_URLS, callEdgeFunction } from "../supabaseClient";
import bg from "../assets/bg.jpg";

const Login = ({ onLogin, onSwitchToSignup }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [focusedField, setFocusedField] = useState(null);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!formData.email || !formData.password) {
      toast.error("Please enter both email and password.");
      return;
    }

    setLoading(true);
    console.log("Login: Initiating authentication protocol...");

    try {
      const payload = {
        email: formData.email.trim().toLowerCase(),
        password: formData.password
      };

      const authData = await callEdgeFunction(API_URLS.LOGIN, payload);
      console.log("Login: Authentication successful:", authData);

      const token = authData.access_token || authData.token;
      if (token) {
        sessionStorage.setItem("authToken", token);
        // We store the user data for session persistence
        const userData = authData.admin || authData.user;
        if (userData) {
          sessionStorage.setItem("userData", JSON.stringify(userData));
          toast.success("Access Granted. Welcome back.");
          onLogin(userData);
        } else {
          throw new Error("Invalid response format: user data missing");
        }
      } else {
        throw new Error("Authentication failed: session token missing");
      }
    } catch (error) {
      console.error("Login: Access denied:", error);
      toast.error(error.message || "Invalid credentials. Please verify your access point.");
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen relative flex font-inter bg-[#F5F7F9]">
      <Toaster position="top-right" />

      {/* Background Hero Section (Hidden on small screens) */}
      <div className="hidden lg:flex lg:w-7/12 relative overflow-hidden bg-black">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-60 scale-105"
          style={{
            backgroundImage: `url(${bg})`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-[#38474F] via-transparent to-transparent opacity-90" />

        <div className="relative z-10 w-full flex flex-col justify-between p-16">
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-md w-16 h-16 rounded-2xl flex items-center justify-center border border-white/20">
              <Shield className="text-white" size={32} />
            </div>
            <h1 className="text-6xl font-black text-white leading-tight uppercase tracking-tighter">
              Perfect <br />
              <span className="text-[#39A3DD]">Labeler</span>
            </h1>
            <p className="text-xl text-white/70 max-w-md font-medium">
              Enterprise Cloud Printing & Label Automation Protocol. Secure your assets.
            </p>
          </div>

          <div className="flex items-center gap-8 text-white/50 text-[10px] font-black uppercase tracking-[0.4em]">
            <span>Production v2.4.0</span>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
            <span>Global Sync Enabled</span>
          </div>
        </div>
      </div>

      {/* Login Card Container */}
      <div className="w-full lg:w-5/12 flex items-center justify-center p-8 bg-[#F5F7F9] relative overflow-hidden">
        {/* Decorative elements for mobile */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-500/5 rounded-full blur-3xl -ml-32 -mb-32" />

        <div className="w-full max-w-md space-y-10 relative z-10">
          <div className="text-center lg:text-left space-y-2">
            <h2 className="text-3xl font-black text-[#38474F] uppercase tracking-tight">Access Point</h2>
            <p className="text-[#8A9BA5] font-medium">Identify yourself to enter the design environment.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8A9BA5] ml-1">Identity Protocol</label>
              <div className="relative group">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-10 flex justify-center text-[#8A9BA5]">
                  <Mail size={18} className="group-focus-within:text-[#39A3DD] transition-colors" />
                </div>
                <input
                  required
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full bg-transparent border-b-2 border-gray-200 py-3 pl-10 text-base text-[#38474F] font-bold outline-none focus:border-[#39A3DD] transition-colors placeholder:text-gray-300"
                  placeholder="operator@enterprise.com"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8A9BA5] ml-1">Access Cipher</label>
              <div className="relative group">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-10 flex justify-center text-[#8A9BA5]">
                  <Lock size={18} className="group-focus-within:text-[#38474F] transition-colors" />
                </div>
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full bg-transparent border-b-2 border-gray-200 py-3 pl-10 pr-12 text-base text-[#38474F] font-bold outline-none focus:border-[#38474F] transition-colors placeholder:text-gray-300"
                  placeholder="••••••••••••"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-[#8A9BA5] hover:text-[#38474F] transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="pt-8">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#38474F] hover:bg-black text-white py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-[13px] transition-all shadow-xl shadow-gray-900/10 active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : (
                  <>
                    <span>Initialize Session</span>
                    <ArrowRight size={18} className="opacity-50" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Registration Redirect */}
          <div className="text-center pt-8 border-t border-gray-100">
            <p className="text-sm text-[#8A9BA5] font-medium">
              New identity required?{' '}
              <button
                onClick={onSwitchToSignup}
                className="text-[#E85874] hover:text-[#C4455D] font-black uppercase tracking-widest text-xs ml-2 transition-colors"
              >
                Register Design Team
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
