const User = require("../models/User");

const createUser = async (req , res)=>{
    try {
        const {name , email , password , role , phone , location } = req.body;

        const user = await User.create({
            name , 
            email , 
            password , 
            role , 
            phone , 
            location 
        });

        res.status(201).json({
            success : true ,
            message : "User created successfully",
            data : user
        });



    } catch (error) {
        console.error(error);

        res.status(500).json({
            success : false,
            message : "Failed to create user",
            error : error.message
        });

    }
};

const getUser = async (req , res)=>{
    try {
        const users = await User.find();

        res.status(200).json({
            success : true,
            count : users.length,
            data : users
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success : false,
            message : "Failed to fetch the user",
            error : error.message
        });
    }
};

const baseRoute = async (req , res)=>{
    res.status(200).json({
        success : true,
        message : "JobTracker API is working"
    });
}


module.exports = {
    createUser,
    getUser,
    baseRoute
};