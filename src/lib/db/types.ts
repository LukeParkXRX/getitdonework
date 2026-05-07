export type UserRole = "startup" | "enabler" | "org_admin" | "super_admin";

export interface DbConversation {
  id: string;
  startup_id: string;
  enabler_id: string;
  last_message_at: string | null;
  last_message_preview: string | null;
  created_at: string;
}

export interface DbMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
}
export type EnablerBadge = "verified" | "top_rated" | "rising_star";
export type EnablerStatus = "pending" | "approved" | "suspended";
export type BookingType = "chemistry" | "standard" | "project";
export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";
export type CreditTxType = "purchase" | "allocate" | "use" | "hold" | "confirm" | "release" | "refund" | "expire";

export interface DbUser {
  id: string;
  email: string;
  full_name: string;
  role: UserRole | null;
  avatar_url: string | null;
  org_id: string | null;
  is_verified: boolean;
  contact_email?: string | null;
  created_at: string;
}

export interface DbEnablerProfile {
  user_id: string;
  university: string;
  degree_type: string;
  specialties: string[];
  location: string;
  bio: string;
  credit_rate: number;
  enabler_score: number;
  badge_level: EnablerBadge;
  status: EnablerStatus;
  session_count: number;
  rating: number;
  re_request_rate: number;
  availability: Record<string, string[]>;
  created_at: string;
}

export interface DbStartupProfile {
  user_id: string;
  company_name: string;
  industry: string[];
  stage: string;
  us_goal: string;
  credit_balance: number;
  org_id: string | null;
  created_at: string;
}

export interface DbOrganization {
  id: string;
  name: string;
  slug: string;
  program_name: string;
  logo_url: string | null;
  invite_code: string | null;
  total_credits: number;
  created_at: string;
}

export interface DbBooking {
  id: string;
  startup_id: string;
  enabler_id: string;
  type: BookingType;
  status: BookingStatus;
  scheduled_at: string;
  credits_amount: number;
  brief: string;
  completed_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  meeting_url: string | null;
  created_at: string;
}

export interface DbCreditTransaction {
  id: string;
  tx_type: CreditTxType;
  amount: number;
  org_id: string | null;
  startup_id: string | null;
  enabler_id: string | null;
  booking_id: string | null;
  description: string;
  balance_after: number | null;
  created_at: string;
}

export type ProjectStatus = "draft" | "open" | "matched" | "in_progress" | "completed" | "cancelled";

export interface DbProject {
  id: string;
  startup_id: string;
  title: string;
  category: string;
  description: string;
  duration: string | null;
  budget: string | null;
  requirements: string[];
  attachment_url: string | null;
  status: ProjectStatus;
  created_at: string;
}

export interface DbReview {
  id: string;
  author_id: string;
  target_id: string;
  booking_id: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface DbInsight {
  id: string;
  author_id: string;
  title: string;
  content: string;
  tags: string[];
  published_at: string;
}

export interface DbCreditSetting {
  id: string;
  session_type: BookingType;
  credits_required: number;
  label: string;
  description: string;
  is_active: boolean;
  updated_at: string;
  updated_by: string | null;
}

export interface DbCreditExpiryPolicy {
  id: string;
  org_id: string | null;
  expiry_days: number;
  grace_period_days: number;
  is_default: boolean;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      users: { Row: DbUser; Insert: Partial<DbUser> & Pick<DbUser, "id" | "email" | "full_name">; Update: Partial<DbUser>; Relationships: [] };
      enabler_profiles: { Row: DbEnablerProfile; Insert: Partial<DbEnablerProfile> & Pick<DbEnablerProfile, "user_id">; Update: Partial<DbEnablerProfile>; Relationships: [] };
      startup_profiles: { Row: DbStartupProfile; Insert: Partial<DbStartupProfile> & Pick<DbStartupProfile, "user_id">; Update: Partial<DbStartupProfile>; Relationships: [] };
      organizations: { Row: DbOrganization; Insert: Partial<DbOrganization> & Pick<DbOrganization, "name" | "slug">; Update: Partial<DbOrganization>; Relationships: [] };
      bookings: { Row: DbBooking; Insert: Partial<DbBooking> & Pick<DbBooking, "startup_id" | "enabler_id" | "scheduled_at">; Update: Partial<DbBooking>; Relationships: [] };
      credit_transactions: { Row: DbCreditTransaction; Insert: Partial<DbCreditTransaction> & Pick<DbCreditTransaction, "tx_type" | "amount">; Update: Partial<DbCreditTransaction>; Relationships: [] };
      reviews: { Row: DbReview; Insert: Partial<DbReview> & Pick<DbReview, "author_id" | "target_id" | "booking_id" | "rating">; Update: Partial<DbReview>; Relationships: [] };
      insights: { Row: DbInsight; Insert: Partial<DbInsight> & Pick<DbInsight, "author_id" | "title">; Update: Partial<DbInsight>; Relationships: [] };
      credit_settings: { Row: DbCreditSetting; Insert: Partial<DbCreditSetting> & Pick<DbCreditSetting, "session_type">; Update: Partial<DbCreditSetting>; Relationships: [] };
      credit_expiry_policies: { Row: DbCreditExpiryPolicy; Insert: Partial<DbCreditExpiryPolicy>; Update: Partial<DbCreditExpiryPolicy>; Relationships: [] };
      projects: { Row: DbProject; Insert: Partial<DbProject> & Pick<DbProject, "startup_id" | "title" | "category" | "description">; Update: Partial<DbProject>; Relationships: [] };
    };
    Views: Record<string, never>;
    Functions: {
      grant_credits_to_org: { Args: { p_org_id: string; p_amount: number; p_description?: string }; Returns: DbCreditTransaction };
      allocate_credits_to_startup: { Args: { p_org_id: string; p_startup_id: string; p_amount: number; p_description?: string }; Returns: DbCreditTransaction };
      hold_credits: { Args: { p_booking_id: string; p_startup_id: string; p_enabler_id: string; p_amount: number }; Returns: DbCreditTransaction };
      confirm_credits: { Args: { p_booking_id: string }; Returns: DbCreditTransaction };
      release_credits: { Args: { p_booking_id: string; p_reason?: string }; Returns: DbCreditTransaction };
    };
  };
}
