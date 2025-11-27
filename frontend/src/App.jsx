// import React from "react";
// import {
//   BrowserRouter as Router,
//   Route,
//   Routes,
//   useLocation,
// } from "react-router-dom";
// import Home from "./components/Home";
// import Footer from "./components/Footer"; // Fixed casing
// import Login from "./components/Login"; // Fixed casing

// // Create a separate component for the app content that uses useLocation
// const AppContent = () => {
//   const location = useLocation();
//   const isAuthPage = location.pathname === "/";
//   const isDashboard = location.pathname === "/dashboard";

//   return (
//     <div
//       style={{
//         display: "flex",
//         flexDirection: "column",
//         minHeight: "100vh",
//       }}
//     >
//       {/* Show Home component for non-auth pages */}
//       {!isAuthPage && <Home />}

//       {/* Main content area */}
//       <div style={{ flex: 1 }}>
//         <Routes>
//           <Route path="/" element={<Login />} />
//           {/* Add other routes here as needed */}
//           {/* Example: <Route path="/dashboard" element={<Dashboard />} /> */}
//         </Routes>
//       </div>

//       {/* Show Footer for non-auth and non-dashboard pages */}
//       {!isAuthPage && !isDashboard && (
//         <div
//           style={{
//             position: "fixed",
//             bottom: 0,
//             left: 0,
//             width: "100%",
//             backgroundColor: "white",
//             zIndex: 1000,
//           }}
//         >
//           <Footer />
//         </div>
//       )}
//     </div>
//   );
// };

// const App = () => {
//   return (
//     <Router>
//       <AppContent />
//     </Router>
//   );
// };

// export default App;


import React from 'react'
// import Home from "./components/Home";
import LabelDesign from './components/LabelDesign';
import AddModel from './components/AddModel';

const App = () => {
  return (
    <div><LabelDesign/></div>
    // <div><AddModel/></div>
  )
}

export default App
