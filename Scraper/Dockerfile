FROM python:3.12-slim

WORKDIR /usr/src/app

COPY requirements.txt ./

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

COPY scrapyd.conf /etc/scrapyd/

EXPOSE 6800
CMD ["scrapyd"]