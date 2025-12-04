ALTER TABLE `users` ADD `dailySearchCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `lastSearchResetDate` timestamp DEFAULT (now()) NOT NULL;