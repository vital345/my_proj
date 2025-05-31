from fastapi import FastAPI
import json

from services.core.report_generation.generate_pdf import generate_combined_report



app = FastAPI()

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

if __name__ == '__main__':
    # Print grouped data in a readable format
    # print(json.dumps(grouped_data.get("commit_message_evaluation_report"), indent=4))
    print(grouped_data.keys())

generate_combined_report(grouped_data.get("backend_test_execution_report"), grouped_data.get("code_quality_report"), grouped_data.get("commit_message_evaluation_report"))    
    


        
