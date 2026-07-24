# utils/

Funções puras sem dependência de React/Supabase (datas, máscaras, formatação).

Regras:
- Sem estado, sem side effects — entra valor, sai valor.
- Nomes em inglês, 1 arquivo por tema (não 1 por função): `date.ts`, `text.ts`,
  `format.ts`…
- Se a função depende do Supabase ou de contexto, ela NÃO pertence aqui
  (vai para services/ ou hooks/).
