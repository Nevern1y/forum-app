-- Function to increment post views
create or replace function increment_post_views(post_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.posts
  set views = views + 1
  where id = post_id;
end;
$$;
