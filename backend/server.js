const dotenv = require("dotenv");

dotenv.config();

const app = require("./src/app");
const connectDB = require("./src/config/db")
const PORT = process.env.PORT || 5000;

const startServer = async ()=>{
    try{
        await connectDB();

        app.listen(PORT , ()=>{
            console.log(`server is running on http://localhost:${PORT}`);
        });
    }catch(error){
        console.log("Server startup failed");
        console.error(error.message);

        process.exit(1)
    }
}

startServer();