FROM python:3.12

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

RUN pip install --upgrade pip

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 8000 9000

# Run migrations and start the server directly
CMD bash -c "python manage.py migrate && python manage.py runserver 0.0.0.0:9000" 