import json
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

def backend_test_execution_report(json_data, pdf_file="backend_test_execution_report.pdf"):
    # Extract data from JSON
    data = json_data[0]
    step_report = data["step_report"]
    total_testcases = step_report["total_number_of_testcases"]
    total_passed = step_report["total_number_of_passes_testcases"]
    total_failed = step_report["total_number_of_failed_testcases"]
    testcases = step_report["list_of_testcases"]

    # Create PDF
    c = canvas.Canvas(pdf_file, pagesize=letter)
    width, height = letter

    # Title
    c.setFont("Helvetica-Bold", 16)
    c.drawString(100, height - 50, "Backend Test Execution Report")

    # Total test cases
    c.setFont("Helvetica", 12)
    c.drawString(100, height - 100, f"Total test cases: {total_testcases}")
    c.drawString(100, height - 120, f"Total passed test cases: {total_passed}")
    c.drawString(100, height - 140, f"Total failed test cases: {total_failed}")

    # List of test cases
    c.drawString(100, height - 180, "List of Test Cases:")
    c.setFont("Helvetica-Bold", 10)
    c.drawString(100, height - 200, "URL")
    c.drawString(300, height - 200, "Method")
    c.drawString(400, height - 200, "Status Code")
    c.drawString(500, height - 200, "Remark")

    y = height - 220
    c.setFont("Helvetica", 10)
    for testcase in testcases:
        c.drawString(100, y, testcase["request_url"])
        c.drawString(300, y, testcase["request_method"])
        c.drawString(400, y, str(testcase["response_status_code"]))
        c.drawString(500, y, testcase["remarks"])
        y -= 20

    c.save()
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
                    "request_body": None,
                    "response_body": "[{\"id\": 15, \"price\": 100, \"category_id\": 1, \"name\": \"Sample Product\", \"description\": \"This is a sample product.\", \"stock_quantity\": 50}]",
                    "response_status_code": 200,
                    "remarks": "success"
                }
            ]
        },
        "step_name": "backend_test_execution_report"
    }
]

# Generate PDF
backend_test_execution_report(json_data)
