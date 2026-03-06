const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

dotenv.config();

const emailToUpdate = 'vanshkaushik380@gmail.com';
const newPassword = 'vansh@0993';

const fixPassword = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/parking_system');
        console.log('MongoDB Connected');

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Use updateOne to bypass the pre-save hook that was double hashing
        const result = await User.updateOne(
            { email: emailToUpdate },
            { $set: { password: hashedPassword } }
        );

        if (result.matchedCount > 0) {
            console.log(`SUCCESS: Password for ${emailToUpdate} fixed.`);
        } else {
            console.log(`ERROR: User ${emailToUpdate} not found.`);
        }

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

fixPassword();
