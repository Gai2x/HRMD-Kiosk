import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Copy,
  FileText,
  Files,
  Globe,
  HelpCircle,
  Home,
  Info,
  Landmark,
  LogOut,
  Mail,
  Menu,
  PanelLeft,
  PanelLeftClose,
  PanelLeftOpen,
  Printer,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  User,
  Users,
  X,
  type LucideIcon,
  type LucideProps,
} from 'lucide-react'

/**
 * Semantic icon names mapped onto Lucide.
 *
 * Screens reference icons by role ("document", "shift") rather than by Lucide
 * component name, so the icon library can change without touching the UI.
 */
const registry = {
  arrowLeft: ArrowLeft,
  building: Building2,
  calendar: CalendarDays,
  calendarDays: CalendarDays,
  check: Check,
  chevronDown: ChevronDown,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  clipboardCheck: ClipboardCheck,
  clock: Clock,
  copy: Copy,
  document: FileText,
  files: Files,
  globe: Globe,
  helpCircle: HelpCircle,
  home: Home,
  info: Info,
  landmark: Landmark,
  logout: LogOut,
  mail: Mail,
  menu: Menu,
  panelLeft: PanelLeft,
  panelLeftClose: PanelLeftClose,
  panelLeftOpen: PanelLeftOpen,
  people: Users,
  printer: Printer,
  refresh: RotateCcw,
  search: Search,
  send: Send,
  shield: ShieldCheck,
  sparkles: Sparkles,
  trend: TrendingUp,
  user: User,
  warning: AlertTriangle,
  x: X,
} satisfies Record<string, LucideIcon>

export type IconName = keyof typeof registry

export function Icon({
  name,
  size = 24,
  strokeWidth = 1.8,
  ...props
}: Omit<LucideProps, 'name'> & { name: IconName }) {
  const Component = registry[name]
  return <Component aria-hidden="true" size={size} strokeWidth={strokeWidth} {...props} />
}
