"use strict";

// ------------------- Environment -------------------
if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;

const ExpressError = require("./utils/ExpressError.js");
const User = require("./models/user.js");

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

const app = express();
const port = process.env.PORT || 1234;

// ------------------- DB & Secret -------------------
const dbUrl = process.env.ATLASDB_URL || "mongodb://127.0.0.1:27017/your-db";
const secret = process.env.SECRET || "thisshouldbeabettersecret";

// ------------------- App Setup -------------------
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

// ------------------- MongoDB Connection & Session -------------------
async function main() {
    try {
        // Connect to MongoDB
        const mongooseConnection = await mongoose.connect(dbUrl);
        console.log("MongoDB connected ✅");

// ------------------- Session Store -------------------
const store = MongoStore.create({
    mongoUrl: dbUrl, // <-- USE mongoUrl directly
    // crypto: { secret },
    touchAfter: 24 * 3600,
});

store.on("error", (err) => {
    console.log("Session Store Error:", err);
});

const sessionOptions = {
    store,
    secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
    },
};

app.use(session(sessionOptions));

        app.use(flash());

        // ------------------- Passport -------------------
        app.use(passport.initialize());
        app.use(passport.session());
        passport.use(new LocalStrategy(User.authenticate()));
        passport.serializeUser(User.serializeUser());
        passport.deserializeUser(User.deserializeUser());

        // ------------------- Global Middleware -------------------
        app.use((req, res, next) => {
            res.locals.success = req.flash("success");
            res.locals.error = req.flash("error");
            res.locals.currUser = req.user;
            next();
        });

        // ------------------- Routes -------------------
        app.use("/listings", listingRouter);
        app.use("/listings/:id/reviews", reviewRouter);
        app.use("/", userRouter);

        // 404 Handler
        app.use((req, res, next) => {
            next(new ExpressError(404, "Page Not Found!"));
        });

        // Error Handler
        app.use((err, req, res, next) => {
            if (res.headersSent) return next(err);
            res.status(err.statusCode || 500);
            res.render("error", { err });
        });

        // ------------------- Start Server -------------------
        app.listen(port, () => {
            console.log(`Server is listening on port ${port}`);
        });
    } catch (err) {
        console.error("MongoDB Connection Error:", err);
    }
}

// Initialize everything
main();
