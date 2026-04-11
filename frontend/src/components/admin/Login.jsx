import React, { useState } from "react";
import { Mail, Lock, Loader2, ArrowRight, Cloud, ShieldCheck, Zap, BarChart2, Eye, EyeOff } from "lucide-react";
import { useLanguage } from "../../LanguageContext";
import { toast, Toaster } from "react-hot-toast";
import { callEdgeFunction, API_URLS, supabase } from "../../supabaseClient";
import { motion } from "framer-motion";
import logo from "../../assets/logo.png";
import cloudPattern from "../../assets/bg.png";

const Login = ({ onLogin }) => {
    const { t } = useLanguage();
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        rememberMe: false,
    });

    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({ 
            ...formData, 
            [name]: type === "checkbox" ? checked : value 
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const data = await callEdgeFunction(API_URLS.LOGIN, {
                email: formData.email.trim().toLowerCase(),
                password: formData.password,
            });

            const token = data.access_token || data.token;
            const refreshToken = data.refresh_token || data.refreshToken;
            if (token) {
                sessionStorage.setItem("authToken", token);
                if (refreshToken) sessionStorage.setItem("refreshToken", refreshToken);
                await supabase.auth.setSession({
                    access_token: token,
                    refresh_token: refreshToken || ""
                });
            }
            if (data.admin) sessionStorage.setItem("userData", JSON.stringify(data.admin));
            if (data.user) sessionStorage.setItem("userData", JSON.stringify(data.user));

            toast.success("Welcome back! Signing you in...");
            onLogin(data.admin || data.user);
        } catch (err) {
            console.error("Login error:", err);
            const errorMessage = err.message || "Invalid credentials.";
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const sidebarFeatures = [
        { icon: <Cloud size={20} />, title: "Cloud Printing", desc: "Access from any device" },
        { icon: <ShieldCheck size={20} />, title: "Secure", desc: "Enterprise-grade protection" },
        { icon: <Zap size={20} />, title: "Fast & Reliable", desc: "High-speed workflows" },
        { icon: <BarChart2 size={20} />, title: "Smart Analytics", desc: "Insightful print tracking" },
    ];

    return (
        <div className="h-screen w-full flex bg-white font-inter overflow-hidden">
            {/* Sidebar Section */}
            <div className="hidden lg:flex lg:w-4/12 flex-col justify-between p-12 relative bg-gradient-to-br from-[#1b437c] to-[#0d213f] text-white">
                <div className="relative z-10">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        className="space-y-12"
                    >
                        <div className="space-y-4">
                            <h1 className="text-4xl font-black tracking-tight leading-tight uppercase font-oswald">
                                Management <br />
                                <span className="text-[#39A3DD]">Portal.</span>
                            </h1>
                            <p className="text-blue-100/60 font-medium text-sm leading-relaxed max-w-xs">
                                Professional label management and high-speed cloud printing infrastructure.
                            </p>
                        </div>

                        <div className="space-y-10">
                            {sidebarFeatures.map((feature, idx) => (
                                <div key={idx} className="flex items-start gap-4">
                                    <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-sm text-[#39A3DD]">
                                        {feature.icon}
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-sm font-bold uppercase tracking-wider">{feature.title}</h3>
                                        <p className="text-blue-100/40 text-xs font-medium">{feature.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                <div className="relative z-10 border-t border-white/10 pt-8">
                    <p className="text-[10px] font-bold text-blue-100/30 uppercase tracking-[0.2em]">
                        v2.5.0 ENTERPRISE • PRODUCTION
                    </p>
                </div>

                {/* Decorative Background Elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#39A3DD]/5 rounded-full blur-3xl -mr-32 -mt-32" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl -ml-48 -mb-48" />
            </div>

            {/* Main Form Section */}
            <div className="flex-1 flex flex-col justify-center items-center bg-white p-6 relative overflow-hidden">
                {/* Primary Background Image Layer */}
                <div 
                    className="absolute inset-0 opacity-[1] pointer-events-none"
                    style={{ 
                        backgroundImage: `url(${cloudPattern})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        filter: 'contrast(1.1) brightness(0.95)'
                    }}
                />

                <div className="w-full max-w-md space-y-12 relative z-10">
                    
                    {/* Logo Area */}
                    <div className="flex flex-col items-center space-y-6">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            <img src={logo} alt="Perfect Labeler" className="h-40 w-auto object-contain" />
                        </motion.div>
                        <div className="text-center space-y-2">
                            <h2 className="text-3xl font-black text-[#1e293b] tracking-tight uppercase">Welcome Back</h2>
                            <p className="text-slate-400 font-medium text-sm">Sign in to manage your workstation</p>
                        </div>
                    </div>

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 ml-1">E-mail Address</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#39A3DD] transition-colors" size={18} />
                                <input
                                    required
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="name@work.com"
                                    className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-[#1e293b] font-semibold outline-none focus:border-[#39A3DD] focus:ring-4 focus:ring-blue-500/5 transition-all text-[15px]"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between px-1">
                                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Security Password</label>
                                <button type="button" className="text-[11px] font-black uppercase text-[#39A3DD] hover:text-[#2A7FAF] transition-colors tracking-tighter">Reset Access?</button>
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#39A3DD] transition-colors" size={18} />
                                <input
                                    required
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-12 text-[#1e293b] font-semibold outline-none focus:border-[#39A3DD] focus:ring-4 focus:ring-blue-500/5 transition-all text-[15px]"
                                />
                                <button 
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full relative group overflow-hidden bg-[#39A3DD] text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-sm shadow-xl shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                        >
                            <span className="relative z-10">{loading ? "Authenticating..." : "Establish Session"}</span>
                            {!loading && <ArrowRight size={20} className="relative z-10 group-hover:translate-x-1 transition-transform" />}
                            
                            {/* Hover Liquid Effect */}
                            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="text-center">
                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                            &copy; 2026 ARCHERY TECHNOCRATS • ALL RIGHTS RESERVED
                        </p>
                    </div>
                </div>
            </div>

            <Toaster position="top-right" />
        </div>
    );
};

export default Login;
