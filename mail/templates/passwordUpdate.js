// const passwordUpdated = (email, name) => {
// 	return `<!DOCTYPE html>
//     <html lang="en">
    
//     <head>
//         <meta charset="UTF-8">
//         <title>Password Updated</title>
//         <style>
//             body {
//                 margin: 0;
//                 padding: 0;
//                 background: linear-gradient(to right, #f8fafc, #e2e8f0);
//                 font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
//                 color: #2d3748;
//             }

//             .container {
//                 max-width: 600px;
//                 margin: 40px auto;
//                 background-color: #ffffff;
//                 box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
//                 border-radius: 12px;
//                 padding: 40px 50px;
//                 text-align: center;
//             }

//             .logo {
//                 max-width: 120px;
//                 margin-bottom: 30px;
//             }

//             .heading {
//                 font-size: 24px;
//                 font-weight: 700;
//                 color: #1a202c;
//                 margin-bottom: 25px;
//             }

//             .body {
//                 font-size: 16px;
//                 line-height: 1.7;
//                 text-align: left;
//                 color: #4a5568;
//             }

//             .highlight {
//                 font-weight: bold;
//                 color: #2b6cb0;
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
//             <a href="https://studynotion-edtech-project.vercel.app">
//                 <img class="logo" src="https://i.ibb.co/7Xyj3PC/logo.png" alt="StudyNotion Logo">
//             </a>

//             <div class="heading">🔐 Password Successfully Updated</div>

//             <div class="body">
//                 <p>Hi ${name},</p>
//                 <p>This is a confirmation that the password for your StudyNotion account associated with 
//                     <span class="highlight">${email}</span> has been successfully changed.</p>

//                 <p>If you did <strong>not</strong> make this change, please <a href="mailto:info@studynotion.com">contact us immediately</a> to secure your account.</p>

//                 <p>For your safety, we recommend not sharing your credentials with anyone.</p>
//             </div>

//             <div class="footer">
//                 Need help or have concerns?<br>
//                 Reach us at <a href="mailto:info@studynotion.com">info@studynotion.com</a>. We’re here to help you 24/7.
//             </div>
//         </div>
//     </body>
    
//     </html>`;
// };

// module.exports = passwordUpdated;






const passwordUpdated = (email, name) => {
	return `<!DOCTYPE html>
    <html lang="en">
    
    <head>
        <meta charset="UTF-8">
        <title>Password Updated</title>
        <style>
            body {
                margin: 0;
                padding: 0;
                background: linear-gradient(to right, #f8fafc, #e2e8f0);
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                color: #2d3748;
            }

            .container {
                max-width: 600px;
                margin: 40px auto;
                background-color: #ffffff;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
                border-radius: 12px;
                padding: 40px 50px;
                text-align: center;
            }

            .logo {
                max-width: 120px;
                margin-bottom: 30px;
            }

            .heading {
                font-size: 24px;
                font-weight: 700;
                color: #1a202c;
                margin-bottom: 25px;
            }

            .body {
                font-size: 16px;
                line-height: 1.7;
                text-align: left;
                color: #4a5568;
            }

            .highlight {
                font-weight: bold;
                color: #2b6cb0;
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
                <img class="logo" src="https://res.cloudinary.com/dosupd81x/image/upload/v1744524978/Screenshot_2025-04-13_114524_wcuugd.png" alt="K-tech Logo">
            </a>

            <div class="heading">🔐 Password Successfully Updated</div>

            <div class="body">
                <p>Hi ${name},</p>
                <p>This is a confirmation that the password for your <strong>K-tech</strong> account associated with 
                    <span class="highlight">${email}</span> has been successfully changed.</p>

                <p>If you did <strong>not</strong> make this change, please <a href="mailto:ktech.2025.dummy@gmail.com">contact us immediately</a> to secure your account.</p>

                <p>For your safety, we recommend not sharing your credentials with anyone.</p>
            </div>

            <div class="footer">
                Need help or have concerns?<br>
                Reach us at <a href="mailto:ktech.2025.dummy@gmail.com">ktech.2025.dummy@gmail.com</a>. We’re here to help you 24/7.
            </div>
        </div>
    </body>
    
    </html>`;
};

module.exports = passwordUpdated;
