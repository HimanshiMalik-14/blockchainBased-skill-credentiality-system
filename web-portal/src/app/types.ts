export type Role = "LEARNER" | "INSTITUTION" | "EMPLOYER" | "ADMIN";

export type MeResponse = {
  user: {
    userId: string;
    role: Role;
    name: string;
    email?: string;
    phone?: string;
    institutionId?: string | null;
    walletAddress?: string | null;
    status: "PENDING" | "ACTIVE" | "SUSPENDED";
  };
};

