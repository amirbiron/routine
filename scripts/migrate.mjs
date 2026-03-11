// סקריפט מיגרציה ישיר — יוצר/מעדכן טבלאות בלי TUI אינטראקטיבי
import mysql from "mysql2/promise";

const conn = await mysql.createConnection(process.env.DATABASE_URL);

const statements = [
  // users — הוספת עמודות חדשות + unique constraint
  `ALTER TABLE users ADD COLUMN email varchar(320)`,
  `ALTER TABLE users ADD COLUMN passwordHash text`,
  `ALTER TABLE users ADD COLUMN loginMethod varchar(64)`,
  `ALTER TABLE users ADD COLUMN tokenBalance int NOT NULL DEFAULT 0`,
  `ALTER TABLE users ADD UNIQUE INDEX users_email_unique (email)`,

  // pushSubscriptions
  `CREATE TABLE IF NOT EXISTS pushSubscriptions (
    id int AUTO_INCREMENT PRIMARY KEY,
    userId int NOT NULL,
    endpoint text NOT NULL,
    p256dh text NOT NULL,
    auth text NOT NULL,
    createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,

  // reminderSettings
  `CREATE TABLE IF NOT EXISTS reminderSettings (
    id int AUTO_INCREMENT PRIMARY KEY,
    userId int NOT NULL,
    morningEnabled boolean NOT NULL DEFAULT false,
    morningTime varchar(5) NOT NULL DEFAULT '08:00',
    eveningEnabled boolean NOT NULL DEFAULT false,
    eveningTime varchar(5) NOT NULL DEFAULT '20:00',
    timezone varchar(64) NOT NULL DEFAULT 'Asia/Jerusalem',
    updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE INDEX reminderSettings_userId_unique (userId)
  )`,

  // tokenEvents
  `CREATE TABLE IF NOT EXISTS tokenEvents (
    id int AUTO_INCREMENT PRIMARY KEY,
    userId int NOT NULL,
    amount int NOT NULL,
    reason varchar(200) NOT NULL,
    date varchar(10) NOT NULL,
    createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
];

for (const sql of statements) {
  try {
    await conn.query(sql);
    console.log(`OK: ${sql.slice(0, 60)}...`);
  } catch (e) {
    // duplicate index / column already exists — תקין
    if (e.code === "ER_DUP_KEYNAME" || e.code === "ER_DUP_FIELDNAME") {
      console.log(`SKIP (already exists): ${sql.slice(0, 60)}...`);
    } else {
      throw e;
    }
  }
}

await conn.end();
console.log("Migration complete.");
