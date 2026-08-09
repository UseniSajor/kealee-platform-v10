FROM curlimages/curl:8.11.1
WORKDIR /app
COPY services/marketing-cron-requalify-cold/run.sh /app/run.sh
RUN chmod +x /app/run.sh
CMD ["/bin/sh", "/app/run.sh"]
