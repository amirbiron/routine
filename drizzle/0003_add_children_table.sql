-- טבלת ילדים — הורה אחד יכול לנהל כמה ילדים
CREATE TABLE `children` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `avatarColor` varchar(20) NOT NULL DEFAULT 'coral',
  `sortOrder` int NOT NULL DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `children_id` PRIMARY KEY(`id`)
);

-- הוספת childId לטבלאות קיימות (nullable לתאימות אחורה)
ALTER TABLE `activities` ADD `childId` int;
ALTER TABLE `schedules` ADD `childId` int;
ALTER TABLE `reflections` ADD `childId` int;
ALTER TABLE `tokenEvents` ADD `childId` int;

-- מיגרציית נתונים: יצירת ילד ברירת מחדל לכל משתמש קיים עם childName
INSERT INTO `children` (`userId`, `name`, `avatarColor`, `sortOrder`)
SELECT `id`, COALESCE(`childName`, 'ילד/ה'), 'coral', 0
FROM `users`
WHERE `onboardingDone` = 1;

-- עדכון childId בטבלאות הקיימות לפי userId
UPDATE `activities` a
INNER JOIN `children` c ON a.userId = c.userId
SET a.childId = c.id
WHERE a.childId IS NULL;

UPDATE `schedules` s
INNER JOIN `children` c ON s.userId = c.userId
SET s.childId = c.id
WHERE s.childId IS NULL;

UPDATE `reflections` r
INNER JOIN `children` c ON r.userId = c.userId
SET r.childId = c.id
WHERE r.childId IS NULL;

UPDATE `tokenEvents` t
INNER JOIN `children` c ON t.userId = c.userId
SET t.childId = c.id
WHERE t.childId IS NULL;
