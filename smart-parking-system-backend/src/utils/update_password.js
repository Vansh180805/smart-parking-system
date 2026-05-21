const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

dotenv.config();

const emailToUpdate = 'vanshkaushik380@gmail.com';
const newPassword = 'vansh@0993'; // The password user is trying to use

const updateAdminPassword = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/parking_system');
        console.log('MongoDB Connected');

        const user = await User.findOne({ email: emailToUpdate });

        if (user) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);
            await user.save();
            console.log(`SUCCESS: Password for ${emailToUpdate} has been updated to '${newPassword}'.`);
        } else {
            console.log(`ERROR: User ${emailToUpdate} not found.`);
        }

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

updateAdminPassword();
