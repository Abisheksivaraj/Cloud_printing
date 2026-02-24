import React, { useState } from "react";
import { Mail, Lock, User, Building2, Phone, Loader2, ArrowLeft, ShieldCheck, Zap, ArrowRight } from "lucide-react";
import { useTheme } from "../../ThemeContext";
import { useLanguage } from "../../LanguageContext";
import { toast, Toaster } from "react-hot-toast";
import { callEdgeFunction, API_URLS, supabase } from "../../supabaseClient";
import { motion } from "framer-motion";
import logo from "../../assets/companyLogo.png";

const Signup = ({ onSignup, onSwitchToLogin }) => {
    const { theme } = useTheme();
    const { t } = useLanguage();
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        companyName: "",
        email: "",
        mobileNumber: "",
        password: "",
        confirmPassword: "",
    });

    const [loading, setLoading] = useState(false);
    const [isInvite, setIsInvite] = useState(false);
    const [error, setError] = useState("");

    React.useEffect(() => {
        const handleAuth = async () => {
            const hash = window.location.hash;
            const queryParams = new URLSearchParams(window.location.search);
            let email = queryParams.get('email');
            let companyName = queryParams.get('companyName');

            if (hash) {
                const hashParams = new URLSearchParams(hash.replace('#', ''));
                const access_token = hashParams.get('access_token');
                const type = hashParams.get('type');

                // Check hash for email/companyName as well
                if (!email) email = hashParams.get('email');
                if (!companyName) companyName = hashParams.get('companyName');

                if (access_token && (type === 'invite' || type === 'signup')) {
                    setIsInvite(true);
                    await supabase.auth.setSession({ access_token, refresh_token: "" });
                }
            }

            if (email || companyName) {
                setFormData(prev => ({
                    ...prev,
                    email: email || prev.email,
                    companyName: companyName || prev.companyName
                }));
            }
        };
        handleAuth();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (formData.password !== formData.confirmPassword) {
            const msg = "Security credentials do not match.";
            setError(msg);
            toast.error(msg);
            return;
        }

        setLoading(true);
        try {
            await callEdgeFunction(API_URLS.COMPLETE_PROFILE, {
                first_name: formData.firstName,
                last_name: formData.lastName,
                company_name: formData.companyName,
                mobile_number: formData.mobileNumber,
                email: formData.email,
                password: formData.password,
            });
            toast.success("Identity Provisioned Successful!");
            const loginData = await callEdgeFunction(API_URLS.LOGIN, { email: formData.email, password: formData.password });
            onSignup(loginData.admin || loginData.user);
        } catch (err) {
            const errorMessage = err.message || "Credential verification failed.";
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen w-full flex bg-[#F5F7F9] overflow-hidden font-inter">
            {/* Left Design - Fixed Hero (ALWAYS VISIBLE) */}
            <div className="hidden lg:flex lg:w-4/12 flex-col justify-between p-10 xl:p-12 relative bg-white border-r border-gray-100 z-20">
                <div className="max-w-md w-full">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8"
                    >
                        <img src={logo} alt="Archery Technocrats" className="h-10 mb-8" />
                        <h1 className="text-5xl font-black text-[#38474F] mb-4 leading-tight font-oswald uppercase tracking-tight">
                            Identity <br /><span className="text-[#E85874]">Registry.</span>
                        </h1>
                        <p className="text-sm text-[#8A9BA5] leading-relaxed font-medium mb-8">
                            Join the elite enterprise network for professional label synchronization.
                        </p>

                        {/* NAV LINK MOVED TO HERO FOR VISIBILITY */}
                        <button
                            onClick={onSwitchToLogin}
                            className="inline-flex items-center gap-3 px-6 py-3 border-2 border-gray-100 rounded-xl text-xs font-black text-[#38474F] hover:bg-[#38474F] hover:text-white hover:border-[#38474F] transition-all uppercase tracking-widest group"
                        >
                            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                            Return to Login
                        </button>
                    </motion.div>

                    <div className="space-y-3 mt-12">
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border-l-4 border-[#E85874]">
                            <div className="text-[#E85874] font-black"><Zap size={18} /></div>
                            <div>
                                <h3 className="text-[10px] font-black text-[#38474F] uppercase tracking-wider">Dynamic Node</h3>
                                <p className="text-[#8A9BA5] text-[9px] font-medium leading-tight">Provision global assets in milliseconds.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border-l-4 border-[#39A3DD]">
                            <div className="text-[#39A3DD] font-black"><ShieldCheck size={18} /></div>
                            <div>
                                <h3 className="text-[10px] font-black text-[#38474F] uppercase tracking-wider">Secure Protocol</h3>
                                <p className="text-[#8A9BA5] text-[9px] font-medium leading-tight">Secured with enterprise encryption.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase text-[#8A9BA5] tracking-[0.3em]">v2.4.0 • PRODUCTION</span>
                </div>
            </div>

            {/* Right Form - Skewed Section */}
            <div className="w-full lg:w-8/12 flex flex-col justify-center p-8 md:p-12 lg:p-16 relative z-10 bg-[#F5F7F9] overflow-hidden">
                {/* Skewed Decoration */}
                <div className="absolute top-0 left-0 w-24 h-full bg-white -ml-12 skew-x-[-15deg] border-r border-gray-100 shadow-[10px_0_40px_rgba(0,0,0,0.03)] hidden lg:block z-0"></div>

                <div className="max-w-3xl w-full mx-auto relative z-10">
                    <div className="lg:hidden mb-8 text-center flex flex-col items-center gap-4">
                        <img src={logo} alt="Archery Technocrats" className="h-8 mx-auto" />
                        <button onClick={onSwitchToLogin} className="text-[10px] font-black text-[#E85874] uppercase tracking-widest underline">Return to Login</button>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="mb-8 text-center lg:text-left"
                    >
                        <h2 className="text-4xl xl:text-5xl font-black text-[#38474F] mb-2 font-oswald uppercase tracking-tight">New Admin Registration</h2>
                        <p className="text-[#8A9BA5] font-medium italic text-base">Fill in the enterprise registration form to provision your slot.</p>
                    </motion.div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-[#8A9BA5] ml-1">First Name</label>
                                <div className="relative group">
                                    <User className="absolute left-0 top-1/2 -translate-y-1/2 text-[#8A9BA5] group-focus-within:text-[#E85874] transition-colors" size={16} />
                                    <input required name="firstName" value={formData.firstName} onChange={handleChange} placeholder="John" className="w-full bg-transparent border-b-2 border-gray-200 py-2.5 pl-8 text-base text-[#38474F] font-bold outline-none focus:border-[#E85874] transition-colors" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-[#8A9BA5] ml-1">Last Name</label>
                                <div className="relative group">
                                    <User className="absolute left-0 top-1/2 -translate-y-1/2 text-[#8A9BA5] group-focus-within:text-[#E85874] transition-colors" size={16} />
                                    <input required name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Doe" className="w-full bg-transparent border-b-2 border-gray-200 py-2.5 pl-8 text-base text-[#38474F] font-bold outline-none focus:border-[#E85874] transition-colors" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-[#8A9BA5] ml-1">Company Name</label>
                            <div className="relative group">
                                <Building2 className="absolute left-0 top-1/2 -translate-y-1/2 text-[#8A9BA5] group-focus-within:text-[#39A3DD] transition-colors" size={16} />
                                <input required name="companyName" value={formData.companyName} onChange={handleChange} placeholder="Global Prints Inc." className="w-full bg-transparent border-b-2 border-gray-200 py-3 pl-8 text-base text-[#38474F] font-bold outline-none focus:border-[#39A3DD] transition-colors" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-[#8A9BA5] ml-1">E-mail</label>
                                <div className="relative group">
                                    <Mail className="absolute left-0 top-1/2 -translate-y-1/2 text-[#8A9BA5] group-focus-within:text-[#39A3DD] transition-colors" size={16} />
                                    <input required type="email" name="email" value={formData.email} onChange={handleChange} disabled={isInvite && !!formData.email} placeholder="john@company.com" className={`w-full bg-transparent border-b-2 border-gray-200 py-2.5 pl-8 text-base text-[#38474F] font-bold outline-none focus:border-[#39A3DD] transition-colors ${isInvite && formData.email ? 'opacity-50' : ''}`} />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-[#8A9BA5] ml-1">Mobile</label>
                                <div className="relative group">
                                    <Phone className="absolute left-0 top-1/2 -translate-y-1/2 text-[#8A9BA5] group-focus-within:text-[#39A3DD] transition-colors" size={16} />
                                    <input required type="tel" name="mobileNumber" value={formData.mobileNumber} onChange={handleChange} placeholder="+91 00000 00000" className="w-full bg-transparent border-b-2 border-gray-100 py-2.5 pl-8 text-base text-[#38474F] font-bold outline-none focus:border-[#39A3DD] transition-colors" />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-[#8A9BA5] ml-1">Password</label>
                                <div className="relative group">
                                    <Lock className="absolute left-0 top-1/2 -translate-y-1/2 text-[#8A9BA5] group-focus-within:text-[#38474F] transition-colors" size={16} />
                                    <input required type="password" name="password" value={formData.password} onChange={handleChange} placeholder="••••••••" className="w-full bg-transparent border-b-2 border-gray-200 py-2.5 text-base text-[#38474F] font-bold outline-none focus:border-[#38474F] transition-colors pl-8" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-[#8A9BA5] ml-1">Confirm Password</label>
                                <div className="relative group">
                                    <Lock className="absolute left-0 top-1/2 -translate-y-1/2 text-[#8A9BA5] group-focus-within:text-[#38474F] transition-colors" size={16} />
                                    <input required type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••" className="w-full bg-transparent border-b-2 border-gray-100 py-2.5 text-base text-[#38474F] font-bold outline-none focus:border-[#38474F] transition-colors pl-8" />
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-6">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full md:w-auto px-12 py-4 bg-[#E85874] hover:bg-[#C4455D] text-white font-black uppercase tracking-[0.3em] text-[13px] rounded-xl shadow-xl shadow-pink-500/10 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                            >
                                {loading ? <Loader2 className="animate-spin" size={20} /> : (
                                    <>
                                        <span>ADMIN ONBOARD</span>
                                        <ArrowRight size={18} className="opacity-50" />
                                    </>
                                )}
                            </button>
                            <p className="text-[9px] text-[#8A9BA5] font-black uppercase tracking-widest text-center flex items-center gap-2 opacity-60">
                                <ShieldCheck size={12} className="text-green-500" /> AUTHORIZED NODES ONLY
                            </p>
                        </div>
                    </form>
                </div>
            </div>
            <Toaster position="top-right" />
        </div>
    );
};

export default Signup;
