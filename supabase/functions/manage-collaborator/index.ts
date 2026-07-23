import { createClient } from 'jsr:@supabase/supabase-js@2'

// CRIA/GERENCIA colaboradores (logins) da clínica. Usa service_role (só no
// servidor) para criar a conta no GoTrue e vincular em clinic_user com o cargo.
// O contratante define a senha; a conta nasce confirmada (login imediato).

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Método não permitido.' }, 405)

  const url = Deno.env.get('SUPABASE_URL')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  const authHeader = req.headers.get('Authorization') ?? ''
  // Cliente do CHAMADOR (com o JWT dele) — só para saber quem é e checar admin.
  const caller = createClient(url, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data: { user }, error: userErr } = await caller.auth.getUser()
  if (userErr || !user) return json({ error: 'Sessão inválida.' }, 401)

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return json({ error: 'JSON inválido.' }, 400) }

  const action = String(body.action ?? '')
  const clinicId = String(body.clinicId ?? '')
  if (!clinicId) return json({ error: 'Clínica não informada.' }, 400)

  // Toda ação exige que o chamador seja ADMIN da clínica.
  const { data: isAdmin, error: adminErr } = await caller.rpc('is_clinic_admin', { p_clinic: clinicId })
  if (adminErr) return json({ error: adminErr.message }, 500)
  if (!isAdmin) return json({ error: 'Sem permissão de administrador nesta clínica.' }, 403)

  // Cliente ADMIN (service_role) — operações privilegiadas.
  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  if (action === 'create') {
    const email = String(body.email ?? '').trim().toLowerCase()
    const password = String(body.password ?? '')
    const fullName = String(body.fullName ?? '').trim()
    const accessProfileId = String(body.accessProfileId ?? '')
    const phone = String(body.phone ?? '').trim()
    // Cadastro completo (sexo, nascimento, WhatsApp, endereço) — opcional campo
    // a campo; gravado em clinic_user (dado da CLÍNICA sobre o funcionário).
    const details = (typeof body.details === 'object' && body.details !== null ? body.details : {}) as Record<string, unknown>
    const str = (v: unknown) => { const s = String(v ?? '').trim(); return s || null }
    if (!email || !password || !accessProfileId) return json({ error: 'Preencha e-mail, senha e cargo.' }, 400)
    if (password.length < 6) return json({ error: 'A senha deve ter ao menos 6 caracteres.' }, 400)

    // Cargo tem de pertencer à clínica e NÃO pode ser um cargo de sistema
    // (ex.: "Administrador"/proprietário) — evita criar um dono paralelo.
    const { data: role } = await admin.from('access_profile')
      .select('id, is_system').eq('id', accessProfileId).eq('clinic_id', clinicId).maybeSingle()
    if (!role) return json({ error: 'Cargo inválido para esta clínica.' }, 400)
    if (role.is_system) return json({ error: 'Este cargo não pode ser atribuído a um novo colaborador.' }, 400)

    // Conta já CONFIRMADA — login imediato, sem e-mail de verificação.
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email, password, email_confirm: true, user_metadata: { full_name: fullName },
    })
    if (createErr || !created?.user) {
      const msg = /already|exist/i.test(createErr?.message ?? '') ? 'Já existe um usuário com este e-mail.' : (createErr?.message ?? 'Falha ao criar a conta.')
      return json({ error: msg }, 400)
    }
    const newUserId = created.user.id

    // O trigger on_auth_user_created cria o profile; garante nome e telefone.
    if (fullName || phone) {
      await admin.from('profile').update({
        ...(fullName ? { full_name: fullName } : {}),
        ...(phone ? { phone } : {}),
      }).eq('id', newUserId)
    }

    // Vincula à clínica com o cargo, já ATIVO — e com o cadastro completo.
    const { error: linkErr } = await admin.from('clinic_user').insert({
      clinic_id: clinicId, user_id: newUserId, access_profile_id: accessProfileId,
      status: 'active', invited_by: user.id,
      sex: str(details.sex), birth_date: str(details.birthDate),
      whatsapp: str(details.whatsapp), cep: str(details.cep),
      state: str(details.state)?.toUpperCase() ?? null, city: str(details.city),
      neighborhood: str(details.neighborhood), number: str(details.number),
    })
    if (linkErr) {
      await admin.auth.admin.deleteUser(newUserId)   // não deixa conta órfã
      return json({ error: linkErr.message }, 400)
    }
    return json({ ok: true, userId: newUserId })
  }

  if (action === 'set_password') {
    const targetUserId = String(body.userId ?? '')
    const password = String(body.password ?? '')
    if (!targetUserId || password.length < 6) return json({ error: 'Dados inválidos (senha mínima de 6).' }, 400)
    // Alvo tem de ser membro DESTA clínica.
    const { data: member } = await admin.from('clinic_user')
      .select('id, is_owner').eq('clinic_id', clinicId).eq('user_id', targetUserId).maybeSingle()
    if (!member) return json({ error: 'Colaborador não pertence a esta clínica.' }, 400)
    // A senha do PROPRIETÁRIO só pode ser trocada por ele mesmo — impede que um
    // admin subordinado (ex.: Gerente) sequestre a conta do fundador.
    if (member.is_owner && targetUserId !== user.id) {
      return json({ error: 'A senha do proprietário só pode ser alterada por ele mesmo.' }, 403)
    }
    const { error } = await admin.auth.admin.updateUserById(targetUserId, { password })
    if (error) return json({ error: error.message }, 400)
    return json({ ok: true })
  }

  return json({ error: 'Ação desconhecida.' }, 400)
})
