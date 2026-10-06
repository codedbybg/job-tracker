const User = require("../models/User");

// Create User
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

// Get all users
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

// base route
const baseRoute = async (req , res)=>{
    res.status(200).json({
        success : true,
        message : "JobTracker API is working"
    });
}

// GET SINGLE USER
const getUserById = async (req , res)=>{
    try {
        const {id} = req.params;

        const user = await User.findById(id);

        if(!user){
            return res.status(404).json({
                success : false,
                message : "User not found!"
            });
        }

        res.status(200).json({
            success : true,
            data : user
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success : false,
            message : "Failed to  fetch user",
            error : error.message
        });
    }
}

// UPDATE USER
const updateUser = async (req , res)=>{
    try {
        const {id} = req.params;

        const updatedUser = await User.findByIdAndUpdate(
            id,
            req.body,
            {
                new : true,
                runValidators : true
            }
        );

        if(!updatedUser){
            return res.status(404).json({
                success : false,
                message : "User not found!"
            });
        }

        res.status(200).json({
            success : true,
            message : "User Updated successfully",
            data : updatedUser
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success : false,
            message : "Failed to update user",
            error : error.error
        });
    }
};

// DELETE USER
const deleteUser = async (req , res)=>{
    try{
        const {id} = req.params;

        const deletedUser = await User.findByIdAndDelete(id);

        if(!deletedUser){
            return res.status(404).json({
                success : false,
                message : "User not found"
            });
        }

        res.status(200).json({
            success : true,
            message : "User deleted successfully"
        });

    }catch(error){
        console.error(error);

        res.status(500).json({
            success : false,
            message : "Failed to delete user",
            error : error.message
        });
    }
};


module.exports = {
    createUser,
    getUser,
    baseRoute,
    getUserById,
    updateUser,
    deleteUser
};