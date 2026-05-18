/* global React */
// Inline SVG icons recreating lucide-react usage from education-gestor.
// Stroke 2, lineCap round, color inherits from currentColor.

const baseProps = (size = 18) => ({
  width: size, height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round"
});

const Icon = ({ children, size, ...rest }) => (
  <svg {...baseProps(size)} {...rest}>{children}</svg>
);

const I = {
  Dashboard: ({ size, ...r }) => <Icon size={size} {...r}><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></Icon>,
  Users: ({ size, ...r }) => <Icon size={size} {...r}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></Icon>,
  GraduationCap: ({ size, ...r }) => <Icon size={size} {...r}><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></Icon>,
  BookOpen: ({ size, ...r }) => <Icon size={size} {...r}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></Icon>,
  Dollar: ({ size, ...r }) => <Icon size={size} {...r}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></Icon>,
  Calendar: ({ size, ...r }) => <Icon size={size} {...r}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></Icon>,
  Clock: ({ size, ...r }) => <Icon size={size} {...r}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></Icon>,
  CheckCircle: ({ size, ...r }) => <Icon size={size} {...r}><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></Icon>,
  Alert: ({ size, ...r }) => <Icon size={size} {...r}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></Icon>,
  School: ({ size, ...r }) => <Icon size={size} {...r}><path d="M3 21h18M3 10h18M5 6l7-3 7 3"/><line x1="4" y1="10" x2="4" y2="21"/><line x1="20" y1="10" x2="20" y2="21"/></Icon>,
  Search: ({ size, ...r }) => <Icon size={size} {...r}><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></Icon>,
  Plus: ({ size, ...r }) => <Icon size={size} {...r}><path d="M12 5v14M5 12h14"/></Icon>,
  Pencil: ({ size, ...r }) => <Icon size={size} {...r}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></Icon>,
  Trash: ({ size, ...r }) => <Icon size={size} {...r}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></Icon>,
  Chevron: ({ size, ...r }) => <Icon size={size} {...r}><path d="M9 18l6-6-6-6"/></Icon>,
  ArrowRight: ({ size, ...r }) => <Icon size={size} {...r}><path d="M5 12h14M12 5l7 7-7 7"/></Icon>,
  ArrowLeft: ({ size, ...r }) => <Icon size={size} {...r}><path d="M19 12H5M12 19l-7-7 7-7"/></Icon>,
  Check: ({ size, ...r }) => <Icon size={size} {...r}><polyline points="20 6 9 17 4 12"/></Icon>,
  Settings: ({ size, ...r }) => <Icon size={size} {...r}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></Icon>,
  LogOut: ({ size, ...r }) => <Icon size={size} {...r}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></Icon>,
  Network: ({ size, ...r }) => <Icon size={size} {...r}><rect x="9" y="2" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="16" y="16" width="6" height="6" rx="1"/><path d="M5 16v-2a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2M12 8v4"/></Icon>,
  Layers: ({ size, ...r }) => <Icon size={size} {...r}><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></Icon>,
  Building: ({ size, ...r }) => <Icon size={size} {...r}><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22V12h6v10M9 6h.01M15 6h.01M9 10h.01M15 10h.01"/></Icon>,
  UserPlus: ({ size, ...r }) => <Icon size={size} {...r}><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></Icon>,
  X: ({ size, ...r }) => <Icon size={size} {...r}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></Icon>,
  Smile: ({ size, ...r }) => <Icon size={size} {...r}><path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/></Icon>,
  Upload: ({ size, ...r }) => <Icon size={size} {...r}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></Icon>,
  FileText: ({ size, ...r }) => <Icon size={size} {...r}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></Icon>,
  UserCircle: ({ size, ...r }) => <Icon size={size} {...r}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="10" r="3.5"/><path d="M5.5 19.5c1.5-2.5 4-4 6.5-4s5 1.5 6.5 4"/></Icon>,
  Grip: ({ size, ...r }) => <Icon size={size} {...r}><circle cx="9" cy="6"  r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="18" r="1"/></Icon>,
  Zap: ({ size, ...r }) => <Icon size={size} {...r}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></Icon>,
  AlertTriangle: ({ size, ...r }) => <Icon size={size} {...r}><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></Icon>,
  ChevronDown: ({ size, ...r }) => <Icon size={size} {...r}><polyline points="6 9 12 15 18 9"/></Icon>,
};

window.I = I;
