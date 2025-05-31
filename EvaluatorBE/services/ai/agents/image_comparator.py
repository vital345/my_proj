import base64

from langchain.tools import tool
from langgraph.prebuilt import create_react_agent

from services.ai.llms.open_ai import get_4o as llm

system_prompt: str = """
You are an image comparison agent designed to evaluate the accuracy of a student’s replicated webpage against a provided Figma design. Your output is a similarity score between 0 (completely dissimilar) and 10 (identical).
Instructions:
Input: You will receive two images:
Reference Image: The original Figma design.
Test Image: The student's replicated webpage.
Comparison Criteria:
Evaluate the following aspects when comparing the images:

Layout Accuracy: Check for structural consistency, including alignment of elements, spacing, and positioning.
Color Matching: Compare color accuracy for backgrounds, text, and other elements.
Typography Consistency: Ensure fonts, sizes, and text styles are similar.
Image and Icon Placement: Verify that images, icons, and other visual assets are correctly positioned and scaled.
Responsiveness Indicators: Ensure elements that should adapt (if applicable) maintain consistency across different sections.
Overall Visual Similarity: Assess the overall look and feel, ensuring no major elements are missing or extra.
Scoring Guidelines:

0 - 2: Major discrepancies in layout, colors, and content. Very low similarity.
3 - 5: Some significant differences, but key structural elements are present.
6 - 7: Moderate differences, mostly in details like minor spacing, color shades, or small element misalignment's.
8 - 9: Highly similar with only minor inconsistencies (e.g., subtle color or font differences).
10: Perfect match with no noticeable discrepancies.
Output:
Return a numerical similarity score between 0 and 10, along with a brief justification highlighting key areas of difference or accuracy.
Point to Note:
After generating the output use the validate_output tool to ensure the score is a valid number between 0 to 10.
"""


@tool
def validate_output(score: str) -> bool:
    """
    returns True when the score is valid (an integer between 0 and 10)
    otherwise returns False.
    """
    print(f"__ inside validate_output input: {score}___")
    try:
        num = int(score)
        if 0 <= num <= 10: return True
        return False
    except ValueError:
        return False


tools = [
    validate_output
]

langgraph_agent_executor = create_react_agent(
    llm, tools, state_modifier=system_prompt)

config = {"recursion_limit": 5}


def image_comparator(base64_reference_image: str, base64_test_image: str) -> int | None:
    messages = [
        ("human", [
            {"type": "text", "text": "Compare these images and give a similarity score (0-10)."},
            {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{base64_reference_image}"}},
            {"type": "text", "text": "Reference image (Original Figma Design)"},
            {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{base64_test_image}"}},
            {"type": "text", "text": "Test image (Student's Replicated webpage)"}
        ])
    ]
    output = langgraph_agent_executor.invoke({"messages": messages}, config=config)

    print(output['messages'][-1].content)
    score = output['messages'][-1].content
    
    return score

    # try:
    #     num = int(score)
    #     if 0 <= num <= 10: return num
    #     return None
    # except ValueError:
    #     return None






