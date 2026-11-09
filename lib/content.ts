import type { LucideIcon } from "lucide-react";
import {
  BookOpenText,
  BriefcaseBusiness,
  CalendarHeart,
  Compass,
  Gem,
  Goal,
  Heart,
  PiggyBank,
  Settings,
  Sparkles,
  Target,
  Users,
} from "lucide-react";

export const targetWeddingDate = "2027-10-28";

export const userProfile = {
  name: "Fernan",
  partnerName: "Alpha",
  coupleName: "Fernan & Alpha",
};

export const recentMoments = [
  {
    title: "Devotional reflection",
    description: "Shared a short prayer and gratitude note after morning devotion.",
    time: "Today · 7:30 AM",
    owner: "Fernan",
    accent: "bg-[#E7E0D2]",
  },
  {
    title: "Learning milestone",
    description: "Alpha completed the final chapter of the financial wisdom study.",
    time: "Yesterday",
    owner: "Alpha",
    accent: "bg-[#A4B49B]/20",
  },
  {
    title: "Business update",
    description: "The Unsaid launch checklist moved to vendor confirmation.",
    time: "This week",
    owner: "Shared",
    accent: "bg-[#71866E]/15",
  },
  {
    title: "Wedding idea",
    description: "A warm forest-inspired dinner menu concept was added to the board.",
    time: "2 days ago",
    owner: "Shared",
    accent: "bg-[#F7F4ED]",
  },
  {
    title: "Savings contribution",
    description: "A new deposit was added to the wedding piggy bank.",
    time: "Last week",
    owner: "Fernan",
    accent: "bg-[#E7E0D2]",
  },
];

export const moduleCards = [
  {
    title: "Our Devotion",
    description: "Daily prayer, reflection, and meaningful spiritual check-ins.",
    href: "/devotion",
    icon: "Heart",
  },
  {
    title: "UpSkill Progress",
    description: "Track courses, books, skills, and personal growth for both of you.",
    href: "/lessons",
    icon: "BookOpenText",
  },
  {
    title: "Business Dump Ideas/Progress",
    description: "Capture business ideas, add context, and track progress as they take shape.",
    href: "/business",
    icon: "BriefcaseBusiness",
  },
  {
    title: "Faith Goals (5F's)",
    description: "Set meaningful goals and organize steps across your five focus areas.",
    href: "/goals",
    icon: "Target",
  },
  {
    title: "Wedding Planning",
    description: "Vision board, decisions, suppliers, and timeline planning.",
    href: "/wedding",
    icon: "CalendarHeart",
  },
  {
    title: "Marriage Plans",
    description: "Future home, support plans, investments, and life conversations.",
    href: "/marriage",
    icon: "Gem",
  },
  {
    title: "Wedding Budget Piggy Bank",
    description: "Savings, deposits, expenses, and a durable transaction ledger.",
    href: "/budget",
    icon: "PiggyBank",
  },
];

export const iconMap: Record<string, LucideIcon> = {
  Heart,
  BookOpenText,
  BriefcaseBusiness,
  Target,
  CalendarHeart,
  Gem,
  PiggyBank,
  Settings,
  Users,
  Sparkles,
  Compass,
  Goal,
};

export const devotionEntries = [
  {
    title: "Morning stillness",
    verse: "Psalm 27:1",
    owner: "Fernan",
    visibility: "Shared",
    summary: "We prayed for patience, confidence, and courage to step into this season together.",
    reflection: "I want to be more generous with my attention and less distracted by the noise of the day.",
  },
  {
    title: "Prayer intention",
    verse: "Philippians 4:6",
    owner: "Alpha",
    visibility: "Private",
    summary: "A quiet prayer for peace in stressful moments and wisdom for our next steps.",
    reflection: "I am learning to hand the tension of my thoughts to God before trying to fix everything myself.",
  },
  {
    title: "Shared thankfulness",
    verse: "1 Thessalonians 5:18",
    owner: "Shared",
    visibility: "Shared",
    summary: "Giving thanks for the simple ways love is being practiced each day.",
    reflection: "The little acts of service and steady kindness are carrying us forward.",
  },
];

export const lessonTracks = [
  {
    title: "Healthy financial habits",
    owner: "Fernan",
    description: "Build a more intentional system for saving, spending, and planning with wisdom.",
    progress: 62,
    completed: 10,
    total: 16,
    category: "Personal",
  },
  {
    title: "Emotional intelligence",
    owner: "Alpha",
    description: "Practice self-awareness, clear communication, and patience in stressful moments.",
    progress: 44,
    completed: 7,
    total: 16,
    category: "Personal",
  },
  {
    title: "Wedding planning fundamentals",
    owner: "Shared",
    description: "Align our decisions around budget, timing, and the emotional tone of our celebrations.",
    progress: 78,
    completed: 11,
    total: 14,
    category: "Shared",
  },
  {
    title: "Business communication",
    owner: "Shared",
    description: "Improve how we share updates, collaborate, and handle responsibilities with clarity.",
    progress: 36,
    completed: 5,
    total: 14,
    category: "Shared",
  },
];

export const businessProjects = [
  {
    id: "the-unsaid",
    title: "The Unsaid",
    progress: 72,
    owner: "Fernan",
    due: "Aug 2026",
    tasks: [
      { id: "the-unsaid-1", text: "Finalize launch messaging and content structure.", done: true },
      { id: "the-unsaid-2", text: "Confirm landing page flow and brand direction.", done: true },
      { id: "the-unsaid-3", text: "Review launch checklist and vendor requirements.", done: false },
      { id: "the-unsaid-4", text: "Prepare final campaign launch notes.", done: false },
    ],
  },
  {
    id: "dropshipping",
    title: "Dropshipping",
    progress: 53,
    owner: "Alpha",
    due: "Sep 2026",
    tasks: [
      { id: "dropshipping-1", text: "Refine product research and supplier quality checks.", done: true },
      { id: "dropshipping-2", text: "Review reorder logic and inventory thresholds.", done: false },
      { id: "dropshipping-3", text: "Prepare a stronger retention plan for repeat buyers.", done: false },
    ],
  },
];

export const annualGoals = [
  {
    title: "Grow in consistency",
    category: "Spiritual",
    owner: "Shared",
    progress: 68,
    description: "Build honorable habits that make our home feel peaceful and rooted.",
    tasks: [
      { id: "consistency-1", text: "Set aside time for a shared weekly reflection.", done: true },
      { id: "consistency-2", text: "Keep a simple daily gratitude practice.", done: true },
      { id: "consistency-3", text: "Check in on our routines at the end of each month.", done: true },
      { id: "consistency-4", text: "Adjust habits when our schedule or needs change.", done: false },
    ],
  },
  {
    title: "Strengthen our business foundation",
    category: "Business",
    owner: "Shared",
    progress: 61,
    description: "Make meaningful progress toward a sustainable and joyful business rhythm.",
    tasks: [
      { id: "business-foundation-1", text: "Clarify responsibilities and priorities.", done: true },
      { id: "business-foundation-2", text: "Review business costs and expected income.", done: true },
      { id: "business-foundation-3", text: "Create a repeatable weekly planning routine.", done: false },
      { id: "business-foundation-4", text: "Review progress together each month.", done: false },
    ],
  },
  {
    title: "Save intentionally for the future",
    category: "Financial",
    owner: "Shared",
    progress: 74,
    description: "Create room for wedding costs, future home plans, and long-term security.",
    tasks: [
      { id: "save-future-1", text: "Agree on a regular savings contribution.", done: true },
      { id: "save-future-2", text: "Track wedding expenses and upcoming costs.", done: true },
      { id: "save-future-3", text: "Set aside money for future home plans.", done: true },
      { id: "save-future-4", text: "Review our savings plan each month.", done: false },
    ],
  },
  {
    title: "Invest in healthy routines",
    category: "Health",
    owner: "Fernan",
    progress: 52,
    description: "Create boundaries that support energy, discipline, and mental clarity.",
    tasks: [
      { id: "healthy-routines-1", text: "Choose a consistent time to wind down.", done: true },
      { id: "healthy-routines-2", text: "Make space for regular movement.", done: true },
      { id: "healthy-routines-3", text: "Protect focused time away from distractions.", done: false },
      { id: "healthy-routines-4", text: "Reflect on what is helping each week.", done: false },
    ],
  },
];

export const weddingProjects = [
  {
    id: "wedding-venue",
    title: "Venue and ceremony",
    due: "TBD",
    tasks: [
      { id: "wedding-venue-1", text: "Agree on the ceremony style and guest experience.", done: true },
      { id: "wedding-venue-2", text: "Shortlist venues that fit our budget.", done: true },
      { id: "wedding-venue-3", text: "Schedule venue visits and ask about availability.", done: false },
      { id: "wedding-venue-4", text: "Choose and reserve the venue.", done: false },
    ],
  },
  {
    id: "wedding-vendors",
    title: "Vendors and celebration",
    due: "TBD",
    tasks: [
      { id: "wedding-vendors-1", text: "Gather recommendations for photography and catering.", done: true },
      { id: "wedding-vendors-2", text: "Compare vendor packages and service details.", done: false },
      { id: "wedding-vendors-3", text: "Confirm the vendors we want to book.", done: false },
    ],
  },
];

export const weddingMoodBoard = [
  { title: "Ceremony mood", image: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=900&q=80", note: "Soft natural textures and candlelight." },
  { title: "Reception palette", image: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80", note: "Warm ivory, sage, and muted greens." },
  { title: "Dress inspiration", image: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=900&q=80", note: "Delicate and timeless silhouettes." },
  { title: "Mood details", image: "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=900&q=80", note: "Intentional, calm, and personal." },
];

export const wishListItems = [
  { name: "Dream venue walkthrough", cost: 0, priority: "High", status: "In discussion" },
  { name: "Wedding rings", cost: 28000, priority: "High", status: "Shortlisted" },
  { name: "Reception flowers", cost: 22000, priority: "Medium", status: "Planned" },
  { name: "Photo booth", cost: 18000, priority: "Low", status: "Possible add-on" },
];

export const marriageSections = [
  {
    title: "Support for parents",
    summary: "A thoughtful, generous plan that honors both families with clear communication and sustainable care.",
  },
  {
    title: "Investments",
    summary: "Focus on long-term growth, risk awareness, and steady savings habits for the future.",
  },
  {
    title: "Future home and lifestyle",
    summary: "Clarify priorities around space, household rhythms, and the kind of home we want to create.",
  },
  {
    title: "Important conversations",
    summary: "Keep room for difficult topics, expectations, and decisions made with grace and honesty.",
  },
];

export const budgetHistory = [
  { month: "Jan", saved: 15000 },
  { month: "Feb", saved: 23000 },
  { month: "Mar", saved: 29000 },
  { month: "Apr", saved: 36000 },
  { month: "May", saved: 42000 },
  { month: "Jun", saved: 54000 },
];

export const budgetTransactions = [
  { date: "2026-01-12", description: "Initial deposit", type: "Deposit", amount: 6000, owner: "Fernan" },
  { date: "2026-01-18", description: "Monthly contribution", type: "Deposit", amount: 9000, owner: "Alpha" },
  { date: "2026-02-08", description: "Venue deposit", type: "Withdrawal", amount: 12000, owner: "Shared" },
  { date: "2026-03-11", description: "Ceremony flowers", type: "Expense", amount: 7000, owner: "Shared" },
  { date: "2026-04-04", description: "Savings bonus", type: "Deposit", amount: 15000, owner: "Fernan" },
];

export const defaultSettings = [
  "Two-user workspace access",
  "Private devotions remain private by default",
  "Shared milestones are visible to both identities",
  "Encrypted upload bucket enabled",
];
