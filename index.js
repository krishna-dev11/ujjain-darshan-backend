const express = require("express")
const app = express();
const dns = require("node:dns");

dns.setServers(["8.8.8.8", "8.8.4.4"]);



const userRoutes = require("./Routes/User")
const profileRoutes = require("./Routes/Profile")
const paymentRoutes = require("./Routes/Payment")
const courseRoutes = require("./Routes/Course")
const aiRoutes = require("./Routes/aiRoutes");
const walkInRoutes = require("./Routes/WalkIn");
const expenseRoutes = require("./Routes/expense");
const TestimonailRoute = require("./Routes/testimonialRoutes")
const enrollmentRoutes = require("./Routes/enrollment.routes");


const {dbconnect} = require('./config/Database')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const {cloudinaryConnect} = require('./config/Cloudinary')
const fileUpload = require('express-fileupload')
require("dotenv").config();


const PORT = process.env.PORT || 4000;

dbconnect();

app.use(express.json());
app.use(cookieParser());
app.use(
    cors({
        origin:"https://shree-ji-darshan-ujjain.vercel.app",   
        // origin:"http://localhost:5173",
        credentials : true
    })
)

        // push karte wakt uncomment karna
        // origin:"http://localhost:3000",


app.use(fileUpload({
    useTempFiles : true,
    tempFileDir : '/tmp/'
}));

cloudinaryConnect();

app.use("/api/v1/auth" , userRoutes);
app.use("/api/v1/profile" , profileRoutes);
app.use("/api/v1/course" , courseRoutes);
app.use("/api/v1/payment" , paymentRoutes);
app.use("/api/v1/ai", aiRoutes);


//coaching
app.use("/api/v1/walkin", walkInRoutes);



app.use("/api/v1/expense", expenseRoutes);


app.use("/api/v1/testimonial", TestimonailRoute);

app.use("/api/v1/enrollment", enrollmentRoutes);





app.get('/' , async(req ,res)=>{
    return res.json({
        success:true,
        message : 'your server is up and running'
    })
});


app.listen(PORT , ()=>{
    console.log(`app listen at port ${PORT}`)
});