CivixFix: Civic complaint Management and Analytics System

Project Overview
This is my semester project for the Advanced Python Programming course. The application is called CivicFix. It is a full-stack civic tech platform designed to help citizens report public infrastructure issues like broken streetlights, water leaks, and potholes directly to municipal authorities. The system uses a clean Python-based backend architecture to process user authentication, manage relational data, handle incoming forms, and update the resolution lifecycle of complaints through an administrative dashboard.

Project Folders
- backend: This folder handles the core logic of the application. It runs on Python using web frameworks to handle request routing, request payloads, user sessions, data persistence, and error handling.
- frontend: This folder manages the user interface, reporting forms, status indicators, and interaction scripts for the client side.

Local Setup Instructions
1. Clone the project repository to your machine:
   git clone https://github.com

2. Set up the Python Backend:
   cd backend
   pip install -r requirements.txt
   Create a .env file inside this folder to store your server environment configurations.
   Start the backend application server:
   python app.py

3. Set up the Frontend:
   Open a separate command terminal window.
   cd frontend
   npm install
   npm start
   Open your browser to http://localhost:3000 to interact with the platform.


AI Prompts and Responses Used During Development

Below is the compilation of the specific AI prompts I used to build this Python project from scratch, along with the generated AI responses that guided my code.

---

Prompt 1: Project Architecture Setup
"I am building a civic tech application named CivicFix for my advanced Python course. Citizens need to report issues like potholes or broken streetlights, and admins need an interface to resolve them. Provide a clean project file architecture dividing a Python backend from a separate frontend, showing exactly where components and configurations go."

AI Response 1:
"For an Advanced Python full-stack application, keep your frontend and backend entirely separate at the root level to prevent cross-contamination of dependencies. Here is the recommended structure:
civicfix/
  backend/
    app.py (Main entry point)
    config.py (Configuration handles)
    models.py (Database schemas)
    routes/ (API endpoint controllers)
    requirements.txt (Python dependencies)
    .env (Environment secrets)
  frontend/
    src/ (UI code, components, forms)
    package.json (Frontend dependencies)
  .gitignore"

---

Prompt 2: Python Backend Blueprint for Complaint Intake
"Write a Python API backend handler using a modern web framework that accepts a POST request for submitting a complaint. It must parse a JSON payload containing user_id, title, description, category, and coordinates. Store this safely into a relational database model with a default status of 'Pending' and return a proper JSON response with a HTTP 201 status code."

AI Response 2:
"Here is a robust Python architecture snippet using Flask or FastAPI principles:
@app.post('/api/complaints', status_code=201)
def create_complaint(data: ComplaintSchema, db: Session = Depends(get_db)):
    new_issue = Complaint(
        user_id=data.user_id,
        title=data.title,
        description=data.description,
        category=data.category,
        coordinates=data.coordinates,
        status='Pending'
    )
    db.add(new_issue)
    db.commit()
    db.refresh(new_issue)
    return {'message': 'Complaint logged successfully', 'id': new_issue.id}"

---

Prompt 3: User Interface Form Component Integration
"Create a clean React component form that fits into the frontend folder. It must allow the citizen to type an infrastructure complaint title, select a category from a dropdown menu, write a description, and have a button to log their coordinates. Show how to bind these inputs to a state and fetch them to my Python backend URL."

AI Response 3:
"You can use standard React state management to control this form. Capture the user inputs using an 'onChange' handler. For location tracking, hook into the browser's navigator.geolocation API. On submit, use the standard JavaScript fetch API to make an asynchronous POST request to your running Python backend string: http://localhost:5000/api/complaints, passing the state stringified as the body payload."

---

Prompt 4: Advanced Data Query and Sorting for Admin View
"Write a Python database query function for the admin dashboard. It should grab all the civic complaints from our database but sort them conditionally so that 'Pending' issues bubble to the very top, followed by issues that are 'In Progress', and finally 'Resolved' issues at the bottom."

AI Response 4:
"You can achieve custom priority sorting in Python using SQL case statements or by performing ordered queries. In SQLAlchemy, it looks like this:
from sqlalchemy import case
status_order = case(
    (Complaint.status == 'Pending', 1),
    (Complaint.status == 'In Progress', 2),
    (Complaint.status == 'Resolved', 3),
    else_=4
)
complaints = db.query(Complaint).order_by(status_order).all()
This guarantees your admin sees urgent, unaddressed issues immediately."



Prompt 5: Debugging Cross-Origin Resource Sharing (CORS) Issues
"When my frontend at port 3000 tries to talk to my Python backend running on port 5000, the browser blocks the connection and throws a CORS error. How do I fix this within my Python server code?"

AI Response 5:
"Browsers restrict cross-origin requests for security reasons. Since your frontend and backend run on different local ports, you must explicitly tell your Python application to accept requests from port 3000. Install the CORS middleware extension for your Python framework (such as flask-cors or fastapi.middleware.cors), initialize it on your app instance, and configure the 'origins' parameter to whitelist 'http://localhost:3000'."
