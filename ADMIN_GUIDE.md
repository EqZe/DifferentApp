
# Admin Guide - Managing Block-Based Content

## Overview

This guide explains how to create and manage block-based posts through the Supabase database interface.

## Accessing the Database

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `pgrcmurwamszgjsdbgtq`
3. Navigate to **SQL Editor** or **Table Editor**

## Creating a New Post

### Step 1: Create the Post

```sql
INSERT INTO posts (title, cover_image, is_published, visibility) 
VALUES (
  'כותרת הפוסט שלך',
  'https://images.unsplash.com/photo-1234567890?w=800',
  true,  -- false for draft
  'public'  -- or 'contract_only'
) RETURNING id;
```

**Copy the returned `id` for the next steps.**

### Step 2: Add Content Blocks

Replace `<POST_ID>` with the ID from Step 1.

#### Text Block (Rich HTML)

```sql
INSERT INTO post_blocks (post_id, type, data, "order") 
VALUES (
  '<POST_ID>',
  'text',
  '{"html": "<h2>כותרת</h2><p>תוכן הטקסט שלך עם <strong>הדגשות</strong> ו<em>נטיות</em>.</p><ul><li>פריט 1</li><li>פריט 2</li></ul>"}',
  1  -- Order: 1 = first block
);
```

**Supported HTML Tags:**
- `<h1>`, `<h2>`, `<h3>` - Headers
- `<p>` - Paragraphs
- `<strong>`, `<b>` - Bold
- `<em>`, `<i>` - Italic
- `<ul>`, `<ol>`, `<li>` - Lists
- `<a href="...">` - Links

#### Image Block

```sql
INSERT INTO post_blocks (post_id, type, data, "order") 
VALUES (
  '<POST_ID>',
  'image',
  '{"url": "https://images.unsplash.com/photo-1234567890?w=800", "caption": "תיאור התמונה"}',
  2  -- Order: 2 = second block
);
```

**Image Sources:**
- Use Unsplash: `https://images.unsplash.com/photo-...`
- Or upload to Supabase Storage and use the URL

#### Gallery Block (Multiple Images)

```sql
INSERT INTO post_blocks (post_id, type, data, "order") 
VALUES (
  '<POST_ID>',
  'gallery',
  '{
    "images": [
      {"url": "https://images.unsplash.com/photo-1?w=400", "caption": "תמונה 1"},
      {"url": "https://images.unsplash.com/photo-2?w=400", "caption": "תמונה 2"},
      {"url": "https://images.unsplash.com/photo-3?w=400", "caption": "תמונה 3"}
    ]
  }',
  3  -- Order: 3 = third block
);
```

#### HTML Block (Custom Styling)

```sql
INSERT INTO post_blocks (post_id, type, data, "order") 
VALUES (
  '<POST_ID>',
  'html',
  '{
    "content": "<div style=\"background: linear-gradient(135deg, #2784F5 0%, #1a5fb8 100%); padding: 20px; border-radius: 12px; color: white; text-align: center;\"><h3 style=\"margin: 0 0 10px 0;\">💡 טיפ חשוב</h3><p style=\"margin: 0;\">תוכן מותאם אישית עם עיצוב מיוחד</p></div>"
  }',
  4  -- Order: 4 = fourth block
);
```

**Use Cases:**
- Highlighted tips/warnings
- Call-to-action boxes
- Custom styled sections
- Embedded widgets

#### Map Block (Location Info)

```sql
INSERT INTO post_blocks (post_id, type, data, "order") 
VALUES (
  '<POST_ID>',
  'map',
  '{"latitude": 32.0853, "longitude": 34.7818, "address": "תל אביב, ישראל"}',
  5  -- Order: 5 = fifth block
);
```

**Note:** Maps display as placeholder (react-native-maps not supported).

## Managing Posts

### Publish/Unpublish a Post

```sql
-- Publish
UPDATE posts SET is_published = true WHERE id = '<POST_ID>';

-- Unpublish (hide from users)
UPDATE posts SET is_published = false WHERE id = '<POST_ID>';
```

### Change Post Visibility

```sql
-- Make public (visible to all)
UPDATE posts SET visibility = 'public' WHERE id = '<POST_ID>';

-- Make contract-only (visible only to users with contract)
UPDATE posts SET visibility = 'contract_only' WHERE id = '<POST_ID>';
```

### Update Post Title

```sql
UPDATE posts 
SET title = 'כותרת חדשה' 
WHERE id = '<POST_ID>';
```

### Update Cover Image

```sql
UPDATE posts 
SET cover_image = 'https://images.unsplash.com/photo-NEW?w=800' 
WHERE id = '<POST_ID>';
```

### Delete a Post

```sql
-- This will automatically delete all blocks (CASCADE)
DELETE FROM posts WHERE id = '<POST_ID>';
```

## Managing Blocks

### Update Block Content

```sql
-- Update text block
UPDATE post_blocks 
SET data = '{"html": "<h2>תוכן מעודכן</h2><p>טקסט חדש</p>"}'
WHERE id = '<BLOCK_ID>';

-- Update image block
UPDATE post_blocks 
SET data = '{"url": "https://new-image.jpg", "caption": "כיתוב חדש"}'
WHERE id = '<BLOCK_ID>';
```

### Reorder Blocks

```sql
-- Change block order
UPDATE post_blocks SET "order" = 1 WHERE id = '<BLOCK_ID_1>';
UPDATE post_blocks SET "order" = 2 WHERE id = '<BLOCK_ID_2>';
UPDATE post_blocks SET "order" = 3 WHERE id = '<BLOCK_ID_3>';
```

### Delete a Block

```sql
DELETE FROM post_blocks WHERE id = '<BLOCK_ID>';
```

### Add Block to Existing Post

```sql
INSERT INTO post_blocks (post_id, type, data, "order") 
VALUES (
  '<POST_ID>',
  'text',
  '{"html": "<p>בלוק חדש</p>"}',
  10  -- Use high number to add at end
);
```

## Managing User Access

### Grant Contract Access

```sql
-- Give user access to contract-only posts
UPDATE users 
SET has_contract = true 
WHERE phone_number = '+972501234567';
```

### Revoke Contract Access

```sql
-- Remove access to contract-only posts
UPDATE users 
SET has_contract = false 
WHERE phone_number = '+972501234567';
```

### Check User Status

```sql
SELECT 
  full_name,
  phone_number,
  has_signed_agreement,
  has_contract
FROM users
ORDER BY created_at DESC;
```

## Useful Queries

### List All Posts

```sql
SELECT 
  id,
  title,
  visibility,
  is_published,
  created_at
FROM posts
ORDER BY created_at DESC;
```

### View Post with Block Count

```sql
SELECT 
  p.id,
  p.title,
  p.visibility,
  p.is_published,
  COUNT(pb.id) as block_count
FROM posts p
LEFT JOIN post_blocks pb ON pb.post_id = p.id
GROUP BY p.id
ORDER BY p.created_at DESC;
```

### View All Blocks for a Post

```sql
SELECT 
  id,
  type,
  "order",
  data
FROM post_blocks
WHERE post_id = '<POST_ID>'
ORDER BY "order" ASC;
```

### Find Posts by Visibility

```sql
-- Public posts
SELECT * FROM posts WHERE visibility = 'public' AND is_published = true;

-- Contract-only posts
SELECT * FROM posts WHERE visibility = 'contract_only' AND is_published = true;
```

### Find Users with Contract

```sql
SELECT 
  full_name,
  phone_number,
  has_contract
FROM users
WHERE has_contract = true;
```

## Best Practices

### 1. Content Organization
- Use clear, descriptive titles
- Start with text block for introduction
- Use images to break up long text
- End with call-to-action or summary

### 2. Block Ordering
- Use increments of 10 (10, 20, 30) for easy reordering
- Leave gaps to insert blocks later
- Keep related content together

### 3. Images
- Use high-quality images (800px+ width)
- Always add captions for context
- Use Unsplash for free stock photos
- Compress images before uploading

### 4. HTML Content
- Keep HTML simple and clean
- Test on mobile devices
- Use inline styles (external CSS not supported)
- Ensure RTL (right-to-left) support for Hebrew

### 5. Access Control
- Default to `public` for general content
- Use `contract_only` for premium/exclusive content
- Keep unpublished posts as drafts (`is_published = false`)
- Review user contract status regularly

## Common Workflows

### Creating a Complete Guide Post

```sql
-- 1. Create post
INSERT INTO posts (title, cover_image, is_published, visibility) 
VALUES ('מדריך מקיף', 'https://...', true, 'contract_only')
RETURNING id;

-- 2. Introduction
INSERT INTO post_blocks (post_id, type, data, "order") 
VALUES ('<POST_ID>', 'text', '{"html": "<h2>ברוכים הבאים</h2><p>מבוא...</p>"}', 10);

-- 3. Main image
INSERT INTO post_blocks (post_id, type, data, "order") 
VALUES ('<POST_ID>', 'image', '{"url": "https://...", "caption": "..."}', 20);

-- 4. Step-by-step content
INSERT INTO post_blocks (post_id, type, data, "order") 
VALUES ('<POST_ID>', 'text', '{"html": "<h3>שלב 1</h3><p>...</p>"}', 30);

-- 5. Gallery of examples
INSERT INTO post_blocks (post_id, type, data, "order") 
VALUES ('<POST_ID>', 'gallery', '{"images": [...]}', 40);

-- 6. Important tip
INSERT INTO post_blocks (post_id, type, data, "order") 
VALUES ('<POST_ID>', 'html', '{"content": "<div style=...>💡 טיפ</div>"}', 50);
```

### Duplicating a Post

```sql
-- Copy post
INSERT INTO posts (title, cover_image, is_published, visibility)
SELECT 
  title || ' (עותק)',
  cover_image,
  false,  -- Start as draft
  visibility
FROM posts
WHERE id = '<ORIGINAL_POST_ID>'
RETURNING id;

-- Copy blocks
INSERT INTO post_blocks (post_id, type, data, "order")
SELECT 
  '<NEW_POST_ID>',
  type,
  data,
  "order"
FROM post_blocks
WHERE post_id = '<ORIGINAL_POST_ID>';
```

## Troubleshooting

### Post Not Showing in App

**Check:**
1. Is `is_published = true`?
2. Is user authenticated (for contract-only posts)?
3. Does user have `has_contract = true` (for contract-only posts)?

```sql
-- Verify post status
SELECT id, title, is_published, visibility FROM posts WHERE id = '<POST_ID>';

-- Verify user status
SELECT has_contract FROM users WHERE phone_number = '<PHONE>';
```

### Blocks Not Rendering

**Check:**
1. Are blocks linked to correct `post_id`?
2. Is `order` field set correctly?
3. Is `data` field valid JSON?

```sql
-- Verify blocks
SELECT * FROM post_blocks WHERE post_id = '<POST_ID>' ORDER BY "order";
```

### Image Not Loading

**Check:**
1. Is URL accessible?
2. Is URL HTTPS (not HTTP)?
3. Is image format supported (JPG, PNG, WebP)?

## Support

For technical issues or questions:
1. Check the documentation: `BLOCK_BASED_POSTS_README.md`
2. Review example queries: `EXAMPLE_QUERIES.md`
3. Check implementation details: `IMPLEMENTATION_SUMMARY.md`

## Quick Reference

### Block Types
- `text` - Rich HTML text
- `image` - Single image
- `gallery` - Multiple images
- `html` - Custom HTML/CSS
- `map` - Location info

### Visibility Options
- `public` - All users
- `contract_only` - Users with contract

### Post Status
- `is_published = true` - Visible
- `is_published = false` - Hidden (draft)

### User Access
- `has_contract = true` - Can view contract-only posts
- `has_contract = false` - Can only view public posts
