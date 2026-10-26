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
          client_id: string;
          contact_email: string | null;
          contact_name: string | null;
          contact_phone: string | null;
          created_at: string;
          id: string;
          is_active: boolean;
          name: string;
          search_text: string | null;
          state: string | null;
          technician_id: string;
          updated_at: string;
        };
        Insert: {
          address?: string | null;
          city?: string | null;
          client_id: string;
          contact_email?: string | null;
          contact_name?: string | null;
          contact_phone?: string | null;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name: string;
          search_text?: string | null;
          state?: string | null;
          technician_id: string;
          updated_at?: string;
        };
        Update: {
          address?: string | null;
          city?: string | null;
          client_id?: string;
          contact_email?: string | null;
          contact_name?: string | null;
          contact_phone?: string | null;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
          search_text?: string | null;
          state?: string | null;
          technician_id?: string;
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
          {
            foreignKeyName: 'branches_technician_id_fkey';
            columns: ['technician_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
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
          id: string;
          is_active: boolean;
          name: string;
          notes: string | null;
          search_text: string | null;
          tax_id: string | null;
          technician_id: string;
          updated_at: string;
        };
        Insert: {
          contact_email?: string | null;
          contact_name?: string | null;
          contact_phone?: string | null;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name: string;
          notes?: string | null;
          search_text?: string | null;
          tax_id?: string | null;
          technician_id: string;
          updated_at?: string;
        };
        Update: {
          contact_email?: string | null;
          contact_name?: string | null;
          contact_phone?: string | null;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
          notes?: string | null;
          search_text?: string | null;
          tax_id?: string | null;
          technician_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'clients_technician_id_fkey';
            columns: ['technician_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
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
      reports: {
        Row: {
          answers: Json;
          branch_id: string;
          client_id: string;
          created_at: string;
          folio: number;
          form_code: string;
          form_version: number;
          id: string;
          sent_at: string;
          service_form_id: number;
          service_package_id: string | null;
          signed_at: string;
          snapshot: Json;
          started_at: string;
          supervisor_name: string;
          supervisor_signature_path: string;
          system_id: string | null;
          technician_id: string;
          technician_signature_path: string;
        };
        Insert: {
          answers: Json;
          branch_id: string;
          client_id: string;
          created_at?: string;
          folio?: never;
          form_code: string;
          form_version: number;
          id: string;
          sent_at?: string;
          service_form_id: number;
          service_package_id?: string | null;
          signed_at: string;
          snapshot: Json;
          started_at: string;
          supervisor_name: string;
          supervisor_signature_path: string;
          system_id?: string | null;
          technician_id: string;
          technician_signature_path: string;
        };
        Update: {
          answers?: Json;
          branch_id?: string;
          client_id?: string;
          created_at?: string;
          folio?: never;
          form_code?: string;
          form_version?: number;
          id?: string;
          sent_at?: string;
          service_form_id?: number;
          service_package_id?: string | null;
          signed_at?: string;
          snapshot?: Json;
          started_at?: string;
          supervisor_name?: string;
          supervisor_signature_path?: string;
          system_id?: string | null;
          technician_id?: string;
          technician_signature_path?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'reports_branch_id_fkey';
            columns: ['branch_id'];
            isOneToOne: false;
            referencedRelation: 'branches';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reports_client_id_fkey';
            columns: ['client_id'];
            isOneToOne: false;
            referencedRelation: 'clients';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reports_service_form_id_fkey';
            columns: ['service_form_id'];
            isOneToOne: false;
            referencedRelation: 'service_forms';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reports_service_package_id_fkey';
            columns: ['service_package_id'];
            isOneToOne: false;
            referencedRelation: 'service_packages';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reports_system_id_fkey';
            columns: ['system_id'];
            isOneToOne: false;
            referencedRelation: 'systems';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reports_technician_id_fkey';
            columns: ['technician_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
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
          id: string;
          package_id: string;
          service_form_id: number;
          system_id: string | null;
          technician_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          package_id: string;
          service_form_id: number;
          system_id?: string | null;
          technician_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          package_id?: string;
          service_form_id?: number;
          system_id?: string | null;
          technician_id?: string;
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
          {
            foreignKeyName: 'service_package_forms_technician_id_fkey';
            columns: ['technician_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      service_packages: {
        Row: {
          branch_id: string;
          created_at: string;
          frequency: Database['public']['Enums']['service_frequency'];
          id: string;
          is_active: boolean;
          technician_id: string;
          updated_at: string;
        };
        Insert: {
          branch_id: string;
          created_at?: string;
          frequency: Database['public']['Enums']['service_frequency'];
          id?: string;
          is_active?: boolean;
          technician_id: string;
          updated_at?: string;
        };
        Update: {
          branch_id?: string;
          created_at?: string;
          frequency?: Database['public']['Enums']['service_frequency'];
          id?: string;
          is_active?: boolean;
          technician_id?: string;
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
          {
            foreignKeyName: 'service_packages_technician_id_fkey';
            columns: ['technician_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      systems: {
        Row: {
          branch_id: string;
          created_at: string;
          id: string;
          is_active: boolean;
          location: string | null;
          name: string;
          notes: string | null;
          search_text: string | null;
          system_type: Database['public']['Enums']['system_type'];
          technician_id: string;
          updated_at: string;
        };
        Insert: {
          branch_id: string;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          location?: string | null;
          name: string;
          notes?: string | null;
          search_text?: string | null;
          system_type: Database['public']['Enums']['system_type'];
          technician_id: string;
          updated_at?: string;
        };
        Update: {
          branch_id?: string;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          location?: string | null;
          name?: string;
          notes?: string | null;
          search_text?: string | null;
          system_type?: Database['public']['Enums']['system_type'];
          technician_id?: string;
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
          {
            foreignKeyName: 'systems_technician_id_fkey';
            columns: ['technician_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
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
