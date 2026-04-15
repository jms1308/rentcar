import db from './db';
import bcrypt from 'bcryptjs';

async function seed() {
  const adminPassword = await bcrypt.hash('admin123', 10);
  const managerPassword = await bcrypt.hash('menejer123', 10);

  // Clear existing data (optional, for demo purposes)
  // db.exec('DELETE FROM users; DELETE FROM cars; DELETE FROM clients; DELETE FROM rentals; DELETE FROM payments;');

  // Check if users already exist
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  
  if (userCount.count === 0) {
    // Users
    const insertUser = db.prepare('INSERT INTO users (username, password, full_name, role) VALUES (?, ?, ?, ?)');
    insertUser.run('admin', adminPassword, 'Asosiy Admin', 'admin');
    insertUser.run('menejer1', managerPassword, 'Menejer Birinchi', 'manager');
    insertUser.run('menejer2', managerPassword, 'Menejer Ikkinchi', 'manager');

    // Cars
    const insertCar = db.prepare('INSERT INTO cars (plate_number, brand, model, year, color, daily_price, status) VALUES (?, ?, ?, ?, ?, ?, ?)');
    insertCar.run('01 A 777 AA', 'Chevrolet', 'Tahoe', 2023, 'Qora', 1500000, 'bor');
    insertCar.run('01 B 123 BB', 'Toyota', 'Prado', 2022, 'Oq', 1200000, 'ijarada');
    insertCar.run('01 C 456 CC', 'Chevrolet', 'Malibu 2', 2021, 'To\'q kulrang', 600000, 'bor');
    insertCar.run('01 D 789 DD', 'Chevrolet', 'Gentra', 2023, 'Oq', 350000, 'bor');
    insertCar.run('01 E 001 EE', 'Mercedes-Benz', 'S-Class', 2024, 'Qora', 3000000, 'tamirda');
    insertCar.run('01 F 555 FF', 'Chevrolet', 'Tracker 2', 2023, 'Qizil', 500000, 'bor');
    insertCar.run('01 G 999 GG', 'Kia', 'K5', 2022, 'Ko\'k', 700000, 'bor');
    insertCar.run('01 H 111 HH', 'Hyundai', 'Elantra', 2023, 'Kumush', 550000, 'bor');
    insertCar.run('01 J 222 JJ', 'Chevrolet', 'Onix', 2024, 'Oq', 400000, 'bor');
    insertCar.run('01 K 333 KK', 'BYD', 'Song Plus', 2023, 'Yashil', 800000, 'bor');

    // Clients
    const insertClient = db.prepare('INSERT INTO clients (first_name, last_name, phone, passport_series, passport_number, address) VALUES (?, ?, ?, ?, ?, ?)');
    insertClient.run('Ali', 'Valiyev', '+998901112233', 'AA', '1234567', 'Toshkent sh, Chilonzor');
    insertClient.run('Olim', 'Sodiqov', '+998912223344', 'AB', '7654321', 'Toshkent sh, Yunusobod');
    insertClient.run('Zafar', 'Karimov', '+998933334455', 'AC', '1122334', 'Samarqand sh, Registon');
    insertClient.run('Nodira', 'Azimova', '+998944445566', 'AD', '4433221', 'Buxoro sh, G\'ijduvon');
    insertClient.run('Jasur', 'Hamroyev', '+998955556677', 'AE', '5566778', 'Toshkent sh, Mirobod');

    // Rentals
    const insertRental = db.prepare('INSERT INTO rentals (car_id, client_id, manager_id, start_date, end_date, daily_price, total_amount, payment_status, payment_type, deposit_amount, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    
    // Active rental
    insertRental.run(2, 1, 2, '2026-04-10', '2026-04-15', 1200000, 6000000, 'qisman', 'karta', 500000, 'aktiv');
    
    // Overdue rental (simulated by setting end_date in the past)
    insertRental.run(3, 2, 2, '2026-04-01', '2026-04-05', 600000, 2400000, 'tolanmagan', 'naqd', 200000, 'aktiv');

    // Completed rental
    const completedRental = insertRental.run(4, 3, 3, '2026-03-20', '2026-03-25', 350000, 1750000, 'tolangan', 'otkazma', 100000, 'yakunlangan');
    db.prepare('UPDATE rentals SET return_date = ? WHERE id = ?').run('2026-03-25', completedRental.lastInsertRowid);

    // Payments
    const insertPayment = db.prepare('INSERT INTO payments (rental_id, amount, payment_type) VALUES (?, ?, ?)');
    insertPayment.run(1, 2000000, 'karta');
    insertPayment.run(3, 1750000, 'otkazma');

    console.log('Demo ma\'lumotlar muvaffaqiyatli qo\'shildi.');
  }
}

seed().catch(console.error);
