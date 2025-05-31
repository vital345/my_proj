FROM python:3.10.11
WORKDIR /app
COPY requirements.txt /app 
RUN pip install --upgrade pip
RUN pip install -r requirements.txt
RUN playwright install --with-deps chromium --only-shell
COPY . /app 
EXPOSE 8080

CMD alembic upgrade head && uvicorn main:app --host 0.0.0.0 --port 8080

