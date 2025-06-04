# **Project Mark-it**  

## **Team Members**  
- **Danny Yang**  
  dannny.yang@mail.utoronto.ca  
  GitHub: yangda47  

- **Eddy Chen**  
  eddyalfred.chen@mail.utoronto.ca  
  GitHub: chenedd1  

- **Xing Yu (Joe) Zhou**  
  xingyujoe.zhou@mail.utoronto.ca  
  GitHub: zhoux282

## **Brief Description**  
Mark-it is a real-time collaborative drawing web application that allows multiple users to draw simultaneously on a shared file.  
Users can upload images, share files with other users, collaborate on a drawing real-time, chat with other users, view and edit past drawings, and download their drawings.  
The frontend will be built with Vue 3 and communicate with the Express backend using REST API, and credentials will be stored in PostgreSQL and support Google OAuth2, requiring a yearly paid subscription with Stripe Checkout to login.

## **Frontend Framework**  
Vue 3.

## **Additional Requirement**  
Real-time collaborative drawing using the cursor for the drawing and WebSockets for the communication.

## **Alpha v. Milestones (20 days)**  
Core functionality, no requirements for styling.
- Implement secure login with stored credentials in PostgreSQL and Google OAuth2.  
- Implement a user creating a file and sharing it with another user.  
- Implement real-time collaborative drawing with a cursor and ensure it is working.

## **Beta v. Milestones (14 days)**  
Other required elements and improving website appearance.
- Implement subscriptions and secure payment with Stripe Checkout feature in sandbox mode.  
- Implement a clean and original UI using the Vue 3 frontend framework.  
- Implement a chat for messaging with team members, optionally supporting images.

## **Final v. Milestones (20 days)**  
Additional features to improve UX.
- Implement uploading images to draw on and downloading past drawings.  
- Implement additional drawing features including colour, brush width, and erasers.
