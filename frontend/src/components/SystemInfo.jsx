import { useEffect, useState } from "react";

export default function SystemInfo() {
  const [info, setInfo] = useState(null);

  useEffect(() => {
    const fetchSystemInfo = async () => {
      if (window.electron) {
        try {
          const data = await window.electron.getSystemInfo();
          console.log("System Info:", data);
          setInfo(data);
        } catch (err) {
          console.error("Failed to get system info:", err);
        }
      }
    };

    fetchSystemInfo();
  }, []);

  if (!info) return <div>Loading system info...</div>;

  return (
    <div>
      <h3>System Info</h3>
      <p>Home: {info.homedir}</p>
      <p>OS: {info.osVersion}</p>
      <p>Arch: {info.arch}</p>
      <p>Platform: {info.platform}</p>
      <p>Host: {info.hostname}</p>
    </div>
  );
}
