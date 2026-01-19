const vscode = require('vscode');
const axios = require('axios');

class CodeGenerator {
    constructor(context) {
        this.context = context;
    }

    async generateCode(feature) {
        try {
            const config = vscode.workspace.getConfiguration('kinmail');
            const apiKey = config.get('openaiApiKey');
            
            if (!apiKey) {
                throw new Error('OpenAI API key not configured');
            }

            const prompt = `
You are a Python developer. Generate complete, production-ready MVC code for this functionality:

FUNCTIONALITY: ${feature.title}
DESCRIPTION: ${feature.description}
USE CASES: ${feature.useCases.join(', ')}

REQUIREMENTS:
- Generate actual Python code, NOT JSON
- Create separate files for each MVC component
- Use Flask framework with proper MVC structure
- Include complete, executable code

MVC STRUCTURE:
1. MODELS - Data entities and business logic
2. VIEWS - User interface and templates  
3. CONTROLLERS - API endpoints and business logic

FILE ORGANIZATION:
- app.py (Flask main app - in root directory)
- models/ (Model files)
- views/ (View files) 
- controllers/ (Controller files)
- templates/ (HTML templates)
- config/ (Database and config files)

CRITICAL REQUIREMENT - FLASK-SQLALCHEMY SETUP:
For Flask applications with SQLAlchemy models, you MUST use Flask-SQLAlchemy (NOT raw SQLAlchemy):

1. In app.py, ALWAYS include:
   from flask_sqlalchemy import SQLAlchemy
   
   app = Flask(__name__)
   app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///app.db'
   app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
   
   # Initialize Flask-SQLAlchemy
   db = SQLAlchemy(app)

2. In models/*.py files, ALWAYS use:
   from app import db
   
   class ModelName(db.Model):
       __tablename__ = 'table_name'
       # columns here

3. In controllers/*.py files, ALWAYS use:
   from app import db
   
   # Then use: db.session.add(), db.session.commit(), db.session.query()

4. DO NOT use raw SQLAlchemy (declarative_base, init_db, sessionmaker)
5. DO NOT create config/database.py with Base = declarative_base()
6. Flask-SQLAlchemy's db object provides: db.Model, db.session, db.create_all(), db.drop_all()

This ensures compatibility with Flask test clients and pytest fixtures that expect Flask-SQLAlchemy.

CRITICAL - DATA TYPE HANDLING (MANDATORY):
- When receiving form data with date fields (birthdate, date_of_birth, etc.), you MUST parse the string to a Python date object BEFORE creating model instances:
  
  WRONG (will cause TypeError):
  birthdate = request.form['birthdate']  # This is a string '1990-01-01'
  user = User(birthdate=birthdate, ...)  # ERROR: SQLite Date type only accepts Python date objects
  
  CORRECT (required):
  from datetime import datetime
  birthdate_str = request.form['birthdate']  # e.g., '1990-01-01' (string from form)
  birthdate = datetime.strptime(birthdate_str, '%Y-%m-%d').date()  # Parse to date object
  user = User(birthdate=birthdate, ...)  # CORRECT: date object
  
- ALWAYS import datetime: from datetime import datetime
- ALWAYS parse date strings from request.form before using in model constructors
- When receiving form data with datetime fields, parse appropriately:
  datetime_str = request.form['datetime_field']
  datetime_obj = datetime.strptime(datetime_str, '%Y-%m-%d %H:%M:%S')

CRITICAL - ERROR HANDLING:
- ALWAYS wrap db.session.commit() in try-except to handle database errors:
  try:
      db.session.add(user)
      db.session.commit()
      flash('Success message', 'success')
      return redirect(url_for('success_route'))
  except IntegrityError as e:
      db.session.rollback()
      flash('Error message (e.g., Username already taken)', 'error')
      return render_template('form.html', error='Error message')
  
- Import IntegrityError: from sqlalchemy.exc import IntegrityError
- Handle duplicate unique constraints (username, email, etc.) gracefully
- Return appropriate HTTP status codes (400 for bad requests, 200 for validation errors on same page)

CRITICAL - ROUTE REDIRECTS:
- ONLY redirect to routes that exist in your code
- If login route doesn't exist, redirect to a route that does exist (e.g., 'register' or '/')
- DO NOT use url_for('login') if no login route is defined
- Check all routes before using url_for() - only reference existing endpoints

OUTPUT FORMAT:
Use this format for each file:
#### filename.py
[Python code here]

#### filename2.py
[Python code here]

Generate the complete Python code for this functionality. Return ONLY the code files with #### filename format. Do not include any explanations, descriptions, or additional text.

IMPORTANT: If models use SQLAlchemy, ALWAYS include config/database.py and config/__init__.py files.
            `;

            const response = await axios.post('https://api.openai.com/v1/chat/completions', {
                model: 'gpt-4',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a Python developer. Generate actual Python code for MVC architecture. Do not return JSON or explanations - only return executable Python code.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.3,
                max_tokens: 4000
            }, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            return response.data.choices[0].message.content;
        } catch (error) {
            console.error('Error generating code:', error.message);
            throw error;
        }
    }
}

module.exports = { CodeGenerator };
