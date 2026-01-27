
# Block-Based Content System Documentation

## Overview

This application implements a scalable, secure block-based content system for posts. Posts are composed of ordered content blocks rather than a single text field, allowing for rich, mixed-media content.

## Database Schema

### Tables

#### `posts`
Stores post metadata and access control.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `title` | TEXT | Post title |
| `cover_image` | TEXT | URL to cover image (stored in Supabase Storage) |
| `is_published` | BOOLEAN | Whether the post is published |
| `visibility` | TEXT | Access control: `public` or `contract_only` |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

#### `post_blocks`
Stores individual content blocks for each post.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `post_id` | UUID | Foreign key to `posts.id` (CASCADE DELETE) |
| `type` | TEXT | Block type: `text`, `image`, `gallery`, `html`, `map` |
| `data` | JSONB | Block-specific content |
| `order` | INTEGER | Display order (ascending) |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

#### `users` (updated)
Added `has_contract` field for access control.

| Column | Type | Description |
|--------|------|-------------|
| `has_contract` | BOOLEAN | Whether user has an active contract |

## Block Types

### 1. Text Block (`type: 'text'`)
Rich HTML text content.

**Data Structure:**
```json
{
  "html": "<h2>Title</h2><p>Content with <strong>formatting</strong></p>"
}
```

### 2. Image Block (`type: 'image'`)
Single image with optional caption.

**Data Structure:**
```json
{
  "url": "https://images.unsplash.com/photo-...",
  "caption": "Image description"
}
```

### 3. Gallery Block (`type: 'gallery'`)
Horizontal scrolling image gallery.

**Data Structure:**
```json
{
  "images": [
    {
      "url": "https://images.unsplash.com/photo-1...",
      "caption": "First image"
    },
    {
      "url": "https://images.unsplash.com/photo-2...",
      "caption": "Second image"
    }
  ]
}
```

### 4. HTML Block (`type: 'html'`)
Custom HTML/CSS for widgets, embeds, or styled content.

**Data Structure:**
```json
{
  "content": "<div style='background: blue; padding: 20px;'>Custom HTML</div>"
}
```

### 5. Map Block (`type: 'map'`)
Location information (note: react-native-maps not supported in Natively).

**Data Structure:**
```json
{
  "latitude": 32.0853,
  "longitude": 34.7818,
  "address": "Tel Aviv, Israel"
}
```

## Access Control (RLS Policies)

### Public Posts
- Visible to all users (authenticated or not)
- `visibility = 'public'` AND `is_published = true`

### Contract-Only Posts
- Visible only to users with `has_contract = true`
- `visibility = 'contract_only'` AND `is_published = true`
- Requires authentication

### RLS Implementation
Row Level Security policies automatically filter posts and blocks based on:
1. Publication status (`is_published`)
2. Visibility setting
3. User's contract status (`has_contract`)

## Frontend Architecture

### Components

#### Block Renderers
Located in `components/blocks/`:

- **TextBlock.tsx** - Renders HTML text using WebView
- **ImageBlock.tsx** - Displays single image with caption
- **GalleryBlock.tsx** - Horizontal scrolling gallery
- **HtmlBlock.tsx** - Renders custom HTML/CSS
- **MapBlock.tsx** - Shows location info (placeholder for maps)
- **BlockRenderer.tsx** - Main renderer that switches on block type

### Screens

#### Home Screen (`app/(tabs)/(home)/index.tsx`)
- Lists all accessible posts
- Shows cover image and title
- Displays visibility badge (Public/Contract Only)
- Taps navigate to post detail

#### Post Detail Screen (`app/post/[id].tsx`)
- Displays full post with all blocks
- Renders blocks in order
- Shows cover image at top
- Pull-to-refresh support

### API Functions

Located in `utils/api.ts`:

```typescript
// Fetch all accessible posts (RLS filters automatically)
api.getPosts(hasContract?: boolean): Promise<Post[]>

// Fetch single post by ID
api.getPostById(postId: string): Promise<Post | null>

// Fetch blocks for a post
api.getPostBlocks(postId: string): Promise<PostBlock[]>

// Fetch post with all blocks
api.getPostWithBlocks(postId: string): Promise<Post | null>
```

## Example Data

### Creating a Post with Blocks

```sql
-- Insert post
INSERT INTO posts (id, title, cover_image, is_published, visibility) 
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Welcome Guide',
  'https://images.unsplash.com/photo-123',
  true,
  'public'
);

-- Insert text block
INSERT INTO post_blocks (post_id, type, data, "order") 
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'text',
  '{"html": "<h2>Welcome</h2><p>This is the introduction.</p>"}',
  1
);

-- Insert image block
INSERT INTO post_blocks (post_id, type, data, "order") 
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'image',
  '{"url": "https://images.unsplash.com/photo-456", "caption": "Our team"}',
  2
);

-- Insert gallery block
INSERT INTO post_blocks (post_id, type, data, "order") 
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'gallery',
  '{"images": [{"url": "https://...", "caption": "Image 1"}, {"url": "https://...", "caption": "Image 2"}]}',
  3
);
```

## Query Examples

### Fetch Post with Blocks

```sql
-- Get post
SELECT * FROM posts 
WHERE id = '11111111-1111-1111-1111-111111111111' 
AND is_published = true;

-- Get blocks (ordered)
SELECT * FROM post_blocks 
WHERE post_id = '11111111-1111-1111-1111-111111111111' 
ORDER BY "order" ASC;
```

### Check User Access

```sql
-- Check if user can view contract-only posts
SELECT has_contract FROM users WHERE id = auth.uid();
```

## Image Storage

- All images MUST be stored in Supabase Storage
- Database stores only URLs (TEXT fields)
- Never store binary data in the database
- Use Supabase Storage buckets for uploads

## Security Features

1. **Row Level Security (RLS)** - Automatic filtering at database level
2. **Cascade Delete** - Deleting a post automatically deletes its blocks
3. **Type Validation** - CHECK constraints on `type` and `visibility` fields
4. **Authentication Required** - Contract-only posts require auth.uid()

## Frontend Rendering Rules

1. Fetch post and blocks from API
2. Sort blocks by `order` field (ascending)
3. Switch on `block.type` to render appropriate component
4. Each block type has dedicated UI component
5. Handle errors gracefully with fallback UI

## Atomic JSX Compliance

All components follow atomic JSX rules:
- One variable per `<Text>` component
- No logic in JSX (pre-calculate in function body)
- No complex ternaries (extract to variables)
- Image sources resolved via `resolveImageSource()` helper

## Example Frontend Usage

```typescript
// Fetch post with blocks
const post = await api.getPostWithBlocks(postId);

// Render blocks
{post.blocks?.map((block) => (
  <BlockRenderer key={block.id} block={block} />
))}
```

## Testing the System

1. **Public Post** - Should be visible to all users
2. **Contract-Only Post** - Should only be visible to users with `has_contract = true`
3. **Block Ordering** - Blocks should render in order specified by `order` field
4. **Mixed Content** - Posts can contain any combination of block types

## Future Enhancements

- Admin interface for creating/editing posts
- Image upload to Supabase Storage
- Video block type
- Audio block type
- Code block with syntax highlighting
- Quote block
- Divider/spacer blocks
- Embed blocks (YouTube, Twitter, etc.)
