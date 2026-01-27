
# Example Queries for Block-Based Content System

## Fetching Posts

### Get All Published Posts (with RLS filtering)
```typescript
// Frontend API call
const posts = await api.getPosts(user?.hasContract);

// This executes:
// SELECT * FROM posts WHERE is_published = true ORDER BY created_at DESC
// RLS automatically filters based on visibility and user's has_contract status
```

### Get Single Post with Blocks
```typescript
// Frontend API call
const post = await api.getPostWithBlocks(postId);

// This executes two queries:
// 1. SELECT * FROM posts WHERE id = ? AND is_published = true
// 2. SELECT * FROM post_blocks WHERE post_id = ? ORDER BY "order" ASC
```

## SQL Examples

### Insert a Complete Post

```sql
-- Step 1: Insert the post
INSERT INTO posts (id, title, cover_image, is_published, visibility) 
VALUES (
  gen_random_uuid(),
  'מדריך שלם ליבוא מסין',
  'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=800',
  true,
  'contract_only'
) RETURNING id;

-- Step 2: Insert text block
INSERT INTO post_blocks (post_id, type, data, "order") 
VALUES (
  '<post_id_from_step_1>',
  'text',
  '{"html": "<h2>ברוכים הבאים</h2><p>זהו מדריך מקיף ליבוא אישי מסין.</p>"}',
  1
);

-- Step 3: Insert image block
INSERT INTO post_blocks (post_id, type, data, "order") 
VALUES (
  '<post_id_from_step_1>',
  'image',
  '{"url": "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800", "caption": "תהליך היבוא"}',
  2
);

-- Step 4: Insert gallery block
INSERT INTO post_blocks (post_id, type, data, "order") 
VALUES (
  '<post_id_from_step_1>',
  'gallery',
  '{"images": [
    {"url": "https://images.unsplash.com/photo-1560185127-6a7e6c5c3c3f?w=400", "caption": "שלב 1"},
    {"url": "https://images.unsplash.com/photo-1560185009-dddeb820c7b7?w=400", "caption": "שלב 2"},
    {"url": "https://images.unsplash.com/photo-1560185008-b033106af5c3?w=400", "caption": "שלב 3"}
  ]}',
  3
);

-- Step 5: Insert HTML block with custom styling
INSERT INTO post_blocks (post_id, type, data, "order") 
VALUES (
  '<post_id_from_step_1>',
  'html',
  '{"content": "<div style=\"background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 12px; color: white; text-align: center;\"><h3 style=\"margin: 0 0 10px 0;\">💡 טיפ חשוב</h3><p style=\"margin: 0;\">תמיד שמרו את כל המסמכים במקום בטוח</p></div>"}',
  4
);
```

### Query Posts with Block Count

```sql
SELECT 
  p.id,
  p.title,
  p.cover_image,
  p.visibility,
  p.created_at,
  COUNT(pb.id) as block_count
FROM posts p
LEFT JOIN post_blocks pb ON pb.post_id = p.id
WHERE p.is_published = true
GROUP BY p.id
ORDER BY p.created_at DESC;
```

### Get All Blocks for a Post (Ordered)

```sql
SELECT 
  id,
  type,
  data,
  "order"
FROM post_blocks
WHERE post_id = '11111111-1111-1111-1111-111111111111'
ORDER BY "order" ASC;
```

### Update Post Visibility

```sql
-- Make a post contract-only
UPDATE posts 
SET visibility = 'contract_only'
WHERE id = '11111111-1111-1111-1111-111111111111';

-- Make a post public
UPDATE posts 
SET visibility = 'public'
WHERE id = '11111111-1111-1111-1111-111111111111';
```

### Reorder Blocks

```sql
-- Update block order
UPDATE post_blocks 
SET "order" = 1
WHERE id = '<block_id_1>';

UPDATE post_blocks 
SET "order" = 2
WHERE id = '<block_id_2>';

UPDATE post_blocks 
SET "order" = 3
WHERE id = '<block_id_3>';
```

### Delete a Post (Cascade Deletes Blocks)

```sql
-- This will automatically delete all associated blocks
DELETE FROM posts 
WHERE id = '11111111-1111-1111-1111-111111111111';
```

### Grant Contract Access to User

```sql
-- Give user access to contract-only posts
UPDATE users 
SET has_contract = true
WHERE phone_number = '+972501234567';

-- Revoke contract access
UPDATE users 
SET has_contract = false
WHERE phone_number = '+972501234567';
```

## Testing RLS Policies

### Test as Anonymous User (Public Posts Only)

```sql
-- Set role to anonymous
SET ROLE anon;

-- Should only see public posts
SELECT * FROM posts WHERE is_published = true;

-- Should only see blocks from public posts
SELECT * FROM post_blocks;
```

### Test as User Without Contract

```sql
-- Simulate user without contract
SET request.jwt.claims TO '{"sub": "user-id-123"}';

-- Assuming user has has_contract = false
-- Should only see public posts
SELECT * FROM posts WHERE is_published = true;
```

### Test as User With Contract

```sql
-- Simulate user with contract
SET request.jwt.claims TO '{"sub": "user-id-456"}';

-- Assuming user has has_contract = true
-- Should see both public and contract_only posts
SELECT * FROM posts WHERE is_published = true;
```

## Block Data Examples

### Text Block with Rich Formatting

```json
{
  "html": "<h2>כותרת ראשית</h2><p>פסקה עם <strong>טקסט מודגש</strong> ו<em>טקסט נטוי</em>.</p><ul><li>פריט ראשון</li><li>פריט שני</li><li>פריט שלישי</li></ul>"
}
```

### Image Block with Caption

```json
{
  "url": "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800",
  "caption": "תמונה מקצועית עם כיתוב"
}
```

### Gallery Block with Multiple Images

```json
{
  "images": [
    {
      "url": "https://images.unsplash.com/photo-1?w=400",
      "caption": "תמונה ראשונה"
    },
    {
      "url": "https://images.unsplash.com/photo-2?w=400",
      "caption": "תמונה שנייה"
    },
    {
      "url": "https://images.unsplash.com/photo-3?w=400",
      "caption": "תמונה שלישית"
    }
  ]
}
```

### HTML Block with Custom Styling

```json
{
  "content": "<div style='background: #2784F5; color: white; padding: 20px; border-radius: 12px; text-align: center;'><h3>הודעה חשובה</h3><p>זהו תוכן מותאם אישית עם עיצוב מיוחד</p></div>"
}
```

### Map Block with Location

```json
{
  "latitude": 32.0853,
  "longitude": 34.7818,
  "address": "תל אביב, ישראל"
}
```

## Performance Optimization

### Index for Fast Block Retrieval

```sql
-- Already created in migration
CREATE INDEX idx_post_blocks_post_id_order 
ON post_blocks(post_id, "order");
```

### Query with Limit

```sql
-- Get latest 10 posts
SELECT * FROM posts 
WHERE is_published = true 
ORDER BY created_at DESC 
LIMIT 10;
```

## Common Patterns

### Create Post with Multiple Block Types

```typescript
// 1. Create the post
const { data: post } = await supabase
  .from('posts')
  .insert({
    title: 'מדריך חדש',
    cover_image: 'https://...',
    is_published: true,
    visibility: 'public'
  })
  .select()
  .single();

// 2. Create blocks
const blocks = [
  { type: 'text', data: { html: '<h2>כותרת</h2>' }, order: 1 },
  { type: 'image', data: { url: 'https://...', caption: 'תמונה' }, order: 2 },
  { type: 'gallery', data: { images: [...] }, order: 3 }
];

await supabase
  .from('post_blocks')
  .insert(blocks.map(b => ({ ...b, post_id: post.id })));
```

### Update Block Content

```typescript
await supabase
  .from('post_blocks')
  .update({
    data: { html: '<h2>תוכן מעודכן</h2><p>טקסט חדש</p>' }
  })
  .eq('id', blockId);
```

### Duplicate a Post

```sql
-- Copy post
INSERT INTO posts (title, cover_image, is_published, visibility)
SELECT 
  title || ' (עותק)',
  cover_image,
  false, -- Start as draft
  visibility
FROM posts
WHERE id = '<original_post_id>'
RETURNING id;

-- Copy blocks
INSERT INTO post_blocks (post_id, type, data, "order")
SELECT 
  '<new_post_id>',
  type,
  data,
  "order"
FROM post_blocks
WHERE post_id = '<original_post_id>';
```
