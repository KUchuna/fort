import { relations } from "drizzle-orm";
import { pgTable, serial, text, varchar, boolean, timestamp, integer, foreignKey, index, uuid } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  role: text("role").notNull().default("user"),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const obsession = pgTable("obsession", {
	id: serial().primaryKey().notNull(),
	description: text().notNull(),
});

export const todos = pgTable("todos", {
	id: serial().primaryKey().notNull(),
	title: varchar({ length: 255 }).notNull(),
	isCompleted: boolean("is_completed").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
});

export const images = pgTable("images", {
	id: serial().primaryKey().notNull(),
	url: text().notNull(),
	pathname: text().notNull(),
	title: varchar({ length: 255 }),
	altText: text("alt_text"),
	width: integer(),
	height: integer(),
	blurDataUrl: text("blur_data_url"),
	likesCount: integer("likes_count").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
});

export const comments = pgTable("comments", {
	id: serial().primaryKey().notNull(),
	imageId: integer("image_id"),
	userName: varchar("user_name", { length: 100 }).default('Guest'),
	content: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
			columns: [table.imageId],
			foreignColumns: [images.id],
			name: "comments_image_id_fkey"
		}).onDelete("cascade"),
]);

export const messages = pgTable("messages", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	text: text().notNull(),
	username: varchar({ length: 50 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_messages_created_at").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
]);

export const wishlistItem = pgTable("wishlist_item", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  url: text("url"),
  price: text("price"), // Using text for flexibility (e.g. "$50 approx")
  priority: text("priority").default("medium"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const timeEntries = pgTable("time_entries", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  clientId: text("client_id").references(() => clients.id, { onDelete: "cascade" }),
  description: text("description"), 
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  duration: integer("duration"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const workTasks = pgTable("work_tasks", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  clientId: text("client_id").references(() => clients.id, { onDelete: "cascade" }),
  priority: text("priority").default("medium"),
  status: text("status").notNull().default("to_request"),
  description: text("description"), 
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const workTodos = pgTable("work_todos", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  clientId: text("client_id").references(() => clients.id, { onDelete: "cascade" }),
  description: text("description"),
  dueDate: timestamp("due_date"),
  isCompleted: boolean("is_completed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const clients = pgTable("clients", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const commentsRelations = relations(comments, ({one}) => ({
  image: one(images, {
    fields: [comments.imageId],
    references: [images.id]
  }),
}));

export const imagesRelations = relations(images, ({many}) => ({
  comments: many(comments),
}));

export const clientRelations = relations(clients, ({ many }) => ({
  tasks: many(workTasks),
  todos: many(workTodos),
}));

export const tasksRelations = relations(workTasks, ({ one }) => ({
  client: one(clients, {
    fields: [workTasks.clientId],
    references: [clients.id],
  }),
}));

export const todosRelations = relations(workTodos, ({ one }) => ({
  client: one(clients, {
    fields: [workTodos.clientId],
    references: [clients.id],
  }),
}));

export const timeEntriesRelations = relations(timeEntries, ({ one }) => ({
  client: one(clients, {
    fields: [timeEntries.clientId],
    references: [clients.id],
  }),
}));