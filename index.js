const bcrypt = require('bcryptjs');
require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { authenticateToken } = require('./utilities.js'); 
const upload = require('./multer.js');
const fs= require('fs');
const path= require('path');

// Connect to MongoDB
mongoose.connect("mongodb+srv://rastogisahil20:rastogi20@traveller.iiocu.mongodb.net/mydb")
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

const User = require('./models/user.js');
const TravelStory = require('./models/travelstory.js');
const app = express();
app.use(express.json());
// app.use(cors({ origin: '*' }));
const uri=process.env.url||'*';
app.use(cors({
    origin: uri,
    credentials: true
  }));

const jwtSecret = process.env.JWT_SECRET;

// POST route for creating a user account
// app.post("/create-account", async (req, res) => {
//     const { FullName, email, password } = req.body;

//     // Basic input validation
//     if (!FullName || !email || !password) {
//         return res.status(400).json({ message: "All fields are required." });
//     }

//     try {
//         const user = await User.findOne({ email });
//         if (user) {
//             return res.status(400).json({ message: "email already exists" });
//         }

//         const hashedPassword = bcrypt.hashSync(password, 10);
//         const newUser = new User({ FullName, email, password: hashedPassword });

//         await newUser.save();
//         const token = jwt.sign({ userId: newUser._id, email }, jwtSecret, { expiresIn: '1h' });

//         res.json({
//             message: "User created successfully",
//             token: token
//         });
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// });
app.post("/create-account", async (req, res) => {
    const { FullName, email, password } = req.body;

    if (!FullName || !email || !password) {
        return res.status(400).json({ message: "All fields are required." });
    }

    try {
        const user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: "Email already exists" });
        }

        const hashedPassword = bcrypt.hashSync(password, 10);
        const newUser = new User({ FullName, email, password: hashedPassword });

        await newUser.save();

        const accessToken = jwt.sign(
            { userId: newUser._id },
            jwtSecret,
            { expiresIn: "72h" }
        );

        return res.status(201).json({
            error: false,
            user: { FullName: newUser.FullName, email: newUser.email },
            accessToken,
            message: "Registration successful"
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// POST route for logging in
// app.post('/login', async (req, res) => {
//     const { email, password } = req.body;

//     // Check if the email and password are provided
//     if (!email || !password) {
//         return res.status(400).json({ message: "email and password are required." });
//     }

//     try {
//         const user = await User.findOne({ email });
//         if (!user) {
//             return res.status(401).json({ message: 'Invalid credentials' });
//         }

//         // Compare the password
//         const isMatch = await bcrypt.compare(password, user.password);
//         if (!isMatch) {
//             return res.status(401).json({ message: 'Invalid credentials' });
//         }

//     //     // Create and send token
//     //     const token = jwt.sign({ userId: user._id, email: user.email }, jwtSecret, { expiresIn: '1h' });
//     //     res.cookie('token', token, { httpOnly: true }).json({ message: 'Logged in', token });
//     // } catch (err) {
//     //     res.status(500).json({ message: err.message });
//     // 
//     const accessToken = jwt.sign(
//         { userId: user._id },
//         jwtSecret,
//         { expiresIn: "72h" }
//       );
      
//       return res.json({
//         error: false,
//         message: "Login Successful",
//         user: { FullName: user.FullName, email: user.email },
//         accessToken
//       });
      
// });
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required." });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const accessToken = jwt.sign(
            { userId: user._id },
            jwtSecret,
            { expiresIn: "72h" }
        );

        return res.json({
            error: false,
            message: "Login Successful",
            user: { FullName: user.FullName, email: user.email },
            accessToken
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// Get User
app.get("/get-user", authenticateToken, async (req, res) => {
    const { userId } = req.user;

    try {
        const isuser = await User.findOne({_id:userId});
        if (!isuser) {
            return res.sendStatus(401); // Unauthorized
        }

        return res.json({
            user: isuser,
            message: ""
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
app.post("/add-travel-story", authenticateToken, async (req, res) => {
        const { title, story, visitedLocation, imageUrl, visitedDate } = req.body;
        const { userId } = req.user;
    
        // Validate required fields
        if (!title || !story || !visitedLocation || !imageUrl || !visitedDate) {
            return res.status(400).json({ error: true, message: "All fields are required" });
        }
    
        const parsedVisitedDate = new Date(parseInt(visitedDate));
        const newTravelStory = new TravelStory({
            title, 
            story, 
            visitedLocation, 
            imageUrl, 
            visitedDate: parsedVisitedDate, 
            userId
        });
    
        try {
            await newTravelStory.save();
            return res.json({  story:newTravelStory, message: "Travel story added successfully" });
        } catch (err) {
            return res.status(500).json({ message: err.message });
        }
    });
    
    // GET route for fetching all travel stories for a user
    app.get("/get-all-stories", authenticateToken, async (req, res) => {
        const { userId} = req.user;
    
        try {
            const travelStories = await TravelStory.find({ userId }).sort({ isFavourite: -1 });
            return res.status(200).json({ stories: travelStories });
        } catch (error) {
            return res.status(500).json({ error: true, message: error.message });
        }
    });
    app.post('/image-upload',upload.single("image"),function(req,res){
        // Save the uploaded image to the server
        try {
            if (!req.file) {
              return res
                .status(400)
                .json({ error: true, message: "No image uploaded" });
            }
          
            const imageUrl = `http://localhost:8000/uploads/${req.file.filename}`;
          
            res.status(201).json({ imageUrl });
          } catch (error) {
            res.status(500).json({ error: true, message: error.message });
          }
          

    });
    app.delete('/delete-image', async(req, res)=> {
        const {imageUrl} = req.query;

    if (!imageUrl) {
        return res
          .status(400)
          .json({ error: true, message: "imageUrl parameter is required" });
      }
      
      try {
        // Extract the filename from the imageUrl
        const filename = path.basename(imageUrl);
      
        // Define the file path
        const filePath = path.join(__dirname, 'uploads', filename);
      
        // Check if the file exists
        if (fs.existsSync(filePath)) {
          // Delete the file from the uploads folder
          fs.unlinkSync(filePath);
          res.status(200).json({ message: "Image deleted successfully" });
        } else {
          res.status(200).json({ error: true, message: "Image not found" });
        }
      } catch (error) {
        res.status(500).json({ error: true, message: error.message });
      }
    });
      
    app.use("/uploads",express.static(path.join(__dirname,"uploads")));
    app.use("/assests",express.static(path.join(__dirname,"assests")));
// Edit Travel Story
app.put("/edit-story/:id", authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { title, story, visitedLocation, imageUrl, visitedDate } = req.body;
    const{ userId} = req.user;
  
    // Validate required fields
    if (!title || !story || !visitedLocation || !imageUrl || !visitedDate) {
      return res
        .status(400)
        .json({ error: true, message: "All fields are required" });
    }
  
    // Convert visitedDate from milliseconds to Date object
    const parsedVisitedDate = new Date(parseInt(visitedDate));
  
    try {
        // Find the travel story by ID and ensure it belongs to the authenticated user
        const travelStory = await TravelStory.findOne({ _id: id, userId: userId });
      
        if (!travelStory) {
          return res
            .status(404)
            .json({ error: true, message: "Travel story not found" });
        }
      
        const placeholderImgUrl = "http://localhost:8000/assets/travel.jpeg";
      
        // Update travel story fields
        travelStory.title = title;
        travelStory.story = story;
        travelStory.visitedLocation = visitedLocation;
        travelStory.imageUrl = imageUrl || placeholderImgUrl;
        travelStory.visitedDate = parsedVisitedDate;
      
        // Save the updated travel story
        await travelStory.save();
      
        res.status(200).json({ story: travelStory, message: "Update Successful" });
      } catch (error) {
        res.status(500).json({ error: true, message: error.message });
      }
      

  });
  app.delete("/delete-story/:id", authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { userId } = req.user;
  
    try {
      // Find the travel story by ID and ensure it belongs to the authenticated user
      const travelStory = await TravelStory.findOne({ _id: id, userId: userId });
  
      if (!travelStory) {
        return res
          .status(404)
          .json({ error: true, message: "Travel story not found" });
      }
  
      // Delete the travel story from the database
      await travelStory.deleteOne({ _id: id, userId: userId });
  
      // Extract the filename from the imageUrl
      const imageUrl = travelStory.imageUrl;
      const filename = path.basename(imageUrl);
  
      // Define the file path
      const filePath = path.join(__dirname, 'uploads', filename);

      // Assuming filePath is the path to the image file you want to delete
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error('Failed to delete image file:', err);
      
          // Optionally, you could still respond with a success status here
          // if you don't want to treat this as a critical error.
        }
      
        res.status(200).json({ message: 'Travel story deleted successfully' });
      });
    }catch(e){
        res.status(500).json({ error: true, message: e.message });
    }
});
app.put("/update-is-favours/:id", authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { isFavourite } = req.body;
    const { userId } = req.user;

    try {
        const travelStory = await TravelStory.findOne({ _id: id, userId: userId });

        if (!travelStory) {
            return res.status(404).json({ error: true, message: "Travel story not found" });
        }

        travelStory.isFavourite = isFavourite;

        await travelStory.save();
        res.status(200).json({ story: travelStory, message: 'Update Successful' });

    } catch (error) {
        res.status(500).json({ error: true, message: error.message });
    }
});
app.get("/search", authenticateToken, async (req, res) => {
    const { query } = req.query;
    const { userId } = req.user;

    if (!query) {
        return res.status(404).json({ error: true, message: "query is required" });
    }

    try {
        const searchResults = await TravelStory.find({
            userId: userId,
            $or: [
                { title: { $regex: query, $options: "i" } },
                { story: { $regex: query, $options: "i" } },
                { visitedLocation: { $regex: query, $options: "i" } }
            ]
        }).sort({ isFavourite: -1 });

        res.status(200).json({ stories: searchResults });
    } catch (error) {
        res.status(500).json({ error: true, message: error.message });
    }
});
app.get("/travel-stories/filter", authenticateToken, async (req, res) => {
    const { startDate, endDate } = req.query;
    const { userId } = req.user;

    try {
        const start = new Date(parseInt(startDate));
        const end = new Date(parseInt(endDate));

        // Find travel stories that belong to the authenticated user and fall within the date range
        const filteredStories = await TravelStory.find({
            userId: userId,
            visitedDate: { $gte: start, $lte: end }
        }).sort({ isFavourite: -1 });

        res.status(200).json({ stories: filteredStories });
    } catch (error) {
        res.status(500).json({ error: true, message: error.message });
    }
});
  
  
  

// Start the server
app.listen(process.env.PORT, () => {
    console.log("Server is running on port 8000");
});
