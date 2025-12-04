import Database from "better-sqlite3";

try {
    console.log("Opening database...");
    const db = new Database("sqlite.db");
    console.log("Database opened.");

    console.log("Creating table...");
    db.exec("CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY, name TEXT)");
    console.log("Table created.");

    console.log("Inserting data...");
    db.exec("INSERT INTO test (name) VALUES ('test')");
    console.log("Data inserted.");

    console.log("Querying data...");
    const row = db.prepare("SELECT * FROM test").get();
    console.log("Data queried:", row);

    db.close();
    console.log("Database closed.");
} catch (error) {
    console.error("Database error:", error);
}
