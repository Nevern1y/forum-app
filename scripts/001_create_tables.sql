-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (references auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  avatar_url text,
  bio text,
  reputation integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Posts table
create table if not exists public.posts (
  id uuid primary key default uuid_generate_v4(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  content text not null,
  views integer default 0,
  likes integer default 0,
  dislikes integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Comments table (threaded)
create table if not exists public.comments (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  parent_id uuid references public.comments(id) on delete cascade,
  content text not null,
  likes integer default 0,
  dislikes integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Post likes/dislikes tracking
create table if not exists public.post_reactions (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reaction_type text not null check (reaction_type in ('like', 'dislike')),
  created_at timestamp with time zone default now(),
  unique(post_id, user_id)
);

-- Comment likes/dislikes tracking
create table if not exists public.comment_reactions (
  id uuid primary key default uuid_generate_v4(),
  comment_id uuid not null references public.comments(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reaction_type text not null check (reaction_type in ('like', 'dislike')),
  created_at timestamp with time zone default now(),
  unique(comment_id, user_id)
);

-- Bookmarks
create table if not exists public.bookmarks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique(user_id, post_id)
);

-- Subscriptions (follow users)
create table if not exists public.subscriptions (
  id uuid primary key default uuid_generate_v4(),
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique(follower_id, following_id),
  check (follower_id != following_id)
);

-- Notifications
create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('comment', 'like', 'mention', 'follow')),
  content text not null,
  related_post_id uuid references public.posts(id) on delete cascade,
  related_comment_id uuid references public.comments(id) on delete cascade,
  related_user_id uuid references public.profiles(id) on delete cascade,
  is_read boolean default false,
  created_at timestamp with time zone default now()
);

-- Tags
create table if not exists public.tags (
  id uuid primary key default uuid_generate_v4(),
  name text unique not null,
  created_at timestamp with time zone default now()
);

-- Post tags (many-to-many)
create table if not exists public.post_tags (
  post_id uuid not null references public.posts(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (post_id, tag_id)
);

-- Create indexes for better performance
create index if not exists idx_posts_author on public.posts(author_id);
create index if not exists idx_posts_created on public.posts(created_at desc);
create index if not exists idx_comments_post on public.comments(post_id);
create index if not exists idx_comments_author on public.comments(author_id);
create index if not exists idx_comments_parent on public.comments(parent_id);
create index if not exists idx_notifications_user on public.notifications(user_id);
create index if not exists idx_notifications_unread on public.notifications(user_id, is_read);
