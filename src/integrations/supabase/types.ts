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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
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
          claim_type: string | null
          confidence_score: number | null
          corroboration_count: number
          corroboration_urls: Json | null
          created_at: string
          id: string
          image_url: string | null
          impact_summary: string | null
          importance_score: number | null
          insight: string | null
          is_primary_source: boolean
          meaning: string | null
          named_entities: Json | null
          original_published_at: string | null
          primary_source_count: number
          publication_status: string
          published_at: string | null
          read_time: string | null
          sentiment: string | null
          slug: string
          source: string | null
          source_domain: string | null
          source_excerpt: string | null
          source_reliability_score: number | null
          source_tier: number | null
          source_type: string | null
          source_url: string | null
          summary: string | null
          title: string
          updated_at: string
          validated_at: string | null
          validation_notes: string | null
          validation_score: number | null
          validation_status: string
        }
        Insert: {
          category?: string | null
          claim_type?: string | null
          confidence_score?: number | null
          corroboration_count?: number
          corroboration_urls?: Json | null
          created_at?: string
          id?: string
          image_url?: string | null
          impact_summary?: string | null
          importance_score?: number | null
          insight?: string | null
          is_primary_source?: boolean
          meaning?: string | null
          named_entities?: Json | null
          original_published_at?: string | null
          primary_source_count?: number
          publication_status?: string
          published_at?: string | null
          read_time?: string | null
          sentiment?: string | null
          slug: string
          source?: string | null
          source_domain?: string | null
          source_excerpt?: string | null
          source_reliability_score?: number | null
          source_tier?: number | null
          source_type?: string | null
          source_url?: string | null
          summary?: string | null
          title: string
          updated_at?: string
          validated_at?: string | null
          validation_notes?: string | null
          validation_score?: number | null
          validation_status?: string
        }
        Update: {
          category?: string | null
          claim_type?: string | null
          confidence_score?: number | null
          corroboration_count?: number
          corroboration_urls?: Json | null
          created_at?: string
          id?: string
          image_url?: string | null
          impact_summary?: string | null
          importance_score?: number | null
          insight?: string | null
          is_primary_source?: boolean
          meaning?: string | null
          named_entities?: Json | null
          original_published_at?: string | null
          primary_source_count?: number
          publication_status?: string
          published_at?: string | null
          read_time?: string | null
          sentiment?: string | null
          slug?: string
          source?: string | null
          source_domain?: string | null
          source_excerpt?: string | null
          source_reliability_score?: number | null
          source_tier?: number | null
          source_type?: string | null
          source_url?: string | null
          summary?: string | null
          title?: string
          updated_at?: string
          validated_at?: string | null
          validation_notes?: string | null
          validation_score?: number | null
          validation_status?: string
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
      data_center_review_queue: {
        Row: {
          created_at: string
          data_center_id: string
          id: string
          reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_notes: string | null
          source_id: string | null
          status: string
        }
        Insert: {
          created_at?: string
          data_center_id: string
          id?: string
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          source_id?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          data_center_id?: string
          id?: string
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          source_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_center_review_queue_data_center_id_fkey"
            columns: ["data_center_id"]
            isOneToOne: false
            referencedRelation: "data_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_center_review_queue_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "data_center_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      data_center_sources: {
        Row: {
          automated_score: number
          checked_at: string | null
          created_at: string
          data_center_id: string
          evidence_excerpt: string | null
          id: string
          observed_capacity_mw: number | null
          observed_lifecycle_stage: string | null
          review_status: string
          source_name: string
          source_title: string | null
          source_type: string
          source_url: string | null
        }
        Insert: {
          automated_score?: number
          checked_at?: string | null
          created_at?: string
          data_center_id: string
          evidence_excerpt?: string | null
          id?: string
          observed_capacity_mw?: number | null
          observed_lifecycle_stage?: string | null
          review_status?: string
          source_name: string
          source_title?: string | null
          source_type: string
          source_url?: string | null
        }
        Update: {
          automated_score?: number
          checked_at?: string | null
          created_at?: string
          data_center_id?: string
          evidence_excerpt?: string | null
          id?: string
          observed_capacity_mw?: number | null
          observed_lifecycle_stage?: string | null
          review_status?: string
          source_name?: string
          source_title?: string | null
          source_type?: string
          source_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "data_center_sources_data_center_id_fkey"
            columns: ["data_center_id"]
            isOneToOne: false
            referencedRelation: "data_centers"
            referencedColumns: ["id"]
          },
        ]
      }
      data_center_status_history: {
        Row: {
          changed_at: string
          data_center_id: string
          id: string
          lifecycle_stage: string
          note: string | null
          source_id: string | null
        }
        Insert: {
          changed_at?: string
          data_center_id: string
          id?: string
          lifecycle_stage: string
          note?: string | null
          source_id?: string | null
        }
        Update: {
          changed_at?: string
          data_center_id?: string
          id?: string
          lifecycle_stage?: string
          note?: string | null
          source_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "data_center_status_history_data_center_id_fkey"
            columns: ["data_center_id"]
            isOneToOne: false
            referencedRelation: "data_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_center_status_history_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "data_center_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      data_center_weekly_briefs: {
        Row: {
          created_at: string
          id: string
          markdown: string
          projects_added: number
          projects_updated: number
          total_announced_mw: number
          total_live_mw: number
          total_planned_mw: number
          total_uc_mw: number
          week_start: string
        }
        Insert: {
          created_at?: string
          id?: string
          markdown: string
          projects_added?: number
          projects_updated?: number
          total_announced_mw?: number
          total_live_mw?: number
          total_planned_mw?: number
          total_uc_mw?: number
          week_start: string
        }
        Update: {
          created_at?: string
          id?: string
          markdown?: string
          projects_added?: number
          projects_updated?: number
          total_announced_mw?: number
          total_live_mw?: number
          total_planned_mw?: number
          total_uc_mw?: number
          week_start?: string
        }
        Relationships: []
      }
      data_centers: {
        Row: {
          address: string | null
          address_details: string | null
          aliases: string[]
          canonical_name: string
          capacity_basis: string | null
          capacity_mw: number | null
          capacity_status: string
          capacity_type: string | null
          city: string | null
          company_id: string | null
          country: string
          created_at: string
          ecosystem_stats: Json
          estimated_energization: string | null
          external_id: string | null
          external_parent_id: string | null
          extraction_confidence: string | null
          first_seen_at: string
          full_ambition_mw: number | null
          id: string
          last_verified_at: string | null
          latitude: number | null
          lifecycle_stage: string
          listing_type: string
          location_precision: string
          longitude: number | null
          market: string | null
          operator_name: string | null
          operators: string[]
          parent_id: string | null
          partners: string[]
          postal: string | null
          power_notes: string | null
          power_source: string | null
          profile_url: string | null
          pue: number | null
          risks: string[]
          service_types: string[]
          site_code: string | null
          slug: string
          state: string | null
          tier_design: string | null
          total_building_size: number | null
          updated_at: string
          verification_score: number
          verification_status: string
          website_url: string | null
          whitespace_sqm: number | null
          year_operational: number | null
        }
        Insert: {
          address?: string | null
          address_details?: string | null
          aliases?: string[]
          canonical_name: string
          capacity_basis?: string | null
          capacity_mw?: number | null
          capacity_status?: string
          capacity_type?: string | null
          city?: string | null
          company_id?: string | null
          country: string
          created_at?: string
          ecosystem_stats?: Json
          estimated_energization?: string | null
          external_id?: string | null
          external_parent_id?: string | null
          extraction_confidence?: string | null
          first_seen_at?: string
          full_ambition_mw?: number | null
          id?: string
          last_verified_at?: string | null
          latitude?: number | null
          lifecycle_stage?: string
          listing_type?: string
          location_precision?: string
          longitude?: number | null
          market?: string | null
          operator_name?: string | null
          operators?: string[]
          parent_id?: string | null
          partners?: string[]
          postal?: string | null
          power_notes?: string | null
          power_source?: string | null
          profile_url?: string | null
          pue?: number | null
          risks?: string[]
          service_types?: string[]
          site_code?: string | null
          slug: string
          state?: string | null
          tier_design?: string | null
          total_building_size?: number | null
          updated_at?: string
          verification_score?: number
          verification_status?: string
          website_url?: string | null
          whitespace_sqm?: number | null
          year_operational?: number | null
        }
        Update: {
          address?: string | null
          address_details?: string | null
          aliases?: string[]
          canonical_name?: string
          capacity_basis?: string | null
          capacity_mw?: number | null
          capacity_status?: string
          capacity_type?: string | null
          city?: string | null
          company_id?: string | null
          country?: string
          created_at?: string
          ecosystem_stats?: Json
          estimated_energization?: string | null
          external_id?: string | null
          external_parent_id?: string | null
          extraction_confidence?: string | null
          first_seen_at?: string
          full_ambition_mw?: number | null
          id?: string
          last_verified_at?: string | null
          latitude?: number | null
          lifecycle_stage?: string
          listing_type?: string
          location_precision?: string
          longitude?: number | null
          market?: string | null
          operator_name?: string | null
          operators?: string[]
          parent_id?: string | null
          partners?: string[]
          postal?: string | null
          power_notes?: string | null
          power_source?: string | null
          profile_url?: string | null
          pue?: number | null
          risks?: string[]
          service_types?: string[]
          site_code?: string | null
          slug?: string
          state?: string | null
          tier_design?: string | null
          total_building_size?: number | null
          updated_at?: string
          verification_score?: number
          verification_status?: string
          website_url?: string | null
          whitespace_sqm?: number | null
          year_operational?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "data_centers_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "data_centers"
            referencedColumns: ["id"]
          },
        ]
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
          confidence_tier: string | null
          created_at: string | null
          id: string
          reason: string | null
          region: string | null
          source_article_ids: string[] | null
          title: string | null
          type: string | null
        }
        Insert: {
          confidence?: number | null
          confidence_tier?: string | null
          created_at?: string | null
          id?: string
          reason?: string | null
          region?: string | null
          source_article_ids?: string[] | null
          title?: string | null
          type?: string | null
        }
        Update: {
          confidence?: number | null
          confidence_tier?: string | null
          created_at?: string | null
          id?: string
          reason?: string | null
          region?: string | null
          source_article_ids?: string[] | null
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
      news_candidates: {
        Row: {
          article_id: string | null
          candidate_status: string
          canonical_url: string | null
          discovered_at: string
          discovered_url: string
          discovery_source: string
          failure_reason: string | null
          id: string
          published_at: string | null
          raw_payload: Json | null
          relevance_score: number | null
          source_domain: string | null
          source_reliability_score: number | null
          source_tier: number | null
          source_type: string | null
          summary: string | null
          title: string
          validated_at: string | null
        }
        Insert: {
          article_id?: string | null
          candidate_status?: string
          canonical_url?: string | null
          discovered_at?: string
          discovered_url: string
          discovery_source: string
          failure_reason?: string | null
          id?: string
          published_at?: string | null
          raw_payload?: Json | null
          relevance_score?: number | null
          source_domain?: string | null
          source_reliability_score?: number | null
          source_tier?: number | null
          source_type?: string | null
          summary?: string | null
          title: string
          validated_at?: string | null
        }
        Update: {
          article_id?: string | null
          candidate_status?: string
          canonical_url?: string | null
          discovered_at?: string
          discovered_url?: string
          discovery_source?: string
          failure_reason?: string | null
          id?: string
          published_at?: string | null
          raw_payload?: Json | null
          relevance_score?: number | null
          source_domain?: string | null
          source_reliability_score?: number | null
          source_tier?: number | null
          source_type?: string | null
          summary?: string | null
          title?: string
          validated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "news_candidates_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      news_sources: {
        Row: {
          allowed_for_auto_publish: boolean
          created_at: string
          domain: string
          feed_url: string | null
          id: string
          is_active: boolean
          is_primary_source: boolean
          last_checked_at: string | null
          last_feed_error: string | null
          last_http_status: number | null
          reliability_score: number
          requires_corroboration: boolean
          source_name: string
          source_tier: number
          source_type: string
          updated_at: string
        }
        Insert: {
          allowed_for_auto_publish?: boolean
          created_at?: string
          domain: string
          feed_url?: string | null
          id?: string
          is_active?: boolean
          is_primary_source?: boolean
          last_checked_at?: string | null
          last_feed_error?: string | null
          last_http_status?: number | null
          reliability_score: number
          requires_corroboration?: boolean
          source_name: string
          source_tier: number
          source_type: string
          updated_at?: string
        }
        Update: {
          allowed_for_auto_publish?: boolean
          created_at?: string
          domain?: string
          feed_url?: string | null
          id?: string
          is_active?: boolean
          is_primary_source?: boolean
          last_checked_at?: string | null
          last_feed_error?: string | null
          last_http_status?: number | null
          reliability_score?: number
          requires_corroboration?: boolean
          source_name?: string
          source_tier?: number
          source_type?: string
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
          last_verified_at: string | null
          mention_count: number | null
          name: string
          organization: string | null
          region: string | null
          roles: Json | null
          slug: string
          title: string | null
          updated_at: string | null
          verification_notes: string | null
          verification_score: number
          verification_status: string
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
          last_verified_at?: string | null
          mention_count?: number | null
          name: string
          organization?: string | null
          region?: string | null
          roles?: Json | null
          slug: string
          title?: string | null
          updated_at?: string | null
          verification_notes?: string | null
          verification_score?: number
          verification_status?: string
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
          last_verified_at?: string | null
          mention_count?: number | null
          name?: string
          organization?: string | null
          region?: string | null
          roles?: Json | null
          slug?: string
          title?: string | null
          updated_at?: string | null
          verification_notes?: string | null
          verification_score?: number
          verification_status?: string
        }
        Relationships: []
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
      people_verification_audit: {
        Row: {
          action: string
          actor_id: string | null
          actor_type: string
          created_at: string
          detail: Json
          from_status: string | null
          id: string
          person_id: string
          score: number | null
          to_status: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_type: string
          created_at?: string
          detail?: Json
          from_status?: string | null
          id?: string
          person_id: string
          score?: number | null
          to_status?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_type?: string
          created_at?: string
          detail?: Json
          from_status?: string | null
          id?: string
          person_id?: string
          score?: number | null
          to_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "people_verification_audit_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      people_verification_queue: {
        Row: {
          created_at: string
          id: string
          person_id: string
          reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_notes: string | null
          source_id: string | null
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          person_id: string
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          source_id?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          person_id?: string
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          source_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "people_verification_queue_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "people_verification_queue_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "people_verification_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      people_verification_sources: {
        Row: {
          article_id: string | null
          automated_result: string
          automated_score: number
          checked_at: string | null
          checks: Json
          created_at: string
          evidence_excerpt: string | null
          http_status: number | null
          id: string
          observed_name: string | null
          observed_organization: string | null
          observed_title: string | null
          person_id: string
          source_name: string | null
          source_published_at: string | null
          source_title: string | null
          source_url: string
        }
        Insert: {
          article_id?: string | null
          automated_result?: string
          automated_score?: number
          checked_at?: string | null
          checks?: Json
          created_at?: string
          evidence_excerpt?: string | null
          http_status?: number | null
          id?: string
          observed_name?: string | null
          observed_organization?: string | null
          observed_title?: string | null
          person_id: string
          source_name?: string | null
          source_published_at?: string | null
          source_title?: string | null
          source_url: string
        }
        Update: {
          article_id?: string | null
          automated_result?: string
          automated_score?: number
          checked_at?: string | null
          checks?: Json
          created_at?: string
          evidence_excerpt?: string | null
          http_status?: number | null
          id?: string
          observed_name?: string | null
          observed_organization?: string | null
          observed_title?: string | null
          person_id?: string
          source_name?: string | null
          source_published_at?: string | null
          source_title?: string | null
          source_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "people_verification_sources_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "people_verification_sources_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_health_checks: {
        Row: {
          checked_at: string
          detail: Json | null
          function_name: string
          id: string
          status: string
          table_name: string
        }
        Insert: {
          checked_at?: string
          detail?: Json | null
          function_name: string
          id?: string
          status: string
          table_name: string
        }
        Update: {
          checked_at?: string
          detail?: Json | null
          function_name?: string
          id?: string
          status?: string
          table_name?: string
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
      regional_outlook: {
        Row: {
          confidence_tier: string | null
          demand_score: number | null
          id: string
          opportunity_score: number | null
          outlook: string | null
          region: string | null
          risk_score: number | null
          source_article_ids: string[] | null
          updated_at: string | null
        }
        Insert: {
          confidence_tier?: string | null
          demand_score?: number | null
          id?: string
          opportunity_score?: number | null
          outlook?: string | null
          region?: string | null
          risk_score?: number | null
          source_article_ids?: string[] | null
          updated_at?: string | null
        }
        Update: {
          confidence_tier?: string | null
          demand_score?: number | null
          id?: string
          opportunity_score?: number | null
          outlook?: string | null
          region?: string | null
          risk_score?: number | null
          source_article_ids?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      slug_history: {
        Row: {
          changed_at: string
          entity: string
          entity_id: string
          id: string
          old_slug: string
        }
        Insert: {
          changed_at?: string
          entity: string
          entity_id: string
          id?: string
          old_slug: string
        }
        Update: {
          changed_at?: string
          entity?: string
          entity_id?: string
          id?: string
          old_slug?: string
        }
        Relationships: []
      }
      strategic_insights: {
        Row: {
          confidence_tier: string | null
          created_at: string | null
          horizon: string | null
          id: string
          insight: string | null
          region: string | null
          sector: string | null
          source_article_ids: string[] | null
        }
        Insert: {
          confidence_tier?: string | null
          created_at?: string | null
          horizon?: string | null
          id?: string
          insight?: string | null
          region?: string | null
          sector?: string | null
          source_article_ids?: string[] | null
        }
        Update: {
          confidence_tier?: string | null
          created_at?: string | null
          horizon?: string | null
          id?: string
          insight?: string | null
          region?: string | null
          sector?: string | null
          source_article_ids?: string[] | null
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          confirmation_token: string
          confirmed: boolean
          confirmed_at: string | null
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
          confirmation_token?: string
          confirmed?: boolean
          confirmed_at?: string | null
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
          confirmation_token?: string
          confirmed?: boolean
          confirmed_at?: string | null
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
          confidence_tier: string | null
          created_at: string | null
          drivers: Json | null
          id: string
          outlook: string | null
          risks: Json | null
          score: number | null
          source_article_ids: string[] | null
          updated_at: string
          week_start: string
        }
        Insert: {
          confidence_tier?: string | null
          created_at?: string | null
          drivers?: Json | null
          id?: string
          outlook?: string | null
          risks?: Json | null
          score?: number | null
          source_article_ids?: string[] | null
          updated_at?: string
          week_start: string
        }
        Update: {
          confidence_tier?: string | null
          created_at?: string | null
          drivers?: Json | null
          id?: string
          outlook?: string | null
          risks?: Json | null
          score?: number | null
          source_article_ids?: string[] | null
          updated_at?: string
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
      market_signals_public: {
        Row: {
          confidence: number | null
          confidence_tier: string | null
          created_at: string | null
          id: string | null
          locked: boolean | null
          reason: string | null
          region: string | null
          source_article_ids: string[] | null
          title: string | null
          type: string | null
        }
        Insert: {
          confidence?: never
          confidence_tier?: never
          created_at?: string | null
          id?: string | null
          locked?: never
          reason?: never
          region?: string | null
          source_article_ids?: never
          title?: string | null
          type?: string | null
        }
        Update: {
          confidence?: never
          confidence_tier?: never
          created_at?: string | null
          id?: string | null
          locked?: never
          reason?: never
          region?: string | null
          source_article_ids?: never
          title?: string | null
          type?: string | null
        }
        Relationships: []
      }
      regional_outlook_public: {
        Row: {
          confidence_tier: string | null
          demand_score: number | null
          id: string | null
          locked: boolean | null
          opportunity_score: number | null
          outlook: string | null
          region: string | null
          risk_score: number | null
          source_article_ids: string[] | null
          updated_at: string | null
        }
        Insert: {
          confidence_tier?: never
          demand_score?: never
          id?: string | null
          locked?: never
          opportunity_score?: never
          outlook?: never
          region?: string | null
          risk_score?: never
          source_article_ids?: never
          updated_at?: string | null
        }
        Update: {
          confidence_tier?: never
          demand_score?: never
          id?: string | null
          locked?: never
          opportunity_score?: never
          outlook?: never
          region?: string | null
          risk_score?: never
          source_article_ids?: never
          updated_at?: string | null
        }
        Relationships: []
      }
      strategic_insights_public: {
        Row: {
          confidence_tier: string | null
          created_at: string | null
          horizon: string | null
          id: string | null
          insight: string | null
          locked: boolean | null
          region: string | null
          sector: string | null
          source_article_ids: string[] | null
        }
        Insert: {
          confidence_tier?: never
          created_at?: string | null
          horizon?: string | null
          id?: string | null
          insight?: never
          locked?: never
          region?: string | null
          sector?: string | null
          source_article_ids?: never
        }
        Update: {
          confidence_tier?: never
          created_at?: string | null
          horizon?: string | null
          id?: string | null
          insight?: never
          locked?: never
          region?: string | null
          sector?: string | null
          source_article_ids?: never
        }
        Relationships: []
      }
    }
    Functions: {
      get_cron_secret: { Args: never; Returns: string }
      get_public_subscriber_count: { Args: never; Returns: number }
      has_active_subscription: { Args: never; Returns: boolean }
      slugify: { Args: { value: string }; Returns: string }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
