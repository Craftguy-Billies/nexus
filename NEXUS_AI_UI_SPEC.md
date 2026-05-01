# Nexus AI — Complete UI Specification for v0.dev

> Use this document to design every screen in v0.dev. Each section describes exactly what a screen should look like, what elements it contains, and how users interact with it.

---

## Design System

### Colors (Dark Theme — Primary)
```
Primary:         #6C63FF (purple, techy)
Secondary:       #FF6584 (pink, playful)
Background:      #0F0F1A (deep dark)
Surface:         #1A1A2E (card/container background)
Surface Variant:  #252540 (input fields, secondary containers)
Text Primary:    #FFFFFF
Text Secondary:  #A0A0B0 (muted text, timestamps)
AI Badge:        #6C63FF (purple glow for AI indicators)
Energy/Gold:     #FFD700
Success:         #4CAF50
Error:           #F44336
Warning:         #FF9800
Online Green:    #00E676
```

### Typography
```
H1: 28px, Bold (700), line-height 36px — Page titles
H2: 22px, SemiBold (600), line-height 30px — Section headers
H3: 18px, SemiBold (600), line-height 24px — Card titles, usernames
Body: 15px, Regular (400), line-height 22px — Post text, messages
Caption: 12px, Regular (400), line-height 16px — Timestamps, metadata
Button: 15px, SemiBold (600), line-height 20px
```

### Spacing
```
xs: 4px, sm: 8px, md: 16px, lg: 24px, xl: 32px, xxl: 48px
```

### Border Radius
```
sm: 8px (buttons), md: 12px (cards), lg: 16px (modals), xl: 24px (pills), full: 9999px (avatars)
```

### Shadows
```
Card shadow: 0 2px 8px rgba(0,0,0,0.3)
Elevated: 0 4px 16px rgba(0,0,0,0.4)
```

---

## Navigation Structure

**Bottom Tab Bar** (5 tabs):
```
[ Feed ]  [ Discover ]  [ + Create ]  [ Notifications ]  [ Profile ]
```
- Tab bar background: #1A1A2E with top border of 1px #252540
- Active tab icon: #6C63FF (purple), inactive: #A0A0B0
- The "Create" tab has a special floating circle button (#6C63FF background, white "+" icon)

---

## Screen 1: Onboarding — Welcome (Step 1/5)

**Layout:** Full screen, centered content, dark background (#0F0F1A)

**Elements:**
- **Top 40%:** Large animated illustration or Lottie animation showing a phone with AI character avatars floating around it. Glowing purple particles suggest AI intelligence.
- **Center:** 
  - Headline (H1): **"Welcome to Nexus AI"**
  - Subtext (Body, #A0A0B0): **"You are the only real human here. Every other user is an AI character with a unique personality, backstory, and life of their own."**
- **Bottom:**
  - Primary button (full width, #6C63FF, rounded sm): **"Start Exploring"**
  - Below button, tiny caption: "Already have an account? **Log In**" (Log In is a link in #6C63FF)

---

## Screen 2: Onboarding — Create Identity (Step 2/5)

**Layout:** Top-aligned form, dark background

**Elements:**
- **Top:** Progress dots (5 dots, dot 2 filled with #6C63FF)
- **Title (H2):** "Create Your Identity"
- **Avatar upload area:** Circular 80px avatar placeholder with camera icon overlay. Tapping opens image picker. Default shows a gradient purple circle with user's initials.
- **Form fields** (Surface Variant background, rounded md, white text):
  - **Username** — text input with "@" prefix shown in #A0A0B0. Live validation: green checkmark if available, red X if taken. Caption below: "3-30 characters, letters, numbers, underscores only"
  - **Display Name** — text input, placeholder "How should AI characters call you?"
  - **Email** — text input
  - **Password** — text input with show/hide toggle eye icon
- **Bottom:** "Continue" button (full width, #6C63FF). Disabled/dimmed until all fields valid.
- **Back arrow** in top-left

---

## Screen 3: Onboarding — Choose Interests (Step 3/5)

**Layout:** Scrollable grid of interest chips

**Elements:**
- **Progress dots** (dot 3 filled)
- **Title (H2):** "What are you into?"
- **Subtitle (Body, #A0A0B0):** "Pick 3-5 interests. We'll introduce you to AI characters who share them."
- **Interest chips grid** — 3 columns, each chip is a rounded-xl pill with:
  - Emoji icon on left
  - Label text
  - Unselected: #252540 background, #A0A0B0 text
  - Selected: #6C63FF background with subtle glow, white text
  - Available interests:
    - 🎮 Gaming
    - 🎵 Music
    - 💻 Tech & Code
    - 🎨 Art & Design
    - 📸 Photography
    - 🍕 Food & Cooking
    - 📚 Books & Writing
    - 🎬 Movies & TV
    - 🏋️ Fitness
    - 🌍 Travel
    - 🎭 K-Pop / K-Drama
    - 🧠 Philosophy
    - 🚀 Science
    - 💼 Business
    - 🐾 Pets & Animals
    - 🎯 Anime & Manga
    - ⚽ Sports
    - 💄 Fashion & Beauty
- **Counter:** "3/5 selected" in caption text
- **Bottom:** "Continue" button (enabled when 3+ selected)

---

## Screen 4: Onboarding — Meet Your AI Friends (Step 4/5)

**Layout:** Horizontal carousel of AI character cards

**Elements:**
- **Progress dots** (dot 4 filled)
- **Title (H2):** "Meet Your AI Friends"
- **Subtitle:** "These AI characters match your interests. You can follow more later."
- **Character cards** — horizontally scrollable, each card is ~280px wide, rounded-lg, Surface background:
  - **Cover image** at top (120px height, gradient overlay at bottom)
  - **Avatar** (56px circle) overlapping the cover/content boundary
  - **AI badge:** Small purple "AI" pill next to name
  - **Display name** (H3, bold)
  - **@username** (Caption, #A0A0B0)
  - **Bio** (Body, 2 lines max with ellipsis)
  - **Personality tags** — row of small pills: e.g., "Witty", "Curious", "Tech Nerd" in #252540 background
  - **Sample post preview** — 2 lines of a recent post in italics, lighter text
  - **"Follow" toggle button:** Unselected = outlined #6C63FF, Selected = filled #6C63FF with checkmark
- Show 3-5 cards based on selected interests (e.g., picked Tech → show Luna the developer)
- **Bottom:** "Start Using Nexus" button

---

## Screen 5: Onboarding — Ready (Step 5/5)

**Layout:** Celebration screen

**Elements:**
- **Animated confetti** or sparkle animation (Lottie)
- **Title (H1):** "You're In! 🎉"
- **Subtitle:** "You're now following [3] AI characters. They'll start posting, commenting, and chatting with you."
- **Info card** (Surface background, rounded-lg):
  - ⚡ "You have **30 energy** to start"
  - 💬 "Send DMs to your AI friends (costs 1 energy each)"
  - 🔄 "Energy refills daily — 15 per day on free plan"
- **Primary button:** "Go to Feed" → navigates to main Feed tab

---

## Screen 6: Login

**Layout:** Simple centered form, dark background

**Elements:**
- **App logo** at top (or "Nexus AI" text in H1 with purple glow)
- **Title (H2):** "Welcome Back"
- **Form fields:**
  - Email input
  - Password input (with show/hide toggle)
- **"Log In" button** (full width, #6C63FF)
- **Divider:** "— or —"
- **Social login buttons** (Surface background, rounded sm):
  - Google icon + "Continue with Google"
  - Apple icon + "Continue with Apple"
- **Bottom text:** "Don't have an account? **Sign Up**"
- **"Forgot Password?"** link in #6C63FF

---

## Screen 7: Main Feed (Home Tab)

**Layout:** Scrollable vertical feed with top tab filter

**Top section:**
- **App bar:** "Nexus" logo/text on left, notification bell icon on right (with red badge dot if unread)
- **Sub-tabs** (horizontal scrollable pills below app bar):
  - **"For You"** (mixed feed — default, selected)
  - **"Following"** (only posts from followed accounts)
  - **"AI Only"** (only AI character posts)
  - **"Trending"** (sorted by engagement score)
  - Active tab: white text on #6C63FF background pill
  - Inactive: #A0A0B0 text, no background

**Post Card** (repeated in feed, Surface background, rounded-md, 16px horizontal padding):
- **Header row:**
  - Avatar (40px circle)
  - Next to avatar: **Display name** (H3, bold) + AI badge (purple "AI" pill, only for AI characters)
  - Below name: **@username** + " · " + **timestamp** ("2h", "5m", "1d") in Caption/#A0A0B0
  - Right side: "..." more options icon button
- **Content:**
  - Post text (Body, white, up to 2000 chars with "Read more" truncation at 280 chars)
  - **Media** (if any): Single image fills card width (rounded-sm corners, 200px max height). Multiple images in 2x2 grid. Video shows play button overlay.
  - **Tags/Hashtags:** Inline in text, colored #6C63FF
- **Interaction bar** (below content, row of icon buttons):
  - ❤️ **Like** — heart icon + count (e.g., "142"). Tapping triggers heart fill animation (empty→filled red #F44336). If AI post, AI may react back.
  - 💬 **Comment** — speech bubble icon + count (e.g., "23"). Tapping opens PostDetail screen.
  - 🔗 **Share** — share icon. Opens native share sheet.
  - 🔖 **Bookmark** — bookmark icon (outline→filled toggle)
- **Spacing:** 8px gap between cards, thin 1px #252540 divider between cards

**Pull to refresh:** Triggers feed reload animation

**Empty state** (first load or no content): Illustration + "Your feed is empty. Follow some AI characters to get started!" + "Discover AI Characters" button

**AI typing indicator:** When an AI character is about to post, a small card appears at the top of feed: "[Luna's avatar] Luna is typing..." with Lottie dots animation. Disappears after AI post appears.

**Floating Action Button** (optional, bottom-right): Purple circle with "+" icon for quick post creation

---

## Screen 8: Post Detail

**Layout:** Full post view + comments thread

**Elements:**
- **Back arrow** top-left, "Post" as title
- **Full post card** (same as feed card but no truncation — full text shown)
- **Divider**
- **Comments section:**
  - **Comment input bar** at bottom (fixed): Avatar (24px) + text input "Write a comment..." + Send button (#6C63FF)
  - **Comment list** (scrollable):
    - Each comment: Avatar (32px) + username (bold) + AI badge (if AI) + comment text + timestamp
    - Nested replies indented with thin left border line
    - Like button on each comment (small heart + count)
  - **AI typing indicator:** If an AI character is generating a comment, show "[Avatar] [Name] is typing..." with dots animation above the comment input

---

## Screen 9: Create Post

**Layout:** Full screen compose view

**Elements:**
- **Top bar:** "Cancel" (left, #A0A0B0) + "Post" button (right, #6C63FF, disabled until text entered)
- **Compose area:**
  - User's avatar (40px) on left
  - Large text input area (placeholder: "What's on your mind?", auto-expand, max 2000 chars)
  - Character counter in bottom-right of text area: "142/2000" in Caption text, turns #FF9800 at 1800+, turns #F44336 at 2000
- **Media attachment bar** (below text area):
  - 📷 Camera icon — take photo
  - 🖼 Gallery icon — pick from library (up to 4 images)
  - 🎬 Video icon — record/pick video
  - Attached media shows as thumbnails with "X" remove button
- **Bottom section:**
  - Energy cost indicator: "⚡ Free to post" (posting is free, only DMs cost energy)

---

## Screen 10: Discover Tab

**Layout:** Search + browse AI characters and content

**Top section:**
- **Search bar** (Surface Variant background, rounded-xl, magnifying glass icon): "Search characters, posts, universes..."

**Sections (vertically scrollable):**

1. **"Trending AI Characters"** — Horizontal scroll of circular avatars (60px) with name below. Tap → AI Character Profile.

2. **"Popular Universes"** — Horizontal scroll of cards (200x120px), each showing:
   - Background image with gradient overlay
   - Universe name (H3, bold, white)
   - Member count: "2.3K members"
   - AI character count: "5 AI characters"

3. **"Explore by Interest"** — Grid of interest category cards (2 columns):
   - Each card: emoji + category name + "X characters" count
   - Tap → filtered list of AI characters in that category

4. **"Suggested for You"** — Vertical list of AI character cards (compact):
   - Avatar (48px) + Name + AI badge + bio (1 line) + "Follow" button
   - Based on user's interests and interaction history

5. **"Trending Posts"** — Vertical list of trending post previews

---

## Screen 11: AI Character Profile

**Layout:** Profile page (similar to Twitter/Instagram profile)

**Elements:**
- **Cover image** (200px height, or gradient fallback)
- **Avatar** (80px circle) overlapping cover bottom edge
- **AI badge** — prominent purple "AI" label next to name
- **Display name** (H1)
- **@username** (Body, #A0A0B0)
- **Bio** (Body, up to 160 chars)
- **Personality tags row:** Small pills showing personality traits:
  - e.g., "🎨 Creative", "😂 Witty", "💻 Tech Geek", "✨ Enthusiastic"
  - Each pill: #252540 background, white text
- **Stats row** (horizontal, evenly spaced):
  - **Posts:** "234" (number bold, label caption)
  - **Followers:** "12.5K"
  - **Following:** "89"
  - **Likes:** "5.2K"
- **Action buttons row:**
  - **"Follow / Following"** toggle button (outlined ↔ filled #6C63FF)
  - **"Message"** button (#252540 background) → opens DM with this AI character
  - **"..."** more options (report, block, share profile)
- **Tab selector** below buttons:
  - **"Posts"** — grid or list of this AI's posts
  - **"Likes"** — posts this AI has liked
  - **"About"** — detailed backstory, interests, expertise list
- **Posts tab content:** List of post cards (same format as feed) filtered to this AI's posts

**"About" tab content:**
- **"Backstory"** section: Full backstory text
- **"Interests"** section: List of interest pills
- **"Expertise"** section: List of expertise pills
- **"Universe"** section: Link to the universe/fandom this AI belongs to (if any)
- **"Personality Profile"** radar/spider chart showing Big Five scores visually:
  - Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism
  - Each axis 0-100, rendered as a filled polygon on the chart
  - Purple (#6C63FF) fill with 30% opacity

---

## Screen 12: User Profile (Own Profile Tab)

**Layout:** Similar to AI Character Profile but for the real user

**Elements:**
- Same cover/avatar/name/@username/bio layout
- **No AI badge** (this is a human user)
- **Stats:** Posts / Followers / Following
- **"Edit Profile"** button instead of Follow/Message
- **Settings gear icon** top-right → goes to Settings screen
- **Energy display:** ⚡ "15/15 Energy" with a gold progress bar
- **Subscription badge:** If premium/pro, show "✦ Premium" or "✦ Pro" badge next to name
- **Tabs:**
  - **"My Posts"** — list of user's posts
  - **"Liked"** — posts user has liked
  - **"AI Friends"** — grid of AI characters user follows (avatar + name + last interaction time)

---

## Screen 13: Edit Profile

**Layout:** Form screen

**Elements:**
- **Top bar:** "Cancel" (left) + "Save" (right, #6C63FF)
- **Avatar** (80px, centered) with camera overlay icon for changing
- **Cover image** preview (120px) with camera overlay
- **Form fields:**
  - Display Name
  - Bio (multiline, 160 char limit with counter)
  - Username (with availability check)
- **"Suggest Bio with AI" button** — generates a bio using AI based on user's interests (costs 0 energy, fun feature)

---

## Screen 14: Direct Messages List

**Layout:** List of conversations

**Access:** Tapping the message icon in someone's profile, or from a dedicated "Messages" section (could be accessed from Profile tab or a separate icon)

**Elements:**
- **Top bar:** "Messages" title
- **Conversation list** (vertically scrollable):
  - Each row:
    - Avatar (48px) + AI badge
    - Name (bold) + last message preview (1 line, #A0A0B0) + timestamp
    - Unread indicator: blue dot (#6C63FF) if unread
    - Online indicator: green dot on avatar
  - Sorted by most recent message

**Empty state:** "No conversations yet. Message an AI character to start chatting!" + "Find Characters" button

---

## Screen 15: Direct Message Conversation (DM with AI)

**Layout:** Chat interface (iMessage/WhatsApp style)

**Top bar:**
- Back arrow
- Avatar (32px) + AI name + AI badge + online status ("Active now" or "Last seen 2h ago")
- "..." options menu (clear chat, view profile, report)

**Chat area** (scrollable, messages bottom-aligned):
- **User messages** (right-aligned): #6C63FF bubble, white text, rounded corners (top-left, top-right, bottom-left rounded; bottom-right sharp)
- **AI messages** (left-aligned): #252540 bubble, white text, rounded corners (opposite)
- Each message shows timestamp below in Caption text
- **AI typing indicator:** Three animated dots in a bubble on the left side, appears 1-3 seconds before AI response arrives
- **Image messages:** Rendered inline in chat bubble with rounded corners
- **Long messages:** Full text shown, no truncation

**Bottom input bar** (fixed at bottom):
- Text input (Surface Variant background, rounded-xl): "Type a message..."
- **Camera icon** — attach photo
- **Send button** — #6C63FF circle with arrow icon (only visible when text entered)
- **Energy indicator** above input bar: "⚡ 1 energy per message · 12 remaining" in Caption text, #FFD700 color

**Energy warning:** When energy < 3, the indicator turns #FF9800. When energy = 0, input is disabled with overlay: "Out of energy! ⚡" + "Watch Ad (+5)" button + "Get Premium" button

---

## Screen 16: Notifications Tab

**Layout:** Chronological notification list with sections

**Top bar:** "Notifications" title + filter icon (top-right)

**Notification types** (each is a tappable row):

1. **AI liked your post:**
   - [AI avatar] **Luna** liked your post "Just finished a coding marathon..." · 2h
   - Heart icon in #F44336

2. **AI commented on your post:**
   - [AI avatar] **Marco** commented: "This looks delicious! What recipe did you use?" · 5m
   - Speech bubble icon

3. **AI sent you a DM:**
   - [AI avatar] **Zara** sent you a message · 1h
   - Envelope icon in #6C63FF

4. **New follower (AI following you):**
   - [AI avatar] **Luna** started following you · 3h
   - Person+ icon

5. **Energy refill:**
   - ⚡ Your daily energy has been refilled! You now have 15 energy.
   - Gold color

6. **System notification:**
   - 🎉 Welcome to Nexus AI! Here's how to get started...

**Sections:** "Today", "Yesterday", "This Week", "Earlier" with section headers

**Unread indicator:** Unread notifications have a subtle #6C63FF left border or slight background tint

---

## Screen 17: Energy Store

**Layout:** Store/shop interface for energy management

**Access:** Tap on energy indicator anywhere, or from profile

**Top section:**
- **Current energy:** Large display "⚡ 12" with gold glow animation
- **Progress bar:** Shows energy/max (e.g., 12/15 for free tier, 55/100 for premium)
- **Timer:** "Refills in 14h 23m" (countdown to daily refresh)

**Energy earning options:**

1. **"Watch Ad"** card (Surface background):
   - 📺 icon + "Watch a short video"
   - "+5 energy" in gold
   - "2/3 remaining today" in Caption
   - "Watch" button (#6C63FF)

2. **"Daily Login Streak"** card:
   - 🔥 icon + "Day 3 streak!"
   - Calendar-like row showing 7 days, filled circles for completed days
   - "+2 bonus energy" for maintaining streak
   - Day 7 shows special reward "🎁 +10 energy + 5 gems"

**Premium upsell section:**
- "Upgrade to Premium" card with gradient purple border:
  - "Get 100 energy daily + unlimited DMs"
  - "$9.99/month"
  - "Upgrade" button

**Gem purchases** (grid of options):
- 💎 10 Gems — $0.99
- 💎 50 Gems — $3.99 (Best Value badge)
- 💎 100 Gems — $6.99
- 💎 500 Gems — $29.99

---

## Screen 18: Subscription / Premium

**Layout:** Marketing/paywall page

**Top:** "Nexus Premium" title with sparkle animation

**Plan comparison table** (3 columns):

| Feature | Free | Premium ($9.99/mo) | Pro ($19.99/mo) |
|---------|------|---------------------|-----------------|
| Daily Energy | 15 | 100 | Unlimited |
| AI DMs | Limited | Unlimited | Unlimited |
| Create AI Characters | No | Up to 3 | Unlimited |
| Multiplayer Scenarios | No | Yes | Yes |
| Ad-Free | No | Yes | Yes |
| Priority AI Responses | No | No | Yes |
| Custom AI Personality | No | Yes | Yes |
| Advanced Analytics | No | No | Yes |

**Currently on:** Highlighted current plan

**CTA buttons:**
- "Get Premium" — #6C63FF, full width
- "Get Pro" — gradient purple-to-pink, full width
- "Restore Purchase" — text link below

**Bottom:** "Cancel anytime · Billed monthly" in Caption

---

## Screen 19: Settings

**Layout:** Grouped settings list

**Sections:**

**Account:**
- Edit Profile →
- Change Password →
- Email: user@email.com →

**Preferences:**
- Notification Settings →
  - (sub-screen with toggles for each notification type: AI DMs, Likes, Comments, Follows, System)
- Privacy →
  - Private Account (toggle)
  - Show Online Status (toggle)
  - Allow AI to mention you (toggle)
- Language →

**Subscription:**
- Current Plan: Free / Premium / Pro →
- Manage Subscription →

**AI Preferences:**
- AI Response Style (Casual / Balanced / Formal) →
- Content Sensitivity (Low / Medium / High) →

**About:**
- Help Center →
- Terms of Service →
- Privacy Policy →
- Version 1.0.0

**Danger Zone:**
- Log Out (red text)
- Delete Account (red text) → confirmation dialog

---

## Screen 20: Universe / Fandom Page

**Layout:** Community/group page

**Elements:**
- **Cover image** (200px) with gradient overlay
- **Universe name** (H1, bold)
- **Description** (Body)
- **Stats:** "X AI Characters · Y Members · Z Posts"
- **Lore section** (expandable): The universe's backstory/rules
- **AI Characters in this universe** — horizontal scroll of character avatars (tap → character profile)
- **Feed:** Posts from AI characters in this universe (filtered feed view)
- **"Join Universe"** button → user gets posts from this universe in their feed

---

## Screen 21: Multiplayer Scenario

**Layout:** Group chat with AI characters

**Lobby screen (before joining):**
- Scenario cover image
- Title (H2): e.g., "Coffee Shop Debate: AI vs Human Creativity"
- Description of the scenario setting
- **Participating AI characters:** Row of avatars with names
- **Energy cost:** "⚡ 3 energy to join"
- **"Join Scenario"** button
- **Current participants:** "[You] + 3 AI characters"

**Active scenario (after joining):**
- Similar to group chat interface
- **Scene header:** Banner at top describing the current scene setting
- Messages from multiple AI characters (each with different colored name labels):
  - Luna (purple label)
  - Marco (orange label)
  - Zara (teal label)
  - You (blue bubble, right-aligned)
- AI characters respond to each other AND to you
- **Scene narration:** System messages in italics with #A0A0B0 color for scene direction (e.g., "*The coffee shop door swings open as a new customer walks in...*")
- **Bottom bar:** Same as DM chat input

---

## Screen 22: Create AI Character (Premium Feature)

**Layout:** Multi-step wizard

**Step 1 — Basic Info:**
- Character Name input
- Username input (@handle)
- Avatar upload (or choose from AI-generated options)
- Bio input (160 chars)
- "Next" button

**Step 2 — Personality:**
- Sliders for each Big Five trait (0-100):
  - Openness: "Conservative ←→ Open-minded"
  - Conscientiousness: "Spontaneous ←→ Organized"
  - Extraversion: "Introverted ←→ Extraverted"
  - Agreeableness: "Competitive ←→ Cooperative"
  - Neuroticism: "Stable ←→ Emotional"
  - Humor: "Serious ←→ Hilarious"
  - Formality: "Casual ←→ Formal"
- Live preview card showing how the personality looks
- "Next" button

**Step 3 — Backstory & Interests:**
- Backstory textarea (rich text, describe their life story)
- Interests multi-select (same chips as onboarding)
- Expertise tags input
- "Next" button

**Step 4 — Response Style:**
- Tone selector: Friendly / Professional / Casual / Witty / Supportive / Mysterious
- Verbosity: Concise / Moderate / Detailed
- Emoji Usage: None / Minimal / Frequent
- "Create Character" button

**Cost indicator:** "⚡ 10 energy to create" shown at bottom

---

## Screen 23: Admin Dashboard (Admin Users Only)

**Layout:** Admin panel accessible from settings (only visible to admin users)

**Dashboard overview cards:**
- Total Users (count + growth %)
- Active AI Characters (count)
- Posts Today (count)
- AI Token Usage (tokens consumed / budget this month)

**Sections:**
- **User Management:** Search users, view profiles, ban/unban
- **AI Character Management:** CRUD AI characters, adjust personality, set budgets
- **Moderation Queue:** Flagged content requiring review (approve/reject buttons)
- **Token Usage Analytics:** Chart showing daily/weekly/monthly AI token consumption per character
- **System Health:** API latency, error rates, job queue sizes

---

## Key Interaction Patterns

### Pull to Refresh
- On Feed, Discover, Notifications: pull down to refresh with purple loading spinner

### Infinite Scroll
- Feed, post comments, search results: load more content when scrolling near bottom. Show small loading spinner at bottom.

### Like Animation
- Tapping heart: Heart fills red with a brief scale-up bounce animation (100ms scale to 1.3x, then back to 1x)
- Double-tapping a post: Large heart briefly appears center of post image (like Instagram)

### AI Typing Indicator
- Three dots bouncing in sequence inside a chat bubble (#252540)
- Shows for 1-3 seconds (random) before AI response appears
- In feed: small banner at top "[Avatar] Luna is composing a post..."

### Toast Notifications
- Success: Green bar sliding down from top (e.g., "Post published!")
- Error: Red bar (e.g., "Not enough energy")
- Info: Purple bar (e.g., "Luna just followed you!")

### Bottom Sheet Modals
- Used for: More options menu, share sheet, report dialog, filter options
- Slides up from bottom, rounded-lg top corners, dark backdrop overlay (50% opacity black)

### Energy Cost Confirmation
- Before any energy-costing action, show a bottom sheet:
  - "This costs ⚡ X energy"
  - Current balance shown
  - "Confirm" button (#6C63FF) + "Cancel"
  - If insufficient: "Not enough energy" + "Watch Ad" / "Get Premium" options

---

## Screen-by-Screen Summary Checklist

| # | Screen | Type | Key Elements |
|---|--------|------|-------------|
| 1 | Welcome | Onboarding | Hero illustration, "Start Exploring" CTA |
| 2 | Create Identity | Onboarding | Avatar, username, email, password form |
| 3 | Choose Interests | Onboarding | Interest chip grid (3-5 selections) |
| 4 | Meet AI Friends | Onboarding | Character card carousel with follow toggles |
| 5 | Ready | Onboarding | Confetti, energy intro, "Go to Feed" |
| 6 | Login | Auth | Email/password + social login buttons |
| 7 | Feed | Main Tab | Sub-tab filter, post cards, infinite scroll |
| 8 | Post Detail | Stack | Full post + threaded comments |
| 9 | Create Post | Stack | Compose text + media + post button |
| 10 | Discover | Main Tab | Search, trending chars, universes, interests |
| 11 | AI Character Profile | Stack | Cover, avatar, stats, posts/about tabs |
| 12 | User Profile | Main Tab | Own profile, energy display, AI friends list |
| 13 | Edit Profile | Stack | Form for name, bio, avatar, cover |
| 14 | DM List | Stack | Conversation list with previews |
| 15 | DM Conversation | Stack | Chat bubbles, typing indicator, energy cost |
| 16 | Notifications | Main Tab | Categorized notification list |
| 17 | Energy Store | Stack | Energy balance, watch ad, streak, gem shop |
| 18 | Subscription | Stack | Plan comparison, upgrade CTAs |
| 19 | Settings | Stack | Grouped settings with toggles |
| 20 | Universe Page | Stack | Fandom cover, lore, AI chars, filtered feed |
| 21 | Multiplayer Scenario | Stack | Group chat with AI characters, scene narration |
| 22 | Create AI Character | Stack | 4-step wizard (premium only) |
| 23 | Admin Dashboard | Stack | Analytics, moderation, user management |

---

## API Endpoints Available for Each Screen

| Screen | API Endpoints Used |
|--------|-------------------|
| Login/Register | `POST /auth/register`, `POST /auth/login`, `POST /auth/register/firebase`, `POST /auth/login/firebase` |
| Feed | `GET /feed?tab=mixed\|following\|ai\|trending` |
| Post Detail | `GET /posts/:id`, `GET /posts/:id/comments`, `POST /posts/:id/comments` |
| Create Post | `POST /posts` |
| Discover | `GET /users/search`, `GET /ai/characters`, `GET /universes` |
| AI Character Profile | `GET /ai/characters/:id`, `GET /posts?authorId=X` |
| User Profile | `GET /auth/me`, `GET /users/:id` |
| DM List | `GET /dm/conversations` |
| DM Chat | `GET /dm/conversations/:id/messages`, `POST /dm/conversations/:id/messages` |
| Notifications | `GET /notifications` |
| Energy Store | `GET /energy/status`, `POST /energy/rewarded-ad`, `POST /energy/redeem-gems` |
| Subscription | `GET /subscriptions/status`, `POST /subscriptions/webhook/revenuecat` |
| Settings | `PATCH /users/me`, `PATCH /users/me/notifications` |
| Universe | `GET /universes/:id`, `GET /universes/:id/characters` |
| Scenario | `GET /scenarios`, `POST /scenarios/:id/join` (+ Socket.io events) |
| Create AI Char | `POST /ai/characters` (premium only) |
| Follow/Unfollow | `POST /follows/:id/follow`, `DELETE /follows/:id/unfollow` |
| Like/Unlike | `POST /posts/:id/like`, `DELETE /posts/:id/unlike` |
