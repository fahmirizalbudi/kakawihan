Using SQLite in the Browser with WebAssembly and React (Local-First Apps with No Backend)
#
sql
#
browser
#
webassembly
#
react
What if you could run a real SQL database in the browser — no backend, no server, and full support for joins, indexes, and transactions?

Thanks to SQLite compiled to WebAssembly (via sql.js), you can embed a full-featured, persistent relational DB in the browser, and use it directly from your React app. Ideal for offline-first apps, data visualization, form builders, and more.

Let’s build a local-first React app using SQLite over WASM.

Step 1: Install sql.js
Start with the WebAssembly version of SQLite:

npm install sql.js
Then import it in your app:

import initSqlJs from 'sql.js';
You’ll need to load the WASM binary (or use a CDN):


const SQL = await initSqlJs({
  locateFile: file => `https://sql.js.org/dist/${file}`
});
Step 2: Initialize the In-Browser SQLite Database
Create a database and run some schema + seed data:


const db = new SQL.Database();

db.run(`
  CREATE TABLE todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    completed BOOLEAN DEFAULT 0
  );
`);

db.run(`
  INSERT INTO todos (text, completed)
  VALUES ('Write blog post', 0), ('Ship to production', 1);
`);
This database lives entirely in memory — but can be exported for persistence.

Step 3: Query Data from React
Now use SQLite as your actual data store in React. Here's a basic query function:


function getTodos(db) {
  const results = db.exec("SELECT * FROM todos");
  if (!results.length) return [];
  
  const [cols, ...rows] = results[0].values;
  return results[0].values.map(row => {
    return Object.fromEntries(
      results[0].columns.map((col, i) => [col, row[i]])
    );
  });
}
Render in a component:


const [todos, setTodos] = useState([]);

useEffect(() => {
  setTodos(getTodos(db));
}, []);
Step 4: Mutate State with SQL Writes
Use SQL to modify app state — like this insert function:


function addTodo(db, text) {
  db.run("INSERT INTO todos (text, completed) VALUES (?, ?)", [text, 0]);
}
React handles UI; SQLite handles the data layer. You’ve got full transactions, queries, and mutations, all client-side.

Step 5: Persist to localStorage or IndexedDB
Save the database to persist it between sessions:


const binaryArray = db.export();
const base64 = btoa(
  binaryArray.reduce((data, byte) => data + String.fromCharCode(byte), '')
);
localStorage.setItem("db_backup", base64);
And load it later:


const saved = localStorage.getItem("db_backup");
if (saved) {
  const binary = Uint8Array.from(atob(saved), c => c.charCodeAt(0));
  const db = new SQL.Database(binary);
}
✅ Pros:

🗃 Full SQL support in the browser (joins, indexes, FKs, etc.)
📴 Works completely offline
⚡ Fast — WASM is native-speed
💾 Persistable to localStorage/IndexedDB
🧠 Ideal for local dashboards, forms, and prototyping
⚠️ Cons:

📦 sql.js is ~600kb compressed (WASM size)
🧪 No built-in sync or replication (must DIY)
❌ Not suited for large-scale multi-user apps
🔐 No built-in auth — everything runs on the client
Summary
You don’t need a backend to build a fully functional, SQL-powered application. With SQLite compiled to WebAssembly, you can run robust relational queries right in the browser — making it perfect for offline apps, portable tools, or backend-less prototypes. Add persistence via localStorage or IndexedDB and you’ve got a fast, private, and portable database inside your app.

This opens the door for truly local-first software — and you can start building it today.