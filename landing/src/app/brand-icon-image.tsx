export function CommitDIconImage() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
      }}
    >
      <svg
        viewBox="0 0 96 96"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", height: "100%" }}
        fill="none"
      >
        <defs>
          <linearGradient id="bg" x1="18" y1="10" x2="78" y2="86" gradientUnits="userSpaceOnUse">
            <stop stopColor="#171717" />
            <stop offset="1" stopColor="#050505" />
          </linearGradient>
          <linearGradient id="frame" x1="20" y1="18" x2="76" y2="78" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFFFFF" />
            <stop offset="1" stopColor="#A3A3A3" />
          </linearGradient>
          <linearGradient id="paneLight" x1="28" y1="28" x2="68" y2="68" gradientUnits="userSpaceOnUse">
            <stop stopColor="#F5F5F5" />
            <stop offset="1" stopColor="#D4D4D4" />
          </linearGradient>
          <linearGradient id="paneDark" x1="30" y1="30" x2="66" y2="66" gradientUnits="userSpaceOnUse">
            <stop stopColor="#CFCFCF" />
            <stop offset="1" stopColor="#8E8E8E" />
          </linearGradient>
        </defs>
        <rect x="10" y="10" width="76" height="76" rx="24" fill="url(#bg)" />
        <rect x="11" y="11" width="74" height="74" rx="23" stroke="white" strokeOpacity="0.06" strokeWidth="2" />
        <rect x="18" y="19" width="60" height="58" rx="18" fill="#050505" fillOpacity="0.28" stroke="url(#frame)" strokeWidth="6" />
        <path d="M18 27C18 22.5817 21.5817 19 26 19H70" stroke="white" strokeOpacity="0.14" strokeWidth="2" />
        <rect x="28" y="28" width="16" height="16" rx="5" fill="url(#paneLight)" />
        <rect x="52" y="28" width="16" height="16" rx="5" fill="url(#paneDark)" />
        <rect x="28" y="52" width="16" height="16" rx="5" fill="url(#paneDark)" />
        <rect x="52" y="52" width="16" height="16" rx="5" fill="url(#paneLight)" />
        <circle cx="48" cy="48" r="3.5" fill="#050505" />
        <circle cx="48" cy="48" r="1.25" fill="#EAEAEA" />
      </svg>
    </div>
  );
}
