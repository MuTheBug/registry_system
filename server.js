const express = require('express');
const multer = require('multer');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// ══════════════════════════════════════════════
// Configuration
// ══════════════════════════════════════════════
const PORT = process.env.PORT || 3000;
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const DB_PATH = path.join(__dirname, 'registry.db');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ══════════════════════════════════════════════
// Database Setup
// ══════════════════════════════════════════════
const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent read/write performance
db.pragma('journal_mode = WAL');
db.pragma('busy_timeout = 5000');

db.exec(`
    CREATE TABLE IF NOT EXISTS records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        created_at TEXT DEFAULT (datetime('now','localtime')),

        -- Section 1: Personal Information
        first_name TEXT NOT NULL,
        father_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        gender TEXT NOT NULL,
        mother_name TEXT NOT NULL,
        birth_day INTEGER,
        birth_month INTEGER,
        birth_year INTEGER,
        province TEXT NOT NULL,
        national_id TEXT NOT NULL,
        phone TEXT,
        blood_type TEXT,
        photo_path TEXT,
        document_path TEXT,

        -- Section 2: Arrest Information
        arrest_day INTEGER,
        arrest_month INTEGER,
        arrest_year INTEGER,
        arrest_place TEXT NOT NULL,
        arrest_authority TEXT NOT NULL,
        arrest_reason TEXT NOT NULL,
        arrest_causer TEXT,
        status TEXT,
        release_day INTEGER,
        release_month INTEGER,
        release_year INTEGER,
        death_day INTEGER,
        death_month INTEGER,
        death_year INTEGER,

        -- Section 3: Social Status
        marital TEXT,
        guardian_name TEXT,
        guardian_relation TEXT,
        guardian_phone TEXT,
        spouse_name TEXT,
        spouse_phone TEXT,
        has_kids TEXT,
        kids_count INTEGER,
        children_data TEXT,
        ex_spouse_name TEXT,
        has_kids_w TEXT,
        kids_count_w INTEGER,
        children_data_w TEXT,

        -- Section 4: Housing
        address TEXT NOT NULL,
        housing_type TEXT NOT NULL,

        -- Section 5: Employment
        employment TEXT,
        profession TEXT,
        employer TEXT,
        breadwinner TEXT,

        -- Section 6: Health
        chronic TEXT,
        diseases TEXT,

        -- Section 7: Education & Legal
        education TEXT,
        legal TEXT,
        legal_details TEXT,

        -- Section 8: Associations
        assoc TEXT,
        assoc_name TEXT,
        service_type TEXT,

        -- Section 9: Additional
        notes TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_records_name ON records(first_name, last_name);
    CREATE INDEX IF NOT EXISTS idx_records_national_id ON records(national_id);
    CREATE INDEX IF NOT EXISTS idx_records_province ON records(province);
    CREATE INDEX IF NOT EXISTS idx_records_status ON records(status);
`);

// ══════════════════════════════════════════════
// File Upload Configuration
// ══════════════════════════════════════════════
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const subdir = file.fieldname === 'photo' ? 'photos' : 'documents';
        const dir = path.join(UPLOAD_DIR, subdir);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e6) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB per file
        files: 2
    },
    fileFilter: (req, file, cb) => {
        if (file.fieldname === 'photo') {
            if (file.mimetype.startsWith('image/')) cb(null, true);
            else cb(new Error('Photo must be an image file'));
        } else if (file.fieldname === 'document') {
            if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') cb(null, true);
            else cb(new Error('Document must be an image or PDF'));
        } else {
            cb(null, true);
        }
    }
});

// ══════════════════════════════════════════════
// Express App
// ══════════════════════════════════════════════
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(__dirname));
app.use('/uploads', express.static(UPLOAD_DIR));

// ══════════════════════════════════════════════
// Routes
// ══════════════════════════════════════════════

// Main form page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'form.html'));
});

// Admin dashboard
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// ══════════════════════════════════════════════
// API Endpoints
// ══════════════════════════════════════════════

// Create a new record
app.post('/api/records', upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'document', maxCount: 1 }
]), (req, res) => {
    try {
        const b = req.body;
        const photoPath = req.files?.photo?.[0]?.filename || null;
        const docPath = req.files?.document?.[0]?.filename || null;

        // Collect children data from dynamic form fields
        const childrenData = collectChildrenData(b, 'kidsBox');
        const childrenDataW = collectChildrenData(b, 'kidsBoxW');

        const stmt = db.prepare(`
            INSERT INTO records (
                first_name, father_name, last_name, gender, mother_name,
                birth_day, birth_month, birth_year, province, national_id,
                phone, blood_type, photo_path, document_path,
                arrest_day, arrest_month, arrest_year, arrest_place,
                arrest_authority, arrest_reason, arrest_causer, status,
                release_day, release_month, release_year,
                death_day, death_month, death_year,
                marital, guardian_name, guardian_relation, guardian_phone,
                spouse_name, spouse_phone, has_kids, kids_count, children_data,
                ex_spouse_name, has_kids_w, kids_count_w, children_data_w,
                address, housing_type, employment, profession, employer,
                breadwinner, chronic, diseases, education, legal,
                legal_details, assoc, assoc_name, service_type, notes
            ) VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?
            )
        `);

        const result = stmt.run(
            b.firstName, b.fatherName, b.lastName, b.gender, b.motherName,
            b.birthDay || null, b.birthMonth || null, b.birthYear || null,
            b.province, b.nationalId,
            b.phone || null, b.bloodType || null, photoPath, docPath,
            b.arrestDay || null, b.arrestMonth || null, b.arrestYear || null,
            b.arrestPlace, b.arrestAuthority, b.arrestReason,
            b.arrestCauser || null, b.status || null,
            b.releaseDay || null, b.releaseMonth || null, b.releaseYear || null,
            b.deathDay || null, b.deathMonth || null, b.deathYear || null,
            b.marital || null, b.guardianName || null,
            b.guardianRelation || null, b.guardianPhone || null,
            b.spouseName || null, b.spousePhone || null,
            b.hasKids || null, b.kidsCount || null,
            childrenData ? JSON.stringify(childrenData) : null,
            b.exSpouseName || null, b.hasKidsW || null,
            b.kidsCountW || null,
            childrenDataW ? JSON.stringify(childrenDataW) : null,
            b.address, b.housingType,
            b.employment || null, b.profession || null, b.employer || null,
            b.breadwinner || null, b.chronic || null, b.diseases || null,
            b.education || null, b.legal || null, b.legalDetails || null,
            b.assoc || null, b.assocName || null, b.serviceType || null,
            b.notes || null
        );

        res.json({ success: true, id: result.lastInsertRowid });
    } catch (err) {
        console.error('Error saving record:', err);
        res.status(500).json({ error: 'Failed to save record: ' + err.message });
    }
});

// Get all records (with pagination and search)
app.get('/api/records', (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';
        const status = req.query.status || '';
        const province = req.query.province || '';

        let where = 'WHERE 1=1';
        const params = [];

        if (search) {
            where += ' AND (first_name LIKE ? OR last_name LIKE ? OR father_name LIKE ? OR national_id LIKE ? OR phone LIKE ? OR mother_name LIKE ?)';
            const s = `%${search}%`;
            params.push(s, s, s, s, s, s);
        }

        if (status) {
            where += ' AND status = ?';
            params.push(status);
        }

        if (province) {
            where += ' AND province = ?';
            params.push(province);
        }

        // Advanced filters
        const gender = req.query.gender || '';
        const marital = req.query.marital || '';
        const education = req.query.education || '';
        const chronic = req.query.chronic || '';
        const bloodType = req.query.bloodType || '';
        const arrestYearFrom = req.query.arrestYearFrom || '';
        const arrestYearTo = req.query.arrestYearTo || '';
        const hasPhoto = req.query.hasPhoto || '';

        if (gender) { where += ' AND gender = ?'; params.push(gender); }
        if (marital) { where += ' AND marital = ?'; params.push(marital); }
        if (education) { where += ' AND education = ?'; params.push(education); }
        if (chronic) { where += ' AND chronic = ?'; params.push(chronic); }
        if (bloodType) { where += ' AND blood_type = ?'; params.push(bloodType); }
        if (arrestYearFrom) { where += ' AND arrest_year >= ?'; params.push(parseInt(arrestYearFrom)); }
        if (arrestYearTo) { where += ' AND arrest_year <= ?'; params.push(parseInt(arrestYearTo)); }
        if (hasPhoto === 'yes') { where += ' AND photo_path IS NOT NULL'; }
        if (hasPhoto === 'no') { where += ' AND photo_path IS NULL'; }

        const total = db.prepare(`SELECT COUNT(*) as count FROM records ${where}`).get(...params).count;
        const records = db.prepare(`SELECT * FROM records ${where} ORDER BY id DESC LIMIT ? OFFSET ?`).all(...params, limit, offset);

        res.json({
            records,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        console.error('Error fetching records:', err);
        res.status(500).json({ error: 'Failed to fetch records' });
    }
});

// Get a single record by ID
app.get('/api/records/:id', (req, res) => {
    try {
        const record = db.prepare('SELECT * FROM records WHERE id = ?').get(req.params.id);
        if (!record) return res.status(404).json({ error: 'Record not found' });
        res.json(record);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch record' });
    }
});

// Delete a record
app.delete('/api/records/:id', (req, res) => {
    try {
        const record = db.prepare('SELECT photo_path, document_path FROM records WHERE id = ?').get(req.params.id);
        if (!record) return res.status(404).json({ error: 'Record not found' });

        // Delete associated files
        if (record.photo_path) {
            const photoFile = path.join(UPLOAD_DIR, 'photos', record.photo_path);
            if (fs.existsSync(photoFile)) fs.unlinkSync(photoFile);
        }
        if (record.document_path) {
            const docFile = path.join(UPLOAD_DIR, 'documents', record.document_path);
            if (fs.existsSync(docFile)) fs.unlinkSync(docFile);
        }

        db.prepare('DELETE FROM records WHERE id = ?').run(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete record' });
    }
});

// Export all records as JSON
app.get('/api/export', (req, res) => {
    try {
        const records = db.prepare('SELECT * FROM records ORDER BY id DESC').all();
        res.setHeader('Content-Disposition', 'attachment; filename="registry_export.json"');
        res.json(records);
    } catch (err) {
        res.status(500).json({ error: 'Failed to export records' });
    }
});

// Stats endpoint
app.get('/api/stats', (req, res) => {
    try {
        const total = db.prepare('SELECT COUNT(*) as count FROM records').get().count;
        const enforced = db.prepare("SELECT COUNT(*) as count FROM records WHERE status = 'enforced'").get().count;
        const survivors = db.prepare("SELECT COUNT(*) as count FROM records WHERE status = 'survivor'").get().count;
        const deceased = db.prepare("SELECT COUNT(*) as count FROM records WHERE status = 'deceased'").get().count;

        res.json({ total, enforced, survivors, deceased });
    } catch (err) {
        res.status(500).json({ error: 'Failed to get stats' });
    }
});

// Database backup endpoint
app.get('/api/backup', (req, res) => {
    try {
        // Checkpoint WAL to ensure all data is in the main DB file
        db.pragma('wal_checkpoint(TRUNCATE)');

        const backupName = `registry_backup_${new Date().toISOString().slice(0,10).replace(/-/g,'')}_${Date.now()}.db`;
        const backupPath = path.join(__dirname, backupName);

        // Copy the database file
        fs.copyFileSync(DB_PATH, backupPath);

        res.download(backupPath, backupName, (err) => {
            // Clean up the temporary backup file after download
            if (fs.existsSync(backupPath)) fs.unlinkSync(backupPath);
            if (err && !res.headersSent) {
                res.status(500).json({ error: 'Backup download failed' });
            }
        });
    } catch (err) {
        console.error('Backup error:', err);
        res.status(500).json({ error: 'Failed to create backup: ' + err.message });
    }
});

// Export as CSV
app.get('/api/export/csv', (req, res) => {
    try {
        const records = db.prepare('SELECT * FROM records ORDER BY id DESC').all();
        const headers = [
            'id','created_at','first_name','father_name','last_name','gender','mother_name',
            'birth_day','birth_month','birth_year','province','national_id','phone','blood_type',
            'arrest_day','arrest_month','arrest_year','arrest_place','arrest_authority','arrest_reason',
            'arrest_causer','status','release_day','release_month','release_year',
            'death_day','death_month','death_year','marital','address','housing_type',
            'employment','profession','employer','breadwinner','chronic','diseases',
            'education','legal','legal_details','assoc','assoc_name','service_type','notes'
        ];

        // BOM for Excel Arabic support
        let csv = '\ufeff' + headers.join(',') + '\n';
        for (const r of records) {
            csv += headers.map(h => {
                const val = r[h];
                if (val == null) return '';
                const str = String(val).replace(/"/g, '""');
                return `"${str}"`;
            }).join(',') + '\n';
        }

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="registry_export.csv"');
        res.send(csv);
    } catch (err) {
        res.status(500).json({ error: 'Failed to export CSV' });
    }
});

// Province stats for reports
app.get('/api/stats/provinces', (req, res) => {
    try {
        const rows = db.prepare('SELECT province, COUNT(*) as count FROM records GROUP BY province ORDER BY count DESC').all();
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to get province stats' });
    }
});

// Gender stats
app.get('/api/stats/gender', (req, res) => {
    try {
        const rows = db.prepare('SELECT gender, COUNT(*) as count FROM records GROUP BY gender').all();
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to get gender stats' });
    }
});

// ══════════════════════════════════════════════
// Helper Functions
// ══════════════════════════════════════════════
function collectChildrenData(body, prefix) {
    const children = [];
    for (let i = 1; i <= 20; i++) {
        const key = `cName_${prefix}_${i}`;
        if (body[key]) {
            children.push({
                name: body[key],
                age: body[`cAge_${prefix}_${i}`] || '',
                education: body[`cEdu_${prefix}_${i}`] || '',
                job: body[`cJob_${prefix}_${i}`] || '',
                healthStatus: body[`cHP_${prefix}_${i}`] || '',
                healthDetails: body[`cHPD_${prefix}_${i}`] || ''
            });
        }
    }
    return children.length > 0 ? children : null;
}

// ══════════════════════════════════════════════
// Start Server
// ══════════════════════════════════════════════
app.listen(PORT, '0.0.0.0', () => {
    console.log('');
    console.log('╔════════════════════════════════════════════════╗');
    console.log('║       جمعية حقنا - نظام تسجيل البيانات       ║');
    console.log('║     Haquna Registry System - Server Started    ║');
    console.log('╠════════════════════════════════════════════════╣');
    console.log(`║  Local:   http://localhost:${PORT}               ║`);
    console.log('║                                                ║');

    // Show LAN IP addresses
    const nets = require('os').networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            if (net.family === 'IPv4' && !net.internal) {
                const addr = `http://${net.address}:${PORT}`;
                const pad = ' '.repeat(Math.max(0, 36 - addr.length));
                console.log(`║  Network: ${addr}${pad}║`);
            }
        }
    }

    console.log('║                                                ║');
    console.log(`║  Admin:   http://localhost:${PORT}/admin          ║`);
    console.log('╠════════════════════════════════════════════════╣');
    console.log('║  Database: registry.db (SQLite)                ║');
    console.log('║  Uploads:  ./uploads/                          ║');
    console.log('╚════════════════════════════════════════════════╝');
    console.log('');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down...');
    db.close();
    process.exit(0);
});

process.on('SIGTERM', () => {
    db.close();
    process.exit(0);
});
