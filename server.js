const express = require('express');
const Database = require('better-sqlite3');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

const uploadDirs = ['uploads/photos', 'uploads/documents'];
uploadDirs.forEach(dir => { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); });

const db = new Database('registry.db');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === 'photo') cb(null, 'uploads/photos');
        else cb(null, 'uploads/documents');
    },
    filename: (req, file, cb) => { cb(null, Date.now() + '-' + file.originalname); }
});
const upload = multer({ storage });

function getVal(val) { return (val === undefined || val === null || val === '') ? null : val; }

app.post('/api/records', upload.fields([{ name: 'photo', maxCount: 1 }, { name: 'document', maxCount: 1 }]), (req, res) => {
    const b = req.body;
    const files = req.files;

    const collectChildren = (prefix) => {
        const children = [];
        const count = parseInt(b[`kidsCount${prefix === 'W' ? 'W' : ''}`]) || 0;
        let u18 = 0;
        for (let i = 1; i <= count; i++) {
            const uid = prefix.toLowerCase() + i;
            const age = parseInt(b[`cAge_${uid}`]);
            if (b[`cName_${uid}`] || !isNaN(age)) {
                children.push({
                    name: b[`cName_${uid}`], age, gender: b[`cGender_${uid}`],
                    edu: b[`cEdu_${uid}`], eduType: b[`cEduType_${uid}`],
                    spec: b[`cSpec_${uid}`], univ: b[`cUniv_${uid}`] || 'جامعة اللاذقية'
                });
                if (age < 18) u18++;
            }
        }
        return { children, u18 };
    };

    const c1 = collectChildren('M');
    const c2 = collectChildren('W');
    const totalKids = c1.children.length + c2.children.length;
    const totalU18 = c1.u18 + c2.u18;

    const sql = `INSERT INTO records (
        first_name, father_name, last_name, gender, mother_name,
        birth_day, birth_month, birth_year, province, national_id,
        phone, blood_type, photo_path, document_path,
        arrest_day, arrest_month, arrest_year, arrest_place,
        arrest_authority, arrest_reason, status, marital,
        kids_count, children_data, address, housing_type,
        education, edu_type, edu_specialization, edu_university,
        kids_under_18_count, death_place, rent_amount,
        has_hypertension, has_diabetes, other_diseases,
        has_special_needs, special_needs_details,
        employment, profession, employer, breadwinner, breadwinner_job
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

    const params = [
        getVal(b.firstName), getVal(b.fatherName), getVal(b.lastName), getVal(b.gender), getVal(b.motherName),
        getVal(b.dob_day), getVal(b.dob_month), getVal(b.dob_year), getVal(b.governorate), getVal(b.nationalId),
        getVal(b.phone), getVal(b.bloodType),
        files['photo'] ? `/uploads/photos/${files['photo'][0].filename}` : null,
        files['document'] ? `/uploads/documents/${files['document'][0].filename}` : null,
        getVal(b.doa_day), getVal(b.doa_month), getVal(b.doa_year), getVal(b.arrestPlace),
        getVal(b.arrestEntity), getVal(b.arrestReason || 'غير محدد'), getVal(b.status || 'survivor'),
        getVal(b.socialStatus), totalKids, JSON.stringify([...c1.children, ...c2.children]),
        getVal(b.address || 'غير محدد'), getVal(b.housing_type || 'غير محدد'),
        getVal(b.education), getVal(b.edu_type), getVal(b.specialization), getVal(b.university),
        totalU18, getVal(b.deathPlace), getVal(b.rent_amount),
        b.has_hypertension ? 1 : 0, b.has_diabetes ? 1 : 0, getVal(b.other_diseases),
        b.has_special_needs ? 1 : 0, getVal(b.special_needs_details),
        getVal(b.employment), getVal(b.profession), getVal(b.employer),
        getVal(b.breadwinner), getVal(b.breadwinner_job)
    ];

    try {
        const info = db.prepare(sql).run(...params);
        res.json({ success: true, id: info.lastInsertRowid });
    } catch (err) {
        console.error("INSERT ERROR:", err.message);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/records', (req, res) => {
    try {
        const rows = db.prepare("SELECT * FROM records ORDER BY id DESC").all();
        res.json({ records: rows });
    } catch (err) {
        console.error("SELECT ERROR:", err.message);
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/records/:id', (req, res) => {
    const b = req.body;
    try {
        db.prepare(`UPDATE records SET
            first_name = ?, father_name = ?, last_name = ?, national_id = ?,
            gender = ?, province = ? WHERE id = ?`)
          .run(b.firstName, b.fatherName, b.lastName, b.nationalId, b.gender, b.governorate, req.params.id);
        res.json({ success: true });
    } catch (err) {
        console.error("UPDATE ERROR:", err.message);
        res.status(500).json({ error: err.message });
    }
});

app.listen(port, () => { console.log(`Server running at http://localhost:${port}`); });
