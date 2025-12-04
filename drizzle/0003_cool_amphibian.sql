ALTER TABLE `users` ADD `searchLimitWarningToday` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `trialExpiryWarningSent` boolean DEFAULT false NOT NULL;