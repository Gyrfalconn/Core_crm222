import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";

const db = new Database("core_crm.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    company TEXT,
    status TEXT DEFAULT 'Lead',
    last_contact TEXT,
    value REAL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS deals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    contact_id INTEGER,
    stage TEXT DEFAULT 'Discovery',
    value REAL,
    close_date TEXT,
    FOREIGN KEY(contact_id) REFERENCES contacts(id)
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    due_date TEXT,
    status TEXT DEFAULT 'Pending',
    priority TEXT DEFAULT 'Medium'
  );
`);

// Seed data if empty
const contactCount = db.prepare("SELECT COUNT(*) as count FROM contacts").get() as { count: number };
if (contactCount.count === 0) {
  const insertContact = db.prepare("INSERT INTO contacts (name, email, company, status, value, last_contact) VALUES (?, ?, ?, ?, ?, ?)");
  insertContact.run("Rajesh Kumar", "rajesh@tata.com", "Tata Consultancy Services", "Customer", 500000, "2024-02-15");
  insertContact.run("Priya Sharma", "priya@reliance.in", "Reliance Industries", "Lead", 1200000, "2024-02-18");
  insertContact.run("Amit Patel", "amit@infosys.com", "Infosys", "Opportunity", 850000, "2024-02-19");

  const insertDeal = db.prepare("INSERT INTO deals (title, contact_id, stage, value, close_date) VALUES (?, ?, ?, ?, ?)");
  insertDeal.run("Enterprise ERP Implementation", 1, "Closed Won", 500000, "2024-03-01");
  insertDeal.run("Cloud Migration Project", 2, "Proposal", 1200000, "2024-04-15");
  insertDeal.run("Digital Transformation", 3, "Negotiation", 850000, "2024-03-20");

  const insertTask = db.prepare("INSERT INTO tasks (title, due_date, status, priority) VALUES (?, ?, ?, ?)");
  insertTask.run("Follow up with Priya regarding proposal", "2024-02-21", "Pending", "High");
  insertTask.run("Review contract for Amit", "2024-02-22", "Pending", "Medium");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/contacts", (req, res) => {
    const contacts = db.prepare("SELECT * FROM contacts ORDER BY id DESC").all();
    res.json(contacts);
  });

  app.get("/api/deals", (req, res) => {
    const deals = db.prepare(`
      SELECT deals.*, contacts.name as contact_name, contacts.email as contact_email
      FROM deals 
      LEFT JOIN contacts ON deals.contact_id = contacts.id
    `).all();
    res.json(deals);
  });

  app.get("/api/tasks", (req, res) => {
    const tasks = db.prepare("SELECT * FROM tasks ORDER BY due_date ASC").all();
    res.json(tasks);
  });

  app.get("/api/stats", (req, res) => {
    const totalValue = db.prepare("SELECT SUM(value) as total FROM deals WHERE stage != 'Closed Lost'").get() as { total: number };
    const activeDeals = db.prepare("SELECT COUNT(*) as count FROM deals WHERE stage NOT IN ('Closed Won', 'Closed Lost')").get() as { count: number };
    const newLeads = db.prepare("SELECT COUNT(*) as count FROM contacts WHERE status = 'Lead'").get() as { count: number };
    
    res.json({
      pipelineValue: totalValue.total || 0,
      activeDeals: activeDeals.count,
      newLeads: newLeads.count,
      winRate: 68 // Mocked for now
    });
  });

  app.post("/api/contacts", (req, res) => {
    const { name, email, company, status, value } = req.body;
    const info = db.prepare("INSERT INTO contacts (name, email, company, status, value, last_contact) VALUES (?, ?, ?, ?, ?, ?)").run(
      name, email, company, status || 'Lead', value || 0, new Date().toISOString().split('T')[0]
    );
    res.json({ id: Number(info.lastInsertRowid) });
  });

  app.post("/api/deals", (req, res) => {
    const { title, contact_id, stage, value, close_date } = req.body;
    const info = db.prepare("INSERT INTO deals (title, contact_id, stage, value, close_date) VALUES (?, ?, ?, ?, ?)").run(
      title, contact_id, stage || 'Discovery', value || 0, close_date || new Date().toISOString().split('T')[0]
    );
    res.json({ id: Number(info.lastInsertRowid) });
  });

  app.patch("/api/deals/:id", (req, res) => {
    const { stage } = req.body;
    db.prepare("UPDATE deals SET stage = ? WHERE id = ?").run(stage, req.params.id);
    res.json({ success: true });
  });

  app.post("/api/tasks", (req, res) => {
    const { title, due_date, priority } = req.body;
    const info = db.prepare("INSERT INTO tasks (title, due_date, priority, status) VALUES (?, ?, ?, ?)").run(
      title, due_date, priority || 'Medium', 'Pending'
    );
    res.json({ id: Number(info.lastInsertRowid) });
  });

  app.patch("/api/tasks/:id", (req, res) => {
    const { status } = req.body;
    db.prepare("UPDATE tasks SET status = ? WHERE id = ?").run(status, req.params.id);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
