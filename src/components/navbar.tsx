import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db/index'
import { profiles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { ThemeToggle } from './theme-toggle'
import { SignOutButton } from './sign-out-button'

export async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let displayName = user?.email ?? 'User'
  let avatarUrl: string | null = null

  if (user) {
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.id, user.id),
    })
    if (profile) {
      displayName = profile.display_name
      avatarUrl = profile.avatar_url ?? null
    }
  }

  return (
    <header className="flex items-center justify-between px-4 h-12 border-b border-border bg-background shrink-0">
      <span className="text-sm font-semibold text-foreground">Learn Better</span>

      <div className="flex items-center gap-3">
        <ThemeToggle />

        <div className="flex items-center gap-2">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt={displayName} className="w-6 h-6 rounded-full object-cover" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-xs text-muted-foreground max-w-[120px] truncate">{displayName}</span>
        </div>

        <SignOutButton />
      </div>
    </header>
  )
}
