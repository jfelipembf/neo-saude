import type { Database } from '@/types/database.types'

/** Atalhos de tipos do schema público gerado (database.types.ts). */
export type Tables = Database['public']['Tables']
export type Row<T extends keyof Tables> = Tables[T]['Row']
export type Insert<T extends keyof Tables> = Tables[T]['Insert']
export type Update<T extends keyof Tables> = Tables[T]['Update']

/**
 * Insert do lado do CLIENTE: a coluna `code` é NOT NULL sem default no banco,
 * mas quem a preenche é o trigger `tr_code` (BEFORE INSERT). Os tipos gerados
 * não enxergam triggers e a marcam como obrigatória — então a removemos aqui.
 * O objeto continua checado contra as demais colunas; na chamada faz-se
 * `row as Insert<'tabela'>` para reintroduzir o campo gerido pelo banco.
 */
export type ClientInsert<T extends keyof Tables> = Omit<Insert<T>, 'code'>
