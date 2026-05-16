require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./src/modules/auth/auth.model");

mongoose.connect(process.env.MONGO_URI).then(async () => {
    await User.deleteMany(); // clean start

    const user = new User({
        fullName: "Admin",
        email: "admin@gmail.com",
        password: "123456", // plain password
        role: "admin"
    });

    await user.save(); // triggers bcrypt pre-save hook

    console.log("Admin created properly");
    process.exit();
});