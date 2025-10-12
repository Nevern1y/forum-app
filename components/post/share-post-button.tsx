"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Share2 } from "lucide-react"
import { SharePostModal } from "./share-post-modal"

interface SharePostButtonProps {
  postId: string
  postTitle: string
}

export function SharePostButton({ postId, postTitle }: SharePostButtonProps) {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowModal(true)}
        className="text-muted-foreground hover:text-primary"
      >
        <Share2 className="h-4 w-4 mr-1" />
        Поделиться
      </Button>

      {showModal && (
        <SharePostModal
          postId={postId}
          postTitle={postTitle}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}
