const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');

dotenv.config();

const listUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/parking_system');
        console.log('MongoDB Connected');

        const users = await User.find({});
        let output = `Total Users: ${users.length}\n`;
        users.forEach(u => {
            output += `- ID: ${u._id}, Name: ${u.name}, Email: ${u.email}, Phone: ${u.phone}, Role: ${u.role}, Verified: ${u.isVerified}\n`;
        });

        fs.writeFileSync(path.join(__dirname, 'users.txt'), output);
        console.log('Users listed to users.txt');

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

listUsers();
