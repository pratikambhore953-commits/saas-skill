export type SkillLevel = "Beginner" | "Intermediate" | "Advanced";
export type SkillIntent = "offering" | "wanting";

export type SkillItem = {
  id: string;
  name: string;
  category: string;
  level: SkillLevel;
  intent: SkillIntent;
  description: string;
};

export type SkillOwner = {
  id: string;
  name: string;
  avatar: string;
  location: string;
};

export type BrowseSkill = {
  id: string;
  name: string;
  category: string;
  level: SkillLevel;
  intent: SkillIntent;
  description: string;
  owner: SkillOwner;
};

export type DashboardStats = {
  activeMatches: number;
  skillsOffered: number;
  skillsWanted: number;
  profileScore: number;
};

export type DashboardMatch = {
  id: string;
  name: string;
  location: string;
  theyOffer: string;
  youTeach: string;
  avatar: string;
};

export type UserProfile = {
  id: string;
  name: string;
  bio: string;
  location: string;
  skillsOffered: string[];
  skillsWanted: string[];
  rating: number;
};

export type PublicUserSkill = {
  id: string;
  name: string;
  is_offering: boolean;
  category?: string;
  level?: string;
  description?: string | null;
};

export type PublicUserProfile = {
  id: string;
  name: string;
  email?: string;
  phone?: string | null;
  avatar_url: string | null;
  bio: string | null;
  about_me?: string | null;
  location: string | null;
  skills: PublicUserSkill[];
  created_at?: string;
  sessions_completed?: number;
  skills_shared?: number;
};

export type ProfileChangeType = "EMAIL_CHANGE" | "PHONE_CHANGE" | "PASSWORD_CHANGE";

export type SkillCategory = "TECHNOLOGY" | "DESIGN" | "LANGUAGE" | "MUSIC" | "BUSINESS" | "OTHER";
export type SkillProficiency = "BEGINNER" | "INTERMEDIATE" | "EXPERT";

export type ProfileSkillInput = {
  name: string;
  category: SkillCategory;
  level: SkillProficiency;
  is_offering: boolean;
  description?: string;
};

export type SessionMode = "ONLINE" | "OFFLINE";
export type SessionStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "COMPLETED" | "CANCELLED";

export type SessionUserSummary = {
  id: string;
  name: string;
  avatar_url: string | null;
};

export type SessionSkillSummary = {
  id: string;
  name: string;
  category: string;
  level: string;
  is_offering: boolean;
};

export type SessionItem = {
  id: string;
  requester_id: string;
  teacher_id: string;
  skill_id: string;
  title: string;
  description: string | null;
  date: string;
  duration_minutes: number;
  mode: SessionMode;
  status: SessionStatus;
  meeting_link: string | null;
  location: string | null;
  created_at: string;
  updated_at: string;
  requester: SessionUserSummary;
  teacher: SessionUserSummary;
  skill: SessionSkillSummary;
};

export type LearningResource = {
  skill: string;
  resource: string;
  type: "free" | "paid";
  url: string;
};

export type SkillAnalysis = {
  id: string;
  user_id: string;
  profile_score: number;
  strengths: string[];
  weaknesses: string[];
  skill_gaps: string[];
  recommendations: string[];
  career_paths: string[];
  learning_resources: LearningResource[];
  match_improvement_tips: string[];
  summary: string;
  last_analysed_at: string;
  created_at: string;
  updated_at: string;
  score_explanation?: string;
};

export type NotificationType =
  | "SESSION_BOOKED"
  | "SESSION_ACCEPTED"
  | "SESSION_REJECTED"
  | "SESSION_REMINDER"
  | "TASK_SCORED"
  | "TASK_ACCEPTED"
  | "NEW_MESSAGE"
  | "NEW_MATCH"
  | "SYSTEM";

export type NotificationItem = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  link?: string | null;
  created_at: string;
};

export type CreateSessionPayload = {
  teacher_id: string;
  skill_id: string;
  title: string;
  description?: string;
  date: string;
  duration_minutes: number;
  mode: SessionMode;
  meeting_link?: string;
  location?: string;
};

const mockOwners: SkillOwner[] = [
  { id: "u1", name: "Aarav Mehta", avatar: "AM", location: "Pune, India" },
  { id: "u2", name: "Maya Rao", avatar: "MR", location: "Mumbai, India" },
  { id: "u3", name: "Rohan Iyer", avatar: "RI", location: "Bengaluru, India" },
  { id: "u4", name: "Nina Shah", avatar: "NS", location: "Delhi, India" },
  { id: "u5", name: "Kabir Jain", avatar: "KJ", location: "Hyderabad, India" },
];

const browseSkills: BrowseSkill[] = [
  {
    id: "b1",
    name: "React Architecture",
    category: "Development",
    level: "Advanced",
    intent: "offering",
    description: "Build scalable React apps with robust component architecture.",
    owner: mockOwners[0],
  },
  {
    id: "b2",
    name: "Figma UI Design",
    category: "Design",
    level: "Intermediate",
    intent: "offering",
    description: "Create polished product interfaces with practical design systems.",
    owner: mockOwners[1],
  },
  {
    id: "b3",
    name: "Public Speaking",
    category: "Communication",
    level: "Intermediate",
    intent: "offering",
    description: "Speak confidently in interviews, presentations, and meetings.",
    owner: mockOwners[2],
  },
  {
    id: "b4",
    name: "Data Analysis with Excel",
    category: "Analytics",
    level: "Beginner",
    intent: "offering",
    description: "Master formulas, pivots, and insights for business decisions.",
    owner: mockOwners[4],
  },
  {
    id: "b5",
    name: "Next.js Fullstack",
    category: "Development",
    level: "Intermediate",
    intent: "wanting",
    description: "Looking to learn routing, server actions, and deployment patterns.",
    owner: mockOwners[1],
  },
  {
    id: "b6",
    name: "Storytelling for Leaders",
    category: "Communication",
    level: "Advanced",
    intent: "wanting",
    description: "Want to improve persuasion and narrative skills for teams.",
    owner: mockOwners[0],
  },
];

const defaultUserSkills: SkillItem[] = [
  {
    id: "s1",
    name: "TypeScript",
    category: "Development",
    level: "Advanced",
    intent: "offering",
    description: "Practical TS for web apps",
  },
  {
    id: "s2",
    name: "Tailwind CSS",
    category: "Design",
    level: "Intermediate",
    intent: "offering",
    description: "Rapid UI building with utility classes",
  },
  {
    id: "s3",
    name: "Product Strategy",
    category: "Business",
    level: "Beginner",
    intent: "wanting",
    description: "Learn product thinking and roadmap planning",
  },
  {
    id: "s4",
    name: "Public Speaking",
    category: "Communication",
    level: "Intermediate",
    intent: "wanting",
    description: "Improve confidence and delivery",
  },
];

const recommendedMatches: DashboardMatch[] = [
  {
    id: "rm1",
    name: "Maya Rao",
    location: "Mumbai, India",
    theyOffer: "Figma UI Design",
    youTeach: "TypeScript",
    avatar: "MR",
  },
  {
    id: "rm2",
    name: "Rohan Iyer",
    location: "Bengaluru, India",
    theyOffer: "Public Speaking",
    youTeach: "Tailwind CSS",
    avatar: "RI",
  },
  {
    id: "rm3",
    name: "Nina Shah",
    location: "Delhi, India",
    theyOffer: "Product Strategy",
    youTeach: "Frontend Architecture",
    avatar: "NS",
  },
];

const matchesData: DashboardMatch[] = [
  {
    id: "u2",
    name: "Maya Rao",
    location: "Mumbai, India",
    theyOffer: "Figma UI Design",
    youTeach: "React Basics",
    avatar: "MR",
  },
  {
    id: "u3",
    name: "Rohan Iyer",
    location: "Bengaluru, India",
    theyOffer: "Public Speaking",
    youTeach: "JavaScript",
    avatar: "RI",
  },
  {
    id: "u5",
    name: "Kabir Jain",
    location: "Hyderabad, India",
    theyOffer: "Excel Dashboards",
    youTeach: "UI Engineering",
    avatar: "KJ",
  },
];

const profileData: UserProfile[] = [
  {
    id: "u1",
    name: "Aarav Mehta",
    bio: "Frontend engineer who loves building products and mentoring.",
    location: "Pune, India",
    skillsOffered: ["React", "TypeScript", "System Design"],
    skillsWanted: ["Public Speaking", "Leadership"],
    rating: 4.9,
  },
  {
    id: "u2",
    name: "Maya Rao",
    bio: "Product designer specializing in UX and design systems.",
    location: "Mumbai, India",
    skillsOffered: ["Figma", "Design Systems", "UX Research"],
    skillsWanted: ["Next.js", "Data Visualization"],
    rating: 4.8,
  },
  {
    id: "u3",
    name: "Rohan Iyer",
    bio: "Communication coach helping professionals improve confidence.",
    location: "Bengaluru, India",
    skillsOffered: ["Public Speaking", "Storytelling"],
    skillsWanted: ["Video Editing", "Personal Branding"],
    rating: 4.7,
  },
];

const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms));
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";
const ACCESS_TOKEN_KEY = "skillswap_access_token";
const REFRESH_TOKEN_KEY = "skillswap_token";

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY) ?? localStorage.getItem(REFRESH_TOKEN_KEY);
}

async function readApiError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string };
    return body.message ?? "Request failed";
  } catch {
    return "Request failed";
  }
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(await readApiError(response));
  }
  return (await response.json()) as T;
}

function resolveAccessToken(accessToken?: string): string | null {
  return accessToken ?? getAuthToken();
}

async function refreshAccessToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) return null;

  const response = await fetch(`${API_BASE}/api/auth/refresh-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    return null;
  }

  const body = (await response.json()) as {
    data?: { accessToken?: string; refreshToken?: string };
    accessToken?: string;
    refreshToken?: string;
  };
  const accessToken = body.data?.accessToken ?? body.accessToken;
  const nextRefreshToken = body.data?.refreshToken ?? body.refreshToken;
  if (!accessToken) return null;

  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (nextRefreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, nextRefreshToken);
    document.cookie = `${REFRESH_TOKEN_KEY}=${nextRefreshToken}; Max-Age=86400; Path=/; SameSite=Lax`;
  }

  return accessToken;
}

function handleSessionExpiry(): never {
  if (typeof window !== "undefined") {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem("skillswap_auth");
    document.cookie = `${REFRESH_TOKEN_KEY}=; Max-Age=0; Path=/; SameSite=Lax`;
    window.location.href = "/login";
  }
  throw new Error("Session expired, please login again");
}

async function authedFetch(path: string, init: RequestInit = {}, accessToken?: string): Promise<Response> {
  const token = resolveAccessToken(accessToken);
  if (!token) {
    handleSessionExpiry();
  }

  const headers = new Headers(init.headers ?? {});
  if (!headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (response.status !== 401) {
    return response;
  }

  const refreshed = await refreshAccessToken();
  if (!refreshed) {
    handleSessionExpiry();
  }

  headers.set("Authorization", `Bearer ${refreshed}`);
  response = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (response.status === 401) {
    handleSessionExpiry();
  }

  return response;
}

export async function getPublicUserProfile(userId: string): Promise<PublicUserProfile> {
  const response = await fetch(`${API_BASE}/api/users/${userId}`);
  const body = await parseJsonResponse<{ data?: { user?: PublicUserProfile }; user?: PublicUserProfile }>(response);
  const user = body.data?.user ?? body.user;
  if (!user) {
    throw new Error("Profile data is missing");
  }
  return {
    ...user,
    bio: user.bio ?? user.about_me ?? null,
  };
}

export async function updateProfileBasic(payload: {
  name?: string;
  about_me?: string;
  location?: string;
}): Promise<PublicUserProfile> {
  const response = await authedFetch("/api/profile/basic", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const body = await parseJsonResponse<{ data?: { user?: PublicUserProfile }; user?: PublicUserProfile }>(response);
  const user = body.data?.user ?? body.user;
  if (!user) {
    throw new Error("Updated profile is missing in response");
  }
  return {
    ...user,
    bio: user.bio ?? user.about_me ?? null,
  };
}

export async function updateProfileSkills(skills: ProfileSkillInput[]): Promise<PublicUserSkill[]> {
  const response = await authedFetch("/api/profile/skills", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ skills }),
  });

  const body = await parseJsonResponse<{ data?: { skills?: PublicUserSkill[] }; skills?: PublicUserSkill[] }>(response);
  return body.data?.skills ?? body.skills ?? [];
}

export async function requestProfileOtp(changeType: ProfileChangeType, payload?: {
  new_email?: string;
  phone?: string;
}): Promise<{ success: boolean; message: string }> {
  const endpointMap: Record<ProfileChangeType, string> = {
    EMAIL_CHANGE: "/api/profile/request-email-change",
    PHONE_CHANGE: "/api/profile/request-phone-change",
    PASSWORD_CHANGE: "/api/profile/request-password-change",
  };

  const response = await authedFetch(endpointMap[changeType], {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload ?? {}),
  });

  const body = await parseJsonResponse<{ success?: boolean; message?: string }>(response);
  return {
    success: body.success ?? true,
    message: body.message ?? "OTP sent",
  };
}

export async function verifyProfileOtp(payload: {
  otp: string;
  change_type: ProfileChangeType;
  new_password?: string;
}): Promise<{ user: PublicUserProfile }> {
  const response = await authedFetch("/api/profile/verify-otp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const body = await parseJsonResponse<{ data?: { user?: PublicUserProfile }; user?: PublicUserProfile }>(response);
  const user = body.data?.user ?? body.user;
  if (!user) {
    throw new Error("Updated user is missing in OTP verification response");
  }
  return {
    user: {
      ...user,
      bio: user.bio ?? user.about_me ?? null,
    },
  };
}

export async function uploadProfileAvatar(file: File): Promise<PublicUserProfile> {
  const formData = new FormData();
  formData.append("avatar", file);

  const response = await authedFetch("/api/profile/avatar", {
    method: "POST",
    body: formData,
  });

  const body = await parseJsonResponse<{ data?: { user?: PublicUserProfile }; user?: PublicUserProfile }>(response);
  const user = body.data?.user ?? body.user;
  if (!user) {
    throw new Error("Updated user is missing in avatar response");
  }
  return {
    ...user,
    bio: user.bio ?? user.about_me ?? null,
  };
}

export async function deleteCurrentUser(): Promise<void> {
  const response = await authedFetch("/api/users/me", {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }
}

export async function getSkillAnalysis(accessToken?: string): Promise<SkillAnalysis> {
  const token = resolveAccessToken(accessToken);
  if (!token) {
    throw new Error("Please log in to view analysis");
  }

  console.log("[api:getSkillAnalysis] token source", {
    fromSession: Boolean(accessToken),
    hasToken: Boolean(token),
  });

  const response = await authedFetch("/api/analysis", {}, token);

  if (response.status === 404) {
    throw new Error("No analysis yet. Click Analyse My Profile to get started");
  }

  const body = await parseJsonResponse<{ data: SkillAnalysis }>(response);
  return body.data;
}

export async function analyseMyProfile(accessToken?: string): Promise<SkillAnalysis> {
  const token = resolveAccessToken(accessToken);
  if (!token) {
    throw new Error("Please log in to analyse profile");
  }

  console.log("[api:analyseMyProfile] token source", {
    fromSession: Boolean(accessToken),
    hasToken: Boolean(token),
  });

  const response = await authedFetch(
    "/api/analysis/analyse",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    },
    token,
  );

  const body = await parseJsonResponse<{ data: SkillAnalysis }>(response);
  return body.data;
}

export async function createSession(payload: CreateSessionPayload): Promise<SessionItem> {
  const response = await authedFetch("/api/sessions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  const body = (await response.json()) as { data: { session: SessionItem } };
  return body.data.session;
}

export async function getSessions(status?: SessionStatus): Promise<SessionItem[]> {
  const query = status ? `?status=${status}` : "";
  const response = await authedFetch(`/api/sessions${query}`);

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  const body = (await response.json()) as { data: { sessions: SessionItem[] } };
  return body.data.sessions;
}

export async function updateSessionStatus(sessionId: string, status: SessionStatus): Promise<SessionItem> {
  const response = await authedFetch(`/api/sessions/${sessionId}/status`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  const body = (await response.json()) as { data: { session: SessionItem } };
  return body.data.session;
}

export async function updateSession(
  sessionId: string,
  payload: Partial<Pick<CreateSessionPayload, "date" | "duration_minutes" | "mode" | "description" | "meeting_link" | "location">>,
): Promise<SessionItem> {
  const response = await authedFetch(`/api/sessions/${sessionId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  const body = (await response.json()) as { data: { session: SessionItem } };
  return body.data.session;
}

export async function getBrowseSkills(filters: {
  search?: string;
  category?: string;
  level?: string;
  intent?: "all" | SkillIntent;
}): Promise<BrowseSkill[]> {
  await delay();
  const search = (filters.search ?? "").toLowerCase().trim();
  const category = filters.category ?? "All";
  const level = filters.level ?? "All";
  const intent = filters.intent ?? "all";

  return browseSkills.filter((skill) => {
    const matchesSearch =
      !search ||
      skill.name.toLowerCase().includes(search) ||
      skill.description.toLowerCase().includes(search) ||
      skill.owner.name.toLowerCase().includes(search);
    const matchesCategory = category === "All" || skill.category === category;
    const matchesLevel = level === "All" || skill.level === level;
    const matchesIntent = intent === "all" || skill.intent === intent;
    return matchesSearch && matchesCategory && matchesLevel && matchesIntent;
  });
}

export async function getInitialUserSkills(): Promise<SkillItem[]> {
  await delay();
  return defaultUserSkills;
}

export async function getDashboardStats(skills: SkillItem[]): Promise<DashboardStats> {
  await delay();
  const skillsOffered = skills.filter((skill) => skill.intent === "offering").length;
  const skillsWanted = skills.filter((skill) => skill.intent === "wanting").length;
  return {
    activeMatches: 6,
    skillsOffered,
    skillsWanted,
    profileScore: 88,
  };
}

export async function getRecommendedMatches(): Promise<DashboardMatch[]> {
  await delay();
  return recommendedMatches;
}

export async function getMatches(): Promise<DashboardMatch[]> {
  if (!getAuthToken()) {
    return matchesData;
  }

  const response = await authedFetch("/api/matches");

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  const body = (await response.json()) as {
    data: {
      matches: Array<{
        id: string;
        name: string;
        avatar_url: string | null;
        their_offered_skill: { name: string };
        your_offered_skill: { name: string } | null;
      }>;
    };
  };

  return body.data.matches.map((item) => ({
    id: item.id,
    name: item.name,
    location: "",
    theyOffer: item.their_offered_skill.name,
    youTeach: item.your_offered_skill?.name ?? "",
    avatar: item.avatar_url ? item.avatar_url.slice(0, 2).toUpperCase() : item.name.slice(0, 2).toUpperCase(),
  }));
}

export async function getNotifications(): Promise<{ notifications: NotificationItem[]; unreadCount: number }> {
  const response = await authedFetch("/api/notifications");
  const body = await parseJsonResponse<{
    data?: { notifications?: NotificationItem[]; unreadCount?: number };
    notifications?: NotificationItem[];
    unreadCount?: number;
  }>(response);
  const notifications = body.data?.notifications ?? body.notifications ?? [];
  const unreadCount =
    body.data?.unreadCount ??
    body.unreadCount ??
    notifications.filter((item) => !item.read).length;
  return { notifications, unreadCount };
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const response = await authedFetch(`/api/notifications/${notificationId}/read`, { method: "PUT" });
  if (!response.ok) {
    throw new Error(await readApiError(response));
  }
}

export async function markAllNotificationsAsRead(): Promise<void> {
  const response = await authedFetch("/api/notifications/read-all", { method: "PUT" });
  if (!response.ok) {
    throw new Error(await readApiError(response));
  }
}

export async function deleteNotification(notificationId: string): Promise<void> {
  const response = await authedFetch(`/api/notifications/${notificationId}`, { method: "DELETE" });
  if (!response.ok) {
    throw new Error(await readApiError(response));
  }
}

export async function getUserProfile(id: string): Promise<UserProfile | null> {
  try {
    const user = await getPublicUserProfile(id);
    const skillsOffered = user.skills.filter((skill) => skill.is_offering).map((skill) => skill.name);
    const skillsWanted = user.skills.filter((skill) => !skill.is_offering).map((skill) => skill.name);
    return {
      id: user.id,
      name: user.name,
      bio: user.bio ?? "",
      location: user.location ?? "",
      skillsOffered,
      skillsWanted,
      rating: 5,
    };
  } catch {
    await delay();
    return profileData.find((profile) => profile.id === id) ?? null;
  }
}
