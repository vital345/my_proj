from fpdf import FPDF
import json

class PDFReport(FPDF):
    def header(self):
        self.set_font('Arial', 'B', 12)
        self.set_fill_color(200, 220, 255)
        self.cell(0, 10, 'Final Report', 0, 1, 'C', fill=True)

    def footer(self):
        self.set_y(-15)
        self.set_font('Arial', 'I', 8)
        self.cell(0, 10, f'Page {self.page_no()}', 0, 0, 'C')

    def chapter_title(self, title):
        self.set_font('Arial', 'B', 12)
        self.cell(0, 10, title, 0, 1, 'L')
        self.ln(5)

    def chapter_body(self, content):
        self.set_font('Arial', '', 10)
        self.multi_cell(0, 5, content)
        self.ln()

    def table(self, data, col_widths):
        self.set_font('Arial', '', 10)
        # Header row
        self.set_fill_color(220, 220, 220)
        for header, width in zip(data[0], col_widths):
            self.cell(width, 10, header, 1, 0, 'C', fill=True)
        self.ln()
        # Data rows
        for row in data[1:]:
            for cell, width in zip(row, col_widths):
                self.cell(width, 10, str(cell), 1)
            self.ln()
        self.ln()

class PDF(FPDF):
    def header(self):
        self.set_font("Arial", "B", 14)
        self.cell(0, 10, "Domain Specific QA Report", 0, 1, "C")
        self.ln(5)

    def footer(self):
        self.set_y(-15)
        self.set_font("Arial", "I", 8)
        self.cell(0, 10, f"Page {self.page_no()}", 0, 0, "C")

# Function to generate Domain Specific QA Report
def generate_domain_specific_qa_report(data, pdf):
    pdf.add_page()
    pdf.chapter_title("Domain Specific QA Report")
    pdf.set_font("Arial", size=12)

    for entry in data:
        # Step 1: Add the report header
        # pdf.set_font("Arial", "B", 12)
        # pdf.multi_cell(0, 5, f"Step Name: {entry['step_name']}")
        pdf.set_font("Arial", size=12)
        pdf.multi_cell(0, 5, f"Overall Score: {entry['step_report']['score']}")
        # pdf.multi_cell(0, 10, f"Explanation: {entry['step_report']['explanation']}")
        pdf.ln(5)

        # Step 2: Add each question and answer pair
        questions = entry["step_report"]["questions"]
        question_number = 1
        for qa in questions:
            if qa["type"] == "ai":
                # Add Question with numbering
                pdf.set_font("Arial", "B", 12)
                pdf.multi_cell(0, 5, f"Question {question_number}: {qa['content']}")
            elif qa["type"] == "human":
                # Add corresponding Answer
                pdf.set_font("Arial", size=12)
                pdf.multi_cell(0, 5, f"Answer: {qa['content']}")
                question_number += 1
            pdf.ln(5)  # Add spacing between QA pairs
        pdf.ln(10)  # Add spacing between report entries

# Function to generate the Milestone-wise Report
def generate_milestone_report(data, pdf):
    pdf.add_page()
    pdf.chapter_title("Milestone-wise Report")
    for entry in data:
        step_report = entry["step_report"]
        milestones = step_report["milestone_reports"]
        
        for milestone in milestones:
            pdf.set_font("Arial", "B", 12)
            pdf.multi_cell(0, 5, f"Title: {milestone['title']}")
            pdf.set_font("Arial", size=12)
            pdf.multi_cell(0, 5, f"Status: {milestone['status']}")
            pdf.multi_cell(0, 5, f"Score: {milestone['score']}")
            pdf.multi_cell(0, 5, f"Feedback: {milestone['feedback']}")
            pdf.ln(10)  # Add spacing between milestones

# Function to generate the Project Specific QA Report
def generate_project_specific_qa_report(data, pdf):
    pdf.add_page()
    pdf.chapter_title("Project Specific QA Report")
    
    for entry in data:
        step_report = entry["step_report"]
        score = step_report["score"]
        questions = step_report["questions"]
        
        # Add Total Score
        pdf.set_font("Arial", "B", 12)
        pdf.multi_cell(0, 5, f"Total Score: {score}")
        pdf.ln(5)
        
        # Add Questions and Answers
        question_number = 1
        for qa in questions:
            if qa["type"] == "ai":
                # Add Question
                question_content = json.loads(qa["content"])["output"]["question"]
                pdf.set_font("Arial", "B", 12)
                pdf.multi_cell(0, 5, f"{question_number}. Question: {question_content}")
            elif qa["type"] == "human":
                # Add Answer
                pdf.set_font("Arial", size=12)
                pdf.multi_cell(0, 5, f"Answer: {qa['content']}")
                question_number += 1
            pdf.ln(5)  # Add spacing between QA pairs
        pdf.ln(10)  # Add spacing between entries

# Function to generate the Combined Report
def generate_combined_report_fpdf(backend_test_data, code_quality_data, commit_message_data, domain_qa_data, milestone_data,project_qa_data, pdf_file="combined_report_fpdf.pdf"):
    pdf = PDFReport()
    pdf.set_auto_page_break(auto=True, margin=15)

    # Backend Test Execution Report
    pdf.add_page()
    pdf.chapter_title("Backend Test Execution Report")
    step_report = backend_test_data[0]["step_report"]
    total_testcases = step_report["total_number_of_testcases"]
    total_passed = step_report["total_number_of_passes_testcases"]
    total_failed = step_report["total_number_of_failed_testcases"]
    testcases = step_report["list_of_testcases"]

    summary = (
        f"Total test cases: {total_testcases}\n"
        f"Total passed test cases: {total_passed}\n"
        f"Total failed test cases: {total_failed}"
    )
    pdf.chapter_body(summary)

    # Table for Backend Test Execution Report
    headers = ["URL", "Method", "Status Code", "Remark"]
    table_data = [headers] + [
        [tc["request_url"], tc["request_method"], tc["response_status_code"], tc["remarks"]]
        for tc in testcases
    ]
    col_widths = [80, 30, 40, 40]
    pdf.table(table_data, col_widths)

    # Code Quality Report
    pdf.add_page()
    pdf.chapter_title("Code Quality Report")
    step_report = code_quality_data[0]["step_report"]
    overall_score = step_report["overall_score"]
    strengths = step_report["report"]["strengths"]
    weaknesses = step_report["report"]["weaknesses"]
    areas_of_improvement = step_report["report"]["areas_of_improvement"]

    pdf.chapter_body(f"Overall Score: {overall_score}")
    pdf.chapter_body("Strengths:")
    pdf.chapter_body("\n".join([f"- {s}" for s in strengths]))

    pdf.chapter_body("Weaknesses:")
    pdf.chapter_body("\n".join([f"- {w}" for w in weaknesses]))

    pdf.chapter_body("Areas of Improvement:")
    pdf.chapter_body("\n".join([f"- {a}" for a in areas_of_improvement]))

    # Commit Message Evaluation Report
    pdf.add_page()
    pdf.chapter_title("Commit Message Evaluation Report")
    step_report = commit_message_data[0]["step_report"]
    overall_score = step_report["overall_score"]
    strengths = step_report["report"]["strengths"]
    weaknesses = step_report["report"]["weaknesses"]
    areas_of_improvement = step_report["report"]["areas_of_improvement"]

    pdf.chapter_body(f"Overall Score: {overall_score}")
    pdf.chapter_body("Strengths:")
    pdf.chapter_body("\n".join([f"- {s}" for s in strengths]))

    pdf.chapter_body("Weaknesses:")
    pdf.chapter_body("\n".join([f"- {w}" for w in weaknesses]))

    pdf.chapter_body("Areas of Improvement:")
    pdf.chapter_body("\n".join([f"- {a}" for a in areas_of_improvement]))

    # Domain Specific QA Report
    generate_domain_specific_qa_report(domain_qa_data, pdf)

    # Milestone-wise Report
    generate_milestone_report(milestone_data, pdf)

    # Project Specific QA Report
    generate_project_specific_qa_report(project_qa_data, pdf)

    pdf.output(pdf_file)
    print(f"PDF generated: {pdf_file}")


# Sample JSON data
json_data = [
    {
        "userevaluation_id": 24,
        "id": 65,
        "step_report": {
            "total_number_of_testcases": 11,
            "total_number_of_passes_testcases": 10,
            "total_number_of_failed_testcases": 1,
            "list_of_testcases": [
                {
                    "request_url": "/login/token",
                    "request_method": "POST",
                    "request_body": "{\"username\": \"sagnik\", \"password\": \"jana\"}",
                    "response_body": "JWT token received",
                    "response_status_code": 200,
                    "remarks": "success"
                },
                {
                    "request_url": "/product/",
                    "request_method": "POST",
                    "request_body": "{\"name\": \"Sample Product\", \"description\": \"This is a sample product.\", \"price\": 100, \"stock_quantity\": 50, \"category_id\": 1}",
                    "response_body": "{\"id\": 15, \"price\": 100, \"category_id\": 1, \"name\": \"Sample Product\", \"description\": \"This is a sample product.\", \"stock_quantity\": 50}",
                    "response_status_code": 200,
                    "remarks": "success"
                },
                {
                    "request_url": "/product/",
                    "request_method": "GET",
                    "request_body": "none",
                    "response_body": "[{\"id\": 15, \"price\": 100, \"category_id\": 1, \"name\": \"Sample Product\", \"description\": \"This is a sample product.\", \"stock_quantity\": 50}]",
                    "response_status_code": 200,
                    "remarks": "success"
                },
                {
                    "request_url": "/product/15",
                    "request_method": "GET",
                    "request_body": "none",
                    "response_body": "{\"id\": 15, \"price\": 100, \"category_id\": 1, \"name\": \"Sample Product\", \"description\": \"This is a sample product.\", \"stock_quantity\": 50, \"category\": {\"name\": \"Category Name\", \"id\": 1, \"description\": \"Category Description\"}}",
                    "response_status_code": 200,
                    "remarks": "success"
                },
                {
                    "request_url": "/product/15",
                    "request_method": "PUT",
                    "request_body": "{\"name\": \"Updated Product\", \"description\": \"Updated description.\", \"price\": 150, \"stock_quantity\": 30, \"category_id\": 2}",
                    "response_body": "{\"detail\": [{\"type\": \"value_error\", \"loc\": [\"body\", \"category_id\"], \"msg\": \"Value error, Category with id = 2 not found\", \"input\": 2, \"ctx\": {\"error\": {}}}]}",
                    "response_status_code": 422,
                    "remarks": "failure"
                },
                {
                    "request_url": "/category/",
                    "request_method": "POST",
                    "request_body": "{\"name\": \"New Category\", \"description\": \"Description of the new category.\"}",
                    "response_body": "{\"name\": \"New Category\", \"id\": 23, \"description\": \"Description of the new category.\"}",
                    "response_status_code": 200,
                    "remarks": "success"
                },
                {
                    "request_url": "/product/15",
                    "request_method": "PUT",
                    "request_body": "{\"name\": \"Updated Product\", \"description\": \"Updated description.\", \"price\": 150, \"stock_quantity\": 30, \"category_id\": 23}",
                    "response_body": "{\"id\": 15, \"price\": 150, \"category_id\": 23, \"name\": \"Updated Product\", \"description\": \"Updated description.\", \"stock_quantity\": 30, \"category\": {\"name\": \"New Category\", \"id\": 23, \"description\": \"Description of the new category.\"}}",
                    "response_status_code": 200,
                    "remarks": "success"
                },
                {
                    "request_url": "/product/15",
                    "request_method": "DELETE",
                    "request_body": "none",
                    "response_body": "{\"message\": \"product deleted successfully\"}",
                    "response_status_code": 200,
                    "remarks": "success"
                },
                {
                    "request_url": "/category/",
                    "request_method": "GET",
                    "request_body": "none",
                    "response_body": "[{\"name\": \"New Category\", \"id\": 6, \"description\": \"Description of the new category\"}, {\"name\": \"Category Name\", \"id\": 7, \"description\": \"Category Description\"}, {\"name\": \"Category Name\", \"id\": 8, \"description\": \"Category Description\"}, {\"name\": \"New Category\", \"id\": 9, \"description\": \"Description of the new category\"}, {\"name\": \"Category Name\", \"id\": 11, \"description\": \"Category Description\"}, {\"name\": \"Category Name\", \"id\": 14, \"description\": \"Category Description\"}, {\"name\": \"New Category\", \"id\": 19, \"description\": \"Description of the new category\"}, {\"name\": \"Category Name\", \"id\": 1, \"description\": \"Category Description\"}, {\"name\": \"New Category\", \"id\": 23, \"description\": \"Description of the new category.\"}]",
                    "response_status_code": 200,
                    "remarks": "success"
                },
                {
                    "request_url": "/category/23",
                    "request_method": "PUT",
                    "request_body": "{\"name\": \"Updated Category\", \"description\": \"Updated description.\"}",
                    "response_body": "{\"name\": \"Updated Category\", \"id\": 23, \"description\": \"Updated description.\"}",
                    "response_status_code": 200,
                    "remarks": "success"
                },
                {
                    "request_url": "/category/23",
                    "request_method": "DELETE",
                    "request_body": "none",
                    "response_body": "{\"message\": \"category deleted successfully\"}",
                    "response_status_code": 200,
                    "remarks": "success"
                }
            ]
        },
        "step_name": "backend_test_execution_report"
    },
    {
        "userevaluation_id": 24,
        "id": 64,
        "step_report": {
            "overall_score": 7,
            "report": {
                "strengths": [
                    "The project follows a clear structure with separate directories for API routes, core configurations, database models, and schemas, which enhances modularity and readability.",
                    "Usage of FastAPI for API routing and SQLAlchemy for ORM indicates a modern approach to web application development.",
                    "The codebase includes environment variable management using dotenv, which is a good practice for configuration management.",
                    "The use of Pydantic for data validation in schemas ensures data integrity and type safety.",
                    "Consistent use of Alembic for database migrations, which is crucial for maintaining database schema changes."
                ],
                "weaknesses": [
                    "Some files, such as migration scripts, have empty messages or lack detailed comments, which can hinder understanding of changes over time.",
                    "The codebase has instances of commented-out code, particularly in the models, which can clutter the code and reduce readability.",
                    "There is a lack of comprehensive error handling and logging, which can make debugging and monitoring more challenging.",
                    "The use of wildcard imports (e.g., 'from db.repository.category import *') can lead to namespace pollution and make it difficult to track dependencies."
                ],
                "areas_of_improvement": [
                    "Improve commenting and documentation across the codebase, especially in migration scripts and complex functions, to enhance maintainability.",
                    "Remove commented-out code to improve readability and maintain a clean codebase.",
                    "Implement more robust error handling and logging mechanisms to aid in debugging and application monitoring.",
                    "Avoid using wildcard imports to maintain clarity and control over imported modules and functions.",
                    "Ensure consistent naming conventions and formatting across all files to improve code consistency."
                ]
            }
        },
        "step_name": "code_quality_report"
    },
    {
        "userevaluation_id": 24,
        "id": 63,
        "step_report": {
            "overall_score": 5,
            "report": {
                "strengths": [
                    "Some commit messages provide specific details, such as 'added user_id foreign key to product table' and 'add category & username validation', which are clear and informative.",
                    "The messages generally describe what changes were made."
                ],
                "weaknesses": [
                    "Several commit messages are vague, such as 'minor changes' and 'first commit', offering no information about what was actually changed or why.",
                    "Some messages lack proper tense usage or structure, like 'implement crud for product'.",
                    "The commit messages do not consistently follow a standard format or provide sufficient context for the changes."
                ],
                "areas_of_improvement": [
                    "Ensure all commit messages are specific and descriptive, providing a clear understanding of what was changed and why.",
                    "Use the imperative mood in commit messages, for example, 'Add user authentication' instead of 'add user authentication'.",
                    "Provide context or reasons for changes when necessary to help others understand the purpose of the commit.",
                    "Avoid vague terms and phrases, instead be explicit about the changes made."
                ]
            },
            "final_commit_details": {
                "message": "minor changes",
                "date": "2024-11-05 10:03:09"
            }
        },
        "step_name": "commit_message_evaluation_report"
    },
    {
        "userevaluation_id": 24,
        "id": 67,
        "step_report": {
            "score": 5,
            "explanation": "The user demonstrates a basic to moderate understanding of FastAPI and its components. They correctly identified FastAPI's main advantages and the role of Pydantic, showing a good grasp of these concepts. However, their explanation of dependency injection was incomplete, and they incorrectly stated that FastAPI does not support authentication or authorization, which indicates a gap in knowledge. Additionally, their explanation of asynchronous programming in FastAPI was very brief and lacked depth. To improve, the user should focus on understanding the implementation details of dependency injection, authentication, and asynchronous programming in FastAPI.",
            "questions": [
                {
                    "content": "What is FastAPI and what are its main advantages?",
                    "additional_kwargs": {},
                    "response_metadata": {},
                    "type": "ai",
                    "name": "none",
                    "id": "none",
                    "example": False,
                    "tool_calls": [],
                    "invalid_tool_calls": [],
                    "usage_metadata": "none"
                },
                {
                    "content": "FastAPI is a modern, fast, high-performance web framework for building APIs with Python based on standard Python type hints. Its main advantages include high performance on par with Node.js and Go, automatic generation of interactive API documentation, Swagger UI and Redoc, type hints for data validation and serialization using Pydentic, asynchronous support using Python's Async and Await, easy to use and learn with a focus on developer productivity.",
                    "additional_kwargs": {},
                    "response_metadata": {},
                    "type": "human",
                    "name": "none",
                    "id": "none",
                    "example": False
                },
                {
                    "content": "What is dependency injection and how is it implemented in FastAPI?",
                    "additional_kwargs": {},
                    "response_metadata": {},
                    "type": "ai",
                    "name": "none",
                    "id": "none",
                    "example": False,
                    "tool_calls": [],
                    "invalid_tool_calls": [],
                    "usage_metadata": "none"
                },
                {
                    "content": "Dependency Injection is a way to provide resources to endpoint functions in FastAPI.",
                    "additional_kwargs": {},
                    "response_metadata": {},
                    "type": "human",
                    "name": "none",
                    "id": "none",
                    "example": False
                },
                {
                    "content": "How does FastAPI handle authentication and authorization?",
                    "additional_kwargs": {},
                    "response_metadata": {},
                    "type": "ai",
                    "name": "none",
                    "id": "none",
                    "example": False,
                    "tool_calls": [],
                    "invalid_tool_calls": [],
                    "usage_metadata": "none"
                },
                {
                    "content": "FirstAPI does not support authentication or authorization.",
                    "additional_kwargs": {},
                    "response_metadata": {},
                    "type": "human",
                    "name": "none",
                    "id": "none",
                    "example": False
                },
                {
                    "content": "Explain the role of Pydantic in FastAPI.",
                    "additional_kwargs": {},
                    "response_metadata": {},
                    "type": "ai",
                    "name": "none",
                    "id": "none",
                    "example": False,
                    "tool_calls": [],
                    "invalid_tool_calls": [],
                    "usage_metadata": "none"
                },
                {
                    "content": "Pydantic is a data validation and settings management library used by FastAPI to validate and serialize data based on Python type hints. It ensures that the data received in requests is of the correct type and format, and it automatically generates error messages for invalid data. Pydantic models are used to define the structure of request and response bodies in FastAPI.",
                    "additional_kwargs": {},
                    "response_metadata": {},
                    "type": "human",
                    "name": "none",
                    "id": "none",
                    "example": False
                },
                {
                    "content": "How does FastAPI handle asynchronous programming?",
                    "additional_kwargs": {},
                    "response_metadata": {},
                    "type": "ai",
                    "name": "none",
                    "id": "none",
                    "example": False,
                    "tool_calls": [],
                    "invalid_tool_calls": [],
                    "usage_metadata": "none"
                },
                {
                    "content": "FastAPI uses async and await to handle asynchronous tasks.",
                    "additional_kwargs": {},
                    "response_metadata": {},
                    "type": "human",
                    "name": "none",
                    "id": "none",
                    "example": False
                }
            ]
        },
        "step_name": "domain_specific_qa"
    },
    {
        "userevaluation_id": 24,
        "id": 66,
        "step_report": {
            "milestone_reports": [
                {
                    "title": "Project Setup",
                    "status": "Fully completed",
                    "score": 10,
                    "feedback": "The project setup is fully completed with FastAPI and PostgreSQL. PGVector is set up using Docker, and SQLAlchemy is used for ORM. Environment variables are utilized for configuration, as seen in the core/config.py file."
                },
                {
                    "title": "Database Connection and Migrations",
                    "status": "Fully completed",
                    "score": 10,
                    "feedback": "The application is connected to a PostgreSQL database, and Alembic is used for managing migrations. Initial migrations are defined to establish the database schema, as evidenced by the Alembic version files."
                },
                {
                    "title": "Database Schema",
                    "status": "Fully completed",
                    "score": 10,
                    "feedback": "The database schema is well-designed with users, products, and categories tables. Relationships are established, such as products belonging to categories. The schema is implemented in the db/models directory."
                },
                {
                    "title": "CRUD Operations",
                    "status": "Fully completed",
                    "score": 10,
                    "feedback": "CRUD operations for products and categories are implemented with endpoints for creating, retrieving, updating, and deleting. The routes are defined in api/route_product.py and api/route_category.py."
                },
                {
                    "title": "Authentication and Authorization",
                    "status": "Fully completed",
                    "score": 10,
                    "feedback": "Authentication and role-based access control are implemented using JWT. User registration and login are handled, and passwords are securely hashed. Role-based access control is enforced in the repository functions."
                },
                {
                    "title": "Testing",
                    "status": "Incomplete",
                    "score": 0,
                    "feedback": "There is no evidence of unit tests for API endpoints or business logic in the provided codebase. Implementing tests is crucial for ensuring the reliability and correctness of the application."
                },
                {
                    "title": "Documentation",
                    "status": "Partially completed",
                    "score": 5,
                    "feedback": "FastAPI's auto-generated API documentation is likely utilized, but there is no explicit mention or evidence of detailed descriptions for each endpoint. Enhancing documentation with detailed examples would improve this aspect."
                },
                {
                    "title": "Inventory Management Logic (BONUS)",
                    "status": "Incomplete",
                    "score": 0,
                    "feedback": "There is no implementation of advanced inventory management features such as stock level updates or low inventory alerts. Implementing these features would enhance the application's functionality."
                }
            ]
        },
        "step_name": "milestone_wise_report"
    },
    {
        "userevaluation_id": 24,
        "id": 68,
        "step_report": {  
            "score": 2,
            "explanation": "The user demonstrated limited understanding of the project. They struggled with specific questions about the project's implementation details, such as the purpose of key functions and files. The user was able to provide a general idea for one question but lacked depth and accuracy in their responses. To improve, the user should focus on understanding the specific roles of different components in the project and how they interact with each other.",
            "questions": [
                {
                    "content": "",
                    "additional_kwargs": {},
                    "response_metadata": {},
                    "type": "human",
                    "name": "none",
                    "id": "none",
                    "example": False
                },
                {
                    "content": "{\"output\": {\"question\": \"Can you describe the purpose of the 'alembic/env.py' file in this project?\"}}",
                    "additional_kwargs": {},
                    "response_metadata": {},
                    "type": "ai",
                    "name": "none",
                    "id": "none",
                    "example": False,
                    "tool_calls": [],
                    "invalid_tool_calls": [],
                    "usage_metadata": "none"
                },
                {
                    "content": "The alembic slash env.py used to configure the web application, it is used to maintain the configuration file for the web application like database URL and other API keys.",
                    "additional_kwargs": {},
                    "response_metadata": {},
                    "type": "human",
                    "name": "none",
                    "id": "none",
                    "example": False
                },
                {
                    "content": "{\"output\": {\"question\": \"What is the role of the 'get_current_user' function in 'api/route_login.py'?\"}}",
                    "additional_kwargs": {},
                    "response_metadata": {},
                    "type": "ai",
                    "name": "none",
                    "id": "none",
                    "example": False,
                    "tool_calls": [],
                    "invalid_tool_calls": [],
                    "usage_metadata": "none"
                },
                {
                    "content": "It is used for product specific usage like fetch all the products and update the product.",
                    "additional_kwargs": {},
                    "response_metadata": {},
                    "type": "human",
                    "name": "none",
                    "id": "none",
                    "example": False
                },
                {
                    "content": "{\"output\": {\"question\": \"How does the 'create_access_token' function in 'core/jwt.py' work, and what parameters does it take?\"}}",
                    "additional_kwargs": {},
                    "response_metadata": {},
                    "type": "ai",
                    "name": "none",
                    "id": "none",
                    "example": False,
                    "tool_calls": [],
                    "invalid_tool_calls": [],
                    "usage_metadata": "none"
                },
                {
                    "content": "No, I don't remember",
                    "additional_kwargs": {},
                    "response_metadata": {},
                    "type": "human",
                    "name": "none",
                    "id": "none",
                    "example": False
                },
                {
                    "content": "{\"output\": {\"question\": \"What is the purpose of the 'Base' class in 'db/base_class.py', and how does it contribute to the ORM setup?\"}}",
                    "additional_kwargs": {},
                    "response_metadata": {},
                    "type": "ai",
                    "name": "none",
                    "id": "none",
                    "example": False,
                    "tool_calls": [],
                    "invalid_tool_calls": [],
                    "usage_metadata": "none"
                },
                {
                    "content": "contribute to the ORM setup. I don't give a damn.",
                    "additional_kwargs": {},
                    "response_metadata": {},
                    "type": "human",
                    "name": "none",
                    "id": "none",
                    "example": False
                },
                {
                    "content": "{\"output\": {\"question\": \"Can you explain how the 'create_user' function in 'db/repository/user.py' ensures password security?\"}}",
                    "additional_kwargs": {},
                    "response_metadata": {},
                    "type": "ai",
                    "name": "none",
                    "id": "none",
                    "example": False,
                    "tool_calls": [],
                    "invalid_tool_calls": [],
                    "usage_metadata": "none"
                },
                {
                    "content": "I don't remember.",
                    "additional_kwargs": {},
                    "response_metadata": {},
                    "type": "human",
                    "name": "none",
                    "id": "none",
                    "example": False
                }
            ]
        },
        "step_name": "project_specific_qa"
    }
]



# Function to group data by step_name
def group_data_by_step_name(data):
    grouped_data = {}
    for item in data:
        step_name = item["step_name"]
        if step_name not in grouped_data:
            grouped_data[step_name] = []
        grouped_data[step_name].append(item)
    return grouped_data

# Group data by step_name
grouped_data = group_data_by_step_name(json_data)


generate_combined_report_fpdf(
    grouped_data.get("backend_test_execution_report"),
    grouped_data.get("code_quality_report"),
    grouped_data.get("commit_message_evaluation_report"),
    grouped_data.get("domain_specific_qa"),
    grouped_data.get("milestone_wise_report"),
    grouped_data.get("project_specific_qa")
    )

# Example usage with sample data
# generate_combined_report_fpdf(backend_test_data, code_quality_data, commit_message_data,json_data,milestone_data,project_qa_data)