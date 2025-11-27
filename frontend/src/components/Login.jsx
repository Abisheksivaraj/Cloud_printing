import React, { useState } from "react";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import bg from "../assets/bg.jpg";
const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
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

  const handleSubmit = () => {
    console.log("Login attempt:", formData);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen relative flex">
      {/* Background Image - Full Page */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${bg})`,
        }}
      />

      {/* Login Card - Right Side */}
      <div className="relative z-10 w-full flex justify-end items-center pr-8 md:pr-16 lg:pr-24">
        <div className="opacity-80 bg-white rounded-lg shadow-xl p-8 w-[30rem] border-0 elevation-3">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Login</h1>
          </div>

          {/* Login Form */}
          <div className="space-y-6">
            {/* Email Field - MUI Outlined Style */}
            <div className="relative">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField(null)}
                className={`w-full px-4 py-4 border-2 rounded-md outline-none transition-all duration-200 bg-white text-gray-800 peer ${
                  focusedField === "email" || formData.email
                    ? "border-black pt-6 pb-2"
                    : "border-gray-300 hover:border-gray-400"
                }`}
                placeholder=" "
              />
              <label
                className={`absolute left-4 transition-all duration-200 pointer-events-none ${
                  focusedField === "email" || formData.email
                    ? "top-2 text-xs text-blue-500 font-medium"
                    : "top-4 text-base text-gray-500"
                }`}
              >
                username or Email
              </label>
              <Mail
                className={`absolute right-3 top-4 w-5 h-5 transition-colors duration-200 ${
                  focusedField === "email" ? "text-blue-500" : "text-gray-400"
                }`}
              />
            </div>

            {/* Password Field - MUI Outlined Style */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField(null)}
                className={`w-full px-4 py-4 pr-20 border-2 rounded-md outline-none transition-all duration-200 bg-white text-gray-800 peer ${
                  focusedField === "password" || formData.password
                    ? "border-black pt-6 pb-2"
                    : "border-gray-300 hover:border-gray-400"
                }`}
                placeholder=" "
              />
              <label
                className={`absolute left-4 transition-all duration-200 pointer-events-none ${
                  focusedField === "password" || formData.password
                    ? "top-2 text-xs text-blue-500 font-medium"
                    : "top-4 text-base text-gray-500"
                }`}
              >
                Password
              </label>

              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-4 text-gray-400 hover:text-gray-600 transition-colors duration-200 p-1 rounded-full hover:bg-gray-100"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>

            <button
              onClick={handleSubmit}
              className="w-full bg-black hover:bg-green-700 active:bg-blue-800 text-white py-3 px-6 rounded-md font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] uppercase text-sm tracking-wide"
            >
              LOgin
            </button>

            {/* Register Link */}
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <button className="text-blue-600 hover:text-blue-800 font-medium hover:underline">
                  Sign Up
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
