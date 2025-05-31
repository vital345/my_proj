import json
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.utils import simpleSplit

def backend_test_execution_report(c, json_data, y_start):
    # Extract data from JSON
    data = json_data[0]
    step_report = data["step_report"]
    total_testcases = step_report["total_number_of_testcases"]
    total_passed = step_report["total_number_of_passes_testcases"]
    total_failed = step_report["total_number_of_failed_testcases"]
    testcases = step_report["list_of_testcases"]

    width, height = letter

    # Title
    c.setFont("Helvetica-Bold", 16)
    c.drawString(100, y_start, "Backend Test Execution Report")
    y_start -= 50

    # Total test cases
    c.setFont("Helvetica", 12)
    c.drawString(100, y_start, f"Total test cases: {total_testcases}")
    y_start -= 20
    c.drawString(100, y_start, f"Total passed test cases: {total_passed}")
    y_start -= 20
    c.drawString(100, y_start, f"Total failed test cases: {total_failed}")
    y_start -= 40

    # List of test cases
    c.drawString(100, y_start, "List of Test Cases:")
    y_start -= 20
    c.setFont("Helvetica-Bold", 10)
    c.drawString(100, y_start, "URL")
    c.drawString(300, y_start, "Method")
    c.drawString(400, y_start, "Status Code")
    c.drawString(500, y_start, "Remark")
    y_start -= 20

    c.setFont("Helvetica", 10)
    for testcase in testcases:
        if y_start < 50:
            c.showPage()
            y_start = height - 50
            c.setFont("Helvetica-Bold", 10)
            c.drawString(100, y_start, "URL")
            c.drawString(300, y_start, "Method")
            c.drawString(400, y_start, "Status Code")
            c.drawString(500, y_start, "Remark")
            y_start -= 20
            c.setFont("Helvetica", 10)
        c.drawString(100, y_start, testcase["request_url"])
        c.drawString(300, y_start, testcase["request_method"])
        c.drawString(400, y_start, str(testcase["response_status_code"]))
        c.drawString(500, y_start, testcase["remarks"])
        y_start -= 20

    return y_start

def code_quality_report(c, json_data, y_start):
    width, height = letter

    step_report = json_data[0]["step_report"]
    overall_score = step_report["overall_score"]
    strengths = step_report["report"]["strengths"]
    weaknesses = step_report["report"]["weaknesses"]
    areas_of_improvement = step_report["report"]["areas_of_improvement"]

    # Title
    c.setFont("Helvetica-Bold", 16)
    c.drawString(100, y_start, "Code Quality Report")
    y_start -= 50

    # Overall Score
    c.setFont("Helvetica", 12)
    c.drawString(100, y_start, f"Overall Score: {overall_score}")
    y_start -= 40

    # Strengths
    c.setFont("Helvetica-Bold", 12)
    c.drawString(100, y_start, "Strengths:")
    y_start -= 20
    c.setFont("Helvetica", 10)
    max_width = width - 140  # Adjust the max width for text wrapping
    for strength in strengths:
        wrapped_text = simpleSplit(strength, 'Helvetica', 10, max_width)
        for line in wrapped_text:
            if y_start < 50:
                c.showPage()
                y_start = height - 50
                c.setFont("Helvetica-Bold", 12)
                c.drawString(100, y_start, "Strengths:")
                y_start -= 20
                c.setFont("Helvetica", 10)
            c.drawString(120, y_start, f"- {line}")
            y_start -= 20

    # Weaknesses
    c.setFont("Helvetica-Bold", 12)
    c.drawString(100, y_start - 20, "Weaknesses:")
    y_start -= 40
    c.setFont("Helvetica", 10)
    for weakness in weaknesses:
        wrapped_text = simpleSplit(weakness, 'Helvetica', 10, max_width)
        for line in wrapped_text:
            if y_start < 50:
                c.showPage()
                y_start = height - 50
                c.setFont("Helvetica-Bold", 12)
                c.drawString(100, y_start, "Weaknesses:")
                y_start -= 20
                c.setFont("Helvetica", 10)
            c.drawString(120, y_start, f"- {line}")
            y_start -= 20

    # Areas of Improvement
    c.setFont("Helvetica-Bold", 12)
    c.drawString(100, y_start - 20, "Areas of Improvement:")
    y_start -= 40
    c.setFont("Helvetica", 10)
    for improvement in areas_of_improvement:
        wrapped_text = simpleSplit(improvement, 'Helvetica', 10, max_width)
        for line in wrapped_text:
            if y_start < 50:
                c.showPage()
                y_start = height - 50
                c.setFont("Helvetica-Bold", 12)
                c.drawString(100, y_start, "Areas of Improvement:")
                y_start -= 20
                c.setFont("Helvetica", 10)
            c.drawString(120, y_start, f"- {line}")
            y_start -= 20

    return y_start

def commit_message_evaluation_report(c, json_data, y_start):
    width, height = letter

    step_report = json_data[0]["step_report"]
    overall_score = step_report["overall_score"]
    strengths = step_report["report"]["strengths"]
    weaknesses = step_report["report"]["weaknesses"]
    areas_of_improvement = step_report["report"]["areas_of_improvement"]

    # Title
    c.setFont("Helvetica-Bold", 16)
    c.drawString(100, y_start, "Commit Message Evaluation Report")
    y_start -= 50

    # Overall Score
    c.setFont("Helvetica", 12)
    c.drawString(100, y_start, f"Overall Score: {overall_score}")
    y_start -= 40

    # Strengths
    c.setFont("Helvetica-Bold", 12)
    c.drawString(100, y_start, "Strengths:")
    y_start -= 20
    c.setFont("Helvetica", 10)
    max_width = width - 140  # Adjust the max width for text wrapping
    for strength in strengths:
        wrapped_text = simpleSplit(strength, 'Helvetica', 10, max_width)
        for line in wrapped_text:
            if y_start < 50:
                c.showPage()
                y_start = height - 50
                c.setFont("Helvetica-Bold", 12)
                c.drawString(100, y_start, "Strengths:")
                y_start -= 20
                c.setFont("Helvetica", 10)
            c.drawString(120, y_start, f"- {line}")
            y_start -= 20

    # Weaknesses
    c.setFont("Helvetica-Bold", 12)
    c.drawString(100, y_start - 20, "Weaknesses:")
    y_start -= 40
    c.setFont("Helvetica", 10)
    for weakness in weaknesses:
        wrapped_text = simpleSplit(weakness, 'Helvetica', 10, max_width)
        for line in wrapped_text:
            if y_start < 50:
                c.showPage()
                y_start = height - 50
                c.setFont("Helvetica-Bold", 12)
                c.drawString(100, y_start, "Weaknesses:")
                y_start -= 20
                c.setFont("Helvetica", 10)
            c.drawString(120, y_start, f"- {line}")
            y_start -= 20

    # Areas of Improvement
    c.setFont("Helvetica-Bold", 12)
    c.drawString(100, y_start - 20, "Areas of Improvement:")
    y_start -= 40
    c.setFont("Helvetica", 10)
    for improvement in areas_of_improvement:
        wrapped_text = simpleSplit(improvement, 'Helvetica', 10, max_width)
        for line in wrapped_text:
            if y_start < 50:
                c.showPage()
                y_start = height - 50
                c.setFont("Helvetica-Bold", 12)
                c.drawString(100, y_start, "Areas of Improvement:")
                y_start -= 20
                c.setFont("Helvetica", 10)
            c.drawString(120, y_start, f"- {line}")
            y_start -= 20

    return y_start

def generate_combined_report(backend_test_data, code_quality_data, commit_message_data, pdf_file="combined_report.pdf"):
    # Create PDF
    c = canvas.Canvas(pdf_file, pagesize=letter)
    width, height = letter

    y_start = height - 50

    # Backend Test Execution Report
    y_start = backend_test_execution_report(c, backend_test_data, y_start - 50)

    # Add a new page if necessary
    if y_start < 100:
        c.showPage()
        y_start = height - 50

    # Code Quality Report
    y_start = code_quality_report(c, code_quality_data, y_start - 50)

    # Add a new page if necessary
    if y_start < 100:
        c.showPage()
        y_start = height - 50

    # Commit Message Evaluation Report
    y_start = commit_message_evaluation_report(c, commit_message_data, y_start - 50)

    c.save()
    print(f"PDF generated: {pdf_file}")

# Sample JSON data for backend test execution report
backend_test_data = [
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
    }
]

# Sample JSON data for code quality report
code_quality_data = [
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
    }
]

# Sample JSON data for commit message evaluation report
commit_message_data = [
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
    }
]

# Generate combined PDF
generate_combined_report(backend_test_data, code_quality_data, commit_message_data)
