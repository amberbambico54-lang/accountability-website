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
  if (author === "Alpha") return "border-l-4 border-l-[#8B6AA8] bg-[#F5EFFA]";
  if (author === "Fernan") return "border-l-4 border-l-[#5F8F6B] bg-[#EFF6F0]";
  return "border-[#E7E0D2] bg-[#FAF7F2]";
}

export function getAuthorBadgeClass(author: string | undefined) {
  if (author === "Alpha") return "border-[#B8A2D1] bg-[#EEE7F6] text-[#654B7E]";
  if (author === "Fernan") return "border-[#9AB7A1] bg-[#E4EFE7] text-[#315940]";
  return "";
}
