-- Function to auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Trigger to create profile on user signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Function to update post reaction counts
create or replace function public.update_post_reaction_counts()
returns trigger
language plpgsql
as $$
begin
  if TG_OP = 'INSERT' then
    if new.reaction_type = 'like' then
      update public.posts set likes = likes + 1 where id = new.post_id;
    else
      update public.posts set dislikes = dislikes + 1 where id = new.post_id;
    end if;
  elsif TG_OP = 'DELETE' then
    if old.reaction_type = 'like' then
      update public.posts set likes = likes - 1 where id = old.post_id;
    else
      update public.posts set dislikes = dislikes - 1 where id = old.post_id;
    end if;
  end if;
  return null;
end;
$$;

-- Trigger for post reactions
drop trigger if exists post_reaction_counts_trigger on public.post_reactions;
create trigger post_reaction_counts_trigger
  after insert or delete on public.post_reactions
  for each row
  execute function public.update_post_reaction_counts();

-- Function to update comment reaction counts
create or replace function public.update_comment_reaction_counts()
returns trigger
language plpgsql
as $$
begin
  if TG_OP = 'INSERT' then
    if new.reaction_type = 'like' then
      update public.comments set likes = likes + 1 where id = new.comment_id;
    else
      update public.comments set dislikes = dislikes + 1 where id = new.comment_id;
    end if;
  elsif TG_OP = 'DELETE' then
    if old.reaction_type = 'like' then
      update public.comments set likes = likes - 1 where id = old.comment_id;
    else
      update public.comments set dislikes = dislikes - 1 where id = old.comment_id;
    end if;
  end if;
  return null;
end;
$$;

-- Trigger for comment reactions
drop trigger if exists comment_reaction_counts_trigger on public.comment_reactions;
create trigger comment_reaction_counts_trigger
  after insert or delete on public.comment_reactions
  for each row
  execute function public.update_comment_reaction_counts();

-- Function to update timestamps
create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Triggers for updated_at
drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.update_updated_at();

drop trigger if exists posts_updated_at on public.posts;
create trigger posts_updated_at
  before update on public.posts
  for each row
  execute function public.update_updated_at();

drop trigger if exists comments_updated_at on public.comments;
create trigger comments_updated_at
  before update on public.comments
  for each row
  execute function public.update_updated_at();
