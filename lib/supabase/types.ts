export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      application_events: {
        Row: {
          application_id: string;
          body: string | null;
          created_at: string;
          from_status: string | null;
          id: string;
          kind: string;
          occurred_at: string;
          title: string | null;
          to_status: string | null;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          application_id: string;
          body?: string | null;
          created_at?: string;
          from_status?: string | null;
          id?: string;
          kind?: string;
          occurred_at?: string;
          title?: string | null;
          to_status?: string | null;
          user_id: string;
        };
        Update: {
          application_id?: string;
          body?: string | null;
          created_at?: string;
          from_status?: string | null;
          id?: string;
          kind?: string;
          occurred_at?: string;
          title?: string | null;
          to_status?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "application_events_application_id_user_id_fkey";
            columns: ["application_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "job_applications";
            referencedColumns: ["id", "user_id"];
          },
        ];
      };
      job_applications: {
        Row: {
          applied_at: string | null;
          company_name: string;
          created_at: string;
          employment_type: string | null;
          id: string;
          job_title: string;
          job_url: string | null;
          location: string | null;
          next_action_at: string | null;
          notes: string | null;
          salary_currency: string;
          salary_max: number | null;
          salary_min: number | null;
          source: string | null;
          status: string;
          updated_at: string;
          user_id: string;
          work_mode: string | null;
        };
        ComputedFields: never;
        Insert: {
          applied_at?: string | null;
          company_name: string;
          created_at?: string;
          employment_type?: string | null;
          id?: string;
          job_title: string;
          job_url?: string | null;
          location?: string | null;
          next_action_at?: string | null;
          notes?: string | null;
          salary_currency?: string;
          salary_max?: number | null;
          salary_min?: number | null;
          source?: string | null;
          status?: string;
          updated_at?: string;
          user_id: string;
          work_mode?: string | null;
        };
        Update: {
          applied_at?: string | null;
          company_name?: string;
          created_at?: string;
          employment_type?: string | null;
          id?: string;
          job_title?: string;
          job_url?: string | null;
          location?: string | null;
          next_action_at?: string | null;
          notes?: string | null;
          salary_currency?: string;
          salary_max?: number | null;
          salary_min?: number | null;
          source?: string | null;
          status?: string;
          updated_at?: string;
          user_id?: string;
          work_mode?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          achievements: string[];
          certifications: Json;
          contact_email: string | null;
          created_at: string;
          education: Json;
          experience: Json;
          full_name: string | null;
          github_url: string | null;
          headline: string | null;
          id: string;
          languages: string[];
          linkedin_url: string | null;
          links: Json;
          location: string | null;
          phone: string | null;
          projects: Json;
          skills: string[];
          summary: string | null;
          updated_at: string;
          website: string | null;
        };
        ComputedFields: never;
        Insert: {
          achievements?: string[];
          certifications?: Json;
          contact_email?: string | null;
          created_at?: string;
          education?: Json;
          experience?: Json;
          full_name?: string | null;
          github_url?: string | null;
          headline?: string | null;
          id: string;
          languages?: string[];
          linkedin_url?: string | null;
          links?: Json;
          location?: string | null;
          phone?: string | null;
          projects?: Json;
          skills?: string[];
          summary?: string | null;
          updated_at?: string;
          website?: string | null;
        };
        Update: {
          achievements?: string[];
          certifications?: Json;
          contact_email?: string | null;
          created_at?: string;
          education?: Json;
          experience?: Json;
          full_name?: string | null;
          github_url?: string | null;
          headline?: string | null;
          id?: string;
          languages?: string[];
          linkedin_url?: string | null;
          links?: Json;
          location?: string | null;
          phone?: string | null;
          projects?: Json;
          skills?: string[];
          summary?: string | null;
          updated_at?: string;
          website?: string | null;
        };
        Relationships: [];
      };
      resumes: {
        Row: {
          created_at: string;
          file_name: string;
          file_path: string;
          file_size: number | null;
          id: string;
          mime_type: string;
          parse_error: string | null;
          parsed_at: string | null;
          parsed_data: Json | null;
          status: string;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          file_name: string;
          file_path: string;
          file_size?: number | null;
          id?: string;
          mime_type?: string;
          parse_error?: string | null;
          parsed_at?: string | null;
          parsed_data?: Json | null;
          status?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          file_name?: string;
          file_path?: string;
          file_size?: number | null;
          id?: string;
          mime_type?: string;
          parse_error?: string | null;
          parsed_at?: string | null;
          parsed_data?: Json | null;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
