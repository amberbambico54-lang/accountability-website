export type AppUser = {
  name: "Fernan" | "Alpha";
  email: string;
};

const userByEmail: Record<string, AppUser["name"]> = {
  "amberbambico.54@gmail.com": "Fernan",
  "alpha.v.sugano@gmail.com": "Alpha",
};

export function getAppUser(email: string | undefined | null): AppUser | null {
  if (!email) return null;
  const normalizedEmail = email.trim().toLowerCase();
  const name = userByEmail[normalizedEmail];
  return name ? { name, email: normalizedEmail } : null;
}

export function canManageContent(createdBy: string | undefined, userName: string | undefined): boolean {
  return Boolean(userName && createdBy === userName);
}

export function getAuthorCardClass(author: string | undefined) {
  if (author === "Alpha") return "author-card--alpha";
  if (author === "Fernan") return "author-card--fernan";
  return "border-[#E7E0D2] bg-[#FAF7F2]";
}

export function getAuthorBadgeClass(author: string | undefined) {
  if (author === "Alpha") return "author-badge--alpha";
  if (author === "Fernan") return "author-badge--fernan";
  return "";
}
