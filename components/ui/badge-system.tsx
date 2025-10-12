import { Badge } from "@/components/ui/badge"
import { 
  Award, 
  Star, 
  Crown, 
  Shield, 
  Zap, 
  Heart,
  MessageCircle,
  TrendingUp,
  Users
} from "lucide-react"
import { cn } from "@/lib/utils"

interface UserBadge {
  type: string
  label: string
  icon: React.ReactNode
  color: string
}

const BADGE_DEFINITIONS: Record<string, UserBadge> = {
  newbie: {
    type: "newbie",
    label: "Новичок",
    icon: <Star className="h-3 w-3" />,
    color: "bg-blue-500/10 text-blue-500 border-blue-500/20"
  },
  contributor: {
    type: "contributor",
    label: "Контрибьютор",
    icon: <Award className="h-3 w-3" />,
    color: "bg-green-500/10 text-green-500 border-green-500/20"
  },
  expert: {
    type: "expert",
    label: "Эксперт",
    icon: <Crown className="h-3 w-3" />,
    color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
  },
  moderator: {
    type: "moderator",
    label: "Модератор",
    icon: <Shield className="h-3 w-3" />,
    color: "bg-purple-500/10 text-purple-500 border-purple-500/20"
  },
  active: {
    type: "active",
    label: "Активный",
    icon: <Zap className="h-3 w-3" />,
    color: "bg-orange-500/10 text-orange-500 border-orange-500/20"
  },
  popular: {
    type: "popular",
    label: "Популярный",
    icon: <TrendingUp className="h-3 w-3" />,
    color: "bg-pink-500/10 text-pink-500 border-pink-500/20"
  },
  helpful: {
    type: "helpful",
    label: "Полезный",
    icon: <Heart className="h-3 w-3" />,
    color: "bg-red-500/10 text-red-500 border-red-500/20"
  },
  chatty: {
    type: "chatty",
    label: "Общительный",
    icon: <MessageCircle className="h-3 w-3" />,
    color: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20"
  },
  community: {
    type: "community",
    label: "Душа комьюнити",
    icon: <Users className="h-3 w-3" />,
    color: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20"
  }
}

/**
 * Calculate user badges based on stats
 */
export function calculateUserBadges(stats: {
  reputation: number
  postCount: number
  commentCount: number
  followerCount: number
  accountAge: number // days
}): string[] {
  const badges: string[] = []

  // Newbie - first week
  if (stats.accountAge <= 7) {
    badges.push("newbie")
  }

  // Contributor - has posts
  if (stats.postCount >= 5) {
    badges.push("contributor")
  }

  // Expert - high reputation
  if (stats.reputation >= 1000) {
    badges.push("expert")
  }

  // Active - recent activity
  if (stats.postCount + stats.commentCount >= 20) {
    badges.push("active")
  }

  // Popular - many followers
  if (stats.followerCount >= 10) {
    badges.push("popular")
  }

  // Helpful - good reputation ratio
  if (stats.reputation > 100 && stats.postCount > 0) {
    const avgRepPerPost = stats.reputation / stats.postCount
    if (avgRepPerPost >= 10) {
      badges.push("helpful")
    }
  }

  // Chatty - many comments
  if (stats.commentCount >= 50) {
    badges.push("chatty")
  }

  // Community - well-rounded stats
  if (
    stats.postCount >= 10 &&
    stats.commentCount >= 30 &&
    stats.followerCount >= 5 &&
    stats.reputation >= 500
  ) {
    badges.push("community")
  }

  return badges
}

interface UserBadgesProps {
  badges: string[]
  size?: "sm" | "md" | "lg"
  maxDisplay?: number
}

export function UserBadges({ badges, size = "sm", maxDisplay = 3 }: UserBadgesProps) {
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5"
  }

  const displayBadges = badges.slice(0, maxDisplay)
  const remainingCount = badges.length - maxDisplay

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {displayBadges.map((badgeType) => {
        const badge = BADGE_DEFINITIONS[badgeType]
        if (!badge) return null

        return (
          <Badge
            key={badgeType}
            variant="outline"
            className={cn(
              "flex items-center gap-1 font-medium",
              badge.color,
              sizeClasses[size]
            )}
          >
            {badge.icon}
            <span>{badge.label}</span>
          </Badge>
        )
      })}
      {remainingCount > 0 && (
        <Badge variant="outline" className={cn("font-medium", sizeClasses[size])}>
          +{remainingCount}
        </Badge>
      )}
    </div>
  )
}

interface BadgeTooltipProps {
  badge: string
}

export function BadgeTooltip({ badge }: BadgeTooltipProps) {
  const badgeInfo = BADGE_DEFINITIONS[badge]
  if (!badgeInfo) return null

  return (
    <div className="flex items-center gap-2">
      <div className={cn("p-2 rounded-full", badgeInfo.color)}>
        {badgeInfo.icon}
      </div>
      <span className="font-medium">{badgeInfo.label}</span>
    </div>
  )
}
