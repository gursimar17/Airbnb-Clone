const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");

const mongoURL = "mongodb://127.0.0.1:27017/Airbnb";

main().then(()=>{
    console.log("connected to database");
}).catch((err)=>{
    console.log(err);
});

async function main(){
    await mongoose.connect(mongoURL);
}

const initDB = async()=>{
    await Listing.deleteMany({});
    initData.data = initData.data.map((obj)=>({...obj, owner: "67bec8de1299464faad47d91"}));
    await Listing.insertMany(initData.data);
    console.log("Data was initialised");
};

initDB();
