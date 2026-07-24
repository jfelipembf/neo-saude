-- ═════════════════════════════════════════════════════════════════════════════
-- NEO SAÚDE — MODOS "LINHA" E "DISTÂNCIA" NO GONIÔMETRO DIGITAL
--
-- O goniômetro digital (physio_test.kind) deixa de ser só ângulo (3 pontos) e
-- ganha mais dois modos, todos sobre a MESMA foto + pontos arrastáveis:
--   · line     = 2 pontos, 1 linha, sem medida (referência/alinhamento visual —
--                ex.: avaliação postural).
--   · distance = 2 pontos, 1 linha, com a distância entre eles (ex.:
--                perimetria, comprimento de membro).
--   · goniometry (já existe) = 3 pontos, ângulo entre os dois segmentos.
--
-- ADD VALUE de enum não pode ser usado na MESMA transação em que é criado —
-- por isso este arquivo só cria os valores; as colunas/seeds que os usam vêm
-- em migrations seguintes.
-- ═════════════════════════════════════════════════════════════════════════════

alter type public.physio_test_kind add value 'line';
alter type public.physio_test_kind add value 'distance';
