-- Painel do quiz Vovocão: tabela de eventos + função de leitura com chave.
-- Rodar UMA vez no SQL Editor do Supabase, projeto "banco-de-ofertas" (dxybmayffxvepmwbyezc).
-- Só ADICIONA coisas (tabela quiz_eventos, tabela quiz_painel_chaves, função quiz_painel). Não mexe nas tabelas dos membros.
-- O navegador só consegue INSERIR eventos (chave pública). Ler, só pela função, com a chave do painel.

create table if not exists public.quiz_eventos (
  id bigserial primary key,
  criado_em timestamptz not null default now(),
  quiz text not null,
  variante text,
  sid text not null,
  tipo text not null,
  etapa text,
  ordem int,
  resposta text,
  ms int,
  dispositivo text,
  pais text,
  utm_source text, utm_medium text, utm_campaign text, utm_content text, utm_term text
);
create index if not exists quiz_eventos_quiz_data on public.quiz_eventos (quiz, criado_em);
create index if not exists quiz_eventos_sid on public.quiz_eventos (sid);
alter table public.quiz_eventos enable row level security;

drop policy if exists quiz_eventos_insere on public.quiz_eventos;
create policy quiz_eventos_insere on public.quiz_eventos for insert to anon
  with check (length(quiz) <= 40 and length(sid) <= 40 and length(tipo) <= 30
    and coalesce(length(etapa),0) <= 60 and coalesce(length(resposta),0) <= 300);
grant insert on public.quiz_eventos to anon;
grant usage, select on sequence public.quiz_eventos_id_seq to anon;

create table if not exists public.quiz_painel_chaves (quiz text primary key, chave text not null);
alter table public.quiz_painel_chaves enable row level security;
insert into public.quiz_painel_chaves (quiz, chave) values ('vovocao', 'TROQUE-PELA-CHAVE-DO-PAINEL')
  on conflict (quiz) do update set chave = excluded.chave;

create or replace function public.quiz_painel(p_quiz text, p_chave text, p_desde timestamptz default now() - interval '7 days', p_variante text default null)
returns json language plpgsql security definer set search_path = public as $$
declare r json;
begin
  if not exists (select 1 from quiz_painel_chaves where quiz = p_quiz and chave = p_chave) then
    raise exception 'chave invalida';
  end if;
  with ev as (
    select * from quiz_eventos where quiz = p_quiz and criado_em >= p_desde and (p_variante is null or variante = p_variante)
  ),
  etapas as (
    select etapa, min(ordem) as ordem, count(distinct sid) as sessoes,
           round((percentile_cont(0.5) within group (order by ms) filter (where tipo = 'resposta'))::numeric / 1000, 1) as seg_mediana
    from ev where tipo in ('etapa','resposta') and etapa is not null group by etapa
  ),
  respostas as (
    select etapa, resposta, count(distinct sid) as sessoes from ev where tipo = 'resposta' and resposta is not null group by etapa, resposta
  ),
  variantes as (
    select coalesce(variante,'-') as variante,
           count(distinct sid) filter (where tipo = 'inicio') as comecaram,
           count(distinct sid) filter (where tipo = 'radar') as radar,
           count(distinct sid) filter (where tipo = 'carga_fim') as vsl_90,
           count(distinct sid) filter (where tipo = 'oferta') as oferta,
           count(distinct sid) filter (where tipo = 'checkout_clique') as checkout
    from ev group by 1
  ),
  criativos as (
    select coalesce(utm_content,'(sem utm)') as criativo,
           count(distinct sid) as sessoes,
           count(distinct sid) filter (where tipo = 'inicio') as comecaram,
           count(distinct sid) filter (where tipo = 'oferta') as oferta,
           count(distinct sid) filter (where tipo = 'checkout_clique') as checkout
    from ev group by 1 order by 2 desc limit 30
  ),
  dias as (
    select to_char(d, 'DD/MM') as dia, sessoes, checkout from (
      select date_trunc('day', criado_em at time zone 'America/Sao_Paulo') as d,
             count(distinct sid) as sessoes,
             count(distinct sid) filter (where tipo = 'checkout_clique') as checkout
      from ev group by 1) z order by d
  )
  select json_build_object(
    'total_sessoes', (select count(distinct sid) from ev),
    'etapas', (select coalesce(json_agg(e order by e.ordem nulls last, e.sessoes desc), '[]') from etapas e),
    'respostas', (select coalesce(json_agg(x order by x.etapa, x.sessoes desc), '[]') from respostas x),
    'variantes', (select coalesce(json_agg(v order by v.variante), '[]') from variantes v),
    'criativos', (select coalesce(json_agg(c), '[]') from criativos c),
    'dias', (select coalesce(json_agg(d), '[]') from dias d),
    'dispositivos', (select coalesce(json_object_agg(coalesce(dispositivo,'?'), n), '{}') from (select dispositivo, count(distinct sid) n from ev group by 1) z)
  ) into r;
  return r;
end $$;
revoke all on function public.quiz_painel(text, text, timestamptz, text) from public;
grant execute on function public.quiz_painel(text, text, timestamptz, text) to anon;
