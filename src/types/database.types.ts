// ─────────────────────────────────────────────────────────────────────────────
// ARQUIVO GERADO — não edite à mão. Regenere após QUALQUER migration com:
//   npx supabase gen types typescript --project-id cchbamuhjvxxayokklux > src/types/database.types.ts
// ─────────────────────────────────────────────────────────────────────────────
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
      access_profile: {
        Row: {
          clinic_id: string
          created_at: string
          description: string | null
          id: string
          is_system: boolean
          name: string
          status: Database["public"]["Enums"]["active_status"]
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name: string
          status?: Database["public"]["Enums"]["active_status"]
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name?: string
          status?: Database["public"]["Enums"]["active_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "access_profile_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic"
            referencedColumns: ["id"]
          },
        ]
      }
      access_profile_permission: {
        Row: {
          access_profile_id: string
          can_edit: boolean
          can_view: boolean
          clinic_id: string
          created_at: string
          feature_key: string
          id: string
          updated_at: string
        }
        Insert: {
          access_profile_id: string
          can_edit?: boolean
          can_view?: boolean
          clinic_id: string
          created_at?: string
          feature_key: string
          id?: string
          updated_at?: string
        }
        Update: {
          access_profile_id?: string
          can_edit?: boolean
          can_view?: boolean
          clinic_id?: string
          created_at?: string
          feature_key?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "access_profile_permission_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_profile_permission_feature_key_fkey"
            columns: ["feature_key"]
            isOneToOne: false
            referencedRelation: "feature"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "access_profile_permission_profile_fk"
            columns: ["access_profile_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "access_profile"
            referencedColumns: ["id", "clinic_id"]
          },
          {
            foreignKeyName: "access_profile_permission_profile_fk"
            columns: ["access_profile_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "role"
            referencedColumns: ["id", "clinic_id"]
          },
        ]
      }
      acquirer: {
        Row: {
          card_brands: string[]
          clinic_id: string
          created_at: string
          credit_fee: number
          debit_fee: number
          id: string
          name: string
          notes: string | null
          payout_account_id: string | null
          settlement_days: number
          status: Database["public"]["Enums"]["active_status"]
          updated_at: string
        }
        Insert: {
          card_brands: string[]
          clinic_id: string
          created_at?: string
          credit_fee: number
          debit_fee: number
          id?: string
          name: string
          notes?: string | null
          payout_account_id?: string | null
          settlement_days: number
          status?: Database["public"]["Enums"]["active_status"]
          updated_at?: string
        }
        Update: {
          card_brands?: string[]
          clinic_id?: string
          created_at?: string
          credit_fee?: number
          debit_fee?: number
          id?: string
          name?: string
          notes?: string | null
          payout_account_id?: string | null
          settlement_days?: number
          status?: Database["public"]["Enums"]["active_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "acquirer_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acquirer_payout_account_fk"
            columns: ["payout_account_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "bank_account"
            referencedColumns: ["id", "clinic_id"]
          },
          {
            foreignKeyName: "acquirer_payout_account_fk"
            columns: ["payout_account_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "bank_account_balance"
            referencedColumns: ["bank_account_id", "clinic_id"]
          },
        ]
      }
      acquirer_installment_rate: {
        Row: {
          acquirer_id: string
          clinic_id: string
          created_at: string
          fee: number
          id: string
          installments: number
          updated_at: string
        }
        Insert: {
          acquirer_id: string
          clinic_id: string
          created_at?: string
          fee: number
          id?: string
          installments: number
          updated_at?: string
        }
        Update: {
          acquirer_id?: string
          clinic_id?: string
          created_at?: string
          fee?: number
          id?: string
          installments?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "acquirer_installment_rate_acquirer_fk"
            columns: ["acquirer_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "acquirer"
            referencedColumns: ["id", "clinic_id"]
          },
          {
            foreignKeyName: "acquirer_installment_rate_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic"
            referencedColumns: ["id"]
          },
        ]
      }
      anamnesis: {
        Row: {
          archived_at: string | null
          clinic_id: string
          created_at: string
          filled_by: string | null
          id: string
          patient_id: string
          status: Database["public"]["Enums"]["anamnesis_status"]
          template_id: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          clinic_id: string
          created_at?: string
          filled_by?: string | null
          id?: string
          patient_id: string
          status?: Database["public"]["Enums"]["anamnesis_status"]
          template_id: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          clinic_id?: string
          created_at?: string
          filled_by?: string | null
          id?: string
          patient_id?: string
          status?: Database["public"]["Enums"]["anamnesis_status"]
          template_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "anamnesis_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anamnesis_filled_by_fkey"
            columns: ["filled_by"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anamnesis_patient_fk"
            columns: ["patient_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "patient"
            referencedColumns: ["id", "clinic_id"]
          },
          {
            foreignKeyName: "anamnesis_template_fk"
            columns: ["template_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "anamnesis_template"
            referencedColumns: ["id", "clinic_id"]
          },
        ]
      }
      anamnesis_answer: {
        Row: {
          anamnesis_id: string
          answer_label: string | null
          clinic_id: string
          created_at: string
          detail_text: string | null
          id: string
          option_id: string | null
          question_id: string
          question_text: string
          template_id: string
          text_value: string | null
          updated_at: string
        }
        Insert: {
          anamnesis_id: string
          answer_label?: string | null
          clinic_id: string
          created_at?: string
          detail_text?: string | null
          id?: string
          option_id?: string | null
          question_id: string
          question_text: string
          template_id: string
          text_value?: string | null
          updated_at?: string
        }
        Update: {
          anamnesis_id?: string
          answer_label?: string | null
          clinic_id?: string
          created_at?: string
          detail_text?: string | null
          id?: string
          option_id?: string | null
          question_id?: string
          question_text?: string
          template_id?: string
          text_value?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "anamnesis_answer_anamnesis_fk"
            columns: ["anamnesis_id", "template_id"]
            isOneToOne: false
            referencedRelation: "anamnesis"
            referencedColumns: ["id", "template_id"]
          },
          {
            foreignKeyName: "anamnesis_answer_clinic_fk"
            columns: ["anamnesis_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "anamnesis"
            referencedColumns: ["id", "clinic_id"]
          },
          {
            foreignKeyName: "anamnesis_answer_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anamnesis_answer_option_fk"
            columns: ["option_id", "question_id"]
            isOneToOne: false
            referencedRelation: "anamnesis_question_option"
            referencedColumns: ["id", "question_id"]
          },
          {
            foreignKeyName: "anamnesis_answer_question_fk"
            columns: ["question_id", "template_id"]
            isOneToOne: false
            referencedRelation: "anamnesis_question"
            referencedColumns: ["id", "template_id"]
          },
        ]
      }
      anamnesis_question: {
        Row: {
          clinic_id: string
          code: string
          created_at: string
          detail_label: string | null
          detail_shown_for: string[] | null
          id: string
          input_type: Database["public"]["Enums"]["anamnesis_input_type"]
          question_text: string
          section_id: string
          sort_order: number
          status: Database["public"]["Enums"]["active_status"]
          template_id: string
          updated_at: string
        }
        Insert: {
          clinic_id: string
          code: string
          created_at?: string
          detail_label?: string | null
          detail_shown_for?: string[] | null
          id?: string
          input_type: Database["public"]["Enums"]["anamnesis_input_type"]
          question_text: string
          section_id: string
          sort_order?: number
          status?: Database["public"]["Enums"]["active_status"]
          template_id: string
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          code?: string
          created_at?: string
          detail_label?: string | null
          detail_shown_for?: string[] | null
          id?: string
          input_type?: Database["public"]["Enums"]["anamnesis_input_type"]
          question_text?: string
          section_id?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["active_status"]
          template_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "anamnesis_question_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anamnesis_question_section_fk"
            columns: ["section_id", "template_id"]
            isOneToOne: false
            referencedRelation: "anamnesis_section"
            referencedColumns: ["id", "template_id"]
          },
          {
            foreignKeyName: "anamnesis_question_template_fk"
            columns: ["template_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "anamnesis_template"
            referencedColumns: ["id", "clinic_id"]
          },
        ]
      }
      anamnesis_question_option: {
        Row: {
          clinic_id: string
          created_at: string
          id: string
          is_alert: boolean
          label: string
          question_id: string
          sort_order: number
          updated_at: string
          value: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          id?: string
          is_alert?: boolean
          label: string
          question_id: string
          sort_order?: number
          updated_at?: string
          value: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          id?: string
          is_alert?: boolean
          label?: string
          question_id?: string
          sort_order?: number
          updated_at?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "anamnesis_question_option_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anamnesis_question_option_question_fk"
            columns: ["question_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "anamnesis_question"
            referencedColumns: ["id", "clinic_id"]
          },
        ]
      }
      anamnesis_section: {
        Row: {
          clinic_id: string
          created_at: string
          description: string | null
          id: string
          sort_order: number
          template_id: string
          title: string
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          description?: string | null
          id?: string
          sort_order?: number
          template_id: string
          title: string
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          description?: string | null
          id?: string
          sort_order?: number
          template_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "anamnesis_section_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anamnesis_section_template_fk"
            columns: ["template_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "anamnesis_template"
            referencedColumns: ["id", "clinic_id"]
          },
        ]
      }
      anamnesis_template: {
        Row: {
          clinic_id: string
          created_at: string
          description: string | null
          id: string
          is_default: boolean
          name: string
          specialty: Database["public"]["Enums"]["clinic_specialty"]
          status: Database["public"]["Enums"]["active_status"]
          updated_at: string
          version: number
        }
        Insert: {
          clinic_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean
          name: string
          specialty: Database["public"]["Enums"]["clinic_specialty"]
          status?: Database["public"]["Enums"]["active_status"]
          updated_at?: string
          version?: number
        }
        Update: {
          clinic_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean
          name?: string
          specialty?: Database["public"]["Enums"]["clinic_specialty"]
          status?: Database["public"]["Enums"]["active_status"]
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "anamnesis_template_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic"
            referencedColumns: ["id"]
          },
        ]
      }
      appointment: {
        Row: {
          clinic_id: string
          color: string | null
          created_at: string
          date: string
          duration_minutes: number
          ends_at: string | null
          id: string
          notes: string | null
          patient_id: string
          professional_id: string
          room_id: string | null
          schedule_slot_id: string | null
          send_confirmation: boolean
          service: string
          start_time: string
          starts_at: string | null
          status: Database["public"]["Enums"]["appointment_status"]
          updated_at: string
        }
        Insert: {
          clinic_id: string
          color?: string | null
          created_at?: string
          date: string
          duration_minutes?: number
          ends_at?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          professional_id: string
          room_id?: string | null
          schedule_slot_id?: string | null
          send_confirmation?: boolean
          service: string
          start_time: string
          starts_at?: string | null
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          color?: string | null
          created_at?: string
          date?: string
          duration_minutes?: number
          ends_at?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          professional_id?: string
          room_id?: string | null
          schedule_slot_id?: string | null
          send_confirmation?: boolean
          service?: string
          start_time?: string
          starts_at?: string | null
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_patient_fk"
            columns: ["patient_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "patient"
            referencedColumns: ["id", "clinic_id"]
          },
          {
            foreignKeyName: "appointment_professional_fk"
            columns: ["professional_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "professional"
            referencedColumns: ["id", "clinic_id"]
          },
          {
            foreignKeyName: "appointment_professional_fk"
            columns: ["professional_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "professional_directory"
            referencedColumns: ["id", "clinic_id"]
          },
          {
            foreignKeyName: "appointment_room_fk"
            columns: ["room_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "room"
            referencedColumns: ["id", "clinic_id"]
          },
          {
            foreignKeyName: "appointment_schedule_slot_fk"
            columns: ["schedule_slot_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "schedule_slot"
            referencedColumns: ["id", "clinic_id"]
          },
        ]
      }
      appointment_history: {
        Row: {
          appointment_id: string | null
          clinic_id: string
          created_at: string
          date: string
          duration_minutes: number | null
          id: string
          notes: string | null
          patient_id: string
          procedures: string[]
          professional_id: string
          service: string
          start_time: string
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          clinic_id: string
          created_at?: string
          date: string
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          patient_id: string
          procedures?: string[]
          professional_id: string
          service: string
          start_time: string
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          clinic_id?: string
          created_at?: string
          date?: string
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          patient_id?: string
          procedures?: string[]
          professional_id?: string
          service?: string
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_history_appointment_fk"
            columns: ["appointment_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "appointment"
            referencedColumns: ["id", "clinic_id"]
          },
          {
            foreignKeyName: "appointment_history_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_history_patient_fk"
            columns: ["patient_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "patient"
            referencedColumns: ["id", "clinic_id"]
          },
          {
            foreignKeyName: "appointment_history_professional_fk"
            columns: ["professional_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "professional"
            referencedColumns: ["id", "clinic_id"]
          },
          {
            foreignKeyName: "appointment_history_professional_fk"
            columns: ["professional_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "professional_directory"
            referencedColumns: ["id", "clinic_id"]
          },
        ]
      }
      appointment_history_material: {
        Row: {
          appointment_history_id: string
          clinic_id: string
          created_at: string
          id: string
          material_id: string | null
          name: string
          position: number
          quantity: string
          updated_at: string
        }
        Insert: {
          appointment_history_id: string
          clinic_id: string
          created_at?: string
          id?: string
          material_id?: string | null
          name: string
          position?: number
          quantity: string
          updated_at?: string
        }
        Update: {
          appointment_history_id?: string
          clinic_id?: string
          created_at?: string
          id?: string
          material_id?: string | null
          name?: string
          position?: number
          quantity?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_history_material_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_history_material_material_fk"
            columns: ["material_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "material"
            referencedColumns: ["id", "clinic_id"]
          },
          {
            foreignKeyName: "appointment_history_material_parent_fk"
            columns: ["appointment_history_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "appointment_history"
            referencedColumns: ["id", "clinic_id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: Database["public"]["Enums"]["audit_action"]
          actor_id: string | null
          actor_name: string | null
          changed_fields: string[] | null
          clinic_id: string
          created_at: string
          id: string
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
        }
        Insert: {
          action: Database["public"]["Enums"]["audit_action"]
          actor_id?: string | null
          actor_name?: string | null
          changed_fields?: string[] | null
          clinic_id: string
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
        }
        Update: {
          action?: Database["public"]["Enums"]["audit_action"]
          actor_id?: string | null
          actor_name?: string | null
          changed_fields?: string[] | null
          clinic_id?: string
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_account: {
        Row: {
          account_number: string | null
          bank: string | null
          branch: string | null
          clinic_id: string
          created_at: string
          holder: string | null
          id: string
          is_default: boolean
          name: string
          notes: string | null
          opening_balance: number
          status: Database["public"]["Enums"]["active_status"]
          type: Database["public"]["Enums"]["bank_account_type"]
          updated_at: string
        }
        Insert: {
          account_number?: string | null
          bank?: string | null
          branch?: string | null
          clinic_id: string
          created_at?: string
          holder?: string | null
          id?: string
          is_default?: boolean
          name: string
          notes?: string | null
          opening_balance?: number
          status?: Database["public"]["Enums"]["active_status"]
          type: Database["public"]["Enums"]["bank_account_type"]
          updated_at?: string
        }
        Update: {
          account_number?: string | null
          bank?: string | null
          branch?: string | null
          clinic_id?: string
          created_at?: string
          holder?: string | null
          id?: string
          is_default?: boolean
          name?: string
          notes?: string | null
          opening_balance?: number
          status?: Database["public"]["Enums"]["active_status"]
          type?: Database["public"]["Enums"]["bank_account_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_account_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic"
            referencedColumns: ["id"]
          },
        ]
      }
      billed_treatment: {
        Row: {
          amount: number
          clinic_id: string
          created_at: string
          id: string
          name: string
          payment_id: string
          professional_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          clinic_id: string
          created_at?: string
          id?: string
          name: string
          payment_id: string
          professional_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          clinic_id?: string
          created_at?: string
          id?: string
          name?: string
          payment_id?: string
          professional_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "billed_treatment_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billed_treatment_payment_fk"
            columns: ["payment_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "payment"
            referencedColumns: ["id", "clinic_id"]
          },
          {
            foreignKeyName: "billed_treatment_professional_fk"
            columns: ["professional_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "professional"
            referencedColumns: ["id", "clinic_id"]
          },
          {
            foreignKeyName: "billed_treatment_professional_fk"
            columns: ["professional_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "professional_directory"
            referencedColumns: ["id", "clinic_id"]
          },
        ]
      }
      cash_movement: {
        Row: {
          amount: number
          cash_session_id: string
          clinic_id: string
          created_at: string
          description: string
          id: string
          name: string
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          posted_at: string
          type: Database["public"]["Enums"]["cash_movement_type"]
          updated_at: string
        }
        Insert: {
          amount: number
          cash_session_id: string
          clinic_id: string
          created_at?: string
          description: string
          id?: string
          name: string
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          posted_at?: string
          type: Database["public"]["Enums"]["cash_movement_type"]
          updated_at?: string
        }
        Update: {
          amount?: number
          cash_session_id?: string
          clinic_id?: string
          created_at?: string
          description?: string
          id?: string
          name?: string
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          posted_at?: string
          type?: Database["public"]["Enums"]["cash_movement_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_movement_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_movement_session_fk"
            columns: ["cash_session_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "cash_session"
            referencedColumns: ["id", "clinic_id"]
          },
        ]
      }
      cash_session: {
        Row: {
          clinic_id: string
          closed_at: string | null
          closed_by: string | null
          counted_amount: number | null
          created_at: string
          id: string
          notes: string | null
          opened_at: string
          opened_by: string | null
          opening_amount: number
          operator_name: string
          updated_at: string
        }
        Insert: {
          clinic_id: string
          closed_at?: string | null
          closed_by?: string | null
          counted_amount?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          opened_at?: string
          opened_by?: string | null
          opening_amount?: number
          operator_name: string
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          closed_at?: string | null
          closed_by?: string | null
          counted_amount?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          opened_at?: string
          opened_by?: string | null
          opening_amount?: number
          operator_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_session_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_session_closed_by_fkey"
            columns: ["closed_by"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_session_opened_by_fkey"
            columns: ["opened_by"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic: {
        Row: {
          cep: string | null
          city: string | null
          cnpj: string | null
          created_at: string
          email: string | null
          id: string
          logo_url: string | null
          name: string
          neighborhood: string | null
          number: string | null
          phone: string | null
          plan_key: string
          specialty: Database["public"]["Enums"]["clinic_specialty"]
          state: string | null
          status: Database["public"]["Enums"]["clinic_status"]
          street: string | null
          updated_at: string
        }
        Insert: {
          cep?: string | null
          city?: string | null
          cnpj?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name: string
          neighborhood?: string | null
          number?: string | null
          phone?: string | null
          plan_key: string
          specialty: Database["public"]["Enums"]["clinic_specialty"]
          state?: string | null
          status?: Database["public"]["Enums"]["clinic_status"]
          street?: string | null
          updated_at?: string
        }
        Update: {
          cep?: string | null
          city?: string | null
          cnpj?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          neighborhood?: string | null
          number?: string | null
          phone?: string | null
          plan_key?: string
          specialty?: Database["public"]["Enums"]["clinic_specialty"]
          state?: string | null
          status?: Database["public"]["Enums"]["clinic_status"]
          street?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_plan_key_fkey"
            columns: ["plan_key"]
            isOneToOne: false
            referencedRelation: "plan"
            referencedColumns: ["key"]
          },
        ]
      }
      clinic_finance_setting: {
        Row: {
          clinic_id: string
          created_at: string
          overdue_grace_days: number
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          overdue_grace_days?: number
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          overdue_grace_days?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_finance_setting_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: true
            referencedRelation: "clinic"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_goal: {
        Row: {
          clinic_id: string
          created_at: string
          id: string
          metric: Database["public"]["Enums"]["goal_metric"]
          monthly: number[]
          updated_at: string
          year: number
        }
        Insert: {
          clinic_id: string
          created_at?: string
          id?: string
          metric: Database["public"]["Enums"]["goal_metric"]
          monthly?: number[]
          updated_at?: string
          year: number
        }
        Update: {
          clinic_id?: string
          created_at?: string
          id?: string
          metric?: Database["public"]["Enums"]["goal_metric"]
          monthly?: number[]
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "clinic_goal_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_user: {
        Row: {
          access_profile_id: string
          birth_date: string | null
          cep: string | null
          city: string | null
          clinic_id: string
          created_at: string
          id: string
          invited_by: string | null
          is_owner: boolean
          joined_at: string | null
          neighborhood: string | null
          number: string | null
          sex: Database["public"]["Enums"]["gender"] | null
          state: string | null
          status: Database["public"]["Enums"]["membership_status"]
          updated_at: string
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          access_profile_id: string
          birth_date?: string | null
          cep?: string | null
          city?: string | null
          clinic_id: string
          created_at?: string
          id?: string
          invited_by?: string | null
          is_owner?: boolean
          joined_at?: string | null
          neighborhood?: string | null
          number?: string | null
          sex?: Database["public"]["Enums"]["gender"] | null
          state?: string | null
          status?: Database["public"]["Enums"]["membership_status"]
          updated_at?: string
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          access_profile_id?: string
          birth_date?: string | null
          cep?: string | null
          city?: string | null
          clinic_id?: string
          created_at?: string
          id?: string
          invited_by?: string | null
          is_owner?: boolean
          joined_at?: string | null
          neighborhood?: string | null
          number?: string | null
          sex?: Database["public"]["Enums"]["gender"] | null
          state?: string | null
          status?: Database["public"]["Enums"]["membership_status"]
          updated_at?: string
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinic_user_access_profile_fk"
            columns: ["access_profile_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "access_profile"
            referencedColumns: ["id", "clinic_id"]
          },
          {
            foreignKeyName: "clinic_user_access_profile_fk"
            columns: ["access_profile_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "role"
            referencedColumns: ["id", "clinic_id"]
          },
          {
            foreignKeyName: "clinic_user_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_user_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_user_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_attempt: {
        Row: {
          amount_charged: number
          attempt_date: string
          channel: Database["public"]["Enums"]["collection_channel"]
          clinic_id: string
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          patient_id: string
          updated_at: string
        }
        Insert: {
          amount_charged: number
          attempt_date: string
          channel: Database["public"]["Enums"]["collection_channel"]
          clinic_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          updated_at?: string
        }
        Update: {
          amount_charged?: number
          attempt_date?: string
          channel?: Database["public"]["Enums"]["collection_channel"]
          clinic_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_attempt_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_attempt_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_attempt_patient_fk"
            columns: ["patient_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "patient"
            referencedColumns: ["id", "clinic_id"]
          },
        ]
      }
      counter: {
        Row: {
          clinic_id: string
          created_at: string
          id: string
          key: string
          updated_at: string
          value: number
        }
        Insert: {
          clinic_id: string
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value?: number
        }
        Update: {
          clinic_id?: string
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "counter_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic"
            referencedColumns: ["id"]
          },
        ]
      }
      feature: {
        Row: {
          category: string
          created_at: string
          is_addon: boolean
          key: string
          label: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          is_addon?: boolean
          key: string
          label: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          is_addon?: boolean
          key?: string
          label?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      insurance: {
        Row: {
          ans: string | null
          clinic_id: string
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          payout_days: number | null
          phone: string | null
          status: Database["public"]["Enums"]["active_status"]
          updated_at: string
        }
        Insert: {
          ans?: string | null
          clinic_id: string
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          payout_days?: number | null
          phone?: string | null
          status?: Database["public"]["Enums"]["active_status"]
          updated_at?: string
        }
        Update: {
          ans?: string | null
          clinic_id?: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          payout_days?: number | null
          phone?: string | null
          status?: Database["public"]["Enums"]["active_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "insurance_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic"
            referencedColumns: ["id"]
          },
        ]
      }
      lead: {
        Row: {
          clinic_id: string
          created_at: string
          email: string | null
          id: string
          interest: string
          name: string
          notes: string | null
          patient_id: string | null
          phone: string
          source: string
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          email?: string | null
          id?: string
          interest: string
          name: string
          notes?: string | null
          patient_id?: string | null
          phone: string
          source: string
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          email?: string | null
          id?: string
          interest?: string
          name?: string
          notes?: string | null
          patient_id?: string | null
          phone?: string
          source?: string
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_patient_fk"
            columns: ["patient_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "patient"
            referencedColumns: ["id", "clinic_id"]
          },
        ]
      }
      material: {
        Row: {
          clinic_id: string
          created_at: string
          expiry_date: string | null
          id: string
          in_stock: number
          min_quantity: number
          name: string
          notes: string | null
          photo_url: string | null
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          expiry_date?: string | null
          id?: string
          in_stock?: number
          min_quantity?: number
          name: string
          notes?: string | null
          photo_url?: string | null
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          expiry_date?: string | null
          id?: string
          in_stock?: number
          min_quantity?: number
          name?: string
          notes?: string | null
          photo_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic"
            referencedColumns: ["id"]
          },
        ]
      }
      patient: {
        Row: {
          birth_date: string | null
          cep: string | null
          city: string | null
          clinic_id: string
          code: string
          cpf: string | null
          created_at: string
          email: string | null
          id: string
          insurance_id: string | null
          last_visit: string | null
          name: string
          neighborhood: string | null
          number: string | null
          phone: string
          photo_url: string | null
          search_name: string | null
          sex: Database["public"]["Enums"]["gender"] | null
          state: string | null
          status: Database["public"]["Enums"]["active_status"]
          street: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          birth_date?: string | null
          cep?: string | null
          city?: string | null
          clinic_id: string
          code: string
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          insurance_id?: string | null
          last_visit?: string | null
          name: string
          neighborhood?: string | null
          number?: string | null
          phone: string
          photo_url?: string | null
          search_name?: string | null
          sex?: Database["public"]["Enums"]["gender"] | null
          state?: string | null
          status?: Database["public"]["Enums"]["active_status"]
          street?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          birth_date?: string | null
          cep?: string | null
          city?: string | null
          clinic_id?: string
          code?: string
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          insurance_id?: string | null
          last_visit?: string | null
          name?: string
          neighborhood?: string | null
          number?: string | null
          phone?: string
          photo_url?: string | null
          search_name?: string | null
          sex?: Database["public"]["Enums"]["gender"] | null
          state?: string | null
          status?: Database["public"]["Enums"]["active_status"]
          street?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_insurance_fk"
            columns: ["insurance_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "insurance"
            referencedColumns: ["id", "clinic_id"]
          },
        ]
      }
      patient_document: {
        Row: {
          clinic_id: string
          created_at: string
          description: string | null
          file_name: string
          id: string
          mime_type: string | null
          name: string
          patient_id: string
          size_bytes: number | null
          storage_path: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          clinic_id: string
          created_at?: string
          description?: string | null
          file_name: string
          id?: string
          mime_type?: string | null
          name: string
          patient_id: string
          size_bytes?: number | null
          storage_path: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          clinic_id?: string
          created_at?: string
          description?: string | null
          file_name?: string
          id?: string
          mime_type?: string | null
          name?: string
          patient_id?: string
          size_bytes?: number | null
          storage_path?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_document_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_document_patient_fk"
            columns: ["patient_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "patient"
            referencedColumns: ["id", "clinic_id"]
          },
          {
            foreignKeyName: "patient_document_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
        ]
      }
      payable: {
        Row: {
          amount: number
          bank_account_id: string | null
          category: string
          clinic_id: string
          code: string
          created_at: string
          description: string
          due_date: string
          id: string
          notes: string | null
          paid_amount: number | null
          paid_at: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          status: Database["public"]["Enums"]["payment_status"]
          supplier: string
          updated_at: string
        }
        Insert: {
          amount: number
          bank_account_id?: string | null
          category: string
          clinic_id: string
          code: string
          created_at?: string
          description: string
          due_date: string
          id?: string
          notes?: string | null
          paid_amount?: number | null
          paid_at?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          status?: Database["public"]["Enums"]["payment_status"]
          supplier: string
          updated_at?: string
        }
        Update: {
          amount?: number
          bank_account_id?: string | null
          category?: string
          clinic_id?: string
          code?: string
          created_at?: string
          description?: string
          due_date?: string
          id?: string
          notes?: string | null
          paid_amount?: number | null
          paid_at?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          status?: Database["public"]["Enums"]["payment_status"]
          supplier?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payable_bank_account_fk"
            columns: ["bank_account_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "bank_account"
            referencedColumns: ["id", "clinic_id"]
          },
          {
            foreignKeyName: "payable_bank_account_fk"
            columns: ["bank_account_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "bank_account_balance"
            referencedColumns: ["bank_account_id", "clinic_id"]
          },
          {
            foreignKeyName: "payable_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic"
            referencedColumns: ["id"]
          },
        ]
      }
      payment: {
        Row: {
          amount: number
          clinic_id: string
          code: string
          created_at: string
          description: string
          id: string
          patient_id: string
          payment_date: string
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          clinic_id: string
          code: string
          created_at?: string
          description: string
          id?: string
          patient_id: string
          payment_date: string
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          clinic_id?: string
          code?: string
          created_at?: string
          description?: string
          id?: string
          patient_id?: string
          payment_date?: string
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_patient_fk"
            columns: ["patient_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "patient"
            referencedColumns: ["id", "clinic_id"]
          },
        ]
      }
      payment_entry: {
        Row: {
          amount: number
          authorization_code: string | null
          card_brand: string | null
          clinic_id: string
          created_at: string
          id: string
          installments: number | null
          method: Database["public"]["Enums"]["payment_method"]
          nsu: string | null
          payment_id: string
          received_on: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          authorization_code?: string | null
          card_brand?: string | null
          clinic_id: string
          created_at?: string
          id?: string
          installments?: number | null
          method: Database["public"]["Enums"]["payment_method"]
          nsu?: string | null
          payment_id: string
          received_on?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          authorization_code?: string | null
          card_brand?: string | null
          clinic_id?: string
          created_at?: string
          id?: string
          installments?: number | null
          method?: Database["public"]["Enums"]["payment_method"]
          nsu?: string | null
          payment_id?: string
          received_on?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_entry_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_entry_payment_fk"
            columns: ["payment_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "payment"
            referencedColumns: ["id", "clinic_id"]
          },
        ]
      }
      plan: {
        Row: {
          created_at: string
          included_professionals: number | null
          key: string
          label: string
          monthly_price: number
          sort_order: number
          status: Database["public"]["Enums"]["active_status"]
          updated_at: string
          yearly_price: number | null
        }
        Insert: {
          created_at?: string
          included_professionals?: number | null
          key: string
          label: string
          monthly_price: number
          sort_order?: number
          status?: Database["public"]["Enums"]["active_status"]
          updated_at?: string
          yearly_price?: number | null
        }
        Update: {
          created_at?: string
          included_professionals?: number | null
          key?: string
          label?: string
          monthly_price?: number
          sort_order?: number
          status?: Database["public"]["Enums"]["active_status"]
          updated_at?: string
          yearly_price?: number | null
        }
        Relationships: []
      }
      plan_feature: {
        Row: {
          created_at: string
          feature_key: string
          id: string
          plan_key: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          feature_key: string
          id?: string
          plan_key: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          feature_key?: string
          id?: string
          plan_key?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_feature_feature_key_fkey"
            columns: ["feature_key"]
            isOneToOne: false
            referencedRelation: "feature"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "plan_feature_plan_key_fkey"
            columns: ["plan_key"]
            isOneToOne: false
            referencedRelation: "plan"
            referencedColumns: ["key"]
          },
        ]
      }
      prescription: {
        Row: {
          body: string | null
          clinic_id: string
          code: string
          created_at: string
          id: string
          issued_on: string
          notes: string | null
          patient_id: string
          professional_id: string | null
          title: string
          type: Database["public"]["Enums"]["prescription_type"]
          updated_at: string
        }
        Insert: {
          body?: string | null
          clinic_id: string
          code: string
          created_at?: string
          id?: string
          issued_on?: string
          notes?: string | null
          patient_id: string
          professional_id?: string | null
          title: string
          type: Database["public"]["Enums"]["prescription_type"]
          updated_at?: string
        }
        Update: {
          body?: string | null
          clinic_id?: string
          code?: string
          created_at?: string
          id?: string
          issued_on?: string
          notes?: string | null
          patient_id?: string
          professional_id?: string | null
          title?: string
          type?: Database["public"]["Enums"]["prescription_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prescription_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescription_patient_fk"
            columns: ["patient_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "patient"
            referencedColumns: ["id", "clinic_id"]
          },
          {
            foreignKeyName: "prescription_professional_fk"
            columns: ["professional_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "professional"
            referencedColumns: ["id", "clinic_id"]
          },
          {
            foreignKeyName: "prescription_professional_fk"
            columns: ["professional_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "professional_directory"
            referencedColumns: ["id", "clinic_id"]
          },
        ]
      }
      prescription_medication: {
        Row: {
          clinic_id: string
          created_at: string
          dosage: string
          id: string
          name: string
          prescription_id: string
          prescription_type: Database["public"]["Enums"]["prescription_type"]
          quantity: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          dosage: string
          id?: string
          name: string
          prescription_id: string
          prescription_type?: Database["public"]["Enums"]["prescription_type"]
          quantity?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          dosage?: string
          id?: string
          name?: string
          prescription_id?: string
          prescription_type?: Database["public"]["Enums"]["prescription_type"]
          quantity?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prescription_medication_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescription_medication_prescription_fk"
            columns: ["prescription_id", "prescription_type", "clinic_id"]
            isOneToOne: false
            referencedRelation: "prescription"
            referencedColumns: ["id", "type", "clinic_id"]
          },
        ]
      }
      professional: {
        Row: {
          birth_date: string | null
          cep: string | null
          city: string | null
          clinic_id: string
          code: string
          color: string | null
          courses: string[]
          created_at: string
          description: string | null
          email: string | null
          id: string
          is_technical_manager: boolean
          languages: string[]
          license: string
          name: string
          neighborhood: string | null
          number: string | null
          phone: string | null
          photo_url: string | null
          rating: number | null
          sex: Database["public"]["Enums"]["gender"] | null
          specializations: string[]
          specialty: string
          state: string | null
          status: Database["public"]["Enums"]["active_status"]
          street: string | null
          updated_at: string
          user_id: string | null
          whatsapp: string | null
        }
        Insert: {
          birth_date?: string | null
          cep?: string | null
          city?: string | null
          clinic_id: string
          code: string
          color?: string | null
          courses?: string[]
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          is_technical_manager?: boolean
          languages?: string[]
          license: string
          name: string
          neighborhood?: string | null
          number?: string | null
          phone?: string | null
          photo_url?: string | null
          rating?: number | null
          sex?: Database["public"]["Enums"]["gender"] | null
          specializations?: string[]
          specialty: string
          state?: string | null
          status?: Database["public"]["Enums"]["active_status"]
          street?: string | null
          updated_at?: string
          user_id?: string | null
          whatsapp?: string | null
        }
        Update: {
          birth_date?: string | null
          cep?: string | null
          city?: string | null
          clinic_id?: string
          code?: string
          color?: string | null
          courses?: string[]
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          is_technical_manager?: boolean
          languages?: string[]
          license?: string
          name?: string
          neighborhood?: string | null
          number?: string | null
          phone?: string | null
          photo_url?: string | null
          rating?: number | null
          sex?: Database["public"]["Enums"]["gender"] | null
          specializations?: string[]
          specialty?: string
          state?: string | null
          status?: Database["public"]["Enums"]["active_status"]
          street?: string | null
          updated_at?: string
          user_id?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professional_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_user_fk"
            columns: ["clinic_id", "user_id"]
            isOneToOne: false
            referencedRelation: "clinic_user"
            referencedColumns: ["clinic_id", "user_id"]
          },
        ]
      }
      professional_commission: {
        Row: {
          amount: number
          base: Database["public"]["Enums"]["commission_base"]
          clinic_id: string
          created_at: string
          id: string
          notes: string | null
          payout: Database["public"]["Enums"]["commission_payout"]
          payout_day: number | null
          professional_id: string
          status: Database["public"]["Enums"]["active_status"]
          type: Database["public"]["Enums"]["commission_type"]
          updated_at: string
        }
        Insert: {
          amount: number
          base?: Database["public"]["Enums"]["commission_base"]
          clinic_id: string
          created_at?: string
          id?: string
          notes?: string | null
          payout: Database["public"]["Enums"]["commission_payout"]
          payout_day?: number | null
          professional_id: string
          status?: Database["public"]["Enums"]["active_status"]
          type: Database["public"]["Enums"]["commission_type"]
          updated_at?: string
        }
        Update: {
          amount?: number
          base?: Database["public"]["Enums"]["commission_base"]
          clinic_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          payout?: Database["public"]["Enums"]["commission_payout"]
          payout_day?: number | null
          professional_id?: string
          status?: Database["public"]["Enums"]["active_status"]
          type?: Database["public"]["Enums"]["commission_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_commission_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_commission_professional_fk"
            columns: ["professional_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "professional"
            referencedColumns: ["id", "clinic_id"]
          },
          {
            foreignKeyName: "professional_commission_professional_fk"
            columns: ["professional_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "professional_directory"
            referencedColumns: ["id", "clinic_id"]
          },
        ]
      }
      professional_education: {
        Row: {
          clinic_id: string
          course: string
          created_at: string
          id: string
          institution: string
          professional_id: string
          sort_order: number
          updated_at: string
          year: number | null
        }
        Insert: {
          clinic_id: string
          course: string
          created_at?: string
          id?: string
          institution: string
          professional_id: string
          sort_order?: number
          updated_at?: string
          year?: number | null
        }
        Update: {
          clinic_id?: string
          course?: string
          created_at?: string
          id?: string
          institution?: string
          professional_id?: string
          sort_order?: number
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "professional_education_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_education_professional_fk"
            columns: ["professional_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "professional"
            referencedColumns: ["id", "clinic_id"]
          },
          {
            foreignKeyName: "professional_education_professional_fk"
            columns: ["professional_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "professional_directory"
            referencedColumns: ["id", "clinic_id"]
          },
        ]
      }
      professional_experience: {
        Row: {
          clinic_id: string
          created_at: string
          id: string
          period: string
          position: string
          professional_id: string
          sort_order: number
          updated_at: string
          workplace: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          id?: string
          period: string
          position: string
          professional_id: string
          sort_order?: number
          updated_at?: string
          workplace: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          id?: string
          period?: string
          position?: string
          professional_id?: string
          sort_order?: number
          updated_at?: string
          workplace?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_experience_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_experience_professional_fk"
            columns: ["professional_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "professional"
            referencedColumns: ["id", "clinic_id"]
          },
          {
            foreignKeyName: "professional_experience_professional_fk"
            columns: ["professional_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "professional_directory"
            referencedColumns: ["id", "clinic_id"]
          },
        ]
      }
      profile: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          platform_admin: boolean
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          platform_admin?: boolean
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          platform_admin?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      quote: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          clinic_id: string
          code: string
          created_at: string
          discount: number
          id: string
          installments: number
          issue_date: string
          items_total: number
          name: string
          notes: string | null
          patient_id: string
          status: Database["public"]["Enums"]["quote_status"]
          total: number | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          clinic_id: string
          code: string
          created_at?: string
          discount?: number
          id?: string
          installments?: number
          issue_date?: string
          items_total?: number
          name: string
          notes?: string | null
          patient_id: string
          status?: Database["public"]["Enums"]["quote_status"]
          total?: number | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          clinic_id?: string
          code?: string
          created_at?: string
          discount?: number
          id?: string
          installments?: number
          issue_date?: string
          items_total?: number
          name?: string
          notes?: string | null
          patient_id?: string
          status?: Database["public"]["Enums"]["quote_status"]
          total?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_patient_fk"
            columns: ["patient_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "patient"
            referencedColumns: ["id", "clinic_id"]
          },
        ]
      }
      quote_item: {
        Row: {
          amount: number | null
          clinic_id: string
          created_at: string
          faces: string[] | null
          id: string
          insurance_id: string | null
          multiply_per_tooth: boolean
          professional_id: string | null
          quote_id: string
          sort_order: number
          teeth: string[] | null
          treatment: string
          unit_price: number
          updated_at: string
        }
        Insert: {
          amount?: number | null
          clinic_id: string
          created_at?: string
          faces?: string[] | null
          id?: string
          insurance_id?: string | null
          multiply_per_tooth?: boolean
          professional_id?: string | null
          quote_id: string
          sort_order?: number
          teeth?: string[] | null
          treatment: string
          unit_price: number
          updated_at?: string
        }
        Update: {
          amount?: number | null
          clinic_id?: string
          created_at?: string
          faces?: string[] | null
          id?: string
          insurance_id?: string | null
          multiply_per_tooth?: boolean
          professional_id?: string | null
          quote_id?: string
          sort_order?: number
          teeth?: string[] | null
          treatment?: string
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_item_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_item_insurance_fk"
            columns: ["insurance_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "insurance"
            referencedColumns: ["id", "clinic_id"]
          },
          {
            foreignKeyName: "quote_item_professional_fk"
            columns: ["professional_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "professional"
            referencedColumns: ["id", "clinic_id"]
          },
          {
            foreignKeyName: "quote_item_professional_fk"
            columns: ["professional_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "professional_directory"
            referencedColumns: ["id", "clinic_id"]
          },
          {
            foreignKeyName: "quote_item_quote_fk"
            columns: ["quote_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "quote"
            referencedColumns: ["id", "clinic_id"]
          },
        ]
      }
      receivable: {
        Row: {
          acquirer_id: string | null
          auto_settle_blocked: boolean
          bank_account_id: string | null
          clinic_id: string
          code: string
          created_at: string
          debtor: Database["public"]["Enums"]["receivable_debtor"] | null
          description: string
          due_date: string
          fee: number
          gross_amount: number
          id: string
          installment_count: number | null
          installment_number: number | null
          method: Database["public"]["Enums"]["payment_method"] | null
          net_amount: number | null
          notes: string | null
          open_amount: number | null
          patient_id: string | null
          plan_line: number | null
          quote_id: string | null
          received_amount: number
          received_at: string | null
          source: string
          status: Database["public"]["Enums"]["payment_status"]
          treatment_session_id: string | null
          updated_at: string
        }
        Insert: {
          acquirer_id?: string | null
          auto_settle_blocked?: boolean
          bank_account_id?: string | null
          clinic_id: string
          code: string
          created_at?: string
          debtor?: Database["public"]["Enums"]["receivable_debtor"] | null
          description: string
          due_date: string
          fee?: number
          gross_amount: number
          id?: string
          installment_count?: number | null
          installment_number?: number | null
          method?: Database["public"]["Enums"]["payment_method"] | null
          net_amount?: number | null
          notes?: string | null
          open_amount?: number | null
          patient_id?: string | null
          plan_line?: number | null
          quote_id?: string | null
          received_amount?: number
          received_at?: string | null
          source: string
          status?: Database["public"]["Enums"]["payment_status"]
          treatment_session_id?: string | null
          updated_at?: string
        }
        Update: {
          acquirer_id?: string | null
          auto_settle_blocked?: boolean
          bank_account_id?: string | null
          clinic_id?: string
          code?: string
          created_at?: string
          debtor?: Database["public"]["Enums"]["receivable_debtor"] | null
          description?: string
          due_date?: string
          fee?: number
          gross_amount?: number
          id?: string
          installment_count?: number | null
          installment_number?: number | null
          method?: Database["public"]["Enums"]["payment_method"] | null
          net_amount?: number | null
          notes?: string | null
          open_amount?: number | null
          patient_id?: string | null
          plan_line?: number | null
          quote_id?: string | null
          received_amount?: number
          received_at?: string | null
          source?: string
          status?: Database["public"]["Enums"]["payment_status"]
          treatment_session_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "receivable_acquirer_fk"
            columns: ["acquirer_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "acquirer"
            referencedColumns: ["id", "clinic_id"]
          },
          {
            foreignKeyName: "receivable_bank_account_fk"
            columns: ["bank_account_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "bank_account"
            referencedColumns: ["id", "clinic_id"]
          },
          {
            foreignKeyName: "receivable_bank_account_fk"
            columns: ["bank_account_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "bank_account_balance"
            referencedColumns: ["bank_account_id", "clinic_id"]
          },
          {
            foreignKeyName: "receivable_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receivable_patient_fk"
            columns: ["patient_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "patient"
            referencedColumns: ["id", "clinic_id"]
          },
          {
            foreignKeyName: "receivable_quote_fk"
            columns: ["quote_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "quote"
            referencedColumns: ["id", "clinic_id"]
          },
          {
            foreignKeyName: "receivable_session_fk"
            columns: ["treatment_session_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "treatment_session"
            referencedColumns: ["id", "clinic_id"]
          },
        ]
      }
      room: {
        Row: {
          clinic_id: string
          created_at: string
          id: string
          name: string
          photo_url: string | null
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          id?: string
          name: string
          photo_url?: string | null
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          id?: string
          name?: string
          photo_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_slot: {
        Row: {
          activity: string
          clinic_id: string
          color: string | null
          created_at: string
          end_time: string
          id: string
          notes: string | null
          patient_id: string
          professional_id: string
          room_id: string | null
          send_confirmation: boolean
          start_time: string
          status: Database["public"]["Enums"]["schedule_slot_status"]
          updated_at: string
          weekday: number
        }
        Insert: {
          activity: string
          clinic_id: string
          color?: string | null
          created_at?: string
          end_time: string
          id?: string
          notes?: string | null
          patient_id: string
          professional_id: string
          room_id?: string | null
          send_confirmation?: boolean
          start_time: string
          status?: Database["public"]["Enums"]["schedule_slot_status"]
          updated_at?: string
          weekday: number
        }
        Update: {
          activity?: string
          clinic_id?: string
          color?: string | null
          created_at?: string
          end_time?: string
          id?: string
          notes?: string | null
          patient_id?: string
          professional_id?: string
          room_id?: string | null
          send_confirmation?: boolean
          start_time?: string
          status?: Database["public"]["Enums"]["schedule_slot_status"]
          updated_at?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "schedule_slot_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_slot_patient_fk"
            columns: ["patient_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "patient"
            referencedColumns: ["id", "clinic_id"]
          },
          {
            foreignKeyName: "schedule_slot_professional_fk"
            columns: ["professional_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "professional"
            referencedColumns: ["id", "clinic_id"]
          },
          {
            foreignKeyName: "schedule_slot_professional_fk"
            columns: ["professional_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "professional_directory"
            referencedColumns: ["id", "clinic_id"]
          },
          {
            foreignKeyName: "schedule_slot_room_fk"
            columns: ["room_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "room"
            referencedColumns: ["id", "clinic_id"]
          },
        ]
      }
      subscription: {
        Row: {
          amount: number
          canceled_at: string | null
          clinic_id: string
          created_at: string
          cycle: Database["public"]["Enums"]["billing_cycle"]
          gateway: string | null
          gateway_customer_id: string | null
          gateway_subscription_id: string | null
          id: string
          next_billing_date: string
          notes: string | null
          payment_method_label: string | null
          started_at: string
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          canceled_at?: string | null
          clinic_id: string
          created_at?: string
          cycle?: Database["public"]["Enums"]["billing_cycle"]
          gateway?: string | null
          gateway_customer_id?: string | null
          gateway_subscription_id?: string | null
          id?: string
          next_billing_date: string
          notes?: string | null
          payment_method_label?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          canceled_at?: string | null
          clinic_id?: string
          created_at?: string
          cycle?: Database["public"]["Enums"]["billing_cycle"]
          gateway?: string | null
          gateway_customer_id?: string | null
          gateway_subscription_id?: string | null
          id?: string
          next_billing_date?: string
          notes?: string | null
          payment_method_label?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: true
            referencedRelation: "clinic"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_invoice: {
        Row: {
          amount: number
          clinic_id: string
          code: string
          created_at: string
          due_date: string
          gateway: string | null
          gateway_invoice_id: string | null
          id: string
          invoice_url: string | null
          paid_at: string | null
          payment_method_label: string | null
          plan_key: string | null
          reference_month: string
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          clinic_id: string
          code: string
          created_at?: string
          due_date: string
          gateway?: string | null
          gateway_invoice_id?: string | null
          id?: string
          invoice_url?: string | null
          paid_at?: string | null
          payment_method_label?: string | null
          plan_key?: string | null
          reference_month: string
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          clinic_id?: string
          code?: string
          created_at?: string
          due_date?: string
          gateway?: string | null
          gateway_invoice_id?: string | null
          id?: string
          invoice_url?: string | null
          paid_at?: string | null
          payment_method_label?: string | null
          plan_key?: string | null
          reference_month?: string
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_invoice_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_invoice_plan_key_fkey"
            columns: ["plan_key"]
            isOneToOne: false
            referencedRelation: "plan"
            referencedColumns: ["key"]
          },
        ]
      }
      task: {
        Row: {
          clinic_id: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          due_date: string | null
          id: string
          priority: Database["public"]["Enums"]["task_priority"]
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          clinic_id: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment: {
        Row: {
          clinic_id: string
          completed_at: string | null
          created_at: string
          id: string
          notes: string | null
          patient_id: string
          procedure: string
          started_at: string
          status: Database["public"]["Enums"]["tooth_status"]
          updated_at: string
        }
        Insert: {
          clinic_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          patient_id: string
          procedure: string
          started_at?: string
          status?: Database["public"]["Enums"]["tooth_status"]
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          patient_id?: string
          procedure?: string
          started_at?: string
          status?: Database["public"]["Enums"]["tooth_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatment_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_patient_fk"
            columns: ["patient_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "patient"
            referencedColumns: ["id", "clinic_id"]
          },
        ]
      }
      treatment_session: {
        Row: {
          amount: number | null
          billing_status: Database["public"]["Enums"]["session_billing_status"]
          client_token: string | null
          clinic_id: string
          created_at: string
          description: string | null
          id: string
          not_billable_reason: string | null
          notes: string | null
          performed_on: string
          professional_id: string | null
          quote_id: string | null
          quote_item_id: string | null
          receivable_id: string | null
          treatment_id: string
          updated_at: string
        }
        Insert: {
          amount?: number | null
          billing_status?: Database["public"]["Enums"]["session_billing_status"]
          client_token?: string | null
          clinic_id: string
          created_at?: string
          description?: string | null
          id?: string
          not_billable_reason?: string | null
          notes?: string | null
          performed_on: string
          professional_id?: string | null
          quote_id?: string | null
          quote_item_id?: string | null
          receivable_id?: string | null
          treatment_id: string
          updated_at?: string
        }
        Update: {
          amount?: number | null
          billing_status?: Database["public"]["Enums"]["session_billing_status"]
          client_token?: string | null
          clinic_id?: string
          created_at?: string
          description?: string | null
          id?: string
          not_billable_reason?: string | null
          notes?: string | null
          performed_on?: string
          professional_id?: string | null
          quote_id?: string | null
          quote_item_id?: string | null
          receivable_id?: string | null
          treatment_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatment_session_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_session_professional_fk"
            columns: ["professional_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "professional"
            referencedColumns: ["id", "clinic_id"]
          },
          {
            foreignKeyName: "treatment_session_professional_fk"
            columns: ["professional_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "professional_directory"
            referencedColumns: ["id", "clinic_id"]
          },
          {
            foreignKeyName: "treatment_session_quote_fk"
            columns: ["quote_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "quote"
            referencedColumns: ["id", "clinic_id"]
          },
          {
            foreignKeyName: "treatment_session_quote_item_fk"
            columns: ["quote_item_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "quote_item"
            referencedColumns: ["id", "clinic_id"]
          },
          {
            foreignKeyName: "treatment_session_receivable_fk"
            columns: ["receivable_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "receivable"
            referencedColumns: ["id", "clinic_id"]
          },
          {
            foreignKeyName: "treatment_session_treatment_fk"
            columns: ["treatment_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "treatment"
            referencedColumns: ["id", "clinic_id"]
          },
        ]
      }
      treatment_session_action: {
        Row: {
          clinic_id: string
          created_at: string
          description: string
          id: string
          session_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          description: string
          id?: string
          session_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          description?: string
          id?: string
          session_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatment_session_action_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_session_action_session_fk"
            columns: ["session_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "treatment_session"
            referencedColumns: ["id", "clinic_id"]
          },
        ]
      }
      treatment_session_material: {
        Row: {
          clinic_id: string
          created_at: string
          id: string
          material_id: string | null
          name: string
          quantity: string
          session_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          id?: string
          material_id?: string | null
          name: string
          quantity: string
          session_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          id?: string
          material_id?: string | null
          name?: string
          quantity?: string
          session_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatment_session_material_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_session_material_material_fk"
            columns: ["material_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "material"
            referencedColumns: ["id", "clinic_id"]
          },
          {
            foreignKeyName: "treatment_session_material_session_fk"
            columns: ["session_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "treatment_session"
            referencedColumns: ["id", "clinic_id"]
          },
        ]
      }
      treatment_session_odontogram: {
        Row: {
          clinic_id: string
          created_at: string
          id: string
          payload: Json
          session_id: string
          updated_at: string
          version: string | null
        }
        Insert: {
          clinic_id: string
          created_at?: string
          id?: string
          payload: Json
          session_id: string
          updated_at?: string
          version?: string | null
        }
        Update: {
          clinic_id?: string
          created_at?: string
          id?: string
          payload?: Json
          session_id?: string
          updated_at?: string
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "treatment_session_odontogram_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_session_odontogram_session_fk"
            columns: ["session_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "treatment_session"
            referencedColumns: ["id", "clinic_id"]
          },
        ]
      }
      treatment_session_tooth: {
        Row: {
          clinic_id: string
          created_at: string
          id: string
          session_id: string
          tooth_fdi: string
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          id?: string
          session_id: string
          tooth_fdi: string
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          id?: string
          session_id?: string
          tooth_fdi?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatment_session_tooth_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_session_tooth_session_fk"
            columns: ["session_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "treatment_session"
            referencedColumns: ["id", "clinic_id"]
          },
        ]
      }
      treatment_tooth: {
        Row: {
          clinic_id: string
          created_at: string
          id: string
          tooth_fdi: string
          treatment_id: string
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          id?: string
          tooth_fdi: string
          treatment_id: string
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          id?: string
          tooth_fdi?: string
          treatment_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatment_tooth_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_tooth_treatment_fk"
            columns: ["treatment_id", "clinic_id"]
            isOneToOne: false
            referencedRelation: "treatment"
            referencedColumns: ["id", "clinic_id"]
          },
        ]
      }
      whatsapp_automation: {
        Row: {
          clinic_id: string
          created_at: string
          id: string
          message: string
          send_time: string | null
          status: Database["public"]["Enums"]["active_status"]
          trigger: Database["public"]["Enums"]["automation_trigger"]
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          id?: string
          message: string
          send_time?: string | null
          status?: Database["public"]["Enums"]["active_status"]
          trigger: Database["public"]["Enums"]["automation_trigger"]
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          id?: string
          message?: string
          send_time?: string | null
          status?: Database["public"]["Enums"]["active_status"]
          trigger?: Database["public"]["Enums"]["automation_trigger"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_automation_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_connection: {
        Row: {
          clinic_id: string
          connected_at: string | null
          created_at: string
          id: string
          last_error: string | null
          phone_number: string | null
          provider: string | null
          qr_code: string | null
          qr_expires_at: string | null
          session_ref: string | null
          status: Database["public"]["Enums"]["whatsapp_status"]
          updated_at: string
        }
        Insert: {
          clinic_id: string
          connected_at?: string | null
          created_at?: string
          id?: string
          last_error?: string | null
          phone_number?: string | null
          provider?: string | null
          qr_code?: string | null
          qr_expires_at?: string | null
          session_ref?: string | null
          status?: Database["public"]["Enums"]["whatsapp_status"]
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          connected_at?: string | null
          created_at?: string
          id?: string
          last_error?: string | null
          phone_number?: string | null
          provider?: string | null
          qr_code?: string | null
          qr_expires_at?: string | null
          session_ref?: string | null
          status?: Database["public"]["Enums"]["whatsapp_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_connection_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: true
            referencedRelation: "clinic"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      bank_account_balance: {
        Row: {
          bank_account_id: string | null
          clinic_id: string | null
          current_balance: number | null
          name: string | null
          opening_balance: number | null
          status: Database["public"]["Enums"]["active_status"] | null
        }
        Insert: {
          bank_account_id?: string | null
          clinic_id?: string | null
          current_balance?: never
          name?: string | null
          opening_balance?: number | null
          status?: Database["public"]["Enums"]["active_status"] | null
        }
        Update: {
          bank_account_id?: string | null
          clinic_id?: string | null
          current_balance?: never
          name?: string | null
          opening_balance?: number | null
          status?: Database["public"]["Enums"]["active_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_account_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_flow_day: {
        Row: {
          clinic_id: string | null
          day: string | null
          entry_count: number | null
          inflows: number | null
          net_amount: number | null
          outflows: number | null
        }
        Relationships: []
      }
      professional_directory: {
        Row: {
          clinic_id: string | null
          color: string | null
          id: string | null
          name: string | null
          specialty: string | null
          status: Database["public"]["Enums"]["active_status"] | null
        }
        Insert: {
          clinic_id?: string | null
          color?: string | null
          id?: string | null
          name?: string | null
          specialty?: string | null
          status?: Database["public"]["Enums"]["active_status"] | null
        }
        Update: {
          clinic_id?: string | null
          color?: string | null
          id?: string | null
          name?: string | null
          specialty?: string | null
          status?: Database["public"]["Enums"]["active_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "professional_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic"
            referencedColumns: ["id"]
          },
        ]
      }
      role: {
        Row: {
          clinic_id: string | null
          id: string | null
          name: string | null
          pages: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "access_profile_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      appointment_series: {
        Args: { p_month_iso?: string; p_period: string }
        Returns: {
          label: string
          value: number
        }[]
      }
      approve_quote: {
        Args: { p_plan?: Json; p_quote: string }
        Returns: number
      }
      archive_anamnesis: { Args: { p_patient: string }; Returns: string }
      bill_treatment_session: {
        Args: {
          p_acquirer?: string
          p_charge_anyway?: boolean
          p_due_date?: string
          p_installments?: number
          p_method?: Database["public"]["Enums"]["payment_method"]
          p_not_billable_reason?: string
          p_session: string
        }
        Returns: Database["public"]["Enums"]["session_billing_status"]
      }
      cash_flow: { Args: { p_days?: number }; Returns: Json }
      convert_lead_to_patient: { Args: { p_lead: string }; Returns: Json }
      dashboard_stats: { Args: never; Returns: Json }
      dashboard_stats_period: {
        Args: {
          p_from: string
          p_prev_from: string
          p_prev_to: string
          p_to: string
        }
        Returns: Json
      }
      finance_series: {
        Args: { p_month_iso?: string; p_period: string }
        Returns: {
          expenses: number
          income: number
          label: string
        }[]
      }
      is_clinic_admin: { Args: { p_clinic: string }; Returns: boolean }
      link_professional_user: {
        Args: { p_professional: string; p_user: string }
        Returns: undefined
      }
      list_audit_log: {
        Args: {
          p_action?: Database["public"]["Enums"]["audit_action"]
          p_actor?: string
          p_before_at?: string
          p_before_id?: string
          p_clinic: string
          p_from?: string
          p_limit?: number
          p_search?: string
          p_table?: string
          p_to?: string
        }
        Returns: {
          action: Database["public"]["Enums"]["audit_action"]
          actor_id: string
          actor_name: string
          changed_fields: string[]
          created_at: string
          id: string
          new_data: Json
          old_data: Json
          record_id: string
          record_label: string
          table_name: string
        }[]
      }
      list_clinic_staff: {
        Args: { p_clinic: string }
        Returns: {
          access_profile_id: string
          avatar_url: string
          birth_date: string
          cep: string
          city: string
          clinic_user_id: string
          email: string
          full_name: string
          neighborhood: string
          number: string
          phone: string
          role_name: string
          sex: Database["public"]["Enums"]["gender"]
          state: string
          status: Database["public"]["Enums"]["membership_status"]
          user_id: string
          whatsapp: string
        }[]
      }
      list_lead_history: {
        Args: { p_lead: string }
        Returns: {
          action: Database["public"]["Enums"]["audit_action"]
          actor_name: string
          changed_fields: string[]
          created_at: string
          id: string
          new_data: Json
          old_data: Json
        }[]
      }
      my_session: { Args: { p_clinic?: string }; Returns: Json }
      my_subscription: { Args: { p_clinic?: string }; Returns: Json }
      next_code: {
        Args: { p_clinic: string; p_key: string; p_prefix: string }
        Returns: string
      }
      patient_anamnesis: { Args: { p_patient: string }; Returns: Json }
      patient_anamnesis_history: { Args: { p_patient: string }; Returns: Json }
      patient_treatments: { Args: { p_patient: string }; Returns: Json }
      preview_session_billing: {
        Args: {
          p_acquirer?: string
          p_amount?: number
          p_due_date?: string
          p_installments?: number
          p_method?: Database["public"]["Enums"]["payment_method"]
          p_not_billable_reason?: string
          p_patient: string
          p_performed_on?: string
        }
        Returns: Json
      }
      professional_conflicts: {
        Args: {
          p_ends: string
          p_ignore?: string
          p_professional: string
          p_starts: string
        }
        Returns: {
          date: string
          duration_minutes: number
          ends_at: string
          id: string
          patient_id: string
          patient_name: string
          room_id: string
          room_name: string
          service: string
          start_time: string
          starts_at: string
          status: Database["public"]["Enums"]["appointment_status"]
        }[]
      }
      professional_earnings: {
        Args: { p_professional: string }
        Returns: {
          amount: number
          billing_status: Database["public"]["Enums"]["session_billing_status"]
          description: string
          patient_id: string
          patient_name: string
          performed_on: string
          received_amount: number
          session_id: string
        }[]
      }
      professional_quote_conversion: {
        Args: { p_month_iso: string }
        Returns: {
          converted: number
          name: string
          photo_url: string
          professional_id: string
          quoted: number
        }[]
      }
      professional_slot_conflicts: {
        Args: {
          p_end: string
          p_ignore?: string
          p_professional: string
          p_start: string
          p_weekday: number
        }
        Returns: {
          activity: string
          end_time: string
          id: string
          patient_id: string
          patient_name: string
          room_id: string
          room_name: string
          start_time: string
          weekday: number
        }[]
      }
      professionals_in_use: { Args: { p_clinic?: string }; Returns: number }
      record_treatment_session: {
        Args: {
          p_acquirer?: string
          p_actions?: string[]
          p_amount?: unknown
          p_client_token?: string
          p_description?: string
          p_due_date?: string
          p_installments?: number
          p_materials?: Json
          p_method?: Database["public"]["Enums"]["payment_method"]
          p_not_billable_reason?: string
          p_notes?: string
          p_odontogram?: Json
          p_performed_on: string
          p_professional?: string
          p_status_after: Database["public"]["Enums"]["tooth_status"]
          p_teeth?: string[]
          p_treatment: string
        }
        Returns: string
      }
      save_anamnesis: {
        Args: { p_answers: Json; p_patient: string }
        Returns: string
      }
      set_clinic_goals_year: {
        Args: { p_clinic: string; p_goals: Json; p_year: number }
        Returns: undefined
      }
      set_collaborator: {
        Args: {
          p_access_profile?: string
          p_clinic_user: string
          p_status?: Database["public"]["Enums"]["membership_status"]
        }
        Returns: undefined
      }
      set_technical_manager: {
        Args: { p_professional: string }
        Returns: undefined
      }
      settle_receivable: {
        Args: {
          p_amount: number
          p_bank?: string
          p_date: string
          p_id: string
          p_method?: Database["public"]["Enums"]["payment_method"]
          p_notes?: string
        }
        Returns: undefined
      }
      unbilled_sessions: {
        Args: never
        Returns: {
          amount: number
          clinic_id: string
          description: string
          has_insurance: boolean
          id: string
          patient_id: string
          patient_name: string
          pending_quote_code: string
          performed_on: string
          professional_id: string
          treatment_id: string
          treatment_name: string
        }[]
      }
    }
    Enums: {
      active_status: "active" | "inactive"
      anamnesis_input_type: "options" | "text" | "longText"
      anamnesis_status: "active" | "archived"
      appointment_status:
        | "scheduled"
        | "confirmed"
        | "in_service"
        | "completed"
        | "canceled"
        | "no_show"
      audit_action: "insert" | "update" | "delete"
      automation_trigger:
        | "after_booking"
        | "appointment_day"
        | "no_show"
        | "birthday"
        | "billing"
      bank_account_type: "checking" | "savings" | "cash"
      billing_cycle: "monthly" | "yearly"
      cash_movement_type: "inflow" | "outflow"
      clinic_specialty:
        | "dentistry"
        | "physiotherapy"
        | "nutrition"
        | "psychology"
        | "personal_training"
      clinic_status: "active" | "suspended" | "canceled"
      collection_channel: "whatsapp" | "phone" | "email"
      commission_base: "received" | "performed"
      commission_payout: "fixed_day" | "per_visit"
      commission_type: "percentage" | "fixed"
      gender: "male" | "female"
      goal_metric:
        | "appointments_scheduled"
        | "appointments_completed"
        | "revenue"
        | "expenses"
      lead_status: "new" | "negotiating" | "scheduling" | "converted" | "lost"
      membership_status: "invited" | "active" | "suspended"
      payment_method:
        | "cash"
        | "credit"
        | "debit"
        | "boleto"
        | "check"
        | "pix"
        | "wire"
      payment_status: "paid" | "pending" | "overdue" | "canceled"
      prescription_type:
        | "prescription"
        | "clinical_record"
        | "certificate"
        | "document"
      quote_status: "pending" | "approved"
      receivable_debtor: "payer" | "acquirer"
      schedule_slot_status: "active" | "canceled"
      session_billing_status: "unbilled" | "billed" | "covered" | "not_billable"
      subscription_status: "active" | "past_due" | "canceled"
      task_priority: "high" | "medium" | "low"
      task_status: "todo" | "in_progress" | "done"
      tooth_status: "open" | "finished" | "extracted"
      whatsapp_status: "connected" | "disconnected" | "connecting"
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
    Enums: {
      active_status: ["active", "inactive"],
      anamnesis_input_type: ["options", "text", "longText"],
      anamnesis_status: ["active", "archived"],
      appointment_status: [
        "scheduled",
        "confirmed",
        "in_service",
        "completed",
        "canceled",
        "no_show",
      ],
      audit_action: ["insert", "update", "delete"],
      automation_trigger: [
        "after_booking",
        "appointment_day",
        "no_show",
        "birthday",
        "billing",
      ],
      bank_account_type: ["checking", "savings", "cash"],
      billing_cycle: ["monthly", "yearly"],
      cash_movement_type: ["inflow", "outflow"],
      clinic_specialty: [
        "dentistry",
        "physiotherapy",
        "nutrition",
        "psychology",
        "personal_training",
      ],
      clinic_status: ["active", "suspended", "canceled"],
      collection_channel: ["whatsapp", "phone", "email"],
      commission_base: ["received", "performed"],
      commission_payout: ["fixed_day", "per_visit"],
      commission_type: ["percentage", "fixed"],
      gender: ["male", "female"],
      goal_metric: [
        "appointments_scheduled",
        "appointments_completed",
        "revenue",
        "expenses",
      ],
      lead_status: ["new", "negotiating", "scheduling", "converted", "lost"],
      membership_status: ["invited", "active", "suspended"],
      payment_method: [
        "cash",
        "credit",
        "debit",
        "boleto",
        "check",
        "pix",
        "wire",
      ],
      payment_status: ["paid", "pending", "overdue", "canceled"],
      prescription_type: [
        "prescription",
        "clinical_record",
        "certificate",
        "document",
      ],
      quote_status: ["pending", "approved"],
      receivable_debtor: ["payer", "acquirer"],
      schedule_slot_status: ["active", "canceled"],
      session_billing_status: ["unbilled", "billed", "covered", "not_billable"],
      subscription_status: ["active", "past_due", "canceled"],
      task_priority: ["high", "medium", "low"],
      task_status: ["todo", "in_progress", "done"],
      tooth_status: ["open", "finished", "extracted"],
      whatsapp_status: ["connected", "disconnected", "connecting"],
    },
  },
} as const
