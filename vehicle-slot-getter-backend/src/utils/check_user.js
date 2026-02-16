const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

const emailToCheck = 'vanshkaushik380@gmail.com';

const checkUser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/parking_system');
        console.log('MongoDB Connected');

        const user = await User.findOne({ email: emailToCheck }).select('+otp +otpExpires +password');

        if (user) {
            console.log('User found:', {
                id: user._id,
                name: user.name,
                email: user.email,
                isVerified: user.isVerified,
                role: user.role,
                otp: user.otp, // Show OTP to help user verify
            });
        } else {
            console.log(`User with email ${emailToCheck} not found.`);
        }

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkUser();
