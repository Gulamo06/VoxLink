create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id text primary key,
  username text not null unique,
  avatar_url text,
  status text not null default 'online' check (status in ('online', 'busy', 'offline')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.contacts (
  owner_id text not null references public.profiles(id) on delete cascade,
  contact_id text not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (owner_id, contact_id),
  constraint contacts_not_self check (owner_id <> contact_id)
);

create table if not exists public.groups (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  channel text not null unique,
  created_by text not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.group_members (
  group_id text not null references public.groups(id) on delete cascade,
  user_id text not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (group_id, user_id)
);

create table if not exists public.messages (
  id text primary key default gen_random_uuid()::text,
  chat_id text not null,
  sender_id text not null references public.profiles(id) on delete cascade,
  text text,
  voice_url text,
  voice_duration_seconds integer check (voice_duration_seconds is null or voice_duration_seconds >= 0),
  voice_mime_type text,
  read boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  constraint messages_content_check
    check (coalesce(nullif(trim(text), ''), voice_url) is not null)
);

create index if not exists messages_chat_id_created_at_idx
  on public.messages (chat_id, created_at desc);

create index if not exists messages_sender_id_idx
  on public.messages (sender_id);

create index if not exists contacts_owner_id_idx
  on public.contacts (owner_id, created_at desc);

create index if not exists contacts_contact_id_idx
  on public.contacts (contact_id);

create index if not exists groups_created_by_idx
  on public.groups (created_by, created_at desc);

create index if not exists group_members_user_id_idx
  on public.group_members (user_id);

create index if not exists group_members_group_id_idx
  on public.group_members (group_id);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists groups_set_updated_at on public.groups;
create trigger groups_set_updated_at
before update on public.groups
for each row
execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.contacts enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.messages enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'profiles_public_read'
  ) then
    create policy profiles_public_read
      on public.profiles
      for select
      using (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'profiles_authenticated_insert'
  ) then
    create policy profiles_authenticated_insert
      on public.profiles
      for insert
      to authenticated
      with check (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'profiles_authenticated_update'
  ) then
    create policy profiles_authenticated_update
      on public.profiles
      for update
      to authenticated
      using (true)
      with check (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'messages'
      and policyname = 'messages_authenticated_read'
  ) then
    create policy messages_authenticated_read
      on public.messages
      for select
      to authenticated
      using (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'messages'
      and policyname = 'messages_authenticated_insert'
  ) then
    create policy messages_authenticated_insert
      on public.messages
      for insert
      to authenticated
      with check (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'messages'
      and policyname = 'messages_authenticated_update'
  ) then
    create policy messages_authenticated_update
      on public.messages
      for update
      to authenticated
      using (true)
      with check (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'contacts'
      and policyname = 'contacts_authenticated_read'
  ) then
    create policy contacts_authenticated_read
      on public.contacts
      for select
      to authenticated
      using (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'contacts'
      and policyname = 'contacts_authenticated_insert'
  ) then
    create policy contacts_authenticated_insert
      on public.contacts
      for insert
      to authenticated
      with check (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'contacts'
      and policyname = 'contacts_authenticated_delete'
  ) then
    create policy contacts_authenticated_delete
      on public.contacts
      for delete
      to authenticated
      using (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'groups'
      and policyname = 'groups_authenticated_read'
  ) then
    create policy groups_authenticated_read
      on public.groups
      for select
      to authenticated
      using (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'groups'
      and policyname = 'groups_authenticated_insert'
  ) then
    create policy groups_authenticated_insert
      on public.groups
      for insert
      to authenticated
      with check (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'groups'
      and policyname = 'groups_authenticated_update'
  ) then
    create policy groups_authenticated_update
      on public.groups
      for update
      to authenticated
      using (true)
      with check (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'group_members'
      and policyname = 'group_members_authenticated_read'
  ) then
    create policy group_members_authenticated_read
      on public.group_members
      for select
      to authenticated
      using (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'group_members'
      and policyname = 'group_members_authenticated_insert'
  ) then
    create policy group_members_authenticated_insert
      on public.group_members
      for insert
      to authenticated
      with check (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'group_members'
      and policyname = 'group_members_authenticated_delete'
  ) then
    create policy group_members_authenticated_delete
      on public.group_members
      for delete
      to authenticated
      using (true);
  end if;
end
$$;

insert into storage.buckets (id, name, public)
values
  ('audio-messages', 'audio-messages', true),
  ('profile-pictures', 'profile-pictures', true)
on conflict (id) do update
set public = excluded.public;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'audio_messages_public_read'
  ) then
    create policy audio_messages_public_read
      on storage.objects
      for select
      using (bucket_id = 'audio-messages');
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'audio_messages_authenticated_write'
  ) then
    create policy audio_messages_authenticated_write
      on storage.objects
      for insert
      to authenticated
      with check (bucket_id = 'audio-messages');
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'audio_messages_authenticated_update'
  ) then
    create policy audio_messages_authenticated_update
      on storage.objects
      for update
      to authenticated
      using (bucket_id = 'audio-messages')
      with check (bucket_id = 'audio-messages');
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'audio_messages_authenticated_delete'
  ) then
    create policy audio_messages_authenticated_delete
      on storage.objects
      for delete
      to authenticated
      using (bucket_id = 'audio-messages');
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'profile_pictures_public_read'
  ) then
    create policy profile_pictures_public_read
      on storage.objects
      for select
      using (bucket_id = 'profile-pictures');
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'profile_pictures_authenticated_write'
  ) then
    create policy profile_pictures_authenticated_write
      on storage.objects
      for insert
      to authenticated
      with check (bucket_id = 'profile-pictures');
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'profile_pictures_authenticated_update'
  ) then
    create policy profile_pictures_authenticated_update
      on storage.objects
      for update
      to authenticated
      using (bucket_id = 'profile-pictures')
      with check (bucket_id = 'profile-pictures');
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'profile_pictures_authenticated_delete'
  ) then
    create policy profile_pictures_authenticated_delete
      on storage.objects
      for delete
      to authenticated
      using (bucket_id = 'profile-pictures');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end
$$;
