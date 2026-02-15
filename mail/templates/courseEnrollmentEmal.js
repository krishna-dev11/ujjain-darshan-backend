// exports.courseEnrollmentEmail = (courseName, name) => {
//     return `<!DOCTYPE html>
//     <html lang="en">
    
//     <head>
//         <meta charset="UTF-8">
//         <title>Course Registration Confirmation</title>
//         <style>
//             body {
//                 margin: 0;
//                 padding: 0;
//                 background: linear-gradient(to right, #f2f4f8, #e8ebf0);
//                 font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
//                 color: #2d3748;
//             }

//             .container {
//                 max-width: 650px;
//                 margin: 40px auto;
//                 background-color: #ffffff;
//                 box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
//                 border-radius: 12px;
//                 padding: 40px 50px;
//                 overflow: hidden;
//             }

//             .logo {
//                 max-width: 150px;
//                 margin: 0 auto 30px;
//                 display: block;
//             }

//             .heading {
//                 font-size: 26px;
//                 font-weight: 700;
//                 color: #1a202c;
//                 text-align: center;
//                 border-bottom: 1px solid #e2e8f0;
//                 padding-bottom: 10px;
//                 margin-bottom: 25px;
//             }

//             .body {
//                 font-size: 17px;
//                 line-height: 1.6;
//                 text-align: left;
//             }

//             .highlight {
//                 font-weight: 600;
//                 color: #111111;
//             }

//             .cta {
//                 display: inline-block;
//                 background-color: #FFD60A;
//                 color: #000;
//                 text-decoration: none;
//                 padding: 14px 30px;
//                 border-radius: 8px;
//                 font-size: 16px;
//                 font-weight: bold;
//                 margin-top: 30px;
//                 transition: background-color 0.3s ease;
//             }

//             .cta:hover {
//                 background-color: #e6c009;
//             }

//             .footer {
//                 font-size: 14px;
//                 color: #718096;
//                 text-align: center;
//                 margin-top: 40px;
//                 line-height: 1.5;
//             }

//             a {
//                 color: #1a73e8;
//                 text-decoration: none;
//             }
//         </style>
//     </head>
    
//     <body>
//         <div class="container">
//             <a href="https://ktech-silk.vercel.app/">
//                 <img class="logo" src="https://i.ibb.co/7Xyj3PC/logo.png" alt="StudyNotion Logo">
//             </a>

//             <div class="heading">🎓 Course Enrollment Successful!</div>

//             <div class="body">
//                 <p>Dear <span class="highlight">${name}</span>,</p>

//                 <p>We're excited to welcome you to the <span class="highlight">"${courseName}"</span> course! 🙌</p>

//                 <p>Your learning journey begins now. Access comprehensive resources, expert videos, and assignments curated just for you.</p>

//                 <p>Click the button below to visit your dashboard and begin:</p>

//                 <a class="cta" href="https://studynotion-edtech-project.vercel.app/dashboard">Go to Dashboard</a>
//             </div>

//             <div class="footer">
//                 Need help or have questions?<br>
//                 Reach us at <a href="mailto:info@studynotion.com">info@studynotion.com</a> – we're always here for you!
//             </div>
//         </div>
//     </body>
    
//     </html>`;
// };




exports.courseEnrollmentEmail = (courseName, name) => {
    return `<!DOCTYPE html>
    <html lang="en">
    
    <head>
        <meta charset="UTF-8">
        <title>Course Registration Confirmation</title>
        <style>
            body {
                margin: 0;
                padding: 0;
                background: linear-gradient(to right, #f2f4f8, #e8ebf0);
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                color: #2d3748;
            }

            .container {
                max-width: 650px;
                margin: 40px auto;
                background-color: #ffffff;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
                border-radius: 12px;
                padding: 40px 50px;
                overflow: hidden;
            }

            .logo {
                max-width: 150px;
                margin: 0 auto 30px;
                display: block;
            }

            .heading {
                font-size: 26px;
                font-weight: 700;
                color: #1a202c;
                text-align: center;
                border-bottom: 1px solid #e2e8f0;
                padding-bottom: 10px;
                margin-bottom: 25px;
            }

            .body {
                font-size: 17px;
                line-height: 1.6;
                text-align: left;
            }

            .highlight {
                font-weight: 600;
                color: #111111;
            }

            .cta {
                display: inline-block;
                background-color: #FFD60A;
                color: #000;
                text-decoration: none;
                padding: 14px 30px;
                border-radius: 8px;
                font-size: 16px;
                font-weight: bold;
                margin-top: 30px;
                transition: background-color 0.3s ease;
            }

            .cta:hover {
                background-color: #e6c009;
            }

            .footer {
                font-size: 14px;
                color: #718096;
                text-align: center;
                margin-top: 40px;
                line-height: 1.5;
            }

            a {
                color: #1a73e8;
                text-decoration: none;
            }
        </style>
    </head>
    
    <body>
        <div class="container">
            <a href="https://ktech-silk.vercel.app/">
                <img class="logo" src="https://res.cloudinary.com/dosupd81x/image/upload/v1744524978/Screenshot_2025-04-13_114524_wcuugd.png" alt="Ktech Logo">
            </a>

            <div class="heading">🎓 Course Enrollment Successful!</div>

            <div class="body">
                <p>Dear <span class="highlight">${name}</span>,</p>

                <p>We're excited to welcome you to the <span class="highlight">"${courseName}"</span> course! 🙌</p>

                <p>Your learning journey begins now. Access comprehensive resources, expert videos, and assignments curated just for you.</p>

                <p>Click the button below to visit your dashboard and begin:</p>

                <a class="cta" href="https://ktech-silk.vercel.app/dashboard/my-profile">Go to Dashboard</a>
            </div>

            <div class="footer">
                Need help or have questions?<br>
                Reach us at <a href="mailto:ktech.2025.dummy@gmail.com">ktech.2025.dummy@gmail.com</a> – we're always here for you!
            </div>
        </div>
    </body>
    
    </html>`;
};
