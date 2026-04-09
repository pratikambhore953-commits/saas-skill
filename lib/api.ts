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
};

export type PublicUserProfile = {
  id: string;
  name: string;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  skills: PublicUserSkill[];
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

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("skillswap_access_token") ?? localStorage.getItem("skillswap_token");
}

async function readApiError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string };
    return body.message ?? "Request failed";
  } catch {
    return "Request failed";
  }
}

export async function getPublicUserProfile(userId: string): Promise<PublicUserProfile> {
  const response = await fetch(`${API_BASE}/api/users/${userId}`);
  if (!response.ok) {
    throw new Error(await readApiError(response));
  }
  const body = (await response.json()) as { data: { user: PublicUserProfile } };
  return body.data.user;
}

export async function createSession(payload: CreateSessionPayload): Promise<SessionItem> {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Please log in to request a session");
  }

  const response = await fetch(`${API_BASE}/api/sessions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
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
  const token = getAuthToken();
  if (!token) {
    throw new Error("Please log in to view sessions");
  }

  const query = status ? `?status=${status}` : "";
  const response = await fetch(`${API_BASE}/api/sessions${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  const body = (await response.json()) as { data: { sessions: SessionItem[] } };
  return body.data.sessions;
}

export async function updateSessionStatus(sessionId: string, status: SessionStatus): Promise<SessionItem> {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Please log in to update sessions");
  }

  const response = await fetch(`${API_BASE}/api/sessions/${sessionId}/status`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
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
  const token = getAuthToken();
  if (!token) {
    throw new Error("Please log in to update sessions");
  }

  const response = await fetch(`${API_BASE}/api/sessions/${sessionId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
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
  const token = getAuthToken();
  if (!token) {
    return matchesData;
  }

  const response = await fetch(`${API_BASE}/api/matches`, {
    headers: { Authorization: `Bearer ${token}` },
  });

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
