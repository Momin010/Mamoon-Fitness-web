# Forge Fitness - Setup Guide

A premium fitness RPG mobile app with social features, coach marketplace, and gamification.

## Prerequisites

- [Bun](https://bun.sh/) (recommended) or Node.js 18+
- [Supabase](https://supabase.com/) account
- Modern web browser (Chrome, Safari, Firefox)

## Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd forge-fitness

# Install dependencies with Bun
bun install

# Or with npm
npm install
```

### 2. Supabase Setup

1. Create a new project on [Supabase](https://supabase.com/)
2. Go to Project Settings → API
3. Copy the `Project URL` and `anon public` API key

### 3. Environment Configuration

Create a `.env.local` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Database Setup

Run the SQL files in your Supabase SQL Editor (in order):

1. **Base Schema** - [`supabase/setup.sql`](supabase/setup.sql)
   - Profiles, tasks, meals, workouts, friends tables
   - Row Level Security (RLS) policies
   - Auto-triggers for user creation

2. **Storage Setup** - [`supabase/storage-setup.sql`](supabase/storage-setup.sql)
   - Avatar uploads bucket
   - Storage policies

3. **Social Features** - [`supabase/social-schema-fixed.sql`](supabase/social-schema-fixed.sql)
   - Friend requests and connections
   - Coach profiles and applications
   - Social feed and activities
   - Direct messages
   - Privacy settings
   
   > **Note:** Use `social-schema-fixed.sql` instead of `social-schema.sql`. The fixed version includes proper foreign key constraints required for Supabase PostgREST API to resolve implicit joins.

### Database Relationship Fixes (If upgrading existing database)

If you're experiencing errors like:
- `Could not find a relationship between 'social_activities' and 'user_id'`
- `Could not find a relationship between 'friend_connections' and 'friend_id'`
- `user_privacy_settings` table not found
- `user_settings` returning multiple rows

Run the fix script in your Supabase SQL Editor:

```sql
-- Run this to fix foreign key relationships and constraints
-- Located at: supabase/fix-foreign-keys.sql
```

This script will:
1. Add explicit foreign key constraints for `social_activities.user_id` → `auth.users.id`
2. Add explicit foreign key constraints for `friend_connections.friend_id` → `auth.users.id`
3. Create the `user_privacy_settings` table if missing
4. Add unique constraint to `user_settings.user_id` to prevent duplicate rows
5. Add all necessary indexes for join performance

### 5. Start Development Server

```bash
# With Bun
bun run dev

# With npm
npm run dev
```

The app will be available at `http://localhost:5173`

## Project Structure

```
forge-fitness/
├── components/          # React components
│   ├── ForgeDropdown.tsx    # Custom dropdown (replaces native select)
│   ├── ForgeSlider.tsx      # Custom slider (replaces native range)
│   ├── ForgeToggle.tsx      # Custom toggle switch
│   ├── ForgeButton.tsx      # Premium button component
│   └── ...
├── pages/              # Page components
│   ├── WorkoutPage.tsx
│   ├── MacrosPage.tsx
│   ├── TasksPage.tsx
│   ├── FriendsPage.tsx      # Friend system
│   ├── SocialFeedPage.tsx   # Social feed
│   ├── CoachSignupPage.tsx  # Coach application
│   └── EnhancedSettingsPage.tsx
├── context/            # React context providers
├── hooks/              # Custom React hooks
├── lib/                # Utilities and Supabase client
├── supabase/           # SQL schema files
├── public/             # Static assets
└── types.ts            # TypeScript types
```

## Features

### Core Fitness Tracking
- **Workouts** - Log exercises, sets, reps with custom templates
- **Macros** - Track calories and macros with visual progress
- **Tasks** - Daily fitness tasks with XP rewards
- **History** - View past workouts and meals

### Social Features
- **Friends** - Search, add, and manage friends
- **Social Feed** - See friends' activities and achievements
- **Leaderboard** - Compete with friends by XP
- **Coach System** - Apply to become a coach, create workout plans

### Gamification
- **XP System** - Earn XP for workouts, meals, tasks
- **Levels** - Level up every 1000 XP
- **Tiers** - NOVICE → VETERAN → MASTER → ELITE → LEGENDARY
- **Progress Tracking** - Visual charts and analytics

### Premium UI
- **Custom Components** - No native select/range inputs
- **Mobile-First** - Optimized for iOS/Android
- **Dark Theme** - Sleek black/green aesthetic
- **Animations** - Smooth transitions and micro-interactions
- **PWA Ready** - Service worker for offline support

## Database Schema Overview

### Core Tables
- `profiles` - User profiles with stats and goals
- `tasks` - User tasks/todos
- `meals` - Logged meals with nutrition
- `workout_sessions` - Completed workouts
- `workout_exercises` - Exercises within workouts
- `friends` - Friend connections (legacy)

### Social Tables
- `friend_requests` - Pending friend requests
- `friend_connections` - Bidirectional friendships
- `social_activities` - Feed activities
- `social_likes` - Activity likes
- `direct_messages` - Private messaging

### Coach Tables
- `coach_applications` - Coach signup applications
- `coach_profiles` - Approved coach profiles
- `coach_followers` - Coach-user relationships
- `coach_workout_plans` - Coach-created plans
- `user_workout_plans` - Plans assigned to users

### Settings Tables
- `user_settings` - App preferences
- `user_privacy_settings` - Privacy controls

## Custom Components

### ForgeDropdown
Replaces native `<select>` with a premium mobile-optimized dropdown.

```tsx
import { ForgeDropdown } from './components';

<ForgeDropdown
  options={[
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' }
  ]}
  value={selectedValue}
  onChange={setSelectedValue}
  placeholder="Select an option"
  searchable
/>
```

### ForgeSlider
Replaces native `<input type="range">` with a custom styled slider.

```tsx
import { ForgeSlider } from './components';

<ForgeSlider
  value={value}
  onChange={setValue}
  min={0}
  max={100}
  step={1}
  label="Volume"
  color="green"
/>
```

### ForgeToggle
Custom toggle switch with smooth animations.

```tsx
import { ForgeToggle } from './components';

<ForgeToggle
  checked={enabled}
  onChange={setEnabled}
  label="Enable Notifications"
/>
```

### ForgeButton
Premium button with loading states and variants.

```tsx
import { ForgeButton } from './components';

<ForgeButton
  variant="primary"
  size="lg"
  isLoading={isSubmitting}
  leftIcon={<Save size={18} />}
>
  Save Changes
</ForgeButton>
```

## Styling

The app uses Tailwind CSS with custom CSS in [`public/index.css`](public/index.css):

- CSS variables for theming
- Custom scrollbar styling
- Animation keyframes
- Mobile-optimized components
- Safe area support for notched devices

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key | Yes |

## Build for Production

```bash
# Build with Bun
bun run build

# Build with npm
npm run build
```

Output will be in the `dist/` directory.

## Deployment

### Vercel (Recommended)
1. Connect your GitHub repo to Vercel
2. Add environment variables in project settings
3. Deploy!

### Netlify
1. Connect your GitHub repo to Netlify
2. Set build command: `bun run build` (or `npm run build`)
3. Set publish directory: `dist`
4. Add environment variables

### Static Hosting
Upload the contents of `dist/` to any static hosting service (AWS S3, Cloudflare Pages, etc.)

## Troubleshooting

### Build Errors
- Ensure all dependencies are installed: `bun install`
- Clear cache: `rm -rf node_modules && bun install`

### Supabase Connection Issues
- Verify environment variables are set correctly
- Check RLS policies are enabled
- Ensure tables are created in correct order

### Mobile Issues
- Test on actual device for best results
- Check browser console for errors
- Verify service worker is registered

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - feel free to use for personal or commercial projects.

## Support

For issues or questions:
- Check the troubleshooting section
- Review Supabase documentation
- Open an issue on GitHub

---

Built with ❤️ using React, TypeScript, Supabase, and Tailwind CSS.
