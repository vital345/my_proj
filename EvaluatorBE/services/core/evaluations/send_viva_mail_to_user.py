from services.core.mails import send_email
def send_viva_mail_to_user(email_id: str, track_name: str, evaluation_url: str):
    email_text = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            .email-container {{
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                margin: 0;
                padding: 20px;
            }}
            .btn {{
                display: inline-block;
                padding: 10px 15px;
                margin: 10px 0;
                background-color: #007BFF;
                color: #fff;
                text-decoration: none;
                border-radius: 5px;
            }}
        </style>
    </head>
    <body>
        <div class="email-container">
            <p>Dear Candidate,</p>
            <p>
                We are pleased to inform you that the assessment for the <strong>{track_name}</strong> track is now available.
                You may access the assessment by clicking on the link provided below.
            </p>
            <p>
                <a href="{evaluation_url}" class="btn">Access the Assessment</a>
            </p>
            <p>
               In case of any queries, please reach out to your Track Lead/Director.
            </p>
            <p>
                Please note that this is an automated message. Kindly do not reply directly to this email.
            </p>
            <p>Sincerely,<br>
               HU Evaluator Assistance Team
            </p>
        </div>
    </body>
    </html>
    """
    
    subject = f"Access Your Assessment for the {track_name} Track"
    
    send_email(email_id, subject, email_text)

    