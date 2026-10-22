export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.18';
  };
  public: {
    Tables: {
      branches: {
        Row: {
          address: string | null;
          city: string | null;
          client_id: number;
          contact_name: string | null;
          contact_phone: string | null;
          created_at: string;
          id: number;
          is_active: boolean;
          name: string;
          search_text: string | null;
          state: string | null;
          updated_at: string;
        };
        Insert: {
          address?: string | null;
          city?: string | null;
          client_id: number;
          contact_name?: string | null;
          contact_phone?: string | null;
          created_at?: string;
          id?: never;
          is_active?: boolean;
          name: string;
          search_text?: string | null;
          state?: string | null;
          updated_at?: string;
        };
        Update: {
          address?: string | null;
          city?: string | null;
          client_id?: number;
          contact_name?: string | null;
          contact_phone?: string | null;
          created_at?: string;
          id?: never;
          is_active?: boolean;
          name?: string;
          search_text?: string | null;
          state?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'branches_client_id_fkey';
            columns: ['client_id'];
            isOneToOne: false;
            referencedRelation: 'clients';
            referencedColumns: ['id'];
          },
        ];
      };
      clients: {
        Row: {
          contact_email: string | null;
          contact_name: string | null;
          contact_phone: string | null;
          created_at: string;
          id: number;
          is_active: boolean;
          name: string;
          notes: string | null;
          search_text: string | null;
          tax_id: string | null;
          updated_at: string;
        };
        Insert: {
          contact_email?: string | null;
          contact_name?: string | null;
          contact_phone?: string | null;
          created_at?: string;
          id?: never;
          is_active?: boolean;
          name: string;
          notes?: string | null;
          search_text?: string | null;
          tax_id?: string | null;
          updated_at?: string;
        };
        Update: {
          contact_email?: string | null;
          contact_name?: string | null;
          contact_phone?: string | null;
          created_at?: string;
          id?: never;
          is_active?: boolean;
          name?: string;
          notes?: string | null;
          search_text?: string | null;
          tax_id?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string | null;
          full_name: string;
          id: string;
          is_active: boolean;
          last_sign_in_at: string | null;
          role: Database['public']['Enums']['user_role'];
          search_text: string | null;
          signature_path: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          full_name?: string;
          id: string;
          is_active?: boolean;
          last_sign_in_at?: string | null;
          role?: Database['public']['Enums']['user_role'];
          search_text?: string | null;
          signature_path?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          full_name?: string;
          id?: string;
          is_active?: boolean;
          last_sign_in_at?: string | null;
          role?: Database['public']['Enums']['user_role'];
          search_text?: string | null;
          signature_path?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      service_forms: {
        Row: {
          code: string;
          created_at: string;
          icon_path: string | null;
          id: number;
          is_active: boolean;
          name: string;
          search_text: string | null;
          subtitle: string | null;
          updated_at: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          icon_path?: string | null;
          id?: never;
          is_active?: boolean;
          name: string;
          search_text?: string | null;
          subtitle?: string | null;
          updated_at?: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          icon_path?: string | null;
          id?: never;
          is_active?: boolean;
          name?: string;
          search_text?: string | null;
          subtitle?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      service_package_forms: {
        Row: {
          created_at: string;
          id: number;
          package_id: number;
          service_form_id: number;
          system_id: number | null;
        };
        Insert: {
          created_at?: string;
          id?: never;
          package_id: number;
          service_form_id: number;
          system_id?: number | null;
        };
        Update: {
          created_at?: string;
          id?: never;
          package_id?: number;
          service_form_id?: number;
          system_id?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'service_package_forms_package_id_fkey';
            columns: ['package_id'];
            isOneToOne: false;
            referencedRelation: 'service_packages';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'service_package_forms_service_form_id_fkey';
            columns: ['service_form_id'];
            isOneToOne: false;
            referencedRelation: 'service_forms';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'service_package_forms_system_id_fkey';
            columns: ['system_id'];
            isOneToOne: false;
            referencedRelation: 'systems';
            referencedColumns: ['id'];
          },
        ];
      };
      service_packages: {
        Row: {
          branch_id: number;
          created_at: string;
          frequency: Database['public']['Enums']['service_frequency'];
          id: number;
          is_active: boolean;
          updated_at: string;
        };
        Insert: {
          branch_id: number;
          created_at?: string;
          frequency: Database['public']['Enums']['service_frequency'];
          id?: never;
          is_active?: boolean;
          updated_at?: string;
        };
        Update: {
          branch_id?: number;
          created_at?: string;
          frequency?: Database['public']['Enums']['service_frequency'];
          id?: never;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'service_packages_branch_id_fkey';
            columns: ['branch_id'];
            isOneToOne: false;
            referencedRelation: 'branches';
            referencedColumns: ['id'];
          },
        ];
      };
      systems: {
        Row: {
          branch_id: number;
          created_at: string;
          id: number;
          is_active: boolean;
          location: string | null;
          name: string;
          notes: string | null;
          search_text: string | null;
          system_type: Database['public']['Enums']['system_type'];
          updated_at: string;
        };
        Insert: {
          branch_id: number;
          created_at?: string;
          id?: never;
          is_active?: boolean;
          location?: string | null;
          name: string;
          notes?: string | null;
          search_text?: string | null;
          system_type: Database['public']['Enums']['system_type'];
          updated_at?: string;
        };
        Update: {
          branch_id?: number;
          created_at?: string;
          id?: never;
          is_active?: boolean;
          location?: string | null;
          name?: string;
          notes?: string | null;
          search_text?: string | null;
          system_type?: Database['public']['Enums']['system_type'];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'systems_branch_id_fkey';
            columns: ['branch_id'];
            isOneToOne: false;
            referencedRelation: 'branches';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      admin_diagnostics: { Args: never; Returns: Json };
    };
    Enums: {
      service_frequency: 'weekly' | 'monthly' | 'quarterly' | 'semiannual' | 'annual';
      system_type:
        | 'sprinkler'
        | 'hydrant'
        | 'fire_pump'
        | 'fire_extinguisher'
        | 'fire_alarm'
        | 'kitchen_suppression'
        | 'clean_agent'
        | 'other';
      user_role: 'technician' | 'admin';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      service_frequency: ['weekly', 'monthly', 'quarterly', 'semiannual', 'annual'],
      system_type: [
        'sprinkler',
        'hydrant',
        'fire_pump',
        'fire_extinguisher',
        'fire_alarm',
        'kitchen_suppression',
        'clean_agent',
        'other',
      ],
      user_role: ['technician', 'admin'],
    },
  },
} as const;
