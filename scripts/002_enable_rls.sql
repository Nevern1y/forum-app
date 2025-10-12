-- Enable Row Level Security on all tables
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.post_reactions enable row level security;
alter table public.comment_reactions enable row level security;
alter table public.bookmarks enable row level security;
alter table public.subscriptions enable row level security;
alter table public.notifications enable row level security;
alter table public.tags enable row level security;
alter table public.post_tags enable row level security;

-- Profiles policies
create policy "profiles_select_all" on public.profiles for select using (true);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
create policy "profiles_delete_own" on public.profiles for delete using (auth.uid() = id);

-- Posts policies
create policy "posts_select_all" on public.posts for select using (true);
create policy "posts_insert_own" on public.posts for insert with check (auth.uid() = author_id);
create policy "posts_update_own" on public.posts for update using (auth.uid() = author_id);
create policy "posts_delete_own" on public.posts for delete using (auth.uid() = author_id);

-- Comments policies
create policy "comments_select_all" on public.comments for select using (true);
create policy "comments_insert_own" on public.comments for insert with check (auth.uid() = author_id);
create policy "comments_update_own" on public.comments for update using (auth.uid() = author_id);
create policy "comments_delete_own" on public.comments for delete using (auth.uid() = author_id);

-- Post reactions policies
create policy "post_reactions_select_all" on public.post_reactions for select using (true);
create policy "post_reactions_insert_own" on public.post_reactions for insert with check (auth.uid() = user_id);
create policy "post_reactions_delete_own" on public.post_reactions for delete using (auth.uid() = user_id);

-- Comment reactions policies
create policy "comment_reactions_select_all" on public.comment_reactions for select using (true);
create policy "comment_reactions_insert_own" on public.comment_reactions for insert with check (auth.uid() = user_id);
create policy "comment_reactions_delete_own" on public.comment_reactions for delete using (auth.uid() = user_id);

-- Bookmarks policies
create policy "bookmarks_select_own" on public.bookmarks for select using (auth.uid() = user_id);
create policy "bookmarks_insert_own" on public.bookmarks for insert with check (auth.uid() = user_id);
create policy "bookmarks_delete_own" on public.bookmarks for delete using (auth.uid() = user_id);

-- Subscriptions policies
create policy "subscriptions_select_all" on public.subscriptions for select using (true);
create policy "subscriptions_insert_own" on public.subscriptions for insert with check (auth.uid() = follower_id);
create policy "subscriptions_delete_own" on public.subscriptions for delete using (auth.uid() = follower_id);

-- Notifications policies
create policy "notifications_select_own" on public.notifications for select using (auth.uid() = user_id);
create policy "notifications_update_own" on public.notifications for update using (auth.uid() = user_id);
create policy "notifications_delete_own" on public.notifications for delete using (auth.uid() = user_id);

-- Tags policies (read-only for users, insert handled by functions)
create policy "tags_select_all" on public.tags for select using (true);

-- Post tags policies
create policy "post_tags_select_all" on public.post_tags for select using (true);
create policy "post_tags_insert_via_post" on public.post_tags for insert with check (
  exists (select 1 from public.posts where id = post_id and author_id = auth.uid())
);
create policy "post_tags_delete_via_post" on public.post_tags for delete using (
  exists (select 1 from public.posts where id = post_id and author_id = auth.uid())
);
