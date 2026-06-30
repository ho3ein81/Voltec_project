"use client"

import { useToastContext } from "@/app/components/ui/toast"

export function useToast() {
  const { addToast } = useToastContext()

  const toast = ({
    title,
  }: {
    title: string
  }) => {
    addToast({
      id: crypto.randomUUID(),
      title,
    })
  }

  return { toast }
}
