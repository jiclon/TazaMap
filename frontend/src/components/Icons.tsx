type P = { size?: number };

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
});

export const MapIcon = ({ size = 22 }: P) => (
  <svg {...base(size)}><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" /><path d="M9 4v14M15 6v14" /></svg>
);
export const CalendarIcon = ({ size = 22 }: P) => (
  <svg {...base(size)}><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4M16 3v4M4 10h16" /></svg>
);
export const ChartIcon = ({ size = 22 }: P) => (
  <svg {...base(size)}><path d="M6 20V10M12 20V4M18 20v-7" /></svg>
);
export const UserIcon = ({ size = 22 }: P) => (
  <svg {...base(size)}><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></svg>
);
export const ShopIcon = ({ size = 22 }: P) => (
  <svg {...base(size)}><path d="M5 8h14l-1 12H6z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></svg>
);
export const CoinIcon = ({ size = 16 }: P) => (
  <svg {...base(size)}><circle cx="12" cy="12" r="9" /><path d="M12 7v10M9 9.5h4.5a2 2 0 0 1 0 4H9" /></svg>
);
export const PlusIcon = ({ size = 20 }: P) => (
  <svg {...base(size)} strokeWidth={2.4}><path d="M12 5v14M5 12h14" /></svg>
);
export const BackIcon = ({ size = 20 }: P) => (
  <svg {...base(size)} strokeWidth={2.4}><path d="M15 5l-7 7 7 7" /></svg>
);
export const CheckIcon = ({ size = 14 }: P) => (
  <svg {...base(size)} strokeWidth={3}><path d="m5 12 5 5 9-10" /></svg>
);
export const CameraIcon = ({ size = 22 }: P) => (
  <svg {...base(size)}><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg>
);
export const TelegramIcon = ({ size = 20 }: P) => (
  <svg {...base(size)}><path d="M21 4 3 11l6 2 2 6 3-4 5 4 2-15z" /><path d="m9 13 8-6" /></svg>
);
export const PinIcon = ({ size = 16 }: P) => (
  <svg {...base(size)}><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>
);
export const ZoomInIcon = ({ size = 18 }: P) => (
  <svg {...base(size)} strokeWidth={2.4}><path d="M12 6v12M6 12h12" /></svg>
);
export const ZoomOutIcon = ({ size = 18 }: P) => (
  <svg {...base(size)} strokeWidth={2.4}><path d="M6 12h12" /></svg>
);
export const HomeIcon = ({ size = 22 }: P) => (
  <svg {...base(size)}><path d="M4 11 12 4l8 7" /><path d="M6 10v10h12V10" /><path d="M10 20v-5h4v5" /></svg>
);
