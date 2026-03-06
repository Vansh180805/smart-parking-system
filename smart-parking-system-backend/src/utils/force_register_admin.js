const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

dotenv.config();

const adminEmail = 'vanshkaushik380@gmail.com';
const adminPasswordRaw = 'admin123'; // Standard password for them to use
const adminPhone = '9876543210';
const adminName = 'Vansh Kaushik';

const forceRegisterAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/parking_system');
        console.log('MongoDB Connected');

        // Check if user exists
        let user = await User.findOne({ email: adminEmail });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(adminPasswordRaw, salt);

        if (user) {
            console.log('User exists. Updating to Admin...');
            user.role = 'admin';
            user.isVerified = true;
            user.password = hashedPassword;
            user.otp = undefined;
            user.otpExpires = undefined;
            await user.save();
            console.log('User updated successfully.');
        } else {
            console.log('User not found. Creating new Admin user...');
            user = await User.create({
                name: adminName,
                email: adminEmail,
                phone: adminPhone,
                password: hashedPassword,
                role: 'admin',
                isVerified: true,
            });
            console.log('User created successfully.');
        }

        console.log(`
    =============================================
    LOGIN CREDENTIALS:
    Email: ${adminEmail}
    Password: ${adminPasswordRaw}
    Role: ADMIN
    =============================================
    `);

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

forceRegisterAdmin();
