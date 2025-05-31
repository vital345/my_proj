import json
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.utils import simpleSplit

def commit_message_evaluation_report(json_data, pdf_file="commit_message_evaluation_report.pdf"):
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
    c.drawString(100, height - 50, "Commit Message Evaluation Report")

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

# Generate PDF
commit_message_evaluation_report(commit_message_data)
