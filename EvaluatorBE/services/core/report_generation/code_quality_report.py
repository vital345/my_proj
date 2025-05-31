import json
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.utils import simpleSplit

def code_quality_report(json_data, pdf_file="code_quality_report.pdf"):
    # Create PDF
    c = canvas.Canvas(pdf_file, pagesize=letter)
    width, height = letter

    step_report = json_data[0]["step_report"]
    overall_score = step_report["overall_score"]
    strengths = step_report["report"]["strengths"]
    weaknesses = step_report["report"]["weaknesses"]
    areas_of_improvement = step_report["report"]["areas_of_improvement"]

    # Title
    c.setFont("Helvetica-Bold", 16)
    c.drawString(100, height - 50, "Code Quality Report")

    # Overall Score
    c.setFont("Helvetica", 12)
    c.drawString(100, height - 100, f"Overall Score: {overall_score}")

    # Strengths
    c.setFont("Helvetica-Bold", 12)
    c.drawString(100, height - 140, "Strengths:")
    c.setFont("Helvetica", 10)
    y = height - 160
    max_width = width - 140  # Adjust the max width for text wrapping
    for strength in strengths:
        wrapped_text = simpleSplit(strength, 'Helvetica', 10, max_width)
        for line in wrapped_text:
            c.drawString(120, y, f"- {line}")
            y -= 20

    # Weaknesses
    c.setFont("Helvetica-Bold", 12)
    c.drawString(100, y - 20, "Weaknesses:")
    c.setFont("Helvetica", 10)
    y -= 40
    for weakness in weaknesses:
        wrapped_text = simpleSplit(weakness, 'Helvetica', 10, max_width)
        for line in wrapped_text:
            c.drawString(120, y, f"- {line}")
            y -= 20

    # Areas of Improvement
    c.setFont("Helvetica-Bold", 12)
    c.drawString(100, y - 20, "Areas of Improvement:")
    c.setFont("Helvetica", 10)
    y -= 40
    for improvement in areas_of_improvement:
        wrapped_text = simpleSplit(improvement, 'Helvetica', 10, max_width)
        for line in wrapped_text:
            c.drawString(120, y, f"- {line}")
            y -= 20

    c.save()
    print(f"PDF generated: {pdf_file}")

# Sample JSON data
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

# Generate PDF
code_quality_report(code_quality_data)
