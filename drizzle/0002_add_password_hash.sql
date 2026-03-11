ALTER TABLE `users` ADD `passwordHash` text;
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `openId` varchar(64) NULL;
--> statement-breakpoint
ALTER TABLE `users` ADD UNIQUE INDEX `users_email_unique` (`email`);
