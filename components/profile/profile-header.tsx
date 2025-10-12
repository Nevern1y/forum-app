"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { MapPin, Link as LinkIcon, MoreHorizontal, Share2, Calendar } from "lucide-react"
import { FollowButton } from "./follow-button"
import { FollowersModal } from "./followers-modal"
import { FriendRequestButton } from "@/components/friends/friend-request-button"
import Link from "next/link"
import { format } from "date-fns"
import { ru } from "date-fns/locale"

interface Profile {
  id: string
  username: string
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  reputation: number
  created_at: string
  location?: string | null
  website?: string | null
}

interface ProfileHeaderProps {
  profile: Profile
  isOwnProfile: boolean
  isFollowing: boolean
  stats: {
    postCount: number
    followerCount: number
    followingCount: number
    commentCount: number
  }
}

export function ProfileHeader({ profile, isOwnProfile, isFollowing, stats }: ProfileHeaderProps) {
  return (
    <div className="relative">
      {/* Decorative gradient background */}
      <div className="absolute inset-0 -top-20 bg-gradient-to-b from-primary/5 via-primary/2 to-transparent rounded-3xl blur-3xl -z-10" />
      
      <div className="pb-6 pt-4">
        {/* Avatar Section - Centered and prominent */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full blur-xl group-hover:blur-2xl transition-all duration-300" />
            <Avatar className="relative h-[120px] w-[120px] ring-4 ring-background shadow-xl shadow-primary/10 transition-all duration-300">
              <AvatarImage src={profile.avatar_url || undefined} className="object-cover" />
              <AvatarFallback className="text-5xl font-bold bg-gradient-to-br from-primary/20 to-primary/10">
                {profile.display_name?.[0]?.toUpperCase() || profile.username[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Name and Username */}
          <div className="text-center mt-5 space-y-1">
            <h1 className="text-[28px] font-bold leading-tight tracking-tight">
              {profile.display_name || profile.username}
            </h1>
            <p className="text-[15px] text-muted-foreground/80">@{profile.username}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 mt-4">
            {isOwnProfile ? (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-10 px-6 rounded-full font-medium shadow-sm hover:shadow-md transition-all duration-200" 
                  asChild
                >
                  <Link href="/settings/profile">Редактировать профиль</Link>
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-10 w-10 rounded-full hover:bg-accent/50 transition-all duration-200"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <FollowButton profileId={profile.id} isFollowing={isFollowing} />
                <FriendRequestButton userId={profile.id} className="h-10 px-6 rounded-full font-medium" />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-10 w-10 rounded-full hover:bg-accent/50 transition-all duration-200"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <div className="text-center max-w-2xl mx-auto mb-5">
            <p className="text-[15.5px] leading-[24px] text-foreground/90 whitespace-pre-wrap break-words">
              {profile.bio}
            </p>
          </div>
        )}

        {/* Location, Website & Join Date */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[14px] text-muted-foreground/70 mb-6">
          {profile.location && (
            <div className="flex items-center gap-1.5 hover:text-foreground/80 transition-colors">
              <MapPin className="h-[16px] w-[16px]" />
              <span>{profile.location}</span>
            </div>
          )}
          {profile.website && (
            <a
              href={profile.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-primary transition-colors"
            >
              <LinkIcon className="h-[16px] w-[16px]" />
              <span className="hover:underline underline-offset-2">{profile.website.replace(/^https?:\/\//, "")}</span>
            </a>
          )}
          <div className="flex items-center gap-1.5">
            <Calendar className="h-[16px] w-[16px]" />
            <span>Присоединился {format(new Date(profile.created_at), "LLLL yyyy", { locale: ru })}</span>
          </div>
        </div>

        {/* Stats - Enhanced design */}
        <div className="flex items-center justify-center gap-6 py-4 px-6 bg-muted/30 rounded-2xl backdrop-blur-sm border border-border/50 shadow-sm">
          <div className="text-center">
            <div className="text-[22px] font-bold text-foreground tabular-nums">{stats.postCount}</div>
            <div className="text-[13px] text-muted-foreground/70 mt-0.5">постов</div>
          </div>
          
          <div className="h-10 w-px bg-border/60" />
          
          <FollowersModal 
            userId={profile.id} 
            count={stats.followerCount} 
            type="followers"
            trigger={
              <button className="text-center transition-all duration-200">
                <div className="text-[22px] font-bold text-foreground tabular-nums">{stats.followerCount}</div>
                <div className="text-[13px] text-muted-foreground/70 hover:text-primary transition-colors mt-0.5">подписчиков</div>
              </button>
            }
          />
          
          <div className="h-10 w-px bg-border/60" />
          
          <FollowersModal 
            userId={profile.id} 
            count={stats.followingCount} 
            type="following"
            trigger={
              <button className="text-center transition-all duration-200">
                <div className="text-[22px] font-bold text-foreground tabular-nums">{stats.followingCount}</div>
                <div className="text-[13px] text-muted-foreground/70 hover:text-primary transition-colors mt-0.5">подписок</div>
              </button>
            }
          />

          <div className="h-10 w-px bg-border/60" />

          <div className="text-center">
            <div className="text-[22px] font-bold text-foreground tabular-nums">{stats.commentCount}</div>
            <div className="text-[13px] text-muted-foreground/70 mt-0.5">ответов</div>
          </div>
        </div>

        {/* Reputation Badge */}
        {profile.reputation > 0 && (
          <div className="flex justify-center mt-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-full">
              <span className="text-2xl">🏆</span>
              <span className="text-sm font-semibold text-foreground">
                Репутация: <span className="text-amber-600 dark:text-amber-400">{profile.reputation}</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Border with gradient */}
      <div className="relative mt-6">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-border to-transparent" />
        <div className="border-b" />
      </div>
    </div>
  )
}
