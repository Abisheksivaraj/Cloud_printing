// import React, { useState, useEffect } from "react";
// import { styled } from "@mui/material/styles";
// import Box from "@mui/material/Box";
// import Drawer from "@mui/material/Drawer";
// import CssBaseline from "@mui/material/CssBaseline";
// import MuiAppBar from "@mui/material/AppBar";
// import Toolbar from "@mui/material/Toolbar";
// import List from "@mui/material/List";
// import Divider from "@mui/material/Divider";
// import IconButton from "@mui/material/IconButton";
// import ListItem from "@mui/material/ListItem";
// import ListItemButton from "@mui/material/ListItemButton";
// import ListItemIcon from "@mui/material/ListItemIcon";
// import ListItemText from "@mui/material/ListItemText";
// import Collapse from "@mui/material/Collapse";
// import DashboardIcon from "@mui/icons-material/Dashboard";
// import TableChartIcon from "@mui/icons-material/TableChart";
// import ExpandLess from "@mui/icons-material/ExpandLess";
// import ExpandMore from "@mui/icons-material/ExpandMore";
// import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
// import ChevronRightIcon from "@mui/icons-material/ChevronRight";
// import { useLocation, useNavigate, BrowserRouter } from "react-router-dom";
// import { Routes, Route } from "react-router-dom";
// import Tooltip from "@mui/material/Tooltip";
// import logo from "../assets/logo.jpeg";
// import companyLogo from "../assets/companyLogo.png";

// import { toast, Toaster } from "react-hot-toast";

// // new
// import { FaFile } from "react-icons/fa6";
// import { RiEdit2Fill } from "react-icons/ri";
// import { IoSettings } from "react-icons/io5";

// import { Button } from "@mui/material";
// import ListAltIcon from "@mui/icons-material/ListAlt";

// import LogoutIcon from "@mui/icons-material/Logout";
// import { MdAccountCircle } from "react-icons/md";
// import { PiPrinterFill } from "react-icons/pi";
// import Dashboard from "./Dashboard";
// import LabelDesign from "./LabelDesign";
// import DesignedLabel from "./DesignedLabel";
// import Profile from "./Profile";
// import PrintJob from "./PrintJob";
// import Settings from "./Settings";

// // new route

// const drawerWidth = 240;
// const primaryColor = "#38474f";
// const dropdownColor = "#2b547e";
// const collapsedWidth = 64;

// const Main = styled("main", { shouldForwardProp: (prop) => prop !== "open" })(
//   ({ theme, open }) => ({
//     flexGrow: 1,
//     padding: theme.spacing(3),
//     transition: theme.transitions.create("margin", {
//       easing: theme.transitions.easing.sharp,
//       duration: theme.transitions.duration.leavingScreen,
//     }),
//     marginLeft: 0,
//     ...(open && {
//       marginLeft: 0,
//       transition: theme.transitions.create("margin", {
//         easing: theme.transitions.easing.easeOut,
//         duration: theme.transitions.duration.enteringScreen,
//       }),
//     }),
//   })
// );

// const AppBar = styled(MuiAppBar, {
//   shouldForwardProp: (prop) => prop !== "open",
// })(({ theme, open }) => ({
//   backgroundColor: "#38474f",
//   color: "white",
//   transition: theme.transitions.create(["margin", "width"], {
//     easing: theme.transitions.easing.sharp,
//     duration: theme.transitions.duration.leavingScreen,
//   }),
//   marginLeft: collapsedWidth,
//   width: `calc(100% - ${collapsedWidth}px)`,
//   ...(open && {
//     width: `calc(100% - ${drawerWidth}px)`,
//     marginLeft: drawerWidth,
//     transition: theme.transitions.create(["margin", "width"], {
//       easing: theme.transitions.easing.easeOut,
//       duration: theme.transitions.duration.enteringScreen,
//     }),
//   }),
// }));

// const DrawerHeader = styled("div")(({ theme }) => ({
//   display: "flex",
//   alignItems: "center",
//   padding: theme.spacing(1),
//   justifyContent: "center",
//   flexDirection: "column",
//   minHeight: 64,
// }));

// // Inner component that uses router hooks
// function PersistentDrawerLeftInner() {
//   const [open, setOpen] = useState(() => {
//     const savedOpen = localStorage.getItem("drawerOpen");
//     return savedOpen ? JSON.parse(savedOpen) : false;
//   });

//   const [dropdownOpen, setDropdownOpen] = useState(() => {
//     const savedDropdown = localStorage.getItem("dropdownOpen");
//     return savedDropdown ? JSON.parse(savedDropdown) : false;
//   });

//   const [selectedMenu, setSelectedMenu] = useState(() => {
//     return localStorage.getItem("selectedMenu") || "";
//   });

//   const navigate = useNavigate();
//   const location = useLocation();
//   const [activePath, setActivePath] = useState("/");

//   useEffect(() => {
//     localStorage.setItem("drawerOpen", JSON.stringify(open));
//   }, [open]);

//   useEffect(() => {
//     localStorage.setItem("dropdownOpen", JSON.stringify(dropdownOpen));
//   }, [dropdownOpen]);

//   const handleDrawerOpen = () => setOpen(true);
//   const handleDrawerClose = () => setOpen(false);

//   const handlePartMasterClick = () => {
//     if (!open) {
//       setOpen(true);
//       setTimeout(() => {
//         setDropdownOpen(true);
//       }, 200);
//     } else {
//       setDropdownOpen(!dropdownOpen);
//     }
//   };

//   const handleMenuClick = (menu, submenu, path) => {
//     const newSelectedMenu = `${menu}${submenu ? ` > ${submenu}` : ""}`;
//     setSelectedMenu(newSelectedMenu);
//     localStorage.setItem("selectedMenu", newSelectedMenu);

//     if (!submenu) {
//       setOpen(false);
//     }

//     navigate(path);
//   };

//   const isActive = (path) => activePath === path;
//   const isPartMasterActive = () => activePath.includes("/part");

//   const getMenuItemStyle = (isSelected) => ({
//     "&.Mui-selected": {
//       bgcolor: `${primaryColor}15`,
//       "&:hover": {
//         bgcolor: `${primaryColor}25`,
//       },
//       "& .MuiListItemIcon-root": {
//         color: primaryColor,
//       },
//       "& .MuiListItemText-primary": {
//         color: primaryColor,
//         fontWeight: "bold",
//       },
//     },
//     ...(isSelected && {
//       bgcolor: `${primaryColor}15`,
//       "&:hover": {
//         bgcolor: `${primaryColor}25`,
//       },
//       "& .MuiListItemIcon-root": {
//         color: primaryColor,
//       },
//       "& .MuiListItemText-primary": {
//         color: primaryColor,
//         fontWeight: "bold",
//       },
//     }),
//     "&:hover": {
//       bgcolor: `${primaryColor}10`,
//       "& .MuiListItemIcon-root": {
//         color: primaryColor,
//       },
//     },
//   });

//   const getDropdownStyle = (isSelected) => ({
//     pl: 4,
//     "&.Mui-selected": {
//       bgcolor: `${dropdownColor}15`,
//       "&:hover": {
//         bgcolor: `${dropdownColor}25`,
//       },
//       "& .MuiListItemIcon-root": {
//         color: dropdownColor,
//       },
//       "& .MuiListItemText-primary": {
//         color: dropdownColor,
//         fontWeight: "bold",
//       },
//     },
//     ...(isSelected && {
//       bgcolor: `${dropdownColor}15`,
//       "&:hover": {
//         bgcolor: `${dropdownColor}25`,
//       },
//       "& .MuiListItemIcon-root": {
//         color: dropdownColor,
//       },
//       "& .MuiListItemText-primary": {
//         color: dropdownColor,
//         fontWeight: "bold",
//       },
//     }),
//     "&:hover": {
//       bgcolor: `${dropdownColor}10`,
//       "& .MuiListItemIcon-root": {
//         color: dropdownColor,
//       },
//     },
//   });

//   const ListItemWithTooltip = ({ tooltip, children }) => {
//     return !open ? (
//       <Tooltip title={tooltip} placement="right">
//         {children}
//       </Tooltip>
//     ) : (
//       children
//     );
//   };

//   const isUserRoute = location.pathname.toLowerCase() === "/user";

//   const handleLogout = () => {
//     toast.success("Logged Out Successfully");
//     navigate("/", { state: { showToast: true } });
//   };

//   return (
//     <Box sx={{ display: "flex", height: "100vh", overflow: "hidden" }}>
//       <CssBaseline />
//       <AppBar position="fixed" open={open}>
//         <Toolbar
//           sx={{
//             display: "flex",
//             justifyContent: "space-between",
//             alignItems: "center",
//             pr: 2,
//           }}
//         >
//           <span
//             style={{ fontSize: "18px", fontWeight: "bold", color: "white" }}
//           >
//             {selectedMenu}
//           </span>
//         </Toolbar>
//       </AppBar>

//       <Drawer
//         variant="permanent"
//         sx={{
//           width: open ? drawerWidth : collapsedWidth,
//           flexShrink: 0,
//           "& .MuiDrawer-paper": {
//             width: open ? drawerWidth : collapsedWidth,
//             boxSizing: "border-box",
//             backgroundColor: "white",
//             overflowX: "hidden",
//             transition: (theme) =>
//               theme.transitions.create("width", {
//                 easing: theme.transitions.easing.sharp,
//                 duration: theme.transitions.duration.enteringScreen,
//               }),
//             "& .MuiIconButton-root": {
//               color: primaryColor,
//               "&:hover": {
//                 bgcolor: `${primaryColor}10`,
//               },
//             },
//             "& .MuiDivider-root": {
//               borderColor: `${primaryColor}20`,
//             },
//           },
//         }}
//       >
//         <DrawerHeader>
//           <Box
//             sx={{
//               width: "100%",
//               display: "flex",
//               justifyContent: "center",
//               transition: "all 0.2s",
//             }}
//           >
//             <img
//               src={open ? companyLogo : logo}
//               alt="Company Logo"
//               style={{ maxWidth: open ? "200px" : "40px", height: "auto" }}
//             />
//           </Box>
//         </DrawerHeader>
//         <Divider />
//         <List>
//           <ListItemWithTooltip tooltip="Dashboard">
//             <ListItem disablePadding>
//               <ListItemButton
//                 selected={isActive("/dashboard")}
//                 onClick={() =>
//                   handleMenuClick("📊 Dashboard", null, "/dashboard")
//                 }
//                 sx={getMenuItemStyle(isActive("/dashboard"))}
//               >
//                 <ListItemIcon>
//                   <DashboardIcon />
//                 </ListItemIcon>
//                 {open && <ListItemText primary="Dashboard" />}
//               </ListItemButton>
//             </ListItem>
//           </ListItemWithTooltip>

//           <ListItemWithTooltip tooltip="Label Management">
//             <ListItem disablePadding>
//               <ListItemButton
//                 selected={isPartMasterActive()}
//                 onClick={handlePartMasterClick}
//                 sx={getMenuItemStyle(isPartMasterActive())}
//               >
//                 <ListItemIcon>
//                   <FaFile className="w-7 h-6" />
//                 </ListItemIcon>
//                 {open && (
//                   <>
//                     <ListItemText primary="Label Management" />
//                     {dropdownOpen ? <ExpandLess /> : <ExpandMore />}
//                   </>
//                 )}
//               </ListItemButton>
//             </ListItem>
//           </ListItemWithTooltip>

//           <Collapse in={open && dropdownOpen} timeout="auto" unmountOnExit>
//             <List component="div" disablePadding>
//               <ListItemWithTooltip tooltip="Design Your Label">
//                 <ListItem disablePadding>
//                   <ListItemButton
//                     selected={isActive("/part")}
//                     sx={getDropdownStyle(isActive("/part"))}
//                     onClick={() =>
//                       handleMenuClick("📝 Design Your Label", null, "/part")
//                     }
//                   >
//                     <ListItemIcon>
//                       <RiEdit2Fill className="w-7 h-6" />
//                     </ListItemIcon>
//                     {open && <ListItemText primary="Design Your Label" />}
//                   </ListItemButton>
//                 </ListItem>
//               </ListItemWithTooltip>

//               <ListItemWithTooltip tooltip="Designed Label">
//                 <ListItem disablePadding>
//                   <ListItemButton
//                     selected={isActive("/part_Table")}
//                     sx={getDropdownStyle(isActive("/part_Table"))}
//                     onClick={() =>
//                       handleMenuClick("🧾 Designed Label", null, "/part_Table")
//                     }
//                   >
//                     <ListItemIcon>
//                       <TableChartIcon />
//                     </ListItemIcon>
//                     {open && <ListItemText primary="Designed Label" />}
//                   </ListItemButton>
//                 </ListItem>
//               </ListItemWithTooltip>
//             </List>
//           </Collapse>

//           <ListItemWithTooltip tooltip="Printer Config">
//             <ListItem disablePadding>
//               <ListItemButton
//                 selected={isActive("/table_List")}
//                 onClick={() =>
//                   handleMenuClick("🖨️ Print Jobs", null, "/table_List")
//                 }
//                 sx={getMenuItemStyle(isActive("/table_List"))}
//               >
//                 <ListItemIcon>
//                   <PiPrinterFill className="h-[2rem] w-[2rem]" />
//                 </ListItemIcon>
//                 {open && <ListItemText primary="Print Jobs" />}
//               </ListItemButton>
//             </ListItem>
//           </ListItemWithTooltip>

//           <ListItemWithTooltip tooltip="User Profile">
//             <ListItem disablePadding>
//               <ListItemButton
//                 selected={isActive("/User")}
//                 onClick={() =>
//                   handleMenuClick("🙎🏻‍♂️ User Profile", null, "/User")
//                 }
//                 sx={getMenuItemStyle(isActive("/User"))}
//               >
//                 <ListItemIcon>
//                   <MdAccountCircle className="h-[2rem] w-[2rem]" />
//                 </ListItemIcon>
//                 {open && <ListItemText primary="Profile" />}
//               </ListItemButton>
//             </ListItem>
//           </ListItemWithTooltip>

//           <ListItemWithTooltip tooltip="Settings">
//             <ListItem disablePadding>
//               <ListItemButton
//                 selected={isActive("/Card")}
//                 onClick={() => handleMenuClick("⚙️Settings", null, "/Card")}
//                 sx={getMenuItemStyle(isActive("/Card"))}
//               >
//                 <ListItemIcon>
//                   <IoSettings className="h-[2rem] w-[2rem]" />
//                 </ListItemIcon>
//                 {open && <ListItemText primary="Settings" />}
//               </ListItemButton>
//             </ListItem>
//           </ListItemWithTooltip>
//         </List>
//         <Divider />
//         <Box
//           sx={{
//             marginTop: "auto",
//             display: "flex",
//             justifyContent: "center",
//             alignItems: "center",
//             padding: 1,
//           }}
//         >
//           <Tooltip title={open ? "Collapse" : "Expand"}>
//             <IconButton onClick={open ? handleDrawerClose : handleDrawerOpen}>
//               {open ? <ChevronLeftIcon /> : <ChevronRightIcon />}
//             </IconButton>
//           </Tooltip>
//         </Box>
//         <Divider sx={{ marginY: 4 }} />
//         <ListItemWithTooltip tooltip="Logout">
//           <Button
//             onClick={handleLogout}
//             sx={{
//               position: "relative",
//               top: "-1rem",
//               display: "flex",
//               alignItems: "center",
//               color: "#38474f",
//             }}
//           >
//             <LogoutIcon />
//             {open && (
//               <ListItemText primary="Logout" sx={{ color: "black", ml: -13 }} />
//             )}
//           </Button>
//         </ListItemWithTooltip>
//       </Drawer>

//       <Main open={open}>
//         <DrawerHeader />
//         <Routes>
//           <Route path="/dashboard" element={<Dashboard />} />
//           <Route path="/part" element={<LabelDesign />} />
//           <Route path="/part_Table" element={<DesignedLabel />} />
//           <Route path="/user" element={<Profile />} />
//           <Route path="/table_List" element={<PrintJob />} />
//           <Route path="/Printer" element={<Settings />} />
//         </Routes>
//       </Main>
//       <Toaster />
//     </Box>
//   );
// }

// // Wrapper component with Router
// function PersistentDrawerLeft() {
//   return (
//     <BrowserRouter>
//       <PersistentDrawerLeftInner />
//     </BrowserRouter>
//   );
// }

// export default PersistentDrawerLeft;
