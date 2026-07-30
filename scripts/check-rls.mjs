#!/usr/bin/env node
/**
 * PORTÃO DE RLS — reprova o build quando o banco afrouxa.
 *
 * É o único controle da auditoria (docs/arquitetura-e-seguranca.md) que não
 * depende de ninguém lembrar de nada. Os outros achados foram corrigidos uma
 * vez; este impede que voltem.
 *
 * As quatro checagens vivem na RPC `security_audit()`, no banco — não aqui.
 * Assim a mesma verificação serve ao CI e a quem estiver com o SQL aberto, sem
 * duas implementações que divergem. Este arquivo só decide o código de saída.
 *
 * Uma delas merece nota: em Postgres a função nasce com EXECUTE para PUBLIC, e
 * `revoke ... from anon` NÃO resolve, porque anon herda de PUBLIC. Esse caso
 * passou por duas revisões nesta base antes de ser pego.
 *
 * Precisa de SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (segredos de CI — a
 * chave de serviço NUNCA vai no .env do app: o Vite empacota `VITE_*`). Sem
 * elas SAI EM SUCESSO com aviso: portão que quebra o CI de quem não tem
 * credencial é portão que alguém desliga.
 *
 *   node scripts/check-rls.mjs
 */
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.warn('⚠ SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY ausentes — checagem de RLS PULADA.')
  process.exit(0)
}

const supabase = createClient(url, key, { auth: { persistSession: false } })
const { data, error } = await supabase.rpc('security_audit')

if (error) {
  console.error(`✖ Não foi possível consultar o banco: ${error.message}`)
  process.exit(1)
}

const problemas = data ?? []
if (problemas.length > 0) {
  console.error(`\n✖ ${problemas.length} problema(s) de segurança no banco:\n`)
  for (const p of problemas) console.error(`   · ${p.categoria}: ${p.objeto}`)
  console.error('\nVer docs/arquitetura-e-seguranca.md §2.1.\n')
  process.exit(1)
}

console.log('✓ RLS, policies e grants em ordem.')
