import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import fs from 'fs';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  limit, 
  orderBy, 
  writeBatch,
  setDoc,
  Timestamp
} from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json' with { type: 'json' };
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

// Initialize Firebase Client SDK
const firebaseApp = initializeApp(firebaseConfig);
const firestore = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

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

// Health Check
app.get('/api/health', async (req, res) => {
  try {
    const snap = await getDocs(collection(firestore, 'users'));
    res.json({ 
      status: 'ok', 
      database: firebaseConfig.firestoreDatabaseId,
      usersCount: snap.size
    });
  } catch (error: any) {
    res.status(500).json({ 
      status: 'error', 
      message: error.message,
      code: error.code
    });
  }
});

// Auth
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    const q = query(collection(firestore, 'users'), where('username', '==', username), where('is_active', '==', 1));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return res.status(401).json({ message: 'Login yoki parol noto\'g\'ri' });
    }

    const userDoc = snapshot.docs[0];
    const user = { id: userDoc.id, ...userDoc.data() } as any;
    
    if (!(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Login yoki parol noto\'g\'ri' });
    }

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role, full_name: user.full_name }, JWT_SECRET);
    res.json({ token, user: { id: user.id, username: user.username, role: user.role, full_name: user.full_name } });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Dashboard Stats
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    const activeRentalsSnap = await getDocs(query(collection(firestore, 'rentals'), where('status', '==', 'aktiv')));
    const availableCarsSnap = await getDocs(query(collection(firestore, 'cars'), where('status', '==', 'bor')));
    
    const monthlyPaymentsSnap = await getDocs(query(collection(firestore, 'payments'), where('payment_date', '>=', firstDayOfMonth)));
    let monthlyRevenue = 0;
    monthlyPaymentsSnap.forEach(doc => monthlyRevenue += doc.data().amount);
    
    const overdueRentalsSnap = await getDocs(query(collection(firestore, 'rentals'), where('status', '==', 'aktiv'), where('end_date', '<', today)));

    // Chart data: Revenue last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const recentPaymentsSnap = await getDocs(query(collection(firestore, 'payments'), where('payment_date', '>=', thirtyDaysAgo)));
    
    const revenueMap: Record<string, number> = {};
    recentPaymentsSnap.forEach(doc => {
      const date = doc.data().payment_date.split('T')[0];
      revenueMap[date] = (revenueMap[date] || 0) + doc.data().amount;
    });
    const revenueHistory = Object.entries(revenueMap).map(([date, total]) => ({ date, total })).sort((a, b) => a.date.localeCompare(b.date));

    // Chart data: Car status
    const allCarsSnap = await getDocs(collection(firestore, 'cars'));
    const statusMap: Record<string, number> = {};
    allCarsSnap.forEach(doc => {
      const status = doc.data().status;
      statusMap[status] = (statusMap[status] || 0) + 1;
    });
    const carStatus = Object.entries(statusMap).map(([status, count]) => ({ status, count }));

    // Recent active rentals
    const recentRentals: any[] = [];
    console.log('Fetching recent rentals...');
    const recentRentalsSnap = await getDocs(query(collection(firestore, 'rentals'), where('status', '==', 'aktiv'), limit(5)));

    console.log(`Found ${recentRentalsSnap.size} recent rentals`);
    for (const d of recentRentalsSnap.docs) {
      const rental = { id: d.id, ...d.data() } as any;
      
      let carData: any = {};
      let clientData: any = {};

      try {
        if (rental.car_id) {
          const carDoc = await getDoc(doc(firestore, 'cars', String(rental.car_id)));
          carData = carDoc.data() || {};
        }
        if (rental.client_id) {
          const clientDoc = await getDoc(doc(firestore, 'clients', String(rental.client_id)));
          clientData = clientDoc.data() || {};
        }
      } catch (e) {
        console.error(`Error fetching related docs for rental ${d.id}:`, e);
      }
      
      recentRentals.push({
        ...rental,
        plate_number: carData.plate_number || 'N/A',
        brand: carData.brand || 'N/A',
        model: carData.model || 'N/A',
        first_name: clientData.first_name || 'N/A',
        last_name: clientData.last_name || 'N/A'
      });
    }

    // Sort in memory since we removed orderBy to avoid index requirement
    recentRentals.sort((a, b) => (b.start_date || '').localeCompare(a.start_date || ''));

    res.json({
      stats: {
        activeRentals: activeRentalsSnap.size,
        availableCars: availableCarsSnap.size,
        monthlyRevenue,
        overdueRentals: overdueRentalsSnap.size
      },
      charts: {
        revenueHistory,
        carStatus
      },
      recentRentals
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Cars
app.get('/api/cars', authenticateToken, async (req, res) => {
  const { status, search } = req.query;
  try {
    let q: any = collection(firestore, 'cars');

    if (status && status !== 'hammasi') {
      q = query(q, where('status', '==', status));
    }

    const snapshot = await getDocs(q);
    let cars = snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() }));

    if (search) {
      const s = (search as string).toLowerCase();
      cars = cars.filter((car: any) => 
        car.plate_number.toLowerCase().includes(s) || 
        car.model.toLowerCase().includes(s) || 
        car.brand.toLowerCase().includes(s)
      );
    }

    res.json(cars);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/cars', authenticateToken, isAdmin, upload.single('image'), async (req, res) => {
  const { plate_number, brand, model, year, color, daily_price, status, notes } = req.body;
  const image_url = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const docRef = await addDoc(collection(firestore, 'cars'), {
      plate_number,
      brand,
      model,
      year: Number(year),
      color,
      daily_price: Number(daily_price),
      status: status || 'bor',
      image_url,
      notes: notes || ''
    });
    res.json({ id: docRef.id });
  } catch (e: any) {
    res.status(400).json({ message: 'Xatolik: ' + e.message });
  }
});

app.put('/api/cars/:id', authenticateToken, isAdmin, upload.single('image'), async (req, res) => {
  const { plate_number, brand, model, year, color, daily_price, status, notes } = req.body;
  const carId = req.params.id;
  
  try {
    const updateData: any = {
      plate_number,
      brand,
      model,
      year: Number(year),
      color,
      daily_price: Number(daily_price),
      status,
      notes
    };

    if (req.file) {
      updateData.image_url = `/uploads/${req.file.filename}`;
    }

    await updateDoc(doc(firestore, 'cars', carId), updateData);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/cars/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    await deleteDoc(doc(firestore, 'cars', req.params.id));
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Clients
app.get('/api/clients', authenticateToken, async (req, res) => {
  const { search } = req.query;
  try {
    const snapshot = await getDocs(collection(firestore, 'clients'));
    let clients = snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() }));

    if (search) {
      const s = (search as string).toLowerCase();
      clients = clients.filter((c: any) => 
        c.first_name.toLowerCase().includes(s) || 
        c.last_name.toLowerCase().includes(s) || 
        c.phone.toLowerCase().includes(s)
      );
    }

    // Add rental count
    for (const client of clients) {
      const rentalsSnap = await getDocs(query(collection(firestore, 'rentals'), where('client_id', '==', client.id)));
      client.rental_count = rentalsSnap.size;
    }

    res.json(clients);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/clients', authenticateToken, async (req, res) => {
  const { first_name, last_name, phone, passport_series, passport_number, address } = req.body;
  try {
    const docRef = await addDoc(collection(firestore, 'clients'), {
      first_name,
      last_name,
      phone,
      passport_series,
      passport_number,
      address,
      created_at: new Date().toISOString()
    });
    res.json({ id: docRef.id });
  } catch (e: any) {
    res.status(400).json({ message: 'Xatolik: ' + e.message });
  }
});

// Rentals
app.get('/api/rentals', authenticateToken, async (req, res) => {
  const { status, start_date, end_date, manager_id } = req.query;
  try {
    let q: any = collection(firestore, 'rentals');

    if (status && status !== 'hammasi') {
      q = query(q, where('status', '==', status));
    }
    if (manager_id) {
      q = query(q, where('manager_id', '==', manager_id));
    }

    const snapshot = await getDocs(q);
    let rentals = snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() }));

    if (start_date) {
      rentals = rentals.filter((r: any) => r.start_date >= start_date);
    }
    if (end_date) {
      rentals = rentals.filter((r: any) => r.start_date <= end_date);
    }

    const enrichedRentals = [];
    for (const rental of rentals) {
      let carData: any = {};
      let clientData: any = {};
      let managerData: any = {};

      try {
        if (rental.car_id) {
          const carDoc = await getDoc(doc(firestore, 'cars', String(rental.car_id)));
          carData = carDoc.data() || {};
        }
        if (rental.client_id) {
          const clientDoc = await getDoc(doc(firestore, 'clients', String(rental.client_id)));
          clientData = clientDoc.data() || {};
        }
        if (rental.manager_id) {
          const managerDoc = await getDoc(doc(firestore, 'users', String(rental.manager_id)));
          managerData = managerDoc.data() || {};
        }
      } catch (e) {
        console.error(`Error fetching related docs for rental ${rental.id}:`, e);
      }

      enrichedRentals.push({
        ...rental,
        plate_number: carData.plate_number || 'N/A',
        brand: carData.brand || 'N/A',
        model: carData.model || 'N/A',
        first_name: clientData.first_name || 'N/A',
        last_name: clientData.last_name || 'N/A',
        manager_name: managerData.full_name || 'N/A'
      });
    }

    res.json(enrichedRentals);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/rentals', authenticateToken, async (req, res) => {
  const { car_id, client_id, start_date, end_date, daily_price, total_amount, payment_type, deposit_amount, notes } = req.body;
  const manager_id = (req as any).user.id;

  try {
    const batch = writeBatch(firestore);
    
    const rentalRef = doc(collection(firestore, 'rentals'));
    batch.set(rentalRef, {
      car_id: String(car_id),
      client_id: String(client_id),
      manager_id: String(manager_id),
      start_date,
      end_date,
      daily_price: Number(daily_price),
      total_amount: Number(total_amount),
      payment_status: 'tolanmagan',
      payment_type,
      deposit_amount: Number(deposit_amount),
      notes: notes || '',
      status: 'aktiv'
    });

    const carRef = doc(firestore, 'cars', String(car_id));
    batch.update(carRef, { status: 'ijarada' });

    await batch.commit();
    res.json({ id: rentalRef.id });
  } catch (e: any) {
    res.status(400).json({ message: 'Xatolik: ' + e.message });
  }
});

app.get('/api/rentals/:id', authenticateToken, async (req, res) => {
  try {
    const rentalDoc = await getDoc(doc(firestore, 'rentals', req.params.id));
    if (!rentalDoc.exists()) return res.status(404).json({ message: 'Topilmadi' });

    const rental = { id: rentalDoc.id, ...rentalDoc.data() } as any;
    
    let carData: any = {};
    let clientData: any = {};
    let managerData: any = {};

    try {
      if (rental.car_id) {
        const carDoc = await getDoc(doc(firestore, 'cars', String(rental.car_id)));
        carData = carDoc.data() || {};
      }
      if (rental.client_id) {
        const clientDoc = await getDoc(doc(firestore, 'clients', String(rental.client_id)));
        clientData = clientDoc.data() || {};
      }
      if (rental.manager_id) {
        const managerDoc = await getDoc(doc(firestore, 'users', String(rental.manager_id)));
        managerData = managerDoc.data() || {};
      }
    } catch (e) {
      console.error(`Error fetching related docs for rental ${rental.id}:`, e);
    }

    const enrichedRental = {
      ...rental,
      plate_number: carData.plate_number || 'N/A',
      brand: carData.brand || 'N/A',
      model: carData.model || 'N/A',
      first_name: clientData.first_name || 'N/A',
      last_name: clientData.last_name || 'N/A',
      phone: clientData.phone || 'N/A',
      passport_series: clientData.passport_series || 'N/A',
      passport_number: clientData.passport_number || 'N/A',
      address: clientData.address || 'N/A',
      manager_name: managerData.full_name || 'N/A'
    };

    const q = query(collection(firestore, 'payments'), where('rental_id', '==', req.params.id));
    const paymentsSnap = await getDocs(q);
    const payments = paymentsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    payments.sort((a: any, b: any) => (b.payment_date || '').localeCompare(a.payment_date || ''));

    res.json({ rental: enrichedRental, payments });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/rentals/:id/return', authenticateToken, async (req, res) => {
  const { return_date, total_amount } = req.body;
  const rentalId = req.params.id;

  try {
    const rentalDoc = await getDoc(doc(firestore, 'rentals', rentalId));
    if (!rentalDoc.exists()) return res.status(404).json({ message: 'Topilmadi' });
    const rental = rentalDoc.data() as any;

    const batch = writeBatch(firestore);
    batch.update(doc(firestore, 'rentals', rentalId), {
      status: 'yakunlangan',
      return_date,
      total_amount: Number(total_amount)
    });
    batch.update(doc(firestore, 'cars', String(rental.car_id)), { status: 'bor' });

    await batch.commit();
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Payments
app.post('/api/payments', authenticateToken, async (req, res) => {
  const { rental_id, amount, payment_type, notes } = req.body;
  
  try {
    const paymentRef = await addDoc(collection(firestore, 'payments'), {
      rental_id: String(rental_id),
      amount: Number(amount),
      payment_type,
      notes: notes || '',
      payment_date: new Date().toISOString()
    });
    
    // Update rental payment status
    const rentalDoc = await getDoc(doc(firestore, 'rentals', String(rental_id)));
    if (!rentalDoc.exists()) return res.status(404).json({ message: 'Ijara topilmadi' });
    const rental = rentalDoc.data() as any;
    
    const q = query(collection(firestore, 'payments'), where('rental_id', '==', String(rental_id)));
    const paymentsSnap = await getDocs(q);
    let totalPaid = 0;
    paymentsSnap.forEach(d => totalPaid += d.data().amount);
    
    let status = 'qisman';
    if (totalPaid >= rental.total_amount) status = 'tolangan';
    if (totalPaid === 0) status = 'tolanmagan';

    await updateDoc(doc(firestore, 'rentals', String(rental_id)), { payment_status: status });
    
    res.json({ success: true, id: paymentRef.id });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Users (Admin only)
app.get('/api/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const snapshot = await getDocs(collection(firestore, 'users'));
    const users = snapshot.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        username: data.username,
        full_name: data.full_name,
        role: data.role,
        is_active: data.is_active
      };
    });
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/users', authenticateToken, isAdmin, async (req, res) => {
  const { username, password, full_name, role } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await addDoc(collection(firestore, 'users'), {
      username,
      password: hashedPassword,
      full_name,
      role,
      is_active: 1
    });
    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ message: 'Xatolik: ' + e.message });
  }
});

// Reports: Excel Export
app.get('/api/reports/export/excel', authenticateToken, async (req, res) => {
  const { start_date, end_date } = req.query;
  try {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Ijaralar');

    sheet.columns = [
      { header: 'ID', key: 'id', width: 15 },
      { header: 'Mashina', key: 'car', width: 25 },
      { header: 'Mijoz', key: 'client', width: 25 },
      { header: 'Boshlanish', key: 'start', width: 15 },
      { header: 'Tugash', key: 'end', width: 15 },
      { header: 'Summa', key: 'amount', width: 15 },
      { header: 'Holat', key: 'status', width: 15 },
    ];

    const snapshot = await getDocs(collection(firestore, 'rentals'));
    let rentals = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as any[];

    if (start_date) {
      rentals = rentals.filter(r => r.start_date >= start_date);
    }
    if (end_date) {
      rentals = rentals.filter(r => r.start_date <= end_date);
    }

    for (const r of rentals) {
      const carDoc = await getDoc(doc(firestore, 'cars', String(r.car_id)));
      const clientDoc = await getDoc(doc(firestore, 'clients', String(r.client_id)));
      
      const carData = carDoc.data() || {};
      const clientData = clientDoc.data() || {};

      sheet.addRow({
        id: r.id,
        car: `${carData.brand || ''} ${carData.model || ''} (${carData.plate_number || ''})`,
        client: `${clientData.first_name || ''} ${clientData.last_name || ''}`,
        start: r.start_date,
        end: r.end_date,
        amount: r.total_amount,
        status: r.status
      });
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=hisobot.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (error: any) {
    res.status(500).send(error.message);
  }
});

// Reports: PDF Contract
app.get('/api/rentals/:id/contract', authenticateToken, async (req, res) => {
  const rentalId = req.params.id;
  try {
    const rentalDoc = await getDoc(doc(firestore, 'rentals', rentalId));
    if (!rentalDoc.exists()) return res.status(404).send('Topilmadi');
    
    const r = rentalDoc.data() as any;
    const carDoc = await getDoc(doc(firestore, 'cars', String(r.car_id)));
    const clientDoc = await getDoc(doc(firestore, 'clients', String(r.client_id)));
    
    const carData = (carDoc.data() || {}) as any;
    const clientData = (clientDoc.data() || {}) as any;

    const pdfDoc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=shartnoma_${rentalId}.pdf`);
    pdfDoc.pipe(res);

    pdfDoc.fontSize(20).text('AVTO-IJARA SHARTNOMASI', { align: 'center' });
    pdfDoc.moveDown();
    pdfDoc.fontSize(12).text(`Shartnoma raqami: #${rentalId}`);
    pdfDoc.text(`Sana: ${new Date().toLocaleDateString('uz-UZ')}`);
    pdfDoc.moveDown();

    pdfDoc.fontSize(14).text('1. TOMONLAR', { underline: true });
    pdfDoc.fontSize(12).text(`Ijaraga beruvchi: AutoRent kompaniyasi`);
    pdfDoc.text(`Ijaraga oluvchi: ${clientData.first_name} ${clientData.last_name}`);
    pdfDoc.text(`Passport: ${clientData.passport_series} ${clientData.passport_number}`);
    pdfDoc.text(`Manzil: ${clientData.address || 'Ko\'rsatilmagan'}`);
    pdfDoc.moveDown();

    pdfDoc.fontSize(14).text('2. AVTOMOBIL MA\'LUMOTLARI', { underline: true });
    pdfDoc.fontSize(12).text(`Rusumi: ${carData.brand} ${carData.model}`);
    pdfDoc.text(`Davlat raqami: ${carData.plate_number}`);
    pdfDoc.moveDown();

    pdfDoc.fontSize(14).text('3. IJARA SHARTLARI', { underline: true });
    pdfDoc.fontSize(12).text(`Boshlanish sanasi: ${r.start_date}`);
    pdfDoc.text(`Tugash sanasi: ${r.end_date}`);
    pdfDoc.text(`Kunlik narx: ${r.daily_price.toLocaleString()} so\'m`);
    pdfDoc.text(`Jami summa: ${r.total_amount.toLocaleString()} so\'m`);
    pdfDoc.text(`Kafolat summasi: ${r.deposit_amount.toLocaleString()} so\'m`);
    pdfDoc.moveDown();

    pdfDoc.moveDown(4);
    pdfDoc.text('__________________________          __________________________');
    pdfDoc.text('      Kompaniya imzosi                     Mijoz imzosi');

    pdfDoc.end();
  } catch (error: any) {
    res.status(500).send(error.message);
  }
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
