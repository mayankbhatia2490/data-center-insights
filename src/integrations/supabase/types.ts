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
      subscribers: {
        Row: {
          confirmed: boolean
          email: string
          id: string
          name: string | null
          preferences: Json | null
          subscribed_at: string
          unsubscribe_token: string
        }
        Insert: {
          confirmed?: boolean
          email: string
          id?: string
          name?: string | null
          preferences?: Json | null
          subscribed_at?: string
          unsubscribe_token?: string
        }
        Update: {
          confirmed?: boolean
          email?: string
          id?: string
          name?: string | null
          preferences?: Json | null
          subscribed_at?: string
          unsubscribe_token?: string
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
