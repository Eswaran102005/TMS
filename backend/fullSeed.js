require('dotenv').config();
const mongoose = require('mongoose');
const Role = require('./models/Role');
const Department = require('./models/Department');
const Programme = require('./models/Programme');
const Block = require('./models/Block');
const Room = require('./models/Room');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tms_test';

async function resetAndSeed() {
    try {
        await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('Connected to MongoDB. Starting fresh seed...');

        // 0. Clear Existing Data (excluding roles and users for now, or just wipe infrastructure)
        await Room.deleteMany({});
        await Block.deleteMany({});
        await Programme.deleteMany({});
        await Department.deleteMany({});
        console.log('Cleared existing infrastructure data.');

        // 1. Seed 8 Departments
        const deptsData = [
            { name: 'Computer Science Engineering', shortName: 'CSE' },
            { name: 'Electronics & Communication', shortName: 'ECE' },
            { name: 'Mechanical Engineering', shortName: 'MECH' },
            { name: 'Civil Engineering', shortName: 'CIVIL' },
            { name: 'Information Technology', shortName: 'IT' },
            { name: 'Science & Humanities', shortName: 'S&H' },
            { name: 'Master of Business Admin', shortName: 'MBA' },
            { name: 'Master of Computer App', shortName: 'MCA' }
        ];

        const depts = [];
        for (const d of deptsData) {
            const doc = await Department.create(d);
            depts.push(doc);
        }
        console.log('8 Departments seeded.');

        // 2. Seed Programmes for each Department
        const programmes = [];
        for (const dept of depts) {
            const p1 = await Programme.create({
                name: `B.E. ${dept.name}`,
                shortName: `B-${dept.shortName}`,
                department: dept._id
            });
            programmes.push(p1);
        }
        console.log('Programmes seeded (1 per department).');

        // 3. Seed 5 Blocks and 5 Rooms for each Department
        for (const dept of depts) {
            const deptProg = programmes.find(p => p.department.toString() === dept._id.toString());

            const blocks = [];
            for (let i = 1; i <= 5; i++) {
                const block = await Block.create({
                    name: `${dept.shortName} Block ${i}`,
                    department: dept._id,
                    programme: deptProg._id,
                    description: `Structural unit ${i} for ${dept.name}`
                });
                blocks.push(block);
            }

            for (let i = 1; i <= 5; i++) {
                // Assign each room to one of the 5 blocks
                const targetBlock = blocks[i - 1];
                await Room.create({
                    roomNumber: `${dept.shortName}-${100 + i}`,
                    department: dept._id,
                    programme: deptProg._id,
                    block: targetBlock._id,
                    floor: 1,
                    capacity: 60
                });
            }
        }
        console.log('5 Blocks and 5 Rooms seeded for each department.');

        // 4. Ensure Roles exist
        const rolesData = [
            { name: 'SuperAdmin', description: 'Full system access' },
            { name: 'User', description: 'Standard student/staff user' },
            { name: 'Networking Staff', description: 'Handles IT/Network complaints' },
            { name: 'Plumber', description: 'Handles water/pipe issues' },
            { name: 'Electrician', description: 'Handles electrical issues' },
            { name: 'Software Developer', description: 'System maintenance' }
        ];
        for (const r of rolesData) {
            await Role.findOneAndUpdate({ name: r.name }, r, { upsert: true });
        }

        // 5. Ensure Default Admin exists
        const adminExists = await User.findOne({ role: 'SuperAdmin' });
        if (!adminExists) {
            const hashedPassword = await bcrypt.hash('password123', 10);
            await User.create({
                username: 'admin',
                email: 'admin@tms.com',
                phone: '1234567890',
                password: hashedPassword,
                role: 'SuperAdmin',
                department: depts[0]._id
            });
            console.log('Default Admin created.');
        }

        console.log('DATABASE RESET AND CLEAN SEED COMPLETED!');
        process.exit(0);
    } catch (error) {
        console.error('Error during seeding:', error);
        process.exit(1);
    }
}

resetAndSeed();
