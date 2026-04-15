import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import fs from 'fs';
import db from './src/lib/db';
import './src/lib/seed'; // Run seed script
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'autorent-secret-key';

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Multer setup for car images
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Middleware: Auth
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token topilmadi' });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ message: 'Sessiya muddati tugagan yoki xato token' });
    req.user = user;
    next();
  });
};

const isAdmin = (req: any, res: any, next: any) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Faqat adminlar uchun' });
  next();
};

// --- API ROUTES ---

// Auth
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username = ? AND is_active = 1').get(username) as any;
  
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: 'Login yoki parol noto\'g\'ri' });
  }

  const token = jwt.sign({ id: user.id, username: user.username, role: user.role, full_name: user.full_name }, JWT_SECRET);
  res.json({ token, user: { id: user.id, username: user.username, role: user.role, full_name: user.full_name } });
});

// Dashboard Stats
app.get('/api/dashboard/stats', authenticateToken, (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  const activeRentals = db.prepare("SELECT COUNT(*) as count FROM rentals WHERE status = 'aktiv'").get() as any;
  const availableCars = db.prepare("SELECT COUNT(*) as count FROM cars WHERE status = 'bor'").get() as any;
  
  const monthlyRevenue = db.prepare('SELECT SUM(amount) as total FROM payments WHERE payment_date >= ?').get(firstDayOfMonth) as any;
  
  const overdueRentals = db.prepare("SELECT COUNT(*) as count FROM rentals WHERE status = 'aktiv' AND end_date < ?").get(today) as any;

  // Chart data: Revenue last 30 days
  const revenueHistory = db.prepare(`
    SELECT date(payment_date) as date, SUM(amount) as total 
    FROM payments 
    WHERE payment_date >= date('now', '-30 days')
    GROUP BY date(payment_date)
    ORDER BY date
  `).all();

  // Chart data: Car status
  const carStatus = db.prepare('SELECT status, COUNT(*) as count FROM cars GROUP BY status').all();

  // Recent active rentals
  const recentRentals = db.prepare(`
    SELECT r.*, c.plate_number, c.brand, c.model, cl.first_name, cl.last_name 
    FROM rentals r
    JOIN cars c ON r.car_id = c.id
    JOIN clients cl ON r.client_id = cl.id
    WHERE r.status = 'aktiv'
    ORDER BY r.start_date DESC
    LIMIT 5
  `).all();

  res.json({
    stats: {
      activeRentals: activeRentals.count,
      availableCars: availableCars.count,
      monthlyRevenue: monthlyRevenue.total || 0,
      overdueRentals: overdueRentals.count
    },
    charts: {
      revenueHistory,
      carStatus
    },
    recentRentals
  });
});

// Cars
app.get('/api/cars', authenticateToken, (req, res) => {
  const { status, search } = req.query;
  let query = 'SELECT * FROM cars WHERE 1=1';
  const params: any[] = [];

  if (status && status !== 'hammasi') {
    query += ' AND status = ?';
    params.push(status);
  }
  if (search) {
    query += ' AND (plate_number LIKE ? OR model LIKE ? OR brand LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  const cars = db.prepare(query).all(...params);
  res.json(cars);
});

app.post('/api/cars', authenticateToken, isAdmin, upload.single('image'), (req, res) => {
  const { plate_number, brand, model, year, color, daily_price, status, notes } = req.body;
  const image_url = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const result = db.prepare(`
      INSERT INTO cars (plate_number, brand, model, year, color, daily_price, status, image_url, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(plate_number, brand, model, year, color, daily_price, status || 'bor', image_url, notes);
    res.json({ id: result.lastInsertRowid });
  } catch (e: any) {
    res.status(400).json({ message: 'Xatolik: ' + e.message });
  }
});

app.put('/api/cars/:id', authenticateToken, isAdmin, upload.single('image'), (req, res) => {
  const { plate_number, brand, model, year, color, daily_price, status, notes } = req.body;
  const carId = req.params.id;
  
  let query = 'UPDATE cars SET plate_number=?, brand=?, model=?, year=?, color=?, daily_price=?, status=?, notes=?';
  const params = [plate_number, brand, model, year, color, daily_price, status, notes];

  if (req.file) {
    query += ', image_url=?';
    params.push(`/uploads/${req.file.filename}`);
  }

  query += ' WHERE id=?';
  params.push(carId);

  db.prepare(query).run(...params);
  res.json({ success: true });
});

app.delete('/api/cars/:id', authenticateToken, isAdmin, (req, res) => {
  db.prepare('DELETE FROM cars WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Clients
app.get('/api/clients', authenticateToken, (req, res) => {
  const { search } = req.query;
  let query = `
    SELECT c.*, (SELECT COUNT(*) FROM rentals WHERE client_id = c.id) as rental_count 
    FROM clients c 
    WHERE 1=1
  `;
  const params: any[] = [];

  if (search) {
    query += ' AND (first_name LIKE ? OR last_name LIKE ? OR phone LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  const clients = db.prepare(query).all(...params);
  res.json(clients);
});

app.post('/api/clients', authenticateToken, (req, res) => {
  const { first_name, last_name, phone, passport_series, passport_number, address } = req.body;
  try {
    const result = db.prepare(`
      INSERT INTO clients (first_name, last_name, phone, passport_series, passport_number, address)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(first_name, last_name, phone, passport_series, passport_number, address);
    res.json({ id: result.lastInsertRowid });
  } catch (e: any) {
    res.status(400).json({ message: 'Xatolik: ' + e.message });
  }
});

// Rentals
app.get('/api/rentals', authenticateToken, (req, res) => {
  const { status, start_date, end_date, manager_id } = req.query;
  let query = `
    SELECT r.*, c.plate_number, c.brand, c.model, cl.first_name, cl.last_name, u.full_name as manager_name
    FROM rentals r
    JOIN cars c ON r.car_id = c.id
    JOIN clients cl ON r.client_id = cl.id
    JOIN users u ON r.manager_id = u.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (status && status !== 'hammasi') {
    query += ' AND r.status = ?';
    params.push(status);
  }
  if (start_date) {
    query += ' AND r.start_date >= ?';
    params.push(start_date);
  }
  if (end_date) {
    query += ' AND r.end_date <= ?';
    params.push(end_date);
  }
  if (manager_id) {
    query += ' AND r.manager_id = ?';
    params.push(manager_id);
  }

  const rentals = db.prepare(query).all(...params);
  res.json(rentals);
});

app.post('/api/rentals', authenticateToken, (req, res) => {
  const { car_id, client_id, start_date, end_date, daily_price, total_amount, payment_type, deposit_amount, notes } = req.body;
  const manager_id = (req as any).user.id;

  const transaction = db.transaction(() => {
    // 1. Create rental
    const result = db.prepare(`
      INSERT INTO rentals (car_id, client_id, manager_id, start_date, end_date, daily_price, total_amount, payment_type, deposit_amount, notes, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'aktiv')
    `).run(car_id, client_id, manager_id, start_date, end_date, daily_price, total_amount, payment_type, deposit_amount, notes);

    // 2. Update car status
    db.prepare("UPDATE cars SET status = 'ijarada' WHERE id = ?").run(car_id);

    return result.lastInsertRowid;
  });

  try {
    const id = transaction();
    res.json({ id });
  } catch (e: any) {
    res.status(400).json({ message: 'Xatolik: ' + e.message });
  }
});

app.get('/api/rentals/:id', authenticateToken, (req, res) => {
  const rental = db.prepare(`
    SELECT r.*, c.plate_number, c.brand, c.model, cl.first_name, cl.last_name, cl.phone, cl.passport_series, cl.passport_number, cl.address, u.full_name as manager_name
    FROM rentals r
    JOIN cars c ON r.car_id = c.id
    JOIN clients cl ON r.client_id = cl.id
    JOIN users u ON r.manager_id = u.id
    WHERE r.id = ?
  `).get(req.params.id);

  const payments = db.prepare('SELECT * FROM payments WHERE rental_id = ? ORDER BY payment_date DESC').all(req.params.id);

  res.json({ rental, payments });
});

app.post('/api/rentals/:id/return', authenticateToken, (req, res) => {
  const { return_date, total_amount } = req.body;
  const rentalId = req.params.id;

  const rental = db.prepare('SELECT car_id FROM rentals WHERE id = ?').get(rentalId) as any;

  const transaction = db.transaction(() => {
    db.prepare("UPDATE rentals SET status = 'yakunlangan', return_date = ?, total_amount = ? WHERE id = ?")
      .run(return_date, total_amount, rentalId);
    db.prepare("UPDATE cars SET status = 'bor' WHERE id = ?").run(rental.car_id);
  });

  transaction();
  res.json({ success: true });
});

// Payments
app.post('/api/payments', authenticateToken, (req, res) => {
  const { rental_id, amount, payment_type, notes } = req.body;
  
  const transaction = db.transaction(() => {
    db.prepare('INSERT INTO payments (rental_id, amount, payment_type, notes) VALUES (?, ?, ?, ?)').run(rental_id, amount, payment_type, notes);
    
    // Update rental payment status
    const rental = db.prepare('SELECT total_amount FROM rentals WHERE id = ?').get(rental_id) as any;
    const totalPaid = db.prepare('SELECT SUM(amount) as total FROM payments WHERE rental_id = ?').get(rental_id) as any;
    
    let status = 'qisman';
    if (totalPaid.total >= rental.total_amount) status = 'tolangan';
    if (totalPaid.total === 0) status = 'tolanmagan';

    db.prepare('UPDATE rentals SET payment_status = ? WHERE id = ?').run(status, rental_id);
  });

  transaction();
  res.json({ success: true });
});

// Users (Admin only)
app.get('/api/users', authenticateToken, isAdmin, (req, res) => {
  const users = db.prepare('SELECT id, username, full_name, role, is_active FROM users').all();
  res.json(users);
});

app.post('/api/users', authenticateToken, isAdmin, async (req, res) => {
  const { username, password, full_name, role } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    db.prepare('INSERT INTO users (username, password, full_name, role) VALUES (?, ?, ?, ?)').run(username, hashedPassword, full_name, role);
    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ message: 'Xatolik: ' + e.message });
  }
});

// Reports: Excel Export
app.get('/api/reports/export/excel', authenticateToken, async (req, res) => {
  const { start_date, end_date } = req.query;
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Ijaralar');

  sheet.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Mashina', key: 'car', width: 20 },
    { header: 'Mijoz', key: 'client', width: 25 },
    { header: 'Boshlanish', key: 'start', width: 15 },
    { header: 'Tugash', key: 'end', width: 15 },
    { header: 'Summa', key: 'amount', width: 15 },
    { header: 'Holat', key: 'status', width: 15 },
  ];

  const rentals = db.prepare(`
    SELECT r.*, c.plate_number, c.brand, c.model, cl.first_name, cl.last_name
    FROM rentals r
    JOIN cars c ON r.car_id = c.id
    JOIN clients cl ON r.client_id = cl.id
    WHERE r.start_date >= ? AND r.start_date <= ?
  `).all(start_date || '1970-01-01', end_date || '2099-12-31') as any[];

  rentals.forEach(r => {
    sheet.addRow({
      id: r.id,
      car: `${r.brand} ${r.model} (${r.plate_number})`,
      client: `${r.first_name} ${r.last_name}`,
      start: r.start_date,
      end: r.end_date,
      amount: r.total_amount,
      status: r.status
    });
  });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=hisobot.xlsx');
  await workbook.xlsx.write(res);
  res.end();
});

// Reports: PDF Contract
app.get('/api/rentals/:id/contract', authenticateToken, (req, res) => {
  const rentalId = req.params.id;
  const r = db.prepare(`
    SELECT r.*, c.plate_number, c.brand, c.model, cl.first_name, cl.last_name, cl.passport_series, cl.passport_number, cl.address
    FROM rentals r
    JOIN cars c ON r.car_id = c.id
    JOIN clients cl ON r.client_id = cl.id
    WHERE r.id = ?
  `).get(rentalId) as any;

  if (!r) return res.status(404).send('Topilmadi');

  const doc = new PDFDocument();
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=shartnoma_${rentalId}.pdf`);
  doc.pipe(res);

  doc.fontSize(20).text('AVTO-IJARA SHARTNOMASI', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Shartnoma raqami: #${r.id}`);
  doc.text(`Sana: ${new Date().toLocaleDateString('uz-UZ')}`);
  doc.moveDown();

  doc.fontSize(14).text('1. TOMONLAR', { underline: true });
  doc.fontSize(12).text(`Ijaraga beruvchi: AutoRent kompaniyasi`);
  doc.text(`Ijaraga oluvchi: ${r.first_name} ${r.last_name}`);
  doc.text(`Passport: ${r.passport_series} ${r.passport_number}`);
  doc.text(`Manzil: ${r.address || 'Ko\'rsatilmagan'}`);
  doc.moveDown();

  doc.fontSize(14).text('2. AVTOMOBIL MA\'LUMOTLARI', { underline: true });
  doc.fontSize(12).text(`Rusumi: ${r.brand} ${r.model}`);
  doc.text(`Davlat raqami: ${r.plate_number}`);
  doc.moveDown();

  doc.fontSize(14).text('3. IJARA SHARTLARI', { underline: true });
  doc.fontSize(12).text(`Boshlanish sanasi: ${r.start_date}`);
  doc.text(`Tugash sanasi: ${r.end_date}`);
  doc.text(`Kunlik narx: ${r.daily_price.toLocaleString()} so\'m`);
  doc.text(`Jami summa: ${r.total_amount.toLocaleString()} so\'m`);
  doc.text(`Kafolat summasi: ${r.deposit_amount.toLocaleString()} so\'m`);
  doc.moveDown();

  doc.moveDown(4);
  doc.text('__________________________          __________________________');
  doc.text('      Kompaniya imzosi                     Mijoz imzosi');

  doc.end();
});

// --- VITE MIDDLEWARE ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
