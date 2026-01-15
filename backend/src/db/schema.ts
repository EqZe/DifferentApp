import { pgTable, uuid, text, timestamp, boolean, date, integer } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  fullName: text('full_name').notNull(),
  city: text('city').notNull(),
  phoneNumber: text('phone_number').notNull().unique(),
  hasSignedAgreement: boolean('has_signed_agreement').notNull().default(false),
  travelDate: date('travel_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const posts = pgTable('posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  imageUrl: text('image_url'),
  videoUrl: text('video_url'),
  buttonText: text('button_text'),
  buttonLink: text('button_link'),
  isPreAgreement: boolean('is_pre_agreement').notNull().default(true),
  orderIndex: integer('order_index').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  dueDate: date('due_date').notNull(),
  isCompleted: boolean('is_completed').notNull().default(false),
  reminderSent: boolean('reminder_sent').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
