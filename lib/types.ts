import type { PillarId, ItemType } from "@/lib/constants/pillars";

export type PlanTier = "free" | "plus" | "pro";
export type VerifyStatus = "unverified" | "pending" | "verified" | "rejected";

export interface Item {
  id: string;
  user_id?: string;
  title: string;
  pillar: PillarId;
  type: ItemType;
  date: string; // 'YYYY-MM-DD'
  start_time: string | null; // 'HH:MM'
  duration_min: number;
  done: boolean;
  rrule?: string | null;
}

export interface Course {
  id: string;
  user_id?: string;
  name: string;
  credits: number;
  grade: string | null;
}

export type PillarTargets = Record<PillarId, number>;

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  school: string | null;
  role: "student" | "admin";
  plan: PlanTier;
  verify_status: VerifyStatus;
  goal: string | null;
  priorities: PillarId[];
  onboarded: boolean;
  suspended: boolean;
}
