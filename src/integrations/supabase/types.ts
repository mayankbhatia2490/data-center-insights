export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      article_people: {
        Row: {
          article_id: string | null
          context_excerpt: string | null
          created_at: string | null
          id: string
          person_id: string | null
          role_in_article: string | null
        }
        Insert: {
          article_id?: string | null
          context_excerpt?: string | null
          created_at?: string | null
          id?: string
          person_id?: string | null
          role_in_article?: string | null
        }
        Update: {
          article_id?: string | null
          context_excerpt?: string | null
          created_at?: string | null
          id?: string
          person_id?: string | null
          role_in_article?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "article_people_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_people_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      articles: {
        Row: {
          category: string | null
          created_at: string
          id: string
          image_url: string | null
          insight: string | null
          published_at: string | null
          read_time: string | null
          sentiment: string | null
          source: string | null
          source_excerpt: string | null
          source_url: string | null
          summary: string | null
          title: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          insight?: string | null
          published_at?: string | null
          read_time?: string | null
          sentiment?: string | null
          source?: string | null
          source_excerpt?: string | null
          source_url?: string | null
          summary?: string | null
          title: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          insight?: string | null
          published_at?: string | null
          read_time?: string | null
          sentiment?: string | null
          source?: string | null
          source_excerpt?: string | null
          source_url?: string | null
          summary?: string | null
          title?: string
        }
        Relationships: []
      }
      company_capacity: {
        Row: {
          capacity_mw: number | null
          city: string | null
          company: string | null
          country: string | null
          id: string
          last_updated: string | null
          region: string | null
          source_url: string | null
        }
        Insert: {
          capacity_mw?: number | null
          city?: string | null
          company?: string | null
          country?: string | null
          id?: string
          last_updated?: string | null
          region?: string | null
          source_url?: string | null
        }
        Update: {
          capacity_mw?: number | null
          city?: string | null
          company?: string | null
          country?: string | null
          id?: string
          last_updated?: string | null
          region?: string | null
          source_url?: string | null
        }
        Relationships: []
      }
      daily_digests: {
        Row: {
          article_count: number | null
          content: string
          created_at: string
          digest_date: string
          id: string
        }
        Insert: {
          article_count?: number | null
          content: string
          created_at?: string
          digest_date: string
          id?: string
        }
        Update: {
          article_count?: number | null
          content?: string
          created_at?: string
          digest_date?: string
          id?: string
        }
        Relationships: []
      }
      dc_capacity_stats: {
        Row: {
          growth_rate_pct: number | null
          id: string
          last_updated: string | null
          region: string | null
          source: string | null
          total_capacity_gw: number | null
        }
        Insert: {
          growth_rate_pct?: number | null
          id?: string
          last_updated?: string | null
          region?: string | null
          source?: string | null
          total_capacity_gw?: number | null
        }
        Update: {
          growth_rate_pct?: number | null
          id?: string
          last_updated?: string | null
          region?: string | null
          source?: string | null
          total_capacity_gw?: number | null
        }
        Relationships: []
      }
      dc_company_capacity_stats: {
        Row: {
          company: string | null
          id: string
          last_updated: string | null
          rank: number | null
          region: string | null
          source: string | null
          total_capacity_gw: number | null
        }
        Insert: {
          company?: string | null
          id?: string
          last_updated?: string | null
          rank?: number | null
          region?: string | null
          source?: string | null
          total_capacity_gw?: number | null
        }
        Update: {
          company?: string | null
          id?: string
          last_updated?: string | null
          rank?: number | null
          region?: string | null
          source?: string | null
          total_capacity_gw?: number | null
        }
        Relationships: []
      }
      dc_energy_usage: {
        Row: {
          consumption_twh: number | null
          id: string
          last_updated: string | null
          percent_of_electricity: number | null
          region: string | null
          source: string | null
        }
        Insert: {
          consumption_twh?: number | null
          id?: string
          last_updated?: string | null
          percent_of_electricity?: number | null
          region?: string | null
          source?: string | null
        }
        Update: {
          consumption_twh?: number | null
          id?: string
          last_updated?: string | null
          percent_of_electricity?: number | null
          region?: string | null
          source?: string | null
        }
        Relationships: []
      }
      dc_investment_stats: {
        Row: {
          growth_pct: number | null
          id: string
          source: string | null
          total_investment_usd: number | null
          year: number | null
        }
        Insert: {
          growth_pct?: number | null
          id?: string
          source?: string | null
          total_investment_usd?: number | null
          year?: number | null
        }
        Update: {
          growth_pct?: number | null
          id?: string
          source?: string | null
          total_investment_usd?: number | null
          year?: number | null
        }
        Relationships: []
      }
      dc_market_segments: {
        Row: {
          chart_key: string
          chart_subtitle: string | null
          chart_title: string
          id: string
          last_updated: string | null
          segment_color: string | null
          segment_name: string
          segment_value: number
          sort_order: number | null
          source: string | null
        }
        Insert: {
          chart_key: string
          chart_subtitle?: string | null
          chart_title: string
          id?: string
          last_updated?: string | null
          segment_color?: string | null
          segment_name: string
          segment_value: number
          sort_order?: number | null
          source?: string | null
        }
        Update: {
          chart_key?: string
          chart_subtitle?: string | null
          chart_title?: string
          id?: string
          last_updated?: string | null
          segment_color?: string | null
          segment_name?: string
          segment_value?: number
          sort_order?: number | null
          source?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string
          date_text: string | null
          end_date: string | null
          id: string
          location: string | null
          name: string
          source_url: string | null
          start_date: string | null
        }
        Insert: {
          created_at?: string
          date_text?: string | null
          end_date?: string | null
          id?: string
          location?: string | null
          name: string
          source_url?: string | null
          start_date?: string | null
        }
        Update: {
          created_at?: string
          date_text?: string | null
          end_date?: string | null
          id?: string
          location?: string | null
          name?: string
          source_url?: string | null
          start_date?: string | null
        }
        Relationships: []
      }
      market_signals: {
        Row: {
          confidence: number | null
          created_at: string | null
          id: string
          reason: string | null
          region: string | null
          title: string | null
          type: string | null
        }
        Insert: {
          confidence?: number | null
          created_at?: string | null
          id?: string
          reason?: string | null
          region?: string | null
          title?: string | null
          type?: string | null
        }
        Update: {
          confidence?: number | null
          created_at?: string | null
          id?: string
          reason?: string | null
          region?: string | null
          title?: string | null
          type?: string | null
        }
        Relationships: []
      }
      market_tickers: {
        Row: {
          change_percent: string | null
          id: string
          name: string
          price: number | null
          status: string | null
          symbol: string
          updated_at: string
        }
        Insert: {
          change_percent?: string | null
          id?: string
          name: string
          price?: number | null
          status?: string | null
          symbol: string
          updated_at?: string
        }
        Update: {
          change_percent?: string | null
          id?: string
          name?: string
          price?: number | null
          status?: string | null
          symbol?: string
          updated_at?: string
        }
        Relationships: []
      }
      people: {
        Row: {
          bio: string | null
          claimed_at: string | null
          claimed_by: string | null
          created_at: string | null
          first_mentioned: string | null
          id: string
          image_url: string | null
          importance_score: number | null
          known_as: string | null
          last_mentioned: string | null
          mention_count: number | null
          name: string
          organization: string | null
          region: string | null
          roles: Json | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          bio?: string | null
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string | null
          first_mentioned?: string | null
          id?: string
          image_url?: string | null
          importance_score?: number | null
          known_as?: string | null
          last_mentioned?: string | null
          mention_count?: number | null
          name: string
          organization?: string | null
          region?: string | null
          roles?: Json | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          bio?: string | null
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string | null
          first_mentioned?: string | null
          id?: string
          image_url?: string | null
          importance_score?: number | null
          known_as?: string | null
          last_mentioned?: string | null
          mention_count?: number | null
          name?: string
          organization?: string | null
          region?: string | null
          roles?: Json | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profile_claims: {
        Row: {
          claim_email: string
          created_at: string
          id: string
          person_id: string
          reviewed_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          claim_email: string
          created_at?: string
          id?: string
          person_id: string
          reviewed_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          claim_email?: string
          created_at?: string
          id?: string
          person_id?: string
          reviewed_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_claims_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      people_leaders: {
        Row: {
          bio: string | null
          company: string | null
          country: string | null
          created_at: string | null
          id: string
          last_seen: string | null
          name: string | null
          region: string | null
          role: string | null
          source_url: string | null
        }
        Insert: {
          bio?: string | null
          company?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          last_seen?: string | null
          name?: string | null
          region?: string | null
          role?: string | null
          source_url?: string | null
        }
        Update: {
          bio?: string | null
          company?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          last_seen?: string | null
          name?: string | null
          region?: string | null
          role?: string | null
          source_url?: string | null
        }
        Relationships: []
      }
      people_lists: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_curated: boolean | null
          region: string | null
          role_filter: string | null
          slug: string
          title: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_curated?: boolean | null
          region?: string | null
          role_filter?: string | null
          slug: string
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_curated?: boolean | null
          region?: string | null
          role_filter?: string | null
          slug?: string
          title?: string
        }
        Relationships: []
      }
      people_lists_items: {
        Row: {
          created_at: string | null
          id: string
          list_id: string | null
          note: string | null
          person_id: string | null
          rank: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          list_id?: string | null
          note?: string | null
          person_id?: string | null
          rank?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          list_id?: string | null
          note?: string | null
          person_id?: string | null
          rank?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "people_lists_items_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "people_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "people_lists_items_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      regional_outlook: {
        Row: {
          demand_score: number | null
          id: string
          opportunity_score: number | null
          outlook: string | null
          region: string | null
          risk_score: number | null
          updated_at: string | null
        }
        Insert: {
          demand_score?: number | null
          id?: string
          opportunity_score?: number | null
          outlook?: string | null
          region?: string | null
          risk_score?: number | null
          updated_at?: string | null
        }
        Update: {
          demand_score?: number | null
          id?: string
          opportunity_score?: number | null
          outlook?: string | null
          region?: string | null
          risk_score?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      strategic_insights: {
        Row: {
          created_at: string | null
          horizon: string | null
          id: string
          insight: string | null
          region: string | null
          sector: string | null
        }
        Insert: {
          created_at?: string | null
          horizon?: string | null
          id?: string
          insight?: string | null
          region?: string | null
          sector?: string | null
        }
        Update: {
          created_at?: string | null
          horizon?: string | null
          id?: string
          insight?: string | null
          region?: string | null
          sector?: string | null
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          confirmed: boolean
          email: string
          id: string
          name: string | null
          preferences: Json | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscribed_at: string
          subscription_status: string | null
          subscription_tier: string
          unsubscribe_token: string
          user_id: string | null
        }
        Insert: {
          confirmed?: boolean
          email: string
          id?: string
          name?: string | null
          preferences?: Json | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscribed_at?: string
          subscription_status?: string | null
          subscription_tier?: string
          unsubscribe_token?: string
          user_id?: string | null
        }
        Update: {
          confirmed?: boolean
          email?: string
          id?: string
          name?: string | null
          preferences?: Json | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscribed_at?: string
          subscription_status?: string | null
          subscription_tier?: string
          unsubscribe_token?: string
          user_id?: string | null
        }
        Relationships: []
      }
      weekly_index: {
        Row: {
          created_at: string | null
          drivers: Json | null
          id: string
          outlook: string | null
          risks: Json | null
          score: number | null
          week_start: string
        }
        Insert: {
          created_at?: string | null
          drivers?: Json | null
          id?: string
          outlook?: string | null
          risks?: Json | null
          score?: number | null
          week_start: string
        }
        Update: {
          created_at?: string | null
          drivers?: Json | null
          id?: string
          outlook?: string | null
          risks?: Json | null
          score?: number | null
          week_start?: string
        }
        Relationships: []
      }
      word_cloud: {
        Row: {
          count: number | null
          last_updated: string | null
          word: string
        }
        Insert: {
          count?: number | null
          last_updated?: string | null
          word: string
        }
        Update: {
          count?: number | null
          last_updated?: string | null
          word?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
