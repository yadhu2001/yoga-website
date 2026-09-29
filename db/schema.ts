import {sqliteTable,text,integer,index} from 'drizzle-orm/sqlite-core';
export const content=sqliteTable('content',{id:text('id').primaryKey(),type:text('type').notNull(),data:text('data').notNull(),published:integer('published').notNull().default(1),position:integer('position').notNull().default(0)},t=>[index('idx_content_type').on(t.type,t.position)]);
export const settings=sqliteTable('settings',{id:text('id').primaryKey(),data:text('data').notNull()});
export const admins=sqliteTable('admins',{id:text('id').primaryKey(),email:text('email').notNull()});
export const leads=sqliteTable('leads',{id:text('id').primaryKey(),name:text('name').notNull(),email:text('email').notNull(),phone:text('phone').notNull(),city:text('city'),type:text('type').notNull(),interest:text('interest'),message:text('message'),source:text('source'),status:text('status').notNull().default('New'),notification:text('notification').notNull().default('Not configured'),createdAt:integer('created_at').notNull()},t=>[index('idx_leads_created').on(t.createdAt)]);
export const rateLimits=sqliteTable('rate_limits',{id:text('id').primaryKey(),count:integer('count').notNull(),expires:integer('expires').notNull()});
export const downloads=sqliteTable('downloads',{id:text('id').primaryKey(),resource:text('resource').notNull(),expires:integer('expires').notNull()});
