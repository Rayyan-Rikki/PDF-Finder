alter table public.questions
add column if not exists answer_options text[] not null default '{}';

alter table public.questions
add column if not exists accepted_answer_variants text[] not null default '{}';

alter table public.questions
add column if not exists grading_mode text not null default 'exact'
check (grading_mode in ('exact', 'numeric_tolerance', 'keyword_match'));

alter table public.questions
add column if not exists numeric_tolerance numeric;

alter table public.questions
add column if not exists required_keywords text[] not null default '{}';

alter table public.questions
add column if not exists minimum_keyword_matches integer;

alter table public.questions
add column if not exists source_order integer;

alter table public.questions
add column if not exists layout_hint text not null default 'unknown';

alter table public.questions
add column if not exists generation_basis text not null default 'generated_similar'
check (generation_basis in ('extracted', 'generated_similar', 'manual'));

alter table public.questions
add column if not exists style_notes text;

create or replace function public.publish_worksheet(p_worksheet_id uuid, p_questions jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if jsonb_typeof(p_questions) <> 'array' or jsonb_array_length(p_questions) = 0 then
    raise exception 'At least one question is required.';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_questions) as item
    where coalesce(trim(item ->> 'question_text'), '') = ''
       or coalesce(trim(item ->> 'answer_text'), '') = ''
  ) then
    raise exception 'Each question requires question_text and answer_text.';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_questions) as item
    where nullif(item ->> 'source_order', '') is not null
      and not (
        (item ->> 'source_order') ~ '^[0-9]+$'
        and (item ->> 'source_order')::integer > 0
      )
  ) then
    raise exception 'Source order must be a positive integer when provided.';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_questions) as item
    where coalesce(item ->> 'question_type', 'short') = 'multiple_choice'
      and (
        (
          select count(*)
          from jsonb_array_elements_text(
            case
              when jsonb_typeof(item -> 'answer_options') = 'array' then item -> 'answer_options'
              else '[]'::jsonb
            end
          ) as value
          where trim(value) <> ''
        ) < 3
        or not exists (
          select 1
          from jsonb_array_elements_text(
            case
              when jsonb_typeof(item -> 'answer_options') = 'array' then item -> 'answer_options'
              else '[]'::jsonb
            end
          ) as value
          where lower(trim(value)) = lower(trim(item ->> 'answer_text'))
        )
      )
  ) then
    raise exception 'Multiple-choice questions need at least 3 options and the answer must match one option.';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_questions) as item
    where coalesce(item ->> 'question_type', 'short') = 'true_false'
      and (
        lower(trim(item ->> 'answer_text')) not in ('true', 'false')
        or not exists (
          select 1
          from jsonb_array_elements_text(
            case
              when jsonb_typeof(item -> 'answer_options') = 'array' then item -> 'answer_options'
              else '[]'::jsonb
            end
          ) as value
          where lower(trim(value)) = 'true'
        )
        or not exists (
          select 1
          from jsonb_array_elements_text(
            case
              when jsonb_typeof(item -> 'answer_options') = 'array' then item -> 'answer_options'
              else '[]'::jsonb
            end
          ) as value
          where lower(trim(value)) = 'false'
        )
      )
  ) then
    raise exception 'True/false questions must use answer_text True or False and include both True and False options.';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_questions) as item
    where coalesce(item ->> 'grading_mode', 'exact') = 'numeric_tolerance'
      and (
        coalesce(item ->> 'question_type', 'short') <> 'short'
        or nullif(item ->> 'numeric_tolerance', '') is null
        or not (
          (item ->> 'numeric_tolerance') ~ '^-?[0-9]+(\.[0-9]+)?$'
          and (item ->> 'answer_text') ~ '^-?[0-9]+(\.[0-9]+)?$'
          and ((item ->> 'numeric_tolerance')::numeric >= 0)
        )
      )
  ) then
    raise exception 'Numeric tolerance grading requires a short-answer question with numeric answer_text and a non-negative numeric_tolerance.';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_questions) as item
    where coalesce(item ->> 'grading_mode', 'exact') = 'keyword_match'
      and (
        coalesce(item ->> 'question_type', 'short') <> 'short'
        or (
          select count(*)
          from jsonb_array_elements_text(
            case
              when jsonb_typeof(item -> 'required_keywords') = 'array' then item -> 'required_keywords'
              else '[]'::jsonb
            end
          ) as value
          where trim(value) <> ''
        ) = 0
        or (
          nullif(item ->> 'minimum_keyword_matches', '') is not null
          and not (
            (item ->> 'minimum_keyword_matches') ~ '^[0-9]+$'
            and (item ->> 'minimum_keyword_matches')::integer > 0
          )
        )
      )
  ) then
    raise exception 'Keyword-match grading requires a short-answer question, at least one required keyword, and a positive minimum_keyword_matches when provided.';
  end if;

  delete from public.questions
  where worksheet_id = p_worksheet_id;

  insert into public.questions (
    worksheet_id,
    question_text,
    answer_text,
    answer_options,
    accepted_answer_variants,
    question_type,
    grading_mode,
    numeric_tolerance,
    required_keywords,
    minimum_keyword_matches,
    explanation,
    source_page,
    source_order,
    layout_hint,
    is_published,
    generation_basis,
    style_notes
  )
  select
    p_worksheet_id,
    trim(item ->> 'question_text'),
    trim(item ->> 'answer_text'),
    coalesce(
      (
        select array_agg(trim(value))
        from jsonb_array_elements_text(
          case
            when jsonb_typeof(item -> 'answer_options') = 'array'
              then item -> 'answer_options'
            else '[]'::jsonb
          end
        ) as value
        where trim(value) <> ''
      ),
      '{}'::text[]
    ),
    coalesce(
      (
        select array_agg(trim(value))
        from jsonb_array_elements_text(
          case
            when jsonb_typeof(item -> 'accepted_answer_variants') = 'array'
              then item -> 'accepted_answer_variants'
            else '[]'::jsonb
          end
        ) as value
        where trim(value) <> ''
      ),
      '{}'::text[]
    ),
    case
      when coalesce(item ->> 'question_type', '') in ('short', 'multiple_choice', 'true_false')
        then item ->> 'question_type'
      else 'short'
    end,
    case
      when coalesce(item ->> 'grading_mode', '') in ('exact', 'numeric_tolerance', 'keyword_match')
        then item ->> 'grading_mode'
      else 'exact'
    end,
    nullif(item ->> 'numeric_tolerance', '')::numeric,
    coalesce(
      (
        select array_agg(trim(value))
        from jsonb_array_elements_text(
          case
            when jsonb_typeof(item -> 'required_keywords') = 'array'
              then item -> 'required_keywords'
            else '[]'::jsonb
          end
        ) as value
        where trim(value) <> ''
      ),
      '{}'::text[]
    ),
    nullif(item ->> 'minimum_keyword_matches', '')::integer,
    nullif(trim(item ->> 'explanation'), ''),
    nullif(item ->> 'source_page', '')::integer,
    nullif(item ->> 'source_order', '')::integer,
    case
      when coalesce(item ->> 'layout_hint', '') in ('mcq_vertical', 'mcq_inline', 'short_line', 'paragraph_answer', 'true_false_row', 'unknown')
        then item ->> 'layout_hint'
      when coalesce(item ->> 'question_type', 'short') = 'multiple_choice'
        then 'mcq_vertical'
      when coalesce(item ->> 'question_type', 'short') = 'true_false'
        then 'true_false_row'
      else 'short_line'
    end,
    true,
    case
      when coalesce(item ->> 'generation_basis', '') in ('extracted', 'generated_similar', 'manual')
        then item ->> 'generation_basis'
      else 'generated_similar'
    end,
    nullif(trim(item ->> 'style_notes'), '')
  from jsonb_array_elements(p_questions) as item;

  update public.worksheets
  set status = 'published',
      published_at = now()
  where id = p_worksheet_id;
end;
$$;
